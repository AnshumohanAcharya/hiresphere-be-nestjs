import { DatabaseModule } from '@app/database';
import { SharedQueueModule } from '@app/queue';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { JobAggregatorModule } from './modules/job-aggregator/job-aggregator.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      envFilePath: '.env',
    }),
    DatabaseModule,
    SharedQueueModule,
    AuthModule,
    UsersModule,
    JobAggregatorModule,
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
