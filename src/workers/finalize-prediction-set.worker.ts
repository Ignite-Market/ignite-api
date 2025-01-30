import { randomUUID } from 'crypto';
import { DbTables, SqlModelStatus } from '../config/types';
import { finalizePredictionSetResults, PredictionSetBcStatus, verifyPredictionSetResults } from '../lib/blockchain';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../lib/worker/serverless-workers/base-single-thread-worker';
import { Job } from '../modules/job/job.model';
import { Outcome } from '../modules/prediction-set/models/outcome.model';
import { PredictionSetAttestation } from '../modules/prediction-set/models/prediction-set-attestation.model';
import { PredictionSet, PredictionSetStatus, ResolutionType } from '../modules/prediction-set/models/prediction-set.model';
import { sendSlackWebhook } from '../lib/slack-webhook';

/**
 * Finalize prediction set worker.
 */
export class FinalizePredictionSetWorker extends BaseSingleThreadWorker {
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
   * Handles finalization of the prediction sets.
   */
  public async finalizePredictionSets(): Promise<void> {
    const predictionSets = await this.context.mysql.paramExecute(
      `
        SELECT ps.*,
        CONCAT(
          '[',
            GROUP_CONCAT(
              JSON_OBJECT(
                'id', psa.id,
                'prediction_set_id', psa.prediction_set_id,
                'data_source_id', psa.data_source_id,
                'roundId', psa.roundId,
                'abiEncodedRequest', psa.abiEncodedRequest,
                'proof', psa.proof,
                'status', psa.status,
                'createTime', psa.createTime,
                'updateTime', psa.updateTime
              )
            ),
          ']'
        ) AS attestations
        FROM ${DbTables.PREDICTION_SET} ps
        INNER JOIN ${DbTables.PREDICTION_SET_ATTESTATION} psa
          ON ps.id = psa.prediction_set_id
        WHERE 
          psa.proof IS NOT NULL
          AND ps.resolutionTime >= NOW()
          AND ps.status = ${SqlModelStatus.ACTIVE}
          AND ps.setStatus = ${PredictionSetStatus.FUNDED}
          AND ps.resolutionType = ${ResolutionType.AUTOMATIC}
          
        `,
      {}
    );

    for (const data of predictionSets) {
      const predictionSet = new PredictionSet(data, this.context);
      const attestations: PredictionSetAttestation[] = JSON.parse(data.attestations).map((d: any) => new PredictionSetAttestation(d, this.context));
      const dataSources = await predictionSet.getDataSources();
      const chainData = await predictionSet.getPredictionSetChainData();

      if (!chainData.exists()) {
        continue;
      }

      // If data sources and attestations results doesn't match we should wait a little longer.
      if (attestations.length !== dataSources.length) {
        continue;
      }

      const validationResults = [];
      for (const attestation of attestations) {
        try {
          const validationResult = await verifyPredictionSetResults(attestation.proof);
          if (!validationResult) {
            await this.writeLogToDb(WorkerLogStatus.INFO, `Prediction set results not verified: `, {
              predictionSetId: predictionSet.id,
              attestationId: attestation.id
            });
          }

          validationResults.push(validationResult);
        } catch (error) {
          await this._logError(
            'Error while verifying prediction set.',
            {
              predictionSetId: predictionSet.id,
              attestationId: attestation.id
            },
            error
          );

          validationResults.push(false);
        }
      }

      // Continue only if all proofs are verified.
      const isVerified = validationResults.every((r) => !!r);
      if (isVerified) {
        let finalizationResults = null;
        try {
          const proofs = attestations.map((a) => a.proof);

          finalizationResults = await finalizePredictionSetResults(chainData.questionId, proofs);
        } catch (error) {
          await this._logError(
            'Error while finalizing prediction set.',
            {
              predictionSetId: predictionSet.id,
              isVerified
            },
            error
          );

          continue;
        }

        if (finalizationResults.status === PredictionSetBcStatus.FINALIZED) {
          const outcome = await new Outcome({}, this.context).populateByIndexAndPredictionSetId(finalizationResults.winnerIdx, predictionSet.id);
          if (!outcome.exists()) {
            await this._logError('Outcome ID for given outcome not found.', {
              predictionSetId: predictionSet.id,
              winnerIdx: finalizationResults.winnerIdx
            });

            continue;
          }

          predictionSet.winner_outcome_id = outcome.id;
          predictionSet.setStatus = PredictionSetStatus.FINALIZED;
          try {
            await predictionSet.update();
          } catch (error) {
            await this._logError(
              'Error while updating prediction set.',
              {
                predictionSetId: predictionSet.id,
                winnerIdx: finalizationResults.winnerIdx
              },
              error
            );

            continue;
          }
        } else if (finalizationResults.status === PredictionSetBcStatus.VOTING) {
          try {
            predictionSet.setStatus = PredictionSetStatus.VOTING;
            await predictionSet.update();
          } catch (error) {
            await this._logError(
              'Error while updating prediction set.',
              {
                predictionSetId: predictionSet.id,
                winnerIdx: finalizationResults.winnerIdx
              },
              error
            );

            continue;
          }
        }
      }
    }
  }

  /**
   * Log error and send Slack webhook.
   * @param message Error message.
   * @param data Error data.
   * @param error Error.
   * @param sendWebhook Should webhook be sent.
   */
  private async _logError(message: string, data: any = null, error: any = null, sendWebhook = true) {
    const errorId = randomUUID();
    await this.writeLogToDb(WorkerLogStatus.ERROR, message, { ...data, errorId }, error, errorId);

    if (sendWebhook) {
      await sendSlackWebhook(
        `
        ${message} See DB worker logs for more info: \n
        - Error ID: \`${errorId}\`
        `,
        true
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
