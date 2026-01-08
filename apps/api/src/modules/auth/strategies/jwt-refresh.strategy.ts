import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Extract the token from the cookie we set in AuthService.login
          return request?.cookies?.refresh_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || 'fallback',
      passReqToCallback: true, // Allows us to access the request in validate() if needed
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    // Return the user data along with the token for rotation logic
    return {
      id: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}
