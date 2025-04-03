import { HttpStatus, Injectable } from '@nestjs/common';
import { BadRequestErrorCode, PopulateFrom, ResourceNotFoundErrorCode, SerializeFor, SystemErrorCode, ValidatorErrorCode } from '../../config/types';
import { Context } from '../../context';
import { CodeException, ModelValidationException } from '../../lib/exceptions/exceptions';
import { Proposal } from './models/proposal.model';
import { ProposalRound, ProposalRoundStatus } from './models/proposal-round.model';
import { ProposalVote } from './models/proposal-vote.model';

@Injectable()
export class ProposalService {
  /**
   * Create prediction set proposal.
   *
   * @param proposal Prediction set proposal.
   * @param context Application context.
   */
  public async createProposal(proposal: Proposal, context: Context) {
    const proposalRound = await new ProposalRound({}, context).getActiveRound();
    if (!proposalRound.exists() || !proposalRound.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_PROPOSAL_ACTIVE_ROUND_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/createProposal`,
        context
      });
    }

    proposal.round_id = proposalRound.id;
    try {
      await proposal.insert(SerializeFor.INSERT_DB);
    } catch (error) {
      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        errorCodes: SystemErrorCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/createPredictionSet`,
        details: error,
        context
      });
    }

    return proposal.serialize(SerializeFor.USER);
  }

  /**
   * Vote on a proposal.
   *
   * @param proposalId Proposal ID.
   * @param vote Vote data.
   * @param context Application context.
   * @returns Vote.
   */
  public async voteOnProposal(proposalId: number, vote: ProposalVote, context: Context) {
    const proposal = await new Proposal({}, context).populateById(proposalId);
    if (!proposal.exists() || !proposal.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_PROPOSAL_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/voteOnProposal`,
        context
      });
    }

    const proposalRound = await new ProposalRound({}, context).populateById(proposal.round_id);
    if (!proposalRound.exists() || !proposalRound.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_PROPOSAL_ACTIVE_ROUND_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/voteOnProposal`,
        context
      });
    }

    if (proposalRound.roundStatus !== ProposalRoundStatus.ACTIVE) {
      throw new CodeException({
        code: BadRequestErrorCode.PROPOSAL_ROUND_NOT_ACTIVE,
        errorCodes: BadRequestErrorCode,
        status: HttpStatus.BAD_REQUEST,
        sourceFunction: `${this.constructor.name}/voteOnProposal`,
        context
      });
    }

    vote.proposal_id = proposal.id;
    vote.user_id = context.user.id;
    try {
      await vote.insert(SerializeFor.INSERT_DB);
    } catch (error) {
      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        errorCodes: SystemErrorCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/voteOnProposal`,
        details: error,
        context
      });
    }

    return vote.serialize(SerializeFor.USER);
  }

  /**
   * Update prediction set proposal.
   *
   * @param proposalId Prediction set proposal ID.
   * @param data prediction set proposal data.
   * @param context Application context.
   */
  public async updateProposal(proposalId: number, data: any, context: Context) {
    const proposal = await new Proposal({}, context).populateById(proposalId);
    if (!proposal.exists() || !proposal.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_PROPOSAL_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/updateProposal`,
        context
      });
    }

    proposal.populate(data, PopulateFrom.USER);
    try {
      await proposal.validate();
    } catch (error) {
      await proposal.handle(error);
    }

    if (!proposal.isValid()) {
      throw new ModelValidationException(proposal, ValidatorErrorCode);
    }

    try {
      await proposal.update(SerializeFor.UPDATE_DB);
    } catch (error) {
      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        errorCodes: SystemErrorCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/updateProposal`,
        details: error,
        context
      });
    }

    return proposal.serialize(SerializeFor.USER);
  }

  /**
   * Returns listing of prediction.
   *
   * @param query Filtering query.
   * @param context Application context.
   * @returns Prediction group.
   */
  public async getPredictionsSetProposals(query: any, context: Context) {
    return await new Proposal({}, context).getList(query);
  }

  /**
   * Returns listing of prediction set proposal rounds.
   *
   * @param query Filtering query.
   * @param context Application context.
   * @returns Prediction set proposal rounds.
   */
  public async getProposalRounds(query: any, context: Context) {
    return await new ProposalRound({}, context).getList(query);
  }

  /**
   * Get prediction set proposal by ID.
   *
   * @param id prediction set proposal ID.
   * @param context Application context.
   * @returns prediction set proposal.
   */
  public async getProposalById(id: number, context: Context) {
    const proposal = await new Proposal({}, context).populateById(id);
    if (!proposal.exists() || !proposal.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_PROPOSAL_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/getProposalById`,
        context
      });
    }

    return proposal.serialize(SerializeFor.USER);
  }
}
