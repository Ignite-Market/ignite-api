import { ethers } from 'ethers';
import { env } from '../config/env';
import { PredictionSet } from '../modules/prediction-set/models/prediction-set.model';
import { PREDICTION_ABI, TOKEN_ABI } from './abis';

/**
 * Sets up betting contract.
 * @returns Provider, signer and betting contract.
 */
export async function setup(): Promise<{ provider: ethers.JsonRpcProvider; signer: ethers.Wallet; predictionContract: ethers.Contract }> {
  const provider = new ethers.JsonRpcProvider(env.FLARE_RPC);
  const signer = new ethers.Wallet(env.FLARE_ATTESTATION_PRIVATE_KEY, provider);

  const predictionContract = new ethers.Contract(env.PREDICTION_CONTRACT, PREDICTION_ABI, signer);
  const tokenContract = new ethers.Contract(env.TOKEN_CONTRACT, TOKEN_ABI, signer);

  // Check allowance.
  const allowance = await tokenContract.allowance(signer.address, env.PREDICTION_CONTRACT);
  if (allowance < ethers.parseUnits('1000000', 'ether')) {
    const approveTx = await tokenContract.approve(env.PREDICTION_CONTRACT, ethers.MaxUint256);
    await approveTx.wait();
  }

  return { provider, signer, predictionContract };
}

/**
 * Adds prediction set.
 * TODO: Check if set already exists.
 */
export async function addPredictionSet(predictionSet: PredictionSet) {
  return;
}
