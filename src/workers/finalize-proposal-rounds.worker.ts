import { env } from '../config/env';
import { DbTables, SerializeFor, SqlModelStatus } from '../config/types';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../lib/worker/serverless-workers/base-single-thread-worker';
import { Job } from '../modules/job/job.model';
import { ProposalRound, ProposalRoundStatus } from '../modules/proposal/models/proposal-round.model';
import { RewardPoints, RewardType } from '../modules/reward-points/models/reward-points.model';
import { RewardPointsService } from '../modules/reward-points/reward-points.service';

/**
 * Finalize proposal rounds worker.
 */
export class FinalizeProposalRoundsWorker extends BaseSingleThreadWorker {
  /**
   * Runs worker executor.
   */
  public async runExecutor(_data?: any): Promise<any> {
    try {
      await this.finalizeProposalRounds();
    } catch (error) {
      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error executing ${this.workerName}`, null, error);
      throw error;
    }
  }

  /**
   * Handles finalization of proposal rounds.
   */
  public async finalizeProposalRounds(): Promise<void> {
    const proposalRounds = await this.context.mysql.paramExecute(
      `
        SELECT *
        FROM ${DbTables.PROPOSAL_ROUND} pr
        WHERE 
          pr.endTime <= NOW()
          AND pr.status = ${SqlModelStatus.ACTIVE}
          AND pr.roundStatus = ${ProposalRoundStatus.ACTIVE}
        `,
      {}
    );

    for (const data of proposalRounds) {
      const conn = await this.context.mysql.start();

      const proposalRound = new ProposalRound(data, this.context);
      try {
        // Get top voted proposal for this round.
        const winningProposal = await this.context.mysql.paramExecute(
          `
          SELECT 
            p.id,
            p.user_id,
            COALESCE(SUM(pv.voteType), 0) AS totalVotes
          FROM ${DbTables.PROPOSAL} p
          LEFT JOIN ${DbTables.PROPOSAL_VOTE} pv
            ON pv.proposal_id = p.id
          WHERE 
            p.round_id = @roundId
            AND p.status <> ${SqlModelStatus.DELETED}
          GROUP BY p.id
          ORDER BY totalVotes DESC
          LIMIT 1
          `,
          { roundId: proposalRound.id },
          conn
        );

        // Update the round with top proposal if it exists and award points.
        if (winningProposal.length > 0) {
          proposalRound.winner_id = winningProposal[0].id;
          await RewardPointsService.awardPoints(winningProposal[0].user_id, RewardType.PROPOSAL_WINNER, this.context, conn);
        }

        // Finalize proposal round.
        proposalRound.roundStatus = ProposalRoundStatus.FINISHED;
        await proposalRound.update(SerializeFor.UPDATE_DB, conn);

        // Start a new round.
        const rewardPoints = await new RewardPoints({}, this.context).populateByType(RewardType.PROPOSAL_WINNER, conn);
        const newRound = new ProposalRound(
          {
            rewardPoints: rewardPoints?.value || proposalRound.rewardPoints,
            startTime: new Date(),
            endTime: new Date(Number(new Date()) + env.PROPOSAL_ROUND_OFFSET_DURATION),
            roundStatus: ProposalRoundStatus.ACTIVE
          },
          this.context
        );
        await newRound.insert(SerializeFor.INSERT_DB, conn);

        await this.context.mysql.commit(conn);
      } catch (error) {
        await this.context.mysql.rollback(conn);

        await this.writeLogToDb(
          WorkerLogStatus.ERROR,
          `Error while finalizing proposal rounds.`,
          {
            proposalRound: proposalRound.id
          },
          error
        );

        continue;
      }
    }
  }

  /**
   * On alert event handling.
   *
   * @param _job Job.
   * @param alertType Alert type.
   */
  public async onAlert(_job: Job, alertType: SingleThreadWorkerAlertType) {
    if (alertType === SingleThreadWorkerAlertType.JOB_LOCKED) {
      throw new Error(`${this.workerName} - LOCK ALERT HAS BEEN CALLED`);
    }
    if (alertType === SingleThreadWorkerAlertType.MISSING_JOB_DEFINITION) {
      throw new Error(`${this.workerName} - MISSING JOB ALERT HAS BEEN CALLED`);
    }
  }
}
