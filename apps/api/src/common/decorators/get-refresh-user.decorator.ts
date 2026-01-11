import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetRefreshUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user; // This will contain { id, email, refreshToken }
});
