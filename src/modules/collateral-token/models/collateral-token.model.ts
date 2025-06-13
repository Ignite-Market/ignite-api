import { prop } from '@rawmodel/core';
import { floatParser, integerParser, stringParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor, SqlModelStatus } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';
import { getQueryParams, selectAndCountQuery } from '../../../lib/database/sql-utils';

/**
 * Collateral token model.
 */
export class CollateralToken extends AdvancedSQLModel {
  /**
   * Collateral token's table.
   */
  public tableName = DbTables.COLLATERAL_TOKEN;

  /**
   * Collateral token name.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public name: string;

  /**
   * Collateral token symbol.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public symbol: string;

  /**
   * Collateral token address.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public address: string;

  /**
   * Collateral token decimals.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public decimals: number;

  /**
   * Prediction set market funding threshold in collateral token (with token decimals).
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public fundingThreshold: string;

  /**
   * Collateral token USD price ID.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public usdPriceId: string;

  /**
   * Collateral token USD price.
   */
  @prop({
    parser: { resolver: floatParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public usdPrice: number;

  /**
   * Collateral token image URL.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER]
  })
  public imgUrl: string;

  /**
   * Required voting amount in collateral token (with token decimals).
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public requiredVotingAmount: string;

  /**
   * Get list of collateral tokens.
   *
   * @param query Filtering query.
   * @returns List of collateral tokens.
   */
  public async getList(query: BaseQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    // Map URL query with SQL fields.
    const fieldMap = {
      id: 'ct.id'
    };

    const { params, filters } = getQueryParams(defaultParams, 'ct', fieldMap, query.serialize());
    const sqlQuery = {
      qSelect: `
        SELECT 
          ${this.generateSelectFields('ct')}
        `,
      qFrom: `
        FROM ${DbTables.COLLATERAL_TOKEN} ct
        WHERE ct.status <> ${SqlModelStatus.DELETED}
        `,
      qGroup: `
        GROUP BY ct.id
      `,
      qFilter: `
        ORDER BY ${filters.orderStr}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };

    return await selectAndCountQuery(this.getContext().mysql, sqlQuery, params, 'ct.id');
  }
}
