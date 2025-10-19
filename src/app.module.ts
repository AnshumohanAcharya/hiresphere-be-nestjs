import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 20, // 20 requests per minute (default for all endpoints)
      },
      {
        name: 'auth',
        ttl: 300000, // 5 minutes
        limit: 5, // 5 requests per 5 minutes (for auth endpoints)
      },
    ]),

    PrismaModule,
    AuthModule,
    UserModule,
    JobModule,
    AiInterviewModule,
    ResumeModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GraphqlThrottlerGuard,
    },
  ],
})
export class AppModule {}
