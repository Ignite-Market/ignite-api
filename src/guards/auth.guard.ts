import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Context } from '../context';
import { CodeException } from '../lib/exceptions/exceptions';
import { DefaultUserRole, UnauthorizedErrorCode } from '../config/types';
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
    // else if (requiredPermissions.length > 0) {
    //   //Check required roles and required permissions. Both are passed through @Permission decorator.
    //   //User should have all permissions and at least one of required roles.
    //   for (const requiredPerm of requiredPermissions.filter(
    //     (x) => x.permission,
    //   )) {
    //     if (!context.hasPermission(requiredPerm.permission)) {
    //       return false;
    //     }
    //   }

    //   for (const requiredPerm of requiredPermissions.filter((x) => x.role)) {
    //     if (context.hasRole(requiredPerm.role)) {
    //       return true;
    //     }
    //   }
    //   throw new CodeException({
    //     code: ForbiddenErrorCodes.FORBIDDEN,
    //     status: HttpStatus.FORBIDDEN,
    //     errorMessage: 'Insufficient permissions',
    //   });
    // }

    // TODO: Add role support.

    return true;
  }
}
