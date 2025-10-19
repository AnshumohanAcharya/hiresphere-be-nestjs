import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as crypto from 'crypto';

export enum OTPType {
  EMAIL_VERIFY = 'email_verify',
  PASSWORD_RESET = 'password_reset',
}

@Injectable()
export class OtpService {
  private readonly OTP_EXPIRATION = 600; // 10 minutes in seconds
  private readonly RESET_TOKEN_EXPIRATION = 900; // 15 minutes in seconds

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Generate a 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate a secure token for password reset
   */
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash a token using SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create and store an OTP in Redis
   */
  async createOTP(email: string, type: OTPType): Promise<string> {
    const otp = this.generateOTP();
    const hashedOTP = this.hashToken(otp);
    const key = `otp:${type}:${email}`;

    await this.cacheManager.set(key, hashedOTP, this.OTP_EXPIRATION * 1000);

    return otp; // Return unhashed OTP to send via email
  }

  /**
   * Create and store a password reset token in Redis
   */
  async createPasswordResetToken(email: string): Promise<string> {
    const token = this.generateSecureToken();
    const hashedToken = this.hashToken(token);
    const key = `reset_token:${email}`;

    await this.cacheManager.set(key, hashedToken, this.RESET_TOKEN_EXPIRATION * 1000);

    return token; // Return unhashed token to send via email
  }

  /**
   * Verify an OTP
   */
  async verifyOTP(email: string, otp: string, type: OTPType): Promise<boolean> {
    const key = `otp:${type}:${email}`;
    const storedHashedOTP = await this.cacheManager.get<string>(key);

    if (!storedHashedOTP) {
      throw new BadRequestException('OTP has expired or does not exist');
    }

    const hashedInputOTP = this.hashToken(otp);

    if (storedHashedOTP !== hashedInputOTP) {
      throw new BadRequestException('Invalid OTP');
    }

    // Delete OTP after successful verification
    await this.cacheManager.del(key);

    return true;
  }

  /**
   * Verify a password reset token
   */
  async verifyPasswordResetToken(email: string, token: string): Promise<boolean> {
    const key = `reset_token:${email}`;
    const storedHashedToken = await this.cacheManager.get<string>(key);

    if (!storedHashedToken) {
      throw new BadRequestException('Reset token has expired or does not exist');
    }

    const hashedInputToken = this.hashToken(token);

    if (storedHashedToken !== hashedInputToken) {
      throw new BadRequestException('Invalid reset token');
    }

    // Delete token after successful verification
    await this.cacheManager.del(key);

    return true;
  }

  /**
   * Delete an OTP from Redis
   */
  async deleteOTP(email: string, type: OTPType): Promise<void> {
    const key = `otp:${type}:${email}`;
    await this.cacheManager.del(key);
  }

  /**
   * Check if OTP exists for an email
   */
  async hasActiveOTP(email: string, type: OTPType): Promise<boolean> {
    const key = `otp:${type}:${email}`;
    const otp = await this.cacheManager.get(key);
    return !!otp;
  }
}
