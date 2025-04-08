import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SerializeFor, ValidateFor } from '../../config/types';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { ValidationGuard } from '../../guards/validation.guard';
import { ProposalsQueryFilter } from './dtos/proposals-query-filter';
import { ProposalRoundsQueryFilter } from './dtos/proposals-query-filter copy';
import { ProposalVote } from './models/proposal-vote.model';
import { Proposal } from './models/proposal.model';
import { ProposalService } from './proposal.service';

@Controller('proposals')
export class ProposalController {
  constructor(private readonly proposalsService: ProposalService) {}

  @Post()
  @Validation({ dto: Proposal })
  @UseGuards(ValidationGuard, AuthGuard)
  async createProposal(@Body() proposal: Proposal, @Ctx() context: Context) {
    return await this.proposalsService.createProposal(proposal, context);
  }

  @Get('')
  @Validation({ dto: ProposalsQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getProposals(@Query() query: any, @Ctx() context: Context) {
    return await this.proposalsService.getProposals(query, context);
  }

  @Get('/rounds')
  @Validation({ dto: ProposalRoundsQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getProposalRounds(@Query() query: ProposalRoundsQueryFilter, @Ctx() context: Context) {
    return await this.proposalsService.getProposalRounds(query, context);
  }

  @Get('/rounds/:id')
  async getProposalRoundById(@Param('id', ParseIntPipe) id: number, @Ctx() context: Context) {
    return await this.proposalsService.getProposalRoundById(id, context);
  }

  @Get('/:id')
  async getProposalById(@Param('id', ParseIntPipe) id: number, @Ctx() context: Context) {
    return await this.proposalsService.getProposalById(id, context);
  }

  @Patch('/:id')
  @UseGuards(AuthGuard)
  async updateProposal(@Param('id', ParseIntPipe) id: number, @Body() data: any, @Ctx() context: Context) {
    return await this.proposalsService.updateProposal(id, data, context);
  }

  @Post('/:id/vote')
  @UseGuards(AuthGuard)
  @Validation({ dto: ProposalVote, validateFor: ValidateFor.BODY })
  @UseGuards(AuthGuard, ValidationGuard)
  async voteOnProposal(@Param('id', ParseIntPipe) proposalId: number, @Body() proposalVote: ProposalVote, @Ctx() context: Context) {
    return await this.proposalsService.voteOnProposal(proposalId, proposalVote, context);
  }

  // @Delete('/:id')
  // @UseGuards(AuthGuard)
  // async deletePredictionSet(@Param('id', ParseIntPipe) id: number, @Ctx() context: Context) {
  //   return await this.proposalsService.deletePredictionSet(id, context);
  // }
}
