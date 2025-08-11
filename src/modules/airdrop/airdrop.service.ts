import { HttpStatus, Injectable } from '@nestjs/common';
import { Context } from '../../context';
import { CodeException, ValidationException } from '../../lib/exceptions/exceptions';
import { AWS_S3 } from '../../lib/aws/aws-s3';
import { env } from '../../config/env';
import { SerializeFor, ValidatorErrorCode } from '../../config/types';
import { AirdropUser } from './models/airdrop-user.model';

@Injectable()
export class AirdropService {
  /**
   * Get prediction set proposal round by ID.
   *
   * @param id Prediction set proposal round ID.
   * @param context Application context.
   * @returns prediction set proposal.
   */
  public async joinAirdrop(data: AirdropUser, context: Context) {
    const airdropUser = new AirdropUser(null, context).populate(data);

    try {
      await airdropUser.validate();
    } catch (error) {
      await airdropUser.handle(error);

      if (!airdropUser.isValid()) {
        throw new ValidationException(error, ValidatorErrorCode);
      }
    }

    await airdropUser.insert(SerializeFor.INSERT_DB);
    return true;
  }
}
