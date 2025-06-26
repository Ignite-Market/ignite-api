import { ethers, keccak256, solidityPacked } from 'ethers';
import { env } from '../../config/env';

/**
 * Encodes string to HEX.
 *
 * @param data String data.
 * @returns HEX string.
 */
export function toHex(data: string) {
  var result = '';
  for (var i = 0; i < data.length; i++) {
    result += data.charCodeAt(i).toString(16);
  }

  return result.padEnd(64, '0');
}

/**
 * Encodes data to UTF8 HEX string.
 *
 * @param data String data.
 * @returns UTF8 HEX string.
 */
export function toUtf8HexString(data: string) {
  return '0x' + toHex(data);
}

/**
 * Gets contract's ABI from explorer API.
 *
 * @param address Contract's address.
 * @returns Contracts ABI.
 */
export async function getABI(address: string) {
  const response = await (await fetch(`${env.FLARE_EXPLORER_API_URL}?module=contract&action=getabi&address=${address}`)).json();

  return JSON.parse(response.result);
}

/**
 * Converts attestations proofs to named objects.
 *
 * @param rawProofs Raw proofs array.
 * @returns Named object proof array.
 */
export function convertProofsToNamedObjects(rawProofs: any[][]): any[] {
  return rawProofs.map((proof: any) => {
    const [attestationType, sourceId, votingRound, lowestUsedTimestamp, requestBodyArray, responseBodyArray] = proof.data;

    return {
      merkleProof: proof.merkleProof,
      data: {
        attestationType,
        sourceId,
        votingRound: BigInt(votingRound),
        lowestUsedTimestamp: BigInt(lowestUsedTimestamp),
        requestBody: {
          url: requestBodyArray[0],
          httpMethod: requestBodyArray[1],
          headers: requestBodyArray[2],
          queryParams: requestBodyArray[3],
          body: requestBodyArray[4],
          postProcessJq: requestBodyArray[5],
          abiSignature: requestBodyArray[6]
        },
        responseBody: {
          abiEncodedData: responseBodyArray[0]
        }
      }
    };
  });
}

/**
 * Ethers ABI coder results are read only so we need to correctly deep clone them.
 *
 * @param result ABI coder results.
 * @returns Deep copy.
 */
export function deepCloneAbiCoderResult(result: any): any {
  if (Array.isArray(result)) {
    return result.map(deepCloneAbiCoderResult);
  } else if (result && typeof result === 'object') {
    const obj: any = {};

    for (const key in result) {
      // Only include named keys (not numeric indices) to avoid duplicate values
      if (isNaN(Number(key))) {
        obj[key] = deepCloneAbiCoderResult(result[key]);
      }
    }
    return obj;
  } else {
    return result;
  }
}

/**
 * Creates JQ key.
 *
 * @param url API URL.
 * @param jq API jq.
 * @returns JQ key
 */
export function crateJQ(url: string, jq: string) {
  const packed = solidityPacked(['string', 'string'], [url, jq]);
  const jqKey = keccak256(packed);

  return jqKey;
}

/**
 * Gets the implementation address of a proxy contract.
 *
 * @param provider Provider.
 * @param contractAddress Address of the proxy contract.
 * @returns Implementation address.
 */
export async function getProxyImplementationAddress(provider: ethers.Provider, contractAddress: string): Promise<string> {
  const implementationSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'; // ERC-1967 implementation slot.
  const implementationData = await provider.getStorage(contractAddress, implementationSlot);

  return ethers.getAddress('0x' + implementationData.slice(-40));
}
