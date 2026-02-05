# Secure Vendor Quotation & Procurement Approval System

A comprehensive full-stack procurement system with advanced cybersecurity features built with Next.js, Node.js, and SQLite.

## 🚀 Features

### Cybersecurity Techniques
1. **Base64 Encoding** - Data obfuscation and encoding
2. **XOR Encryption** - Symmetric encryption demonstration
3. **Hashing (SHA-256, bcrypt)** - Data integrity and password security
4. **Digital Signatures (RSA)** - Authentication and non-repudiation
5. **Password Security** - Strength analysis, cracking simulation, secure generation

### Business Features
- **RFQ Management** - Create and publish requests for quotations
- **Quotation System** - Submit encrypted quotations with digital signatures
- **Multi-Level Approval Workflow** - Configurable approval chains
- **Role-Based Access Control** - Admin, Vendor, and Approver roles
- **JWT Authentication** - Secure token-based authentication
- **Audit Logging** - Complete activity tracking

## 📁 Project Structure

```
secure-procurement-system/
├── backend/                    # Node.js + Express + SQLite
│   ├── src/
│   │   ├── controllers/       # Business logic
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth & validation
│   │   ├── database/          # Database setup
│   │   └── utils/
│   │       └── security/      # Security utilities
│   │           ├── base64.util.ts
│   │           ├── xor.util.ts
│   │           ├── hash.util.ts
│   │           ├── signature.util.ts
│   │           └── password.util.ts
│   └── package.json
│
└── frontend/                   # Next.js + React + TypeScript
    ├── src/
    │   ├── app/               # Pages (App Router)
    │   │   ├── (auth)/
    │   │   ├── dashboard/
    │   │   ├── rfqs/
    │   │   ├── quotations/
    │   │   ├── approvals/
    │   │   └── security/
    │   ├── components/        # Reusable components
    │   └── lib/              # Utilities & API client
    └── package.json
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Git

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start the server
npm run dev
```

