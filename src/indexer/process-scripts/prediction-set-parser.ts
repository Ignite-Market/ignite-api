import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ethers } from 'ethers';
import * as pm2 from 'pm2';
import { env } from '../../config/env';
import { FundingEvent, SerializeFor, TransactionEvent } from '../../config/types';
import { sendToWorkerQueue } from '../../lib/aws/aws-sqs';
import { setup } from '../../lib/blockchain';
import { sendSlackWebhook } from '../../lib/slack-webhook';
import { WorkerLogStatus } from '../../lib/worker/logger';
import { Outcome } from '../../modules/prediction-set/models/outcome.model';
import { PredictionSet, PredictionSetStatus } from '../../modules/prediction-set/models/prediction-set.model';
import { OutcomeShareTransaction, ShareTransactionType } from '../../modules/prediction-set/models/transactions/outcome-share-transaction.model';
import {
  FundingTransactionType,
  PredictionSetFundingTransaction
} from '../../modules/prediction-set/models/transactions/prediction-set-funding-transaction.model';
import { User } from '../../modules/user/models/user.model';
import { WorkerName } from '../../workers/worker-executor';
import { BaseProcess } from '../base-process';
import { RewardPointsService } from '../../modules/reward-points/reward-points.service';
import { RewardType } from '../../modules/reward-points/models/reward-points.model';
import { CollateralToken } from '../../modules/collateral-token/models/collateral-token.model';

/**
 * Main function to execute the prediction set parser process.
 */
