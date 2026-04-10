import { Router } from 'express';
import { sensorController } from '../controllers/sensorController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { sensorIngestSchema, createSensorSchema } from '../utils/validation';
import { sensorLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/:sensorId/readings',
  sensorLimiter,
  validateBody(sensorIngestSchema),
  sensorController.ingestData
);

router.get('/', authenticate, authorize('admin', 'staff'), sensorController.getSensors);
router.get('/:id', authenticate, authorize('admin', 'staff'), sensorController.getSensorStatus);
router.get('/:id/history', authenticate, authorize('admin', 'staff'), sensorController.getSensorHistory);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validateBody(createSensorSchema),
  sensorController.createSensor
);

router.delete('/:id', authenticate, authorize('admin'), sensorController.deleteSensor);

export default router;
