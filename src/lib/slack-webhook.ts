import { Logger } from '@nestjs/common';
import { env } from '../config/env';
import axios from 'axios';

/**
 * Slack channel list.
 */
export enum ChannelList {
  LOGS = '#ignite-market-logs',
  VOTING = '#ignite-market-voting',
  INDEXER = '#ignite-market-indexer'
}

/**
 * Sends a webhook message to slack.
 *
 * @param message Message to send.
 * @param tagChannel If present channel will be tagged.
 */
export async function sendSlackWebhook(message: string, tagChannel: boolean = false, channel: ChannelList = ChannelList.LOGS): Promise<void> {
  const payload = {
    channel,
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
