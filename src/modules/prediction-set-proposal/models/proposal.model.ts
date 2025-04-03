import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { presenceValidator } from '@rawmodel/validators';
import { DbTables, PopulateFrom, SerializeFor, SqlModelStatus, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { getQueryParams, selectAndCountQuery } from '../../../lib/database/sql-utils';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';

/**
 * Prediction set proposal model.
 */
export class Proposal extends AdvancedSQLModel {
  /**
   * Prediction set proposal 's table.
   */
  public tableName = DbTables.PROPOSAL;

  /**
   * Round ID - Proposal round  ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public round_id: number;

  /**
   * Question - Proposal question.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROPOSAL_QUESTION_NOT_PRESENT
      }
    ]
  })
  public question: string;

  /**
   * General resolution definition - Proposal general resolution definition.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROPOSAL_GENERAL_RESOLUTION_NOT_PRESENT
      }
    ]
  })
  public generalResolutionDef: string;

  /**
   * Outcome resolution definition - Proposal outcome resolution definition.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROPOSAL_OUTCOME_RESOLUTION_NOT_PRESENT
      }
    ]
  })
  public outcomeResolutionDef: string;

  /**
   * Get list of proposals.
   *
   * @param query Filtering query.
   * @returns List of proposals.
   */
  async getList(query: BaseQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    // Map URL query with SQL fields.
    const fieldMap = {
      id: 'p.id'
    };

    const { params, filters } = getQueryParams(defaultParams, 'p', fieldMap, query.serialize());
    const sqlQuery = {
      qSelect: `
        SELECT p.*
        `,
      qFrom: `
        FROM ${DbTables.PROPOSAL} p
        WHERE p.status <> ${SqlModelStatus.DELETED}
        `,
      qGroup: `
        GROUP BY p.id
      `,
      qFilter: `
        ORDER BY ${filters.orderStr}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };

    return await selectAndCountQuery(this.getContext().mysql, sqlQuery, params, 'p.id');
  }
}
