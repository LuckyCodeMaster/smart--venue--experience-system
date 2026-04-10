import { Request, Response } from 'express';
import { NavigationService } from '../services/navigationService';
import { success, created, error } from '../utils/apiResponse';
import logger from '../utils/logger';

export const navigationController = {
  async getRoute(req: Request, res: Response): Promise<void> {
    try {
      const { from_zone_id, to_zone_id, accessible } = req.query as {
        from_zone_id?: string;
        to_zone_id?: string;
        accessible?: string;
      };

      if (!from_zone_id || !to_zone_id) {
        error(res, 'from_zone_id and to_zone_id are required', 400);
        return;
      }

      const route = await NavigationService.getRoute(
        from_zone_id,
        to_zone_id,
        accessible === 'true'
      );

      if (!route) {
        error(res, 'No route found between the specified zones', 404);
        return;
      }

      success(res, route);
    } catch (err) {
      logger.error('GetRoute error:', err);
      error(res, 'Failed to calculate route', 500);
    }
  },

  async getVenueMap(req: Request, res: Response): Promise<void> {
    try {
      const venueId = req.params['venueId']!;
      const floorLevel = req.query['floor_level']
        ? parseInt(req.query['floor_level'] as string, 10)
        : undefined;

      const map = await NavigationService.getVenueMap(venueId, floorLevel);
      if (!map) {
        error(res, 'Venue not found', 404);
        return;
      }
      success(res, map);
    } catch (err) {
      logger.error('GetVenueMap error:', err);
      error(res, 'Failed to get venue map', 500);
    }
  },

  async getNearbyAmenities(req: Request, res: Response): Promise<void> {
    try {
      const { zone_id, amenity_type, radius } = req.query as {
        zone_id?: string;
        amenity_type?: string;
        radius?: string;
      };

      if (!zone_id) {
        error(res, 'zone_id is required', 400);
        return;
      }

      const amenities = await NavigationService.getNearbyAmenities(
        zone_id,
        amenity_type,
        radius ? parseFloat(radius) : 500
      );

      success(res, amenities);
    } catch (err) {
      logger.error('GetNearbyAmenities error:', err);
      error(res, 'Failed to fetch amenities', 500);
    }
  },

  async reportCongestion(req: Request, res: Response): Promise<void> {
    try {
      const { zone_id, level, notes } = req.body as {
        zone_id: string;
        level: 'low' | 'medium' | 'high' | 'critical';
        notes?: string;
      };

      await NavigationService.reportCongestion(zone_id, level, notes);
      created(res, { zone_id, level, reported_at: new Date() }, 'Congestion reported');
    } catch (err) {
      logger.error('ReportCongestion error:', err);
      error(res, 'Failed to report congestion', 500);
    }
  },

  async getZones(req: Request, res: Response): Promise<void> {
    try {
      const venueId = req.params['venueId']!;
      const zones = await NavigationService.getZones(venueId);
      success(res, zones);
    } catch (err) {
      logger.error('GetZones error:', err);
      error(res, 'Failed to get zones', 500);
    }
  },
};
