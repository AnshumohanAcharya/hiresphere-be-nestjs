import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

import {
  passwordResetEmailTemplate,
  verificationEmailTemplate,
  welcomeEmailTemplate,
} from './templates/email.templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: this.configService.get<boolean>('email.secure'),
      auth: {
        user: this.configService.get<string>('email.auth.user'),
        pass: this.configService.get<string>('email.auth.pass'),
      },
    });
  }

  async sendVerificationEmail(email: string, otp: string): Promise<void> {
    const from = this.configService.get<string>('email.from');

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Verify Your Email - HireSphere',
        html: verificationEmailTemplate(otp),
      });

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const from = this.configService.get<string>('email.from');
    const clientUrl = this.configService.get<string>('CLIENT_URL') ?? 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Reset Your Password - HireSphere',
        html: passwordResetEmailTemplate(resetUrl),
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const from = this.configService.get<string>('email.from');
    const clientUrl = this.configService.get<string>('CLIENT_URL') ?? 'http://localhost:3000';
    const dashboardUrl = `${clientUrl}/dashboard`;

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Welcome to HireSphere! 🎉',
        html: welcomeEmailTemplate(firstName, dashboardUrl),
      });

      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
      // Don't throw error for welcome emails - it's not critical
    }
  }
}
