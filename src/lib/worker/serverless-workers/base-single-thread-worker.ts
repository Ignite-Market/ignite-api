import * as dayjs from 'dayjs';
import moment from 'moment';
import { WorkerDefinition } from '.';
import { DbTables, SerializeFor } from '../../../config/types';
import { Context } from '../../../context';
import { Job, JobStatus } from '../../../modules/job/job.model';
import { WorkerLogStatus } from '../logger';
import { BaseWorker } from './base-worker';

/**
 * Single threat worker alert type.
 */
export enum SingleThreadWorkerAlertType {
  MISSING_JOB_DEFINITION,
  JOB_LOCKED,
  NOT_ACTIVE
}

/**
 * Base single thread worker definition.
 */
export abstract class BaseSingleThreadWorker extends BaseWorker {
  /**
   * Job definition.
   */
  private job: Job;

  /**
   * Tells if job should be ran.
   */
  private shouldRunJob = true;

  /**
   * Worker that is forced to run as in single thread. All parallel instances will fail to run.
   *
   * @param workerDefinition Worker definition.
   * @param context Application context.
   */
  public constructor(workerDefinition: WorkerDefinition, context: Context) {
    super(workerDefinition, context);
  }

  public abstract runExecutor(data: any): Promise<any>;
  public abstract onAlert(job: Job, alertType: SingleThreadWorkerAlertType): Promise<any>;

  public async before(_data?: any): Promise<any> {
    // Lock data in DB with transaction.
    const conn = await this.context.mysql.start();

    // Validate job ID and check for active jobs.
    try {
      if (this.workerDefinition.id) {
        this.job = await new Job({}, this.context).populateById(
          this.workerDefinition.id,
          conn,
          true // Lock row in DB.
        );
      } else {
        this.job = await new Job({}, this.context).populateByName(
          this.workerDefinition.workerName,
          conn,
          true // Lock row in DB.
        );
      }

      // Ensure job is in a correct state.
      this.shouldRunJob = await this.checkLockedStatus();
      if (!this.shouldRunJob) {
        await this.context.mysql.rollback(conn);
        return;
      }

      // Inc executor count and set locked status
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
    if (!this.shouldRunJob) {
      return;
    }
    // All errors inside worker will cause job state update.
    await this.runExecutor(data ? JSON.parse(data) : null);
  }

  public async onUpdateWorkerDefinition(): Promise<void> {
    if (!this.shouldRunJob) {
      return;
    }
    await this.job.updateWorkerDefinition(this.workerDefinition);
  }

  public async onSuccess(): Promise<any> {
    if (!this.shouldRunJob) {
      this.writeLogToDb(WorkerLogStatus.WARNING, 'Warning! Job was locked, message discarded!');
      return;
    }

    await this.updateJobState();
    await this.writeLogToDb(WorkerLogStatus.DEBUG, 'Job completed!');
  }

  public async onError(error): Promise<any> {
    await this.writeLogToDb(WorkerLogStatus.ERROR, 'Error!', null, error);
    throw error;
  }

  private async checkLockedStatus(): Promise<boolean> {
    if (!this.job.exists()) {
      await this.fireAlert(SingleThreadWorkerAlertType.MISSING_JOB_DEFINITION);
      return false;
    }

    console.log(`${dayjs().diff(dayjs(this.job.lastRun), 'second')} seconds since last job run! TIMEOUT=(${this.job.timeout})`);

    // If past timeout - ignore count and locked status.
    if (
      !!this.job.lastRun &&
      !!this.job.timeout &&
      this.job.status === JobStatus.LOCKED &&
      dayjs().diff(dayjs(this.job.lastRun), 'second') >= this.job.timeout
    ) {
      this.job.executorCount = 0;
      this.job.lastError = 'TIMEOUT EXCEEDED';
      this.job.lastFailed = this.job.nextRun;
      await this.writeLogToDb(WorkerLogStatus.WARNING, 'Warning! Running locked worker because timeout reached.');

      return true;
    }

    if (this.job.executorCount >= 1 || this.job.status === JobStatus.LOCKED) {
      await this.fireAlert(SingleThreadWorkerAlertType.JOB_LOCKED);
      return false;
    }

    if (this.job.status !== JobStatus.ACTIVE) {
      await this.fireAlert(SingleThreadWorkerAlertType.NOT_ACTIVE);
      const errorMessage = `Job in invalid status! (STATUS = ${this.job.status}) Terminating worker. For ${this.workerDefinition?.workerName}`;
      throw new Error(errorMessage);
    }

    return true;
  }

  public async onAutoRemove(): Promise<any> {
    if (!this.shouldRunJob) {
      return;
    }

    await this.context.mysql.paramExecute(`DELETE FROM ${DbTables.JOB} WHERE id = @id`, {
      id: this.workerDefinition.id
    });
  }

  private async updateJobState() {
    if (!this.job || !this.job.id) {
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
