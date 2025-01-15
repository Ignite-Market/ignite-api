import { ServerlessWorker, WorkerDefinition } from '.';
import { Context } from '../../../context';
import { WorkerLogStatus, writeWorkerLog } from '../logger';

export abstract class BaseWorker extends ServerlessWorker {
  protected context: Context;
  protected workerName: string;
  protected logPrefix: string;

  public constructor(workerDefinition: WorkerDefinition, context: Context) {
    super(workerDefinition);
    this.context = context;
    this.workerName = workerDefinition.workerName;
    this.logPrefix ||= `[${this.workerName}]`;
  }

  /**
   * Write log to database
   * @param status worker status
   * @param message message
   * @param data any data in JSON
   * @param error Error object
   */
  protected async writeLogToDb(status: WorkerLogStatus, message: string, data?: any, error?: any) {
    try {
      if (error?.message) {
        message += ` (${error.message})`;
        status = WorkerLogStatus.ERROR;
      }
      await writeWorkerLog(this.context, status, this.workerName, null, message, data, error);
      this.logFn(`${this.workerName} ${message}`, error);
    } catch (e) {
      console.log('ERROR writing worker log to database!');
      this.logFn(`${this.workerName} ${error.message}`, e);
    }
  }
}
