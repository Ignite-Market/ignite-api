import { prop } from '@rawmodel/core';
import { integerParser } from '@rawmodel/parsers';
import { arrayLengthValidator, presenceValidator } from '@rawmodel/validators';
import { PopulateFrom, ValidatorErrorCode } from '../../../config/types';
import { PredictionSet } from '../models/prediction-set.model';
import { Outcome } from '../models/outcome.model';

export class PredictionSetDto extends PredictionSet {
  @prop({
    parser: { resolver: integerParser(), array: true },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_DTO_DATA_SOURCE_IDS_NOT_PRESENT
      },
      {
        resolver: arrayLengthValidator({ minOrEqual: 3 }),
        code: ValidatorErrorCode.PREDICTION_SET_DTO_DATA_SOURCE_IDS_NOT_VALID
      }
    ]
  })
  public dataSourceIds: number[];

  @prop({
    parser: { resolver: Outcome, array: true },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_DTO_PREDICTION_OUTCOMES_NOT_PRESENT
      },
      {
        resolver: arrayLengthValidator({ minOrEqual: 2 }),
        code: ValidatorErrorCode.PREDICTION_SET_DTO_PREDICTION_OUTCOMES_NOT_VALID
      }
    ]
  })
  public predictionOutcomes: Outcome[];
}