The backend will start on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:3000`

## 🔐 Default Credentials

After starting the backend, the database will be seeded with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@procurement.com | admin123 |
| Vendor 1 | vendor1@techsolutions.com | vendor123 |
| Vendor 2 | vendor2@innovate.com | vendor123 |
| Approver 1 | approver1@procurement.com | approver123 |
| Approver 2 | approver2@procurement.com | approver123 |

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password

### Security Demo Endpoints
- `POST /api/security/base64/encode` - Base64 encode
- `POST /api/security/base64/decode` - Base64 decode
- `POST /api/security/xor/encrypt` - XOR encryption
- `POST /api/security/xor/decrypt` - XOR decryption
- `POST /api/security/hash/generate` - Generate hash
- `POST /api/security/hash/verify` - Verify hash
- `POST /api/security/signature/create` - Create digital signature
- `POST /api/security/signature/verify` - Verify signature
- `POST /api/security/password/analyze` - Analyze password strength
- `POST /api/security/password/crack` - Simulate password cracking
- `POST /api/security/password/generate` - Generate secure password

### RFQ Endpoints
- `POST /api/rfqs` - Create RFQ (admin only)
- `GET /api/rfqs` - List RFQs
- `GET /api/rfqs/:id` - Get RFQ details
- `PUT /api/rfqs/:id` - Update RFQ (admin only)
- `DELETE /api/rfqs/:id` - Delete RFQ (admin only)
- `POST /api/rfqs/:id/publish` - Publish RFQ (admin only)

### Quotation Endpoints
- `POST /api/quotations` - Create quotation (vendor only)
- `GET /api/quotations` - List quotations
- `GET /api/quotations/:id` - Get quotation details (with optional encryption key)
- `POST /api/quotations/:id/submit` - Submit for approval
- `POST /api/quotations/:id/verify-signature` - Verify quotation signature

### Approval Endpoints
- `GET /api/approvals/pending` - Get pending approvals (approver only)
- `POST /api/approvals/:id/approve` - Approve quotation
- `POST /api/approvals/:id/reject` - Reject quotation
- `GET /api/approvals/history/:quotationId` - Get approval history

## 🎯 Usage Workflows

### 1. Create and Publish RFQ (Admin)
1. Login as admin
2. Navigate to RFQs → Create New
3. Fill in title, description, requirements, deadline
4. Save as draft
5. Publish when ready

### 2. Submit Quotation (Vendor)
1. Login as vendor
2. View published RFQs
3. Create quotation with line items
4. System automatically:
   - Encodes line items with Base64
   - Encrypts sensitive data with XOR
   - Creates digital signature
5. Submit for approval

### 3. Approve Quotation (Approver)
1. Login as approver
2. View pending approvals
3. Review quotation details
4. Verify digital signature
5. Approve or reject with comments

### 4. Security Demonstrations
1. Navigate to Security section
2. Try each security feature:
   - Base64: Encode/decode text
   - XOR: Encrypt/decrypt with keys
   - Hash: Generate and verify hashes
   - Signature: Sign and verify documents
   - Password: Analyze strength, simulate cracking

## 🔒 Security Implementation

### Base64 Encoding
- **Where Used**: Quotation line items
- **Purpose**: Data obfuscation and transport encoding
- **Implementation**: Node.js Buffer API

### XOR Encryption
- **Where Used**: Sensitive quotation data (cost breakdown, margins)
- **Purpose**: Symmetric encryption demonstration
- **Key Management**: User-specific keys, stored securely
- **Note**: Educational - production should use AES

### Hashing
- **SHA-256**: Data integrity, signature hashes, encryption key hashes
- **bcrypt**: Password hashing with salt (10 rounds)
- **HMAC**: Message authentication codes

### Digital Signatures
- **Algorithm**: RSA-SHA256 (2048-bit keys)
- **Where Used**: Quotation authentication, approval verification
- **Key Storage**: Public keys stored with quotations, private keys ephemeral

### Password Security
- **Strength Analysis**: Character variety, length, entropy calculation
- **Common Password Check**: Dictionary of 28 common passwords
- **Cracking Simulation**: Dictionary and brute force attacks
- **Recommendations**: 12+ characters, mixed case, numbers, symbols

## 🎨 Frontend Pages

1. **Login/Register** - Authentication pages
2. **Dashboard** - Role-based overview with statistics
3. **RFQs** - List, create, view, manage RFQs
4. **Quotations** - Create, view, submit quotations
5. **Approvals** - Review and approve/reject quotations
6. **Security Demos** - Interactive cybersecurity demonstrations
   - Base64 Encoder/Decoder
   - XOR Encryption Tool
   - Hash Generator
   - Digital Signature Creator
   - Password Analyzer

## 🚢 Production Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

### Environment Variables

Backend (`.env`):
```env
PORT=5000
NODE_ENV=production
DATABASE_PATH=./data/procurement.db
JWT_SECRET=<your-secure-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
CORS_ORIGIN=https://your-frontend-domain.com
```

Frontend (`.env.local`):
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

## 📊 Database Schema

- **users** - User accounts and roles
- **rfqs** - Request for quotations
- **quotations** - Vendor quotations (with encrypted data and signatures)
- **approvals** - Multi-level approval workflow
- **audit_logs** - System activity tracking
- **security_demos** - Security feature usage logs

## 🤝 Contributing

This is an educational project demonstrating cybersecurity concepts in a procurement system.

## ⚠️ Disclaimer

This system includes educational demonstrations of cryptographic techniques. For production use:
- Replace XOR with AES-256
- Use proper key management (KMS)
- Implement TLS/SSL
- Add comprehensive logging and monitoring
- Conduct security audits
- Follow OWASP guidelines

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- Next.js 15
- React 18
- Node.js / Express
- SQLite3
- TypeScript
- Tailwind CSS
- JWT / bcrypt / crypto

---

**Author**: Secure Procurement Team
**Version**: 1.0.0
**Last Updated**: 2026
# secure-procurement-system
