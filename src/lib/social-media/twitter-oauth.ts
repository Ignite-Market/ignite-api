import { TwitterApi } from 'twitter-api-v2';
import { env } from '../../config/env';
import * as readline from 'readline';

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
 * Exchanges authorization code for access token.
 * @param code Authorization code from callback.
 * @param codeVerifier Code verifier used in authorization URL.
 * @returns Object with access token and refresh token.
 */
export async function exchangeTwitterCodeForToken(code: string, codeVerifier: string): Promise<{ accessToken: string; refreshToken?: string }> {
  if (!env.TWITTER_CLIENT_ID || !env.TWITTER_CLIENT_SECRET) {
    throw new Error('Twitter Client ID and Client Secret must be configured');
  }

  const client = new TwitterApi({
    clientId: env.TWITTER_CLIENT_ID,
    clientSecret: env.TWITTER_CLIENT_SECRET
  });

  const {
    client: loggedClient,
    accessToken,
    refreshToken
  } = await client.loginWithOAuth2({
    code,
    codeVerifier,
    redirectUri: env.TWITTER_REDIRECT_URI
  });

  return {
    accessToken,
    refreshToken: refreshToken || undefined
  };
}

/**
 * Refreshes an expired access token using refresh token.
 * @param refreshToken Refresh token from initial authorization.
 * @returns New access token and refresh token.
 */
export async function refreshTwitterToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
  if (!env.TWITTER_CLIENT_ID || !env.TWITTER_CLIENT_SECRET) {
    throw new Error('Twitter Client ID and Client Secret must be configured');
  }

  const client = new TwitterApi({
    clientId: env.TWITTER_CLIENT_ID,
    clientSecret: env.TWITTER_CLIENT_SECRET
  });

  const { client: refreshedClient, accessToken, refreshToken: newRefreshToken } = await client.refreshOAuth2Token(refreshToken);

  return {
    accessToken,
    refreshToken: newRefreshToken || refreshToken
  };
}

/**
 * Interactive script to get Twitter OAuth 2.0 access token.
 * Run this once to get your access token.
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
    console.log('\n🔐 Twitter OAuth 2.0 Token Generator\n');
    console.log('This script will help you get an access token for posting tweets.\n');

    // Generate auth URL
    const { url, codeVerifier, state } = await generateTwitterAuthUrl();

    console.log('\n📋 Step 1: Visit this URL to authorize:');
    console.log(url);
    console.log('\n📋 Step 2: After authorization, you will be redirected to your callback URL.');
    console.log('📋 Step 3: Copy the "code" parameter from the callback URL.\n');

    const code = await question('Enter the authorization code: ');

    if (!code) {
      console.error('❌ Authorization code is required');
      rl.close();
      process.exit(1);
    }

    // Exchange code for token
    console.log('\n⏳ Exchanging code for access token...');
    const { accessToken, refreshToken } = await exchangeTwitterCodeForToken(code, codeVerifier);

    console.log('\n✅ Success! Your tokens:\n');
    console.log('Access Token:', accessToken);
    if (refreshToken) {
      console.log('Refresh Token:', refreshToken);
    }
    console.log('\n📝 Add these to your .env file:');
    console.log(`TWITTER_ACCESS_TOKEN=${accessToken}`);
    if (refreshToken) {
      console.log(`TWITTER_REFRESH_TOKEN=${refreshToken}`);
    }
    console.log('\n✨ Done! You can now use the Twitter API to post tweets.\n');

    rl.close();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    rl.close();
    process.exit(1);
  }
}
