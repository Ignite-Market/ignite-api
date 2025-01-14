/**
 * Application environment types.
 */
export enum AppEnvironment {
  LOCAL_DEV = 'local',
  TEST = 'test',
  DEV = 'development',
  STG = 'staging',
  PROD = 'production'
}

/**
 * Database table names.
 */
export enum DbTables {
  JOB = 'job',
  WORKER_LOG = 'worker_log',
  USER = 'user',
  ROLE = 'role',
  USER_ROLE = 'user_role',
  PREDICTION_SET = 'prediction_set',
  DATA_SOURCE = 'data_source',
  PREDICTION_SET_DATA_SOURCE = 'prediction_set_data_source',
  OUTCOME = 'outcome',
  COMMENT = 'comment',
  PREDICTION_SET_ATTESTATION = 'prediction_set_attestation'
}
/**
 * Validation error codes - 422_00_000.
 */
export enum ValidatorErrorCode {
  DEFAULT_VALIDATION_ERROR = 422_00_000,
  TOKEN_NOT_PRESENT = 422_00_001,
  USER_ID_NOT_PRESENT = 422_00_002,
  STATUS_NOT_PRESENT = 422_00_003,
  TYPE_NOT_PRESENT = 422_00_004,
  WALLET_LOGIN_DTO_ADDRESS_NOT_PRESENT = 422_00_005,
  WALLET_LOGIN_DTO_SIGNATURE_NOT_PRESENT = 422_00_006,
  WALLET_LOGIN_DTO_TIMESTAMP_NOT_PRESENT = 422_00_007,
  PREDICTION_SET_QUESTION_NOT_PRESENT = 422_00_008,
  PREDICTION_SET_DESCRIPTION_NOT_PRESENT = 422_00_009,
  PREDICTION_SET_GENERAL_RESOLUTION_NOT_PRESENT = 422_00_010,
  PREDICTION_SET_OUTCOME_RESOLUTION_NOT_PRESENT = 422_00_011,
  PREDICTION_SET_OUTCOME_PRICE_NOT_PRESENT = 422_00_012,
  PREDICTION_SET_START_TIME_NOT_PRESENT = 422_00_013,
  PREDICTION_SET_END_TIME_NOT_PRESENT = 422_00_014,
  PREDICTION_SET_RESOLUTION_TIME_NOT_PRESENT = 422_00_015,
  PREDICTION_SET_DTO_DATA_SOURCE_IDS_NOT_PRESENT = 422_00_016,
  PREDICTION_SET_DTO_PREDICTION_OUTCOMES_NOT_PRESENT = 422_00_017,
  PREDICTION_SET_DTO_PREDICTION_OUTCOMES_NOT_VALID = 422_00_018,
  OUTCOME_NAME_NOT_PRESENT = 422_00_019,
  PREDICTION_SET_INITIAL_POOL_NOT_PRESENT = 422_00_020,
  COMMENT_PREDICTION_SET_ID_NOT_PRESENT = 422_00_021,
  COMMENT_CONTENT_NOT_PRESENT = 422_00_022,
  USER_PROFILE_DTO_USERNAME_NOT_PRESENT = 422_00_023,
  USER_EMAIL_NOT_VALID = 422_00_024,
  USER_EMAIL_NOT_PRESENT = 422_00_025,
  USER_EMAIL_ALREADY_TAKEN = 422_00_026,
  PREDICTION_SET_CONSENSUS_THRESHOLD_NOT_PRESENT = 422_00_027
}

/**
 * Authorization error codes - 403_00_000.
 */
export enum AuthorizationErrorCode {
  DEFAULT_AUTHORIZATION_ERROR = 403_00_000,
  NOT_AUTHORIZED_TO_AUTHENTICATE = 403_00_001,
  INSUFFICIENT_ROLES = 403_00_002,
  NOT_AUTHORIZED_TO_READ_USER = 403_00_003,
  OWNERSHIP_MISMATCH = 403_00_004
}

/**
 * Resource not found error codes - 404_00_000.
 */
