import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';

import { getEnvOrThrow } from '@common/utils/env-validator.util';

import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: getEnvOrThrow('GITHUB_CLIENT_ID', 'GitHub client ID'),
      clientSecret: getEnvOrThrow('GITHUB_CLIENT_SECRET', 'GitHub client secret'),
      callbackURL: getEnvOrThrow('GITHUB_CALLBACK_URL', 'GitHub callback URL'),
      scope: ['user:email'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile): Promise<any> {
    const { id, displayName, emails, photos } = profile;

    // Parse name
    const nameParts = (displayName ?? '').split(' ');
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') ?? '';

    const user = await this.authService.validateOAuthUser({
      provider: 'GITHUB',
      providerId: id,
      email: (emails && emails.length > 0 ? emails[0]?.value : '') ?? '',
      firstName,
      lastName,
      avatar: photos && photos.length > 0 ? photos[0]?.value : undefined,
    });

    return user;
  }
}
