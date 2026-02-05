/**
 * Approval Routes
 */

import { Router } from 'express';
import { ApprovalController } from '../controllers/approval.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/all', authorize('admin'), ApprovalController.getAll);
router.get('/mine', authorize('approver'), ApprovalController.getMine);
router.get('/pending', authorize('approver'), ApprovalController.getPending);
router.get('/:id', authorize('approver', 'admin'), ApprovalController.getById);
router.post('/:id/approve', authorize('approver'), ApprovalController.approve);
router.post('/:id/reject', authorize('approver'), ApprovalController.reject);
router.get('/history/:quotationId', ApprovalController.getHistory);

export default router;
