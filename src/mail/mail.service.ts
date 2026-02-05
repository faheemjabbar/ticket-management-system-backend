import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'your-email@example.com',
        pass: process.env.SMTP_PASS || 'your-email-password',
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const mailOptions: any = {
      from: `"${process.env.SMTP_FROM_NAME || 'TickFlo'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    };

    if (html) {
      mailOptions.html = html;
    }

    return this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const subject = 'Reset Your TickFlo Password';

    const text = `Hello,

We received a request to reset your password for your TickFlo account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Need help? Contact our support team.

Best regards,
The TickFlo Team

---
This is an automated message from TickFlo - Your Ticket Management Solution
Please do not reply to this email.`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - TickFlo</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
      padding: 20px;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #2C3E50;
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .logo-icon {
      width: 32px;
      height: 32px;
      background-color: #F97316;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 18px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: bold;
      color: white;
    }
    .logo-text .highlight {
      color: #F97316;
    }
    .header-title {
      color: white;
      font-size: 20px;
      margin-top: 10px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
      background-color: #ffffff;
    }
    .greeting {
      font-size: 18px;
      color: #2C3E50;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .message {
      color: #555555;
      font-size: 15px;
      line-height: 1.8;
      margin-bottom: 15px;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .reset-button {
      display: inline-block;
      padding: 14px 40px;
      background-color: #F97316;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      font-size: 16px;
      transition: background-color 0.3s ease;
    }
    .reset-button:hover {
      background-color: #EA580C;
    }
    .divider {
      margin: 30px 0;
      border: none;
      border-top: 1px solid #e5e5e5;
    }
    .alternative-link {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #F97316;
    }
    .alternative-link p {
      font-size: 13px;
      color: #666666;
      margin-bottom: 10px;
    }
    .link-text {
      word-break: break-all;
      color: #F97316;
      font-size: 13px;
      font-family: monospace;
    }
    .warning-box {
      background-color: #FFF7ED;
      border: 1px solid #FDBA74;
      border-radius: 6px;
      padding: 15px;
      margin: 25px 0;
    }
    .warning-box p {
      color: #9A3412;
      font-size: 14px;
      margin: 0;
    }
    .warning-box strong {
      color: #7C2D12;
    }
    .security-notice {
      background-color: #F0F9FF;
      border: 1px solid #BAE6FD;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
    }
    .security-notice p {
      color: #075985;
      font-size: 14px;
      margin: 0;
    }
    .footer {
      background-color: #2C3E50;
      padding: 25px 30px;
      text-align: center;
    }
    .footer-text {
      color: #94A3B8;
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    .footer-links {
      margin-top: 15px;
    }
    .footer-link {
      color: #F97316;
      text-decoration: none;
      font-size: 13px;
      margin: 0 10px;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
    .copyright {
      color: #64748B;
      font-size: 12px;
      margin-top: 15px;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .content {
        padding: 30px 20px;
      }
      .reset-button {
        padding: 12px 30px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        
        <div class="logo-text">Tick<span class="highlight">Flo</span></div>
      </div>
      <div class="header-title">Password Reset Request</div>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Hello,</p>
      
      <p class="message">
        We received a request to reset the password for your TickFlo account. 
        If you made this request, click the button below to create a new password.
      </p>

      <div class="button-container">
        <a href="${resetUrl}" class="reset-button text-white">Reset My Password</a>
      </div>

      <div class="warning-box">
        <p><strong>⏰ Important:</strong> This password reset link will expire in 1 hour for security reasons.</p>
      </div>

      <hr class="divider">

      <div class="alternative-link">
        <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
        <div class="link-text">${resetUrl}</div>
      </div>

      <div class="security-notice">
        <p>
          <strong>🔒 Security Notice:</strong> If you didn't request a password reset, 
          you can safely ignore this email. Your password will remain unchanged and your account is secure.
        </p>
      </div>

      <p class="message" style="margin-top: 30px; color: #666;">
        Need help? Our support team is here to assist you with any questions or concerns.
      </p>

      <p class="message" style="margin-top: 20px; color: #666;">
        Best regards,<br>
        <strong style="color: #2C3E50;">The TickFlo Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        This is an automated message from TickFlo - Your Ticket Management Solution
      </p>
      <p class="footer-text">
        Please do not reply to this email.
      </p>
      <div class="footer-links">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="footer-link">Visit TickFlo</a>
        <span style="color: #64748B;">|</span>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support" class="footer-link">Support</a>
        <span style="color: #64748B;">|</span>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy" class="footer-link">Privacy Policy</a>
      </div>
      <p class="copyright">© 2026 TickFlo. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendMail(to, subject, text, html);
  }
}
