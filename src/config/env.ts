import { getSecrets } from '../lib/aws/aws-secrets';
import { AppEnvironment, CacheKeyTTL, LogLevel } from './types';
import * as dotenv from 'dotenv';

export interface IEnv {
  API_HOST: string;
  API_PORT: number;

  API_HOST_TEST: string;
  API_PORT_TEST: number;

  APP_URL: string;
  APP_ENV: string;
  APP_SECRET: string;

  LOG_TARGET: string;
  LOG_LEVEL: string;

  DEFAULT_PAGE_SIZE: number;
  DEFAULT_CACHE_TTL: number;

  REDIS_URL: string;

  /**
   * ENV var from lambda - current region - can not be overwritten in lambda settings!
   */
  AWS_REGION: string;
  /**
   * ID of the secrets from secret manager.
   */
  AWS_SECRETS_ID: string;

  AWS_KEY: string;
  AWS_BUCKET: string;
  AWS_ENDPOINT: string;
  AWS_SECRET: string;

  AWS_WORKER_LAMBDA_NAME: string;
  AWS_WORKER_SQS_URL: string;

  MYSQL_HOST: string;
  MYSQL_DATABASE: string;
  MYSQL_PASSWORD: string;
  MYSQL_PORT: number;
  MYSQL_USER: string;

  MYSQL_HOST_TEST: string;
  MYSQL_DATABASE_TEST: string;
  MYSQL_PASSWORD_TEST: string;
  MYSQL_PORT_TEST: number;
  MYSQL_USER_TEST: string;

  PREDICTION_CONTRACT: string;
  ATTESTATION_PRIVATE_KEY: string;
  FLARE_RPC: string;
  TOKEN_CONTRACT: string;
}

dotenv.config();

export let env: IEnv = {
  API_HOST: process.env['API_HOST'] || '0.0.0.0',
  API_PORT: parseInt(process.env['API_PORT']) || 6060,

  API_HOST_TEST: process.env['API_HOST_TEST'] || '0.0.0.0',
  API_PORT_TEST: parseInt(process.env['API_PORT_TEST']) || 6070,

  APP_URL: process.env['APP_URL'] || 'https://app.monitor.kalmia.si',
  APP_ENV: process.env['APP_ENV'] || AppEnvironment.LOCAL_DEV,
  APP_SECRET: process.env['APP_SECRET'] || 'deodapdoevnfrbv213213!"#',

  LOG_TARGET: process.env['LOG_TARGET'] || 'color',
  LOG_LEVEL: process.env['LOG_LEVEL'] || LogLevel.DEBUG,

  DEFAULT_PAGE_SIZE: parseInt(process.env['DEFAULT_PAGE_SIZE']) || 20,
  DEFAULT_CACHE_TTL: parseInt(process.env['DEFAULT_CACHE_TTL']) || CacheKeyTTL.DEFAULT,

  REDIS_URL: process.env['REDIS_URL'],

  AWS_SECRETS_ID: process.env['AWS_SECRETS_ID'],

  AWS_KEY: process.env['AWS_KEY'],
  AWS_BUCKET: process.env['AWS_BUCKET'],
  AWS_ENDPOINT: process.env['AWS_ENDPOINT'],
  AWS_SECRET: process.env['AWS_SECRET'],
  AWS_REGION: process.env['AWS_REGION'] || 'eu-west-1',

  AWS_WORKER_LAMBDA_NAME: process.env['AWS_WORKER_LAMBDA_NAME'],
  AWS_WORKER_SQS_URL: process.env['AWS_WORKER_SQS_URL'],

  MYSQL_HOST: process.env['MYSQL_HOST'],
  MYSQL_DATABASE: process.env['MYSQL_DATABASE'],
  MYSQL_PASSWORD: process.env['MYSQL_PASSWORD'],
  MYSQL_PORT: parseInt(process.env['MYSQL_PORT']),
  MYSQL_USER: process.env['MYSQL_USER'],

  MYSQL_HOST_TEST: process.env['MYSQL_HOST_TEST'],
  MYSQL_DATABASE_TEST: process.env['MYSQL_DATABASE_TEST'],
  MYSQL_PASSWORD_TEST: process.env['MYSQL_PASSWORD_TEST'],
  MYSQL_PORT_TEST: parseInt(process.env['MYSQL_PORT_TEST']),
  MYSQL_USER_TEST: process.env['MYSQL_USER_TEST'],

  PREDICTION_CONTRACT: process.env['PREDICTION_CONTRACT'],

  ATTESTATION_PRIVATE_KEY: process.env['ATTESTATION_PRIVATE_KEY'],

  FLARE_RPC: process.env['FLARE_RPC'],
  TOKEN_CONTRACT: process.env['TOKEN_CONTRACT']
};

export let isEnvReady = false;

/**
 * Should be used for retrieving environment variables from AWS secret manager.
 * @returns IEnv dictionary
 */
export async function getEnvSecrets() {
  if (!isEnvReady) {
    await populateSecrets();
  }
  // only uncomment for debugging... should not print out in production!!!
  // console.log(JSON.stringify(env, null, 2));
  return env;
}

/**
 * Will overwrite secrets from AWS secrets manager if access is granted.
 * Otherwise env variables will stay the same.
 */
async function populateSecrets() {
  if (!env.AWS_SECRETS_ID) {
    isEnvReady = true;
    return;
  }

  try {
    const secrets = await getSecrets(env.AWS_SECRETS_ID);
    env = { ...env, ...secrets };
  } catch (err) {
    console.error('Error while populating env secretes: ');
    console.error(err);
  }
  isEnvReady = true;
}

// startup populate
populateSecrets()
  .then(() => {
    console.log('Environment is ready.');
  })
  .catch((error) => {
    console.error('Error preparing environment.', error);
  });
