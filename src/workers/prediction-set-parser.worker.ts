import { ethers } from 'ethers';
import { env } from '../config/env';
import { DbTables, SqlModelStatus } from '../config/types';
import { setup } from '../lib/blockchain';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseQueueWorker } from '../lib/worker/serverless-workers/base-queue-worker';
import { OutcomeChance } from '../modules/prediction-set/models/outcome-chance.model';
import { PredictionSet, PredictionSetStatus } from '../modules/prediction-set/models/prediction-set.model';

interface FundingAddedEvent {
  txHash: string;
  funder: string;
  amount: string;
  sharesMinted: string;
}

/**
 * Parses prediction set contracts.
 */
export class PredictionSetParserWorker extends BaseQueueWorker {
  /**
   * Gets predictions set IDs.
   * @returns Array of prediction set IDs.
   */
  public async runPlanner(): Promise<number[]> {
    const predictionSetIds = await this.context.mysql.paramExecute(
      `
        SELECT ps.id
        FROM ${DbTables.PREDICTION_SET} ps
        INNER JOIN ${DbTables.PREDICTION_SET_CHAIN_DATA} cd
          ON ps.id = cd.prediction_set_id
        WHERE 
          ps.setStatus = ${PredictionSetStatus.ACTIVE}
          AND ps.status = ${SqlModelStatus.ACTIVE}
          AND cd.status = ${SqlModelStatus.ACTIVE}
          AND cd.contractAddress IS NOT NULL
        `,
      {}
    );

    return predictionSetIds.map((d) => d.id);
  }

  /**
   *
   * @param predictionSetId Prediction set IDs.
   */
  public async runExecutor(predictionSetId: number): Promise<any> {
    const conn = await this.context.mysql.start();

    try {
      const predictionSet = await new PredictionSet({}, this.context).populateById(predictionSetId, null, false, { outcomes: true, chainData: true });
      if (!predictionSet.exists() && predictionSet.setStatus !== PredictionSetStatus.FUNDED) {
        await this.writeLogToDb(
          WorkerLogStatus.ERROR,
          `Prediction set with ID: ${predictionSetId} does not exists or is not funded.`,
          {
            predictionSetId,
            predictionSetStatus: predictionSet.setStatus
          },
          null
        );

        await this.context.mysql.rollback(conn);
        return;
      }

      const { fpmmContract, provider } = setup(predictionSet.chainData.contractAddress);

      const fromBlock = predictionSet.chainData.lastProcessedBlock + 1; // Event filters are inclusive on both sides.
      const currentBlock = (await provider.getBlockNumber()) - env.FPMM_BLOCK_CONFIRMATIONS; // We wait FPMM_FACTORY_BLOCK_CONFIRMATIONS block for confirmation.

      let toBlock = fromBlock + predictionSet.chainData.parseBlockSize;
      if (toBlock > currentBlock) {
        toBlock = currentBlock;
      }

      if (fromBlock >= toBlock) {
        await this.context.mysql.rollback(conn);

        return;
      }

      // Funding added events.
      // FPMMFundingAdded (index_topic_1 address funder, uint256[] amountsAdded, uint256 sharesMinted)
      const fundingEvents = (await fpmmContract.queryFilter(fpmmContract.filters.FPMMFundingAdded(), fromBlock, toBlock)) as ethers.EventLog[];
      for (const fundingEvent of fundingEvents) {
        console.log(fundingEvent);
        // console.log(fundingEvent.args);
      }

      // Buy events.
      // FPMMBuy (index_topic_1 address buyer, uint256 investmentAmount, uint256 feeAmount, index_topic_2 uint256 outcomeIndex, uint256 outcomeTokensBought)
      const buyEvents = (await fpmmContract.queryFilter(fpmmContract.filters.FPMMBuy(), fromBlock, toBlock)) as ethers.EventLog[];
      // console.log(buyEvents);

      //   'inputs': [
      //     { 'indexed': true, 'name': 'seller', 'type': 'address' },
      //     { 'indexed': false, 'name': 'returnAmount', 'type': 'uint256' },
      //     { 'indexed': false, 'name': 'feeAmount', 'type': 'uint256' },
      //     { 'indexed': true, 'name': 'outcomeIndex', 'type': 'uint256' },
      //     { 'indexed': false, 'name': 'outcomeTokensSold', 'type': 'uint256' }
      //   ],
      //   'name': 'FPMMSell',
      const sellEvents = (await fpmmContract.queryFilter(fpmmContract.filters.FPMMSell(), fromBlock, toBlock)) as ethers.EventLog[];
    } catch (error) {
      await this.writeLogToDb(
        WorkerLogStatus.ERROR,
        'Error while parsing prediction set events: ',
        {
          predictionSetId
        },
        error
      );
    }
  }
}
