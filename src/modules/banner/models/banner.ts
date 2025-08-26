import { prop } from '@rawmodel/core';
import { booleanParser, integerParser, stringParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor, SqlModelStatus } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';
import { getQueryParams, selectAndCountQuery } from '../../../lib/database/sql-utils';

/**
 * User prediction set watchlist model.
 */
export class Banner extends AdvancedSQLModel {
  /**
   * Banner table.
   */
  public tableName = DbTables.BANNER;

  /**
   * Prediction set ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public prediction_set_id: number;

  /**
   * Banner title
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public title: string;

  /**
   * Banner description
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public description: string;

  /**
   * Banner button label
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public button: string;

  /**
   * Banner image url
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public imageUrl: string;

  /**
   * Banner status
   */
  @prop({
    parser: { resolver: booleanParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB],
    defaultValue: () => true,
    emptyValue: () => true
  })
  public isActive: boolean;

  /**
   * Get active banners.
   *
   * @returns Active banners.
   */
  public async getActive() {
    return await this.db().paramExecute(`
      SELECT * FROM ${DbTables.BANNER}
      WHERE status <> ${SqlModelStatus.DELETED}
      AND isActive = 1
      ORDER BY id DESC
      LIMIT 3
    `);
  }

  /**
   * Get list of banners.
   *
   * @param query Filtering query.
   * @returns List of banners.
   */
  async getList(query: BaseQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    // Map URL query with SQL fields.
    const fieldMap = {
      id: 'b.id'
    };

    const { params, filters } = getQueryParams(defaultParams, 'b', fieldMap, query.serialize());
    const sqlQuery = {
      qSelect: `
        SELECT
          ${this.generateSelectFields('b')},
          p.question AS predictionSetQuestion
        `,
      qFrom: `
        FROM ${DbTables.BANNER} b
        LEFT JOIN ${DbTables.PREDICTION_SET} p
          ON b.prediction_set_id = p.id
        WHERE b.status <> ${SqlModelStatus.DELETED}
          AND (@search IS NULL
            OR b.title LIKE CONCAT('%', @search, '%')
            OR b.description LIKE CONCAT('%', @search, '%')
          )
        `,
      qGroup: `
        GROUP BY b.id
      `,
      qFilter: `
        ORDER BY ${filters.orderStr}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };

    return await selectAndCountQuery(this.getContext().mysql, sqlQuery, params, 'b.id');
  }
}
