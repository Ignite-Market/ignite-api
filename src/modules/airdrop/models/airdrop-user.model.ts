import { prop } from '@rawmodel/core';
import { stringParser } from '@rawmodel/parsers';
import { emailValidator, presenceValidator } from '@rawmodel/validators';
import { DbTables, PopulateFrom, SerializeFor, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { uniqueFieldValue } from '../../../lib/validators';

/**
 * Airdrop user model.
 */
export class AirdropUser extends AdvancedSQLModel {
  /**
   * Airdrop user table.
   */
  public tableName = DbTables.AIRDROP_USER;

  /**
   * Airdrop user wallet address.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.AIRDROP_USER_WALLET_ADDRESS_NOT_PRESENT
      },
      {
        resolver: uniqueFieldValue(DbTables.AIRDROP_USER, 'walletAddress'),
        code: ValidatorErrorCode.AIRDROP_USER_WALLET_ADDRESS_NOT_UNIQUE
      }
    ]
  })
  public walletAddress: string;

  /**
   * Airdrop user email.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.AIRDROP_USER_EMAIL_NOT_PRESENT
      },
      {
        resolver: emailValidator(),
        code: ValidatorErrorCode.AIRDROP_USER_EMAIL_NOT_VALID
      },
      {
        resolver: uniqueFieldValue(DbTables.AIRDROP_USER, 'email'),
        code: ValidatorErrorCode.AIRDROP_USER_EMAIL_NOT_UNIQUE
      }
    ]
  })
  public email: string;

  /**
   * Airdrop user twitter username.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB]
  })
  public twitter: string;

  /**
   * Airdrop user discord username.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB]
  })
  public discord: string;
}
