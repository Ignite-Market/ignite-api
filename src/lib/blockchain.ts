import { HttpStatus, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { env } from '../config/env';
import { SystemErrorCode } from '../config/types';
import { Context } from '../context';
import { PredictionSetChainData } from '../modules/prediction-set/models/prediction-set-chain-data.model';
import { PredictionSet, ResolutionType } from '../modules/prediction-set/models/prediction-set.model';
import { CONDITIONAL_TOKEN_ABI, FPMM_ABI, FPMM_FACTORY_ABI, JSON_VERIFIER_ABI, ORACLE_ABI } from './abis';
import { CodeException } from './exceptions/exceptions';

/**
 * Prediction set blockchain status.
 */
export enum PredictionSetBcStatus {
  INVALID,
  ACTIVE,
  VOTING,
  FINALIZED
}

/**
 * Sets up contracts.
 * @returns provider - JSON RPC provider.
 * @returns signer - Signer.
 * @returns fpmmfContract - FixedProductMarketMakerFactory contract - used for creation of prediction markets - every new prediction market is its own FixedProductMarketMaker contract.
 * @returns conditionalTokenContract - Conditional token contract.
 */
export function setup(fpmmAddress: string = null) {
  const provider = new ethers.JsonRpcProvider(env.RPC_URL);
  const signer = new ethers.Wallet(env.SIGNER_PRIVATE_KEY, provider);

  const oracleContract = new ethers.Contract(env.ORACLE_CONTRACT, ORACLE_ABI, signer);
  const fpmmfContract = new ethers.Contract(env.FPMM_FACTORY_CONTRACT, FPMM_FACTORY_ABI, signer);
  const conditionalTokenContract = new ethers.Contract(env.CONDITIONAL_TOKEN_CONTRACT, CONDITIONAL_TOKEN_ABI, signer);
  const fpmmContract = fpmmAddress ? new ethers.Contract(fpmmAddress, FPMM_ABI, signer) : null;
  const verifierContract = new ethers.Contract(env.JSON_VERIFIER_CONTRACT, JSON_VERIFIER_ABI, signer);

  return {
    provider,
    signer,
    oracleContract,
    fpmmfContract,
    conditionalTokenContract,
    fpmmContract,
    verifierContract
  };
}

/**
 * Creates new prediction set on blockchain.
 * @param predictionSet Prediction set data.
 * @param context Application context.
 */
export async function addPredictionSet(predictionSet: PredictionSet, context: Context) {
  const { fpmmfContract, conditionalTokenContract, oracleContract } = setup();

  const questionId = numberToBytes32(predictionSet.id);
  const urls = [];
  const jqs = [];
  const dataSources = await predictionSet.getDataSources();
  for (const dataSource of dataSources) {
    urls.push(dataSource.endpoint);
    jqs.push(dataSource.jqQuery);
  }

  try {
    const initializeQuestionTx = await oracleContract.initializeQuestion(
      questionId,
      predictionSet.outcomes.length,
      urls,
      jqs,
      predictionSet.consensusThreshold,
      Number(predictionSet.resolutionTime) / 1000,
      predictionSet.resolutionType === ResolutionType.AUTOMATIC
    );
    await initializeQuestionTx.wait();
  } catch (error) {
    Logger.error(error, 'Error while initializing question.');

    throw new CodeException({
      code: SystemErrorCode.BLOCKCHAIN_SYSTEM_ERROR,
      errorCodes: SystemErrorCode,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      sourceFunction: `${this.constructor.name}/addPredictionSet`,
      errorMessage: 'Error while preparing condition.',
      details: error,
      context
    });
  }

  const conditionId = await conditionalTokenContract.getConditionId(env.ORACLE_CONTRACT, questionId, predictionSet.outcomes.length);
  if (!conditionId) {
    Logger.error('No condition ID found.');

    throw new CodeException({
      code: SystemErrorCode.BLOCKCHAIN_SYSTEM_ERROR,
      errorCodes: SystemErrorCode,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      sourceFunction: `${this.constructor.name}/addPredictionSet`,
      errorMessage: 'No condition ID found.',
      context
    });
  }

  let receiptBlock = null;
  try {
    const createTx = await fpmmfContract.createFixedProductMarketMaker(
      env.CONDITIONAL_TOKEN_CONTRACT,
      env.COLLATERAL_TOKEN_CONTRACT,
      [conditionId],
      100 // TODO: Change fee.
    );
    const txReceipt = await createTx.wait();
    receiptBlock = txReceipt.blockNumber;
  } catch (error) {
    Logger.error(error, 'Error while creating fixed product market maker contract.');

    throw new CodeException({
      code: SystemErrorCode.BLOCKCHAIN_SYSTEM_ERROR,
      errorCodes: SystemErrorCode,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      sourceFunction: `${this.constructor.name}/addPredictionSet`,
      errorMessage: 'Error while creating fixed product market maker contract.',
      details: error,
      context
    });
  }

  await new PredictionSetChainData(
    {
      prediction_set_id: predictionSet.id,
      questionId,
      conditionId,
      lastProcessedBlock: receiptBlock,
      parseBlockSize: env.FPMM_PARSE_BLOCK_SIZE
    },
    context
  ).insert();
}

/**
 * Finalizes prediction set results.
 * @param questionId Question ID.
 * @param proofs Results proof data.
 */
export async function finalizePredictionSetResults(questionId: string, proofs: any[]): Promise<{ status: PredictionSetBcStatus; winnerIdx: number }> {
  const { oracleContract } = setup();

  try {
    const finalizeTx = await oracleContract.finalizeQuestion(questionId, proofs);
    await finalizeTx.wait();
  } catch (error) {
    throw new CodeException({
      code: SystemErrorCode.BLOCKCHAIN_SYSTEM_ERROR,
      errorCodes: SystemErrorCode,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      sourceFunction: `${this.constructor.name}/finalizePredictionSetResults`,
      errorMessage: 'Error while finalizing prediction set results.',
      details: error
    });
  }

  const question = await oracleContract.question(questionId);

  const status = Number(question.status);
  const winnerIdx = question.winnerIdx;

  return { status, winnerIdx };
}

/**
 * Verifies prediction set results.
 * @param proof Results proof data.
 * @returns Boolean.
 */
export async function verifyPredictionSetResults(proof: any): Promise<boolean> {
  const { verifierContract } = setup();

  try {
    return await verifierContract.verifyJsonApi(proof);
  } catch (error) {
    throw new CodeException({
      code: SystemErrorCode.BLOCKCHAIN_SYSTEM_ERROR,
      errorCodes: SystemErrorCode,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      sourceFunction: `${this.constructor.name}/verifyPredictionSetResults`,
      errorMessage: 'Error while verifying prediction set results.',
      details: error
    });
  }
}

/**
 * Formats given number to bytes 32 string.
 * @param num Number.
 * @returns Bytes 32 string.
 */
export function numberToBytes32(num: number) {
  return `0x${num.toString(16).padStart(64, '0')}`;
}
