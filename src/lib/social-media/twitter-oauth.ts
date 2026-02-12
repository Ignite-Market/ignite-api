import { Logger } from '@nestjs/common';
import { TwitterApi } from 'twitter-api-v2';
import { env } from '../../config/env';
import { getSecrets, updateSecret } from '../aws/aws-secrets';
import * as readline from 'readline';

const logger = new Logger('social-media/twitter-oauth');

interface TwitterTokens {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Reads Twitter OAuth tokens from AWS Secrets Manager.
 * Falls back to env variables if Secrets Manager is not configured.
 * @returns Twitter tokens.
 */
export async function getTwitterTokens(): Promise<TwitterTokens> {
  // Try Secrets Manager first
  if (env.TWITTER_TOKENS_SECRET_ID) {
    try {
      const secrets = await getSecrets(env.TWITTER_TOKENS_SECRET_ID);
      if (secrets?.TWITTER_ACCESS_TOKEN) {
        return {
          accessToken: secrets.TWITTER_ACCESS_TOKEN,
          refreshToken: secrets.TWITTER_REFRESH_TOKEN || undefined
        };
      }
    } catch (error) {
      logger.warn(`Failed to read Twitter tokens from Secrets Manager: ${error.message}. Falling back to env variables.`);
    }
  }

  // Fallback to env variables
  return {
    accessToken: env.TWITTER_ACCESS_TOKEN,
    refreshToken: env.TWITTER_REFRESH_TOKEN || undefined
  };
}

/**
 * Persists Twitter OAuth tokens to AWS Secrets Manager.
 * @param tokens Twitter tokens to persist.
 */
export async function persistTwitterTokens(tokens: TwitterTokens): Promise<void> {
  if (!env.TWITTER_TOKENS_SECRET_ID) {
    logger.warn('TWITTER_TOKENS_SECRET_ID is not configured. Tokens will not be persisted.');
    return;
  }

  try {
    await updateSecret(
      env.TWITTER_TOKENS_SECRET_ID,
      JSON.stringify({
        TWITTER_ACCESS_TOKEN: tokens.accessToken,
        TWITTER_REFRESH_TOKEN: tokens.refreshToken
      })
    );
    logger.log('Twitter tokens persisted to Secrets Manager.');
  } catch (error) {
    logger.error(`Failed to persist Twitter tokens to Secrets Manager: ${error.message}`, error);
    throw error;
  }
}

/**
 * Generates OAuth 2.0 authorization URL for Twitter.
 * @returns Object with authorization URL, code verifier, and state.
 */
export async function generateTwitterAuthUrl(): Promise<{ url: string; codeVerifier: string; state: string }> {
  if (!env.TWITTER_CLIENT_ID || !env.TWITTER_CLIENT_SECRET) {
    throw new Error('Twitter Client ID and Client Secret must be configured');
  }

  const client = new TwitterApi({
    clientId: env.TWITTER_CLIENT_ID,
    clientSecret: env.TWITTER_CLIENT_SECRET
  });

  const { url, codeVerifier, state } = await client.generateOAuth2AuthLink(env.TWITTER_REDIRECT_URI, {
    scope: ['tweet.write', 'tweet.read', 'users.read', 'offline.access', 'media.write']
  });

  return { url, codeVerifier, state };
}

/**
 * Exchanges authorization code for access token and persists to Secrets Manager.
 * @param code Authorization code from callback.
 * @param codeVerifier Code verifier used in authorization URL.
 * @returns Object with access token and refresh token.
 */
export async function exchangeTwitterCodeForToken(code: string, codeVerifier: string): Promise<TwitterTokens> {
  if (!env.TWITTER_CLIENT_ID || !env.TWITTER_CLIENT_SECRET) {
    throw new Error('Twitter Client ID and Client Secret must be configured');
  }

  const client = new TwitterApi({
    clientId: env.TWITTER_CLIENT_ID,
    clientSecret: env.TWITTER_CLIENT_SECRET
  });

  const { accessToken, refreshToken } = await client.loginWithOAuth2({
    code,
    codeVerifier,
    redirectUri: env.TWITTER_REDIRECT_URI
  });

  const tokens: TwitterTokens = {
    accessToken,
    refreshToken: refreshToken || undefined
  };

  // Persist tokens to Secrets Manager
  await persistTwitterTokens(tokens);

  return tokens;
}

/**
 * Refreshes an expired access token and persists the new tokens to Secrets Manager.
 * @param refreshToken Refresh token from initial authorization.
 * @returns New access token and refresh token.
 */
export async function refreshTwitterToken(refreshToken: string): Promise<TwitterTokens> {
  if (!env.TWITTER_CLIENT_ID || !env.TWITTER_CLIENT_SECRET) {
    throw new Error('Twitter Client ID and Client Secret must be configured');
  }

  const client = new TwitterApi({
    clientId: env.TWITTER_CLIENT_ID,
    clientSecret: env.TWITTER_CLIENT_SECRET
  });

  const { accessToken, refreshToken: newRefreshToken } = await client.refreshOAuth2Token(refreshToken);

  const tokens: TwitterTokens = {
    accessToken,
    refreshToken: newRefreshToken || refreshToken
  };

  // Persist refreshed tokens to Secrets Manager
  await persistTwitterTokens(tokens);

  return tokens;
}

/**
 * Interactive script to get Twitter OAuth 2.0 access token.
 * Persists tokens to Secrets Manager if configured.
 */
export async function getTwitterTokenInteractive(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  try {
    console.log('\nTwitter OAuth 2.0 Token Generator\n');
    console.log('This script will help you get an access token for posting tweets.\n');

    // Generate auth URL
    const { url, codeVerifier } = await generateTwitterAuthUrl();

    console.log('\nStep 1: Visit this URL to authorize:');
    console.log(url);
    console.log('\nStep 2: After authorization, you will be redirected to your callback URL.');
    console.log('Step 3: Copy the "code" parameter from the callback URL.\n');

    const code = await question('Enter the authorization code: ');

    if (!code) {
      console.error('Authorization code is required');
      rl.close();
      process.exit(1);
    }

    // Exchange code for token (this also persists to Secrets Manager)
    console.log('\nExchanging code for access token...');
    const { accessToken, refreshToken } = await exchangeTwitterCodeForToken(code, codeVerifier);

    console.log('\nSuccess! Your tokens:\n');
    console.log('Access Token:', accessToken);
    if (refreshToken) {
      console.log('Refresh Token:', refreshToken);
    }

    if (env.TWITTER_TOKENS_SECRET_ID) {
      console.log(`\nTokens have been persisted to Secrets Manager (${env.TWITTER_TOKENS_SECRET_ID}).`);
    } else {
      console.log('\nWARNING: TWITTER_TOKENS_SECRET_ID is not set. Tokens were NOT persisted to Secrets Manager.');
      console.log('Add these to your .env file or AWS Secrets Manager manually:');
      console.log(`TWITTER_ACCESS_TOKEN=${accessToken}`);
      if (refreshToken) {
        console.log(`TWITTER_REFRESH_TOKEN=${refreshToken}`);
      }
    }

    console.log('\nDone! You can now use the Twitter API to post tweets.\n');

    rl.close();
  } catch (error) {
    console.error('\nError:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    rl.close();
    process.exit(1);
  }
}
