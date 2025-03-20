import { DbTables, SqlModelStatus } from '../../config/types';
import { getAttestationProof, isRoundFinalized } from '../../lib/flare/attestation';
import { WorkerLogStatus } from '../../lib/worker/logger';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../../lib/worker/serverless-workers/base-single-thread-worker';
import { Job } from '../../modules/job/job.model';
import { PredictionSet, PredictionSetStatus, ResolutionType } from '../../modules/prediction-set/models/prediction-set.model';

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
    /**
     * We take prediction sets that:
     * - have attestation data,
     * - attestation data doesn't have proof yet,
     * - attestation has been created some time ago (to allow for time for proof to be created).
     */
    const predictionSets = await this.context.mysql.paramExecute(
      `
        SELECT
          ps.*
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
      const attestations = await predictionSet.getAttestations();

      for (const attestation of attestations) {
        try {
          const isFinalized = await isRoundFinalized(attestation.roundId);
          if (isFinalized) {
            const attestationProof = await getAttestationProof(attestation.roundId, attestation.abiEncodedRequest);
            if (attestationProof.proof.length) {
              attestation.proof = attestationProof;
              await attestation.update();
            } else {
              console.log('Invalid proof - we should wait one more cycle.');
            }
          } else {
            console.log('Round is not yet finalized.');
          }
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
