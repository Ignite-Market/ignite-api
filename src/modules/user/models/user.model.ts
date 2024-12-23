import { prop } from '@rawmodel/core';
import { stringParser } from '@rawmodel/parsers';
import { DbTables, JwtTokenType, PopulateFrom, SerializeFor } from '../../../config/types';
import type { Context } from '../../../context';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { generateJwtToken } from '../../../lib/utils';

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

  public constructor(data: any, context?: Context) {
    super(data, context);
  }

  /**
   *
   * @param address
   * @returns
   */
  async populateByWalletAddress(address: string) {
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
   *
   */
  login() {
    this.token = generateJwtToken(JwtTokenType.USER_LOGIN, { id: this.id });
  }
}
