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
  FDC_REQUEST_FEE_CONFIGURATIONS = 'FdcRequestFeeConfigurations',
  FLARE_SYSTEM_MANAGER = 'FlareSystemsManager',
  FDC_VERIFICATION = 'FdcVerification',
  FDC_HUB = 'FdcHub',
  RELAY = 'Relay'
}

/**
 * Flare protocol IDs.
 */
export enum ProtocolIds {
  FDC = 200
}
