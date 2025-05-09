import { HttpStatus, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { env } from '../config/env';
import { ResourceNotFoundErrorCode, SystemErrorCode } from '../config/types';
import { Context } from '../context';
import { PredictionSetChainData } from '../modules/prediction-set/models/prediction-set-chain-data.model';
import { PredictionSet, ResolutionType } from '../modules/prediction-set/models/prediction-set.model';
import { CONDITIONAL_TOKEN_ABI, FPMM_ABI, FPMM_FACTORY_ABI, ORACLE_ABI } from './abis';
import { CodeException } from './exceptions/exceptions';
import { CollateralToken } from '../modules/collateral-token/models/collateral-token.model';
import { keccak256, AbiCoder } from 'ethers';

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
 *
 * @returns provider - JSON RPC provider.
 * @returns signer - Signer.
 * @returns fpmmfContract - FixedProductMarketMakerFactory contract - used for creation of prediction markets - every new prediction market is its own FixedProductMarketMaker contract.
 * @returns conditionalTokenContract - Conditional token contract.
 */
export function setup(fpmmAddress: string = null) {
  const provider = new ethers.JsonRpcProvider(env.RPC_URL);
  const signer = new ethers.Wallet(env.SIGNER_PRIVATE_KEY, provider);

  // TODO: DO NOT USE SIGNER IF NOT NECESSARY

  const oracleContract = new ethers.Contract(env.ORACLE_CONTRACT, ORACLE_ABI, signer);
  const fpmmfContract = new ethers.Contract(env.FPMM_FACTORY_CONTRACT, FPMM_FACTORY_ABI, signer);
  const conditionalTokenContract = new ethers.Contract(env.CONDITIONAL_TOKEN_CONTRACT, CONDITIONAL_TOKEN_ABI, signer);
  const fpmmContract = fpmmAddress ? new ethers.Contract(fpmmAddress, FPMM_ABI, signer) : null;

  return {
    provider,
    signer,
    oracleContract,
    fpmmfContract,
    conditionalTokenContract,
    fpmmContract
  };
}

/**
 * Creates new prediction set on blockchain.
 *
 * @param predictionSet Prediction set data.
 * @param context Application context.
 */
export async function addPredictionSet(predictionSet: PredictionSet, context: Context) {
  const { fpmmfContract, conditionalTokenContract, oracleContract, signer } = setup();

  const collateralToken = await new CollateralToken({}, context).populateById(predictionSet.collateral_token_id);
  if (!collateralToken.exists() || !collateralToken.isEnabled()) {
    throw new CodeException({
      code: ResourceNotFoundErrorCode.COLLATERAL_TOKEN_DOES_NOT_EXISTS,
      errorCodes: ResourceNotFoundErrorCode,
      status: HttpStatus.NOT_FOUND,
      sourceFunction: `${this.constructor.name}/addPredictionSet`,
      context
    });
  }

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
      Math.ceil(Number(predictionSet.endTime) / 1000),
      Math.ceil(Number(predictionSet.resolutionTime) / 1000),
      predictionSet.resolutionType === ResolutionType.AUTOMATIC
    );
    await initializeQuestionTx.wait();
  } catch (error) {
    Logger.error(error, 'Error while initializing question.');

    throw new CodeException({
      code: SystemErrorCode.BLOCKCHAIN_SYSTEM_ERROR,
      errorCodes: SystemErrorCode,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      sourceFunction: `addPredictionSet`,
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
      sourceFunction: `addPredictionSet`,
      errorMessage: 'No condition ID found.',
      context
    });
  }

  const salt = keccak256(
    AbiCoder.defaultAbiCoder().encode(
      [
        'address', // creator
        'string', // name
        'string', // symbol
        'address', // conditionalTokens
        'address', // collateralToken
        'bytes32[]', // conditionIds
        'uint256', // fee
        'uint256', // treasuryPercent
        'address', // treasury
        'uint256', // fundingThreshold
        'uint256' // endTime
      ],
      [
        signer.address,
        'FPMM Shares',
        'FPMM',
        env.CONDITIONAL_TOKEN_CONTRACT,
        collateralToken.address,
        [conditionId],
        ethers.parseEther(env.MARKET_FEE_PERCENT),
        env.MARKET_TREASURY_PERCENT,
        env.MARKET_TREASURY_ADDRESS,
        BigInt(collateralToken.fundingThreshold),
        Math.ceil(Number(predictionSet.endTime) / 1000)
      ]
    )
  );

  let receiptBlock = null;
  try {
    const createTx = await fpmmfContract.createFixedProductMarketMaker(
      env.CONDITIONAL_TOKEN_CONTRACT,
      collateralToken.address,
      [conditionId],
      ethers.parseEther(env.MARKET_FEE_PERCENT),
      env.MARKET_TREASURY_PERCENT,
      env.MARKET_TREASURY_ADDRESS,
      BigInt(collateralToken.fundingThreshold),
      Math.ceil(Number(predictionSet.endTime) / 1000),
      salt
    );
    const txReceipt = await createTx.wait();
    receiptBlock = txReceipt.blockNumber;
  } catch (error) {
    Logger.error(error, 'Error while creating fixed product market maker contract.');

    throw new CodeException({
      code: SystemErrorCode.BLOCKCHAIN_SYSTEM_ERROR,
      errorCodes: SystemErrorCode,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      sourceFunction: `addPredictionSet`,
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
 *
 * @param questionId Question ID.
 * @param proofs Results proof data.
 */
export async function finalizePredictionSetResults(
  questionId: string,
  proofs: any[][]
): Promise<{ status: PredictionSetBcStatus; winnerIdx: number }> {
  const { oracleContract } = setup();

  try {
    const finalizeTx = await oracleContract.finalizeQuestion(questionId, proofs, true);
    await finalizeTx.wait();
  } catch (error) {
    throw new CodeException({
      code: SystemErrorCode.BLOCKCHAIN_SYSTEM_ERROR,
      errorCodes: SystemErrorCode,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      sourceFunction: `finalizePredictionSetResults`,
      errorMessage: 'Error while finalizing prediction set results.',
      details: error
    });
  }

  const question = await oracleContract.question(questionId);

  const status = Number(question.status);
  const winnerIdx = Number(question.winnerIdx);

  return { status, winnerIdx };
}

/**
 * Formats given number to bytes 32 string.
 *
 * @param num Number.
 * @returns Bytes 32 string.
 */
export function numberToBytes32(num: number) {
  return `0x${num.toString(16).padStart(64, '0')}`;
}
