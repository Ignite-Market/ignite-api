import { env } from '../../config/env';

/**
 * Encodes string to HEX.
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
 * @param data String data.
 * @returns UTF8 HEX string.
 */
export function toUtf8HexString(data: string) {
  return '0x' + toHex(data);
}

/**
 * Gets contract's ABI from explorer API.
 * @param address Contract's address.
 * @returns Contracts ABI.
 */
export async function getABI(address: string) {
  const response = await (await fetch(`${env.FLARE_EXPLORER_API_URL}?module=contract&action=getabi&address=${address}`)).json();

  return JSON.parse(response.result);
}

/**
 * Ethers ABI coder results are read only so we need to correctly deep clone them.
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
