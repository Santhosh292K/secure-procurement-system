/**
 * Email Service
 * Handles sending emails using Gmail SMTP
 */

import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

class EmailService {
    private static transporter: nodemailer.Transporter;

    /**
     * Initialize email transporter
     */
    static initialize() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        console.log('Email service initialized');
    }

    /**
     * Send OTP verification email
     */
    static async sendOTPEmail(
        email: string,
        otp: string,
        purpose: 'signup' | 'login',
        userName?: string
    ): Promise<void> {
        const subject = purpose === 'signup'
            ? 'Verify Your Email - Secure Procurement System'
            : 'Login Verification Code - Secure Procurement System';

        const greeting = userName ? `Hello ${userName}` : 'Hello';

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333333;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #666666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .otp-container {
            background-color: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-label {
            font-size: 14px;
            color: #666666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .expiry {
            font-size: 14px;
            color: #999999;
            margin-top: 15px;
        }
        .security-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 30px 0;
            border-radius: 4px;
        }
        .security-notice p {
            margin: 0;
            font-size: 14px;
            color: #856404;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #666666;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 30px 20px;
            }
            .otp-code {
                font-size: 28px;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Secure Procurement System</h1>
        </div>
        
        <div class="content">
            <p class="greeting">${greeting},</p>
            
            <p class="message">
                ${purpose === 'signup'
                ? 'Thank you for registering with Secure Procurement System. To complete your account setup, please verify your email address using the code below.'
                : 'We received a login request for your account. Please use the verification code below to complete your login.'}
            </p>
            
            <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="expiry">Valid for 5 minutes</div>
            </div>
            
            <div class="security-notice">
                <p><strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code.</p>
            </div>
            
            <p class="message">
                If you didn't request this ${purpose === 'signup' ? 'registration' : 'login'}, please ignore this email or contact our support team if you have concerns.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Secure Procurement System</strong></p>
            <p>Protecting your vendor quotations and procurement approvals</p>
            <p style="margin-top: 20px; font-size: 12px; color: #999999;">
                This is an automated email. Please do not reply to this message.
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const text = `
${greeting},

${purpose === 'signup'
                ? 'Thank you for registering with Secure Procurement System. To complete your account setup, please verify your email address using the code below.'
                : 'We received a login request for your account. Please use the verification code below to complete your login.'}

Your Verification Code: ${otp}

This code is valid for 5 minutes.

Security Notice: Never share this code with anyone. Our team will never ask for your verification code.

If you didn't request this ${purpose === 'signup' ? 'registration' : 'login'}, please ignore this email.

---
Secure Procurement System
Protecting your vendor quotations and procurement approvals
        `;

        await this.transporter.sendMail({
            from: process.env.EMAIL_FROM || 'Secure Procurement System <noreply@procurement.com>',
            to: email,
            subject,
            text,
            html,
        });

        console.log(`OTP email sent to ${email}`);
    }

    /**
     * Send welcome email after successful signup
     */
    static async sendWelcomeEmail(email: string, fullName: string, role: string): Promise<void> {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .welcome {
            font-size: 20px;
            color: #333333;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .message {
            font-size: 16px;
            color: #666666;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .role-badge {
            display: inline-block;
            background-color: #667eea;
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin: 20px 0;
        }
        .features {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        .features h3 {
            margin: 0 0 15px 0;
            color: #333333;
            font-size: 18px;
        }
        .features ul {
            margin: 0;
            padding-left: 20px;
        }
        .features li {
            color: #666666;
            margin-bottom: 10px;
            line-height: 1.5;
        }
        .cta {
            text-align: center;
            margin: 30px 0;
        }
        .cta a {
            display: inline-block;
            background-color: #667eea;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #666666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Secure Procurement!</h1>
        </div>
        
        <div class="content">
            <p class="welcome">Hello ${fullName},</p>
            
            <p class="message">
                Your account has been successfully created! We're excited to have you join our secure procurement platform.
            </p>
            
            <div style="text-align: center;">
                <span class="role-badge">Account Type: ${role.charAt(0).toUpperCase() + role.slice(1)}</span>
            </div>
            
            <div class="features">
                <h3>What you can do:</h3>
                <ul>
                    ${role === 'vendor' ? `
                        <li>View and respond to Request for Quotations (RFQs)</li>
                        <li>Submit encrypted quotations with digital signatures</li>
                        <li>Track quotation status and approvals</li>
                        <li>Communicate securely with approvers</li>
                    ` : role === 'approver' ? `
                        <li>Review and approve vendor quotations</li>
                        <li>Verify digital signatures for authenticity</li>
                        <li>Request revisions from vendors</li>
                        <li>Track approval workflows</li>
                    ` : `
                        <li>Create and manage RFQs</li>
                        <li>Monitor all quotations and approvals</li>
                        <li>Manage users and system settings</li>
                        <li>Access comprehensive analytics</li>
                    `}
                </ul>
            </div>
            
            <div class="cta">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">Get Started</a>
            </div>
            
            <p class="message">
                If you have any questions or need assistance, please don't hesitate to reach out to our support team.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Secure Procurement System</strong></p>
            <p>Protecting your vendor quotations and procurement approvals</p>
        </div>
    </div>
</body>
</html>
        `;

        const text = `
Welcome to Secure Procurement System!

Hello ${fullName},

Your account has been successfully created! We're excited to have you join our secure procurement platform.

Account Type: ${role.charAt(0).toUpperCase() + role.slice(1)}

Get started now: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

---
Secure Procurement System
Protecting your vendor quotations and procurement approvals
        `;

        await this.transporter.sendMail({
            from: process.env.EMAIL_FROM || 'Secure Procurement System <noreply@procurement.com>',
            to: email,
            subject: 'Welcome to Secure Procurement System! 🎉',
            text,
            html,
        });

        console.log(`Welcome email sent to ${email}`);
    }

    /**
     * Test email configuration
     */
    static async testConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('Email service is ready to send emails');
            return true;
        } catch (error) {
            console.error('Email service configuration error:', error);
            return false;
        }
    }
}

export { EmailService };
