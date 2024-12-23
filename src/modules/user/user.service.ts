import { Injectable } from '@nestjs/common';
import { verifyMessage } from 'ethers';
import { SerializeFor, UnauthorizedErrorCode, ValidatorErrorCode } from '../../config/types';
import { Context } from '../../context';
import { CodeException, ValidationException } from '../../lib/exceptions/exceptions';
import { User } from './models/user.model';

@Injectable()
export class UserService {
  async getUserProfile(ctx: Context) {
    return ctx.user?.serialize(SerializeFor.USER);
  }

  async loginWithWallet(data: any, ctx: Context) {
    if (!data?.address || !data?.signature) {
      throw new CodeException({
        code: ValidatorErrorCode.DEFAULT_VALIDATION_ERROR,
        status: 422,
        errorCodes: ValidatorErrorCode
      });
    }

    // Verify wallet signature
    const message = `Login with wallet ${data.address}`;
    const isValidSignature = this.verifyWalletSignature(message, data.signature, data.address);

    if (!isValidSignature) {
      throw new CodeException({
        code: UnauthorizedErrorCode.INVALID_SIGNATURE,
        status: 401,
        errorCodes: UnauthorizedErrorCode
      });
    }

    // Find or create user by wallet address
    const user = await new User({}, ctx).populateByWalletAddress(data.address);

    if (!user.exists()) {
      user.walletAddress = data.address;
      user.name = `Wallet ${data.address.slice(0, 6)}...${data.address.slice(-4)}`;

      try {
        await user.validate();
      } catch (err) {
        await user.handle(err);
        if (!user.isValid()) {
          throw new ValidationException(err, ValidatorErrorCode);
        }
      }
      await user.insert();
    }

    user.login();

    return user.serialize(SerializeFor.USER);
  }

  private verifyWalletSignature(message: string, signature: string, address: string): boolean {
    try {
      const recoveredAddress = verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }
}
