import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GraphqlThrottlerGuard } from './common/guards/graphql-throttler.guard';
import { join } from 'path';
import { CacheModule } from '@nestjs/cache-manager';
import { redisConfig } from './config/redis.config';
import { databaseConfig } from './config/database.config';
import { appConfig } from './config/app.config';
import { graphqlConfig } from './config/graphql.config';
import { emailConfig } from './config/email.config';
import { PrismaModule } from './database/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { JobModule } from './modules/job/job.module';
import { AiInterviewModule } from './modules/ai-interview/ai-interview.module';
import { ResumeModule } from './modules/resume/resume.module';
import { WebRtcModule } from './modules/webrtc/webrtc.module';
import { CheatingDetectionModule } from './modules/cheating-detection/cheating-detection.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, graphqlConfig, emailConfig],
      envFilePath: ['.env'],
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      context: ({ req, res }) => ({ req, res }),
      playground: true,
    }),

    CacheModule.registerAsync(redisConfig.asProvider()),

    // Rate limiting configuration - environment-aware
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const isDevelopment = nodeEnv === 'development';

        // Development: More lenient limits for easier testing
        // Production: Stricter limits for security
        return [
          {
            name: 'default',
            ttl: 60000, // 1 minute
            limit: isDevelopment ? 100 : 20, // 100 req/min in dev, 20 in prod
          },
          {
            name: 'auth',
            ttl: 300000, // 5 minutes
            limit: isDevelopment ? 20 : 5, // 20 req/5min in dev, 5 in prod
          },
        ];
      },
    }),

    PrismaModule,
    AuthModule,
    UserModule,
    JobModule,
    AiInterviewModule,
    ResumeModule,
    WebRtcModule,
    CheatingDetectionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GraphqlThrottlerGuard,
    },
  ],
})
export class AppModule {}
