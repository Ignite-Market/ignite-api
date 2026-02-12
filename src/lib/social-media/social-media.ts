import { Logger } from '@nestjs/common';
import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';
import { env } from '../../config/env';

/**
 * Posts a message and optional image to Twitter/X using OAuth 2.0.
 * @param message The text content to post.
 * @param imgLink Optional URL to an image.
 * @returns Object with success status and tweet ID or error message.
 */
export async function postToTwitter(message: string, imgLink?: string): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const logger = new Logger('social-media/postToTwitter');

  try {
    3;
    if (!env.TWITTER_CLIENT_ID || !env.TWITTER_CLIENT_SECRET || !env.TWITTER_ACCESS_TOKEN) {
      throw new Error('Twitter OAuth 2.0 credentials are not configured');
    }

    // Use OAuth 2.0 User Context - pass access token directly
    // The access token should be obtained via OAuth 2.0 flow (see get-twitter-token script)
    const client = new TwitterApi(env.TWITTER_ACCESS_TOKEN);

    const rwClient = client.readWrite;

    let mediaId: string | undefined;

    // If image link is provided, download and upload it
    if (imgLink) {
      try {
        // Download the image
        const imageResponse = await axios.get(imgLink, {
          responseType: 'arraybuffer',
          timeout: 10000
        });

        // Upload media to Twitter
        const mediaIdResponse = await rwClient.v2.uploadMedia(Buffer.from(imageResponse.data), {
          media_type: imageResponse.headers['content-type'] || 'image/jpeg'
        });

        mediaId = mediaIdResponse;
      } catch (error) {
        logger.error(`Failed to upload image to Twitter: ${error.message}`, error);
        // Continue without image if upload fails
      }
    }

    // Create tweet with text and optional media
    const tweetOptions: any = {
      text: message
    };

    if (mediaId) {
      tweetOptions.media = {
        media_ids: [mediaId]
      };
    }

    const tweet = await rwClient.v2.tweet(tweetOptions);

    logger.log(`Successfully posted to Twitter. Tweet ID: ${tweet.data.id}`);
    return {
      success: true,
      tweetId: tweet.data.id
    };
  } catch (error: any) {
    // If token expired, try to refresh it
    if ((error.code === 401 || error.status === 401) && env.TWITTER_REFRESH_TOKEN) {
      try {
        logger.log('Access token expired, attempting to refresh...');
        const { refreshTwitterToken } = await import('./twitter-oauth');
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshTwitterToken(env.TWITTER_REFRESH_TOKEN);

        // Update environment (note: in production, you'd want to persist this)
        env.TWITTER_ACCESS_TOKEN = newAccessToken;
        if (newRefreshToken) {
          env.TWITTER_REFRESH_TOKEN = newRefreshToken;
        }

        logger.log('Token refreshed successfully, retrying post...');
        // Retry the post with new token
        return await postToTwitter(message, imgLink);
      } catch (refreshError: any) {
        logger.error(`Failed to refresh token: ${refreshError.message}`, refreshError);
        return {
          success: false,
          error: 'Token expired and refresh failed. Please run get-twitter-token script to get a new token.'
        };
      }
    }

    logger.error(`Failed to post to Twitter: ${error.message}`, error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred while posting to Twitter'
    };
  }
}

/**
 * Posts a message and optional image to Discord using webhook.
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

    // If image link is provided, add it as an embed
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
      return {
        success: true
      };
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
