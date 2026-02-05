/**
 * Quotation Controller with Encryption and Signatures
 */

import { Request, Response } from 'express';
import { Database } from '../database/database';
import { v4 as uuidv4 } from 'uuid';
import { Base64Util } from '../utils/security/base64.util';
import { XORUtil } from '../utils/security/xor.util';
import { SignatureUtil } from '../utils/security/signature.util';
import { HashUtil } from '../utils/security/hash.util';

export class QuotationController {
    /**
     * Create quotation
     */
    static async create(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || req.user.role !== 'vendor') {
                res.status(403).json({ error: 'Only vendors can create quotations' });
                return;
            }

            const { rfqId, lineItems, totalAmount, currency, termsConditions } = req.body;

            if (!rfqId || !lineItems || !totalAmount) {
                res.status(400).json({ error: 'RFQ ID, line items, and total amount required' });
                return;
            }

            // Verify RFQ exists and is published
            const rfq = await Database.get<any>('SELECT * FROM rfqs WHERE id = ? AND status = ?', [
                rfqId,
                'published'
            ]);

            if (!rfq) {
                res.status(404).json({ error: 'RFQ not found or not published' });
                return;
            }

            // Generate quote number
            const quoteNumber = `QT-${Date.now()}-${uuidv4().split('-')[0]}`;

            // Encode line items with Base64
            const encodedLineItems = Base64Util.encodeJSON(lineItems);

            // Encrypt sensitive data with XOR
            const encryptionKey = XORUtil.generateKey();
            const sensitiveData = {
                costBreakdown: lineItems,
                profitMargin: req.body.profitMargin || 0,
                internalNotes: req.body.internalNotes || ''
            };
            const encryptedData = XORUtil.encryptJSON(sensitiveData, encryptionKey);
            const encryptionKeyHash = HashUtil.sha256(encryptionKey);

            // Generate digital signature
            const { publicKey, privateKey } = SignatureUtil.generateKeyPair();
            const dataToSign = JSON.stringify({
                quoteNumber,
                rfqId,
                totalAmount,
                lineItems
            });
            const signature = SignatureUtil.sign(dataToSign, privateKey);

