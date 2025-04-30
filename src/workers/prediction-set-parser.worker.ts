import { ethers } from 'ethers';
import { env } from '../config/env';
import { DbTables, SerializeFor, SqlModelStatus, FundingEvent, TransactionEvent } from '../config/types';
import { setup } from '../lib/blockchain';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseQueueWorker } from '../lib/worker/serverless-workers/base-queue-worker';
import { OutcomeShareTransaction, ShareTransactionType } from '../modules/prediction-set/models/transactions/outcome-share-transaction.model';
import { Outcome } from '../modules/prediction-set/models/outcome.model';
import {
  FundingTransactionType,
  PredictionSetFundingTransaction
} from '../modules/prediction-set/models/transactions/prediction-set-funding-transaction.model';
import { PredictionSet, PredictionSetStatus } from '../modules/prediction-set/models/prediction-set.model';
import { User } from '../modules/user/models/user.model';
import { sendToWorkerQueue } from '../lib/aws/aws-sqs';
import { WorkerName } from './worker-executor';
import { RewardPointsService } from '../modules/reward-points/reward-points.service';
import { RewardType } from '../modules/reward-points/models/reward-points.model';

/**
 * Parses prediction set contracts.
 */
export class PredictionSetParserWorker extends BaseQueueWorker {
  /**
   * Gets predictions set IDs.
   * @returns Array of prediction set IDs.
   */
  public async runPlanner(): Promise<number[]> {
    const predictionSetIds = await this.context.mysql.paramExecute(
      `
        SELECT ps.id
        FROM ${DbTables.PREDICTION_SET} ps
        INNER JOIN ${DbTables.PREDICTION_SET_CHAIN_DATA} cd
          ON ps.id = cd.prediction_set_id
        WHERE 
          ps.setStatus IN (${PredictionSetStatus.ACTIVE}, ${PredictionSetStatus.FUNDING})
          AND ps.status = ${SqlModelStatus.ACTIVE}
          AND cd.status = ${SqlModelStatus.ACTIVE}
          AND cd.contractAddress IS NOT NULL
        `,
      {}
    );

    return predictionSetIds.map((d) => d.id);
  }

