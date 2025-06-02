import { randomUUID } from 'crypto';
import { ethers } from 'ethers';
import { env } from '../config/env';
import { SerializeFor } from '../config/types';
import { FPMM_ABI, FPMM_FACTORY_ABI } from '../lib/abis';
import { sendSlackWebhook } from '../lib/slack-webhook';
import { Contract, ContractId } from '../modules/contract/models/contract.model';
import { Job } from '../modules/job/job.model';
import { PredictionSetChainData } from '../modules/prediction-set/models/prediction-set-chain-data.model';
import { PredictionSet, PredictionSetStatus } from '../modules/prediction-set/models/prediction-set.model';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../lib/worker/serverless-workers/base-single-thread-worker';
import { WorkerLogStatus } from '../lib/worker/logger';

/**
 * Parses the creation of the prediction set on chain.
 */
export class PredictionSetsFactoryParserWorker extends BaseSingleThreadWorker {
  /**
   * Runs worker executor.
   */
  public async runExecutor(_data: any): Promise<any> {
    try {
      await this.parsePredictionSets();
    } catch (error) {
      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error executing ${this.workerName}`, null, error);
      throw error;
    }
  }

  /**
   * Parses created prediction sets and saves their blockchain data.
   */
  public async parsePredictionSets(): Promise<void> {
    const conn = await this.context.mysql.start();

    try {
      const provider = new ethers.JsonRpcProvider(env.RPC_URL);
      const contract = await new Contract({}, this.context).populateById(ContractId.FPMM_FACTORY);

      const fromBlock = contract.lastProcessedBlock + 1; // Event filters are inclusive on both sides.
      const currentBlock = (await provider.getBlockNumber()) - env.FPMM_FACTORY_BLOCK_CONFIRMATIONS; // We wait FPMM_FACTORY_BLOCK_CONFIRMATIONS block for confirmation.

      let toBlock = fromBlock + contract.parseBlockSize;
      if (toBlock > currentBlock) {
        toBlock = currentBlock;
      }

      if (fromBlock >= toBlock) {
        await this.context.mysql.rollback(conn);

        return;
      }

      const fpmmfContract = new ethers.Contract(contract.contractAddress, FPMM_FACTORY_ABI, provider);
      const events = (await fpmmfContract.queryFilter(
        fpmmfContract.filters.FixedProductMarketMakerCreation(),
        fromBlock,
        toBlock
      )) as ethers.EventLog[];

      for (const event of events) {
        const contractAddress = event.args[1];
        const conditionId = event.args[4][0];
        const txHash = event.transactionHash;
        const lastProcessedBlock = event.blockNumber;

        const chainData = await new PredictionSetChainData({}, this.context).populateByConditionId(conditionId, conn);
        if (!chainData.exists()) {
          await this.writeLogToDb(
            WorkerLogStatus.ERROR,
            `Prediction set chain data  with ID: ${chainData.id} does not exists.`,
            {
              contractAddress,
              conditionId,
              txHash,
              lastProcessedBlock,
              predictionSetChainDataId: chainData.id
            },
            null
          );

          continue;
        }

        const predictionSet = await new PredictionSet({}, this.context).populateById(chainData.prediction_set_id, conn, false, { outcomes: true });
        if (!predictionSet.exists()) {
          await this.writeLogToDb(
            WorkerLogStatus.ERROR,
            `Prediction set with ID: ${predictionSet.id} does not exists.`,
            {
              contractAddress,
              conditionId,
              txHash,
              lastProcessedBlock,
              predictionSetChainDataId: chainData.id,
              predictionSetId: predictionSet.id
            },
            null
          );

          continue;
        }

        // Update prediction set chain data.
        chainData.populate({
          contractAddress,
          txHash,
          lastProcessedBlock
        });
        await chainData.update(SerializeFor.UPDATE_DB, conn);

        // Update prediction set to funding.
        predictionSet.setStatus = PredictionSetStatus.FUNDING;
        await predictionSet.update(SerializeFor.UPDATE_DB, conn);

        // Finalize FPMM setup - For more complex markets we will need to call stepFinalizeSetup() until we reach the final state
        const signer = new ethers.Wallet(env.SIGNER_PRIVATE_KEY, provider);
        const fpmmContract = new ethers.Contract(chainData.contractAddress, FPMM_ABI, signer);

        const finalizeTx = await fpmmContract.finalizeSetup();
        await finalizeTx.wait();

        // Obtain and update outcome position IDs.
        for (const outcome of predictionSet.outcomes) {
          const positionId = await fpmmContract.positionIds(outcome.outcomeIndex);
          outcome.positionId = BigInt(positionId).toString();
          await outcome.update(SerializeFor.UPDATE_DB, conn);
        }
      }

      await contract.updateLastProcessedBlock(toBlock, conn);
      await this.context.mysql.commit(conn);
    } catch (error) {
      await this.context.mysql.rollback(conn);

      const errorId = randomUUID();
      await sendSlackWebhook(
        `
        Error while parsing prediction sets orders. See DB worker logs for more info: \n
        - Error ID: \`${errorId}\`
        `,
        true
      );

      await this.writeLogToDb(
        WorkerLogStatus.ERROR,
        `Error while parsing prediction sets: `,
        {
          errorId
        },
        error,
        errorId
      );
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
}
