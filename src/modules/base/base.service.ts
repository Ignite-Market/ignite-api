import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { env } from '../../config/env';
import { loadExistingKeys } from '../../lib/api-keys-storage';

@Injectable()
export class BaseService {
  /**
   * Returns base API information.
   */
  getRoot() {
    return {
      name: 'Ignite Market API',
      description:
        'Ignite Market is a decentralized prediction market platform, designed to enable users to trade on the outcomes of real-world events.',
      uptime: process.uptime()
    };
  }

  async getSiteVerify(procaptcha: any) {
    // send a POST application/json request to the API endpoint
    const response = await axios.post('https://api.prosopo.io/siteverify', {
      token: procaptcha.token,
      secret: env.PROSOPO_SECRET_KEY
    });

    return response.data?.verified ?? false;
  }

  /**
   * Fetches encrypted API keys from S3 and returns them in the requested format.
   * @returns Array of objects with signing_policy_address, encrypted_API_key, and network
   */
  async getEncryptedApiKeys(network: 'flare' | 'songbird'): Promise<Array<{ signing_policy_address: string; encrypted_API_key: string }>> {
    const bucket = env.API_KEYS_S3_BUCKET;
    const encryptedKey = env.API_KEYS_ENCRYPTED_S3_KEY;

    if (!bucket || !encryptedKey) {
      throw new Error('API_KEYS_S3_BUCKET or API_KEYS_ENCRYPTED_S3_KEY environment variable is not set');
    }

    const { encrypted } = await loadExistingKeys(bucket, encryptedKey); // We only need encrypted keys

    // Convert from array format to the expected format
    return encrypted
      .filter((entry) => entry.encrypted_api_key && entry.network === network) // Only include entries with encrypted keys and the correct network
      .map((entry) => ({
        signing_policy_address: entry.signing_address,
        encrypted_API_key: entry.encrypted_api_key!
      }));
  }
}
