import { DbTables, SqlModelStatus } from '../../config/types';
import { RewardType } from '../../modules/reward-points/models/reward-points.model';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  const rewards = [
    {
      name: 'Market Funding',
      description: '#POINTS points per $100 funded (in a single transaction)',
      reason: 'Increases liquidity and market reliability.',
      type: RewardType.MARKET_FUNDING,
      value: 10
    },
    {
      name: 'Buying Shares',
      description: '#POINTS points per $10 traded (in a single transaction)',
      reason: 'Boosts market volume and trading activity.',
      type: RewardType.BUYING_SHARES,
      value: 5
    },
    {
      name: 'Selling Shares',
      description: '#POINTS points per $10 traded (in a single transaction)',
      reason: 'Maintains liquidity and active participation.',
      type: RewardType.SELLING_SHARES,
      value: 4
    },
    {
      name: 'Market Winner',
      description: '#POINTS points if holding winning shares',
      reason: 'Rewards correct predictions and staying engaged.',
      type: RewardType.MARKET_WINNER,
      value: 50
    },
    {
      name: 'Proposal Winner',
      description: '#POINTS points per accepted suggestion',
      reason: 'Encourages creation of diverse and interesting markets.',
      type: RewardType.PROPOSAL_WINNER,
      value: 100
    },
    {
      name: 'Proposal Vote',
      description: '#POINTS points per vote',
      reason: 'Reduces overemphasis on voting while still valuing input.',
      type: RewardType.PROPOSAL_VOTE,
      value: 1
    },
    {
      name: 'User Referral',
      description: '#POINTS points per referral',
      reason: 'Boosts user base and long-term engagement.',
      type: RewardType.USER_REFERRAL,
      value: 50
    },
    {
      name: 'Daily Login',
      description: '#POINTS points per day',
      reason: 'Maintains consistent engagement.',
      type: RewardType.DAILY_LOGIN,
      value: 5
    }
  ];

  for (const reward of rewards) {
    await queryFn(
      `
      INSERT INTO \`${DbTables.REWARD_POINTS}\` (
        \`name\`,
        \`description\`,
        \`reason\`,
        \`type\`,
        \`value\`,
        \`status\`
      ) VALUES (?, ?, ?, ?, ?, ?);
    `,
      [reward.name, reward.description, reward.reason, reward.type, reward.value, SqlModelStatus.ACTIVE]
    );
  }
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`DELETE FROM \`${DbTables.REWARD_POINTS}\``);
}
