import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { presenceValidator } from '@rawmodel/validators';
import { DbTables, PopulateFrom, SerializeFor, SqlModelStatus, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { getQueryParams, selectAndCountQuery } from '../../../lib/database/sql-utils';
import { ProposalsQueryFilter } from '../dtos/proposals-query-filter';

/**
 * Prediction set proposal model.
 */
export class Proposal extends AdvancedSQLModel {
  /**
   * Prediction set proposal 's table.
   */
  public tableName = DbTables.PROPOSAL;

  /**
   * Round ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public round_id: number;

  /**
   * User ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public user_id: number;

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
  async getList(query: ProposalsQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    // Map URL query with SQL fields.
    const fieldMap = {
      id: 'p.id',
      totalVotes: 'COALESCE(SUM(pv.voteType), 0)'
    };

    const { params, filters } = getQueryParams(defaultParams, 'p', fieldMap, query.serialize());
    const sqlQuery = {
      qSelect: `
        SELECT
          ${this.generateSelectFields('p')},
          COALESCE(SUM(pv.voteType), 0) AS totalVotes,
          u.username,
          u.walletAddress AS userWallet,
          CONCAT(
          '[',
            IF(
              COUNT(pv.id) = 0,
              '',
              GROUP_CONCAT(
                DISTINCT JSON_OBJECT(
                  'id', pv.id,
                  'user_id', pv.user_id,
                  'proposal_id', pv.proposal_id,
                  'voteType', pv.voteType
                )
                ORDER BY pv.id
              )
            ),
          ']'
        ) AS votes
        `,
      qFrom: `
        FROM ${DbTables.PROPOSAL} p
        LEFT JOIN ${DbTables.PROPOSAL_VOTE} pv
          ON pv.proposal_id = p.id
        INNER JOIN ${DbTables.USER} u
          ON p.user_id = u.id
        WHERE p.status <> ${SqlModelStatus.DELETED}
          AND (@search IS NULL
            OR p.question LIKE CONCAT('%', @search, '%')
          )
          AND (@roundId IS NULL
            OR p.round_id = @roundId
          )
          AND (@proposalId IS NULL
            OR p.id = @proposalId
          )
        `,
      qGroup: `
        GROUP BY p.id
      `,
      qFilter: `
        ORDER BY ${filters.orderStr}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };

    const res = await selectAndCountQuery(this.getContext().mysql, sqlQuery, params, 'p.id');
    if (res.items.length) {
      res.items = res.items.map((i: any) => ({ ...i, votes: JSON.parse(i.votes) }));
    }

    return res;
  }
}
