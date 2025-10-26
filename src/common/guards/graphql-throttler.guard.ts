import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GraphqlThrottlerGuard extends ThrottlerGuard {
  override getRequestResponse(context: ExecutionContext) {
    // Check if this is a GraphQL request
    const contextType = context.getType<string>();

    if (contextType === 'graphql') {
      // Handle GraphQL requests
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext();
      return { req: ctx.req, res: ctx.res };
    }

    // Handle REST/HTTP requests
    const http = context.switchToHttp();
    return { req: http.getRequest(), res: http.getResponse() };
  }
}
