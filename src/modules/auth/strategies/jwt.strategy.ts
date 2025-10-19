import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { getEnvOrThrow } from '@/common/utils/env-validator.util';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getEnvOrThrow('JWT_SECRET', 'JWT secret'),
    });
  }

  async validate(payload: any) {
    const user = await this.authService.getProfile(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
