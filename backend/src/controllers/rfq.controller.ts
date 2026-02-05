/**
 * RFQ (Request for Quotation) Controller
 */

import { Request, Response } from 'express';
import { Database } from '../database/database';
import { v4 as uuidv4 } from 'uuid';

export class RFQController {
    /**
     * Create new RFQ
     */
    static async create(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || req.user.role !== 'admin') {
                res.status(403).json({ error: 'Only admins can create RFQs' });
                return;
            }

            const { title, description, requirements, deadline } = req.body;

            if (!title || !description || !deadline) {
                res.status(400).json({ error: 'Title, description, and deadline required' });
                return;
            }

            // Generate unique RFQ number
            const rfqNumber = `RFQ-${Date.now()}-${uuidv4().split('-')[0]}`;

            // Insert RFQ
            const result = await Database.run(
                `INSERT INTO rfqs (rfq_number, title, description, requirements, created_by, deadline, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    rfqNumber,
                    title,
                    description,
                    JSON.stringify(requirements || []),
                    req.user.userId,
                    deadline,
                    'draft'
                ]
            );

            res.status(201).json({
                message: 'RFQ created successfully',
                rfq: {
                    id: result.lastID,
                    rfqNumber,
                    title,
                    description,
                    requirements,
                    deadline,
                    status: 'draft'
                }
            });
        } catch (error) {
            console.error('Create RFQ error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get all RFQs with filtering
     */
    static async getAll(req: Request, res: Response): Promise<void> {
        try {
            const { status, page = 1, limit = 10 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            let sql = 'SELECT r.*, u.full_name as creator_name FROM rfqs r LEFT JOIN users u ON r.created_by = u.id';
            const params: any[] = [];

            if (status) {
                sql += ' WHERE r.status = ?';
                params.push(status);
            }

            sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
            params.push(Number(limit), offset);

            const rfqs = await Database.all(sql, params);

            // Get total count
            let countSql = 'SELECT COUNT(*) as total FROM rfqs';
            if (status) {
                countSql += ' WHERE status = ?';
            }
            const countResult = await Database.get<any>(countSql, status ? [status] : []);

            res.json({
                rfqs: rfqs.map((rfq: any) => ({
                    ...rfq,
                    requirements: JSON.parse(rfq.requirements || '[]')
                })),
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: countResult?.total || 0
                }
            });
        } catch (error) {
            console.error('Get RFQs error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get RFQ by ID
     */
    static async getById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const rfq = await Database.get<any>(
                `SELECT r.*, u.full_name as creator_name, u.email as creator_email 
         FROM rfqs r 
         LEFT JOIN users u ON r.created_by = u.id 
         WHERE r.id = ?`,
                [id]
            );

            if (!rfq) {
                res.status(404).json({ error: 'RFQ not found' });
                return;
            }

            // Get quotations for this RFQ
            const quotations = await Database.all(
                `SELECT q.*, u.company_name as vendor_name 
         FROM quotations q 
         LEFT JOIN users u ON q.vendor_id = u.id 
         WHERE q.rfq_id = ?`,
                [id]
            );

            res.json({
                rfq: {
                    ...rfq,
                    requirements: JSON.parse(rfq.requirements || '[]'),
                    quotations
                }
            });
        } catch (error) {
            console.error('Get RFQ error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Update RFQ
     */
    static async update(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || req.user.role !== 'admin') {
                res.status(403).json({ error: 'Only admins can update RFQs' });
                return;
            }

            const { id } = req.params;
            const { title, description, requirements, deadline, status } = req.body;

            const rfq = await Database.get('SELECT * FROM rfqs WHERE id = ?', [id]);

            if (!rfq) {
                res.status(404).json({ error: 'RFQ not found' });
                return;
            }

            await Database.run(
                `UPDATE rfqs SET 
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          requirements = COALESCE(?, requirements),
          deadline = COALESCE(?, deadline),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
                [title, description, requirements ? JSON.stringify(requirements) : null, deadline, status, id]
            );

            res.json({ message: 'RFQ updated successfully' });
        } catch (error) {
            console.error('Update RFQ error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Delete RFQ
     */
    static async delete(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || req.user.role !== 'admin') {
                res.status(403).json({ error: 'Only admins can delete RFQs' });
                return;
            }

            const { id } = req.params;

            const rfq = await Database.get('SELECT * FROM rfqs WHERE id = ?', [id]);

            if (!rfq) {
                res.status(404).json({ error: 'RFQ not found' });
                return;
            }

            // Get all quotations for this RFQ
            const quotations = await Database.all<any>('SELECT id FROM quotations WHERE rfq_id = ?', [id]);

            // Delete related records in correct order
            for (const quotation of quotations) {
                // Delete approvals for each quotation
                await Database.run('DELETE FROM approvals WHERE quotation_id = ?', [quotation.id]);

                // Delete quotation comments
                await Database.run('DELETE FROM quotation_comments WHERE quotation_id = ?', [quotation.id]);

                // Delete quotation revisions
                await Database.run('DELETE FROM quotation_revisions WHERE quotation_id = ?', [quotation.id]);
            }

            // Delete all quotations for this RFQ
            await Database.run('DELETE FROM quotations WHERE rfq_id = ?', [id]);

            // Finally delete the RFQ
            await Database.run('DELETE FROM rfqs WHERE id = ?', [id]);

            res.json({ message: 'RFQ and all related data deleted successfully' });
        } catch (error) {
            console.error('Delete RFQ error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Publish RFQ
     */
    static async publish(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || req.user.role !== 'admin') {
                res.status(403).json({ error: 'Only admins can publish RFQs' });
                return;
            }

            const { id } = req.params;

            const rfq = await Database.get('SELECT * FROM rfqs WHERE id = ?', [id]);

            if (!rfq) {
                res.status(404).json({ error: 'RFQ not found' });
                return;
            }

            await Database.run(
                `UPDATE rfqs SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [id]
            );

            res.json({ message: 'RFQ published successfully' });
        } catch (error) {
            console.error('Publish RFQ error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
