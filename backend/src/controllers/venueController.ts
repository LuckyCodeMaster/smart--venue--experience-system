import { Request, Response } from 'express';
import { VenueModel } from '../models/Venue';
import { success, created, noContent, error, paginated, getPaginationParams } from '../utils/apiResponse';
import logger from '../utils/logger';

export const venueController = {
  async getVenues(req: Request, res: Response): Promise<void> {
    try {
      const params = getPaginationParams(req.query as Record<string, unknown>);
      const { data, total } = await VenueModel.paginate(params.page, params.limit);
      paginated(res, data, total, params);
    } catch (err) {
      logger.error('GetVenues error:', err);
      error(res, 'Failed to fetch venues', 500);
    }
  },

  async getVenue(req: Request, res: Response): Promise<void> {
    try {
      const venue = await VenueModel.findById(req.params['id']!);
      if (!venue) {
        error(res, 'Venue not found', 404);
        return;
      }
      success(res, venue);
    } catch (err) {
      logger.error('GetVenue error:', err);
      error(res, 'Failed to fetch venue', 500);
    }
  },

  async createVenue(req: Request, res: Response): Promise<void> {
    try {
      const venue = await VenueModel.create(req.body as Parameters<typeof VenueModel.create>[0]);
      created(res, venue, 'Venue created successfully');
    } catch (err) {
      logger.error('CreateVenue error:', err);
      error(res, 'Failed to create venue', 500);
    }
  },

  async updateVenue(req: Request, res: Response): Promise<void> {
    try {
      const venue = await VenueModel.update(req.params['id']!, req.body as Partial<Parameters<typeof VenueModel.create>[0]>);
      if (!venue) {
        error(res, 'Venue not found', 404);
        return;
      }
      success(res, venue, 'Venue updated successfully');
    } catch (err) {
      logger.error('UpdateVenue error:', err);
      error(res, 'Failed to update venue', 500);
    }
  },

  async deleteVenue(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await VenueModel.deactivate(req.params['id']!);
      if (!deleted) {
        error(res, 'Venue not found', 404);
        return;
      }
      noContent(res);
    } catch (err) {
      logger.error('DeleteVenue error:', err);
      error(res, 'Failed to delete venue', 500);
    }
  },

  async searchVenues(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.query as { name?: string };
      if (!name) {
        error(res, 'Search query required', 400);
        return;
      }
      const venues = await VenueModel.findByName(name);
      success(res, venues);
    } catch (err) {
      logger.error('SearchVenues error:', err);
      error(res, 'Failed to search venues', 500);
    }
  },

  async getNearbyVenues(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng, radius = '5' } = req.query as { lat?: string; lng?: string; radius?: string };
      if (!lat || !lng) {
        error(res, 'lat and lng are required', 400);
        return;
      }
      const venues = await VenueModel.findNearby(parseFloat(lat), parseFloat(lng), parseFloat(radius));
      success(res, venues);
    } catch (err) {
      logger.error('GetNearbyVenues error:', err);
      error(res, 'Failed to fetch nearby venues', 500);
    }
  },
};
