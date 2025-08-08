import { HttpStatus, Injectable } from '@nestjs/common';
import { Context } from '../../context';
import { CodeException } from '../../lib/exceptions/exceptions';
import { AWS_S3 } from '../../lib/aws/aws-s3';
import { env } from '../../config/env';
import { ValidatorErrorCode } from '../../config/types';

@Injectable()
export class FileService {
  /**
   * Get prediction set proposal round by ID.
   *
   * @param id Prediction set proposal round ID.
   * @param context Application context.
   * @returns prediction set proposal.
   */
  public async generateUploadUrl(data: any, context: Context) {
    let fileName = data?.fileName;
    if (!fileName) {
      throw new CodeException({
        code: ValidatorErrorCode.FILE_NAME_NOT_PRESENT,
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errorCodes: ValidatorErrorCode,
        sourceFunction: `${this.constructor.name}/generateUploadUrl`,
        context
      });
    }

    const s3 = new AWS_S3();

    const uploadPath = `upload/${fileName}`;

    const uploadUrl = await s3.generateSignedUploadURL(env.IMAGE_BUCKET, uploadPath);
    return { uploadUrl };
  }
}
