/**
 * Main Server File
 * Secure Procurement System Backend
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Database } from './database/database';
import { seedDatabase } from './database/seed';
import { OTPUtil } from './utils/otp.util';
import { EmailService } from './services/email.service';

// Import routes
import authRoutes from './routes/auth.routes';
import securityRoutes from './routes/security.routes';
import rfqRoutes from './routes/rfq.routes';
import quotationRoutes from './routes/quotation.routes';
import approvalRoutes from './routes/approval.routes';
import negotiationRoutes from './routes/negotiation.routes';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api', negotiationRoutes); // Negotiation routes (quotations/:id/revisions, etc.)

// Root route
app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'Secure Procurement System API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            security: '/api/security',
            rfqs: '/api/rfqs',
            quotations: '/api/quotations',
            approvals: '/api/approvals'
        },
        documentation: '/api/docs',
        features: [
            'Base64 Encoding/Decoding',
            'XOR Encryption/Decryption',
            'SHA-256/bcrypt Hashing',
            'Digital Signatures (RSA)',
            'Password Security Analysis',
            'JWT Authentication',
            'Role-Based Access Control',
            'Multi-Level Approvals'
        ]
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path
    });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Initialize database and start server
async function startServer() {
    try {
        console.log('🚀 Starting Secure Procurement System...\n');

        // Initialize database
        await Database.initialize();

        // Seed database
        await seedDatabase();

        // Initialize OTP utility (starts cleanup interval)
        OTPUtil.initialize();
        console.log('✅ OTP service initialized');

        // Initialize email service
        EmailService.initialize();
        const emailReady = await EmailService.testConnection();
        if (emailReady) {
            console.log('✅ Email service initialized and ready');
        } else {
            console.warn('⚠️  Email service configured but connection test failed');
            console.warn('   Please check your EMAIL_* environment variables');
        }

        // Start server
        app.listen(PORT, () => {
            console.log(`\n✨ Server running on port ${PORT}`);
            console.log(`📍 API URL: http://localhost:${PORT}`);
            console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`\n🔒 Security Features Active:`);
            console.log(`   • Base64 Encoding/Decoding`);
            console.log(`   • XOR Encryption`);
            console.log(`   • SHA-256 & bcrypt Hashing`);
            console.log(`   • Digital Signatures`);
            console.log(`   • Password Security Analysis`);
            console.log(`   • JWT Authentication`);
            console.log(`   • Rate Limiting`);
            console.log(`   • Helmet Security Headers`);
            console.log(`\n📚 API Endpoints:`);
            console.log(`   • POST /api/auth/register - Register user`);
            console.log(`   • POST /api/auth/login - Login`);
            console.log(`   • POST /api/security/base64/encode - Base64 encode`);
            console.log(`   • POST /api/security/xor/encrypt - XOR encrypt`);
            console.log(`   • POST /api/security/hash/generate - Generate hash`);
            console.log(`   • POST /api/security/signature/create - Create signature`);
            console.log(`   • POST /api/security/password/analyze - Analyze password`);
            console.log(`   • GET  /api/rfqs - List RFQs`);
            console.log(`   • POST /api/quotations - Create quotation`);
            console.log(`   • GET  /api/approvals/pending - Pending approvals`);
            console.log(`\n✅ Server ready!\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    await Database.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT received, closing server...');
    await Database.close();
    process.exit(0);
});

// Start the server
startServer();

export default app;
