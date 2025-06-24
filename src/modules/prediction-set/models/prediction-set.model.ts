import { prop } from '@rawmodel/core';
import { booleanParser, dateParser, integerParser, stringParser } from '@rawmodel/parsers';
import { isPresent } from '@rawmodel/utils';
import { presenceValidator } from '@rawmodel/validators';
import { groupBy } from 'lodash';
import { PoolConnection } from 'mysql2/promise';
import { DbTables, ErrorCode, PopulateFrom, SerializeFor, SqlModelStatus, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';
import { getQueryParams, selectAndCountQuery, unionSelectAndCountQuery } from '../../../lib/database/sql-utils';
import { dateToSqlString } from '../../../lib/utils';
import { conditionalPresenceValidator, enumInclusionValidator } from '../../../lib/validators';
import { ActivityQueryFilter } from '../dtos/activity-query-filter';
import { HoldersQueryFilter } from '../dtos/holders-query-filter';
import { PredictionSetChanceHistoryQueryFilter } from '../dtos/prediction-set-chance-history-query-filter';
import { PredictionSetQueryFilter } from '../dtos/prediction-set-query-filter';
import { DataSource } from './data-source.model';
import { Outcome } from './outcome.model';
import { PredictionSetAttestation } from './prediction-set-attestation.model';
import { PredictionSetChainData } from './prediction-set-chain-data.model';
import { ShareTransactionType } from './transactions/outcome-share-transaction.model';
import { UserWatchlist } from './user-watchlist';
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
   * Collateral token ID reference.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER]
  })
  public collateral_token_id: number;

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
   * Attestation time - The date and time after which the attestation is allowed.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: conditionalPresenceValidator('resolutionType', (value) => value === ResolutionType.AUTOMATIC),
        code: ValidatorErrorCode.PREDICTION_SET_ATTESTATION_TIME_NOT_PRESENT
      }
    ]
  })
  public attestationTime: Date;

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
   * Img URL.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    defaultValue: () => 'https://images.ignitemarket.xyz/logo.png',
    emptyValue: () => 'https://images.ignitemarket.xyz/logo.png'
  })
  imgUrl: string;

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
   * Tells if prediction set is on user's watchlist.
   */
  @prop({
    parser: { resolver: booleanParser() },
    serializable: [SerializeFor.USER],
    populatable: [PopulateFrom.USER],
    defaultValue: () => false
  })
  public isWatched: boolean;

  /**
   * Prediction set's liquidity (funding) volume.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializeFor.USER],
    populatable: [PopulateFrom.USER],
    defaultValue: () => '0'
  })
  public fundingVolume: string;

  /**
   * Prediction set's transactions volume.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializeFor.USER],
    populatable: [PopulateFrom.USER],
    defaultValue: () => '0'
  })
  public transactionsVolume: string;

  /**
   * User's open positions.
   */
  @prop({
    serializable: [SerializeFor.USER],
    populatable: [PopulateFrom.USER],
    defaultValue: () => [],
    emptyValue: () => []
  })
  public positions: any[];

  /**
   * User's open funding positions.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializeFor.USER],
    populatable: [PopulateFrom.USER],
    defaultValue: () => 0,
    emptyValue: () => 0
  })
  public fundingPositions: string;

  /**
   * Populate prediction set by ID.
   * @param id Prediction set ID.
   * @param conn Pool connection.
   * @param forUpdate Populate for update.
   * @param populate Populate fields.
   * @returns Prediction set.
   */
  public async populateById(
    id: any,
    conn?: PoolConnection,
    forUpdate?: boolean,
    populate?: {
      outcomes?: boolean;
      chainData?: boolean;
      isWatched?: boolean;
      volume?: boolean;
      positions?: boolean;
      fundingPositions?: boolean;
    }
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
      const volume = await this.getVolume(conn);
      this.fundingVolume = volume?.fundingVolume || '0';
      this.transactionsVolume = volume?.transactionsVolume || '0';
    }

    if (populate?.positions) {
      this.positions = await this.getOpenPositions(conn);
    }

    if (populate?.fundingPositions) {
      this.fundingPositions = await this.getOpenFundingPositions(conn);
    }

    return model;
  }

  /**
   * Gets prediction set chain data.
   *
   * @param conn Pool connection.
   * @returns Prediction set chain data.
   */
  public async getPredictionSetChainData(conn?: PoolConnection, forUpdate?: boolean): Promise<PredictionSetChainData> {
    const context = this.getContext();

    return await new PredictionSetChainData({}, context).populateByPredictionSetId(this.id, conn, forUpdate);
  }

  /**
   * Tells if this prediction set is on current user's watchlist.
   *
   * @param conn Pool connection.
   * @returns Boolean.
   */
  public async getIsWatched(conn?: PoolConnection): Promise<boolean> {
    const context = this.getContext();

    if (!context.user) {
      return false;
    }

    return (await new UserWatchlist({}, context).populateByUserAndPredictionSetId(context.user.id, this.id, conn)).exists();
  }

  /**
   * Gets current user's open positions for this prediction set.
   *
   * @param conn Pool connection.
   * @returns Volume.
   */
  public async getOpenPositions(conn?: PoolConnection): Promise<any[]> {
    const context = this.getContext();

    if (!context.user) {
      return [];
    }

    // Get all transactions ordered by time ASC (oldest first)
    const transactions = await this.db().paramExecute(
      `
        SELECT 
          o.id AS outcomeId,
          o.name AS outcomeName,
          o.outcomeIndex AS outcomeIndex,
          ost.type,
          ost.amount,
          ost.outcomeTokens,
          ost.createTime
        FROM ${DbTables.OUTCOME_SHARE_TRANSACTION} ost
        LEFT JOIN ${DbTables.OUTCOME} o
          ON o.id = ost.outcome_id
        WHERE ost.prediction_set_id = @predictionSetId
          AND ost.user_id = @userId
        ORDER BY ost.createTime ASC
      `,
      {
        predictionSetId: this.id,
        userId: context.user.id
      },
      conn
    );

    // Group transactions by outcome
    const outcomeGroups = transactions.reduce((acc, tx) => {
      if (!acc[tx.outcomeId]) {
        acc[tx.outcomeId] = {
          outcomeId: tx.outcomeId,
          outcomeName: tx.outcomeName,
          outcomeIndex: tx.outcomeIndex,
          transactions: []
        };
      }
      acc[tx.outcomeId].transactions.push(tx);
      return acc;
    }, {});

    // Calculate position details for each outcome
    const positions = Object.values(outcomeGroups).map((group: any) => {
      // First pass: calculate final position and track buys
      let remainingShares = 0;
      let collateralAmount = 0;
      const buys = [];

      group.transactions.forEach((tx: any) => {
        const shareChange = tx.type === ShareTransactionType.SELL ? -Number(tx.outcomeTokens) : Number(tx.outcomeTokens);
        const amountChange = tx.type === ShareTransactionType.SELL ? -Number(tx.amount) : Number(tx.amount);

        remainingShares += shareChange;
        collateralAmount += amountChange;

        if (tx.type === ShareTransactionType.BUY || tx.type === ShareTransactionType.FUND) {
          buys.push({
            shares: Number(tx.outcomeTokens),
            amount: Number(tx.amount),
            pricePerShare: Number(tx.amount) / Number(tx.outcomeTokens)
          });
        }
      });

      // Second pass: calculate weighted average
      // Needs to only account for shares that are not yet sold
      let weightedAmount = 0;
      let totalShares = 0;
      let sharesToAccount = remainingShares;

      // Process buys in reverse order (newest first)
      for (let i = buys.length - 1; i >= 0 && sharesToAccount > 0; i--) {
        const buy = buys[i];
        const sharesFromThisBuy = Math.min(buy.shares, sharesToAccount);
        const amountFromThisBuy = sharesFromThisBuy * buy.pricePerShare;

        weightedAmount += amountFromThisBuy;
        totalShares += sharesFromThisBuy;
        sharesToAccount -= sharesFromThisBuy;
      }

      return {
        outcomeId: group.outcomeId,
        outcomeName: group.outcomeName,
        outcomeIndex: group.outcomeIndex,
        avgBuyPrice: totalShares > 0 ? weightedAmount / totalShares : 0,
        collateralAmount,
        sharesAmount: remainingShares
      };
    });

    return positions;
  }

  /**
   * Gets current user's open funding positions for this prediction set.
   *
   * @param conn Pool connection.
   * @returns Sum of collateral amount.
   */
  public async getOpenFundingPositions(conn?: PoolConnection): Promise<string> {
    const context = this.getContext();

    if (!context.user) {
      return '0';
    }

    const result = await this.db().paramExecute(
      `
        SELECT
          IFNULL(SUM(psft.collateralAmount), 0) AS collateralAmount
        FROM ${DbTables.PREDICTION_SET_FUNDING_TRANSACTION} psft
        WHERE psft.prediction_set_id = @predictionSetId
          AND psft.user_id = @userId
      `,
      {
        predictionSetId: this.id,
        userId: context.user.id
      },
      conn
    );
    return result[0]?.collateralAmount?.toString() || '0';
  }

  /**
   * Gets prediction sets volume.
   *
   * @param conn Pool connection.
   * @returns Volume object with share, funding and total volumes.
   */
  public async getVolume(conn?: PoolConnection): Promise<{ transactionsVolume: string; fundingVolume: string }> {
    const volumeData = await this.db().paramExecute(
      `
        SELECT
          (
            SELECT IFNULL(SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.amount - ost.feeAmount, 0)), 0)
            - IFNULL(SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.amount, 0)), 0)
            FROM ${DbTables.OUTCOME_SHARE_TRANSACTION} ost
            WHERE ost.prediction_set_id = @predictionSetId
          ) AS transactionsVolume,
          (
            SELECT IFNULL(SUM(psft.collateralAmount), 0)
            FROM ${DbTables.PREDICTION_SET_FUNDING_TRANSACTION} psft
            WHERE psft.prediction_set_id = @predictionSetId
          ) AS fundingVolume
      `,
      { predictionSetId: this.id },
      conn
    );

    return {
      transactionsVolume: volumeData[0].transactionsVolume.toString(),
      fundingVolume: volumeData[0].fundingVolume.toString()
    };
  }

  /**
   * Gets prediction set outcomes.
   *
   * @param conn Pool connection.
   * @returns Outcomes.
   */
  public async getOutcomes(conn?: PoolConnection): Promise<Outcome[]> {
    const rows = await this.db().paramExecute(
      `
        SELECT 
          o.*, 
          oc.chance as latestChance,
          SUM(CASE WHEN ost.type = ${ShareTransactionType.BUY} THEN ost.amount - ost.feeAmount ELSE 0 END) - SUM(CASE WHEN ost.type = ${ShareTransactionType.SELL} THEN ost.amount ELSE 0 END) AS volume
        FROM ${DbTables.OUTCOME} o
        LEFT JOIN (
          SELECT oc.*
          FROM ${DbTables.OUTCOME_CHANCE} oc
          INNER JOIN (
            SELECT outcome_id, MAX(createTime) AS latest_create_time
            FROM ${DbTables.OUTCOME_CHANCE}
            GROUP BY outcome_id
          ) latest ON oc.outcome_id = latest.outcome_id AND oc.createTime = latest.latest_create_time
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
    return rows.map((r) => {
      return new Outcome(
        {
          ...r,
          volume: r.volume > 0 ? r.volume : 0
        },
        context
      );
    });
  }

  /**
   * Gets prediction sets data sources.
   *
   * @param conn Pool connection.
   * @returns Array of data sources.
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
   * Returns prediction set attestations.
   *
   * @param conn Pool connection.
   * @returns Array of attestations.
   */
  public async getAttestations(conn?: PoolConnection): Promise<PredictionSetAttestation[]> {
    const rows = await this.db().paramExecute(
      `
        SELECT *
        FROM ${DbTables.PREDICTION_SET_ATTESTATION} psa
        WHERE psa.prediction_set_id = @predictionSetId
          AND psa.status <> ${SqlModelStatus.DELETED}
        ORDER BY psa.id;
      `,
      { predictionSetId: this.id },
      conn
    );

    const context = this.getContext();
    return rows.length ? rows.map((r) => new PredictionSetAttestation(r, context)) : [];
  }

  /**
   * Adds a data source to the prediction set.
   *
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
   *
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
   *
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

  /**
   * Returns prediction set activity list.
   *
   * @param query Activity query filter.
   * @returns Array of activity.
   */
  public async getActivityList(query: ActivityQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    const { params, filters } = getQueryParams(defaultParams, '', {}, query.serialize());
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
          IF(t.type = ${ShareTransactionType.FUND}, 6, t.type) as type,
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
          IFNULL(t.collateralAmount, t.collateralRemovedFromFeePool) AS userAmount,
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
      },
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
          5 as type,
          NULL AS outcomeTokens,
          t.txHash,
          t.createTime AS transactionTime
        `,
        qFrom: `
        FROM ${DbTables.CLAIM_TRANSACTION} t
        JOIN ${DbTables.PREDICTION_SET} p
          ON t.prediction_set_id = p.id
        JOIN ${DbTables.USER} u
          ON u.id = t.user_id
        JOIN ${DbTables.OUTCOME} o 
          ON o.id = t.outcome_id
        WHERE p.status <> ${SqlModelStatus.DELETED}
        AND (@predictionId IS NULL OR t.prediction_set_id = @predictionId)
        AND (@userId IS NULL OR t.user_id = @userId)
        AND (@type IS NULL OR 5 = @type)
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

  /**
   * Returns prediction set holders list.
   *
   * @param query Holders query filter.
   * @returns Array of holders.
   */
  public async getHoldersList(query: HoldersQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    const fieldMap = {
      id: 'p.id',
      userAmount: 'ost.amount',
      userId: 'u.id',
      userWallet: 'u.walletAddress',
      boughtAmount: `SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.amount - ost.feeAmount, 0))`,
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
          p.collateral_token_id AS collateral_token_id,
          SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.amount - ost.feeAmount, 0)) AS boughtAmount,
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

  /**
   * Returns user's predictions.
   *
   * @param id User ID.
   * @param query User's query filter.
   * @returns List of user's predictions.
   */
  public async getUserPredictions(id: number, query: BaseQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    const fieldMap = {
      id: 'p.id',
      boughtAmount: `SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.amount - ost.feeAmount, 0))`,
      soldAmount: `SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.amount, 0))`,
      outcomeTokens: `SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.outcomeTokens, 0)) - SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.outcomeTokens, 0))`,
      claimedAmount: `IFNULL(ct.amount, 0)`
    };

    const { params, filters } = getQueryParams(defaultParams, 'p', fieldMap, { ...query.serialize(), userId: id });
    const sqlQuery = {
      qSelect: `
        SELECT 
          ${new PredictionSet({}).generateSelectFields('p')},
          o.id AS outcomeId,
          o.name AS outcomeName,
          o.imgUrl AS outcomeImg,
          SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.amount - ost.feeAmount, 0)) AS boughtAmount,
          SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.amount, 0)) AS soldAmount,
          SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.outcomeTokens, 0)) - SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.outcomeTokens, 0)) AS outcomeTokens,
          IFNULL(ct.amount, 0) AS claimedAmount
        `,
      qFrom: `
        FROM ${DbTables.PREDICTION_SET} p
        LEFT JOIN ${DbTables.OUTCOME_SHARE_TRANSACTION} ost
          ON ost.prediction_set_id = p.id
          AND ost.user_id = @userId
        LEFT JOIN ${DbTables.OUTCOME} o 
          ON o.id = ost.outcome_id
        LEFT JOIN ${DbTables.CLAIM_TRANSACTION} ct
          ON ct.prediction_set_id = p.id
          AND ct.outcome_id = o.id
          AND ct.user_id = @userId
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
   * Returns user's funding positions.
   *
   * @param id User ID.
   * @param query User's query filter.
   * @returns List of user's funding positions.
   */
  public async getUserFundingPositions(id: number, query: BaseQueryFilter): Promise<any> {
    const defaultParams = {
      id: null
    };

    const fieldMap = {
      id: 'p.id',
      fundedAmount: `SUM(IF(psft.type = ${FundingTransactionType.ADDED}, psft.collateralAmount, 0))`,
      removedAmount: `SUM(IF(psft.type = ${FundingTransactionType.REMOVED}, psft.collateralAmount, 0))`
    };

    const { params, filters } = getQueryParams(defaultParams, 'p', fieldMap, { ...query.serialize(), userId: id });
    const sqlQuery = {
      qSelect: `
        SELECT 
          ${new PredictionSet({}).generateSelectFields('p')},
          SUM(IF(psft.type = ${FundingTransactionType.ADDED}, psft.collateralAmount, 0)) AS fundedAmount,
          SUM(IF(psft.type = ${FundingTransactionType.ADDED}, psft.shares, -psft.shares)) AS remainingShares
        `,
      qFrom: `
        FROM ${DbTables.PREDICTION_SET} p
        LEFT JOIN ${DbTables.PREDICTION_SET_FUNDING_TRANSACTION} psft
          ON psft.prediction_set_id = p.id
          AND psft.user_id = @userId
        WHERE p.status <> ${SqlModelStatus.DELETED}
        AND psft.id IS NOT NULL
        AND (@search IS NULL
          OR p.question LIKE CONCAT('%', @search, '%')
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
    return await selectAndCountQuery(this.getContext().mysql, sqlQuery, params, 'p.id');
  }

  /**
   * Returns prediction set list.
   *
   * @param query Prediction set query filter.
   * @returns Array of prediction sets.
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

    if (params.watchlist) {
      params.category = null;
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
                    'latestChance', oc.chance,
                    'imgUrl', o.imgUrl
                  )
                  ORDER BY o.id
                ),
                ''
              ),
            ']'
          ) AS outcomes,
          IF(uw.id IS NOT NULL, 1, 0) AS isWatched,
          COALESCE(tv.volume, 0) AS volume
        `,
      qFrom: `
        FROM ${DbTables.PREDICTION_SET} p
        LEFT JOIN (
          SELECT 
            ps.id AS prediction_set_id,
            (
              COALESCE((
                SELECT SUM(IF(ost.type = ${ShareTransactionType.BUY}, ost.amount - ost.feeAmount, 0)) - 
                       SUM(IF(ost.type = ${ShareTransactionType.SELL}, ost.amount, 0))
                FROM ${DbTables.OUTCOME_SHARE_TRANSACTION} ost
                WHERE ost.prediction_set_id = ps.id
                GROUP BY ost.prediction_set_id
              ), 0) +
              COALESCE((
                SELECT SUM(psft.collateralAmount)
                FROM ${DbTables.PREDICTION_SET_FUNDING_TRANSACTION} psft
                WHERE psft.prediction_set_id = ps.id
                GROUP BY psft.prediction_set_id
              ), 0)
            ) AS volume
          FROM ${DbTables.PREDICTION_SET} ps
          WHERE ps.status <> ${SqlModelStatus.DELETED}
        ) tv ON tv.prediction_set_id = p.id
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
        WHERE p.status <> ${SqlModelStatus.DELETED}
        AND (@status IS NULL AND p.setStatus NOT IN(${PredictionSetStatus.ERROR}, ${PredictionSetStatus.INITIALIZED}, ${PredictionSetStatus.PENDING})
          OR FIND_IN_SET(p.setStatus, @status)
        )
        AND (@search IS NULL
          OR p.question LIKE CONCAT('%', @search, '%')
        )
        AND (@watchlist IS NULL OR @watchlist = 0 OR uw.id IS NOT NULL)
        AND (@category IS NULL
          OR pc.category LIKE CONCAT('%', @category, '%')
        )
        AND (@collateralTokenId IS NULL OR p.collateral_token_id = @collateralTokenId)
        `,
      qGroup: `
        GROUP BY p.id
      `,
      qFilter: `
        ORDER BY 
          CASE 
            WHEN p.setStatus = ${PredictionSetStatus.ACTIVE} AND p.endTime > NOW() THEN 1
            WHEN p.setStatus = ${PredictionSetStatus.FUNDING} THEN 2
            WHEN p.setStatus = ${PredictionSetStatus.ACTIVE} AND p.endTime <= NOW() THEN 3
            WHEN p.setStatus = ${PredictionSetStatus.VOTING} THEN 4
            WHEN p.setStatus = ${PredictionSetStatus.FINALIZED} THEN 5
            ELSE 6
          END,
          ${filters.orderStr}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };

    const res = await selectAndCountQuery(this.getContext().mysql, sqlQuery, params, 'p.id');
    if (res.items.length) {
      res.items = res?.items?.map((x: any) => ({
        ...x,
        outcomes: JSON.parse(x.outcomes)
      }));
    }
    return res;
  }

  /**
   * Returns prediction set chance history.
   *
   * @param query Chance history query filter.
   * @returns Array of chance history.
   */
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
