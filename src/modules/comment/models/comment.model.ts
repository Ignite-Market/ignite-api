import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { presenceValidator } from '@rawmodel/validators';
import { DbTables, PopulateFrom, SerializeFor, SqlModelStatus, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { getQueryParams, selectAndCountQuery } from '../../../lib/database/sql-utils';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';

/**
 * Default content of the deleted content.
 */
export const DELETED_COMMENT_CONTENT = 'This comment has been deleted.';

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
    serializable: [SerializeFor.USER, SerializeFor.INSERT_DB, SerializeFor.SELECT_DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.COMMENT_PREDICTION_SET_ID_NOT_PRESENT
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
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB],
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
  public parent_comment_id: number;

  /**
   * Reply user ID for replies.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public reply_user_id: number;

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
   * Gets all comments for a prediction set with one level of replies.
   */
  async getList(predictionSetId: number, query: BaseQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    // Map URL query with SQL fields.
    const fieldMap = {
      id: 'c.id'
    };

    const { params, filters } = getQueryParams(defaultParams, 'p', fieldMap, { predictionSetId, ...query.serialize() });

    const sqlQuery = {
      qSelect: `
        SELECT 
          ${this.generateSelectFields('c')},
          IF(c.status <> ${SqlModelStatus.DELETED}, c.content, '${DELETED_COMMENT_CONTENT}') AS content,
          u.username,
          u.walletAddress,
          taggedUser.username as taggedUserUsername,
          COALESCE(
            NULLIF(
              JSON_ARRAYAGG(
                IF(r.id IS NOT NULL, 
                  JSON_OBJECT(
                    'id', r.id,
                    'status', r.status,
                    'user_id', r.user_id,
                    'createTime', r.createTime,
                    'updateTime', r.updateTime,
                    'content', IF(r.status <> ${SqlModelStatus.DELETED}, r.content, '${DELETED_COMMENT_CONTENT}'),
                    'parent_comment_id', r.parent_comment_id,
                    'username', ru.username,
                    'walletAddress', ru.walletAddress,
                    'reply_user_id', r.reply_user_id,
                    'taggedUserUsername', replyTaggedUser.username
                  ),
                  NULL
                )
              ),
              JSON_ARRAY(NULL)
            ),
            JSON_ARRAY()
          ) AS replies
        `,
      qFrom: `
        FROM ${DbTables.COMMENT} c
        LEFT JOIN ${DbTables.USER} u
          ON u.id = c.user_id
        LEFT JOIN ${DbTables.USER} taggedUser
          ON taggedUser.id = c.reply_user_id
        LEFT JOIN ${DbTables.COMMENT} r
          ON r.parent_comment_id = c.id
        LEFT JOIN ${DbTables.USER} ru
          ON ru.id = r.user_id
        LEFT JOIN ${DbTables.USER} replyTaggedUser
          ON replyTaggedUser.id = r.reply_user_id
        WHERE c.prediction_set_id = @predictionSetId
          AND c.parent_comment_id IS NULL
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
