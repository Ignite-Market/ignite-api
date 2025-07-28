import { v4 as uuid } from 'uuid';
import { JwtTokenType } from './config/types';
import { MySql } from './lib/database/mysql';
import { parseJwtToken } from './lib/utils';
import { User } from './modules/user/models/user.model';

/**
 * Application context.
 */
export class Context {
  public mysql: MySql;
  public user: User;
  public requestId: string;

  constructor(reqId: string = null) {
    this.requestId = reqId || uuid();
  }

  /**
   * Tells if current user is authenticated.
   */
  public isAuthenticated(): boolean {
    return !!this.user && this.user.exists() && this.user.isEnabled();
  }

  /**
   * Sets MySQL connection.
   * @param mysql
   */
  public setMySql(mysql: MySql): void {
    this.mysql = mysql;
  }

  /**
   * Authenticates user based on received authentication token. Call AMS service
   * @param token Authentication token.
   */
  async authenticate(token: string): Promise<User> {
    this.user = null;
    if (!token) {
      return;
    }

    const { id } = parseJwtToken(JwtTokenType.USER_LOGIN, token);
    if (id) {
      this.user = await new User({}, this).populateById(id, null, false, true);
    }

    return this.user;
  }

  /**
   * Check if user has required roles - normally to call an endpoint.
   * @param role Role ID or array of role IDs.
   * @returns True if user has required role(s), false otherwise.
   */
  public async hasRole(role: number | number[]): Promise<boolean> {
    if (this.user) {
      // Check user roles
      if (Array.isArray(role)) {
        // Check if user has one of required roles
        for (const r of role) {
          if (await this.user.hasRole(r)) {
            return true;
          }
        }
        return false;
      }
      // Check if user has specific role
      else {
        return !!(await this.user.hasRole(role));
      }
    }

    return false;
  }
}
