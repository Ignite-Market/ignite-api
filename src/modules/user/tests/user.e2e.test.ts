import { setupTest, Stage } from '../../../../test/setup';
import * as request from 'supertest';
import { releaseStage } from '../../../../test/setup-context-and-sql';
import { Wallet } from 'ethers';

describe('User e2e tests', () => {
  let stage: Stage;
  let authToken: string;

  beforeAll(async () => {
    stage = await setupTest();
  });

  afterAll(async () => {
    await releaseStage(stage);
  });

  describe('Login with wallet', () => {
    it('should login with wallet', async () => {
      // Generate a random wallet
      const wallet = Wallet.createRandom();
      const message = `Login with wallet ${wallet.address}`;

      // Sign the message using the wallet's private key
      const signMessage = async (msg: string) => {
        return await wallet.signMessage(msg);
      };

      const response = await request(stage.http)
        .post('/users/wallet-login')
        .send({
          address: wallet.address,
          signature: await signMessage(message)
        });

      expect(response.status).toBe(201);
      expect(response.body.data.token).toBeDefined();
      authToken = response.body.data.token;
    });

    it('should get user profile', async () => {
      const response = await request(stage.http).get('/users/me').set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);
    });
  });
});
