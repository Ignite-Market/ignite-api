import { prop } from '@rawmodel/core';
import { dateParser, integerParser } from '@rawmodel/parsers';
import { presenceValidator } from '@rawmodel/validators';
import { DbTables, ErrorCode, PopulateFrom, SerializeFor, SqlModelStatus, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { enumInclusionValidator } from '../../../lib/validators';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';
import { getQueryParams, selectAndCountQuery } from '../../../lib/database/sql-utils';
import { PoolConnection } from 'mysql2/promise';
import { ProposalRoundsQueryFilter } from '../dtos/proposals-query-filter copy';

/**
 * Proposal round status.
 */
export enum ProposalRoundStatus {
  INITIALIZED = 1,
  ACTIVE = 2,
  FINISHED = 3
}

/**
 * Prediction set proposal round model.
 */
export class ProposalRound extends AdvancedSQLModel {
  /**
   * Prediction set proposal round's table.
   */
  public tableName = DbTables.PROPOSAL_ROUND;

  @prop({
    parser: {
      resolver: integerParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_QUESTION_NOT_PRESENT
      }
    ]
  })
  rewardPoints: number;

  /**
   * Start time - When the proposal round starts.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_START_TIME_NOT_PRESENT
      }
    ]
  })
  public startTime: Date;

  /**
   * End time - When the proposal round ends.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_END_TIME_NOT_PRESENT
      }
    ]
  })
  public endTime: Date;

  /**
   * Proposal round status.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER, PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB],
    validators: [
      {
        resolver: enumInclusionValidator(ProposalRoundStatus),
        code: ErrorCode.INVALID_STATUS
      }
    ],
    emptyValue: () => ProposalRoundStatus.INITIALIZED,
    defaultValue: () => ProposalRoundStatus.INITIALIZED
  })
  public roundStatus: ProposalRoundStatus;

  /**
   * Proposal round winner ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public winner_id: number;
  /**
   * Get active proposal round.
   *
   * @param conn Pool connection.
   * @param forUpdate Whether to update the round.
   * @returns Active proposal round.
   */
  public async getActiveRound(conn?: PoolConnection, forUpdate: boolean = false): Promise<this> {
    const data = await this.getContext().mysql.paramExecute(
      `
      SELECT *
      FROM \`${this.tableName}\`
        WHERE status <> ${SqlModelStatus.DELETED}
        AND roundStatus = ${ProposalRoundStatus.ACTIVE}
        AND startTime < NOW()
        AND endTime > NOW()
      ${conn && forUpdate ? 'FOR UPDATE' : ''};
      `,
      {},
      conn
    );

    return data?.length ? this.populate(data[0], PopulateFrom.DB) : this.reset();
  }

  /**
   *
   * @param query
   * @returns
   */
  async getList(query: ProposalRoundsQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    // Map URL query with SQL fields.
    const fieldMap = {
      id: 'pr.id'
    };

    const { params, filters } = getQueryParams(defaultParams, 'pr', fieldMap, query.serialize());

    const sqlQuery = {
      qSelect: `
        SELECT 
          pr.*,
          JSON_OBJECT(
            'id', p.id,
            'createTime', p.createTime,
            'question', p.question,
            'user_id', u.id,
            'username', u.username,
            'userWallet', u.walletAddress
          ) AS winner
        `,
      qFrom: `
        FROM ${DbTables.PROPOSAL_ROUND} pr
        LEFT JOIN ${DbTables.PROPOSAL} p
          ON p.id = pr.winner_id
        LEFT JOIN ${DbTables.USER} u
          ON u.id = p.user_id
        WHERE pr.status <> ${SqlModelStatus.DELETED}
          AND pr.roundStatus <> ${ProposalRoundStatus.INITIALIZED}
          AND (@roundId IS NULL
            OR pr.id = @roundId
          )
        `,
      qGroup: `
        GROUP BY pr.id
      `,
      qFilter: `
        ORDER BY ${filters.orderStr}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };

    return await selectAndCountQuery(this.getContext().mysql, sqlQuery, params, 'pr.id');
  }
}
