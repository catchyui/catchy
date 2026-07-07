/**
 * CatchyUI  Cache Module
 *
 * Class-based in-memory response cache with TTL-based invalidation.
 */

export class CatchyCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 50;
  }

  /**
   * Get a cached response if it exists and is not expired.
   *
   * @param {string} url
   * @param {number} ttl
   * @returns {Object|null}
   */
  get(url, ttl) {
    const entry = this.cache.get(url);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(url);
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
  set(url, data) {
    if (this.cache.has(url)) {
      this.cache.delete(url);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(url, { ...data, timestamp: Date.now() });
  }

  /**
   * Clear the cache.
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get the raw cache Map.
   *
   * @returns {Map}
   */
  getRaw() {
    return this.cache;
  }
}

// Export singleton instance for direct module imports
export const cacheInstance = new CatchyCache();

// Maintain functional wrapper exports for backward compatibility & easy usage
export const getCachedResponse = (url, ttl) => cacheInstance.get(url, ttl);
export const setCachedResponse = (url, data) => cacheInstance.set(url, data);
export const clearCache = () => cacheInstance.clear();
export const getCache = () => cacheInstance.getRaw();
