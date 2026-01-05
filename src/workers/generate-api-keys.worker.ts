import { WorkerLogStatus } from '../lib/worker/logger';
import { BaseSingleThreadWorker, SingleThreadWorkerAlertType } from '../lib/worker/serverless-workers/base-single-thread-worker';
import { WorkerDefinition } from '../lib/worker/serverless-workers/worker-definition';
import { Context } from '../context';
import { generateApiKeys, SignerPubkey } from '../lib/generate-api-keys';
import { loadExistingKeys, saveKeys, ApiKeyEntry } from '../lib/api-keys-storage';
import { env } from '../config/env';
import { AppEnvironment } from '../config/types';
import { Job } from '../modules/job/job.model';

const FLARE_SIGNERS_URL = 'https://flare-systems-explorer-backend.flare.rocks/api/v0/lts/ignite/entities';

const FLARE_SONGBIRD_SIGNERS_URL = 'https://songbird-systems-explorer-backend.flare.rocks/api/v0/lts/ignite/entities';

interface FlareEntity {
  identity_address: string;
  signing_policy_address?: string | null;
  signing_policy_public_key?: string | null;
}

/**
 * Worker that generates API keys for new Flare and Songbird signers.
 * Fetches signers from both Flare and Songbird APIs and generates encrypted API keys for new ones.
 * Stores signers as arrays with network field ('flare' or 'songbird').
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
      await this.writeLogToDb(WorkerLogStatus.INFO, 'Starting API key generation for Flare and Songbird signers');

      // Fetch signers from both Flare and Songbird APIs
      const [flareEntities, songbirdEntities] = await Promise.all([
        this.fetchSigners(FLARE_SIGNERS_URL, 'flare'),
        this.fetchSigners(FLARE_SONGBIRD_SIGNERS_URL, 'songbird')
      ]);

      await this.writeLogToDb(
        WorkerLogStatus.INFO,
        `Fetched ${flareEntities.length} entities from Flare API and ${songbirdEntities.length} from Songbird API`
      );

      // Convert to signer format and filter out those without public keys
      const flareSigners = this.toSigners(flareEntities, 'flare');
      const songbirdSigners = this.toSigners(songbirdEntities, 'songbird');
      const signers = [...flareSigners, ...songbirdSigners];

      // Add test signer in dev environment
      if (env.APP_ENV === AppEnvironment.LOCAL_DEV || env.APP_ENV === AppEnvironment.DEV) {
        const testSigner: SignerPubkey = {
          signing_address: '0xaCe3587D87d3717c2FEA66e59A3126467f3E2C4c',
          recovered_pubkey_hex:
            '0xe324f9f0a0e18eb4d896ac49f9f502cfd0345a46d38304be5494a764f9adb9146b8ecb1dd4b59abd1b96fffc9a044d44798d15c0062e25671113fe20573421be',
          network: 'flare'
        };
        signers.push(testSigner);
        await this.writeLogToDb(WorkerLogStatus.INFO, 'Added test signer for dev environment');
      }

      if (signers.length === 0) {
        await this.writeLogToDb(WorkerLogStatus.INFO, 'No signers with public keys found');
        return;
      }

      await this.writeLogToDb(
        WorkerLogStatus.INFO,
        `Found ${signers.length} signers with public keys (${flareSigners.length} from Flare, ${songbirdSigners.length} from Songbird)`
      );

      // Validate S3 configuration
      const bucket = env.API_KEYS_S3_BUCKET;
      const encryptedKey = env.API_KEYS_ENCRYPTED_S3_KEY;
      const decryptedKey = env.API_KEYS_DECRYPTED_S3_KEY;

      if (!bucket || !encryptedKey || !decryptedKey) {
        throw new Error('API_KEYS_S3_BUCKET environment variable is not set');
      }

      // Load existing keys from S3
      const { encrypted, decrypted } = await loadExistingKeys(bucket, encryptedKey, decryptedKey);
      const existingCount = decrypted.length;
      await this.writeLogToDb(WorkerLogStatus.INFO, `Loaded ${existingCount} existing API keys from S3`);

      // Create a set of existing signing addresses for quick lookup
      const existingAddresses = new Set(decrypted.map((entry) => `${entry.signing_address}:${entry.network}`));

      // Filter to only new signers (not in existing keys)
      const newSigners = signers.filter((signer) => {
        const signingAddress = signer.signing_address || signer.voter_signing_address;
        const network = signer.network || 'flare';
        return !existingAddresses.has(`${signingAddress}:${network}`);
      });

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
      const updatedEncrypted: ApiKeyEntry[] = [...encrypted];
      const updatedDecrypted: ApiKeyEntry[] = [...decrypted];

      for (const keyData of generated) {
        updatedEncrypted.push({
          signing_address: keyData.signing_address,
          encrypted_api_key: keyData.encrypted_api_key,
          network: keyData.network
        });
        updatedDecrypted.push({
          signing_address: keyData.signing_address,
          api_key: keyData.api_key,
          network: keyData.network
        });
      }

      // Save updated keys to S3
      await saveKeys(bucket, encryptedKey, decryptedKey, updatedEncrypted, updatedDecrypted);

      const totalCount = updatedDecrypted.length;
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
   * Fetches signers from Flare or Songbird API.
   *
   * @param url API URL to fetch from
   * @param network Network name ('flare' or 'songbird')
   * @returns Array of Flare entities
   */
  private async fetchSigners(url: string, network: 'flare' | 'songbird'): Promise<FlareEntity[]> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch signers from ${network} API: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as FlareEntity[];
  }

  /**
   * Converts Flare entities to signer format.
   * Filters out entities without public keys (null, empty, or just "0x").
   *
   * @param entities Flare entities
   * @param network Network name ('flare' or 'songbird')
   * @returns Array of signers with signing_address, recovered_pubkey_hex, and network
   */
  private toSigners(entities: FlareEntity[], network: 'flare' | 'songbird'): SignerPubkey[] {
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
        recovered_pubkey_hex: entity.signing_policy_public_key!,
        network
      }));
  }
}
