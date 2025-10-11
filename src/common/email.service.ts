import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
// FIX 1: Import the specific return type.
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  // FIX 2: Explicitly type the transporter to resolve 'any' type issues.
  private transporter: nodemailer.Transporter<SentMessageInfo>;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE'),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private async sendMail(
    mailOptions: nodemailer.SendMailOptions,
  ): Promise<void> {
    try {
      // Because of the fix, 'info' is now correctly typed as SentMessageInfo.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info = await this.transporter.sendMail(mailOptions);
      // Accessing '.messageId' is now type-safe.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error('Failed to send email', error);
    }
  }

  // ... (rest of the methods are unchanged and correct)
  async sendEmailVerification(
    email: string,
    otp: string,
    firstName: string,
  ): Promise<void> {
    const subject = 'Verify Your Email for Wholesale BD';
    const html = `<p>Hi ${firstName},</p><p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 15 minutes.</p>`;

    await this.sendMail({
      from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
      to: email,
      subject,
      html,
    });
  }

  async sendPasswordResetEmail(email: string, otp: string): Promise<void> {
    const subject = 'Your Password Reset Code for Wholesale BD';
    const html = `<p>Your password reset code is: <strong>${otp}</strong></p><p>This code will expire in 15 minutes.</p>`;

    await this.sendMail({
      from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
      to: email,
      subject,
      html,
    });
  }

  async sendSellerApprovalEmail(
    email: string,
    firstName: string,
    businessName: string,
  ): Promise<void> {
    const subject = 'Congratulations! Your Seller Account is Approved';
    const html = `<p>Hi ${firstName},</p><p>Your seller account for <strong>${businessName}</strong> on Wholesale BD has been approved!</p><p>You can now log in and start listing your products.</p>`;
    await this.sendMail({
      from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
      to: email,
      subject,
      html,
    });
  }

  async sendSellerRejectionEmail(
    email: string,
    firstName: string,
    reason: string,
  ): Promise<void> {
    const subject = 'Update on Your Wholesale BD Seller Application';
    const html = `<p>Hi ${firstName},</p><p>We have reviewed your seller application. Unfortunately, it was not approved at this time.</p><p>Reason: ${reason}</p><p>Please feel free to contact support if you have any questions.</p>`;
    await this.sendMail({
      from: `"${this.configService.get<string>('SMTP_FROM_NAME')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
      to: email,
      subject,
      html,
    });
  }
}
