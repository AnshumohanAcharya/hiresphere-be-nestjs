import { LoginDto, RegisterDto } from '@app/contracts';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { AuthHelpers } from './helpers';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authHelper: AuthHelpers,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    try {
      return await this.usersService.create(dto, hashedPassword);
    } catch (error: unknown) {
      // Industrial Standard: Use a type guard for Prisma Errors
      if (error instanceof Error && 'code' in error) {
        const prismaError = error as { code: string };
        if (prismaError.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
      }

      throw new InternalServerErrorException('Registration failed');
    }
  }

  async login(dto: LoginDto) {
    // Use the explicit Auth method
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new ConflictException('Invalid credentials');

    const isPasswordValid = await argon2.verify(user.password, dto.password);
    if (!isPasswordValid) throw new ConflictException('Invalid credentials');

    const tokens = await this.authHelper.generateTokens(user.id, user.email);
    await this.authHelper.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async refresh(userId: string, refreshToken: string) {
    // Use the explicit Auth method
    const user = await this.usersService.findByIdWithAuth(userId);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access Denied');
    }

    const isTokenMatching = await argon2.verify(user.refreshTokenHash, refreshToken);

    if (!isTokenMatching) {
      // REUSE DETECTION: If token doesn't match, clear all sessions
      await this.logout(userId);
      throw new UnauthorizedException('Security Alert: Potential token reuse detected.');
    }

    const tokens = await this.authHelper.generateTokens(user.id, user.email);
    await this.authHelper.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    // Clear the hash from DB so the refresh token can never be used again
    await this.usersService.update(userId, { refreshTokenHash: null });
  }
}
