import { prop } from '@rawmodel/core';
import { stringParser } from '@rawmodel/parsers';
import { DbTables, JwtTokenType, PopulateFrom, SerializeFor, SqlModelStatus } from '../../../config/types';
import type { Context } from '../../../context';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { generateJwtToken } from '../../../lib/utils';
import { PoolConnection } from 'mysql2/promise';
import { Role } from './role.model';

/**
 * User model.
 */
export class User extends AdvancedSQLModel {
  /**
   * User's table.
   */
  public tableName = DbTables.USER;

  /**
   * User's name - generated from wallet address.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB]
  })
  name: string;

  /**
   * User's wallet address.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB]
  })
  walletAddress: string;

  /**
   * User's authentication token.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [],
    serializable: [SerializeFor.USER]
  })
  public token: string;

  /**
   * User's roles property definition.
   */
  @prop({
    parser: { resolver: Role, array: true },
    serializable: [SerializeFor.USER],
    populatable: [PopulateFrom.DB],
    validators: [],
    defaultValue: () => []
  })
  public roles: Role[];

  /**
   * User model constructor.
   * @param data User data.
   * @param context Application context.
   */
  public constructor(data: any, context?: Context) {
    super(data, context);
  }

  /**
   * Populates user by wallet address.
   * @param address Wallet address.
   * @returns Populated user.
   */
  async populateByWalletAddress(address: string): Promise<User> {
    this.reset();

    const data = await this.db().paramExecute(
      `
      SELECT * FROM ${DbTables.USER} 
      WHERE walletAddress = @address
    `,
      {
        address
      }
    );

    if (data && data.length) {
      this.populate(data[0], PopulateFrom.DB);
    }

    return this;
  }

  /**
   * Logins user - generates JWT token.
   */
  login() {
    this.token = generateJwtToken(JwtTokenType.USER_LOGIN, { id: this.id });
  }

  /**
   * Adds role to the user.
   *
   * @param roleId Role's id.
   */
  public async addRole(roleId: number, conn?: PoolConnection, populateRoles: boolean = true): Promise<User> {
    await this.db().paramExecute(
      `
        INSERT IGNORE INTO ${DbTables.USER_ROLES} (user_id, role_id)
        VALUES (@userId, @roleId)
      `,
      { userId: this.id, roleId },
      conn
    );

    if (populateRoles) {
      await this.populateRoles(conn);
    }
    return this;
  }

  /**
   * Returns true if user has provided role, false otherwise.
   * @param roleId id of the role in question
   * @param conn (optional) database connection
   */
  public async hasRole(roleId: number, conn?: PoolConnection): Promise<boolean> {
    if (!this.roles || !this.roles.length) {
      await this.populateRoles(conn);
    }

    for (const r of this.roles) {
      if (r.id === roleId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Populates user's roles and their role permissions.
   * @param conn (optional) Database connection.
   * @returns The same instance of the object, but with the roles freshly populated.
   */
  public async populateRoles(conn?: PoolConnection): Promise<User> {
    this.roles = [];

    const rows = await this.db().paramExecute(
      `
        SELECT *
        FROM ${DbTables.ROLES} r
        JOIN ${DbTables.USER_ROLES} ur
          ON ur.role_id = r.id
        WHERE ur.user_id = @userId
          AND r.status < ${SqlModelStatus.DELETED}
        ORDER BY r.id;
      `,
      { userId: this.id },
      conn
    );

    if (rows && rows.length) {
      this.roles = rows.map((row) => new Role(row));
    }

    return this;
  }
}
