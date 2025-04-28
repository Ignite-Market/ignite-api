import { Logger } from '@nestjs/common';
import * as pm2 from 'pm2';
import { Context } from '../context';
import { createContext } from '../lib/utils';
import { WorkerLogStatus, writeWorkerLog } from '../lib/worker/logger';

/**
 * Base class for all processes.
 */
export class BaseProcess {
  /**
   * Application context.
   */
  public context: Context;

  /**
   * The name of the process.
   */
  public name: string;

  /**
   * Constructor.
   * @param name The name of the process.
   */
  public constructor(name: string) {
    this.name = name;
  }

  /**
   * Initializes the process.
   * @param connectToPM2 Whether to connect to PM2.
   */
  public async initialize(connectToPM2: boolean = false): Promise<void> {
    this.context = await createContext();

    if (connectToPM2) {
      await new Promise((resolve, reject) => {
        pm2.connect((error) => {
          if (error) {
            Logger.error(this.name + ': Error connecting to PM2:', error, 'base-process.ts/initialize');
            reject(error);
            return;
          }
          Logger.log(this.name + ': Connected to PM2 successfully.', 'base-process.ts/initialize');
          resolve(true);
        });
      });
    }
  }

  /**
   * Shuts down the process.
   */
  public async shutdown(): Promise<void> {
    if (this.context && this.context.mysql) {
      await this.context.mysql.close();
    }
  }

  /**
   * Write log to database.
   * @param status Worker status.
   * @param message Message.
   * @param data Any data in JSON.
   * @param error Error object.
   */
  public async writeLogToDb(status: WorkerLogStatus, message: string, data?: any, error?: any, errorId?: string) {
    try {
      if (error?.message) {
        message += ` (${error.message})`;
        status = WorkerLogStatus.ERROR;
      }
      await writeWorkerLog(this.context, status, this.name, null, message, data, error, errorId);
      Logger.log(this.name + ': ' + message, error, 'base-process.ts/writeLogToDb');
    } catch (e) {
      Logger.error(this.name + ': ' + error.message, e, 'base-process.ts/writeLogToDb');
    }
  }
}
