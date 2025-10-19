import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

import { getEnvOrThrow } from '@common/utils/env-validator.util';

import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: getEnvOrThrow('GOOGLE_CLIENT_ID', 'Google client ID'),
      clientSecret: getEnvOrThrow('GOOGLE_CLIENT_SECRET', 'Google client secret'),
      callbackURL: getEnvOrThrow('GOOGLE_CALLBACK_URL', 'Google callback URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user = await this.authService.validateOAuthUser({
      provider: 'GOOGLE',
      providerId: id,
      email: emails[0]?.value ?? '',
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      avatar: photos?.length > 0 ? photos[0]?.value : undefined,
    });

    done(null, user);
  }
}
