import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Cache } from 'cache-manager';
import * as crypto from 'crypto';

interface TokenPayload {
  sub: string; // userId
  email: string;
  role: string;
}

interface RefreshTokenData {
  userId: string;
  deviceInfo?: string;
  createdAt: number;
}

@Injectable()
export class TokenService {
  private readonly ACCESS_TOKEN_EXPIRATION = '15m';
  private readonly REFRESH_TOKEN_EXPIRATION = 30 * 24 * 60 * 60; // 30 days in seconds

  constructor(
    private readonly jwtService: JwtService,
    _configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    // ConfigService is used implicitly through the JwtService configuration
  }

  /**
   * Generate JWT access token (short-lived)
   */
  generateAccessToken(userId: string, email: string, role: string): string {
    const payload: TokenPayload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRATION,
    });
  }

  /**
   * Generate refresh token and store in Redis
   */
  async generateRefreshToken(userId: string, deviceInfo?: string): Promise<string> {
    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(token);

    // Store in Redis with TTL
    const tokenData: RefreshTokenData = {
      userId,
      deviceInfo,
      createdAt: Date.now(),
    };

    const key = `refresh_token:${hashedToken}`;
    await this.cacheManager.set(
      key,
      JSON.stringify(tokenData),
      this.REFRESH_TOKEN_EXPIRATION * 1000,
    );

    // Add to user's active sessions set
    const userSessionsKey = `user_sessions:${userId}`;
    const existingSessions = (await this.cacheManager.get<string[]>(userSessionsKey)) ?? [];
    existingSessions.push(hashedToken);
    await this.cacheManager.set(
      userSessionsKey,
      existingSessions,
      this.REFRESH_TOKEN_EXPIRATION * 1000,
    );

    return token; // Return unhashed token to send to client
  }

  /**
   * Hash token using SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Validate refresh token
   */
  async validateRefreshToken(token: string): Promise<RefreshTokenData> {
    const hashedToken = this.hashToken(token);
    const key = `refresh_token:${hashedToken}`;

    const data = await this.cacheManager.get<string>(key);

    if (!data) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    try {
      return JSON.parse(data) as RefreshTokenData;
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh token data');
    }
  }

  /**
   * Rotate refresh token - revoke old one and issue new one
   */
  async rotateRefreshToken(
    oldToken: string,
    deviceInfo?: string,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    // Validate old token
    const tokenData = await this.validateRefreshToken(oldToken);

    // Revoke old token
    await this.revokeRefreshToken(oldToken);

    // Generate new tokens
    const userId = tokenData.userId;

    // Note: We need to get user info from DB to generate access token
    // This will be done in the auth service
    const newRefreshToken = await this.generateRefreshToken(userId, deviceInfo);

    return {
      accessToken: '', // Will be filled by auth service with user data
      refreshToken: newRefreshToken,
      userId,
    };
  }

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    const key = `refresh_token:${hashedToken}`;

    // Get token data before deleting
    const data = await this.cacheManager.get<string>(key);

    if (data) {
      const tokenData = JSON.parse(data) as RefreshTokenData;

      // Remove from user's sessions
      const userSessionsKey = `user_sessions:${tokenData.userId}`;
      const sessions = (await this.cacheManager.get<string[]>(userSessionsKey)) ?? [];
      const updatedSessions = sessions.filter((s) => s !== hashedToken);

      if (updatedSessions.length > 0) {
        await this.cacheManager.set(
          userSessionsKey,
          updatedSessions,
          this.REFRESH_TOKEN_EXPIRATION * 1000,
        );
      } else {
        await this.cacheManager.del(userSessionsKey);
      }
    }

    // Delete the token
    await this.cacheManager.del(key);
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const userSessionsKey = `user_sessions:${userId}`;
    const sessions = (await this.cacheManager.get<string[]>(userSessionsKey)) ?? [];

    // Delete all tokens
    for (const hashedToken of sessions) {
      const key = `refresh_token:${hashedToken}`;
      await this.cacheManager.del(key);
    }

    // Delete sessions list
    await this.cacheManager.del(userSessionsKey);
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<RefreshTokenData[]> {
    const userSessionsKey = `user_sessions:${userId}`;
    const sessions = (await this.cacheManager.get<string[]>(userSessionsKey)) ?? [];

    const activeSessions: RefreshTokenData[] = [];

    for (const hashedToken of sessions) {
      const key = `refresh_token:${hashedToken}`;
      const data = await this.cacheManager.get<string>(key);

      if (data) {
        try {
          activeSessions.push(JSON.parse(data) as RefreshTokenData);
        } catch (_error) {
          // Skip invalid data
        }
      }
    }

    return activeSessions;
  }

  /**
   * Verify JWT access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      return await this.jwtService.verify(token);
    } catch (_error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
