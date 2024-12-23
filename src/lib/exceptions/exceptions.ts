import { Model } from '@rawmodel/core';
import { BadRequestErrorCode, LogType, SystemErrorCode, ValidatorErrorCode } from '../../config/types';
import { writeLog } from '../logger';
import { HttpException } from './http-exception';

export interface ErrorOptions {
  code: any;
  status: number;
  context?: any;
  errorMessage?: string;
  sourceFunction?: string;
  details?: any;
  errorCodes?: any;
  sourceModule?: string;
}

export interface IValidationError {
  code: number | string;
  property: string;
  message?: string;
}

export class CodeException extends HttpException {
  statusCode: SystemErrorCode | BadRequestErrorCode | any;
  options: ErrorOptions;

  constructor(options: ErrorOptions) {
    super(
      {
        statusCode: options.code,
        message: options.errorCodes ? options.errorCodes[options.code] : options.errorMessage
      },
      options.status
    );
    this.options = options;

    writeLog(
      LogType.MSG,
      `(user: ${
        options.context && options.context.user ? `${options.context.user.id} ${options.context.user.email}` : 'NA'
      }) ${options.errorMessage || ''}, Details: ${options.details ? JSON.stringify(options.details) : 'NA'}`,
      options.code.toString(),
      options.sourceFunction || '',
      this
    );
  }
}

/**
 * Model validation error.
 */
export class ValidationException extends HttpException {
  errors: IValidationError[];

  public constructor(errors: IValidationError | IValidationError[], errorCodes?: { [key: number]: string }) {
    const errorsArray = Array.isArray(errors) ? errors : [errors];
    const errorsWithMessages = errorsArray.map((error) => ({
      ...error,
      message: errorCodes && !error.message ? { ...ValidatorErrorCode, ...errorCodes }[error.code]?.toString() : error.message
    }));
    super(
      {
        code: 422,
        errors: errorsWithMessages,
        message: 'Validation error' // workaround for errors in production
      },
      422
    );

    this.errors = errorsWithMessages;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ModelValidationException extends ValidationException {
  modelName: string;

  /**
   * Class constructor.
   * @param model Model instance.
   * @param errorCodes Validator error codes from service, which initializes this class
   */
  public constructor(model: Model, errorCodes?: { [key: number]: string }) {
    const validationErrors = model.collectErrors().map(
      (x) =>
        ({
          code: x.code,
          property: x.path[0]
        }) as IValidationError
    );

    super(validationErrors, errorCodes);

    this.modelName = model.constructor.name;
  }
}
