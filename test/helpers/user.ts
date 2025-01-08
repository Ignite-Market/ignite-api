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

  const adminUser = await new User(
    {
      address: Wallet.createRandom(),
      name: 'Admin wallet'
    },
    context
  ).insert();

  await user.addRole(DefaultUserRole.USER);
  await adminUser.addRole(DefaultUserRole.ADMIN);

  user.login();
  adminUser.login();

  return {
    user,
    userToken: user.token,
    adminUser,
    adminUserToken: adminUser.token
  };
}
