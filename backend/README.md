# Secure Procurement System - Backend

A comprehensive procurement system with advanced cybersecurity features.

## Features

### Security Demonstrations
- **Base64 Encoding/Decoding** - Data obfuscation
- **XOR Encryption** - Symmetric encryption demonstration
- **Hashing** - SHA-256, SHA-512, MD5, bcrypt
- **Digital Signatures** - RSA signature generation and verification
- **Password Security** - Strength analysis, cracking simulation

### Business Features
- **RFQ Management** - Create and manage requests for quotations
- **Quotation System** - Submit quotations with encryption
- **Approval Workflow** - Multi-level approval process
- **JWT Authentication** - Secure token-based auth
- **Role-Based Access** - Admin, Vendor, Approver roles

## Installation

```bash
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Database Setup

Initialize and seed the database:

```bash
npm run seed
```

Default credentials will be created:
- Admin: `admin@procurement.com` / `admin123`
- Vendor1: `vendor1@techsolutions.com` / `vendor123`
- Vendor2: `vendor2@innovate.com` / `vendor123`
- Approver1: `approver1@procurement.com` / `approver123`
- Approver2: `approver2@procurement.com` / `approver123`

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/profile` - Get user profile

### Security Demos
- `POST /api/security/base64/encode` - Encode to Base64
- `POST /api/security/base64/decode` - Decode from Base64
- `POST /api/security/xor/encrypt` - XOR encryption
- `POST /api/security/xor/decrypt` - XOR decryption
- `POST /api/security/hash/generate` - Generate hash
- `POST /api/security/hash/verify` - Verify hash
- `POST /api/security/signature/create` - Create digital signature
- `POST /api/security/signature/verify` - Verify signature
- `POST /api/security/password/analyze` - Analyze password strength
- `POST /api/security/password/crack` - Simulate password cracking
- `POST /api/security/password/generate` - Generate secure password

### RFQs
- `POST /api/rfqs` - Create RFQ (admin only)
- `GET /api/rfqs` - List RFQs
- `GET /api/rfqs/:id` - Get RFQ details
- `PUT /api/rfqs/:id` - Update RFQ (admin only)
- `DELETE /api/rfqs/:id` - Delete RFQ (admin only)
- `POST /api/rfqs/:id/publish` - Publish RFQ (admin only)

### Quotations
- `POST /api/quotations` - Create quotation (vendor only)
- `GET /api/quotations` - List quotations
- `GET /api/quotations/:id` - Get quotation details
- `POST /api/quotations/:id/submit` - Submit for approval
- `POST /api/quotations/:id/verify-signature` - Verify signature

### Approvals
- `GET /api/approvals/pending` - Get pending approvals (approver only)
- `POST /api/approvals/:id/approve` - Approve quotation
- `POST /api/approvals/:id/reject` - Reject quotation
- `GET /api/approvals/history/:quotationId` - Get approval history

## Architecture

- **Express.js** - Web framework
- **SQLite3** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **TypeScript** - Type safety
- **Helmet** - Security headers
- **Rate Limiting** - DDoS protection

## Security Features

1. **Base64 Encoding** - Used for quotation line items
2. **XOR Encryption** - Symmetric encryption for sensitive data
3. **Hashing** - SHA-256 for data integrity, bcrypt for passwords
4. **Digital Signatures** - RSA signatures for quotation authenticity
5. **Password Security** - Strength analysis and cracking demonstrations
6. **JWT Tokens** - Secure authentication
7. **Rate Limiting** - Protection against brute force
8. **Helmet** - HTTP security headers
9. **CORS** - Cross-origin protection
10. **Role-Based Access Control** - Fine-grained permissions

## License

MIT
