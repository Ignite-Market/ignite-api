import { prop } from '@rawmodel/core';
import { integerParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor, SqlModelStatus, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { enumInclusionValidator } from '../../../lib/validators';
import { PoolConnection } from 'mysql2/promise';

/**
 * Proposal vote type.
 */
export enum ProposalVoteType {
  UPVOTE = 1,
  DOWNVOTE = -1,
  NEUTRALIZED = 0 // User decided to revoke their vote.
}

/**
 * Prediction set proposal vote model.
 */
export class ProposalVote extends AdvancedSQLModel {
  /**
   * Prediction set proposal vote's table.
   */
  public tableName = DbTables.PROPOSAL_VOTE;

  /**
   * Proposal ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public proposal_id: number;

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
   * Vote type.
   */
  @prop({
    parser: {
      resolver: integerParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: enumInclusionValidator(ProposalVoteType),
        code: ValidatorErrorCode.PROPOSAL_VOTE_TYPE_NOT_VALID
      }
    ],
    emptyValue: () => ProposalVoteType.UPVOTE,
    defaultValue: () => ProposalVoteType.UPVOTE
  })
  public voteType: number;

  /**
   * Get vote by user and proposal and type.
   *
   * @param userId - User ID.
   * @param proposalId - Proposal ID.
   * @returns Vote.
   */
  public async getByUserIdAndProposalId(userId: number, proposalId: number, conn?: PoolConnection, forUpdate = false) {
    const data = await this.getContext().mysql.paramExecute(
      `
          SELECT *
          FROM \`${this.tableName}\`
          WHERE status <> ${SqlModelStatus.DELETED}
            AND user_id = @userId
            AND proposal_id = @proposalId
          ${conn && forUpdate ? 'FOR UPDATE' : ''};
          `,
      {
        userId,
        proposalId
      },
      conn
    );

    return data?.length ? this.populate(data[0], PopulateFrom.DB) : this.reset();
  }

  /**
   * Get proposal votes count.
   *
   * @param proposalId - Proposal ID.
   * @returns Count.
   */
  public async getProposalVotesCount(proposalId: number, conn?: PoolConnection, forUpdate = false) {
    const res = await this.getContext().mysql.paramExecute(
      `
          SELECT COUNT(*) as cnt
          FROM \`${this.tableName}\`
          WHERE status <> ${SqlModelStatus.DELETED}
            AND proposal_id = @proposalId
          ${conn && forUpdate ? 'FOR UPDATE' : ''};
          `,
      {
        proposalId
      },
      conn
    );

    return res[0].cnt;
  }
}
