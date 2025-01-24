import { getSecrets } from '../lib/aws/aws-secrets';
import { AppEnvironment, CacheKeyTTL, LogLevel } from './types';
import * as dotenv from 'dotenv';

/**
 * Environment interface.
 */
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
  AWS_SECRET: string;

  AWS_WORKER_LAMBDA_NAME: string;
  AWS_WORKER_SQS_URL: string;

  MYSQL_HOST: string;
  MYSQL_DATABASE: string;
  MYSQL_PASSWORD: string;
  MYSQL_PORT: number;
  MYSQL_USER: string;
  MYSQL_SSL_CA_FILE: string;
  MYSQL_SSL_KEY_FILE: string;
  MYSQL_SSL_CERT_FILE: string;

  MYSQL_HOST_TEST: string;
  MYSQL_DATABASE_TEST: string;
  MYSQL_PASSWORD_TEST: string;
  MYSQL_PORT_TEST: number;
  MYSQL_USER_TEST: string;

  PREDICTION_SET_MINIMAL_DATA_SOURCES: number;

  SLACK_WEBHOOK_URL: string;

  ORACLE_CONTRACT: string;
  JSON_VERIFIER_CONTRACT: string;
  COLLATERAL_TOKEN_CONTRACT: string;
  CONDITIONAL_TOKEN_CONTRACT: string;
  FPMM_FACTORY_CONTRACT: string;
  SIGNER_PRIVATE_KEY: string;

  FPMM_PARSE_BLOCK_SIZE: number;
  FPMM_FACTORY_PARSE_BLOCK_SIZE: number;

  FPMM_BLOCK_CONFIRMATIONS: number;
  FPMM_FACTORY_BLOCK_CONFIRMATIONS: number;

  RPC_URL: string;
  FLARE_DATA_AVAILABILITY_URL: string;
  FLARE_DATA_AVAILABILITY_API_KEY: string;
  FLARE_CONTRACT_REGISTRY_ADDRESS: string;
  FLARE_ATTESTATION_PROVIDER_URL: string;
  FLARE_ATTESTATION_PROVIDER_API_KEY: string;
}

dotenv.config();

