import { randomUUID } from 'crypto';
import { ethers } from 'ethers';
import { env } from '../config/env';
import { SerializeFor } from '../config/types';
import { CONDITIONAL_TOKEN_ABI } from '../lib/abis';
import { sendSlackWebhook } from '../lib/slack-webhook';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../lib/worker/serverless-workers/base-single-thread-worker';
import { Contract, ContractId } from '../modules/contract/models/contract.model';
import { Job } from '../modules/job/job.model';
import { Outcome } from '../modules/prediction-set/models/outcome.model';
import { PredictionSetChainData } from '../modules/prediction-set/models/prediction-set-chain-data.model';
import { PredictionSet } from '../modules/prediction-set/models/prediction-set.model';
import { ClaimTransaction } from '../modules/prediction-set/models/transactions/claim-transaction.model';
import { RewardType } from '../modules/reward-points/models/reward-points.model';
import { RewardPointsService } from '../modules/reward-points/reward-points.service';
import { User } from '../modules/user/models/user.model';

/**
 * Parses user's claims - winnings.
 */
export class ClaimsParserWorker extends BaseSingleThreadWorker {
  /**
   * Runs worker executor.
   */
  public async runExecutor(_data: any): Promise<any> {
    try {
      await this.parseClaims();
    } catch (error) {
      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error executing ${this.workerName}`, null, error);
      throw error;
    }
  }

  /**
   * Parses user's claims - winnings.
   */
  public async parseClaims(): Promise<void> {
    const conn = await this.context.mysql.start();

    try {
      const provider = new ethers.JsonRpcProvider(env.RPC_URL);
      const contract = await new Contract({}, this.context).populateById(ContractId.CONDITIONAL_TOKENS);

      const fromBlock = contract.lastProcessedBlock + 1; // Event filters are inclusive on both sides.
      const currentBlock = (await provider.getBlockNumber()) - env.CONDITIONAL_TOKENS_BLOCK_CONFIRMATIONS; // We wait CONDITIONAL_TOKENS_BLOCK_CONFIRMATIONS block for confirmation.

      let toBlock = fromBlock + contract.parseBlockSize;
      if (toBlock > currentBlock) {
        toBlock = currentBlock;
      }

      if (fromBlock >= toBlock) {
        await this.context.mysql.rollback(conn);

        return;
      }

      const conditionalTokensContract = new ethers.Contract(contract.contractAddress, CONDITIONAL_TOKEN_ABI, provider);
      const events = (await conditionalTokensContract.queryFilter(
        conditionalTokensContract.filters.PayoutRedemption(),
        fromBlock,
        toBlock
      )) as ethers.EventLog[];

      for (const event of events) {
        const userWallet = event.args[0];
        const conditionId = event.args[3];
        const indexSet = Number(event.args[4][0]);
        const payout = event.args[5];
        const outcomeIndex = Math.log2(indexSet);

        const txHash = event.transactionHash;
        const lastProcessedBlock = event.blockNumber;

        const chainData = await new PredictionSetChainData({}, this.context).populateByConditionId(conditionId, conn);
        if (!chainData.exists()) {
          await this.writeLogToDb(
            WorkerLogStatus.ERROR,
            `Prediction set chain data  with condition ID: ${conditionId} does not exists.`,
            {
              conditionId,
              txHash,
              lastProcessedBlock
            },
            null
          );

          continue;
        }

        const predictionSet = await new PredictionSet({}, this.context).populateById(chainData.prediction_set_id, conn);
        if (!predictionSet.exists()) {
          await this.writeLogToDb(
            WorkerLogStatus.ERROR,
            `Prediction set with ID: ${chainData.prediction_set_id} does not exists.`,
            {
              conditionId,
              txHash,
              lastProcessedBlock,
              predictionSetChainDataId: chainData.id,
              predictionSetId: chainData.prediction_set_id
            },
            null
          );

          continue;
        }

        const user = await new User({}, this.context).populateByWalletAddress(userWallet, conn);
        if (!user.exists()) {
          await this.writeLogToDb(WorkerLogStatus.ERROR, 'User does not exists: ', {
            userWallet,
            txHash,
            lastProcessedBlock
          });

          await this.context.mysql.rollback(conn);
          return;
        }

        const outcome = await new Outcome({}, this.context).populateByIndexAndPredictionSetId(outcomeIndex, predictionSet.id, conn);
        if (!outcome.exists()) {
          await this.writeLogToDb(WorkerLogStatus.ERROR, 'Outcome does not exists: ', {
            predictionSetId: predictionSet.id,
            outcomeIndex,
            txHash,
            lastProcessedBlock
          });

          await this.context.mysql.rollback(conn);
          return;
        }

        await new ClaimTransaction(
          {
            user_id: user.id,
            outcome_id: outcome.id,
            prediction_set_id: predictionSet.id,
            txHash,
            wallet: userWallet,
            amount: payout.toString()
          },
          this.context
        ).insert(SerializeFor.INSERT_DB, conn);

        // TODO: Do we always do this? Market funder will also receive this points.
        await RewardPointsService.awardPoints(user.id, RewardType.MARKET_WINNER, this.context, conn);
      }

      await contract.updateLastProcessedBlock(toBlock, conn);
      await this.context.mysql.commit(conn);
    } catch (error) {
      await this.context.mysql.rollback(conn);

      const errorId = randomUUID();
      await sendSlackWebhook(
        `
        Error while parsing prediction sets claims. See DB worker logs for more info: \n
        - Error ID: \`${errorId}\`
        `,
        true
      );

      await this.writeLogToDb(
        WorkerLogStatus.ERROR,
        `Error while parsing prediction set claims: `,
        {
          errorId
        },
        error,
        errorId
      );
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
