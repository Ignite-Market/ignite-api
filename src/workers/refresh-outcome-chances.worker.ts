import { DbTables, SqlModelStatus } from '../config/types';
import { setup } from '../lib/blockchain';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseQueueWorker } from '../lib/worker/serverless-workers/base-queue-worker';
import { OutcomeChance } from '../modules/prediction-set/models/outcome-chance.model';
import { PredictionSet, PredictionSetStatus } from '../modules/prediction-set/models/prediction-set.model';

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
          ps.setStatus = ${PredictionSetStatus.ACTIVE}
          AND ps.status = ${SqlModelStatus.ACTIVE}
          AND o.status = ${SqlModelStatus.ACTIVE}
          AND o.positionId IS NOT NULL
          AND ps.endTime > NOW()
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
    try {
      const predictionSet = await new PredictionSet({}, this.context).populateById(predictionSetId, null, false, { outcomes: true, chainData: true });
      if (!predictionSet.exists() && predictionSet.setStatus !== PredictionSetStatus.ACTIVE) {
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

      const { conditionalTokenContract } = setup();
      const balances = await conditionalTokenContract.balanceOfBatch(owners, positionIds);
      if (!balances?.length) {
        return;
      }
      const totalSupply = balances.reduce((total: bigint, reserve: bigint) => total + reserve, BigInt(0));

      // Calculate fixed-product market maker probabilities.
      const balancesBigInt: bigint[] = balances.map((b: any) => BigInt(b));

      // Π_j b_j (product of all balances)
      const product: bigint = balancesBigInt.reduce((acc, b) => acc * b, BigInt(1));

      // numerator_i = product / b_i
      const numerators: bigint[] = balancesBigInt.map((b) => product / b);
      const denom: bigint = numerators.reduce((acc, n) => acc + n, BigInt(0));
      const probabilities: number[] = numerators.map((n) => Number(n) / Number(denom));

      for (const [index, outcome] of predictionSet.outcomes.entries()) {
        const outcomeBalance = balances[index];
        const chance = probabilities[index];

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
