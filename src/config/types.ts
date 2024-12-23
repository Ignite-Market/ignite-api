export enum AppEnvironment {
  LOCAL_DEV = 'local',
  TEST = 'test',
  DEV = 'development',
  STG = 'staging',
  PROD = 'production',
}

export enum DbTables {
  USER = 'user',
  JOB = 'job',
  WORKER_LOG = 'workerLog',
}

/**
 * Validation error codes - 422_00_000.
 */
export enum ValidatorErrorCode {
  DEFAULT_VALIDATION_ERROR = 422_00_000,
  TOKEN_NOT_PRESENT = 422_00_001,
  USER_ID_NOT_PRESENT = 422_00_101,
  STATUS_NOT_PRESENT = 422_00_104,
  TYPE_NOT_PRESENT = 422_00_105,
}

/**
 * Resource not found error codes - 404_00_000.
 */
export enum ResourceNotFoundErrorCode {
  DEFAULT_RESOURCE_NOT_FOUND_ERROR = 404_00_000,
  USER_DOES_NOT_EXISTS = 404_00_001,
}

/**
 * Conflict error codes - 409_00_000.
 */
export enum ConflictErrorCode {
  DEFAULT_CONFLICT_ERROR = 409_00_000,
}

/**
 * Bad request error codes - 400_00_000.
 */
export enum BadRequestErrorCode {
  DEFAULT_BAD_REQUEST_ERROR = 400_00_000,
}

/**
 * System Error codes - 500_00_000.
 */
export enum SystemErrorCode {
  DEFAULT_SYSTEM_ERROR = 500_00_000,
  UNHANDLED_SYSTEM_ERROR = 500_00_001,
  SQL_SYSTEM_ERROR = 500_00_002,
  AWS_SYSTEM_ERROR = 500_00_003,
  MICROSERVICE_SYSTEM_ERROR = 500_00_004,
}

/**
 * Unauthorized error codes - 401000.
 */
export enum UnauthorizedErrorCode {
  UNAUTHORIZED = 401_00_000,
  INVALID_TOKEN = 401_00_001,
  INVALID_SIGNATURE = 401_00_002,
}

/**
 * Model error codes
 */
export enum ErrorCode {
  STATUS_NOT_PRESENT = 422_00_100,
  INVALID_STATUS = 422_00_101,
  ERROR_WRITING_TO_DATABASE = 500_00_001,
  ERROR_READING_FROM_DATABASE = 500_00_002,
  SERVICE_ERROR = 500_00_100,
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
  SERVICE = 'service',
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
  LOGGER = 'logger',
}

/**
 * DTO validation strategies.
 */
export enum ValidateFor {
  BODY = 'body',
  QUERY = 'query',
}

export enum LogType {
  DB = 'DB',
  INFO = 'INFO',
  MSG = 'MSG',
  WARN = 'WARNING',
  ERROR = 'ERROR',
  ALERT = 'ALERT',
  VERBOSE = 'VERBOSE',
  DEBUG = 'DEBUG',
}

export enum LogLevel {
  DB_ONLY = 'db',
  NO_DB = 'no-db',
  DEBUG = 'debug',
  WARN = 'warning',
  ERROR_ONLY = 'error',
}

export enum SqlModelStatus {
  DRAFT = 1,
  ACTIVE = 5,
  DELETED = 9,
}

export enum PermissionType {
  READ = 'read',
  WRITE = 'write',
  EXECUTE = 'execute',
}
export enum PermissionLevel {
  NONE = 0,
  OWN = 1,
  ALL = 2,
}

export enum DefaultUserRole {
  // values should not overlap with api key roles!!!

  // Admin roles
  ADMIN = 1, // System's admin

  USER = 99, // user with access to platform (published features)
}

export enum CacheKeyTTL {
  EXTRA_SHORT = 10, // 10 s
  SHORT = 60, // 1 min
  DEFAULT = 5 * 60, // 5 min
  EXTENDED = 10 * 60, // 10 min
  LONG = 30 * 60, // 30 min
  EXTRA_LONG = 60 * 60, // 60 min
}

/**
 * JWT Token signing types.
 */
export enum JwtTokenType {
  // For regular login
  USER_LOGIN = 'user-login',
}
