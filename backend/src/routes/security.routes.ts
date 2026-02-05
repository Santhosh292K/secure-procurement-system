/**
 * Security Demo Routes
 */

import { Router } from 'express';
import { SecurityController } from '../controllers/security.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Base64
router.post('/base64/encode', optionalAuth, SecurityController.base64Encode);
router.post('/base64/decode', optionalAuth, SecurityController.base64Decode);

// XOR Encryption
router.post('/xor/encrypt', optionalAuth, SecurityController.xorEncrypt);
router.post('/xor/decrypt', optionalAuth, SecurityController.xorDecrypt);

// Hashing
router.post('/hash/generate', optionalAuth, SecurityController.generateHash);
router.post('/hash/verify', optionalAuth, SecurityController.verifyHash);

// Digital Signatures
router.post('/signature/create', optionalAuth, SecurityController.createSignature);
router.post('/signature/verify', optionalAuth, SecurityController.verifySignature);

// Password Security
router.post('/password/analyze', optionalAuth, SecurityController.analyzePassword);
router.post('/password/crack', optionalAuth, SecurityController.crackPassword);
router.post('/password/generate', optionalAuth, SecurityController.generatePassword);

export default router;
