import { waitForInFlightRequest } from './mysql-cache.mjs';

// Cache TTL in seconds (default: 30 seconds)
const CACHE_TTL = parseInt(process.env.API_PROXY_CACHE_TTL) || 30;

// Maximum number of cache entries (default: 50)
// Prevents memory exhaustion with many unique requests
const MAX_CACHE_ENTRIES = parseInt(process.env.API_PROXY_MAX_CACHE_ENTRIES) || 50;

// Maximum response size to cache in bytes (default: 2MB)
// Prevents caching extremely large responses that could cause memory issues
const MAX_CACHE_RESPONSE_SIZE = parseInt(process.env.API_PROXY_MAX_CACHE_SIZE) || 2 * 1024 * 1024;

// Maximum total cache memory in bytes (default: 30MB)
// Conservative limit to leave room for Lambda runtime (~30-50MB), code (~10-20MB), and request handling
// Set to ~25% of 128MB Lambda memory to be safe
const MAX_TOTAL_CACHE_MEMORY = parseInt(process.env.API_PROXY_MAX_TOTAL_CACHE_MEMORY) || 30 * 1024 * 1024;

// Simple in-memory cache with TTL and LRU eviction (using only built-in Node.js modules)
const cache = new Map();
// Track access order for LRU eviction
const accessOrder = [];
// Track total estimated memory usage
let totalCacheMemory = 0;
// Counter for periodic cleanup (cleanup every N operations to avoid performance impact)
let operationCount = 0;
const CLEANUP_FREQUENCY = 10; // Clean up every 10 cache operations

// Track in-flight requests locally (per Lambda instance)
// Key: cacheKey, Value: Promise that resolves when the request completes
// Only one request per cache key polls MySQL; others wait on this local promise
const inFlightRequests = new Map();

// Estimate response size in bytes (rough approximation)
const estimateResponseSize = (responseData) => {
  try {
    return JSON.stringify(responseData).length;
  } catch {
    // Fallback: estimate based on body length
    return (responseData.body || '').length;
  }
};

// Clean expired cache entries on-demand (Lambda-friendly)
// This is called during cache operations to avoid background intervals
const cleanupExpiredEntries = () => {
  const now = Date.now();
  const keysToDelete = [];

  for (const [key, value] of cache.entries()) {
    if (now > value.expiresAt) {
      keysToDelete.push(key);
    }
  }

  // Remove expired entries from both cache and access order
  keysToDelete.forEach((key) => {
    const entry = cache.get(key);
    if (entry) {
      const entrySize = estimateResponseSize(entry.data);
      totalCacheMemory -= entrySize;
    }
    cache.delete(key);
    const index = accessOrder.indexOf(key);
    if (index > -1) {
      accessOrder.splice(index, 1);
    }
  });

  if (keysToDelete.length > 0) {
    console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
  }
};

// Get cached response if available and not expired
export const getCachedResponse = (key) => {
  // Periodic cleanup (Lambda-friendly, no background intervals)
  operationCount++;
  if (operationCount % CLEANUP_FREQUENCY === 0) {
    cleanupExpiredEntries();
  }

  const cached = cache.get(key);
  if (!cached) {
    return null;
  }

  const now = Date.now();
  if (now > cached.expiresAt) {
    // Remove from memory tracking
    const entrySize = estimateResponseSize(cached.data);
    totalCacheMemory -= entrySize;

    cache.delete(key);
    // Remove from access order
    const index = accessOrder.indexOf(key);
    if (index > -1) {
      accessOrder.splice(index, 1);
    }
    return null;
  }

  // Update access order for LRU (move to end)
  const index = accessOrder.indexOf(key);
  if (index > -1) {
    accessOrder.splice(index, 1);
  }
  accessOrder.push(key);

  return cached.data;
};

// Store response in cache with size limits and LRU eviction
export const setCachedResponse = (key, data) => {
  // Check if response is too large to cache
  const estimatedSize = estimateResponseSize(data);
  if (estimatedSize > MAX_CACHE_RESPONSE_SIZE) {
    console.log(`Skipping cache for large response: ${estimatedSize} bytes (max: ${MAX_CACHE_RESPONSE_SIZE})`);
    return;
  }

  // Evict oldest entries until we have room (by count or memory)
  while (cache.size >= MAX_CACHE_ENTRIES || (totalCacheMemory + estimatedSize > MAX_TOTAL_CACHE_MEMORY && cache.size > 0)) {
    // Remove oldest entry (first in access order)
    const oldestKey = accessOrder.shift();
    if (oldestKey) {
      const oldestEntry = cache.get(oldestKey);
      if (oldestEntry) {
        const oldestSize = estimateResponseSize(oldestEntry.data);
        totalCacheMemory -= oldestSize;
      }
      cache.delete(oldestKey);
      console.log(`Evicted oldest cache entry (entries: ${cache.size}, memory: ${Math.round(totalCacheMemory / 1024 / 1024)}MB)`);
    } else {
      break; // No more entries to evict
    }
  }

  // Check if we still don't have enough room after eviction
  if (totalCacheMemory + estimatedSize > MAX_TOTAL_CACHE_MEMORY) {
    console.log(
      `Skipping cache: would exceed memory limit (current: ${Math.round(totalCacheMemory / 1024 / 1024)}MB, adding: ${Math.round(estimatedSize / 1024 / 1024)}MB, max: ${Math.round(MAX_TOTAL_CACHE_MEMORY / 1024 / 1024)}MB)`
    );
    return;
  }

  const expiresAt = Date.now() + CACHE_TTL * 1000;
  cache.set(key, { data, expiresAt });
  totalCacheMemory += estimatedSize;

  // Add to end of access order (most recently used)
  accessOrder.push(key);
};

// Wait for in-flight request with local deduplication
// Only one request per cache key polls MySQL; others wait on local promise
// This dramatically reduces database load when multiple requests in the same Lambda instance wait
export const waitForInFlightRequestLocal = async (cacheKey) => {
  // Check if there's already a local in-flight request
  if (inFlightRequests.has(cacheKey)) {
    console.log(`[LOCAL] Waiting on existing in-flight request for: ${cacheKey.substring(0, 8)}...`);
    return await inFlightRequests.get(cacheKey);
  }

  // We're the first waiter - create promise and become the poller
  console.log(`[LOCAL] Becoming poller for: ${cacheKey.substring(0, 8)}...`);
  const promise = (async () => {
    try {
      // Poll MySQL (only one poller per instance)
      // Pass getCachedResponse and setCachedResponse to avoid circular dependency
      const pollPromise = waitForInFlightRequest(cacheKey, getCachedResponse, setCachedResponse);

      // Add timeout to prevent hanging forever if MySQL stalls or Lambda freezes
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for in-flight request')), 6000));

      const result = await Promise.race([pollPromise, timeoutPromise]);
      return result;
    } catch (error) {
      // Re-throw error so all waiters see it
      throw error;
    } finally {
      // Clean up - remove from map when done (success or failure)
      inFlightRequests.delete(cacheKey);
    }
  })();

  // Store promise for other waiters
  inFlightRequests.set(cacheKey, promise);
  return promise;
};
