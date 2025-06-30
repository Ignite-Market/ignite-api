import { Logger } from '@nestjs/common';
import * as pm2 from 'pm2';
import { env } from '../config/env';
import { Context } from '../context';
import { ChannelList, sendSlackWebhook } from '../lib/slack-webhook';
import { createContext } from '../lib/utils';
import { ProcessName } from './types';

/**
 * Indexer service that manages worker processes using PM2.
 */
export class Indexer {
  /**
   * Application context.
   */
  private _context: Context;

  /**
   * Array of PM2 processes.
   */
  private _processes: Map<string, { scriptName: string; cronSchedule?: string; isRunning: boolean }> = new Map();

  /**
   * Initializes the indexer service.
   */
  public async initialize(): Promise<void> {
    Logger.log('Initializing indexer service...', 'indexer.ts/initialize');

    // Create context.
    this._context = await createContext(); // TODO: Do we need db connection here.

    // Connect to PM2
    await this._connectToPM2();

    // Initialize worker processes in PM2
    await this._initializeWorkerProcesses();

    Logger.log('Indexer service initialized successfully.', 'indexer.ts/initialize');
  }

  /**
   * Connects to PM2.
   */
  private async _connectToPM2(): Promise<void> {
    try {
      await new Promise((resolve, reject) => {
        pm2.connect((error) => {
          if (error) {
            Logger.error('Error connecting to PM2:', error, 'indexer.ts/_connectToPM2');
            reject(error);
            return;
          }
          Logger.log('Connected to PM2 successfully.', 'indexer.ts/_connectToPM2');

          resolve(true);
        });
      });
    } catch (error) {
      Logger.error('Error connecting to PM2 service:', error, 'indexer.ts/_connectToPM2');

      await sendSlackWebhook(
        `
            *[INDEXER ERROR]*: Error connecting to PM2 service: \n
            - Error: \`${error}\`
            `,
        true,
        ChannelList.INDEXER
      );

      await this.shutdown();
    }
  }

  /**
   * Initializes worker processes in PM2.
   */
  private async _initializeWorkerProcesses(): Promise<void> {
    // Define processes.
    this._processes.set(ProcessName.PREDICTION_SET_PARSER_PLANNER, {
      scriptName: 'prediction-set-parser-planner',
      cronSchedule: env.INDEXER_PREDICTION_SET_PARSER_CRON,
      isRunning: false
    });

    // Start recurring processes.
    for (const [processName, process] of this._processes.entries()) {
      if (process.cronSchedule) {
        try {
          await new Promise((resolve, reject) => {
            pm2.start(
              {
                script: `./dist/indexer/process-scripts/${process.scriptName}.js`,
                name: processName,
                cron: process.cronSchedule,
                instances: 1,
                exec_mode: 'cluster'
              },
              (error) => {
                if (error) {
                  reject(error);
                }

                process.isRunning = true;
                resolve(true);
              }
            );
          });
        } catch (error) {
          Logger.error('Error initializing worker process:', error, 'indexer.ts/initialize');

          await sendSlackWebhook(
            `
            *[INDEXER ERROR]*: Error initializing worker process: \n
            - Error: \`${error}\`
            `,
            true,
            ChannelList.INDEXER
          );

          await this.shutdown();
        }
      }
    }
  }

  /**
   * Shuts down the indexer service.
   */
  public async shutdown(): Promise<void> {
    Logger.log('Shutting down indexer service...', 'indexer.ts/shutdown');

    // Stop all running worker processes.
    for (const [processName, process] of this._processes.entries()) {
      if (process.isRunning) {
        try {
          await new Promise((resolve, reject) => {
            pm2.stop(processName, (error) => {
              if (error) {
                Logger.error(`Error stopping worker ${processName}:`, error, 'indexer.ts/shutdown');
                reject(error);
                return;
              }

              process.isRunning = false;
              Logger.log(`Worker ${processName} stopped successfully.`, 'indexer.ts/shutdown');
              resolve(true);
            });
          });
        } catch (error) {
          Logger.error(`Error stopping worker ${processName}:`, error, 'indexer.ts/shutdown');
        }
      }
    }

    // Disconnect from PM2.
    pm2.disconnect();

    // Close database connection.
    if (this._context && this._context.mysql) {
      await this._context.mysql.close();
    }

    Logger.log('Indexer service shut down successfully.', 'indexer.ts/shutdown');
  }
}
