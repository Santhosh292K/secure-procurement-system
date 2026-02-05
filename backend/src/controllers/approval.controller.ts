/**
 * Approval Controller
 */

import { Request, Response } from 'express';
import { Database } from '../database/database';
import { HashUtil } from '../utils/security/hash.util';

export class ApprovalController {
    /**
     * Get pending approvals for current user
     */
    static async getPending(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || req.user.role !== 'approver') {
                res.status(403).json({ error: 'Only approvers can view pending approvals' });
                return;
            }

            const approvals = await Database.all<any>(
                `SELECT a.*, q.quote_number, q.total_amount, q.currency,
                u.company_name as vendor_name, r.rfq_number, r.title as rfq_title
         FROM approvals a
         LEFT JOIN quotations q ON a.quotation_id = q.id
         LEFT JOIN users u ON q.vendor_id = u.id
         LEFT JOIN rfqs r ON q.rfq_id = r.id
         WHERE a.approver_id = ? AND a.status = 'pending'
         ORDER BY a.created_at ASC`,
                [req.user.userId]
            );

            res.json({ approvals });
        } catch (error) {
            console.error('Get pending approvals error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get all approvals for current user
     */
    static async getMine(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || req.user.role !== 'approver') {
                res.status(403).json({ error: 'Only approvers can view their approvals' });
                return;
            }

            const { status } = req.query;
            const params: any[] = [req.user.userId];
            let sql = `
                SELECT a.*, q.quote_number, q.total_amount, q.currency,
                u.company_name as vendor_name, r.rfq_number, r.title as rfq_title
                FROM approvals a
                LEFT JOIN quotations q ON a.quotation_id = q.id
                LEFT JOIN users u ON q.vendor_id = u.id
                LEFT JOIN rfqs r ON q.rfq_id = r.id
                WHERE a.approver_id = ?
            `;

            if (status && status !== 'all') {
                sql += ' AND a.status = ?';
                params.push(status);
            }

            sql += ' ORDER BY a.created_at DESC';

            const approvals = await Database.all<any>(sql, params);

            res.json({ approvals });
        } catch (error) {
            console.error('Get my approvals error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get approval by ID
     */
    static async getById(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || (req.user.role !== 'approver' && req.user.role !== 'admin')) {
                res.status(403).json({ error: 'Only approvers and admins can view approvals' });
                return;
            }

            const { id } = req.params;

            const approval = await Database.get<any>(
                `SELECT a.*, q.quote_number, q.total_amount, q.currency,
                u.company_name as vendor_name, r.rfq_number, r.title as rfq_title,
                approver.full_name as approver_name
         FROM approvals a
         LEFT JOIN quotations q ON a.quotation_id = q.id
         LEFT JOIN users u ON q.vendor_id = u.id
         LEFT JOIN rfqs r ON q.rfq_id = r.id
         LEFT JOIN users approver ON a.approver_id = approver.id
         WHERE a.id = ?`,
                [id]
            );

            if (!approval) {
                res.status(404).json({ error: 'Approval not found' });
                return;
            }

            // Authorization - approver can only see their own approvals, admin can see all
            if (req.user.role === 'approver' && approval.approver_id !== req.user.userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }

            res.json({ approval });
        } catch (error) {
            console.error('Get approval error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get all approvals (admin only)
     */
    static async getAll(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || req.user.role !== 'admin') {
                res.status(403).json({ error: 'Only admins can view all approvals' });
                return;
            }

            const { status, page = 1, limit = 50 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            let sql = `
                SELECT a.*, q.quote_number, q.total_amount, q.currency,
                u.company_name as vendor_name, r.rfq_number, r.title as rfq_title,
                approver.full_name as approver_name, approver.email as approver_email
                FROM approvals a
                LEFT JOIN quotations q ON a.quotation_id = q.id
                LEFT JOIN users u ON q.vendor_id = u.id
                LEFT JOIN rfqs r ON q.rfq_id = r.id
                LEFT JOIN users approver ON a.approver_id = approver.id
                WHERE 1=1
            `;
            const params: any[] = [];

            if (status) {
                sql += ' AND a.status = ?';
                params.push(status);
            }

            sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
            params.push(Number(limit), offset);

            const approvals = await Database.all<any>(sql, params);

            res.json({ approvals });
        } catch (error) {
            console.error('Get all approvals error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Approve quotation
     */
    static async approve(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || req.user.role !== 'approver') {
                res.status(403).json({ error: 'Only approvers can approve quotations' });
                return;
            }

            const { id } = req.params;
            const { comments } = req.body;

            const approval = await Database.get<any>(
                'SELECT * FROM approvals WHERE id = ? AND approver_id = ?',
                [id, req.user.userId]
            );

            if (!approval) {
                res.status(404).json({ error: 'Approval not found' });
                return;
            }

            if (approval.status !== 'pending') {
                res.status(400).json({ error: 'Approval already processed' });
                return;
            }

            // Create signature hash
            const signatureData = `${approval.quotation_id}-${req.user.userId}-approved-${Date.now()}`;
            const signatureHash = HashUtil.sha256(signatureData);

            await Database.run(
                `UPDATE approvals 
         SET status = 'approved', comments = ?, approved_at = CURRENT_TIMESTAMP, signature_hash = ?
         WHERE id = ?`,
                [comments || null, signatureHash, id]
            );

            // Check if all approvals are complete
            const allApprovals = await Database.all<any>(
                'SELECT * FROM approvals WHERE quotation_id = ?',
                [approval.quotation_id]
            );

            const allApproved = allApprovals.every((a: any) => a.status === 'approved');

            if (allApproved) {
                await Database.run(
                    `UPDATE quotations SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [approval.quotation_id]
                );
            } else {
                await Database.run(
                    `UPDATE quotations SET status = 'under_review', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [approval.quotation_id]
                );
            }

            res.json({
                message: 'Quotation approved successfully',
                signatureHash,
                allApproved
            });
        } catch (error) {
            console.error('Approve quotation error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Reject quotation
     */
    static async reject(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || req.user.role !== 'approver') {
                res.status(403).json({ error: 'Only approvers can reject quotations' });
                return;
            }

            const { id } = req.params;
            const { comments } = req.body;

            if (!comments) {
                res.status(400).json({ error: 'Rejection reason required' });
                return;
            }

            const approval = await Database.get<any>(
                'SELECT * FROM approvals WHERE id = ? AND approver_id = ?',
                [id, req.user.userId]
            );

            if (!approval) {
                res.status(404).json({ error: 'Approval not found' });
                return;
            }

            if (approval.status !== 'pending') {
                res.status(400).json({ error: 'Approval already processed' });
                return;
            }

            // Create signature hash
            const signatureData = `${approval.quotation_id}-${req.user.userId}-rejected-${Date.now()}`;
            const signatureHash = HashUtil.sha256(signatureData);

            await Database.run(
                `UPDATE approvals 
         SET status = 'rejected', comments = ?, approved_at = CURRENT_TIMESTAMP, signature_hash = ?
         WHERE id = ?`,
                [comments, signatureHash, id]
            );

            await Database.run(
                `UPDATE quotations SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [approval.quotation_id]
            );

            res.json({
                message: 'Quotation rejected',
                signatureHash
            });
        } catch (error) {
            console.error('Reject quotation error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get approval history for quotation
     */
    static async getHistory(req: Request, res: Response): Promise<void> {
        try {
            const { quotationId } = req.params;

            const history = await Database.all<any>(
                `SELECT a.*, u.full_name as approver_name, u.email as approver_email
         FROM approvals a
         LEFT JOIN users u ON a.approver_id = u.id
         WHERE a.quotation_id = ?
         ORDER BY a.level ASC, a.created_at ASC`,
                [quotationId]
            );

            res.json({ history });
        } catch (error) {
            console.error('Get approval history error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
