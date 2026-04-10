import { Router } from 'express';
import authRoutes from './auth';
import venueRoutes from './venues';
import queueRoutes from './queues';
import navigationRoutes from './navigation';
import sensorRoutes from './sensors';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/venues', venueRoutes);
router.use('/queues', queueRoutes);
router.use('/navigation', navigationRoutes);
router.use('/sensors', sensorRoutes);

export default router;
