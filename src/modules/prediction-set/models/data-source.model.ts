import { prop } from '@rawmodel/core';
import { stringParser } from '@rawmodel/parsers';
import { presenceValidator } from '@rawmodel/validators';
import { DbTables, PopulateFrom, SerializeFor, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { JSONParser } from '../../../lib/parsers';

/**
 * Prediction set data source.
 */
export class DataSource extends AdvancedSQLModel {
  /**
   * Data source's table.
   */
  public tableName = DbTables.DATA_SOURCE;

  /**
   * API endpoint - Data source endpoint.
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
        code: ValidatorErrorCode.DATA_SOURCE_ENDPOINT_NOT_PRESENT
      }
    ]
  })
  endpoint: string;

  /**
   * JQ query - JQ query to extract data from the API response.
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
        code: ValidatorErrorCode.DATA_SOURCE_JQ_QUERY_NOT_PRESENT
      }
    ]
  })
  jqQuery: string;

  /**
   * Data point ABI.
   */
  @prop({
    parser: {
      resolver: JSONParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.DATA_SOURCE_ABI_NOT_PRESENT
      }
    ]
  })
  abi: any;

  /**
   * HTTP method for the API request.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER]
  })
  httpMethod: string;

  /**
   * Body for the API request.
   */
  @prop({
    parser: {
      resolver: JSONParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER]
  })
  body: any;

  /**
   * Headers for the API request.
   */
  @prop({
    parser: {
      resolver: JSONParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER]
  })
  headers: any;

  /**
   * Query parameters for the API request.
   */
  @prop({
    parser: {
      resolver: JSONParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER]
  })
  queryParams: any;
}