export let env: IEnv = {
  /**
   * API settings.
   */
  API_HOST: process.env['API_HOST'] || '0.0.0.0',
  API_PORT: parseInt(process.env['API_PORT']) || 6060,

  API_HOST_TEST: process.env['API_HOST_TEST'] || '0.0.0.0',
  API_PORT_TEST: parseInt(process.env['API_PORT_TEST']) || 6070,

  APP_URL: process.env['APP_URL'] || 'https://app.monitor.kalmia.si',
  APP_ENV: process.env['APP_ENV'] || AppEnvironment.LOCAL_DEV,
  APP_SECRET: process.env['APP_SECRET'] || 'deodapdoevnfrbv213213!"#',

  LOG_TARGET: process.env['LOG_TARGET'] || 'color',
  LOG_LEVEL: process.env['LOG_LEVEL'] || LogLevel.DEBUG,
  SLACK_WEBHOOK_URL: process.env['SLACK_WEBHOOK_URL'],

  DEFAULT_PAGE_SIZE: parseInt(process.env['DEFAULT_PAGE_SIZE']) || 20,

  /**
   * Cache settings.
   */
  REDIS_URL: process.env['REDIS_URL'],
  DEFAULT_CACHE_TTL: parseInt(process.env['DEFAULT_CACHE_TTL']) || CacheKeyTTL.DEFAULT,

  /**
   * AWS S3 settings.
   */
  AWS_KEY: process.env['AWS_KEY'],
  AWS_SECRET: process.env['AWS_SECRET'],
  AWS_REGION: process.env['AWS_REGION'] || 'us-east-1',
  AWS_SECRETS_ID: process.env['AWS_SECRETS_ID'],

  /*
   * Lambda worker settings.
   */
  AWS_WORKER_LAMBDA_NAME: process.env['AWS_WORKER_LAMBDA_NAME'],
  AWS_WORKER_SQS_URL: process.env['AWS_WORKER_SQS_URL'],

  /**
   * MySQL connection settings.
   */
  MYSQL_HOST: process.env['MYSQL_HOST'],
  MYSQL_DATABASE: process.env['MYSQL_DATABASE'],
  MYSQL_PASSWORD: process.env['MYSQL_PASSWORD'],
  MYSQL_PORT: parseInt(process.env['MYSQL_PORT']),
  MYSQL_USER: process.env['MYSQL_USER'],

  /**
   * MySQL SSL file paths.
   */
  MYSQL_SSL_CA_FILE: process.env['MYSQL_SSL_CA_FILE'],
  MYSQL_SSL_KEY_FILE: process.env['MYSQL_SSL_KEY_FILE'],
  MYSQL_SSL_CERT_FILE: process.env['MYSQL_SSL_CERT_FILE'],

  /**
   * MySQL connection settings for testing.
   */
  MYSQL_HOST_TEST: process.env['MYSQL_HOST_TEST'],
  MYSQL_DATABASE_TEST: process.env['MYSQL_DATABASE_TEST'],
  MYSQL_PASSWORD_TEST: process.env['MYSQL_PASSWORD_TEST'],
  MYSQL_PORT_TEST: parseInt(process.env['MYSQL_PORT_TEST']),
  MYSQL_USER_TEST: process.env['MYSQL_USER_TEST'],

  PREDICTION_SET_MINIMAL_DATA_SOURCES: parseInt(process.env['PREDICTION_SET_MINIMAL_DATA_SOURCES']) || 3,

  /**
   * Fixed product market maker & conditional token contracts.
   */
  COLLATERAL_TOKEN_CONTRACT: process.env['COLLATERAL_TOKEN_CONTRACT'],
  CONDITIONAL_TOKEN_CONTRACT: process.env['CONDITIONAL_TOKEN_CONTRACT'],
  FPMM_FACTORY_CONTRACT: process.env['FPMM_FACTORY_CONTRACT'],
  ORACLE_CONTRACT: process.env['ORACLE_CONTRACT'],
  JSON_VERIFIER_CONTRACT: process.env['JSON_VERIFIER_CONTRACT'],

  RPC_URL: process.env['RPC_URL'],
  FLARE_DATA_AVAILABILITY_URL: process.env['FLARE_DATA_AVAILABILITY_URL'],
  FLARE_DATA_AVAILABILITY_API_KEY: process.env['FLARE_DATA_AVAILABILITY_API_KEY'],
  SIGNER_PRIVATE_KEY: process.env['SIGNER_PRIVATE_KEY'],
  FLARE_CONTRACT_REGISTRY_ADDRESS: process.env['FLARE_ATTESTATION_PROVIDER_URL'],
  FLARE_ATTESTATION_PROVIDER_URL: process.env['FLARE_ATTESTATION_PROVIDER_URL'],
  FLARE_ATTESTATION_PROVIDER_API_KEY: process.env['FLARE_ATTESTATION_PROVIDER_API_KEY'],

  FPMM_PARSE_BLOCK_SIZE: parseInt(process.env['FPMM_PARSE_BLOCK_SIZE']) || 50_000,
  FPMM_FACTORY_PARSE_BLOCK_SIZE: parseInt(process.env['FPMM_FACTORY_PARSE_BLOCK_SIZE']) || 50_000,

  FPMM_BLOCK_CONFIRMATIONS: parseInt(process.env['FPMM_BLOCK_CONFIRMATIONS']) || 5,
  FPMM_FACTORY_BLOCK_CONFIRMATIONS: parseInt(process.env['FPMM_FACTORY_BLOCK_CONFIRMATIONS']) || 5
};

/**
 * Flag to check if environment is ready.
 */
export let isEnvReady = false;

/**
 * Should be used for retrieving environment variables from AWS secret manager.
 * @returns IEnv dictionary.
 */
export async function getEnvSecrets() {
  if (!isEnvReady) {
    await populateSecrets();
  }
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
  } catch (error) {
    console.error('Error while populating env secretes: ');
    console.error(error);
  }
  isEnvReady = true;
}

/**
 * Startup population of secrets.
 */
populateSecrets()
  .then(() => {
    console.log('Environment is ready.');
  })
  .catch((error) => {
    console.error('Error preparing environment.', error);
  });
