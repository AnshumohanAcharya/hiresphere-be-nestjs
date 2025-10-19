import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';

import { getEnvOrThrow } from '@common/utils/env-validator.util';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

interface GitHubUserInfo {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

interface OAuthUserData {
  provider: 'GOOGLE' | 'GITHUB';
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

@Injectable()
export class OAuthService {
  private readonly googleClientId: string;
  private readonly googleClientSecret: string;
  private readonly googleRedirectUri: string;
  private readonly githubClientId: string;
  private readonly githubClientSecret: string;
  private readonly githubRedirectUri: string;

  constructor() {
    this.googleClientId = getEnvOrThrow('GOOGLE_CLIENT_ID', 'Google client ID');
    this.googleClientSecret = getEnvOrThrow('GOOGLE_CLIENT_SECRET', 'Google client secret');
    this.googleRedirectUri = getEnvOrThrow('GOOGLE_CALLBACK_URL', 'Google redirect URI');
    this.githubClientId = getEnvOrThrow('GITHUB_CLIENT_ID', 'GitHub client ID');
    this.githubClientSecret = getEnvOrThrow('GITHUB_CLIENT_SECRET', 'GitHub client secret');
    this.githubRedirectUri = getEnvOrThrow('GITHUB_CALLBACK_URL', 'GitHub redirect URI');
  }

  /**
   * Exchange Google authorization code for user data
   */
  async getGoogleUserData(code: string): Promise<OAuthUserData> {
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: this.googleClientId,
        client_secret: this.googleClientSecret,
        redirect_uri: this.googleRedirectUri,
        grant_type: 'authorization_code',
      });

      const { access_token } = tokenResponse.data;

      // Get user info using access token
      const userResponse = await axios.get<GoogleUserInfo>(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const user = userResponse.data;

      return {
        provider: 'GOOGLE',
        providerId: user.id,
        email: user.email,
        firstName: user.given_name ?? '',
        lastName: user.family_name ?? '',
        avatar: user.picture,
      };
    } catch (_error) {
      throw new UnauthorizedException('Failed to authenticate with Google');
    }
  }

  /**
   * Exchange GitHub authorization code for user data
   */
  async getGitHubUserData(code: string): Promise<OAuthUserData> {
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          code,
          client_id: this.githubClientId,
          client_secret: this.githubClientSecret,
          redirect_uri: this.githubRedirectUri,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      const { access_token } = tokenResponse.data;

      // Get user info
      const userResponse = await axios.get<GitHubUserInfo>('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const user = userResponse.data;

      // Get primary email if not available
      let email = user.email;
      if (!email) {
        const emailsResponse = await axios.get<GitHubEmail[]>(
          'https://api.github.com/user/emails',
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          },
        );

        const primaryEmail = emailsResponse.data.find((e) => e.primary && e.verified);
        email = primaryEmail?.email ?? emailsResponse.data[0]?.email ?? '';
      }

      // Parse name
      const nameParts = (user.name ?? '').split(' ');
      const firstName = nameParts[0] ?? user.login;
      const lastName = nameParts.slice(1).join(' ') ?? '';

      return {
        provider: 'GITHUB',
        providerId: user.id.toString(),
        email,
        firstName,
        lastName,
        avatar: user.avatar_url,
      };
    } catch (_error) {
      throw new UnauthorizedException('Failed to authenticate with GitHub');
    }
  }

  /**
   * Generate OAuth authorization URL for Google
   */
  getGoogleAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.googleClientId,
      redirect_uri: this.googleRedirectUri,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Generate OAuth authorization URL for GitHub
   */
  getGitHubAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.githubClientId,
      redirect_uri: this.githubRedirectUri,
      scope: 'user:email',
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }
}
