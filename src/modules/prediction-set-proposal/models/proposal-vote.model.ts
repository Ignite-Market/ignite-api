import { prop } from '@rawmodel/core';
import { integerParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { enumInclusionValidator } from '../../../lib/validators';

/**
 * Proposal vote type.
 */
export enum ProposalVoteType {
  UPVOTE = 1,
  DOWNVOTE = 2
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
}
