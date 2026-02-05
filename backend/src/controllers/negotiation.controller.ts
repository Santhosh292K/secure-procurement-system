/**
 * Quotation Negotiation Controller
 * Handles revisions, comments, and version tracking
 */

import { Request, Response } from 'express';
import { Database } from '../database/database';

/**
 * Create a new revision of a quotation
 */
export const createRevision = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { line_items, delivery_time, validity_period, notes, change_reason } = req.body;
        const userId = req.user!.userId;

        // Get current quotation
        const quotation = await Database.get(
            'SELECT * FROM quotations WHERE id = ?',
            [id]
        );

        if (!quotation) {
            res.status(404).json({ error: 'Quotation not found' });
            return;
        }

        // Check if user is the vendor who created the quotation
        if (quotation.vendor_id !== userId && req.user!.role !== 'admin') {
            res.status(403).json({ error: 'Not authorized to revise this quotation' });
            return;
        }

        // Get latest version number
        const latestRevision = await Database.get<{ version: number }>(
            'SELECT MAX(version) as version FROM quotation_revisions WHERE quotation_id = ?',
            [id]
        );

        const newVersion = (latestRevision?.version || 0) + 1;

        // Calculate total amount
        const totalAmount = line_items.reduce((sum: number, item: any) => {
            return sum + (item.quantity * item.unit_price);
        }, 0);

        // Create revision record
        await Database.run(
            `INSERT INTO quotation_revisions 
            (quotation_id, version, total_amount, currency, line_items, delivery_time, validity_period, notes, changed_by, change_reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                newVersion,
                totalAmount,
                quotation.currency,
                JSON.stringify(line_items),
                delivery_time,
                validity_period,
                notes,
                userId,
                change_reason
            ]
        );

        // Update main quotation with new values
        await Database.run(
            `UPDATE quotations 
            SET line_items = ?, total_amount = ?, status = 'negotiating', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [JSON.stringify(line_items), totalAmount, id]
        );

        res.json({
            message: 'Revision created successfully',
            version: newVersion,
            total_amount: totalAmount
        });
    } catch (error) {
        console.error('Error creating revision:', error);
        res.status(500).json({ error: 'Failed to create revision' });
    }
};

/**
 * Get all revisions for a quotation
 */
export const getRevisions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const revisions = await Database.all(
            `SELECT qr.*, u.full_name as changed_by_name
            FROM quotation_revisions qr
            LEFT JOIN users u ON qr.changed_by = u.id
            WHERE qr.quotation_id = ?
            ORDER BY qr.version DESC`,
            [id]
        );

        // Parse line_items JSON
        const parsedRevisions = revisions.map((rev: any) => ({
            ...rev,
            line_items: JSON.parse(rev.line_items)
        }));

        res.json({ revisions: parsedRevisions });
    } catch (error) {
        console.error('Error fetching revisions:', error);
        res.status(500).json({ error: 'Failed to fetch revisions' });
    }
};

/**
 * Add a comment to a quotation
 */
export const addComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { comment, comment_type, is_internal, parent_comment_id } = req.body;
        const userId = req.user!.userId;

        if (!comment || comment.trim() === '') {
            res.status(400).json({ error: 'Comment cannot be empty' });
            return;
        }

        const result = await Database.run(
            `INSERT INTO quotation_comments 
            (quotation_id, user_id, comment, comment_type, is_internal, parent_comment_id)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [id, userId, comment, comment_type || 'general', is_internal || 0, parent_comment_id || null]
        );

        // If this is a revision request, update quotation status
        if (comment_type === 'revision_request') {
            await Database.run(
                `UPDATE quotations SET status = 'revision_requested', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [id]
            );
        }

        // Get the created comment with user info
        const createdComment = await Database.get(
            `SELECT qc.*, u.full_name as user_name, u.role as user_role
            FROM quotation_comments qc
            LEFT JOIN users u ON qc.user_id = u.id
            WHERE qc.id = ?`,
            [result.lastID]
        );

        res.json({
            message: 'Comment added successfully',
            comment: createdComment
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

/**
 * Get all comments for a quotation
 */
export const getComments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const userRole = req.user!.role;

        // Vendors can only see non-internal comments unless it's their quotation
        const quotation = await Database.get(
            'SELECT vendor_id FROM quotations WHERE id = ?',
            [id]
        );

        let query = `
            SELECT qc.*, u.full_name as user_name, u.role as user_role
            FROM quotation_comments qc
            LEFT JOIN users u ON qc.user_id = u.id
            WHERE qc.quotation_id = ?
        `;

        // Filter internal comments for non-admin/non-owner
        if (userRole === 'vendor' && quotation?.vendor_id !== userId) {
            query += ` AND qc.is_internal = 0`;
        }

        query += ` ORDER BY qc.created_at ASC`;

        const comments = await Database.all(query, [id]);

        res.json({ comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

/**
 * Request revision from approver/admin
 */
export const requestRevision = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { comment, suggested_changes } = req.body;
        const userId = req.user!.userId;

        if (!comment) {
            res.status(400).json({ error: 'Please provide reason for revision request' });
            return;
        }

        // Update quotation status
        await Database.run(
            `UPDATE quotations SET status = 'revision_requested', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [id]
        );

        // Add comment
        await Database.run(
            `INSERT INTO quotation_comments 
            (quotation_id, user_id, comment, comment_type)
            VALUES (?, ?, ?, 'revision_request')`,
            [id, userId, `${comment}\n\nSuggested changes: ${suggested_changes || 'N/A'}`]
        );

        res.json({ message: 'Revision requested successfully' });
    } catch (error) {
        console.error('Error requesting revision:', error);
        res.status(500).json({ error: 'Failed to request revision' });
    }
};

/**
 * Compare two versions of a quotation
 */
export const compareVersions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { version1, version2 } = req.query;

        if (!version1 || !version2) {
            res.status(400).json({ error: 'Please provide both version numbers' });
            return;
        }

        const revisions = await Database.all(
            `SELECT * FROM quotation_revisions 
            WHERE quotation_id = ? AND version IN (?, ?)
            ORDER BY version`,
            [id, version1, version2]
        );

        if (revisions.length !== 2) {
            res.status(404).json({ error: 'One or both versions not found' });
            return;
        }

        const comparison = {
            version1: {
                ...revisions[0],
                line_items: JSON.parse(revisions[0].line_items)
            },
            version2: {
                ...revisions[1],
                line_items: JSON.parse(revisions[1].line_items)
            },
            differences: {
                amount_change: revisions[1].total_amount - revisions[0].total_amount,
                percentage_change: ((revisions[1].total_amount - revisions[0].total_amount) / revisions[0].total_amount * 100).toFixed(2)
            }
        };

        res.json({ comparison });
    } catch (error) {
        console.error('Error comparing versions:', error);
        res.status(500).json({ error: 'Failed to compare versions' });
    }
};
