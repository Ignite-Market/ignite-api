import { DbTables } from '../../config/types';
import { Context } from '../../context';
import { QueueWorkerType } from './serverless-workers';

export enum WorkerLogStatus {
  DEBUG = 0,
  START = 1,
  INFO = 2,
  WARNING = 3,
  SUCCESS = 5,
  ERROR = 9,
}

export async function writeWorkerLog(
  context: Context,
  status: WorkerLogStatus,
  worker: string,
  type: QueueWorkerType = null,
  message: string = null,
  data: any = null
) {
  if (typeof data !== 'object') {
    data = { data };
  }
  await context.mysql.paramExecute(
    `
      INSERT INTO ${DbTables.WORKER_LOG} (status, worker, type, message, data)
      VALUES (@status, @worker, @type, @message, @data)
    `,
    { status, worker, type, message, data }
  );
}
