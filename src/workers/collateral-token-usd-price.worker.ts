import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { env } from '../config/env';
import { AppEnvironment, DbTables, SqlModelStatus } from '../config/types';
import { sendSlackWebhook } from '../lib/slack-webhook';
import { getTokenPrice } from '../lib/token-prices';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../lib/worker/serverless-workers/base-single-thread-worker';
import { CollateralToken } from '../modules/collateral-token/models/collateral-token.model';
import { Job } from '../modules/job/job.model';

/**
 * Collateral token USD price worker.
 */
export class CollateralTokenUsdPriceWorker extends BaseSingleThreadWorker {
  /**
   * Runs worker executor.
   */
  public async runExecutor(_data?: any): Promise<any> {
    try {
      await this.updateCollateralTokenUsdPrices();
    } catch (error) {
      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error executing ${this.workerName}`, null, error);
      throw error;
    }
  }

  /**
   * Update collateral token USD prices.
   */
  public async updateCollateralTokenUsdPrices(): Promise<void> {
    const collateralTokens = await this.context.mysql.paramExecute(
      `
        SELECT *
        FROM ${DbTables.COLLATERAL_TOKEN} ct
        WHERE ct.status <> ${SqlModelStatus.DELETED}
        `,
      {}
    );

    for (const data of collateralTokens) {
      const collateralToken = new CollateralToken(data, this.context);
      if (collateralToken.symbol.toLowerCase().startsWith('usd')) {
        continue;
      }

      try {
        collateralToken.usdPrice = await getTokenPrice(collateralToken.usdPriceId);
        await collateralToken.update();
      } catch (error) {
        const errorId = randomUUID();

        await this._checkLastUpdate(collateralToken, errorId);
        await this.writeLogToDb(
          WorkerLogStatus.ERROR,
          `Error while getting token collateral token USD price.`,
          {
            collateralTokenId: collateralToken.id
          },
          error,
          errorId
        );
      }
    }
  }

  /**
   * On alert event handling.
   *
   * @param _job Job.
   * @param alertType Alert type.
   */
  public async onAlert(_job: Job, alertType: SingleThreadWorkerAlertType) {
    if (alertType === SingleThreadWorkerAlertType.JOB_LOCKED) {
      throw new Error(`${this.workerName} - LOCK ALERT HAS BEEN CALLED`);
    }
    if (alertType === SingleThreadWorkerAlertType.MISSING_JOB_DEFINITION) {
      throw new Error(`${this.workerName} - MISSING JOB ALERT HAS BEEN CALLED`);
    }
  }

  /**
   * Check when last price was updated and sends report if over threshold.
   */
  private async _checkLastUpdate(collateralToken: CollateralToken, errorId: string) {
    if (env.APP_ENV === AppEnvironment.PROD) {
      try {
        // 1 hour
        if (Number(new Date()) - Number(collateralToken.updateTime) > 1 * 60 * 60 * 1000) {
          await sendSlackWebhook(
            `
              Error while updating USD price for collateral token. See DB worker logs for more info:: \n
              - Error ID: \`${errorId}\` \n
              - Last update: \`${collateralToken.updateTime.toLocaleString()}\` \n
              - Token: \`${collateralToken.symbol}\`
            `
          );
        }
      } catch (error) {
        Logger.error('Error while checking last price update: ', error, 'collateral-token-usd-price.worker.ts/_checkLastUpdate');
      }
    }
  }
}
