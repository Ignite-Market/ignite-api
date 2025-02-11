import { DbTables, SqlModelStatus } from '../config/types';
import { finalizePredictionSetResults, PredictionSetBcStatus } from '../lib/blockchain';
import { sendSlackWebhook } from '../lib/slack-webhook';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../lib/worker/serverless-workers/base-single-thread-worker';
import { Job } from '../modules/job/job.model';
import { PredictionSet, PredictionSetStatus, ResolutionType } from '../modules/prediction-set/models/prediction-set.model';

/**
 * Finalize manual resolution prediction set worker.
 */
export class FinalizeManualPredictionSetWorker extends BaseSingleThreadWorker {
  /**
   * Runs worker executor.
   */
  public async runExecutor(_data?: any): Promise<any> {
    try {
      await this.finalizePredictionSets();
    } catch (error) {
      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error executing ${this.workerName}`, null, error);
      throw error;
    }
  }

  /**
   * Handles finalization of prediction sets.
   */
  public async finalizePredictionSets(): Promise<void> {
    const predictionSets = await this.context.mysql.paramExecute(
      `
        SELECT *
        FROM ${DbTables.PREDICTION_SET} ps
        WHERE 
          ps.resolutionTime <= NOW()
          AND ps.status = ${SqlModelStatus.ACTIVE}
          AND ps.setStatus = ${PredictionSetStatus.ACTIVE}
          AND ps.resolutionType = ${ResolutionType.MANUAL}
        `,
      {}
    );

    for (const data of predictionSets) {
      const predictionSet = new PredictionSet(data, this.context);
      const chainData = await predictionSet.getPredictionSetChainData();

      if (!chainData.exists()) {
        continue;
      }

      try {
        const finalizationResults = await finalizePredictionSetResults(chainData.questionId, []);

        if (finalizationResults.status !== PredictionSetBcStatus.VOTING) {
          await this.writeLogToDb(WorkerLogStatus.ERROR, 'Finalized prediction set with MANUAL resolution is not in VOTING status.', {
            finalizationStatus: finalizationResults.status,
            finalizationWinner: finalizationResults.winnerIdx,
            predictionSetId: predictionSet.id
          });

          await sendSlackWebhook(
            `
              Finalized prediction set with MANUAL resolution is not in VOTING status. \n
              - Finalization status: \`${finalizationResults.status}\` \n
              - Finalization winner: \`${finalizationResults.winnerIdx}\` \n
              - Prediction set ID: \`${predictionSet.id}\` \n
            `,
            true
          );

          continue;
        }

        predictionSet.setStatus = PredictionSetStatus.VOTING;
        await predictionSet.update();
      } catch (error) {
        await this.writeLogToDb(
          WorkerLogStatus.ERROR,
          `Error while finalizing manual resolution prediction set.`,
          {
            predictionSetId: predictionSet.id
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
