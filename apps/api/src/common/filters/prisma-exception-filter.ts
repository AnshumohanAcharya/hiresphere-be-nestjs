import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation (e.g. Email already exists)
        const status = HttpStatus.CONFLICT;
        return response.status(status).json({
          statusCode: status,
          message: 'Conflict: A record with this unique identifier already exists.',
          error: 'Conflict',
        });
      }
      case 'P2025': {
        // Record not found
        const status = HttpStatus.NOT_FOUND;
        return response.status(status).json({
          statusCode: status,
          message: 'The requested record was not found.',
          error: 'Not Found',
        });
      }
      default:
        // Let the default NestJS handler take over for unknown Prisma errors
        super.catch(exception, host);
        break;
    }
  }
}
