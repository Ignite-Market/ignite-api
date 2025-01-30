import { randomUUID } from 'crypto';
import { ethers } from 'ethers';
import { env } from '../config/env';
import { SerializeFor } from '../config/types';
import { ORACLE_ABI } from '../lib/abis';
import { PredictionSetBcStatus } from '../lib/blockchain';
import { sendSlackWebhook } from '../lib/slack-webhook';
import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../lib/worker/serverless-workers/base-single-thread-worker';
import { Contract, ContractId } from '../modules/contract/models/contract.model';
import { Job } from '../modules/job/job.model';
import { Outcome } from '../modules/prediction-set/models/outcome.model';
import { PredictionSetChainData } from '../modules/prediction-set/models/prediction-set-chain-data.model';
import { PredictionSet, PredictionSetStatus } from '../modules/prediction-set/models/prediction-set.model';
import { OutcomeVotingTransaction } from '../modules/prediction-set/models/transactions/outcome-voting-transaction.model';
import { User } from '../modules/user/models/user.model';

/**
 * Parses voting events emitted by Ignite Oracle.
 */
export class VotingParserWorker extends BaseSingleThreadWorker {
  /**
   * Runs worker executor.
   */
  public async runExecutor(_data: any): Promise<any> {
    try {
      await this.parseVotes();
    } catch (error) {
      await this.writeLogToDb(WorkerLogStatus.ERROR, `Error executing ${this.workerName}`, null, error);
      throw error;
    }
  }

  /**
   * Parses voting events emitted by Ignite Oracle.
   */
  public async parseVotes(): Promise<void> {
    const conn = await this.context.mysql.start();

    try {
      const provider = new ethers.JsonRpcProvider(env.RPC_URL);
      const contract = await new Contract({}, this.context).populateById(ContractId.IGNITE_ORACLE);

      const fromBlock = contract.lastProcessedBlock + 1; // Event filters are inclusive on both sides.
      const currentBlock = (await provider.getBlockNumber()) - env.ORACLE_BLOCK_CONFIRMATIONS; // We wait N block for confirmation.

      let toBlock = fromBlock + contract.parseBlockSize;
      if (toBlock > currentBlock) {
        toBlock = currentBlock;
      }

      if (fromBlock >= toBlock) {
        await this.context.mysql.rollback(conn);

        return;
      }

      const oracleContract = new ethers.Contract(contract.contractAddress, ORACLE_ABI, provider);
      const events = (await oracleContract.queryFilter(oracleContract.filters.VoteSubmitted(), fromBlock, toBlock)) as ethers.EventLog[];

      for (const event of events) {
        const voterAddress = event.args[0];
        const questionId = event.args[1];
        const outcomeIndex = Number(event.args[2]);
        const txHash = event.transactionHash;

        const chainData = await new PredictionSetChainData({}, this.context).populateByQuestionId(questionId, conn);
        if (!chainData.exists()) {
          await this.writeLogToDb(
            WorkerLogStatus.ERROR,
            `Prediction set chain data  with question ID: ${questionId} does not exists.`,
            {
              voterAddress,
              questionId,
              outcomeIndex,
              txHash
            },
            null
          );

          continue;
        }

        const predictionSet = await new PredictionSet({}, this.context).populateById(chainData.prediction_set_id, conn, false, { outcomes: true });
        if (!predictionSet.exists()) {
          await this.writeLogToDb(
            WorkerLogStatus.ERROR,
            `Prediction set with ID: ${chainData.prediction_set_id} does not exists.`,
            {
              voterAddress,
              questionId,
              outcomeIndex,
              txHash,
              predictionSetChainDataId: chainData.id,
              predictionSetId: chainData.prediction_set_id
            },
            null
          );

          continue;
        }

        // Check if prediction set is finalized and finalize it.
        const question = await oracleContract.question(questionId);
        if (Number(question.status) === PredictionSetBcStatus.FINALIZED) {
          const outcome = await new Outcome({}, this.context).populateByIndexAndPredictionSetId(question.winnerIdx, predictionSet.id);
          if (!outcome.exists()) {
            await this.writeLogToDb(WorkerLogStatus.ERROR, `Outcome for given outcome index: ${question.winnerIdx} not found.`, {
              predictionSetId: predictionSet.id,
              winnerIdx: question.winnerIdx,
              questionId
            });

            continue;
          }

          predictionSet.winner_outcome_id = outcome.id;
          predictionSet.setStatus = PredictionSetStatus.FINALIZED;
          await predictionSet.update(SerializeFor.UPDATE_DB, conn);
        }

        // TODO: do we allow this without checks?
        const user = await new User({}, this.context).populateByWalletAddress(voterAddress);
        const outcome = await new Outcome({}, this.context).populateByIndexAndPredictionSetId(outcomeIndex, predictionSet.id);

        await new OutcomeVotingTransaction(
          {
            prediction_set_id: predictionSet.id,
            outcome_id: outcome.id,
            user_id: user.id,
            wallet: voterAddress,
            txHash,
            questionId,
            outcomeIndex
          },
          this.context
        ).insert(SerializeFor.INSERT_DB, conn);
      }

      await contract.updateLastProcessedBlock(toBlock, conn);
      await this.context.mysql.commit(conn);
    } catch (error) {
      await this.context.mysql.rollback(conn);

      const errorId = randomUUID();
      await sendSlackWebhook(
        `
        Error while parsing voting events. See DB worker logs for more info: \n
        - Error ID: \`${errorId}\`
        `,
        true
      );

      await this.writeLogToDb(
        WorkerLogStatus.ERROR,
        `Error while parsing voting events: `,
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
