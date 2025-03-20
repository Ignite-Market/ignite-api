import { ethers } from 'ethers';
import { env } from '../../config/env';
import { AttestationProof } from '../../modules/prediction-set/models/prediction-set-attestation.model';
import { CONTRACT_REGISTRY_ABI } from './abis';
import { ContractName, EncodedAttestationRequest, ProtocolIds } from './types';
import { deepCloneAbiCoderResult, getABI, toUtf8HexString } from './utils';

/**
 * Inits provider and base Flare contracts.
 * @returns Provider, signer and contract registry contract.
 */
export function init() {
  const provider = new ethers.JsonRpcProvider(env.RPC_URL);
  const signer = new ethers.Wallet(env.SIGNER_PRIVATE_KEY, provider);
  const contractRegistry = new ethers.Contract(env.FLARE_CONTRACT_REGISTRY_ADDRESS, CONTRACT_REGISTRY_ABI, signer);

  return { provider, signer, contractRegistry };
}

/**
 * Gets contract from the Flare's contract registry.
 * @param name Contract name.
 * @param registry Contract registry.
 * @param signer Signer.
 * @returns Contract.
 */
export async function getContract(
  name: ContractName,
  registry: ethers.Contract,
  signer: ethers.Wallet | ethers.JsonRpcProvider
): Promise<ethers.Contract> {
  let address = '';

  // Returns hardcoded unofficial deployment instances of Flare core contracts. TODO: Change when Flare deploys official contract.
  if (name === ContractName.JSON_API_VERIFICATION) {
    address = env.JSON_VERIFIER_CONTRACT;
  } else {
    address = await registry.getContractAddressByName(name);
  }
  const abi = await getABI(address);

  return new ethers.Contract(address, abi, signer);
}

/**
 * Prepares request for attestation.
 *
 * @param url API url for the data to attest.
 * @param jq JQ query to obtain data from API response.
 * @param abi ABI to encode/decode API response.
 * @returns Prepared attestation request.
 */
export async function prepareAttestationRequest(url: string, jq: string, abi: any): Promise<EncodedAttestationRequest> {
  const attestationRequest = {
    attestationType: toUtf8HexString('IJsonApi'),
    sourceId: toUtf8HexString('WEB2'),
    requestBody: {
      url,
      postprocessJq: jq,
      abi_signature: typeof abi === 'string' ? abi : JSON.stringify(abi)
    }
  };

  const verifierResponse = await fetch(`${env.FLARE_ATTESTATION_PROVIDER_URL}JsonApi/prepareRequest`, {
    method: 'POST',
    headers: {
      'X-API-KEY': env.FLARE_ATTESTATION_PROVIDER_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(attestationRequest)
  });

  return await verifierResponse.json();
}

/**
 * Submits attestation request.
 *
 * @param request Prepared/encoded attestation request.
 * @returns The Data Connector round ID that was in the collect phase the moment the attestation was requested.
 */

export async function submitAttestationRequest(request: EncodedAttestationRequest): Promise<number> {
  const { provider, signer, contractRegistry } = init();

  // Initialize contracts.
  const systemManager = await getContract(ContractName.FLARE_SYSTEM_MANAGER, contractRegistry, signer);
  const fdcHub = await getContract(ContractName.FDC_HUB, contractRegistry, signer);
  const fdcFeeConfigurations = await getContract(ContractName.FDC_REQUEST_FEE_CONFIGURATIONS, contractRegistry, signer);

  // Get request fee.
  const fee = await fdcFeeConfigurations.getRequestFee(request.abiEncodedRequest);

  // Call to the FDC Hub to request attestation.
  const tx = await fdcHub.requestAttestation(request.abiEncodedRequest, {
    value: fee
  });
  const receipt = await tx.wait();

  // Get block number of the block containing contract call.
  const blockNumber = receipt.blockNumber;
  const block = await provider.getBlock(blockNumber);

  const blockTimestamp = BigInt(block.timestamp);
  const votingOffset = BigInt(await systemManager.firstVotingRoundStartTs());
  const votingDuration = BigInt(await systemManager.votingEpochDurationSeconds());

  // Calculate roundId
  const roundId = Number((blockTimestamp - votingOffset) / votingDuration);
  return roundId;
}

/**
 * Checks if voting round is finalized.
 * @param roundId Round ID.
 * @returns Boolean.
 */
export async function isRoundFinalized(roundId: number): Promise<boolean> {
  const { provider, contractRegistry } = init();

  const relay = await getContract(ContractName.RELAY, contractRegistry, provider);
  return await relay.isFinalized(ProtocolIds.FDC, roundId);
}

/**
 * Gets attestation proof from Data Availability server.
 * @param roundId Round ID.
 * @param abiEncodedRequest ABI encoded request.
 * @returns Attestation proof.
 */
export async function getAttestationProof(roundId: number, abiEncodedRequest: string): Promise<AttestationProof> {
  const proofAndData = await fetch(`${env.FLARE_DATA_AVAILABILITY_URL}api/v1/fdc/proof-by-request-round-raw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': env.FLARE_DATA_AVAILABILITY_API_KEY
    },
    body: JSON.stringify({
      votingRoundId: roundId,
      requestBytes: abiEncodedRequest
    })
  });

  return await proofAndData.json();
}

/**
 * Verifies attestation proof.
 *
 * @param attestationProof Results proof data.
 * @returns Boolean.
 */
export async function verifyProof(attestationProof: AttestationProof): Promise<{ verified: boolean; proofData: any }> {
  const { signer, contractRegistry } = init();

  const verifier = await getContract(ContractName.JSON_API_VERIFICATION, contractRegistry, signer);
  const address = await verifier.getAddress();
  const abi = await getABI(address);

  const responseType = abi[0].inputs[0].components[1];
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const decodedResponse = abiCoder.decode([responseType], attestationProof.response_hex)[0];

  const proofData = {
    merkleProof: attestationProof.proof,
    data: deepCloneAbiCoderResult(decodedResponse)
  };

  const verified = await verifier.verifyJsonApi(proofData);

  return { verified, proofData };
}
