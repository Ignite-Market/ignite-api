import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { PopulateFrom, ValidatorErrorCode } from '../../../config/types';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';
import { presenceValidator } from '@rawmodel/validators';
export class GenerateSuggestionsDto extends BaseQueryFilter {
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.GENERATE_SUGGESTIONS_PROMPT_NOT_PRESENT
      }
    ]
  })
  public prompt: string;
}
