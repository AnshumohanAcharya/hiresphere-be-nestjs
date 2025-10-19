import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from './dto/user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthResponse } from './dto/auth-response.dto';
import { MessageResponse } from './dto/message-response.dto';
import { VerifyEmailInput } from './dto/verify-email.dto';
import { RefreshTokenInput } from './dto/refresh-token.dto';
import { RequestPasswordResetInput } from './dto/request-password-reset.dto';
import { ResetPasswordInput } from './dto/reset-password.dto';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   */
  @Mutation(() => MessageResponse)
  async register(
    @Args('input') registerDto: RegisterDto,
    @Context() context,
  ): Promise<MessageResponse> {
    const ipAddress = context.req?.ip ?? context.req?.connection?.remoteAddress;
    return this.authService.register(registerDto, ipAddress);
  }

  /**
   * Verify email with OTP
   */
  @Mutation(() => MessageResponse)
  async verifyEmail(@Args('input') input: VerifyEmailInput): Promise<MessageResponse> {
    return this.authService.verifyEmail(input.email, input.otp);
  }

  /**
   * Resend verification email
   */
  @Mutation(() => MessageResponse)
  async resendVerificationEmail(@Args('email') email: string): Promise<MessageResponse> {
    return this.authService.resendVerificationEmail(email);
  }

  /**
   * Login with email and password
   */
  @Mutation(() => AuthResponse)
  async login(@Args('input') loginDto: LoginDto, @Context() context): Promise<AuthResponse> {
    const ipAddress = context.req?.ip ?? context.req?.connection?.remoteAddress;
    const userAgent = context.req?.headers?.['user-agent'];
    const deviceInfo = `${userAgent ?? 'unknown'} - ${ipAddress ?? 'unknown'}`;

    return this.authService.login(loginDto, ipAddress, deviceInfo);
  }

  /**
   * Refresh access token using refresh token
   */
  @Mutation(() => AuthResponse)
  async refreshToken(
    @Args('input') input: RefreshTokenInput,
    @Context() context,
  ): Promise<AuthResponse> {
    const userAgent = context.req?.headers?.['user-agent'];
    const ipAddress = context.req?.ip ?? context.req?.connection?.remoteAddress;
    const deviceInfo = `${userAgent ?? 'unknown'} - ${ipAddress ?? 'unknown'}`;

    return this.authService.refreshAccessToken(input.refreshToken, deviceInfo);
  }

  /**
   * Logout - revoke refresh token
   */
  @Mutation(() => MessageResponse)
  async logout(@Args('refreshToken') refreshToken: string): Promise<MessageResponse> {
    return this.authService.logout(refreshToken);
  }

  /**
   * Request password reset
   */
  @Mutation(() => MessageResponse)
  async requestPasswordReset(
    @Args('input') input: RequestPasswordResetInput,
  ): Promise<MessageResponse> {
    return this.authService.requestPasswordReset(input.email);
  }

  /**
   * Reset password with token
   */
  @Mutation(() => MessageResponse)
  async resetPassword(@Args('input') input: ResetPasswordInput): Promise<MessageResponse> {
    return this.authService.resetPassword(input.email, input.token, input.newPassword);
  }

  /**
   * Google OAuth authentication
   * Note: This is a simplified version. In production, you'd handle OAuth flow differently
   * with proper callback URLs and state management
   */
  @Mutation(() => AuthResponse)
  async googleAuth(
    @Args('code') code: string,
    @Context() context: { req?: { ip?: string; connection?: { remoteAddress?: string } } },
  ): Promise<AuthResponse> {
    const deviceInfo = context.req?.ip ?? context.req?.connection?.remoteAddress ?? 'unknown';
    return this.authService.handleGoogleOAuth(code, deviceInfo);
  }

  /**
   * GitHub OAuth authentication
   */
  @Mutation(() => AuthResponse)
  async githubAuth(
    @Args('code') code: string,
    @Context() context: { req?: { ip?: string; connection?: { remoteAddress?: string } } },
  ): Promise<AuthResponse> {
    const deviceInfo = context.req?.ip ?? context.req?.connection?.remoteAddress ?? 'unknown';
    return this.authService.handleGitHubOAuth(code, deviceInfo);
  }

  /**
   * Get current user profile
   */
  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async me(@Context() context: { req: { user: { id: string } } }): Promise<User> {
    return this.authService.getProfile(context.req.user.id);
  }
}
