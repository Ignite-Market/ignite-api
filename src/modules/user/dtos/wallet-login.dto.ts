import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { presenceValidator } from '@rawmodel/validators';
import { PopulateFrom, ValidatorErrorCode } from '../../../config/types';
import { ModelBase } from '../../../lib/base-models/base';

export class WalletLoginDto extends ModelBase {
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.WALLET_LOGIN_DTO_ADDRESS_NOT_PRESENT
      }
    ]
  })
  public address: string;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.WALLET_LOGIN_DTO_SIGNATURE_NOT_PRESENT
      }
    ]
  })
  public signature: string;

  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.WALLET_LOGIN_DTO_TIMESTAMP_NOT_PRESENT
      }
    ]
  })
  public timestamp: number;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER],
    validators: []
  })
  public referralId: string;
}
