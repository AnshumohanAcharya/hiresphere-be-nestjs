import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AuthHelpers {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    // Cache secrets during initialization to reduce ConfigService lookups
    this.accessSecret = configService.get<string>('JWT_ACCESS_SECRET')!;
    this.refreshSecret = configService.get<string>('JWT_REFRESH_SECRET')!;

    if (!this.accessSecret || !this.refreshSecret) {
      throw new InternalServerErrorException('JWT Secrets are not configured');
    }
  }

  async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string | null) {
    const hash = refreshToken ? await argon2.hash(refreshToken) : null;
    await this.usersService.updateRefreshTokenHash(userId, hash);
  }
}
