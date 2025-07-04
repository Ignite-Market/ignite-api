import { ethers } from 'ethers';
import { env } from '../config/env';
import { DbTables, FundingEvent, SerializeFor, SqlModelStatus } from '../config/types';
import { setup } from '../lib/blockchain';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseQueueWorker } from '../lib/worker/serverless-workers/base-queue-worker';
import { PredictionSet, PredictionSetStatus } from '../modules/prediction-set/models/prediction-set.model';
import {
  FundingTransactionType,
  PredictionSetFundingTransaction
} from '../modules/prediction-set/models/transactions/prediction-set-funding-transaction.model';
import { User } from '../modules/user/models/user.model';

/**
 * Parses FINALIZED prediction set contracts.
 */
export class PredictionSetFinalizedParserWorker extends BaseQueueWorker {
  /**
   * Gets predictions set IDs.
   * @returns Array of prediction set IDs.
   */
  public async runPlanner(): Promise<number[]> {
    // Only prediction sets with finalized status and funding shares remaining
    const predictionSetIds = await this.context.mysql.paramExecute(
      `
        SELECT ps.id
        FROM ${DbTables.PREDICTION_SET} ps
        INNER JOIN ${DbTables.PREDICTION_SET_CHAIN_DATA} cd
          ON ps.id = cd.prediction_set_id
        LEFT JOIN (
          SELECT prediction_set_id, SUM(IF(type = ${FundingTransactionType.ADDED}, shares, -shares)) AS fundingAmount
          FROM ${DbTables.PREDICTION_SET_FUNDING_TRANSACTION}
          GROUP BY prediction_set_id
        ) psft
          ON ps.id = psft.prediction_set_id
        WHERE 
          ps.setStatus = ${PredictionSetStatus.FINALIZED}
          AND ps.status = ${SqlModelStatus.ACTIVE}
          AND cd.status = ${SqlModelStatus.ACTIVE}
          AND cd.contractAddress IS NOT NULL
          AND psft.fundingAmount > 0
        GROUP BY ps.id
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

      if (predictionSet.setStatus !== PredictionSetStatus.FINALIZED) {
        await this.writeLogToDb(WorkerLogStatus.ERROR, `Prediction set with ID: ${predictionSetId} is not finalized.`, {
          predictionSetId,
          predictionSetStatus: predictionSet.setStatus
        });

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
       * Remove funding events parsing.
       *
       */
      const fundingEvents: FundingEvent[] = [];
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

        await new PredictionSetFundingTransaction(
          {
            ...fundingEvent,
            user_id: user?.id,
            prediction_set_id: predictionSet.id
          },
          this.context
        ).insert(SerializeFor.INSERT_DB, conn);
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
