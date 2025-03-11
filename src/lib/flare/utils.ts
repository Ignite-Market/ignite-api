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
