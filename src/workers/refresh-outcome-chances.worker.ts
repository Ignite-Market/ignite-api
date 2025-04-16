import { env } from '../config/env';
import { DbTables, SqlModelStatus } from '../config/types';
import { setup } from '../lib/blockchain';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseQueueWorker } from '../lib/worker/serverless-workers/base-queue-worker';
import { CollateralToken } from '../modules/collateral-token/models/collateral-token.model';
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

      const collateralToken = await new CollateralToken({}, this.context).populateById(predictionSet.collateral_token_id);
      if (!collateralToken.exists() || !collateralToken.isEnabled()) {
        await this.writeLogToDb(
          WorkerLogStatus.ERROR,
          `Collateral token with ID: ${predictionSet.collateral_token_id} does not exists or is not funded.`,
          {
            collateralTokenId: predictionSet.collateral_token_id
          },
          null
        );

        return;
      }

      const owners = predictionSet.outcomes.map(() => predictionSet.chainData.contractAddress);
      const positionIds = predictionSet.outcomes.map((outcome) => BigInt(outcome.positionId));

      const { conditionalTokenContract, fpmmContract } = setup(predictionSet.chainData.contractAddress);

      const balances = await conditionalTokenContract.balanceOfBatch(owners, positionIds);
      if (!balances?.length) {
        return;
      }
      const totalSupply = balances.reduce((total: bigint, reserve: bigint) => total + reserve, BigInt(0));

      // Calculate marginal prices.
      const marginalPrices: number[] = [];
      for (const outcome of predictionSet.outcomes) {
        const amount = BigInt(Math.round(1 * 10 ** collateralToken.decimals));
        const shares = await fpmmContract.calcBuyAmount(amount, outcome.outcomeIndex);
        const pricePerShare = Number(amount) / Number(shares);
        marginalPrices.push(pricePerShare);
      }

      // Normalize prices to sum to 1.
      const priceTotal = marginalPrices.reduce((acc, p) => acc + p, 0);
      const normalizedChances = marginalPrices.map((p) => p / priceTotal);

      for (const [index, outcome] of predictionSet.outcomes.entries()) {
        const outcomeBalance = balances[index];
        const normalizedChance = normalizedChances[index];

        await new OutcomeChance(
          {
            outcome_id: outcome.id,
            prediction_set_id: predictionSet.id,
            chance: normalizedChance,
            supply: outcomeBalance.toString(),
            totalSupply: totalSupply.toString()
          },
          this.context
        ).insert();
      }

      // for (const [index, outcome] of predictionSet.outcomes.entries()) {
      //   const outcomeBalance = balances[index];

      //   // Get price per share if we invest 1 collateral token.
      //   const amount = BigInt(Math.round(1 * 10 ** collateralToken.decimals));
      //   const shares = await fpmmContract.calcBuyAmount(amount, outcome.outcomeIndex);
      //   const pricePerShare = Number(amount) / Number(shares);

      //   await new OutcomeChance(
      //     {
      //       outcome_id: outcome.id,
      //       prediction_set_id: predictionSet.id,
      //       chance: pricePerShare,
      //       supply: outcomeBalance.toString(),
      //       totalSupply: totalSupply.toString()
      //     },
      //     this.context
      //   ).insert();
      // }
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

// Old way of price calculation:
// const precision = BigInt(10) ** BigInt(18);
// const product: bigint = balances.reduce((acc: bigint, balance: bigint) => acc * balance, precision);
// const denominator: bigint = balances.reduce((acc: bigint, balance: bigint) => acc + product / balance, BigInt(0));
// const totalSupply = balances.reduce((total: bigint, reserve: bigint) => total + reserve, BigInt(0));

// for (const [index, outcome] of predictionSet.outcomes.entries()) {
//   const outcomeBalance = balances[index];
//   const priceInWei = (product * precision) / (outcomeBalance * denominator);
//   const chance = Number(priceInWei) / 1e18;

//   await new OutcomeChance(
//     {
//       outcome_id: outcome.id,
//       prediction_set_id: predictionSet.id,
//       chance: chance,
//       supply: outcomeBalance.toString(),
//       totalSupply: totalSupply.toString()
//     },
//     this.context
//   ).insert();
// }
