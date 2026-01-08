import { User } from '@prisma/client';
import { Request } from 'express';

import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: User }>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
