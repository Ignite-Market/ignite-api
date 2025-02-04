import { DbTables, SqlModelStatus } from '../config/types';
import { getAttestationProof } from '../lib/flare/attestation';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../lib/worker/serverless-workers/base-single-thread-worker';
import { Job } from '../modules/job/job.model';
import { PredictionSetAttestation } from '../modules/prediction-set/models/prediction-set-attestation.model';
import { PredictionSet, PredictionSetStatus, ResolutionType } from '../modules/prediction-set/models/prediction-set.model';

/**
 * Request attestation proof only after some time has passed.
 */
const ATTESTATION_RESULTS_OFFSET_MINUTES = 5;

/**
 * Request prediction set attestation proof worker.
 */
export class RequestAttestationProofWorker extends BaseSingleThreadWorker {
  /**
   * Runs worker executor.
   */
  public async runExecutor(_data?: any): Promise<any> {
    try {
      await this.requestPredictionSetAttestationProofs();
    } catch (error) {
      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error executing ${this.workerName}`, null, error);
      throw error;
    }
  }

  /**
   * Handles obtaining of the prediction set proofs for prediction sets that already requested their attestations.
   */
  public async requestPredictionSetAttestationProofs(): Promise<void> {
    const predictionSets = await this.context.mysql.paramExecute(
      `
        SELECT 
          ps.*, 
          COALESCE(
            CONCAT(
              '[', 
              GROUP_CONCAT(
                DISTINCT JSON_OBJECT(
                  'id', psa.id,
                  'prediction_set_id', psa.prediction_set_id,
                  'data_source_id', psa.data_source_id,
                  'roundId', psa.roundId,
                  'abiEncodedRequest', psa.abiEncodedRequest,
                  'status', psa.status,
                  'createTime', psa.createTime,
                  'updateTime', psa.updateTime
                )
              ), 
              ']'
            ), 
            '[]'
          ) AS attestations
        FROM ${DbTables.PREDICTION_SET} ps
        INNER JOIN ${DbTables.PREDICTION_SET_ATTESTATION} psa
          ON ps.id = psa.prediction_set_id
        WHERE 
          psa.proof IS NULL
          AND psa.createTime <= 
            SUBDATE(
              NOW(),
              INTERVAL ${ATTESTATION_RESULTS_OFFSET_MINUTES} MINUTE
            )
          AND ps.status = ${SqlModelStatus.ACTIVE}
          AND ps.setStatus = ${PredictionSetStatus.ACTIVE}
          AND ps.resolutionType = ${ResolutionType.AUTOMATIC}
        GROUP BY ps.id
        `,
      {}
    );

    for (const data of predictionSets) {
      const predictionSet = new PredictionSet(data, this.context);

      const attestations: PredictionSetAttestation[] = JSON.parse(data.attestations).map((d: any) => new PredictionSetAttestation(d, this.context));
      for (const attestation of attestations) {
        try {
          attestation.proof = await getAttestationProof(attestation.roundId, attestation.abiEncodedRequest);
          await attestation.update();
        } catch (error) {
          await this.writeLogToDb(
            WorkerLogStatus.ERROR,
            `Error while requesting attestation proof: `,
            {
              predictionSetId: predictionSet.id,
              attestationId: attestation.id
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