  /**
   *
   * @param predictionSetId Prediction set IDs.
   */
  public async runExecutor(predictionSetId: number): Promise<any> {
    const conn = await this.context.mysql.start();

    try {
      const predictionSet = await new PredictionSet({}, this.context).populateById(predictionSetId, null, false, { outcomes: true, chainData: true });
      if (!predictionSet.exists()) {
        await this.writeLogToDb(
          WorkerLogStatus.ERROR,
          `Prediction set with ID: ${predictionSetId} does not exists.`,
          {
            predictionSetId,
            predictionSetStatus: predictionSet.setStatus
          },
          null
        );

        await this.context.mysql.rollback(conn);
        return;
      }

      const { fpmmContract, provider } = setup(predictionSet.chainData.contractAddress);

      const fromBlock = predictionSet.chainData.lastProcessedBlock + 1; // Event filters are inclusive on both sides.
      const currentBlock = (await provider.getBlockNumber()) - env.FPMM_BLOCK_CONFIRMATIONS; // We wait FPMM_FACTORY_BLOCK_CONFIRMATIONS block for confirmation.

      let toBlock = fromBlock + predictionSet.chainData.parseBlockSize;
      if (toBlock > currentBlock) {
        toBlock = currentBlock;
      }

      if (fromBlock >= toBlock) {
        await this.context.mysql.rollback(conn);

        return;
      }

      /**
       *
       * Funding events parsing - ADD or REMOVE.
       *
       */
      const fundingEvents: FundingEvent[] = [];

      // Funding added events.
      const fundingAddedEvents = (await fpmmContract.queryFilter(fpmmContract.filters.FPMMFundingAdded(), fromBlock, toBlock)) as ethers.EventLog[];
      for (const fundingEvent of fundingAddedEvents) {
        fundingEvents.push({
          type: FundingTransactionType.ADDED,
          txHash: fundingEvent.transactionHash,
          wallet: fundingEvent.args[0],
          amounts: fundingEvent.args[1].toString(),
          shares: fundingEvent.args[2].toString()
        });
      }

      // Funding removed events.
      const fundingRemovedEvents = (await fpmmContract.queryFilter(
        fpmmContract.filters.FPMMFundingRemoved(),
        fromBlock,
        toBlock
      )) as ethers.EventLog[];
      for (const fundingEvent of fundingRemovedEvents) {
        fundingEvents.push({
          type: FundingTransactionType.REMOVED,
          txHash: fundingEvent.transactionHash,
          wallet: fundingEvent.args[0],
          amounts: fundingEvent.args[1].toString(),
          collateralRemovedFromFeePool: fundingEvent.args[2].toString(),
          shares: fundingEvent.args[3].toString()
        });
      }

      // Insert funding events.
      for (const fundingEvent of fundingEvents) {
        const user = await new User({}, this.context).populateByWalletAddress(fundingEvent.wallet, conn);

        let collateralAmount = null;
        if (fundingEvent.type === FundingTransactionType.ADDED) {
          collateralAmount = Math.max(...fundingEvent.amounts.split(',').map(Number));
        }

        await new PredictionSetFundingTransaction(
          {
            ...fundingEvent,
            user_id: user?.id,
            prediction_set_id: predictionSet.id,
            collateralAmount
          },
          this.context
        ).insert(SerializeFor.INSERT_DB, conn);
      }

      if (fundingEvents.length) {
        // Activate trading when the contract is funded.
        const canTrade = await fpmmContract.canTrade();
        if (canTrade && predictionSet.setStatus !== PredictionSetStatus.ACTIVE) {
          predictionSet.setStatus = PredictionSetStatus.ACTIVE;
          await predictionSet.update(SerializeFor.UPDATE_DB, conn);
        }
      }

      /**
       *
       * Transaction events parsing - BUY or SELL.
       *
       */
      const transactionEvents: TransactionEvent[] = [];

      // Buy shares events parsing.
      const buyEvents = (await fpmmContract.queryFilter(fpmmContract.filters.FPMMBuy(), fromBlock, toBlock)) as ethers.EventLog[];
      for (const buyEvent of buyEvents) {
        transactionEvents.push({
          type: ShareTransactionType.BUY,
          txHash: buyEvent.transactionHash,
          wallet: buyEvent.args[0],
          amount: buyEvent.args[1].toString(),
          feeAmount: buyEvent.args[2].toString(),
          outcomeIndex: Number(buyEvent.args[3]),
          outcomeTokens: buyEvent.args[4].toString()
        });
      }

      // Sell shares events parsing.
      const sellEvents = (await fpmmContract.queryFilter(fpmmContract.filters.FPMMSell(), fromBlock, toBlock)) as ethers.EventLog[];
      for (const sellEvent of sellEvents) {
        transactionEvents.push({
          type: ShareTransactionType.SELL,
          txHash: sellEvent.transactionHash,
          wallet: sellEvent.args[0],
          amount: sellEvent.args[1].toString(),
          feeAmount: sellEvent.args[2].toString(),
          outcomeIndex: Number(sellEvent.args[3]),
          outcomeTokens: sellEvent.args[4].toString()
        });
      }

      // Insert transaction events.
      for (const transactionEvent of transactionEvents) {
        const user = await new User({}, this.context).populateByWalletAddress(transactionEvent.wallet, conn);
        const outcome = await new Outcome({}, this.context).populateByIndexAndPredictionSetId(transactionEvent.outcomeIndex, predictionSet.id, conn);
        if (!outcome.exists()) {
          await this.writeLogToDb(WorkerLogStatus.ERROR, 'Outcome does not exists: ', {
            predictionSetId,
            outcomeIndex: transactionEvent.outcomeIndex
          });

          await this.context.mysql.rollback(conn);
          return;
        }

        await new OutcomeShareTransaction(
          {
            ...transactionEvent,
            user_id: user?.id,
            outcome_id: outcome.id,
            prediction_set_id: predictionSet.id
          },
          this.context
        ).insert(SerializeFor.INSERT_DB, conn);

        // TODO: award points.
      }

      // Refresh chances if any of the events happened.
      if (fundingEvents.length || transactionEvents.length) {
        await sendToWorkerQueue(WorkerName.REFRESH_OUTCOME_CHANCES, [predictionSetId], this.context);
      }

      // Update blocks.
      await predictionSet.chainData.updateLastProcessedBlock(toBlock, conn);
      await this.context.mysql.commit(conn);
    } catch (error) {
      await this.context.mysql.rollback(conn);

      await this.writeLogToDb(
        WorkerLogStatus.ERROR,
        'Error while parsing prediction set events: ',
        {
          predictionSetId
        },
        error
      );
    }
  }
}
