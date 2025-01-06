import { SerializeFor } from '../config/types';
import { addPredictionGroup } from '../lib/blockchain';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseWorker } from '../lib/worker/serverless-workers';
import { Job } from '../modules/job/job.model';
import { PredictionGroup, PredictionGroupStatus } from '../modules/prediction-set/models/prediction-group.model';
import { PredictionSetStatus } from '../modules/prediction-set/models/prediction-set.model';

/**
 * Prediction group data.
 */
export interface PredictionGroupData {
  predictionGroupId: number;
}

/**
 * Create prediction group on BC worker.
 */
export class CreatePredictionGroupWorker extends BaseWorker {
  public async before(_data?: any): Promise<any> {
    return;
  }

  public async execute(data: PredictionGroupData): Promise<any> {
    try {
      let parsedData = data;
      if (typeof data === 'string' || data instanceof String) {
        parsedData = JSON.parse(data as any);
      }

      await this.handleCreatePredictionGroup(parsedData);
    } catch (error) {
      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error executing ${this.workerName}`, null, error);
      throw error;
    }
  }

  public async onSuccess(_data?: any, _successData?: any): Promise<any> {
    return;
  }

  public async onError(error: Error): Promise<any> {
    await this.writeLogToDb(WorkerLogStatus.ERROR, `Error executing ${this.workerName}`, null, error);
  }

  public async onUpdateWorkerDefinition(): Promise<void> {
    await new Job({}, this.context).updateWorkerDefinition(this.workerDefinition);
  }

  public onAutoRemove(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   * Handles creation of the prediction group on BC.
   * @param data Prediction set data.
   */
  public async handleCreatePredictionGroup(data: PredictionGroupData): Promise<void> {
    const predictionGroup = await new PredictionGroup({}, this.context).populateById(data.predictionGroupId);
    if (!predictionGroup.exists() || !predictionGroup.isEnabled()) {
      await this.writeLogToDb(
        WorkerLogStatus.ERROR,
        `Prediction group with ID: ${data.predictionGroupId} does not exists or is not enabled.`,
        null,
        null
      );

      return;
    }

    if (predictionGroup.groupStatus !== PredictionGroupStatus.PENDING && predictionGroup.groupStatus !== PredictionGroupStatus.ERROR) {
      await this.writeLogToDb(
        WorkerLogStatus.ERROR,
        `Prediction group with ID: ${data.predictionGroupId} is in invalid status to process: ${PredictionSetStatus[predictionGroup.groupStatus]}: ${predictionGroup.groupStatus}.`,
        null,
        null
      );

      return;
    }

    predictionGroup.groupStatus = PredictionGroupStatus.ACTIVE;
    try {
      await addPredictionGroup();
    } catch (error) {
      predictionGroup.groupStatus = PredictionGroupStatus.ERROR;

      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error while adding predictions group with ID: ${data.predictionGroupId}.`, null, error);
    }

    const conn = await this.context.mysql.start();
    try {
      await predictionGroup.update(SerializeFor.UPDATE_DB, conn);

      const setsStatus = predictionGroup.groupStatus === PredictionGroupStatus.ACTIVE ? PredictionSetStatus.ACTIVE : PredictionSetStatus.ERROR;
      await predictionGroup.updatePredictionSetsStatus(setsStatus, conn);

      await this.context.mysql.commit(conn);
    } catch (error) {
      await this.context.mysql.rollback(conn);
      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error while updating predictions set status. ID: ${data.predictionGroupId}.`, null, error);
    }
  }
}
