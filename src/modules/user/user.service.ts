import { HttpStatus, Injectable } from '@nestjs/common';
import { verifyMessage } from 'ethers';
import { nanoid } from 'nanoid';
import { env } from '../../config/env';
import {
  AppEnvironment,
  BadRequestErrorCode,
  DefaultUserRole,
  EmailTemplateType,
  JwtTokenType,
  SerializeFor,
  SystemErrorCode,
  UnauthorizedErrorCode,
  ValidatorErrorCode
} from '../../config/types';
import { Context } from '../../context';
import { BaseQueryFilter } from '../../lib/base-models/base-query-filter.model';
import { isTextSafe } from '../../lib/content-moderation';
import { CodeException, ModelValidationException, ValidationException } from '../../lib/exceptions/exceptions';
import { SMTPsendDefaultTemplate } from '../../lib/mailing/smtp-mailer';
import { generateJwtToken, parseJwtToken } from '../../lib/utils';
import { PredictionSet } from '../prediction-set/models/prediction-set.model';
import { RewardType } from '../reward-points/models/reward-points.model';
import { RewardPointsService } from '../reward-points/reward-points.service';
import { UserEmailDto } from './dtos/user-email.dto';
import { UserProfileDto } from './dtos/user-profile.dto';
import { WalletLoginDto } from './dtos/wallet-login.dto';
import { User, UserEmailStatus } from './models/user.model';
import { PoolConnection } from 'mysql2/promise';

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
   * Returns user by id.
   * @param id User id.
   * @param context Application context.
   * @returns User data.
   */
  public async getUserById(id: number, context: Context) {
    return (await new User({}, context).populateById(id))?.serialize(SerializeFor.USER);
  }

  /**
   * Returns users predictions.
   *
   * @param id User id.
   * @param query Query filter.
   * @param context Application context.
   * @returns User data.
   */
  public async getUserPredictions(id: number, query: BaseQueryFilter, context: Context) {
    return await new PredictionSet({}, context).getUserPredictions(id, query);
  }

  /**
   * Returns users funding positions.
   *
   * @param id User id.
   * @param query Query filter.
   * @param context Application context.
   * @returns User data.
   */
  public async getUserFundingPositions(id: number, query: BaseQueryFilter, context: Context) {
    return await new PredictionSet({}, context).getUserFundingPositions(id, query);
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
    const user = await new User({}, context).populateByWalletAddress(data.address, null, true);
    if (!user.exists()) {
      const conn = await context.mysql.start();

      user.walletAddress = data.address;
      user.username = `${data.address.slice(0, 6)}...${data.address.slice(-4)}`;
      user.referralId = nanoid(12);

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

        // Check for referrals and award them.
        if (data?.referralId) {
          const referralUser = await new User({}, context).populateByUUID(data.referralId, 'referralId', conn);
          if (referralUser.exists()) {
            await RewardPointsService.awardPoints(referralUser.id, RewardType.USER_REFERRAL, context, conn);
          }
        }

        await context.mysql.commit(conn);
      } catch (error) {
        await context.mysql.rollback(conn);
        throw error;
      }
    }

    user.login();
    return user.serialize(SerializeFor.USER);
  }

  /**
   * Updates user profile.
   * @param data Profile data.
   * @param context Application context.
   * @returns User data.
   */
  public async updateProfile(data: UserProfileDto, context: Context) {
    const user = context.user;
    user.username = data.username;

    // Check if the username is safe
    const isSafe = await isTextSafe(user.username);
    if (!isSafe) {
      throw new CodeException({
        code: BadRequestErrorCode.TEXT_CONTENT_NOT_SAFE,
        errorCodes: BadRequestErrorCode,
        status: HttpStatus.BAD_REQUEST,
        sourceFunction: `${this.constructor.name}/updateProfile`,
        context
      });
    }

    const conn = await context.mysql.start();
    try {
      await user.validate();

      await user.update(SerializeFor.UPDATE_DB, conn);
    } catch (error) {
      await user.handle(error);

      if (!user.isValid()) {
        await context.mysql.rollback(conn);
        throw new ValidationException(error, ValidatorErrorCode);
      }
    }

    try {
      if (!!data.email && user.email !== data.email) {
        const result = await this.updateEmail(new UserEmailDto({ email: data.email }), context, conn);
        user.email = result.email;
      }
    } catch (error) {
      await context.mysql.rollback(conn);
      throw error;
    }

    try {
      await context.mysql.commit(conn);
    } catch (error) {
      await context.mysql.rollback(conn);

      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCodes: SystemErrorCode,
        errorMessage: 'Failed to update user profile.',
        sourceFunction: `${this.constructor.name}/updateProfile`,
        context
      });
    }

    return user.serialize(SerializeFor.USER);
  }

  /**
   * Updates user email.
   * @param data Email data.
   * @param context Application context.
   * @param conn
   * @returns User data.
   */
  public async updateEmail(data: UserEmailDto, context: Context, conn?: PoolConnection) {
    const user = context.user;

    const existingEmail = await new User({}, context).populateByEmail(data.email, conn);
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

    try {
      await user.update(SerializeFor.UPDATE_DB, conn);

      // Send email verification email.
      await this.sendEmailVerification({ email: user.email }, context);
    } catch (error) {
      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCodes: SystemErrorCode,
        errorMessage: 'Failed to update user email.',
        sourceFunction: `${this.constructor.name}/updateEmail`,
        context
      });
    }

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

  /**
   * Sends email verification.
   * @param data Email data.
   * @param context Application context.
   * @returns Email verification token.
   */
  async sendEmailVerification(data: any, context: Context) {
    if (!data?.email) {
      throw new CodeException({
        code: ValidatorErrorCode.DEFAULT_VALIDATION_ERROR,
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errorCodes: ValidatorErrorCode
      });
    }

    const token = generateJwtToken(JwtTokenType.EMAIL_VERIFICATION, {
      email: data.email,
      id: context.user.id
    });

    await SMTPsendDefaultTemplate(context, {
      templateName: EmailTemplateType.EMAIL_VERIFICATION,
      mailAddresses: [data.email],
      subject: 'Email verification',
      templateData: {
        actionUrl: `${env.APP_URL}/confirm-email/?token=${token}`
      }
    });

    return env.APP_ENV === AppEnvironment.TEST ? { token } : {};
  }

  /**
   * Changes user email.
   * @param data Email data.
   * @param context Application context.
   * @returns User data.
   */
  async changeEmail(data: any, context: Context) {
    if (!data?.token) {
      throw new CodeException({
        code: ValidatorErrorCode.DEFAULT_VALIDATION_ERROR,
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errorCodes: ValidatorErrorCode
      });
    }

    let payload: any;
    try {
      payload = parseJwtToken(JwtTokenType.EMAIL_VERIFICATION, data.token);
    } catch (error) {
      throw new CodeException({
        code: UnauthorizedErrorCode.INVALID_TOKEN,
        status: HttpStatus.UNAUTHORIZED,
        errorCodes: UnauthorizedErrorCode,
        details: error
      });
    }

    const { id, email } = payload;
    const user = await new User({}, context).populateById(id);
    if (!user.exists()) {
      throw new CodeException({
        code: UnauthorizedErrorCode.INVALID_TOKEN,
        status: HttpStatus.UNAUTHORIZED,
        errorCodes: UnauthorizedErrorCode
      });
    }
    user.email = email;
    user.emailStatus = UserEmailStatus.VERIFIED;

    await user.validateOrThrow(ModelValidationException);
    await user.update();

    return user.serialize(SerializeFor.USER);
  }
}
