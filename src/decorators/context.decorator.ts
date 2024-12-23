import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Context parameter decorator.
 */
export const Ctx = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.context;
});
