/**
 * Encodes attestation data.
 * @param data Attestation data.
 * @returns Encoded attestation data.
 */
export function encodeAttestationData(data: string): string {
  var result = '';
  for (var i = 0; i < data.length; i++) {
    result += data.charCodeAt(i).toString(16);
  }

  return `0x${result.padEnd(64, '0')}`;
}
