import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { presenceValidator } from '@rawmodel/validators';
import { DbTables, PopulateFrom, SerializeFor, SqlModelStatus, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { getQueryParams, selectAndCountQuery } from '../../../lib/database/sql-utils';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';

/**
 * Comment model.
 */
export class Comment extends AdvancedSQLModel {
  /**
   * Comment table.
   */
  public tableName = DbTables.COMMENT;

  /**
   * Prediction set ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.INSERT_DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_ID_NOT_PRESENT
      }
    ]
  })
  public prediction_set_id: number;

  /**
   * User ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.INSERT_DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.USER_ID_NOT_PRESENT
      }
    ]
  })
  public user_id: number;

  /**
   * Parent comment ID for replies.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public parent_comment_id?: number;

  /**
   * Comment content.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.COMMENT_CONTENT_NOT_PRESENT
      }
    ]
  })
  public content: string;

  /**
   * Gets all comments for a prediction set.
   */
  async getList(predictionSetId: number, query: BaseQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    // Map url query with sql fields.
    const fieldMap = {
      id: 'c.id'
    };

    const { params, filters } = getQueryParams(defaultParams, 'p', fieldMap, { predictionSetId, ...query.serialize() });

    const sqlQuery = {
      qSelect: `
        SELECT 
          ${this.generateSelectFields('c')},
          IF(c.status <> ${SqlModelStatus.DELETED}, c.content, 'This comment has been deleted') AS content,
          u.name AS username
        `,
      qFrom: `
        FROM ${DbTables.COMMENT} c
        LEFT JOIN ${DbTables.USER} u
          ON u.id = c.user_id
        WHERE c.prediction_set_id = @predictionSetId
        `,
      qGroup: `
        GROUP BY c.id
      `,
      qFilter: `
        ORDER BY ${filters.orderStr}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };
    return await selectAndCountQuery(this.getContext().mysql, sqlQuery, params, 'c.id');
  }
}
