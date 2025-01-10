import { addPredictionSet } from '../lib/blockchain';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseQueueWorkerExecutor } from '../lib/worker/serverless-workers/base-queue-worker-executor';
import { PredictionSet, PredictionSetStatus } from '../modules/prediction-set/models/prediction-set.model';

/**
 * Prediction set data.
 */
export interface PredictionSetData {
  predictionSetId: number;
}

/**
 * Create prediction set on BC worker.
 */
export class CreatePredictionSetWorker extends BaseQueueWorkerExecutor {
  /**
   * Runs worker executor.
   * @param data Prediction set data.
   */
  public async runExecutor(data: PredictionSetData): Promise<any> {
    try {
      let parsedData = data;
      if (typeof data === 'string' || data instanceof String) {
        parsedData = JSON.parse(data as any);
      }

      await this.handleCreatePredictionSet(data);
    } catch (error) {
      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error executing ${this.workerName}`, null, error);
      throw error;
    }
  }

  /**
   * Handles creation of the prediction set on BC.
   * @param data Prediction set data.
   */
  public async handleCreatePredictionSet(data: PredictionSetData): Promise<void> {
    const predictionSet = await new PredictionSet({}, this.context).populateById(data.predictionSetId);
    if (!predictionSet.exists() || !predictionSet.isEnabled()) {
      await this.writeLogToDb(
        WorkerLogStatus.ERROR,
        `Prediction set with ID: ${data.predictionSetId} does not exists or is not enabled.`,
        null,
        null
      );

      return;
    }

    if (predictionSet.setStatus !== PredictionSetStatus.PENDING && predictionSet.setStatus !== PredictionSetStatus.ERROR) {
      await this.writeLogToDb(
        WorkerLogStatus.ERROR,
        `Prediction set with ID: ${data.predictionSetId} is in invalid status to process: ${PredictionSetStatus[predictionSet.setStatus]}: ${predictionSet.setStatus}.`,
        null,
        null
      );

      return;
    }

    predictionSet.setStatus = PredictionSetStatus.ACTIVE;
    try {
      await addPredictionSet(predictionSet);
    } catch (error) {
      predictionSet.setStatus = PredictionSetStatus.ERROR;

      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error while adding predictions set with ID: ${data.predictionSetId}.`, null, error);
    }

    try {
      await predictionSet.update();
    } catch (error) {
      await this.writeLogToDb(
        WorkerLogStatus.ERROR,
        `Error while updating predictions set status. ID: ${data.predictionSetId}, Status: ${PredictionSetStatus[predictionSet.setStatus]}: ${predictionSet.setStatus}.`,
        null,
        error
      );
    }
  }
}
