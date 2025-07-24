import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { PoolConnection } from 'mysql2/promise';
import { DbTables, JwtTokenType, PopulateFrom, SerializeFor, SqlModelStatus, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { generateJwtToken } from '../../../lib/utils';
import { Role } from './role.model';
import { emailValidator } from '@rawmodel/validators';

export enum UserEmailStatus {
  PENDING = 0,
  VERIFIED = 1
}

/**
 * User model.
 */
export class User extends AdvancedSQLModel {
  /**
   * User's table.
   */
  public tableName = DbTables.USER;

  /**
   * User's username.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB],
    populatable: [PopulateFrom.DB]
  })
  username: string;

  /**
   * User's email.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB],
    populatable: [PopulateFrom.DB],
    validators: [
      {
        resolver: emailValidator(),
        code: ValidatorErrorCode.USER_EMAIL_NOT_VALID
      }
    ]
  })
  email: string;

  /**
   * User's email status.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializeFor.USER, SerializeFor.UPDATE_DB],
    populatable: [PopulateFrom.DB],
    defaultValue: () => UserEmailStatus.PENDING
  })
  emailStatus: UserEmailStatus;

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
   * User's referral id.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB],
    populatable: [PopulateFrom.DB]
  })
  referralId: string;

  /**
   * User's authentication token.
   */
  @prop({
    parser: { resolver: stringParser() },
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
    defaultValue: () => []
  })
  public roles: Role[];

  async populateById(id: number | string, conn?: PoolConnection, forUpdate = false, populateRoles = false): Promise<this> {
    await super.populateById(id, conn, forUpdate);

    if (populateRoles) {
      await this.populateRoles(conn);
    }
    return this;
  }

  /**
   * Populates user by wallet address.
   * @param address Wallet address.
   * @returns Populated user.
   */
  async populateByWalletAddress(address: string, conn?: PoolConnection, populateRoles = false): Promise<User> {
    this.reset();

    const data = await this.db().paramExecute(
      `
      SELECT * FROM ${DbTables.USER} 
      WHERE walletAddress = @address
    `,
      {
        address
      },
      conn
    );

    if (data && data.length) {
      this.populate(data[0], PopulateFrom.DB);
    }

    if (populateRoles) {
      await this.populateRoles(conn);
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
   * Populates user by email.
   * @param email Email.
   * @returns Populated user.
   */
  async populateByEmail(email: string, conn?: PoolConnection): Promise<User> {
    if (!email) {
      throw new Error('Email should not be null');
    }

    this.reset();

    const data = await this.db().paramExecute(
      `
      SELECT * FROM ${DbTables.USER} 
      WHERE email = @email
    `,
      { email },
      conn
    );
    return data?.length ? this.populate(data[0], PopulateFrom.DB) : this.reset();
  }

  /**
   * Adds role to the user.
   *
   * @param roleId Role's id.
   */
  public async addRole(roleId: number, conn?: PoolConnection, populateRoles: boolean = true): Promise<User> {
    await this.db().paramExecute(
      `
        INSERT IGNORE INTO ${DbTables.USER_ROLE} (user_id, role_id)
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
    if (!this.id) {
      return this;
    }

    this.roles = [];

    const rows = await this.db().paramExecute(
      `
        SELECT *
        FROM ${DbTables.ROLE} r
        JOIN ${DbTables.USER_ROLE} ur
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
