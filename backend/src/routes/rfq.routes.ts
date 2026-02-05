/**
 * RFQ Routes
 */

import { Router } from 'express';
import { RFQController } from '../controllers/rfq.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', authorize('admin'), RFQController.create);
router.get('/', RFQController.getAll);
router.get('/:id', RFQController.getById);
router.put('/:id', authorize('admin'), RFQController.update);
router.delete('/:id', authorize('admin'), RFQController.delete);
router.post('/:id/publish', authorize('admin'), RFQController.publish);

export default router;
