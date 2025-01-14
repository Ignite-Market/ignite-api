import { DbTables } from '../config/types';
import { finalizePredictionSetResults, verifyPredictionSetResults } from '../lib/blockchain';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../lib/worker/serverless-workers/base-single-thread-worker';
import { Job } from '../modules/job/job.model';
import { PredictionSetAttestation } from '../modules/prediction-set/models/prediction-set-attestation.model';
import { PredictionSet, PredictionSetStatus, ResolutionType } from '../modules/prediction-set/models/prediction-set.model';

/**
 * Finalize prediction set worker.
 */
export class FinalizePredictionSetWorker extends BaseSingleThreadWorker {
  /**
   * Runs worker executor.
   */
  public async runExecutor(_data?: any): Promise<any> {
    try {
      await this.finalizePredictionSet();
    } catch (error) {
      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error executing ${this.workerName}`, null, error);
      throw error;
    }
  }

  /**
   * Handles finalization of the prediction set.
   */
  public async finalizePredictionSet(): Promise<void> {
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
          AND ps.status = ${PredictionSetStatus.ACTIVE}
          AND ps.resolutionType = ${ResolutionType.AUTOMATIC}
          
        `,
      {}
    );

    for (const data of predictionSets) {
      const predictionSet = new PredictionSet(data, this.context);
      const attestations: PredictionSetAttestation[] = JSON.parse(data.attestations).map((d: any) => new PredictionSetAttestation(d, this.context));
      const dataSources = await predictionSet.getDataSources();

      // If data sources and attestations results doesn't match we should wait a little longer.
      if (attestations.length !== dataSources.length) {
        return;
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
          await this.writeLogToDb(
            WorkerLogStatus.ERROR,
            `Error while verifying prediction set: `,
            {
              predictionSetId: predictionSet.id,
              attestationId: attestation.id
            },
            error
          );
          break;
        }
      }

      const isVerified = validationResults.every((r) => !!r);
      if (isVerified) {
        try {
          const proofs = attestations.map((a) => a.proof);

          await finalizePredictionSetResults(proofs);
        } catch (error) {
          await this.writeLogToDb(
            WorkerLogStatus.ERROR,
            `Error while finalizing prediction set: `,
            {
              predictionSetId: predictionSet.id
            },
            error
          );
        }
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
