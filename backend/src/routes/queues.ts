import { Router } from 'express';
import { queueController } from '../controllers/queueController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createQueueSchema,
  updateQueueSchema,
  joinQueueSchema,
} from '../utils/validation';

const router = Router();

router.get('/', queueController.getQueues);
router.get('/:id', queueController.getQueue);
router.get('/:id/status', queueController.getQueueStatus);

router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  validateBody(createQueueSchema),
  queueController.createQueue
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  validateBody(updateQueueSchema),
  queueController.updateQueue
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  queueController.deleteQueue
);

router.post(
  '/:id/join',
  authenticate,
  validateBody(joinQueueSchema),
  queueController.joinQueue
);

router.post('/:id/leave', authenticate, queueController.leaveQueue);

router.post(
  '/:id/call-next',
  authenticate,
  authorize('admin', 'staff'),
  queueController.callNextEntry
);

export default router;
