import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../lib/worker/serverless-workers/base-single-thread-worker';
import { WorkerDefinition } from '../lib/worker/serverless-workers/worker-definition';
import { Context } from '../context';
import { generateApiKeys, SignerPubkey } from '../lib/generate-api-keys';
import { loadExistingKeys, saveKeys } from '../lib/api-keys-storage';
import { env } from '../config/env';
import { Job } from '../modules/job/job.model';

const FLARE_SIGNERS_URL = 'https://flare-systems-explorer-backend.flare.rocks/api/v0/lts/ignite/entities';

interface FlareEntity {
  identity_address: string;
  signing_policy_address?: string | null;
  signing_policy_public_key?: string | null;
}

/**
 * Worker that generates API keys for new Flare signers.
 * Fetches signers from Flare API and generates encrypted API keys for new ones.
 */
export class GenerateApiKeysWorker extends BaseSingleThreadWorker {
  public constructor(workerDefinition: WorkerDefinition, context: Context) {
    super(workerDefinition, context);
  }

  /**
   * Runs worker executor.
   */
  public async runExecutor(_data?: any): Promise<void> {
    try {
      await this.writeLogToDb(WorkerLogStatus.INFO, 'Starting API key generation for Flare signers');

      // Fetch signers from Flare API
      const entities = await this.fetchSigners();
      await this.writeLogToDb(WorkerLogStatus.INFO, `Fetched ${entities.length} entities from Flare API`);

      // Convert to signer format and filter out those without public keys
      const signers = this.toSigners(entities);
      if (signers.length === 0) {
        await this.writeLogToDb(WorkerLogStatus.INFO, 'No signers with public keys found');
        return;
      }

      await this.writeLogToDb(WorkerLogStatus.INFO, `Found ${signers.length} signers with public keys`);

      // Validate S3 configuration
      const bucket = env.API_KEYS_S3_BUCKET;
      const encryptedKey = env.API_KEYS_ENCRYPTED_S3_KEY || 'api-keys/encrypted-keys.json';
      const decryptedKey = env.API_KEYS_DECRYPTED_S3_KEY || 'api-keys/decrypted-keys.json';

      if (!bucket || !encryptedKey || !decryptedKey) {
        throw new Error('API_KEYS_S3_BUCKET environment variable is not set');
      }

      // Load existing keys from S3
      const { encrypted, decrypted } = await loadExistingKeys(bucket, encryptedKey, decryptedKey);
      const existingCount = Object.keys(decrypted).length;
      await this.writeLogToDb(WorkerLogStatus.INFO, `Loaded ${existingCount} existing API keys from S3`);

      // Filter to only new signers (not in existing keys)
      const newSigners = signers.filter((signer) => !decrypted[signer.signing_address]);
      if (newSigners.length === 0) {
        await this.writeLogToDb(WorkerLogStatus.INFO, 'No new signers to process');
        return;
      }

      await this.writeLogToDb(WorkerLogStatus.INFO, `Generating API keys for ${newSigners.length} new signers`);

      // Generate API keys for new signers
      const generated = generateApiKeys(newSigners);

      if (generated.length === 0) {
        await this.writeLogToDb(WorkerLogStatus.WARNING, 'No API keys were generated (all signers may have been invalid)');
        return;
      }

      // Merge new keys with existing ones
      const updatedEncrypted = { ...encrypted };
      const updatedDecrypted = { ...decrypted };

      for (const keyData of generated) {
        updatedEncrypted[keyData.signing_address] = keyData.encrypted_api_key;
        updatedDecrypted[keyData.signing_address] = keyData.api_key;
      }

      // Save updated keys to S3
      await saveKeys(bucket, encryptedKey, decryptedKey, updatedEncrypted, updatedDecrypted);

      const totalCount = Object.keys(updatedDecrypted).length;
      await this.writeLogToDb(WorkerLogStatus.INFO, `Successfully generated ${generated.length} new API keys. Total keys: ${totalCount}`);
    } catch (error) {
      await this.writeLogToDb(WorkerLogStatus.ERROR, 'Error generating API keys', null, error as Error);
      throw error;
    }
  }

  /**
   * On alert event handling.
   *
   * @param _job Job.
   * @param alertType Alert type.
   */
  public async onAlert(_job: Job, alertType: SingleThreadWorkerAlertType): Promise<any> {
    if (alertType === SingleThreadWorkerAlertType.JOB_LOCKED) {
      throw new Error(`${this.workerName} - LOCK ALERT HAS BEEN CALLED`);
    }
    if (alertType === SingleThreadWorkerAlertType.MISSING_JOB_DEFINITION) {
      throw new Error(`${this.workerName} - MISSING JOB ALERT HAS BEEN CALLED`);
    }
  }

  /**
   * Fetches signers from Flare API.
   *
   * @returns Array of Flare entities
   */
  private async fetchSigners(): Promise<FlareEntity[]> {
    const response = await fetch(FLARE_SIGNERS_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch signers from Flare API: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as FlareEntity[];
  }

  /**
   * Converts Flare entities to signer format.
   * Filters out entities without public keys (null, empty, or just "0x").
   *
   * @param entities Flare entities
   * @returns Array of signers with signing_address and recovered_pubkey_hex
   */
  private toSigners(entities: FlareEntity[]): SignerPubkey[] {
    return entities
      .filter((entity) => {
        // Must have signing policy address
        if (!entity.signing_policy_address) {
          return false;
        }

        // Must have public key
        const pubKey = entity.signing_policy_public_key;
        if (!pubKey) {
          return false;
        }

        // Filter out keys that are just "0x" or empty after removing prefix
        const hexStr = pubKey.trim().toLowerCase();
        const hexWithoutPrefix = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;

        // Must have actual hex data (at least 64 hex chars = 32 bytes for compressed, or 128 hex chars = 64 bytes for uncompressed)
        return hexWithoutPrefix.length >= 64;
      })
      .map((entity) => ({
        signing_address: entity.signing_policy_address!,
        recovered_pubkey_hex: entity.signing_policy_public_key!
      }));
  }
}