export enum ResourceNotFoundErrorCode {
  DEFAULT_RESOURCE_NOT_FOUND_ERROR = 404_00_000,
  USER_DOES_NOT_EXISTS = 404_00_001,
  DATA_SOURCE_DOES_NOT_EXISTS = 404_00_002,
  PREDICTION_SET_DOES_NOT_EXISTS = 404_00_003,
  COMMENT_DOES_NOT_EXISTS = 404_00_004
}

/**
 * Conflict error codes - 409_00_000.
 */
export enum ConflictErrorCode {
  DEFAULT_CONFLICT_ERROR = 409_00_000
}

/**
 * Bad request error codes - 400_00_000.
 */
export enum BadRequestErrorCode {
  DEFAULT_BAD_REQUEST_ERROR = 400_00_000,
  INVALID_PREDICTION_SET_STATUS = 400_00_001,
  INVALID_NUMBER_OF_PREDICTION_SET_DATA_SOURCES = 400_00_002
}

/**
 * System Error codes - 500_00_000.
 */
export enum SystemErrorCode {
  DEFAULT_SYSTEM_ERROR = 500_00_000,
  UNHANDLED_SYSTEM_ERROR = 500_00_001,
  SQL_SYSTEM_ERROR = 500_00_002,
  AWS_SYSTEM_ERROR = 500_00_003,
  MICROSERVICE_SYSTEM_ERROR = 500_00_004
}

/**
 * Unauthorized error codes - 401000.
 */
export enum UnauthorizedErrorCode {
  UNAUTHORIZED = 401_00_000,
  INVALID_TOKEN = 401_00_001,
  INVALID_SIGNATURE = 401_00_002
}

/**
 * Model error codes.
 */
export enum ErrorCode {
  STATUS_NOT_PRESENT = 422_00_100,
  INVALID_STATUS = 422_00_101,
  ERROR_WRITING_TO_DATABASE = 500_00_001,
  ERROR_READING_FROM_DATABASE = 500_00_002,
  SERVICE_ERROR = 500_00_100
}

/**
 * Model population strategies.
 */
export enum PopulateFrom {
  PUBLIC = 'public',
  USER = 'user',
  DB = 'db',
  DUPLICATE = 'duplicate',
  ADMIN = 'admin',
  WORKER = 'worker',
  AUTH = 'auth',
  SERVICE = 'service'
}

/**
 * Model serialization strategies.
 */
export enum SerializeFor {
  PUBLIC = 'public',
  USER = 'user',
  INSERT_DB = 'insert_db',
  UPDATE_DB = 'update_db',
  SELECT_DB = 'select_db',
  ADMIN = 'admin',
  WORKER = 'worker',
  SERVICE = 'service',
  LOGGER = 'logger'
}

/**
 * DTO validation strategies.
 */
export enum ValidateFor {
  BODY = 'body',
  QUERY = 'query'
}

/**
 * Log types.
 */
export enum LogType {
  DB = 'DB',
  INFO = 'INFO',
  MSG = 'MSG',
  WARN = 'WARNING',
  ERROR = 'ERROR',
  ALERT = 'ALERT',
  VERBOSE = 'VERBOSE',
  DEBUG = 'DEBUG'
}

/**
 * Log levels.
 */
export enum LogLevel {
  DB_ONLY = 'db',
  NO_DB = 'no-db',
  DEBUG = 'debug',
  WARN = 'warning',
  ERROR_ONLY = 'error'
}

/**
 * SQL model status.
 */
export enum SqlModelStatus {
  DRAFT = 1,
  ACTIVE = 5,
  DELETED = 9
}

/**
 * Default user roles.
 */
export enum DefaultUserRole {
  ADMIN = 1, // System's admin.
  USER = 2 // User with access to platform.
}

/**
 * Cache key TTLs.
 */
export enum CacheKeyTTL {
  EXTRA_SHORT = 10, // 10 s
  SHORT = 60, // 1 min
  DEFAULT = 5 * 60, // 5 min
  EXTENDED = 10 * 60, // 10 min
  LONG = 30 * 60, // 30 min
  EXTRA_LONG = 60 * 60 // 60 min
}

/**
 * JWT Token signing types.
 */
export enum JwtTokenType {
  USER_LOGIN = 'user-login'
}
