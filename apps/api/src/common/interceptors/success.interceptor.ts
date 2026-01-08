import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: true;
  statusCode: number;
  data: T;
  timestamp: string;
}

@Injectable()
export class SuccessInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const status = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: status,
        data: data || null,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
