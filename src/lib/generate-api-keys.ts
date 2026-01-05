import * as crypto from 'crypto';

const ECDH_SALT = Buffer.from('key-publish-ecdh-salt-v1', 'utf-8');
const ECDH_INFO_PREFIX = Buffer.from('key-publish-api-key:v1:', 'utf-8');
const AES_NONCE_SIZE = 12;
const API_KEY_BYTES = 32;

export interface SignerPubkey {
  signing_address?: string;
  voter_signing_address?: string;
  recovered_pubkey_hex: string;
  network?: 'flare' | 'songbird';
}

export interface GeneratedApiKey {
  signing_address: string;
  encrypted_api_key: string;
  api_key: string;
  network: 'flare' | 'songbird';
}

/**
 * Loads a secp256k1 public key from uncompressed hex format.
 * Handles keys with or without 0x04 prefix.
 * Expected formats:
 * - 65 bytes with 0x04 prefix: 0x04 || X || Y
 * - 64 bytes without prefix: X || Y (will add 0x04 prefix)
 *
 * @param uncompressedHex - The uncompressed public key in hex format (with or without 0x prefix)
 * @returns The public key as a Buffer (65 bytes: 0x04 || X || Y)
 * @throws Error if the hex string is invalid
 */
function loadSecp256k1PublicKey(uncompressedHex: string): Buffer {
  let hexStr = uncompressedHex.trim().toLowerCase();
  if (hexStr.startsWith('0x')) {
    hexStr = hexStr.slice(2);
  }

  // Reject empty or invalid hex strings
  if (!hexStr || hexStr.length < 64) {
    throw new Error(`Invalid public key: hex string too short (${hexStr.length} chars, need at least 64)`);
  }

  const data = Buffer.from(hexStr, 'hex');

  // If 65 bytes and starts with 0x04, it's already in the correct format
  if (data.length === 65 && data[0] === 0x04) {
    return data;
  }

  // If 64 bytes (X || Y without prefix), add 0x04 prefix
  if (data.length === 64) {
    return Buffer.concat([Buffer.from([0x04]), data]);
  }

  // If 65 bytes but doesn't start with 0x04, try to fix it
  if (data.length === 65 && data[0] !== 0x04) {
    // Replace first byte with 0x04
    const fixed = Buffer.allocUnsafe(65);
    fixed[0] = 0x04;
    data.copy(fixed, 1, 1);
    return fixed;
  }

  throw new Error(`Invalid public key format: expected 64 or 65 bytes, got ${data.length} bytes`);
}

/**
 * Encrypts an API key using ECDH key exchange and AES-GCM encryption.
 *
 * @param recipientPubkeyHex - The recipient's public key in uncompressed hex format
 * @param apiKey - The API key to encrypt
 * @param signingAddress - The signing address (used in HKDF info)
 * @returns Base64-encoded encrypted payload: ephemeral_pubkey || nonce || ciphertext
 */
function encryptApiKey(recipientPubkeyHex: string, apiKey: string, signingAddress: string): string {
  // Load recipient's public key
  const recipientPubkey = loadSecp256k1PublicKey(recipientPubkeyHex);

  // Generate ephemeral ECDH keypair
  const ephemeralEcdh = crypto.createECDH('secp256k1');
  ephemeralEcdh.generateKeys();
  const ephemeralPubkey = ephemeralEcdh.getPublicKey(null, 'uncompressed'); // 65 bytes: 0x04 || X || Y

  // Compute shared secret
  const sharedSecret = ephemeralEcdh.computeSecret(recipientPubkey);

  // Derive AES key using HKDF
  const info = Buffer.concat([ECDH_INFO_PREFIX, Buffer.from(signingAddress, 'utf-8')]);
  const aesKeyArrayBuffer = crypto.hkdfSync('sha256', sharedSecret, ECDH_SALT, info, 32);
  const aesKey = Buffer.from(aesKeyArrayBuffer);

  // Encrypt with AES-GCM
  const nonce = crypto.randomBytes(AES_NONCE_SIZE);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, nonce);
  const apiKeyBuffer = Buffer.from(apiKey, 'utf-8');
  let ciphertext = cipher.update(apiKeyBuffer);
  cipher.final();
  const authTag = cipher.getAuthTag();

  // Combine: ephemeral_pubkey || nonce || ciphertext || authTag
  // Note: Python's AESGCM.encrypt() appends auth tag to ciphertext, so we match that format
  const payload = Buffer.concat([ephemeralPubkey, nonce, ciphertext, authTag]);
  return payload.toString('base64');
}

/**
 * Generates API keys for an array of signers and encrypts them.
 *
 * @param signers - Array of signer objects with signing_address (or voter_signing_address) and recovered_pubkey_hex
 * @returns Array of generated API keys with signing_address, encrypted_api_key, and api_key
 */
export function generateApiKeys(signers: SignerPubkey[]): GeneratedApiKey[] {
  const results: GeneratedApiKey[] = [];

  for (const signer of signers) {
    // Determine signing address field (can be signing_address or voter_signing_address)
    const signingAddress = (signer.signing_address || signer.voter_signing_address || '').trim();
    const pubHex = (signer.recovered_pubkey_hex || '').trim();

    if (!signingAddress || !pubHex) {
      continue;
    }

    // Generate random API key (32 bytes, base64 URL-safe)
    const apiKeyBytes = crypto.randomBytes(API_KEY_BYTES);
    const apiKey = apiKeyBytes.toString('base64url');

    // Encrypt the API key
    const encrypted = encryptApiKey(pubHex, apiKey, signingAddress);

    results.push({
      signing_address: signingAddress,
      encrypted_api_key: encrypted,
      api_key: apiKey,
      network: signer.network || 'flare' // Default to 'flare' for backward compatibility
    });
  }

  return results;
}
