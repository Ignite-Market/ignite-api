/**
 * Attestation verifier statuses.
 */
export enum AttestationVerifierStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',
  INDETERMINATE = 'INDETERMINATE'
}

/**
 * Encoded attestation request definition.
 */
export interface EncodedAttestationRequest {
  status: AttestationVerifierStatus;
  abiEncodedRequest: string;
}
