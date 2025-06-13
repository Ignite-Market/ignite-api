import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor, SqlModelStatus } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';
import { getQueryParams, selectAndCountQuery } from '../../../lib/database/sql-utils';
import { PoolConnection } from 'mysql2/promise';

/**
 * Reward type.
 */
export enum RewardType {
  MARKET_FUNDING = 1,
  BUYING_SHARES = 2,
  SELLING_SHARES = 3,
  MARKET_WINNER = 4,
  PROPOSAL_WINNER = 5,
  PROPOSAL_VOTE = 6,
  USER_REFERRAL = 7,
  DAILY_LOGIN = 8
}

/**
 * Reward points model.
 */
export class RewardPoints extends AdvancedSQLModel {
  /**
   * Reward points's table.
   */
  public tableName = DbTables.REWARD_POINTS;

  /**
   * Reward points name.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public name: string;

  /**
   * Reward points description.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public description: string;

  /**
   * Reward points reason.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public reason: string;

  /**
   * Reward points type.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public type: RewardType;

  /**
   * Reward points value.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public value: number;

  /**
   * Populated model by type.
   * @param type Reward type.
   * @param conn Pool connection.
   * @param forUpdate Lock model for update.
   * @returns Populated model.
   */
  public async populateByType(type: RewardType, conn?: PoolConnection, forUpdate = false): Promise<this> {
    if (!type) {
      return this.reset();
    }
    this.reset();

    const data = await this.getContext().mysql.paramExecute(
      `
          SELECT *
          FROM ${DbTables.REWARD_POINTS}
          WHERE
            type = @type
            AND status <> ${SqlModelStatus.DELETED}
          ${conn && forUpdate ? 'FOR UPDATE' : ''};
          `,
      { type },
      conn
    );

    return data?.length ? this.populate(data[0], PopulateFrom.DB) : this.reset();
  }

  /**
   * Get list of reward points.
   * @param query Filtering query.
   * @returns List of reward points.
   */
  public async getList(query: BaseQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    // Map URL query with SQL fields.
    const fieldMap = {
      id: 'rp.id'
    };

    const { params, filters } = getQueryParams(defaultParams, 'rp', fieldMap, query.serialize());
    const sqlQuery = {
      qSelect: `
        SELECT 
          ${this.generateSelectFields('rp')}
        `,
      qFrom: `
        FROM ${DbTables.REWARD_POINTS} rp
        WHERE rp.status <> ${SqlModelStatus.DELETED}
        `,
      qGroup: `
        GROUP BY rp.id
      `,
      qFilter: `
        ORDER BY ${filters.orderStr || 'rp.value ASC'}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };

    return await selectAndCountQuery(this.getContext().mysql, sqlQuery, params, 'rp.id');
  }
}
