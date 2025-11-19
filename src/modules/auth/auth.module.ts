import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { TokenService } from './services/token.service';
import { OtpService } from './services/otp.service';
import { SecurityService } from './services/security.service';
import { OAuthService } from './services/oauth.service';
import { EmailModule } from '../email/email.module';
import { AudioAuthGuard } from './guards/audio-auth.guard';

@Module({
  imports: [
    PassportModule,
    CacheModule.register(), // Add CacheModule for services
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m', // Short-lived access tokens
        },
      }),
      inject: [ConfigService],
    }),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthResolver,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    GithubStrategy,
    TokenService,
    OtpService,
    SecurityService,
    OAuthService,
    AudioAuthGuard,
  ],
  exports: [AuthService, TokenService, JwtModule, AudioAuthGuard],
})
export class AuthModule {}
