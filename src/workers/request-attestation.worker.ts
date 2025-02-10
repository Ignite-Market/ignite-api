import { DbTables, SqlModelStatus } from '../config/types';
import { prepareAttestationRequest, submitAttestationRequest } from '../lib/flare/attestation';
import { AttestationVerifierStatus } from '../lib/flare/types';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../lib/worker/serverless-workers/base-single-thread-worker';
import { Job } from '../modules/job/job.model';
import { PredictionSetAttestation } from '../modules/prediction-set/models/prediction-set-attestation.model';
import { PredictionSet, PredictionSetStatus, ResolutionType } from '../modules/prediction-set/models/prediction-set.model';

/**
 * Request prediction set attestation worker.
 */
export class RequestAttestationWorker extends BaseSingleThreadWorker {
  /**
   * Runs worker executor.
   */
  public async runExecutor(_data?: any): Promise<any> {
    try {
      await this.requestPredictionSetAttestations();
    } catch (error) {
      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error executing ${this.workerName}`, null, error);
      throw error;
    }
  }

  /**
   * Handles creation of prediction set attestations for prediction sets that ended.
   */
  public async requestPredictionSetAttestations(): Promise<void> {
    // TODO: Test resolution time.
    const predictionSets = await this.context.mysql.paramExecute(
      `
        SELECT *
        FROM ${DbTables.PREDICTION_SET} ps
        LEFT JOIN ${DbTables.PREDICTION_SET_ATTESTATION} a 
          ON ps.id = a.prediction_set_id
        WHERE 
          ps.status = ${SqlModelStatus.ACTIVE}
          AND ps.setStatus = ${PredictionSetStatus.ACTIVE}
          AND ps.resolutionType = ${ResolutionType.AUTOMATIC}
          AND ps.endTime <= NOW()
          AND ps.resolutionTime >= NOW() 
          AND a.prediction_set_id IS NULL
        `,
      {}
    );

    for (const data of predictionSets) {
      const predictionSet = new PredictionSet(data, this.context);

      const dataSources = await predictionSet.getDataSources();
      for (const dataSource of dataSources) {
        try {
          const attestationRequest = await prepareAttestationRequest(dataSource.endpoint, dataSource.jqQuery, dataSource.abi);
          if (attestationRequest.status === AttestationVerifierStatus.VALID) {
            const roundId = await submitAttestationRequest(attestationRequest);
            if (!roundId) {
              await this.writeLogToDb(WorkerLogStatus.ERROR, `Invalid attestation round ID: `, {
                predictionSetId: predictionSet.id,
                dataSourceId: dataSource.id,
                attestationRequest,
                roundId
              });

              continue;
            }

            await new PredictionSetAttestation(
              {
                roundId,
                data_source_id: dataSource.id,
                prediction_set_id: predictionSet.id,
                abiEncodedRequest: attestationRequest.abiEncodedRequest
              },
              this.context
            ).insert();
          } else {
            await this.writeLogToDb(WorkerLogStatus.ERROR, `Invalid attestation request: `, {
              predictionSetId: predictionSet.id,
              dataSourceId: dataSource.id,
              attestationRequest
            });
          }
        } catch (error) {
          await this.writeLogToDb(
            WorkerLogStatus.ERROR,
            `Error while requesting attestation: `,
            {
              predictionSetId: predictionSet.id,
              dataSourceId: dataSource.id
            },
            error
          );

          continue;
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