async function main() {
  if (process.argv.length < 3 || !process.argv[2] || !process.argv[3]) {
    Logger.error('Prediction set ID and process name are required.', 'prediction-set-parser.ts/main');
    process.exit(1);
  }

  const predictionSetId = Number(process.argv[2]);
  const processName = process.argv[3];
  const workerProcess = new BaseProcess(processName);
  let conn = null;

  try {
    await workerProcess.initialize(true);
    const context = workerProcess.context;
    conn = await context.mysql.start();

    try {
      const predictionSet = await new PredictionSet({}, context).populateById(predictionSetId, null, true, {
        outcomes: true,
        chainData: true
      });
      if (!predictionSet.exists()) {
        await workerProcess.writeLogToDb(
          WorkerLogStatus.ERROR,
          `Prediction set with ID: ${predictionSetId} does not exists.`,
          {
            predictionSetId,
            predictionSetStatus: predictionSet.setStatus
          },
          null
        );

        Logger.error(`ROLLING BACK: Prediction set does not exits: ${predictionSetId}`, 'prediction-set-parser.ts/main');
        await context.mysql.rollback(conn);
        return;
      }

      const { fpmmContract, provider } = setup(predictionSet.chainData.contractAddress);

      const fromBlock = predictionSet.chainData.lastProcessedBlock + 1; // Event filters are inclusive on both sides.
      const currentBlock = (await provider.getBlockNumber()) - env.FPMM_BLOCK_CONFIRMATIONS; // We wait FPMM_FACTORY_BLOCK_CONFIRMATIONS block for confirmation.

      let toBlock = fromBlock + predictionSet.chainData.parseBlockSize;
      if (toBlock > currentBlock) {
        toBlock = currentBlock;
      }

      if (fromBlock > toBlock) {
        Logger.error('ROLLING BACK: Block not reached yet.', 'prediction-set-parser.ts/main');
        await context.mysql.rollback(conn);
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
        const user = await new User({}, context).populateByWalletAddress(fundingEvent.wallet, conn);

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
          context
        ).insert(SerializeFor.INSERT_DB, conn);

        // Award points per each 100 USD funded.
        if (user?.id && fundingEvent.type === FundingTransactionType.ADDED) {
          const collateralToken = await new CollateralToken({}, context).populateById(predictionSet.collateral_token_id, conn);

          const amount = parseFloat(collateralAmount);
          const amountInTokens = amount / Math.pow(10, collateralToken.decimals);
          const amountInUsd = amountInTokens * collateralToken.usdPrice;

          const pointsMultiplier = Math.floor(amountInUsd / 100);
          if (pointsMultiplier > 0) {
            await RewardPointsService.awardPoints(user.id, RewardType.MARKET_FUNDING, context, conn, pointsMultiplier);
          }
        }
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
        const user = await new User({}, context).populateByWalletAddress(transactionEvent.wallet, conn);
        const outcome = await new Outcome({}, context).populateByIndexAndPredictionSetId(transactionEvent.outcomeIndex, predictionSet.id, conn);
        if (!outcome.exists()) {
          await workerProcess.writeLogToDb(WorkerLogStatus.ERROR, 'Outcome does not exists: ', {
            predictionSetId,
            outcomeIndex: transactionEvent.outcomeIndex
          });

          Logger.error(
            `ROLLING BACK: Outcome with outcome index ${transactionEvent} for prediction set ID ${predictionSet.id} does not exists.`,
            'prediction-set-parser.ts/main'
          );
          await context.mysql.rollback(conn);
          return;
        }

        await new OutcomeShareTransaction(
          {
            ...transactionEvent,
            user_id: user?.id,
            outcome_id: outcome.id,
            prediction_set_id: predictionSet.id
          },
          context
        ).insert(SerializeFor.INSERT_DB, conn);

        // Award points per each 10 USD traded.
        if (user?.id) {
          const collateralToken = await new CollateralToken({}, context).populateById(predictionSet.collateral_token_id, conn);

          const amount = parseFloat(transactionEvent.amount);
          const amountInTokens = amount / Math.pow(10, collateralToken.decimals);
          const amountInUsd = amountInTokens * collateralToken.usdPrice;

          const pointsMultiplier = Math.floor(amountInUsd / 10);
          if (pointsMultiplier > 0) {
            const rewardType = transactionEvent.type === ShareTransactionType.BUY ? RewardType.BUYING_SHARES : RewardType.SELLING_SHARES;

            await RewardPointsService.awardPoints(user.id, rewardType, context, conn, pointsMultiplier);
          }
        }
      }

      // Refresh chances if any of the events happened.
      if (fundingEvents.length || transactionEvents.length) {
        // TODO: Move to indexer worker?
        await sendToWorkerQueue(WorkerName.REFRESH_OUTCOME_CHANCES, [predictionSetId], context);
      }

      // Update blocks.
      await predictionSet.chainData.updateLastProcessedBlock(toBlock, conn);
      await context.mysql.commit(conn);
      conn = null;
    } catch (error) {
      if (conn) {
        Logger.error('ROLLING BACK: Error while parsing prediction set events.', error, 'prediction-set-parser.ts/main');
        await context.mysql.rollback(conn);
        conn = null;
      }

      const errorId = randomUUID();
      await sendSlackWebhook(
        `
        *[INDEXER ERROR]*: Error while parsing prediction set events. See DB worker logs for more info: \n
        - Error ID: \`${errorId}\`\n
        - Prediction set ID: \`${predictionSetId}\`
        `,
        true
      );

      await workerProcess.writeLogToDb(
        WorkerLogStatus.ERROR,
        'Error while parsing prediction set events: ',
        {
          predictionSetId
        },
        error,
        null
      );
      throw error;
    }
  } catch (error) {
    Logger.error('Error executing prediction set parser process:', error, 'prediction-set-parser.ts/main');
    process.exit(1);
  } finally {
    try {
      await workerProcess.shutdown();

      await new Promise<void>((resolve) => {
        pm2.delete(processName, (deleteError) => {
          if (deleteError) {
            Logger.error(`Error deleting PM2 process ${processName}:`, deleteError, 'prediction-set-parser.ts/main');
          } else {
            Logger.log(`Successfully deleted PM2 process ${processName}`, 'prediction-set-parser.ts/main');
          }
          resolve();
        });
      });
    } catch (shutdownError) {
      Logger.error('Error during shutdown:', shutdownError, 'prediction-set-parser.ts/main');
    }
    process.exit(0);
  }
}

main();
