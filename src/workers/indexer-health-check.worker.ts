import { randomUUID } from 'crypto';
import { ethers } from 'ethers';
import { env } from '../config/env';
import { DbTables, SqlModelStatus } from '../config/types';
import { ChannelList, sendSlackWebhook } from '../lib/slack-webhook';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../lib/worker/serverless-workers/base-single-thread-worker';
import { Job } from '../modules/job/job.model';
import { PredictionSetStatus } from '../modules/prediction-set/models/prediction-set.model';

/**
 * Maximum allowed block difference between the current block and the last processed block.
 */
const MAX_ALLOWED_BLOCK_DIFFERENCE = 50;

/**
 * Indexer health check worker.
 */
export class IndexerHealthCheckWorker extends BaseSingleThreadWorker {
  /**
   * Runs worker executor.
   */
  public async runExecutor(_data?: any): Promise<any> {
    try {
      await this.checkPredictionSets();
    } catch (error) {
      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error executing ${this.workerName}`, null, error);
      throw error;
    }
  }

  /**
   * Check prediction sets.
   */
  public async checkPredictionSets(): Promise<void> {
    const provider = new ethers.JsonRpcProvider(env.RPC_URL);
    const currentBlock = await provider.getBlockNumber();

    const predictionSets: any[] = await this.context.mysql.paramExecute(
      `
      SELECT ps.id, cd.lastProcessedBlock, cd.updateTime
      FROM ${DbTables.PREDICTION_SET} ps
      INNER JOIN ${DbTables.PREDICTION_SET_CHAIN_DATA} cd
        ON ps.id = cd.prediction_set_id
      WHERE 
        ps.setStatus IN (${PredictionSetStatus.ACTIVE}, ${PredictionSetStatus.FUNDING})
        AND ps.status = ${SqlModelStatus.ACTIVE}
        AND cd.status = ${SqlModelStatus.ACTIVE}
        AND cd.contractAddress IS NOT NULL
        AND (@currentBlock - cd.lastProcessedBlock) > @maxDifference
      `,
      {
        currentBlock,
        maxDifference: MAX_ALLOWED_BLOCK_DIFFERENCE
      }
    );

    for (const predictionSet of predictionSets) {
      const errorId = randomUUID();
      const difference = currentBlock - predictionSet.lastProcessedBlock;
      const message = `Prediction set ${predictionSet.id} is ${difference} blocks behind current block (${currentBlock}).`;

      await sendSlackWebhook(
        `
        Prediction set ${predictionSet.id} is ${difference} blocks behind current block (${currentBlock}). \n
        - Error ID: \`${errorId}\` \n
        - Prediction set: \`${predictionSet.id}\`
        - Current block: \`${currentBlock}\`
        - Last processed block: \`${predictionSet.lastProcessedBlock}\`
        - Block difference: \`${difference}\`
        - Last update: \`${predictionSet.updateTime.toLocaleString()}\` \n
        `,
        true,
        ChannelList.INDEXER
      );
      await this.writeLogToDb(
        WorkerLogStatus.WARNING,
        message,
        {
          predictionSetId: predictionSet.id,
          currentBlock,
          lastProcessedBlock: predictionSet.lastProcessedBlock,
          difference,
          updateTime: predictionSet.updateTime
        },
        null,
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
