import 'reflect-metadata';

/**
 * Default delimiter.
 */
export const CONSTANT_ARRAY_DEFAULT_DELIMITER = ';;;';

/**
 * Constant array definition.
 */
export interface IConstantArrayOptions {
  delimiter?: string;
}

/**
 * Constant array definition.
 */
export const CONSTANT_ARRAY_OPTIONS_KEY = 'constant_array_options';

/**
 * Constant array decorator - array is saved to the database as a constant.
 * Nest reflection and metadata abilities are used.
 * https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata
 *
 * @param options Validation options
 */
export const ConstantArray = (options: IConstantArrayOptions = {}) => {
  // Comma delimiter is not allowed, since ot is used by the SQL lib.
  if (!options.delimiter || options.delimiter === ',') {
    options.delimiter = CONSTANT_ARRAY_DEFAULT_DELIMITER;
  }
  return Reflect.metadata(CONSTANT_ARRAY_OPTIONS_KEY, options);
};
