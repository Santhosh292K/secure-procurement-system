/**
 * Quotation Routes
 */

import { Router } from 'express';
import { QuotationController } from '../controllers/quotation.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize('vendor'), QuotationController.create);
router.get('/', QuotationController.getAll);
router.get('/:id', QuotationController.getById);
router.post('/:id/submit', authorize('vendor'), QuotationController.submit);
router.post('/:id/verify-signature', QuotationController.verifySignature);

export default router;
