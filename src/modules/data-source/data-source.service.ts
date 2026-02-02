import { HttpStatus, Injectable } from '@nestjs/common';
import * as jq from 'node-jq';
import { Context } from '../../context';
import { PopulateFrom, SerializeFor, SqlModelStatus, SystemErrorCode, ValidatorErrorCode } from '../../config/types';
import { CodeException } from '../../lib/exceptions/exceptions';
import { ValidationException } from '../../lib/exceptions/exceptions';
import { DataSource } from '../prediction-set/models/data-source.model';
import { TestJqDto } from './dtos/test-jq.dto';
import { env } from '../../config/env';

@Injectable()
export class DataSourceService {
  /**
   * Create data source.
   *
   * @param dataSourceData Data source data.
   * @param context Application context.
   * @returns Created data source.
   */
  public async createDataSource(dataSource: DataSource, context: Context) {
    // Validate ABI format - should be valid JSON string
    let abiString: string;
    try {
      if (typeof dataSource.abi === 'string') {
        // Try to parse to validate it's valid JSON
        JSON.parse(dataSource.abi);
        abiString = dataSource.abi;
      } else {
        // If it's an object, stringify it
        abiString = JSON.stringify(dataSource.abi);
      }
    } catch (error) {
      throw new CodeException({
        code: ValidatorErrorCode.DATA_SOURCE_ABI_NOT_PRESENT,
        status: HttpStatus.BAD_REQUEST,
        sourceFunction: `${this.constructor.name}/createDataSource`,
        errorMessage: 'ABI must be a valid JSON string or object',
        context
      });
    }

    // Set ABI and default HTTP method
    dataSource.abi = abiString;
    if (!dataSource.httpMethod) {
      dataSource.httpMethod = 'GET';
    }

    try {
      await dataSource.validate();
      await dataSource.insert();
    } catch (error) {
      await dataSource.handle(error);
      if (!dataSource.isValid()) {
        throw new ValidationException(error, ValidatorErrorCode);
      } else {
        throw new CodeException({
          code: SystemErrorCode.SQL_SYSTEM_ERROR,
          errorCodes: SystemErrorCode,
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          sourceFunction: `${this.constructor.name}/createDataSource`,
          details: error,
          context
        });
      }
    }

    return dataSource;
  }

  /**
   * Test jq query against sample response.
   *
   * @param testData Test data with jq query and sample response.
   * @param context Application context.
   * @returns Test result.
   */
  public async testJqQuery(testData: TestJqDto, context: Context) {
    let sampleData: any;

    // If endpoint is provided, try to fetch sample data
    if (testData.endpoint) {
      try {
        const url = new URL(testData.endpoint);
        if (testData.queryParams) {
          Object.keys(testData.queryParams).forEach((key) => {
            url.searchParams.append(key, testData.queryParams[key]);
          });
        }

        const fetchOptions: RequestInit = {
          method: testData.httpMethod || 'GET',
          headers: testData.headers || { 'x-api-key': env.PROXY_API_KEY }
        };

        if (testData.body && (testData.httpMethod === 'POST' || testData.httpMethod === 'PUT' || testData.httpMethod === 'PATCH')) {
          fetchOptions.body = typeof testData.body === 'string' ? testData.body : JSON.stringify(testData.body);
          if (!fetchOptions.headers['Content-Type']) {
            fetchOptions.headers['Content-Type'] = 'application/json';
          }
        }

        const response = await fetch(url.toString(), fetchOptions);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        sampleData = await response.json();
      } catch (error) {
        return {
          success: false,
          error: `Failed to fetch data from endpoint: ${error.message}`,
          data: null
        };
      }
    } else if (testData.sampleResponse) {
      sampleData = testData.sampleResponse;
    } else {
      return {
        success: false,
        error: 'Either endpoint or sampleResponse must be provided',
        data: null
      };
    }

    // Test jq query
    try {
      const jqResult = await jq.run(testData.jqQuery, sampleData, { input: 'json' });
      return {
        success: true,
        error: null,
        data: jqResult,
        sampleData: sampleData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'JQ query execution failed',
        data: null,
        sampleData: sampleData
      };
    }
  }

  /**
   * Get data sources list.
   *
   * @param context Application context.
   * @returns Data sources list.
   */
  public async getDataSources(context: Context) {
    const rows = await context.mysql.paramExecute(
      `
        SELECT *
        FROM data_source
        WHERE status <> ${SqlModelStatus.DELETED}
        ORDER BY id DESC
      `,
      {}
    );

    return rows.map((r: any) => {
      const dataSource = new DataSource(r, context);
      return dataSource.serialize(SerializeFor.USER);
    });
  }
}
