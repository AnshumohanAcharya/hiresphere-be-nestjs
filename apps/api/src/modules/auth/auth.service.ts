import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { RegisterDto } from '@app/contracts'; // Using path alias

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

  async login(user: any, response: Response) {
    const payload = { sub: user.id, email: user.email };

    // Use separate secrets for Access and Refresh tokens
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: accessToken };
  }
}
