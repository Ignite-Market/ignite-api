import { Logger } from '@nestjs/common';
import { env } from '../config/env';
import axios from 'axios';

/**
 * Sends a webhook message to slack.
 *
 * @param message Message to send.
 * @param tagChannel If present channel will be tagged.
 */
export async function sendSlackWebhook(message: string, tagChannel: boolean = false): Promise<void> {
  const payload = {
    channel: '#ignite-market-logs',
    username: 'Ignite Market Log Bot',
    text: `*[${env.APP_ENV}]*: ${message}`,
    icon_emoji: ':robot_face:'
  };

  if (tagChannel) {
    payload.text = `<!channel> ${payload.text}`;
  }

  try {
    await axios.post(env.SLACK_WEBHOOK_URL, payload);
    Logger.log('Slack webhook successfully sent.', 'slack-webhook.ts/sendSlackWebhook');
  } catch (error) {
    Logger.error('Error while sending webhook to Slack: ', error, 'slack-webhook.ts/sendSlackWebhook');
  }
}
