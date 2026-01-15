import mysql from 'mysql2/promise';

// MySQL connection pool (lazy initialization)
let mysqlPool = null;

// Cache TTL in seconds (default: 30 seconds)
const CACHE_TTL = parseInt(process.env.API_PROXY_CACHE_TTL) || 30;

// API Proxy Cache Status Enum
export const ApiProxyCacheStatus = {
  IN_FLIGHT: 1,
  COMPLETED: 2
};

// Get MySQL connection pool (lazy initialization)
export const getMysqlPool = () => {
  if (!mysqlPool && process.env.MYSQL_HOST) {
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 2, // Small pool for Lambda
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  }
  return mysqlPool;
};

// Acquire cache lock using INSERT (row-level locking)
// INSERT with status=IN_FLIGHT acts as the lock
// Automatically steals expired locks to prevent stale entries
// Returns { acquired: true } if lock acquired,
// { acquired: false } if another request has it (not expired),
// null if MySQL not configured
export const acquireCacheLock = async (cacheKey) => {
  const pool = getMysqlPool();
  if (!pool) {
    // MySQL not configured, fall back to in-memory (single instance only)
    return null;
  }

  try {
    // Try to INSERT a row with status=IN_FLIGHT
    // If duplicate key, use ON DUPLICATE KEY UPDATE to steal expired locks
    const lockTimeoutSeconds = 60; // Lock expires after 60 seconds
    await pool.execute(
      `INSERT INTO api_proxy_cache (cache_key, status, expires_at, locked_at, created_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         cache_key = IF(expires_at < NOW(), VALUES(cache_key), cache_key),
         status = IF(expires_at < NOW(), VALUES(status), status),
         expires_at = IF(expires_at < NOW(), DATE_ADD(NOW(), INTERVAL ? SECOND), expires_at),
         locked_at = IF(expires_at < NOW(), NOW(), locked_at),
         created_at = IF(expires_at < NOW(), NOW(), created_at)`,
      [cacheKey, ApiProxyCacheStatus.IN_FLIGHT, lockTimeoutSeconds, lockTimeoutSeconds]
    );

    // Verify lock ownership with explicit SELECT (more reliable than affectedRows)
    // affectedRows can be 0 even when we steal an expired lock if values happen to be the same
    const [rows] = await pool.execute(
      `SELECT expires_at >= NOW() AND status = ? AS lock_owned
       FROM api_proxy_cache
       WHERE cache_key = ?`,
      [ApiProxyCacheStatus.IN_FLIGHT, cacheKey]
    );

    const lockOwned = rows[0]?.lock_owned === 1;
    if (lockOwned) {
      // Check if we just acquired it (locked_at was just set) vs it was already held
      const [lockInfo] = await pool.execute(
        `SELECT locked_at >= DATE_SUB(NOW(), INTERVAL 1 SECOND) AS just_locked
         FROM api_proxy_cache
         WHERE cache_key = ?`,
        [cacheKey]
      );
      if (lockInfo[0]?.just_locked === 1) {
        console.log(`[MYSQL] Acquired lock for cache key: ${cacheKey.substring(0, 8)}...`);
      } else {
        console.log(`[MYSQL] Stole expired lock for cache key: ${cacheKey.substring(0, 8)}...`);
      }
      return { acquired: true };
    } else {
      // Lock is held by another active request (not expired)
      console.log(`[MYSQL] Lock already held for cache key: ${cacheKey.substring(0, 8)}...`);
      return { acquired: false };
    }
  } catch (error) {
    console.error('[MYSQL] Error acquiring lock:', error);
    // On error, return null to fall back to in-memory behavior
    return null;
  }
};

