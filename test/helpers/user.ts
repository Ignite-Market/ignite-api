import { Context } from '../../src/context';
import { Wallet } from 'ethers';
import { User } from '../../src/modules/user/models/user.model';
import { DefaultUserRole } from '../../src/config/types';

/**
 * Test credentials.
 */
export interface TestCredentials {
  user: User;
  userToken: string;
  user2: User;
  user2Token: string;
  adminUser: User;
  adminUserToken: string;
}

/**
 * Creates base test users.
 * @param context Application context.
 */
export async function createBaseUsers(context: Context): Promise<TestCredentials> {
  const user = await new User(
    {
      address: Wallet.createRandom(),
      name: 'User wallet'
    },
    context
  ).insert();

  const user2 = await new User(
    {
      address: Wallet.createRandom(),
      name: 'User wallet 2'
    },
    context
  ).insert();

  const adminUser = await new User(
    {
      address: Wallet.createRandom(),
      name: 'Admin wallet'
    },
    context
  ).insert();

  await user.addRole(DefaultUserRole.USER);
  await user2.addRole(DefaultUserRole.USER);
  await adminUser.addRole(DefaultUserRole.ADMIN);

  user.login();
  user2.login();
  adminUser.login();

  return {
    user,
    userToken: user.token,
    user2,
    user2Token: user2.token,
    adminUser,
    adminUserToken: adminUser.token
  };
}
