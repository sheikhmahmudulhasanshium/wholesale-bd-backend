import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { SentMessageInfo } from 'nodemailer'; // Ensure SentMessageInfo is imported

@Injectable()
export class MailService {
  private transporter: Mail;
  private readonly logger = new Logger(MailService.name);
  private fromEmail: string;
  private fromName: string;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('smtp.host'),
      port: this.configService.get<number>('smtp.port'),
      secure: this.configService.get<boolean>('smtp.secure'),
      auth: {
        user: this.configService.get<string>('smtp.user'),
        pass: this.configService.get<string>('smtp.pass'),
      },
    });
    this.fromEmail = this.configService.get<string>('smtp.fromEmail') ?? '';
    this.fromName = this.configService.get<string>('smtp.fromName') ?? '';

    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(
          'Nodemailer transporter verification failed:',
          error.message,
        );
      } else {
        this.logger.log('Nodemailer transporter is ready to send emails.');
      }
    });
  }

  async sendMail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to,
      subject,
      html,
      text: text || html,
    };

    try {
      // FINAL FIX: Explicitly type 'info' AND disable the lint rule for this single line.
      // This forces the correct type onto the variable, resolving all subsequent errors.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info: SentMessageInfo =
        await this.transporter.sendMail(mailOptions);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.log(`Email sent: ${info.messageId} to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new Error('Failed to send email.');
    }
  }

  async sendVerificationEmail(to: string, otp: string): Promise<void> {
    const subject = 'Verify Your Email Address';
    const html = `
      <p>Hello,</p>
      <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address:</p>
      <h3>${otp}</h3>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <p>Regards,<br>${this.fromName} Team</p>
    `;
    await this.sendMail(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const subject = 'Password Reset Request';
    const html = `
      <p>Hello,</p>
      <p>You have requested to reset your password. Please click on the link below to reset your password:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>This link is valid for 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p>Regards,<br>${this.fromName} Team</p>
    `;
    await this.sendMail(to, subject, html);
  }
}
