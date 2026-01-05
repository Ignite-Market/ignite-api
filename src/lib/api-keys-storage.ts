import { AWS_S3 } from './aws/aws-s3';
import { GeneratedApiKey } from './generate-api-keys';

export interface ApiKeyEntry {
  signing_address: string;
  encrypted_api_key?: string;
  api_key?: string;
  network: 'flare' | 'songbird';
}

/**
 * Loads existing API keys from S3.
 * Returns empty arrays if files don't exist.
 * Supports both old format (Record<string, string>) and new format (array).
 *
 * @param bucket S3 bucket name
 * @param encryptedKey S3 key for encrypted keys file
 * @param decryptedKey S3 key for decrypted keys file
 * @returns Object with encrypted and decrypted key arrays
 */
export async function loadExistingKeys(
  bucket: string,
  encryptedKey?: string,
  decryptedKey?: string
): Promise<{ encrypted: ApiKeyEntry[]; decrypted: ApiKeyEntry[] }> {
  const s3 = new AWS_S3();

  let encrypted: ApiKeyEntry[] = [];
  let decrypted: ApiKeyEntry[] = [];

  if (encryptedKey) {
    try {
      const encryptedText = await s3.read(bucket, encryptedKey);
      const parsed = JSON.parse(encryptedText);

      // Handle backward compatibility: convert old Record format to array
      if (Array.isArray(parsed)) {
        encrypted = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Old format: Record<string, string>
        encrypted = Object.entries(parsed).map(([signing_address, encrypted_api_key]) => ({
          signing_address,
          encrypted_api_key: encrypted_api_key as string,
          network: 'flare' as const // Default to flare for old entries
        }));
      }
    } catch (error: any) {
      // If file doesn't exist, start with empty array
      if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
        console.log(`Encrypted keys file not found, starting fresh: ${encryptedKey}`);
      } else {
        throw error;
      }
    }
  }

  if (decryptedKey) {
    try {
      const decryptedText = await s3.read(bucket, decryptedKey);
      const parsed = JSON.parse(decryptedText);

      // Handle backward compatibility: convert old Record format to array
      if (Array.isArray(parsed)) {
        decrypted = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Old format: Record<string, string>
        decrypted = Object.entries(parsed).map(([signing_address, api_key]) => ({
          signing_address,
          api_key: api_key as string,
          network: 'flare' as const // Default to flare for old entries
        }));
      }
    } catch (error: any) {
      // If file doesn't exist, start with empty array
      if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
        console.log(`Decrypted keys file not found, starting fresh: ${decryptedKey}`);
      } else {
        throw error;
      }
    }
  }

  return { encrypted, decrypted };
}

/**
 * Saves API keys to S3 as arrays.
 *
 * @param bucket S3 bucket name
 * @param encryptedKey S3 key for encrypted keys file
 * @param decryptedKey S3 key for decrypted keys file
 * @param encryptedArray Array of API key entries with encrypted_api_key
 * @param decryptedArray Array of API key entries with api_key
 */
export async function saveKeys(
  bucket: string,
  encryptedKey: string,
  decryptedKey: string,
  encryptedArray: ApiKeyEntry[],
  decryptedArray: ApiKeyEntry[]
): Promise<void> {
  const s3 = new AWS_S3();

  const encryptedBody = Buffer.from(JSON.stringify(encryptedArray, null, 2), 'utf-8');
  const decryptedBody = Buffer.from(JSON.stringify(decryptedArray, null, 2), 'utf-8');

  await s3.upload(bucket, encryptedKey, encryptedBody, 'application/json');
  await s3.upload(bucket, decryptedKey, decryptedBody, 'application/json');
}
