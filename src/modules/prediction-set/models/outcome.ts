import { prop } from '@rawmodel/core';
import { floatParser, integerParser, stringParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor, ValidatorErrorCode } from '../../../config/types';
import type { Context } from '../../../context';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { presenceValidator } from '@rawmodel/validators';

/**
 * Prediction set outcome.
 */
export class Outcome extends AdvancedSQLModel {
  /**
   * Prediction set's outcome table.
   */
  public tableName = DbTables.OUTCOME;

  /**
   * Prediction set ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public prediction_set_id: number;

  /**
   * Outcome name.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.OUTCOME_NAME_NOT_PRESENT
      }
    ]
  })
  name: string;

  /**
   * Outcome pool.
   */
  @prop({
    parser: {
      resolver: floatParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER]
  })
  pool: number;

  /**
   * Prediction set model constructor.
   * @param data Prediction set data.
   * @param context Application context.
   */
  public constructor(data: any, context?: Context) {
    super(data, context);
  }
}
