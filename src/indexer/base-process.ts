import { Logger } from '@nestjs/common';
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
   * Whether the shutdown handlers have been registered.
   */
  private static _shutdownHandlersRegistered = false;

  /**
   * Flag to ensure shutdown logic runs only once.
   */
  private _hasShutdown = false;

  /**
   * Constructor.
   * @param name The name of the process.
   */
  public constructor(name: string) {
    this.name = name;
  }

  /**
   * Initializes the process.
   */
  public async initialize(): Promise<void> {
    this.context = await createContext();
    this._registerShutdownSignalHandlers();
  }

  /**
   * Shuts down the process.
   */
  public async shutdown(): Promise<void> {
    if (this._hasShutdown) {
      return;
    }
    this._hasShutdown = true;

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

  /**
   * Register shutdown signal handlers.
   */
  private _registerShutdownSignalHandlers() {
    if (BaseProcess._shutdownHandlersRegistered) {
      return;
    }
    BaseProcess._shutdownHandlersRegistered = true;

    let shuttingDown = false;
    const gracefulExit = async (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;
      try {
        Logger.log(`[${this.name}]: Received ${signal} - shutting down gracefully`, 'base-process/registerSignalHandlers/gracefulExit');
        await this.shutdown();
      } catch (e) {
        Logger.error(`[${this.name}]: Error during graceful shutdown`, e, 'base-process/registerSignalHandlers/gracefulExit');
      } finally {
        process.exit(0);
      }
    };

    process.once('SIGINT', () => gracefulExit('SIGINT'));
    process.once('SIGTERM', () => gracefulExit('SIGTERM'));
  }
}
