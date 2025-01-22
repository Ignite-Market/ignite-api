import { ethers } from 'ethers';
import { env } from '../../config/env';
import { CONTRACT_REGISTRY_ABI, FDC_HUB_ABI, SYSTEM_MANAGER_ABI } from './abis';
import { EncodedAttestationRequest } from './types';
import { encodeAttestationData } from './utils';

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
    attestationType: encodeAttestationData('JsonApi'),
    sourceId: encodeAttestationData('WEB2'),
    requestBody: {
      url,
      postprocessJq: jq,
      abi_signature: JSON.stringify(abi)
    }
  };

  const verifierResponse = await fetch(`${env.FLARE_ATTESTATION_PROVIDER_URL}/JsonApi/prepareRequest`, {
    method: 'POST',
    headers: {
      'X-API-KEY': env.FLARE_ATTESTATION_PROVIDER_URL,
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
  const provider = new ethers.JsonRpcProvider(env.RPC_URL);
  const signer = new ethers.Wallet(env.SIGNER_PRIVATE_KEY, provider);
  const contractRegistry = new ethers.Contract(env.FLARE_CONTRACT_REGISTRY_ADDRESS, CONTRACT_REGISTRY_ABI, provider);

  // Flare system manager contract.
  const systemManagerAddress = await contractRegistry.getContractAddressByName('FlareSystemsManager');
  const systemManager = new ethers.Contract(systemManagerAddress, SYSTEM_MANAGER_ABI, provider);

  // Flare data connector HUB contract.
  const fdcHubAddress = await contractRegistry.getContractAddressByName('FdcHub');
  const fdcHub = new ethers.Contract(fdcHubAddress, FDC_HUB_ABI, provider);

  // Call to the FDC Hub protocol to provide attestation.
  const tx = await fdcHub.requestAttestation(request.abiEncodedRequest);
  const receipt = await tx.wait();

  // Get block number of the block containing contract call
  const blockNumber = receipt.blockNumber;
  const block = await provider.getBlock(blockNumber);
  const votingOffset = Number(await systemManager.firstVotingRoundStartTs());
  const votingDuration = Number(await systemManager.votingEpochDurationSeconds());

  // Calculate roundId
  const roundId = Math.floor((block.timestamp - votingOffset) / votingDuration);
  return roundId;
}

/**
 * Gets attestation proof from Data Availability server.
 * @param roundId Round ID.
 * @param abiEncodedRequest ABI encoded request.
 * @returns Attestation proof.
 */
export async function getAttestationProof(roundId: number, abiEncodedRequest: string) {
  const proofAndData = await fetch(`${env.FLARE_DATA_AVAILABILITY_URL}api/v0/fdc/get-proof-round-id-bytes`, {
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
