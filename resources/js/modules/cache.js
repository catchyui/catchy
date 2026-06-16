/**
 * Catchy — Cache Module
 *
 * In-memory response cache with TTL-based invalidation.
 */

const cache = new Map();

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
    cache.set(url, { ...data, timestamp: Date.now() });
}

/**
 * Get the raw cache Map (for public API exposure).
 *
 * @returns {Map}
 */
export function getCache() {
    return cache;
}
