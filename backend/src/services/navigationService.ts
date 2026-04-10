import db from '../config/database';
import { NavigationZone, NavigationRoute } from '../types';
import { CacheService } from './cacheService';
import { WebSocketService } from './websocketService';
import logger from '../utils/logger';

const ZONES_TABLE = 'navigation_zones';
const ROUTES_TABLE = 'navigation_routes';

export const NavigationService = {
  async getZones(venueId: string, floorLevel?: number): Promise<NavigationZone[]> {
    const cacheKey = `zones:${venueId}:${floorLevel ?? 'all'}`;
    const cached = await CacheService.get<NavigationZone[]>(cacheKey);
    if (cached) return cached;

    const query = db<NavigationZone>(ZONES_TABLE)
      .where({ venue_id: venueId })
      .orderBy('name', 'asc');

    if (floorLevel !== undefined) {
      query.where({ floor_level: floorLevel });
    }

    const zones = await query;
    await CacheService.set(cacheKey, zones, 300);
    return zones;
  },

  async getVenueMap(
    venueId: string,
    floorLevel?: number
  ): Promise<{
    zones: NavigationZone[];
    routes: NavigationRoute[];
    congestionData: Record<string, string>;
  } | null> {
    const zones = await NavigationService.getZones(venueId, floorLevel);
    if (zones.length === 0) {
      const anyZone = await db<NavigationZone>(ZONES_TABLE).where({ venue_id: venueId }).first();
      if (!anyZone) return null;
    }

    const zoneIds = zones.map((z) => z.id);
    const routes = zoneIds.length > 0
      ? await db<NavigationRoute>(ROUTES_TABLE)
          .whereIn('from_zone_id', zoneIds)
          .orWhereIn('to_zone_id', zoneIds)
      : [];

    const congestionData: Record<string, string> = {};
    for (const zone of zones) {
      const cached = await CacheService.get<string>(`congestion:${zone.id}`);
      if (cached) congestionData[zone.id] = cached;
    }

    return { zones, routes, congestionData };
  },

  async getRoute(
    fromZoneId: string,
    toZoneId: string,
    accessibleOnly = false
  ): Promise<NavigationRoute | null> {
    const cacheKey = `route:${fromZoneId}:${toZoneId}:${accessibleOnly}`;
    const cached = await CacheService.get<NavigationRoute>(cacheKey);
    if (cached) return cached;

    const query = db<NavigationRoute>(ROUTES_TABLE).where({
      from_zone_id: fromZoneId,
      to_zone_id: toZoneId,
    });

    if (accessibleOnly) {
      query.where({ accessibility_friendly: true });
    }

    const route = await query.orderBy('distance_meters', 'asc').first();
    if (route) await CacheService.set(cacheKey, route, 600);
    return route ?? null;
  },

  async getNearbyAmenities(
    zoneId: string,
    amenityType?: string,
    radiusMeters = 500
  ): Promise<NavigationZone[]> {
    const zone = await db<NavigationZone>(ZONES_TABLE).where({ id: zoneId }).first();
    if (!zone) return [];

    const reachableRoutes = await db<NavigationRoute>(ROUTES_TABLE)
      .where({ from_zone_id: zoneId })
      .where('distance_meters', '<=', radiusMeters)
      .select('to_zone_id');

    const reachableIds = reachableRoutes.map((r) => r.to_zone_id);
    if (reachableIds.length === 0) return [];

    const query = db<NavigationZone>(ZONES_TABLE)
      .whereIn('id', reachableIds)
      .whereNotNull('amenity_type');

    if (amenityType) {
      query.where({ amenity_type: amenityType });
    }

    return query.orderBy('name', 'asc');
  },

  async reportCongestion(
    zoneId: string,
    level: 'low' | 'medium' | 'high' | 'critical',
    notes?: string
  ): Promise<void> {
    await CacheService.set(`congestion:${zoneId}`, level, 10 * 60);

    const zone = await db<NavigationZone>(ZONES_TABLE).where({ id: zoneId }).first();
    if (zone) {
      WebSocketService.broadcastToVenue(zone.venue_id, {
        type: 'navigation:congestion:reported',
        payload: { zoneId, level, notes, venueId: zone.venue_id },
        timestamp: new Date().toISOString(),
        venueId: zone.venue_id,
      });
    }

    await db('analytics_events').insert({
      id: require('uuid').v4(),
      venue_id: zone?.venue_id ?? null,
      event_type: 'congestion_reported',
      event_data: { zone_id: zoneId, level, notes },
      created_at: new Date(),
    }).catch((err: unknown) => {
      logger.warn('Analytics event insert failed (best-effort):', err);
    });
  },
};
