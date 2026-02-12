import { Logger } from '@nestjs/common';
import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';
import { env } from '../../config/env';
import { getTwitterTokens, refreshTwitterToken, persistTwitterTokens } from './twitter-oauth';

/**
 * Posts a message and optional image to Twitter/X using OAuth 2.0.
 * Reads tokens from AWS Secrets Manager and auto-refreshes on expiry.
 *
 * @param message The text content to post.
 * @param imgLink Optional URL to an image.
 * @returns Object with success status and tweet ID or error message.
 */
export async function postToTwitter(message: string, imgLink?: string): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const logger = new Logger('social-media/postToTwitter');

  try {
    if (!env.TWITTER_CLIENT_ID || !env.TWITTER_CLIENT_SECRET) {
      throw new Error('Twitter OAuth 2.0 credentials are not configured');
    }

    // Read tokens from Secrets Manager (falls back to env)
    const tokens = await getTwitterTokens();
    if (!tokens.accessToken) {
      throw new Error('Twitter access token is not available. Run get-twitter-token script first.');
    }

    return await postTweet(tokens.accessToken, message, imgLink, tokens.refreshToken);
  } catch (error) {
    logger.error(`Failed to post to Twitter: ${error.message}`, error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred while posting to Twitter'
    };
  }
}

/**
 * Internal function that posts a tweet. Handles token refresh on 401.
 */
async function postTweet(
  accessToken: string,
  message: string,
  imgLink?: string,
  refreshToken?: string
): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const logger = new Logger('social-media/postTweet');

  try {
    const client = new TwitterApi(accessToken);
    const rwClient = client.readWrite;

    let mediaId: string | undefined;

    // If image link is provided, download and upload it
    if (imgLink) {
      try {
        const imageResponse = await axios.get(imgLink, {
          responseType: 'arraybuffer',
          timeout: 10000
        });

        const mediaIdResponse = await rwClient.v2.uploadMedia(Buffer.from(imageResponse.data), {
          media_type: imageResponse.headers['content-type'] || 'image/jpeg'
        });

        mediaId = mediaIdResponse;
      } catch (error) {
        logger.error(`Failed to upload image to Twitter: ${error.message}`, error);
        // Continue without image if upload fails
      }
    }

    // Create tweet
    const tweetOptions: any = { text: message };
    if (mediaId) {
      tweetOptions.media = { media_ids: [mediaId] };
    }

    const tweet = await rwClient.v2.tweet(tweetOptions);

    logger.log(`Successfully posted to Twitter. Tweet ID: ${tweet.data.id}`);
    return { success: true, tweetId: tweet.data.id };
  } catch (error: any) {
    // If token expired and we have a refresh token, try refreshing
    if ((error.code === 401 || error.status === 401) && refreshToken) {
      logger.log('Access token expired, refreshing...');

      try {
        const newTokens = await refreshTwitterToken(refreshToken);

        logger.log('Token refreshed and persisted. Retrying post...');
        return await postTweet(newTokens.accessToken, message, imgLink);
      } catch (refreshError: any) {
        logger.error(`Token refresh failed: ${refreshError.message}`, refreshError);
        return {
          success: false,
          error: 'Token expired and refresh failed. Run get-twitter-token script to re-authorize.'
        };
      }
    }

    throw error;
  }
}

/**
 * Posts a message and optional image to Discord using webhook.
 *
 * @param message The text content to post.
 * @param imgLink Optional URL to an image.
 * @returns Object with success status or error message.
 */
export async function postToDiscord(message: string, imgLink?: string): Promise<{ success: boolean; error?: string }> {
  const logger = new Logger('social-media/postToDiscord');

  try {
    if (!env.DISCORD_WEBHOOK_URL) {
      throw new Error('Discord webhook URL is not configured');
    }

    const payload: any = {
      content: message
    };

    if (imgLink) {
      payload.embeds = [
        {
          image: {
            url: imgLink
          }
        }
      ];
    }

    const response = await axios.post(env.DISCORD_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.status >= 200 && response.status < 300) {
      logger.log('Successfully posted to Discord');
      return { success: true };
    } else {
      throw new Error(`Discord webhook returned status ${response.status}`);
    }
  } catch (error) {
    logger.error(`Failed to post to Discord: ${error.message}`, error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred while posting to Discord'
    };
  }
}
