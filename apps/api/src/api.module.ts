import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      // In production, we usually use environment variables provided by the OS/Platform
      // In dev, it loads from the root .env
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
