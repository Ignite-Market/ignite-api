import { prop } from '@rawmodel/core';
import { booleanParser, dateParser, integerParser, stringParser } from '@rawmodel/parsers';
import { isPresent } from '@rawmodel/utils';
import { presenceValidator } from '@rawmodel/validators';
import { PoolConnection } from 'mysql2/promise';
import { DbTables, ErrorCode, PopulateFrom, SerializeFor, SqlModelStatus, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { getQueryParams, selectAndCountQuery, unionSelectAndCountQuery } from '../../../lib/database/sql-utils';
import { enumInclusionValidator } from '../../../lib/validators';
import { PredictionSetQueryFilter } from '../dtos/prediction-set-query-filter';
import { DataSource } from './data-source.model';
import { Outcome } from './outcome.model';
import { PredictionSetChainData } from './prediction-set-chain-data.model';
import { PredictionSetChanceHistoryQueryFilter } from '../dtos/prediciton-set-chance-history-query-filter';
import { dateToSqlString } from '../../../lib/utils';
import { groupBy } from 'lodash';
import { ShareTransactionType } from './transactions/outcome-share-transaction.model';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';
import { ActivityQueryFilter } from '../dtos/activity-query-filter';
import { UserWatchlist } from './user-watchlist';
import { HoldersQueryFilter } from '../dtos/holders-query-filter';
import { FundingTransactionType } from './transactions/prediction-set-funding-transaction.model';

/**
 * Prediction set resolution type.
 */
export enum ResolutionType {
  AUTOMATIC = 1,
  MANUAL = 2
}

/**
 * Prediction set status.
 */
export enum PredictionSetStatus {
  INITIALIZED = 1,
  PENDING = 2,
  FUNDING = 3,
  ACTIVE = 4,
  VOTING = 5,
  FINALIZED = 6,
  ERROR = 7
}

/**
 * Consensus threshold validator - threshold is required only in automatic resolution and must be between 51 and 100.
 *
 * @returns Boolean.
 */
export function consensusThresholdValidator() {
  return function (this: PredictionSet, value: number) {
    if (this.resolutionType === ResolutionType.MANUAL) {
      return true;
    }

    return isPresent(value) && value >= 51 && value <= 100;
  };
}

/**
 * Prediction set model.
 */
export class PredictionSet extends AdvancedSQLModel {
  /**
   * Prediction set 's table.
   */
  public tableName = DbTables.PREDICTION_SET;

  /**
   * Winner outcome ID reference.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB],
    populatable: [PopulateFrom.DB]
  })
  public winner_outcome_id: number;

  /**
   * Set ID - A distinct code that uniquely identifies each prediction set within the platform.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB]
  })
  setId: string;

  /**
   * Question - The central query or event being predicted, clearly framed to avoid ambiguity.
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
        code: ValidatorErrorCode.PREDICTION_SET_QUESTION_NOT_PRESENT
      }
    ]
  })
  question: string;

  /**
   * Description - A detailed explanation of the event or context behind the prediction, ensuring users understand its background and significance.
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
        code: ValidatorErrorCode.PREDICTION_SET_DESCRIPTION_NOT_PRESENT
      }
    ]
  })
  description: string;

  /**
   * General resolution definition - A high-level summary of how the prediction will be resolved, offering clarity on the expected evaluation process.
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
        code: ValidatorErrorCode.PREDICTION_SET_GENERAL_RESOLUTION_NOT_PRESENT
      }
    ]
  })
  generalResolutionDef: string;

  /**
   * Outcome resolution definition - Specific criteria and data sources that determine the official resolution of the prediction, ensuring transparency and accuracy.
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
        code: ValidatorErrorCode.PREDICTION_SET_OUTCOME_RESOLUTION_NOT_PRESENT
      }
    ]
  })
  outcomeResolutionDef: string;

  /**
   * Outcome price definition -  A description of how outcome prices are calculated, including references to external price feeds or oracles like the Flare Price Oracle.
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
        code: ValidatorErrorCode.PREDICTION_SET_OUTCOME_PRICE_NOT_PRESENT
      }
    ]
  })
  outcomePriceDef: string;

  /**
   * Start time - The official launch date and time when the prediction market opens for trading.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_START_TIME_NOT_PRESENT
      }
    ]
  })
  public startTime: Date;

  /**
   * End time - The final date and time when trading closes, after which no further market activity is allowed.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_END_TIME_NOT_PRESENT
      }
    ]
  })
  public endTime: Date;

  /**
   * Resolution time - The scheduled time when the market's outcome is finalized, based on pre-defined resolution criteria.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_RESOLUTION_TIME_NOT_PRESENT
      }
    ]
  })
  public resolutionTime: Date;

  /**
   * Prediction set resolution types:
   * - 1: AUTOMATIC - Prediction set is resolved automatically.
   * - 2: MANUAL - Prediction set is resolved by whitelist users voting.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER, PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB],
    validators: [
      {
        resolver: enumInclusionValidator(PredictionSetStatus),
        code: ErrorCode.INVALID_STATUS
      }
    ],
    emptyValue: () => ResolutionType.AUTOMATIC,
    defaultValue: () => ResolutionType.AUTOMATIC
  })
  public resolutionType: number;

  /**
   * Prediction set consensus threshold percentage.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER, PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB],
    validators: [
      {
        resolver: consensusThresholdValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_CONSENSUS_THRESHOLD_NOT_PRESENT_OR_VALID
      }
    ]
  })
  public consensusThreshold: number;

  /**
   * Set status.
   * - 1: INITIALIZED - When the set is created.
   * - 2: PENDING - When the set is syncing with the blockchain.
   * - 3: FUNDING - When the set is synced with blockchain and waiting for funding.
   * - 4: ACTIVE - When the set is funded and ready for predictions.
   * - 6: VOTING - When is in the voting phase.
   * - 7: FINALIZED - When the set is finalized.
   * - 8: ERROR - When the set is in error state.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER, PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB],
    validators: [
      {
        resolver: enumInclusionValidator(PredictionSetStatus),
        code: ErrorCode.INVALID_STATUS
      }
    ],
    emptyValue: () => PredictionSetStatus.INITIALIZED,
    defaultValue: () => PredictionSetStatus.INITIALIZED
  })
  public setStatus: PredictionSetStatus;

  /**
   * Tags - Used for filtering prediction sets.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER]
  })
  tags: string;

  /**
   * Prediction set's outcomes virtual property definition.
   */
  @prop({
    parser: { resolver: Outcome, array: true },
    serializable: [SerializeFor.USER],
    populatable: [PopulateFrom.DB],
    defaultValue: () => []
  })
  public outcomes: Outcome[];

  /**
   * Prediction set's chain data virtual property definition.
   */
  @prop({
    parser: { resolver: PredictionSetChainData },
    serializable: [SerializeFor.USER],
    populatable: [PopulateFrom.DB],
    defaultValue: () => null
  })
  public chainData: PredictionSetChainData;

  /**
   * Prediction set's chain data virtual property definition.
   */
  @prop({
    parser: { resolver: booleanParser() },
    serializable: [SerializeFor.USER],
    populatable: [PopulateFrom.USER],
    defaultValue: () => false
  })
  public isWatched: boolean;

  /**
   * Prediction set's liquidity volume.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializeFor.USER],
    populatable: [PopulateFrom.USER],
    defaultValue: () => false
  })
  public volume: number;

  /**
   *
   * @param id
   * @param conn
   * @param forUpdate
   * @param populate
   * @returns
   */
  public async populateById(
    id: any,
    conn?: PoolConnection,
    forUpdate?: boolean,
    populate?: { outcomes?: boolean; chainData?: boolean; isWatched?: boolean; volume?: boolean }
  ): Promise<this> {
    const context = this.getContext();
    const model = await super.populateById(id, conn, forUpdate);

    if (populate?.outcomes) {
      this.outcomes = await this.getOutcomes(conn);
    }

    if (populate?.chainData) {
      this.chainData = await this.getPredictionSetChainData(conn, forUpdate);
    }

    if (populate?.isWatched) {
      this.isWatched = await this.getIsWatched(conn);
    }

    if (populate?.volume) {
      this.volume = await this.getVolume(conn);
    }

    return model;
  }

  /**
   *
   * @param conn
   * @returns
   */
  public async getPredictionSetChainData(conn?: PoolConnection, forUpdate?: boolean): Promise<PredictionSetChainData> {
    const context = this.getContext();

    return await new PredictionSetChainData({}, context).populateByPredictionSetId(this.id, conn, forUpdate);
  }

  /**
   *
   * @param conn
   * @returns
   */
  public async getIsWatched(conn?: PoolConnection): Promise<boolean> {
    const context = this.getContext();

    if (!context.user) {
      return false;
    }

    return (await new UserWatchlist({}, context).populateByUserAndPredictionSetId(context.user.id, this.id, conn)).exists();
  }

  /**
   *
   * @param conn
   * @returns
   */
  public async getVolume(conn?: PoolConnection): Promise<number> {
    const volume = await this.db().paramExecute(
      `
      SELECT
        SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.amount, 0)) 
        - SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.amount, 0)) 
        + (
          SELECT IFNULL(SUM(psft.collateralAmount), 0)
          FROM ${DbTables.PREDICTION_SET_FUNDING_TRANSACTION} psft
          WHERE psft.prediction_set_id = @predictionSetId
        ) AS volume
      FROM ${DbTables.OUTCOME_SHARE_TRANSACTION} ost
      WHERE ost.prediction_set_id = @predictionSetId
      `,
      { predictionSetId: this.id },
      conn
    );

    return volume[0].volume;
  }

  /**
   *
   * @param conn
   * @returns
   */
  public async getOutcomes(conn?: PoolConnection): Promise<Outcome[]> {
    const rows = await this.db().paramExecute(
      `
        SELECT 
          o.*, 
          JSON_OBJECT(
            'id', oc.id,
            'status', oc.status,
            'createTime', oc.createTime,
            'updateTime', oc.updateTime,
            'outcome_id', oc.outcome_id,
            'prediction_set_id', oc.prediction_set_id,
            'chance', oc.chance,
            'supply', oc.supply,
            'totalSupply', oc.totalSupply
          ) AS latestChance,
          SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.amount, 0)) - SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.amount, 0)) AS volume
        FROM ${DbTables.OUTCOME} o
        LEFT JOIN (
          SELECT oc.*
          FROM (
              SELECT *,
                ROW_NUMBER() OVER (PARTITION BY outcome_id ORDER BY createTime DESC) AS rn
              FROM ${DbTables.OUTCOME_CHANCE}
          ) oc
          WHERE oc.rn = 1
        ) oc ON oc.outcome_id = o.id
        LEFT JOIN ${DbTables.OUTCOME_SHARE_TRANSACTION} ost
          ON ost.outcome_id = o.id
        WHERE o.prediction_set_id = @predictionSetId
          AND o.status <> ${SqlModelStatus.DELETED}
        GROUP BY o.id
        ORDER BY o.id;
      `,
      { predictionSetId: this.id },
      conn
    );

    const context = this.getContext();
    return rows.map((r) => new Outcome(r, context));
  }

  /**
   *
   * @param conn
   * @returns
   */
  public async getDataSources(conn?: PoolConnection): Promise<DataSource[]> {
    const rows = await this.db().paramExecute(
      `
        SELECT *
        FROM ${DbTables.DATA_SOURCE} ds
        JOIN ${DbTables.PREDICTION_SET_DATA_SOURCE} psds
          ON psds.data_source_id = ds.id
        WHERE psds.prediction_set_id = @predictionSetId
          AND ds.status <> ${SqlModelStatus.DELETED}
        ORDER BY ds.id;
      `,
      { predictionSetId: this.id },
      conn
    );

    const context = this.getContext();
    return rows.length ? rows.map((r) => new DataSource(r, context)) : [];
  }

  /**
   * Adds a data source to the prediction set.
   * @param dataSourceId Data source ID.
   * @param conn Database connection.
   * @returns Prediction set.
   */
  public async addDataSource(dataSourceId: number, conn?: PoolConnection): Promise<PredictionSet> {
    await this.db().paramExecute(
      `
          INSERT IGNORE INTO ${DbTables.PREDICTION_SET_DATA_SOURCE} (prediction_set_id, data_source_id)
          VALUES (@predictionSetId, @dataSourceId)
        `,
      {
        predictionSetId: this.id,
        dataSourceId
      },
      conn
    );

    return this;
  }

  /**
   * Remove all data sources for this prediction set.
   * @param conn Database connection.
   * @returns Prediction set.
   */
  public async deleteDataSources(conn?: PoolConnection): Promise<PredictionSet> {
    await this.db().paramExecute(
      `
        DELETE FROM  ${DbTables.PREDICTION_SET_DATA_SOURCE} 
        WHERE prediction_set_id = @predictionSetId
      `,
      {
        predictionSetId: this.id
      },
      conn
    );

    return this;
  }

  /**
   * Remove all outcomes for this prediction set.
   * @param conn Database connection.
   * @returns Prediction set.
   */
  public async deleteOutcomes(conn?: PoolConnection): Promise<PredictionSet> {
    await this.db().paramExecute(
      `
        DELETE FROM ${DbTables.OUTCOME}
        WHERE prediction_set_id = @predictionSetId
      `,
      {
        predictionSetId: this.id
      },
      conn
    );

    return this;
  }

  public async getActivityList(query: ActivityQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    const fieldMap = {};

    const { params, filters } = getQueryParams(defaultParams, '', fieldMap, query.serialize());

    const qSelects = [
      {
        qSelect: `
        SELECT 
          ${new PredictionSet({}).generateSelectFields('p')},
          u.id as userId,
          u.username,
          u.walletAddress as userWallet,
          o.name AS outcomeName,
          t.id as transactionId,
          t.amount AS userAmount,
          t.type,
          t.outcomeTokens,
          t.txHash,
          t.createTime AS transactionTime
        `,
        qFrom: `
        FROM ${DbTables.OUTCOME_SHARE_TRANSACTION} t
        JOIN ${DbTables.PREDICTION_SET} p
          ON t.prediction_set_id = p.id
        JOIN ${DbTables.USER} u
          ON u.id = t.user_id
        JOIN ${DbTables.OUTCOME} o 
          ON o.id = t.outcome_id
        WHERE p.status <> ${SqlModelStatus.DELETED}
        AND (@predictionId IS NULL OR t.prediction_set_id = @predictionId)
        AND (@userId IS NULL OR t.user_id = @userId)
        AND (@type IS NULL OR t.type = @type)
        AND (@search IS NULL
          OR p.question LIKE CONCAT('%', @search, '%')
        )
        `
      },
      {
        qSelect: `
        SELECT 
          ${new PredictionSet({}).generateSelectFields('p')},
          u.id as userId,
          u.username,
          u.walletAddress as userWallet,
          NULL AS outcomeName,
          t.id as transactionId,
          t.collateralAmount AS userAmount,
          t.type + 2 as type,
          NULL AS outcomeTokens,
          t.txHash,
          t.createTime AS transactionTime
        `,
        qFrom: `
        FROM ${DbTables.PREDICTION_SET_FUNDING_TRANSACTION} t
        JOIN ${DbTables.PREDICTION_SET} p
          ON t.prediction_set_id = p.id
        JOIN ${DbTables.USER} u
          ON u.id = t.user_id
        WHERE p.status <> ${SqlModelStatus.DELETED}
        AND (@predictionId IS NULL OR t.prediction_set_id = @predictionId)
        AND (@userId IS NULL OR t.user_id = @userId)
        AND (@type IS NULL OR t.type = @type - 2)
        AND (@search IS NULL
          OR p.question LIKE CONCAT('%', @search, '%')
        )
        `
      }
    ];

    const sqlQuery = {
      qSelects,
      qFilter: `
        ORDER BY ${filters.orderStr}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };

    return await unionSelectAndCountQuery(this.getContext().mysql, sqlQuery, params, 't.id');
  }

  public async getHoldersList(query: HoldersQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    const fieldMap = {
      id: 'p.id',
      userAmount: 'ost.amount',
      userId: 'u.id',
      userWallet: 'u.walletAddress',
      boughtAmount: `SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.amount, 0))`,
      soldAmount: `SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.amount, 0))`,
      outcomeTokens: `SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.outcomeTokens, 0)) - SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.outcomeTokens, 0))`
    };

    const { params, filters } = getQueryParams(defaultParams, 'ost', fieldMap, query.serialize());

    const sqlQuery = {
      qSelect: `
        SELECT 
          ${new PredictionSet({}).generateSelectFields('p')},
          u.id as userId,
          u.username,
          u.walletAddress as userWallet,
          o.name AS outcomeName,
          SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.amount, 0)) AS boughtAmount,
          SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.amount, 0)) AS soldAmount,
          SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.outcomeTokens, 0)) - SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.outcomeTokens, 0)) AS outcomeTokens
        `,
      qFrom: `
        FROM ${DbTables.OUTCOME_SHARE_TRANSACTION} ost
        JOIN ${DbTables.PREDICTION_SET} p
          ON ost.prediction_set_id = p.id
        LEFT JOIN ${DbTables.USER} u
          ON u.id = ost.user_id
        LEFT JOIN ${DbTables.OUTCOME} o 
          ON o.id = ost.outcome_id
        WHERE p.status <> ${SqlModelStatus.DELETED}
        AND (@predictionId IS NULL OR ost.prediction_set_id = @predictionId)
        AND (@outcomeId IS NULL OR ost.outcome_id = @outcomeId)
        AND (@search IS NULL
          OR p.question LIKE CONCAT('%', @search, '%')
        )
        `,
      qGroup: `
        GROUP BY u.id
      `,
      qFilter: `
        ORDER BY ${filters.orderStr}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };
    return await selectAndCountQuery(this.getContext().mysql, sqlQuery, params, 'u.id');
  }

  public async getUserList(id: number, query: BaseQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    const fieldMap = {
      id: 'p.id',
      boughtAmount: `SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.amount, 0))`,
      soldAmount: `SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.amount, 0))`,
      outcomeTokens: `SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.outcomeTokens, 0)) - SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.outcomeTokens, 0))`
    };

    const { params, filters } = getQueryParams(defaultParams, 'p', fieldMap, query.serialize());

    params.userId = id;

    const sqlQuery = {
      qSelect: `
        SELECT 
          ${new PredictionSet({}).generateSelectFields('p')},
          o.name AS outcomeName,
          SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.amount, 0)) AS boughtAmount,
          SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.amount, 0)) AS soldAmount,
          SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.outcomeTokens, 0)) - SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.outcomeTokens, 0)) AS outcomeTokens
        `,
      qFrom: `
        FROM ${DbTables.PREDICTION_SET} p
        LEFT JOIN ${DbTables.OUTCOME_SHARE_TRANSACTION} ost
          ON ost.prediction_set_id = p.id
          AND ost.user_id = @userId
        LEFT JOIN ${DbTables.OUTCOME} o 
          ON o.id = ost.outcome_id
        WHERE p.status <> ${SqlModelStatus.DELETED}
        AND ost.id IS NOT NULL
        AND (@search IS NULL
          OR p.question LIKE CONCAT('%', @search, '%')
        )
        `,
      qGroup: `
        GROUP BY p.id, ost.outcome_id
      `,
      qFilter: `
        ORDER BY ${filters.orderStr}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };
    return await selectAndCountQuery(this.getContext().mysql, sqlQuery, params, 'p.id, ost.outcome_id');
  }

  /**
   *
   * @param query
   * @returns
   */
  public async getList(query: PredictionSetQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    const fieldMap = {
      id: 'p.id'
    };

    const { params, filters } = getQueryParams(defaultParams, 'p', fieldMap, query.serialize());

    if (this.getContext()?.user?.id) {
      params.userId = this.getContext().user.id;
    }

    const sqlQuery = {
      qSelect: `
        SELECT 
          ${new PredictionSet({}).generateSelectFields('p')},
          CONCAT(
            '[',
            COALESCE(
              GROUP_CONCAT(
                DISTINCT
                JSON_OBJECT(
                  'id', o.id,
                  'name', o.name,
                  'outcomeIndex', o.outcomeIndex,
                  'positionId', o.positionId,
                  'chance', oc.chance,
                  'supply', oc.supply,
                  'totalSupply', oc.totalSupply
                )
                ORDER BY o.id
              ),
              ''
            ),
            ']'
          ) AS outcomes,
        IF(uw.id IS NOT NULL, 1, 0) AS isWatched
        `,
      qFrom: `
        FROM ${DbTables.PREDICTION_SET} p
        LEFT JOIN ${DbTables.OUTCOME} o
          ON o.prediction_set_id = p.id
          AND o.status = ${SqlModelStatus.ACTIVE}
        LEFT JOIN (
          SELECT oc.*
          FROM ${DbTables.OUTCOME_CHANCE} oc
          INNER JOIN (
            SELECT outcome_id, MAX(createTime) as latest_create_time
            FROM ${DbTables.OUTCOME_CHANCE}
            GROUP BY outcome_id
          ) latest ON oc.outcome_id = latest.outcome_id AND oc.createTime = latest.latest_create_time
        ) oc ON oc.outcome_id = o.id
        LEFT JOIN ${DbTables.USER_WATCHLIST} uw 
          ON uw.prediction_set_id = p.id
          AND uw.user_id = @userId
        LEFT JOIN ${DbTables.PREDICTION_SET_CATEGORY} pc
          ON pc.prediction_set_id = p.id
        WHERE p.setStatus NOT IN(${PredictionSetStatus.ERROR}, ${PredictionSetStatus.INITIALIZED}, ${PredictionSetStatus.PENDING})
        AND p.status <> ${SqlModelStatus.DELETED}
        AND (@search IS NULL
          OR p.question LIKE CONCAT('%', @search, '%')
        )
        AND (@tag IS NULL
          OR p.tags LIKE CONCAT('%', @tag, '%')
        )
        AND (@watchlist IS NULL OR @watchlist = 0 OR uw.id IS NOT NULL)
        AND (@category IS NULL
          OR pc.category LIKE CONCAT('%', @category, '%')
        )
        `,
      qGroup: `
        GROUP BY p.id
      `,
      qFilter: `
        ORDER BY ${filters.orderStr}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };
    const res = await selectAndCountQuery(this.getContext().mysql, sqlQuery, params, 'p.id');
    if (res.items.length) {
      res.items = res?.items?.map((x: any) => ({ ...x, outcomes: JSON.parse(x.outcomes) }));
    }
    return res;
  }

  public async getChanceHistory(query: PredictionSetChanceHistoryQueryFilter): Promise<any> {
    let rangeCondition = '';
    let endTime = dateToSqlString(new Date());
    if (this.endTime.getTime() < new Date().getTime()) {
      endTime = dateToSqlString(this.endTime);
    }
    switch (query.range) {
      case '1D':
        rangeCondition = `AND createTime >= DATE_SUB('${endTime}', INTERVAL 1 DAY)`;
        break;
      case '1W':
        rangeCondition = `AND createTime >= DATE_SUB('${endTime}', INTERVAL 1 WEEK)`;
        break;
      case '1M':
        rangeCondition = `AND createTime >= DATE_SUB('${endTime}', INTERVAL 1 MONTH)`;
        break;
      case 'ALL':
      default:
        rangeCondition = '';
        break;
    }

    const outcomeChances = await this.db().paramExecute(
      `
        SELECT
          outcome_id,
          chance,
          FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(createTime)/900)*900) as date
        FROM ${DbTables.OUTCOME_CHANCE}
        WHERE (outcome_id, createTime) IN (
          SELECT outcome_id, MAX(createTime)
          FROM ${DbTables.OUTCOME_CHANCE}
          WHERE prediction_set_id = @predictionSetId
          ${rangeCondition}
          GROUP BY outcome_id, FLOOR(UNIX_TIMESTAMP(createTime)/900)
        )
        GROUP BY date, outcome_id
        ORDER BY date ASC
      `,
      {
        predictionSetId: this.id,
        startTime: this.startTime,
        endTime: this.endTime
      }
    );
    return groupBy(outcomeChances, 'outcome_id');
  }
}
