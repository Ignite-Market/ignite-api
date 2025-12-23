import { AWS_S3 } from './aws/aws-s3';

/**
 * Loads existing API keys from S3.
 * Returns empty objects if files don't exist.
 *
 * @param bucket S3 bucket name
 * @param encryptedKey S3 key for encrypted keys file
 * @param decryptedKey S3 key for decrypted keys file
 * @returns Object with encrypted and decrypted key maps
 */
export async function loadExistingKeys(
  bucket: string,
  encryptedKey?: string,
  decryptedKey?: string
): Promise<{ encrypted: Record<string, string>; decrypted: Record<string, string> }> {
  const s3 = new AWS_S3();

  let encrypted: Record<string, string> = {};
  let decrypted: Record<string, string> = {};

  if (encryptedKey) {
    try {
      const encryptedText = await s3.read(bucket, encryptedKey);
      encrypted = JSON.parse(encryptedText);
    } catch (error: any) {
      // If file doesn't exist, start with empty object
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
      decrypted = JSON.parse(decryptedText);
    } catch (error: any) {
      // If file doesn't exist, start with empty object
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
 * Saves API keys to S3.
 *
 * @param bucket S3 bucket name
 * @param encryptedKey S3 key for encrypted keys file
 * @param decryptedKey S3 key for decrypted keys file
 * @param encryptedMap Map of signing_address -> encrypted_api_key
 * @param decryptedMap Map of signing_address -> api_key
 */
export async function saveKeys(
  bucket: string,
  encryptedKey: string,
  decryptedKey: string,
  encryptedMap: Record<string, string>,
  decryptedMap: Record<string, string>
): Promise<void> {
  const s3 = new AWS_S3();

  const encryptedBody = Buffer.from(JSON.stringify(encryptedMap, null, 2), 'utf-8');
  const decryptedBody = Buffer.from(JSON.stringify(decryptedMap, null, 2), 'utf-8');

  await s3.upload(bucket, encryptedKey, encryptedBody, 'application/json');
  await s3.upload(bucket, decryptedKey, decryptedBody, 'application/json');
}
