import { HttpStatus, Injectable } from '@nestjs/common';
import { verifyMessage } from 'ethers';
import { DefaultUserRole, SerializeFor, UnauthorizedErrorCode, ValidatorErrorCode } from '../../config/types';
import { Context } from '../../context';
import { CodeException, ValidationException } from '../../lib/exceptions/exceptions';
import { User, UserEmailStatus } from './models/user.model';
import { WalletLoginDto } from './dtos/wallet-login.dto';
import { UserProfileDto } from './dtos/user-profile.dto';
import { UserEmailDto } from './dtos/user-email.dto';

@Injectable()
export class UserService {
  /**
   * Returns currently logged in user profile.
   * @param context Application context.
   * @returns User data.
   */
  public async getUserProfile(context: Context) {
    return context.user?.serialize(SerializeFor.USER);
  }

  /**
   * Returns wallet authentication message.
   * @param timestamp Message timestamp.
   * @returns Wallet authentication message.
   */
  public getWalletAuthMessage(timestamp: number = new Date().getTime()) {
    return {
      message: `Please sign this message.\n${timestamp}`,
      timestamp
    };
  }

  /**
   * Logins user with wallet.
   * @param data Wallet data.
   * @param context Application context.
   * @returns User data.
   */
  public async loginWithWallet(data: WalletLoginDto, context: Context) {
    // 1 hour validity.
    if (new Date().getTime() - data.timestamp > 60 * 60 * 1000) {
      throw new CodeException({
        status: HttpStatus.UNAUTHORIZED,
        code: UnauthorizedErrorCode.INVALID_SIGNATURE,
        errorCodes: UnauthorizedErrorCode,
        sourceFunction: `${this.constructor.name}/loginWithWallet`,
        context
      });
    }

    const { message } = this.getWalletAuthMessage(data.timestamp);
    const isValidSignature = this.verifyWalletSignature(message, data.signature, data.address);

    if (!isValidSignature) {
      throw new CodeException({
        status: HttpStatus.UNAUTHORIZED,
        code: UnauthorizedErrorCode.INVALID_SIGNATURE,
        errorCodes: UnauthorizedErrorCode,
        sourceFunction: `${this.constructor.name}/loginWithWallet`,
        context
      });
    }

    // Find or create user by wallet address.
    const user = await new User({}, context).populateByWalletAddress(data.address);
    if (!user.exists()) {
      const conn = await context.mysql.start();

      user.walletAddress = data.address;
      user.username = `${data.address.slice(0, 6)}...${data.address.slice(-4)}`;
      try {
        await user.validate();
      } catch (error) {
        await user.handle(error);

        if (!user.isValid()) {
          throw new ValidationException(error, ValidatorErrorCode);
        }
      }

      try {
        await user.insert(SerializeFor.INSERT_DB, conn);
        await user.addRole(DefaultUserRole.USER, conn);

        await context.mysql.commit(conn);
      } catch (error) {
        await context.mysql.rollback(conn);
        throw error;
      }
    }

    user.login();
    return user.serialize(SerializeFor.USER);
  }

  public async updateProfile(data: UserProfileDto, context: Context) {
    const user = context.user;
    user.username = data.username;
    try {
      await user.validate();
    } catch (error) {
      await user.handle(error);

      if (!user.isValid()) {
        throw new ValidationException(error, ValidatorErrorCode);
      }
    }
    await user.update(SerializeFor.UPDATE_DB);
    return user.serialize(SerializeFor.USER);
  }

  public async updateEmail(data: UserEmailDto, context: Context) {
    const user = context.user;
    const existingEmail = await new User({}).populateByEmail(data.email);

    if (existingEmail.exists()) {
      if (existingEmail.id !== user.id) {
        throw new CodeException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          code: ValidatorErrorCode.USER_EMAIL_ALREADY_TAKEN,
          errorCodes: ValidatorErrorCode,
          errorMessage: `Email already taken.`,
          sourceFunction: `${this.constructor.name}/updateEmail`,
          context
        });
      } else {
        return { user: existingEmail };
      }
    }

    user.email = data.email;
    user.emailStatus = UserEmailStatus.PENDING;
    try {
      await user.validate();
    } catch (error) {
      await user.handle(error);

      if (!user.isValid()) {
        throw new ValidationException(error, ValidatorErrorCode);
      }
    }
    await user.update(SerializeFor.UPDATE_DB);
    // TODO: Send email verification email.
    return user.serialize(SerializeFor.USER);
  }

  /**
   * Verifies wallet signature.
   * @param message Message to sign.
   * @param signature Wallet signature.
   * @param address Wallet address.
   * @returns Verification result.
   */
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
