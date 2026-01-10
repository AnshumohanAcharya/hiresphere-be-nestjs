import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';

import { ApiModule } from './api.module';
import { AllExceptionsFilter } from './common/filters/all-exception-filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception-filter';
import { SuccessInterceptor } from './common/interceptors/success.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);
  const httpAdapterHost = app.get(HttpAdapterHost);

  // 1. Catch generic errors
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  // 2. Specifically handle Prisma errors (takes precedence)
  app.useGlobalFilters(new PrismaExceptionFilter());

  app.useGlobalInterceptors(new SuccessInterceptor());

  // 1. Cookie Parser for HttpOnly Refresh Tokens
  app.use(cookieParser());

  // 2. Industrial Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips properties NOT in the DTO
      forbidNonWhitelisted: true, // Throws error if extra properties exist
      transform: true, // Auto-transforms types (e.g., string to number)
    }),
  );

  // 3. CORS with Credentials (Required for cookies)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(3001);
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
