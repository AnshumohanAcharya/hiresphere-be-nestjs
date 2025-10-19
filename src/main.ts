import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { getEnvAsNumber, getEnvOrDefault } from './common/utils/env-validator.util';
import { createLogger } from './common/utils/logger.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: WinstonModule.createLogger(createLogger()),
  });

  // --- Core Middlewares ---
  // Configure Helmet with CSP for GraphQL Playground
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          imgSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
          connectSrc: ["'self'", 'https://cdn.jsdelivr.net'],
          fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
          workerSrc: ["'self'", 'blob:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cookieParser());
  app.use(compression());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // --- Config Service ---
  const port = getEnvAsNumber('PORT', 4000);
  const env = getEnvOrDefault('NODE_ENV', 'development');
  const clientUrl = getEnvOrDefault('CLIENT_URL', '*');

  // --- CORS ---
  app.enableCors({
    origin: clientUrl,
    credentials: true,
  });

  // --- Global Prefix ---
  app.setGlobalPrefix('api');

  // --- Global Validation (DTOs) ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // --- Graceful Shutdown Hooks (for queues, DBs, etc.) ---
  app.enableShutdownHooks();

  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Hiresphere Backend running on http://localhost:${port} [${env}]`);
}

void bootstrap();
