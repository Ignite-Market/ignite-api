import { Model, prop } from '@rawmodel/core';

import { ModelValidationException } from '../exceptions/exceptions';
import { Context } from '../../context';

/**
 * Common model related objects.
 */
export { prop };

/**
 * Base model.
 */
export abstract class ModelBase extends Model<any> {
  /**
   * Class constructor.
   * @param data Input data.
   * @param config Model configuration.
   */
  public constructor(data?: unknown, context?: Context) {
    super(data, { context });
  }

  public async handle(error: any, { quiet }: { quiet: boolean } = { quiet: false }): Promise<this> {
    try {
      await super.handle(error, { quiet });
      if (!quiet) {
        console.error(error);
        console.error(this.collectErrors());
      }
    } catch (e) {
    } finally {
      return this;
    }
  }

  public populateByStrategies(data, strategies: string[]) {
    for (const strategy of strategies) {
      this.populate(data, strategy);
    }
  }

  /**
   * Validate a model and throw an error if it is invalid
   * @param {new (
   *       model: Model,
   *       errorCodes?: any,
   *     ) => ModelValidationException} validationException
   * @param {?object} [errorCodes]
   * @returns {Promise<this>}
   */
  public async validateOrThrow(
    validationException: new (model: Model, errorCodes?: any) => ModelValidationException,
    errorCodes?: object
  ): Promise<this> {
    try {
      return await this.validate();
    } catch (err) {
      await this.handle(err);
      if (!this.isValid()) {
        throw new validationException(this, errorCodes);
      }
    }
  }
}
