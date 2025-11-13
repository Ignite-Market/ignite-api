import { setupTest, Stage } from '../../../../test/setup';
import { releaseStage } from '../../../../test/setup-context-and-sql';
import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { DbTables, SqlModelStatus, TimeRange } from '../../../config/types';
import { User } from '../../user/models/user.model';
import { Wallet } from 'ethers';
import { CollateralToken } from '../../collateral-token/models/collateral-token.model';
import { PredictionSet, PredictionSetStatus } from '../../prediction-set/models/prediction-set.model';
import { Outcome } from '../../prediction-set/models/outcome.model';
import { ClaimTransaction } from '../../prediction-set/models/transactions/claim-transaction.model';
import { OutcomeShareTransaction, ShareTransactionType } from '../../prediction-set/models/transactions/outcome-share-transaction.model';
import {
  PredictionSetFundingTransaction,
  FundingTransactionType
} from '../../prediction-set/models/transactions/prediction-set-funding-transaction.model';
import { RewardPointsTransaction } from '../../reward-points/models/reward-points-transaction.model';
import { RewardPoints, RewardType } from '../../reward-points/models/reward-points.model';
import { createBaseRoles } from '../../../../test/helpers/roles';

describe('Stats e2e tests', () => {
  let stage: Stage;
  let collateralToken: CollateralToken;
  let user1: User;
  let user2: User;
  let user3: User;
  let predictionSet: PredictionSet;
  let outcome1: Outcome;
  let outcome2: Outcome;

  beforeAll(async () => {
    stage = await setupTest();
    await createBaseRoles(stage.context);

    // Create collateral token
    collateralToken = await new CollateralToken(
      {
        name: 'Test Token',
        symbol: 'TEST',
        address: Wallet.createRandom().address,
        decimals: 18,
        fundingThreshold: '100000000000000000000',
        requiredVotingAmount: '1000000000000000000'
      },
      stage.context
    ).insert();

    // Create users
    user1 = await new User(
      {
        walletAddress: Wallet.createRandom().address,
        username: 'User1'
      },
      stage.context
    ).insert();

    user2 = await new User(
      {
        walletAddress: Wallet.createRandom().address,
        username: 'User2'
      },
      stage.context
    ).insert();

    user3 = await new User(
      {
        walletAddress: Wallet.createRandom().address,
        username: 'User3'
      },
      stage.context
    ).insert();

    // Create prediction set with outcomes
    predictionSet = new PredictionSet(
      {
        question: 'Test Question?',
        outcomeResolutionDef: 'Test resolution',
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
        resolutionTime: new Date(Date.now() + 172800000),
        status: PredictionSetStatus.ACTIVE,
        collateral_token_id: collateralToken.id
      },
      stage.context
    );
    await predictionSet.insert();

    outcome1 = new Outcome(
      {
        prediction_set_id: predictionSet.id,
        name: 'Yes',
        outcomeIndex: 0
      },
      stage.context
    );
    await outcome1.insert();

    outcome2 = new Outcome(
      {
        prediction_set_id: predictionSet.id,
        name: 'No',
        outcomeIndex: 1
      },
      stage.context
    );
    await outcome2.insert();
  });

  afterAll(async () => {
    await releaseStage(stage);
  });

  describe('GET /stats/leaderboard/profit', () => {
    beforeEach(async () => {
      // Clean up transactions
      await stage.db.paramExecute(`DELETE FROM \`${DbTables.CLAIM_TRANSACTION}\``);
    });

    it('Should return empty leaderboard when no transactions exist', async () => {
      const response = await request(stage.http)
        .get('/stats/leaderboard/profit')
        .query({
          collateralTokenId: collateralToken.id,
          range: TimeRange.ALL
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });

    it('Should return users sorted by total profit descending', async () => {
      // Create claim transactions with different amounts
      const claim1 = new ClaimTransaction(
        {
          user_id: user1.id,
          prediction_set_id: predictionSet.id,
          outcome_id: outcome1.id,
          amount: '100000000000000000000',
          wallet: user1.walletAddress,
          txHash: '0x123'
        },
        stage.context
      );
      await claim1.insert();

      const claim2 = new ClaimTransaction(
        {
          user_id: user1.id,
          prediction_set_id: predictionSet.id,
          outcome_id: outcome1.id,
          amount: '50000000000000000000',
          wallet: user1.walletAddress,
          txHash: '0x124'
        },
        stage.context
      );
      await claim2.insert();

      const claim3 = new ClaimTransaction(
        {
          user_id: user2.id,
          prediction_set_id: predictionSet.id,
          outcome_id: outcome1.id,
          amount: '75000000000000000000',
          wallet: user2.walletAddress,
          txHash: '0x125'
        },
        stage.context
      );
      await claim3.insert();

      const response = await request(stage.http)
        .get('/stats/leaderboard/profit')
        .query({
          collateralTokenId: collateralToken.id,
          range: TimeRange.ALL
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.total).toBe(2);
      expect(response.body.data.items.length).toBe(2);
      expect(response.body.data.items[0].username).toBe(user1.username);
      expect(response.body.data.items[0].totalProfit).toBe(150000000000000000000);
      expect(response.body.data.items[1].username).toBe(user2.username);
      expect(response.body.data.items[1].totalProfit).toBe(75000000000000000000);
    });

    it('Should filter by time range', async () => {
      // Set createTime manually for old transaction
      await stage.db.paramExecute(
        `INSERT INTO \`${DbTables.CLAIM_TRANSACTION}\` 
        (user_id, prediction_set_id, outcome_id, amount, wallet, txHash, createTime, status)
        VALUES (@user_id, @prediction_set_id, @outcome_id, @amount, @wallet, @txHash, SUBDATE(NOW(), INTERVAL 2 DAY), @status)`,
        {
          user_id: user1.id,
          prediction_set_id: predictionSet.id,
          outcome_id: outcome1.id,
          amount: '100000000000000000000',
          wallet: user1.walletAddress,
          txHash: '0x126',
          status: SqlModelStatus.ACTIVE
        }
      );

      // Create recent transaction
      const claim2 = new ClaimTransaction(
        {
          user_id: user2.id,
          prediction_set_id: predictionSet.id,
          outcome_id: outcome1.id,
          amount: '50000000000000000000',
          wallet: user2.walletAddress,
          txHash: '0x127'
        },
        stage.context
      );
      await claim2.insert();

      // Test ONE_DAY range - should only include recent transaction
      const response = await request(stage.http)
        .get('/stats/leaderboard/profit')
        .query({
          collateralTokenId: collateralToken.id,
          range: TimeRange.ONE_DAY
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.total).toBe(1);
      expect(response.body.data.items[0].username).toBe(user2.username);
    });
  });

  describe('GET /stats/leaderboard/volume', () => {
    beforeEach(async () => {
      // Clean up transactions
      await stage.db.paramExecute(`DELETE FROM \`${DbTables.OUTCOME_SHARE_TRANSACTION}\``);
      await stage.db.paramExecute(`DELETE FROM \`${DbTables.PREDICTION_SET_FUNDING_TRANSACTION}\``);
    });

    it('Should return empty leaderboard when no transactions exist', async () => {
      const response = await request(stage.http)
        .get('/stats/leaderboard/volume')
        .query({
          collateralTokenId: collateralToken.id,
          range: TimeRange.ALL
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });

    it('Should return users sorted by total volume (buy transactions)', async () => {
      const buy1 = new OutcomeShareTransaction(
        {
          user_id: user1.id,
          prediction_set_id: predictionSet.id,
          outcome_id: outcome1.id,
          amount: '100000000000000000000',
          wallet: user1.walletAddress,
          txHash: '0x200',
          type: ShareTransactionType.BUY
        },
        stage.context
      );
      await buy1.insert();

      const buy2 = new OutcomeShareTransaction(
        {
          user_id: user2.id,
          prediction_set_id: predictionSet.id,
          outcome_id: outcome1.id,
          amount: '50000000000000000000',
          wallet: user2.walletAddress,
          txHash: '0x201',
          type: ShareTransactionType.BUY
        },
        stage.context
      );
      await buy2.insert();

      const response = await request(stage.http)
        .get('/stats/leaderboard/volume')
        .query({
          collateralTokenId: collateralToken.id,
          range: TimeRange.ALL
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.total).toBe(2);
      expect(response.body.data.items[0].username).toBe(user1.username);
      expect(response.body.data.items[0].totalVolume).toBe(100000000000000000000);
      expect(response.body.data.items[1].username).toBe(user2.username);
      expect(response.body.data.items[1].totalVolume).toBe(50000000000000000000);
    });

    it('Should include funding transactions in volume calculation', async () => {
      const buy1 = new OutcomeShareTransaction(
        {
          user_id: user1.id,
          prediction_set_id: predictionSet.id,
          outcome_id: outcome1.id,
          amount: '100000000000000000000',
          wallet: user1.walletAddress,
          txHash: '0x202',
          type: ShareTransactionType.BUY
        },
        stage.context
      );
      await buy1.insert();

      const funding1 = new PredictionSetFundingTransaction(
        {
          user_id: user1.id,
          prediction_set_id: predictionSet.id,
          collateralAmount: '50000000000000000000',
          type: FundingTransactionType.ADDED
        },
        stage.context
      );
      await funding1.insert();

      const response = await request(stage.http)
        .get('/stats/leaderboard/volume')
        .query({
          collateralTokenId: collateralToken.id,
          range: TimeRange.ALL
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.total).toBe(1);
      expect(response.body.data.items[0].username).toBe(user1.username);
      // Total should be sum of buy (100) + funding (50) = 150
      expect(response.body.data.items[0].totalVolume).toBe(150000000000000000000);
    });
  });

  describe('GET /stats/leaderboard/points', () => {
    let rewardPoint1: RewardPoints;
    let rewardPoint2: RewardPoints;
    let rewardPoint3: RewardPoints;
    let rewardPoint4: RewardPoints;

    beforeEach(async () => {
      // Clean up reward points transactions and reward points
      await stage.db.paramExecute(`DELETE FROM \`${DbTables.REWARD_POINTS_TRANSACTION}\``);
      await stage.db.paramExecute(`DELETE FROM \`${DbTables.REWARD_POINTS}\``);

      // Create reward points records for testing
      rewardPoint1 = await new RewardPoints(
        {
          name: 'Market Funding',
          description: 'Points for market funding',
          reason: 'Funding a market',
          type: RewardType.MARKET_FUNDING,
          value: 10
        },
        stage.context
      ).insert();

      rewardPoint2 = await new RewardPoints(
        {
          name: 'Buying Shares',
          description: 'Points for buying shares',
          reason: 'Buying shares',
          type: RewardType.BUYING_SHARES,
          value: 5
        },
        stage.context
      ).insert();

      rewardPoint3 = await new RewardPoints(
        {
          name: 'Market Winner',
          description: 'Points for winning market',
          reason: 'Winning a market',
          type: RewardType.MARKET_WINNER,
          value: 20
        },
        stage.context
      ).insert();

      rewardPoint4 = await new RewardPoints(
        {
          name: 'Daily Login',
          description: 'Points for daily login',
          reason: 'Daily login bonus',
          type: RewardType.DAILY_LOGIN,
          value: 5
        },
        stage.context
      ).insert();
    });

    it('Should return empty leaderboard when no reward points exist', async () => {
      const response = await request(stage.http)
        .get('/stats/leaderboard/points')
        .query({
          collateralTokenId: collateralToken.id,
          range: TimeRange.ALL
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });

    it('Should return users sorted by total reward points descending', async () => {
      // Create reward points transactions
      const rpt1 = new RewardPointsTransaction(
        {
          user_id: user1.id,
          reward_points_id: rewardPoint1.id,
          value: 1000,
          type: RewardType.MARKET_FUNDING
        },
        stage.context
      );
      await rpt1.insert();

      const rpt2 = new RewardPointsTransaction(
        {
          user_id: user1.id,
          reward_points_id: rewardPoint2.id,
          value: 500,
          type: RewardType.BUYING_SHARES
        },
        stage.context
      );
      await rpt2.insert();

      const rpt3 = new RewardPointsTransaction(
        {
          user_id: user2.id,
          reward_points_id: rewardPoint3.id,
          value: 750,
          type: RewardType.MARKET_WINNER
        },
        stage.context
      );
      await rpt3.insert();

      const rpt4 = new RewardPointsTransaction(
        {
          user_id: user3.id,
          reward_points_id: rewardPoint4.id,
          value: 200,
          type: RewardType.DAILY_LOGIN
        },
        stage.context
      );
      await rpt4.insert();

      const response = await request(stage.http)
        .get('/stats/leaderboard/points')
        .query({
          collateralTokenId: collateralToken.id,
          range: TimeRange.ALL
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.total).toBe(3);
      expect(response.body.data.items.length).toBe(3);
      expect(response.body.data.items[0].username).toBe(user1.username);
      expect(response.body.data.items[0].totalRewardPoints).toBe(1500);
      expect(response.body.data.items[1].username).toBe(user2.username);
      expect(response.body.data.items[1].totalRewardPoints).toBe(750);
      expect(response.body.data.items[2].username).toBe(user3.username);
      expect(response.body.data.items[2].totalRewardPoints).toBe(200);
    });

    it('Should filter by time range', async () => {
      // Set createTime manually for old transaction
      await stage.db.paramExecute(
        `INSERT INTO \`${DbTables.REWARD_POINTS_TRANSACTION}\`
        (user_id, reward_points_id, value, type, createTime, status)
        VALUES (@user_id, @reward_points_id, @value, @type, SUBDATE(NOW(), INTERVAL 2 DAY), @status)`,
        {
          user_id: user1.id,
          reward_points_id: rewardPoint1.id,
          value: 1000,
          type: RewardType.MARKET_FUNDING,
          status: SqlModelStatus.ACTIVE
        }
      );

      // Create recent transaction
      const rpt2 = new RewardPointsTransaction(
        {
          user_id: user2.id,
          reward_points_id: rewardPoint2.id,
          value: 500,
          type: RewardType.BUYING_SHARES
        },
        stage.context
      );
      await rpt2.insert();

      // Test ONE_DAY range - should only include recent transaction
      const response = await request(stage.http)
        .get('/stats/leaderboard/points')
        .query({
          collateralTokenId: collateralToken.id,
          range: TimeRange.ONE_DAY
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.total).toBe(1);
      expect(response.body.data.items[0].username).toBe(user2.username);
      expect(response.body.data.items[0].totalRewardPoints).toBe(500);
    });

    it('Should exclude deleted transactions', async () => {
      const rpt1 = new RewardPointsTransaction(
        {
          user_id: user1.id,
          reward_points_id: rewardPoint1.id,
          value: 1000,
          type: RewardType.MARKET_FUNDING
        },
        stage.context
      );
      await rpt1.insert();

      // Create a deleted transaction
      const rpt2 = new RewardPointsTransaction(
        {
          user_id: user1.id,
          reward_points_id: rewardPoint2.id,
          value: 500,
          type: RewardType.BUYING_SHARES,
          status: SqlModelStatus.DELETED
        },
        stage.context
      );
      await rpt2.insert();

      const response = await request(stage.http)
        .get('/stats/leaderboard/points')
        .query({
          collateralTokenId: collateralToken.id,
          range: TimeRange.ALL
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.total).toBe(1);
      expect(response.body.data.items[0].username).toBe(user1.username);
      expect(response.body.data.items[0].totalRewardPoints).toBe(1000);
    });

    it('Should support different reward types', async () => {
      // Create additional reward points for all types
      const rewardPointsMap = new Map<RewardType, RewardPoints>();

      const types = [
        RewardType.MARKET_FUNDING,
        RewardType.BUYING_SHARES,
        RewardType.SELLING_SHARES,
        RewardType.MARKET_WINNER,
        RewardType.PROPOSAL_WINNER,
        RewardType.PROPOSAL_VOTE,
        RewardType.USER_REFERRAL,
        RewardType.DAILY_LOGIN
      ];

      for (const type of types) {
        if (!rewardPointsMap.has(type)) {
          const rp = await new RewardPoints(
            {
              name: `Reward ${type}`,
              description: `Description ${type}`,
              reason: `Reason ${type}`,
              type: type,
              value: 10
            },
            stage.context
          ).insert();
          rewardPointsMap.set(type, rp);
        }
      }

      for (let i = 0; i < types.length; i++) {
        const rp = rewardPointsMap.get(types[i]);
        const rpt = new RewardPointsTransaction(
          {
            user_id: user1.id,
            reward_points_id: rp.id,
            value: 100 * (i + 1),
            type: types[i]
          },
          stage.context
        );
        await rpt.insert();
      }

      const response = await request(stage.http)
        .get('/stats/leaderboard/points')
        .query({
          collateralTokenId: collateralToken.id,
          range: TimeRange.ALL
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.total).toBe(1);
      expect(response.body.data.items[0].totalRewardPoints).toBe(3600); // Sum of 100+200+300+400+500+600+700+800
    });
  });
});
