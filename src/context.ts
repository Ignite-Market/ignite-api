import { JwtTokenType, PopulateFrom } from './config/types';
import { MySql } from './lib/database/mysql';
import { parseJwtToken } from './lib/utils';
import { User } from './modules/user/models/user.model';
import { v4 as uuid } from 'uuid';

export class Context {
  public mysql: MySql;
  public user: User;
  public requestId: string;
  public apiKey: any;

  constructor(reqId: string = null) {
    this.requestId = reqId || uuid();
  }

  /**
   * Tells if current user is authenticated.
   */
  public isAuthenticated(): boolean {
    return !!this.user && this.user.exists() && this.user.isEnabled();
  }

  public setMySql(mysql: MySql): void {
    this.mysql = mysql;
  }

  /**
   * Authenticates user based on received authentication token. Call AMS service
   * @param token Authentication token.
   */
  async authenticate(token: string) {
    this.user = null;
    if (!token) {
      return;
    }
    const { id } = parseJwtToken(JwtTokenType.USER_LOGIN, token);

    if (id) {
      this.user = await new User({}, this).populateById(id);
    }

    return this.user;
  }

  /**
   * Check if user or apiKey has required roles - normally to call an endpoint
   * @param role
   * @returns
   */
  // public hasRole(role: number | number[]) {
  //   if (this.apiKey) {
  //     //Check API roles
  //     return !!this.apiKey.apiKeyRoles.find((x) => x.role_id == role);
  //   } else if (this.user) {
  //     //Check user roles
  //     if (Array.isArray(role)) {
  //       //Check if user has one of required roles
  //       for (const r of role) {
  //         if (this.user.authUser.authUserRoles.find((x) => x.role.id == r)) {
  //           return true;
  //         }
  //       }
  //       return false;
  //     }
  //     //Check if user has specific role
  //     else {
  //       return !!this.user.authUser.authUserRoles.find(
  //         (x) => x.role.id == role
  //       );
  //     }
  //   }

  //   return false;
  // }

  // public hasPermission(permission: number) {
  //   if (this.user) {
  //     return !!this.user.userPermissions.find((x) => x == permission);
  //   }
  //   return false;
  // }
}