// Store result in MySQL for cross-instance sharing
// Updates the row from IN_FLIGHT to COMPLETED with the response data
export const storeResultInMysql = async (cacheKey, responseData, ttlSeconds = CACHE_TTL) => {
  const pool = getMysqlPool();
  if (!pool) {
    return; // MySQL not configured
  }

  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await pool.execute(
      `UPDATE api_proxy_cache 
       SET status = ?,
           response_data = ?,
           expires_at = ?,
           completed_at = NOW()
       WHERE cache_key = ?`,
      [ApiProxyCacheStatus.COMPLETED, JSON.stringify(responseData), expiresAt, cacheKey]
    );
    console.log(`[MYSQL] Stored result in MySQL for cache key: ${cacheKey.substring(0, 8)}...`);
  } catch (error) {
    console.error('[MYSQL] Error storing result in MySQL:', error);
    // Don't throw - cache is optional
  }
};

// Get result from MySQL cache (only returns completed results)
export const getResultFromMysql = async (cacheKey) => {
  const pool = getMysqlPool();
  if (!pool) {
    return null;
  }

  try {
    const [rows] = await pool.execute(
      `SELECT response_data, expires_at 
       FROM api_proxy_cache 
       WHERE cache_key = ? 
         AND status = ? 
         AND expires_at > NOW()`,
      [cacheKey, ApiProxyCacheStatus.COMPLETED]
    );

    if (rows.length > 0) {
      const data = JSON.parse(rows[0].response_data);
      console.log(`[MYSQL] Retrieved result from MySQL for cache key: ${cacheKey.substring(0, 8)}...`);
      return data;
    }
    return null;
  } catch (error) {
    console.error('[MYSQL] Error retrieving result from MySQL:', error);
    return null;
  }
};

// Clean up in-flight entry (e.g., when request fails)
export const cleanupInFlightEntry = async (cacheKey) => {
  const pool = getMysqlPool();
  if (!pool) {
    return;
  }

  try {
    await pool.execute('DELETE FROM api_proxy_cache WHERE cache_key = ?', [cacheKey]);
    console.log(`[MYSQL] Cleaned up in-flight entry for cache key: ${cacheKey.substring(0, 8)}...`);
  } catch (error) {
    console.error('[MYSQL] Error cleaning up in-flight entry:', error);
  }
};

// Wait for in-flight request to complete (poll MySQL cache for completed status)
// Uses exponential backoff to reduce database load
// getCachedResponse and setCachedResponse are passed as parameters to avoid circular dependency
export const waitForInFlightRequest = async (cacheKey, getCachedResponse, setCachedResponse, maxWaitTime = 5000) => {
  const startTime = Date.now();
  let pollInterval = 200; // Start with 200ms
  const maxPollInterval = 1000; // Cap at 1 seconds
  const initialDelay = 500; // Wait 500ms before first poll

  // Initial delay - most API calls complete quickly, so wait before first poll
  await new Promise((resolve) => setTimeout(resolve, initialDelay));

  while (Date.now() - startTime < maxWaitTime) {
    // Check MySQL first (shared across instances) - only returns completed results
    const mysqlResult = await getResultFromMysql(cacheKey);
    if (mysqlResult) {
      console.log(`[MYSQL] Found result in MySQL after waiting for: ${cacheKey.substring(0, 8)}...`);
      // Cache locally for faster access
      if (setCachedResponse) {
        setCachedResponse(cacheKey, mysqlResult);
      }
      return mysqlResult;
    }

    // Also check local cache (in case it was cached in this instance)
    if (getCachedResponse) {
      const cachedResponse = getCachedResponse(cacheKey);
      if (cachedResponse) {
        console.log(`[MYSQL] Found cached response after waiting for: ${cacheKey.substring(0, 8)}...`);
        return cachedResponse;
      }
    }

    // Exponential backoff with jitter to spread out queries
    // Backoff: 200ms -> 300ms -> 450ms -> 675ms -> 1012ms -> 1518ms -> 2000ms (capped)
    const jitter = pollInterval * 0.2 * (Math.random() * 2 - 1); // ±20% jitter
    await new Promise((resolve) => setTimeout(resolve, pollInterval + jitter));
    pollInterval = Math.min(pollInterval * 1.5, maxPollInterval);
  }

  throw new Error('Timeout waiting for in-flight request to complete');
};
