import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { getEnvAsNumber } from '@/common/utils/env-validator.util';

interface LoginAttempt {
  email: string;
  ipAddress: string;
  timestamp: number;
  successful: boolean;
}

@Injectable()
export class SecurityService {
  private readonly MAX_LOGIN_ATTEMPTS: number;
  private readonly LOGIN_LOCKOUT_DURATION: number; // in seconds
  private readonly ATTEMPT_WINDOW = 900; // 15 minutes in seconds

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.MAX_LOGIN_ATTEMPTS = getEnvAsNumber('MAX_LOGIN_ATTEMPTS', 5);
    this.LOGIN_LOCKOUT_DURATION = getEnvAsNumber('LOGIN_LOCKOUT_DURATION', 900);
  }

  /**
   * Record a login attempt
   */
  async recordLoginAttempt(email: string, ipAddress: string, successful: boolean): Promise<void> {
    const attempt: LoginAttempt = {
      email,
      ipAddress,
      timestamp: Date.now(),
      successful,
    };

    // Store attempt by email
    const emailKey = `login_attempts:email:${email}`;
    const emailAttempts = (await this.cacheManager.get<LoginAttempt[]>(emailKey)) ?? [];
    emailAttempts.push(attempt);
    await this.cacheManager.set(emailKey, emailAttempts, this.ATTEMPT_WINDOW * 1000);

    // Store attempt by IP
    const ipKey = `login_attempts:ip:${ipAddress}`;
    const ipAttempts = (await this.cacheManager.get<LoginAttempt[]>(ipKey)) ?? [];
    ipAttempts.push(attempt);
    await this.cacheManager.set(ipKey, ipAttempts, this.ATTEMPT_WINDOW * 1000);

    // If failed, check if we need to lock the account
    if (!successful) {
      const failedAttempts = await this.getRecentFailedAttempts(email);

      if (failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        await this.lockAccount(email);
      }
    }
  }

  /**
   * Get recent failed login attempts for an email
   */
  private async getRecentFailedAttempts(email: string): Promise<number> {
    const emailKey = `login_attempts:email:${email}`;
    const attempts = (await this.cacheManager.get<LoginAttempt[]>(emailKey)) ?? [];

    const now = Date.now();
    const recentFailedAttempts = attempts.filter(
      (attempt) => !attempt.successful && now - attempt.timestamp < this.ATTEMPT_WINDOW * 1000,
    );

    return recentFailedAttempts.length;
  }

  /**
   * Lock an account temporarily
   */
  private async lockAccount(email: string): Promise<void> {
    const lockKey = `account_locked:${email}`;
    await this.cacheManager.set(lockKey, true, this.LOGIN_LOCKOUT_DURATION * 1000);
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(email: string): Promise<boolean> {
    const lockKey = `account_locked:${email}`;
    const locked = await this.cacheManager.get<boolean>(lockKey);
    return !!locked;
  }

  /**
   * Check login attempts before allowing login
   */
  async checkLoginAttempts(email: string, ipAddress: string): Promise<void> {
    // Check if account is locked
    if (await this.isAccountLocked(email)) {
      throw new BadRequestException(
        `Account is temporarily locked. Please try again in ${Math.ceil(this.LOGIN_LOCKOUT_DURATION / 60)} minutes.`,
      );
    }

    // Check recent failed attempts
    const failedAttempts = await this.getRecentFailedAttempts(email);

    if (failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      await this.lockAccount(email);
      throw new BadRequestException(
        `Too many failed login attempts. Account locked for ${Math.ceil(this.LOGIN_LOCKOUT_DURATION / 60)} minutes.`,
      );
    }

    // Check IP-based rate limiting
    const ipKey = `login_attempts:ip:${ipAddress}`;
    const ipAttempts = (await this.cacheManager.get<LoginAttempt[]>(ipKey)) ?? [];

    const now = Date.now();
    const recentIpAttempts = ipAttempts.filter(
      (attempt) => now - attempt.timestamp < this.ATTEMPT_WINDOW * 1000,
    );

    if (recentIpAttempts.length >= this.MAX_LOGIN_ATTEMPTS * 3) {
      throw new BadRequestException(
        'Too many requests from this IP address. Please try again later.',
      );
    }
  }

  /**
   * Clear login attempts after successful login
   */
  async clearLoginAttempts(email: string): Promise<void> {
    const emailKey = `login_attempts:email:${email}`;
    await this.cacheManager.del(emailKey);

    const lockKey = `account_locked:${email}`;
    await this.cacheManager.del(lockKey);
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character');
    }

    // Check for common patterns
    const commonPatterns = [
      /^(?:123|abc|qwerty|password|admin)/i,
      /(.)\1{2,}/, // Same character repeated 3+ times
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        throw new BadRequestException(
          'Password contains common patterns. Please choose a stronger password',
        );
      }
    }
  }

  /**
   * Rate limit OTP requests
   */
  async checkOTPRateLimit(email: string): Promise<void> {
    const key = `otp_requests:${email}`;
    const requests = (await this.cacheManager.get<number>(key)) ?? 0;

    if (requests >= 3) {
      throw new BadRequestException('Too many OTP requests. Please try again in 15 minutes.');
    }

    await this.cacheManager.set(key, requests + 1, this.ATTEMPT_WINDOW * 1000);
  }

  /**
   * Get login attempt statistics for monitoring
   */
  async getLoginAttemptStats(
    email: string,
  ): Promise<{ total: number; failed: number; successful: number }> {
    const emailKey = `login_attempts:email:${email}`;
    const attempts = (await this.cacheManager.get<LoginAttempt[]>(emailKey)) ?? [];

    const now = Date.now();
    const recentAttempts = attempts.filter(
      (attempt) => now - attempt.timestamp < this.ATTEMPT_WINDOW * 1000,
    );

    return {
      total: recentAttempts.length,
      failed: recentAttempts.filter((a) => !a.successful).length,
      successful: recentAttempts.filter((a) => a.successful).length,
    };
  }
}
