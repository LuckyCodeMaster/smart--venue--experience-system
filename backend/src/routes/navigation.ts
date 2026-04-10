import { Router } from 'express';
import { navigationController } from '../controllers/navigationController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { reportCongestionSchema } from '../utils/validation';

const router = Router();

router.get('/route', authenticate, navigationController.getRoute);
router.get('/venues/:venueId/map', navigationController.getVenueMap);
router.get('/venues/:venueId/zones', navigationController.getZones);
router.get('/amenities', authenticate, navigationController.getNearbyAmenities);

router.post(
  '/congestion',
  authenticate,
  validateBody(reportCongestionSchema),
  navigationController.reportCongestion
);

export default router;
