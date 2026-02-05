/**
 * Quotation Negotiation Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    createRevision,
    getRevisions,
    addComment,
    getComments,
    requestRevision,
    compareVersions
} from '../controllers/negotiation.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Revision routes
router.post('/quotations/:id/revisions', createRevision);
router.get('/quotations/:id/revisions', getRevisions);
router.get('/quotations/:id/revisions/compare', compareVersions);

// Comment routes
router.post('/quotations/:id/comments', addComment);
router.get('/quotations/:id/comments', getComments);

// Revision request (from approver/admin to vendor)
router.post('/quotations/:id/request-revision', requestRevision);

export default router;
