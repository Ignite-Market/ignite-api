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

/**
 * Flare contract names.
 */
export enum ContractName {
  FLARE_SYSTEM_MANAGER = 'FlareSystemsManager',
  FDC_HUB = 'FdcHub',
  FDC_REQUEST_FEE_CONFIGURATIONS = 'FdcRequestFeeConfigurations',
  RELAY = 'Relay'
}

/**
 * Flare protocol IDs.
 */
export enum ProtocolIds {
  FDC = 200
}
