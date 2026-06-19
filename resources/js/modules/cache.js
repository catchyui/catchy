/**
 * Catchy — Cache Module
 *
 * In-memory response cache with TTL-based invalidation.
 */

const cache = new Map();
const MAX_CACHE_SIZE = 50;

/**
 * Get a cached response if it exists and is not expired.
 *
 * @param {string} url
 * @param {number} ttl - Cache TTL in milliseconds
 * @returns {Object|null}
 */
export function getCachedResponse(url, ttl) {
    const entry = cache.get(url);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > ttl) {
        cache.delete(url);
        return null;
    }

    return entry;
}

/**
 * Store a response in the cache.
 *
 * @param {string} url
 * @param {Object} data
 */
export function setCachedResponse(url, data) {
    if (cache.has(url)) {
        cache.delete(url);
    } else if (cache.size >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }
    cache.set(url, { ...data, timestamp: Date.now() });
}

/**
 * Clear the cache Map.
 */
export function clearCache() {
    cache.clear();
}

/**
 * Get the raw cache Map (for public API exposure).
 *
 * @returns {Map}
 */
export function getCache() {
    return cache;
}
