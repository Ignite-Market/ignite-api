import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { PopulateFrom, ValidatorErrorCode } from '../../../config/types';
import { ModelBase } from '../../../lib/base-models/base';
import { enumInclusionValidator } from '../../../lib/validators';

export enum PredictionSetChanceHistoryRange {
  ONE_DAY = '1D',
  ONE_WEEK = '1W',
  ONE_MONTH = '1M',
  ALL = 'ALL'
}

export class PredictionSetChanceHistoryQueryFilter extends ModelBase {
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: enumInclusionValidator(PredictionSetChanceHistoryRange, false),
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
