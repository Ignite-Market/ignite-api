import 'dotenv/config';
import { getTwitterTokenInteractive } from '../lib/social-media/twitter-oauth';

/**
 * Script to get Twitter OAuth 2.0 access token.
 * Tokens are persisted to AWS Secrets Manager if TWITTER_TOKENS_SECRET_ID is configured.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/scripts/get-twitter-token.ts
 *
 * Or:
 *   npm run get-twitter-token
 */
(async () => {
  try {
    await getTwitterTokenInteractive();
    process.exit(0);
  } catch (error) {
    console.error('Failed to get Twitter token:', error);
    process.exit(1);
  }
})();
