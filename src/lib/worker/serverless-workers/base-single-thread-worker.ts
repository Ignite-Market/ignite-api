/* eslint-disable @typescript-eslint/member-ordering */
import { WorkerDefinition } from '.';
import moment from 'moment';
import { BaseWorker } from './base-worker';
import { DbTables, SerializeFor } from '../../../config/types';
import { Context } from '../../../context';
import { Job, JobStatus } from '../../../modules/job/job.model';
import { WorkerLogStatus } from '../logger';

export enum SingleThreadWorkerAlertType {
  MISSING_JOB_DEFINITION,
  JOB_LOCK_TIMEOUT
}

/**
 * Single thread worker class.
 */
export abstract class BaseSingleThreadWorker extends BaseWorker {
  private job: Job;
  private shouldUpdateState = false;

  /**
   * Worker that is forced to run as in single thread. All parallel instances will fail to run.
   *
   * @param workerDefinition
   * @param context
   */
  public constructor(workerDefinition: WorkerDefinition, context: Context) {
    super(workerDefinition, context);
  }

  public abstract runExecutor(data: any): Promise<any>;
  public abstract onAlert(job: Job, alertType: SingleThreadWorkerAlertType): Promise<any>;

  public async before(_data?: any): Promise<any> {
    // lock data in DB with transaction
    const conn = await this.context.mysql.start();

    // validate job ID and check for active jobs
    try {
      if (this.workerDefinition.id) {
        this.job = await new Job({}, this.context).populateById(
          this.workerDefinition.id,
          conn,
          true // lock row in DB
        );
      } else {
        this.job = await new Job({}, this.context).populateByName(
          this.workerDefinition.workerName,
          conn,
          true // lock row in DB
        );
      }

      // on those errors job state should not be reset!
      if (!this.job.exists()) {
        await this.fireAlert(SingleThreadWorkerAlertType.MISSING_JOB_DEFINITION);
        throw new Error(`Job not found: (ID = ${this.workerDefinition.id}`);
      }
      if (this.job.executorCount >= 1) {
        await this.fireAlert(SingleThreadWorkerAlertType.JOB_LOCK_TIMEOUT);
        throw new Error('Job already running! Terminating worker.');
      }
      if (this.job.status !== JobStatus.ACTIVE) {
        await this.fireAlert(SingleThreadWorkerAlertType.JOB_LOCK_TIMEOUT);
        throw new Error(`Job in invalid status! (STATUS = ${this.job.status}) Terminating worker.`);
      }

      // inc executor count and set locked status
      this.job.executorCount = this.job.executorCount ? this.job.executorCount + 1 : 1;
      this.job.status = JobStatus.LOCKED;

      this.workerDefinition = new WorkerDefinition(this.workerDefinition.serviceDefinition, this.job.name, this.job.getWorkerDefinition());

      await this.job.update(SerializeFor.UPDATE_DB, conn);
      await this.context.mysql.commit(conn);
    } catch (err) {
      await this.context.mysql.rollback(conn);
      throw err;
    }
  }

  public async execute(data?: any): Promise<any> {
    await this.writeLogToDb(WorkerLogStatus.DEBUG, 'Started SINGLE THREAD worker', null, null);
    // all errors inside worker will cause job state update
    this.shouldUpdateState = true;

    await this.runExecutor(data ? JSON.parse(data) : null);
  }

  public async onUpdateWorkerDefinition(): Promise<void> {
    await this.job.updateWorkerDefinition(this.workerDefinition);
  }

  public async onSuccess(): Promise<any> {
    await this.updateJobState();
    await this.writeLogToDb(WorkerLogStatus.DEBUG, 'Job completed!', null, null);
  }

  public async onError(error): Promise<any> {
    await this.writeLogToDb(WorkerLogStatus.ERROR, 'Error!', null, error);
    // try to reset job state so next time worker will run.
    await this.updateJobState();
    throw error;
  }

  public async onAutoRemove(): Promise<any> {
    await this.context.mysql.paramExecute(`DELETE FROM ${DbTables.JOB} WHERE id = @id`, {
      id: this.workerDefinition.id
    });
  }

  private async updateJobState() {
    // only update job state if shouldUpdateState flag is set.
    if (!this.job || !this.job.id || !this.shouldUpdateState) {
      return;
    }
    await this.job.reload();
    if (this.job.status === JobStatus.LOCKED) {
      this.job.status = JobStatus.ACTIVE;
    }
    this.job.executorCount = this.job.executorCount ? this.job.executorCount - 1 : 0;
    await this.job.update();
  }

  private async fireAlert(alertType: SingleThreadWorkerAlertType) {
    if (
      alertType === SingleThreadWorkerAlertType.MISSING_JOB_DEFINITION ||
      moment(this.job.lastRun)
        .add(this.job?.timeout || 15 * 60, 'seconds')
        .isBefore(moment())
    ) {
      await this.onAlert(this.job, alertType);
    }
  }
}
