import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { getEnvOrThrow } from '@/common/utils/env-validator.util';

@Injectable()
export class AudioAuthGuard extends AuthGuard('jwt') {
  constructor(private jwtService: JwtService) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Try to extract token from multiple sources
    let token: string | null = null;

    // 1. Try Authorization header (Bearer token)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 2. Try cookie (access_token - check common cookie names)
    token ??=
      request.cookies?.accessToken ?? request.cookies?.access_token ?? request.cookies?.token;

    // 3. Try query parameter (for audio elements)
    if (!token && request.query?.token) {
      token = request.query.token;
    }

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    // Verify token
    try {
      const secret = getEnvOrThrow('JWT_SECRET', 'JWT secret');
      const payload = this.jwtService.verify(token, { secret });

      // Attach user to request
      request.user = payload;
      return true;
    } catch (_error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
