import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Context } from '../context';
import { CodeException } from '../lib/exceptions/exceptions';
import { AuthorizationErrorCode, DefaultUserRole, UnauthorizedErrorCode } from '../config/types';
import { ROLE_KEY } from '../decorators/role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(Reflector.name) private readonly reflector: Reflector) {}

  public async canActivate(execCtx: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndMerge<DefaultUserRole[]>(ROLE_KEY, [execCtx.getHandler(), execCtx.getClass()]);

    const context: Context = execCtx.getArgByIndex(0).context;
    // eslint-disable-next-line sonarjs/prefer-single-boolean-return
    if (!context.isAuthenticated()) {
      throw new CodeException({
        code: UnauthorizedErrorCode.UNAUTHORIZED,
        status: HttpStatus.UNAUTHORIZED,
        errorMessage: 'User is not authenticated!'
      });
    }

    if (requiredRoles.length) {
      const hasRoles = await context.hasRole(requiredRoles);

      if (!hasRoles) {
        throw new CodeException({
          status: HttpStatus.FORBIDDEN,
          code: AuthorizationErrorCode.INSUFFICIENT_ROLES,
          sourceFunction: `${this.constructor.name}/canActivate`,
          errorMessage: 'Insufficient roles'
        });
      }
    }

    return true;
  }
}
