import { Router } from 'express';
import { venueController } from '../controllers/venueController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createVenueSchema, updateVenueSchema } from '../utils/validation';

const router = Router();

router.get('/', venueController.getVenues);
router.get('/search', venueController.searchVenues);
router.get('/nearby', venueController.getNearbyVenues);
router.get('/:id', venueController.getVenue);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validateBody(createVenueSchema),
  venueController.createVenue
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validateBody(updateVenueSchema),
  venueController.updateVenue
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  venueController.deleteVenue
);

export default router;
