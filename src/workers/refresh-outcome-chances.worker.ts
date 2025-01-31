import { DbTables, SqlModelStatus } from '../config/types';
import { setup } from '../lib/blockchain';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseQueueWorker } from '../lib/worker/serverless-workers/base-queue-worker';
import { OutcomeChance } from '../modules/prediction-set/models/outcome-chance.model';
import { PredictionSet, PredictionSetStatus } from '../modules/prediction-set/models/prediction-set.model';
import { ethers } from 'ethers';

/**
 * Refreshes outcome chances worker.
 */
export class RefreshOutcomeChancesWorker extends BaseQueueWorker {
  /**
   * Gets outcome IDs of prediction sets that should get their outcome chances refreshed.
   * @returns Array of prediction set IDs.
   */
  public async runPlanner(): Promise<number[]> {
    const predictionSetIds = await this.context.mysql.paramExecute(
      `
        SELECT ps.id
        FROM ${DbTables.PREDICTION_SET} ps
        INNER JOIN ${DbTables.OUTCOME} o
          ON ps.id = o.prediction_set_id
        WHERE 
          ps.setStatus = ${PredictionSetStatus.FUNDED}
          AND ps.status = ${SqlModelStatus.ACTIVE}
          AND o.status = ${SqlModelStatus.ACTIVE}
          AND o.positionId IS NOT NULL
        `,
      {}
    );

    return predictionSetIds.map((d) => d.id);
  }

  /**
   * Refreshes prediction set's outcome chances.
   * @param predictionSetId Prediction set IDs.
   */
  public async runExecutor(predictionSetId: number): Promise<any> {
    const { conditionalTokenContract } = setup();

    try {
      const predictionSet = await new PredictionSet({}, this.context).populateById(predictionSetId, null, false, { outcomes: true, chainData: true });
      if (!predictionSet.exists() && predictionSet.setStatus !== PredictionSetStatus.FUNDED) {
        await this.writeLogToDb(
          WorkerLogStatus.ERROR,
          `Prediction set with ID: ${predictionSetId} does not exists or is not funded.`,
          {
            predictionSetId,
            predictionSetStatus: predictionSet.setStatus
          },
          null
        );

        return;
      }

      const owners = predictionSet.outcomes.map(() => predictionSet.chainData.contractAddress);
      const positionIds = predictionSet.outcomes.map((outcome) => BigInt(outcome.positionId));

      const balances = await conditionalTokenContract.balanceOfBatch(owners, positionIds);
      if (!balances?.length) {
        return;
      }

      const precision = BigInt(10) ** BigInt(18);
      const product: bigint = balances.reduce((acc: bigint, balance: bigint) => acc * balance, precision);
      const denominator: bigint = balances.reduce((acc: bigint, balance: bigint) => acc + product / balance, BigInt(0));
      const totalSupply = balances.reduce((total: bigint, reserve: bigint) => total + reserve, BigInt(0));

      for (const [index, outcome] of predictionSet.outcomes.entries()) {
        const outcomeBalance = balances[index];
        const priceInWei = (product * precision) / (outcomeBalance * denominator);
        const chance = Number(priceInWei) / 1e18;

        await new OutcomeChance(
          {
            outcome_id: outcome.id,
            prediction_set_id: predictionSet.id,
            chance: chance,
            supply: outcomeBalance.toString(),
            totalSupply: totalSupply.toString()
          },
          this.context
        ).insert();
      }
    } catch (error) {
      await this.writeLogToDb(
        WorkerLogStatus.ERROR,
        'Error while refreshing chances fo prediction set outcomes: ',
        {
          predictionSetId
        },
        error
      );
    }
  }
}
