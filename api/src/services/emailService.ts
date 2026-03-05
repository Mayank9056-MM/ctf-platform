import nodemailer from "nodemailer";
import { config } from "../config/config";
import logger from "../utils/logger";

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  static initialize() {
    if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: false,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      });
      logger.info("Email service initialized");
    } else {
      logger.warn("Email service not configured - missing SMTP credentials");
    }
  }

  static async sendWelcomeEmail(email: string, name: string) {
    if (!this.transporter) {
      logger.warn("Email service not available - skipping welcome email");
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"CTF-Platform" <${config.SMTP_USER}>`,
        to: email,
        subject: "Welcome to CTF-Platform!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Welcome to CTF-Platform, ${name}! 🎉</h1>
            <p>We're excited to have you on board. Your account has been successfully created.</p>
            <p>You can now start managing your projects and collaborating with your team.</p>
            <div style="margin: 30px 0;">
              <a href="${config.FRONTEND_URL}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Get Started
              </a>
            </div>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The CTF-Platform Team
            </p>
          </div>
        `,
      });
      logger.info("Welcome email sent:", { email });
    } catch (error) {
      logger.error("Failed to send welcome email:", error);
    }
  }

  static async sendPasswordResetEmail(email: string, resetToken: string) {
    if (!this.transporter) {
      logger.warn(
        "Email service not available - skipping password reset email"
      );
      return;
    }

    try {
      const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;

      await this.transporter.sendMail({
        from: `"CTF-Platform" <${config.SMTP_USER}>`,
        to: email,
        subject: "Reset Your CTF-Platform Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Password Reset Request</h1>
            <p>We received a request to reset your password for your CTF-Platform account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The CTF-Platform Team
            </p>
          </div>
        `,
      });
      logger.info("Password reset email sent:", { email });
    } catch (error) {
      logger.error("Failed to send password reset email:", error);
    }
  }
}

// Initialize email service on startup
EmailService.initialize();