            // Insert quotation
            const result = await Database.run(
                `INSERT INTO quotations (
          rfq_id, vendor_id, quote_number, total_amount, currency, 
          line_items, terms_conditions, encrypted_data, encryption_key_hash,
          digital_signature, public_key, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    rfqId,
                    req.user.userId,
                    quoteNumber,
                    totalAmount,
                    currency || 'USD',
                    encodedLineItems,
                    termsConditions || null,
                    encryptedData,
                    encryptionKeyHash,
                    signature,
                    publicKey,
                    'draft'
                ]
            );

            res.status(201).json({
                message: 'Quotation created successfully',
                quotation: {
                    id: result.lastID,
                    quoteNumber,
                    rfqId,
                    totalAmount,
                    currency: currency || 'USD',
                    status: 'draft'
                },
                encryptionKey,
                encryption: {
                    note: '⚠️  IMPORTANT: Save this encryption key securely! You will need it to view encrypted data.',
                    keyHash: encryptionKeyHash
                },
                signature: {
                    publicKey: publicKey.substring(0, 100) + '...',
                    verified: true
                }
            });
        } catch (error) {
            console.error('Create quotation error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get all quotations
     */
    static async getAll(req: Request, res: Response): Promise<void> {
        try {
            const { rfqId, status, page = 1, limit = 10 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            let sql = `
        SELECT q.*, u.company_name as vendor_name, u.full_name as vendor_contact, r.rfq_number
        FROM quotations q
        LEFT JOIN users u ON q.vendor_id = u.id
        LEFT JOIN rfqs r ON q.rfq_id = r.id
        WHERE 1=1
      `;
            const params: any[] = [];

            // Filter by user role
            if (req.user?.role === 'vendor') {
                sql += ' AND q.vendor_id = ?';
                params.push(req.user.userId);
            }

            if (rfqId) {
                sql += ' AND q.rfq_id = ?';
                params.push(rfqId);
            }

            if (status) {
                sql += ' AND q.status = ?';
                params.push(status);
            }

            sql += ' ORDER BY q.created_at DESC LIMIT ? OFFSET ?';
            params.push(Number(limit), offset);

            const quotations = await Database.all(sql, params);

            res.json({
                quotations: quotations.map((q: any) => ({
                    ...q,
                    line_items: '*** Encoded ***',
                    encrypted_data: '*** Encrypted ***',
                    public_key: q.public_key ? q.public_key.substring(0, 50) + '...' : null
                })),
                pagination: {
                    page: Number(page),
                    limit: Number(limit)
                }
            });
        } catch (error) {
            console.error('Get quotations error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get quotation by ID with decryption
     */
    static async getById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { encryptionKey } = req.query;

            const quotation = await Database.get<any>(
                `SELECT q.*, u.company_name as vendor_name, u.full_name as vendor_contact,
                u.email as vendor_email, r.rfq_number, r.title as rfq_title
         FROM quotations q
         LEFT JOIN users u ON q.vendor_id = u.id
         LEFT JOIN rfqs r ON q.rfq_id = r.id
         WHERE q.id = ?`,
                [id]
            );

            if (!quotation) {
                res.status(404).json({ error: 'Quotation not found' });
                return;
            }

            // Check authorization
            if (req.user?.role === 'vendor' && quotation.vendor_id !== req.user.userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }

            // Decode line items
            const lineItems = Base64Util.decodeJSON(quotation.line_items);

            // Decrypt sensitive data if key provided
            let decryptedData = null;
            if (encryptionKey) {
                try {
                    // Verify key
                    const keyHash = HashUtil.sha256(encryptionKey as string);
                    if (keyHash === quotation.encryption_key_hash) {
                        decryptedData = XORUtil.decryptJSON(quotation.encrypted_data, encryptionKey as string);
                    } else {
                        res.status(400).json({ error: 'Invalid encryption key' });
                        return;
                    }
                } catch (error) {
                    res.status(400).json({ error: 'Decryption failed' });
                    return;
                }
            }

            // Verify signature
            const dataToVerify = JSON.stringify({
                quoteNumber: quotation.quote_number,
                rfqId: quotation.rfq_id,
                totalAmount: quotation.total_amount,
                lineItems
            });
            const isSignatureValid = SignatureUtil.verify(
                dataToVerify,
                quotation.digital_signature,
                quotation.public_key
            );

            res.json({
                quotation: {
                    ...quotation,
                    line_items: lineItems,
                    encrypted_data: decryptedData || '*** Provide encryption key to view ***',
                    signature: {
                        isValid: isSignatureValid,
                        publicKey: quotation.public_key.substring(0, 100) + '...',
                        message: isSignatureValid
                            ? '✓ Signature verified - quotation is authentic'
                            : '✗ Signature invalid - quotation may have been tampered with'
                    }
                }
            });
        } catch (error) {
            console.error('Get quotation error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Submit quotation for review
     */
    static async submit(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || req.user.role !== 'vendor') {
                res.status(403).json({ error: 'Only vendors can submit quotations' });
                return;
            }

            const { id } = req.params;

            const quotation = await Database.get<any>(
                'SELECT * FROM quotations WHERE id = ? AND vendor_id = ?',
                [id, req.user.userId]
            );

            if (!quotation) {
                res.status(404).json({ error: 'Quotation not found' });
                return;
            }

            await Database.run(
                `UPDATE quotations 
         SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
                [id]
            );

            // Create approval records for approvers
            const approvers = await Database.all<any>('SELECT id FROM users WHERE role = ? AND is_active = 1', [
                'approver'
            ]);

            for (let i = 0; i < approvers.length && i < 2; i++) {
                await Database.run(
                    'INSERT INTO approvals (quotation_id, approver_id, level, status) VALUES (?, ?, ?, ?)',
                    [id, approvers[i].id, i + 1, 'pending']
                );
            }

            res.json({ message: 'Quotation submitted for approval' });
        } catch (error) {
            console.error('Submit quotation error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Verify quotation signature
     */
    static async verifySignature(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const quotation = await Database.get<any>('SELECT * FROM quotations WHERE id = ?', [id]);

            if (!quotation) {
                res.status(404).json({ error: 'Quotation not found' });
                return;
            }

            const lineItems = Base64Util.decodeJSON(quotation.line_items);
            const dataToVerify = JSON.stringify({
                quoteNumber: quotation.quote_number,
                rfqId: quotation.rfq_id,
                totalAmount: quotation.total_amount,
                lineItems
            });

            const isValid = SignatureUtil.verify(
                dataToVerify,
                quotation.digital_signature,
                quotation.public_key
            );

            res.json({
                quoteNumber: quotation.quote_number,
                signatureValid: isValid,
                message: isValid
                    ? 'Signature is valid - quotation data is authentic and has not been tampered with'
                    : 'Signature is invalid - quotation data may have been modified',
                publicKey: quotation.public_key.substring(0, 100) + '...'
            });
        } catch (error) {
            console.error('Verify signature error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
