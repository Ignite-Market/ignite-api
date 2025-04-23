import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { PopulateFrom, TimeRange, ValidatorErrorCode } from '../../../config/types';
import { ModelBase } from '../../../lib/base-models/base';
import { enumInclusionValidator } from '../../../lib/validators';

/**
 * Query filter for retrieving prediction set chance history.
 */
export class PredictionSetChanceHistoryQueryFilter extends ModelBase {
  /**
   * Filter by time range.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: enumInclusionValidator(TimeRange, false),
        code: ValidatorErrorCode.PREDICTION_SET_CHANCE_HISTORY_RANGE_NOT_VALID
      }
    ]
  })
  public range: string;

  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER]
  })
  public interval: number;
}
