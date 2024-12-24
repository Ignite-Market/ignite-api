import { setupTest, Stage } from '../../../../test/setup';
import * as request from 'supertest';
import { releaseStage } from '../../../../test/setup-context-and-sql';
import { HDNodeWallet, Wallet } from 'ethers';
import { DbTables } from '../../../config/types';
import { createBaseRoles } from '../../../../test/helpers/roles';
import { HttpStatus } from '@nestjs/common';
import { User } from '../models/user.model';

describe('User e2e tests', () => {
  let stage: Stage;
  let wallet: HDNodeWallet;
  let user: User;
  let userWallet: HDNodeWallet;

  beforeAll(async () => {
    stage = await setupTest();
    await createBaseRoles(stage.context);

    wallet = Wallet.createRandom();
    userWallet = Wallet.createRandom();
  });

  afterAll(async () => {
    await releaseStage(stage);
  });

  describe('Wallet login tests and user routes', () => {
    beforeEach(async () => {
      user = await new User(
        {
          walletAddress: userWallet.address
        },
        stage.context
      ).insert();
    });

    afterEach(async () => {
      await stage.db.paramExecute(`DELETE FROM \`${DbTables.USER}\``);

      user = await new User(
        {
          name: 'Existing user',
          walletAddress: userWallet.address
        },
        stage.context
      ).insert();
    });

    it('Should create new user if and log him in with wallet', async () => {
      // Get signing message.
      const messageRes = await request(stage.http).get('/users/wallet-message').expect(HttpStatus.OK);
      const message = messageRes.body.data.message;
      const timestamp = messageRes.body.data.timestamp;

      console.log(messageRes.body);

      expect(message).not.toBeNull();
      expect(timestamp).toBeLessThanOrEqual(new Date().getTime());

      // Sign the message using the wallet's private key.
      const signature = await wallet.signMessage(message);

      const response = await request(stage.http).post('/users/wallet-login').send({
        address: wallet.address,
        signature,
        timestamp
      });

      expect(response.status).toBe(201);
      expect(response.body.data.token).toBeDefined();
    });

    it('Should log in existing user with wallet', async () => {
      // Get signing message.
      const messageRes = await request(stage.http).get('/users/wallet-message').expect(HttpStatus.OK);
      const message = messageRes.body.data.message;
      const timestamp = messageRes.body.data.timestamp;

      expect(message).not.toBeNull();
      expect(timestamp).toBeLessThanOrEqual(new Date().getTime());

      // Sign the message using the wallet's private key.
      const signature = await userWallet.signMessage(message);

      const response = await request(stage.http).post('/users/wallet-login').send({
        address: userWallet.address,
        signature,
        timestamp
      });

      expect(response.status).toBe(201);
      expect(response.body.data.token).toBeDefined();
    });

    it('Should return currently logged in user profile', async () => {
      user.login();
      const authToken = user.token;

      const response = await request(stage.http).get('/users/me').set('Authorization', `Bearer ${authToken}`);

      console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body.data.walletAddress).toBe(user.walletAddress);
      expect(response.body.data.name).toBe(user.name);
      expect(response.body.data.id).toBe(user.id);
    });
  });
});
