import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from './services/token.service';
import { OtpService, OTPType } from './services/otp.service';
import { SecurityService } from './services/security.service';
import { OAuthService } from './services/oauth.service';
import { EmailService } from '../email/email.service';
import { AuthResponse } from './dto/auth-response.dto';
import { MessageResponse } from './dto/message-response.dto';

interface OAuthUserData {
  provider: 'GOOGLE' | 'GITHUB';
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly otpService: OtpService,
    private readonly securityService: SecurityService,
    private readonly oauthService: OAuthService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Register a new user with email/password
   */
  async register(registerDto: RegisterDto, _ipAddress?: string): Promise<MessageResponse> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate password strength
    this.securityService.validatePasswordStrength(registerDto.password);

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Create user (isVerified = false)
    await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role ?? 'CANDIDATE',
        provider: 'LOCAL',
        isVerified: false,
      },
    });

    // Generate and send OTP
    const otp = await this.otpService.createOTP(registerDto.email, OTPType.EMAIL_VERIFY);
    await this.emailService.sendVerificationEmail(registerDto.email, otp);

    this.logger.log(`User registered: ${registerDto.email}`);

    return {
      success: true,
      message: 'Registration successful! Please check your email for verification code.',
    };
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(email: string, otp: string): Promise<MessageResponse> {
    // Verify OTP
    await this.otpService.verifyOTP(email, otp, OTPType.EMAIL_VERIFY);

    // Update user verification status
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(email, user.firstName ?? 'User');

    this.logger.log(`Email verified: ${email}`);

    return {
      success: true,
      message: 'Email verified successfully! You can now log in.',
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<MessageResponse> {
    // Check rate limit
    await this.securityService.checkOTPRateLimit(email);

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate and send new OTP
    const otp = await this.otpService.createOTP(email, OTPType.EMAIL_VERIFY);
    await this.emailService.sendVerificationEmail(email, otp);

    return {
      success: true,
      message: 'Verification code sent! Please check your email.',
    };
  }

  /**
   * Login with email/password
   */
  async login(loginDto: LoginDto, ipAddress?: string, deviceInfo?: string): Promise<AuthResponse> {
    // Check login attempts and account lockout
    await this.securityService.checkLoginAttempts(loginDto.email, ipAddress ?? 'unknown');

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { profile: true },
    });

    // Validate credentials
    if (!user?.password) {
      await this.securityService.recordLoginAttempt(loginDto.email, ipAddress ?? 'unknown', false);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      await this.securityService.recordLoginAttempt(loginDto.email, ipAddress ?? 'unknown', false);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Note: We allow login even if email is not verified
    // but you can enforce verification by uncommenting below:
    // if (!user.isVerified) {
    //   throw new UnauthorizedException('Please verify your email first');
    // }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Record successful login
    await this.securityService.recordLoginAttempt(loginDto.email, ipAddress ?? 'unknown', true);
    await this.securityService.clearLoginAttempts(loginDto.email);

    // Generate tokens
    const accessToken = this.tokenService.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id, deviceInfo);

    this.logger.log(`User logged in: ${user.email}`);

    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword as any,
      expiresIn: 900, // 15 minutes
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string, deviceInfo?: string): Promise<AuthResponse> {
    // Validate and rotate refresh token
    const tokenData = await this.tokenService.validateRefreshToken(refreshToken);
    const userId = tokenData.userId;

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Revoke old token and generate new ones
    await this.tokenService.revokeRefreshToken(refreshToken);
    const newRefreshToken = await this.tokenService.generateRefreshToken(userId, deviceInfo);
    const accessToken = this.tokenService.generateAccessToken(user.id, user.email, user.role);

    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: userWithoutPassword as any,
      expiresIn: 900, // 15 minutes
    };
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string): Promise<MessageResponse> {
    await this.tokenService.revokeRefreshToken(refreshToken);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<MessageResponse> {
    // Check rate limit
    await this.securityService.checkOTPRateLimit(email);

    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        success: true,
        message: 'If the email exists, a reset link has been sent.',
      };
    }

    // Generate reset token
    const token = await this.otpService.createPasswordResetToken(email);
    await this.emailService.sendPasswordResetEmail(email, token);

    this.logger.log(`Password reset requested: ${email}`);

    return {
      success: true,
      message: 'If the email exists, a reset link has been sent.',
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(email: string, token: string, newPassword: string): Promise<MessageResponse> {
    // Verify reset token
    await this.otpService.verifyPasswordResetToken(email, token);

    // Validate password strength
    this.securityService.validatePasswordStrength(newPassword);

    // Find user
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Revoke all existing sessions for security
    await this.tokenService.revokeAllUserTokens(user.id);

    this.logger.log(`Password reset successful: ${email}`);

    return {
      success: true,
      message: 'Password reset successful! Please log in with your new password.',
    };
  }

  /**
   * Validate OAuth user - find existing or create new
   */
  async validateOAuthUser(oauthData: OAuthUserData): Promise<any> {
    const { provider, providerId, email, firstName, lastName, avatar } = oauthData;

    // Find user by provider ID
    const whereClause = provider === 'GOOGLE' ? { googleId: providerId } : { githubId: providerId };

    let user = await this.prisma.user.findUnique({
      where: whereClause,
      include: { profile: true },
    });

    // If not found by provider ID, try email
    if (!user && email) {
      user = await this.prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      // If found by email, link the OAuth account
      if (user) {
        const updateData =
          provider === 'GOOGLE' ? { googleId: providerId } : { githubId: providerId };

        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
          include: { profile: true },
        });

        this.logger.log(`Linked ${provider} account to existing user: ${email}`);
      }
    }

    // If still not found, create new user
    if (!user) {
      const userData: any = {
        email,
        firstName,
        lastName,
        avatar,
        provider,
        isVerified: true, // OAuth users are pre-verified
        isActive: true,
      };

      if (provider === 'GOOGLE') {
        userData.googleId = providerId;
      } else {
        userData.githubId = providerId;
      }

      user = await this.prisma.user.create({
        data: userData,
        include: { profile: true },
      });

      // Send welcome email
      await this.emailService.sendWelcomeEmail(email, firstName);

      this.logger.log(`Created new user via ${provider}: ${email}`);
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Handle Google OAuth authentication
   */
  async handleGoogleOAuth(code: string, deviceInfo?: string): Promise<AuthResponse> {
    // Exchange code for user data
    const userData = await this.oauthService.getGoogleUserData(code);

    // Validate or create user
    const user = await this.validateOAuthUser(userData);

    // Generate tokens
    const accessToken = this.tokenService.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id, deviceInfo);

    const { password: _, ...userWithoutPassword } = user;

    this.logger.log(`User authenticated via Google OAuth: ${user.email}`);

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
      expiresIn: 900, // 15 minutes
    };
  }

  /**
   * Handle GitHub OAuth authentication
   */
  async handleGitHubOAuth(code: string, deviceInfo?: string): Promise<AuthResponse> {
    // Exchange code for user data
    const userData = await this.oauthService.getGitHubUserData(code);

    // Validate or create user
    const user = await this.validateOAuthUser(userData);

    // Generate tokens
    const accessToken = this.tokenService.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id, deviceInfo);

    const { password: _, ...userWithoutPassword } = user;

    this.logger.log(`User authenticated via GitHub OAuth: ${user.email}`);

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
      expiresIn: 900, // 15 minutes
    };
  }
}
