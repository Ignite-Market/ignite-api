import { DbTables } from '../../config/types';
import { Context } from '../../context';
import { QueueWorkerType } from './serverless-workers/base-queue-worker';

/**
 * Worker log statuses.
 */
export enum WorkerLogStatus {
  DEBUG = 0,
  START = 1,
  INFO = 2,
  WARNING = 3,
  SUCCESS = 5,
  ERROR = 9
}

/**
 * Writes worker log to the database.
 * @param context Application context.
 * @param status Worker log status.
 * @param worker Worker name.
 * @param type Worker type.
 * @param errorId Error ID.
 * @param message Log message.
 * @param data Log data.
 * @param error Error object.
 */
export async function writeWorkerLog(
  context: Context,
  status: WorkerLogStatus,
  worker: string,
  type: QueueWorkerType = null,
  message: string = null,
  data: any = null,
  error: any = null,
  errorId: string = null
) {
  if (typeof data !== 'object') {
    data = { data };
  }
  await context.mysql.paramExecute(
    `
      INSERT INTO ${DbTables.WORKER_LOG} (status, worker, type, uuid, message, data, error)
      VALUES (@status, @worker, @type, @errorId, @message, @data, @error)
    `,
    { status, worker, type, errorId, message, data, error }
  );
}
