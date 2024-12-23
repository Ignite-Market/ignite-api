import {
  GetSecretValueCommand,
  PutSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { env } from '../../config/env';
import { safeJsonParse } from '../utils';
import { AppEnvironment } from '../../config/types';

/**
 * Returns AWS secrets client.
 * Permission will be checked against execution role (of lambda)
 */
function createClient() {
  return new SecretsManagerClient({
    ...(env.APP_ENV === AppEnvironment.LOCAL_DEV &&
    env.AWS_KEY &&
    env.AWS_SECRET
      ? {
          credentials: {
            accessKeyId: env.AWS_KEY,
            secretAccessKey: env.AWS_SECRET,
          },
        }
      : {}),
    region: env.AWS_REGION,
  });
  // return new aws.SecretsManager({
  //   region: env.AWS_REGION,
  // });
}

export async function getSecrets(id: string): Promise<any> {
  const command = new GetSecretValueCommand({
    SecretId: id,
  });
  const response = await createClient().send(command);
  return safeJsonParse(response.SecretString);
}

export async function updateSecret(id: string, value: string): Promise<any> {
  const command = new PutSecretValueCommand({
    SecretId: id,
    SecretString: value,
  });
  return await createClient().send(command);
}
