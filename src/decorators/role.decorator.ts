import { SetMetadata } from '@nestjs/common';
import { DefaultUserRole } from '../config/types';

/**
 * Roles key definition.
 */
export const ROLE_KEY = 'roles';

/**
 * Roles decorator - adds permission checking to chosen class.  Nest reflection and metadata abilities are used.
 * https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata
 *
 * @param roles Array of allowed roles.
 */
export const Roles = (...roles: DefaultUserRole[]) => SetMetadata(ROLE_KEY, roles);
