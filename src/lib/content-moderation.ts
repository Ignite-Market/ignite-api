import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { env } from '../config/env';

/**
 * Checks if the content is safe.
 * @param content The content to check.
 * @returns True if the content is safe, false otherwise.
 */
export async function isTextSafe(content: string) {
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });

  try {
    const moderation = await openai.moderations.create({
      model: 'text-moderation-latest',
      input: content
    });

    return !moderation.results[0].flagged;
  } catch (error) {
    // If there is an error, we trust that the content is safe.
    Logger.error('Error moderating content:', error, 'content-moderation.ts/isTextSafe');

    return true;
  }
}
