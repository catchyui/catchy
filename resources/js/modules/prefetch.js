/**
 * CatchyUI  Prefetch Module
 *
 * Class-based prefetching of same-origin links on hover or viewport intersection.
 */

import { getCachedResponse, setCachedResponse } from './cache.js';
import { decodeBase64Utf8, shouldIgnoreLink, emit } from './utils.js';

export class CatchyPrefetcher {
  constructor() {
    this.activeRequests = new Map();
    this.hoverTimeout = null;
    this.activePrefetchesCount = 0;
    this.maxConcurrentPrefetch = 3;
    this.prefetchQueue = [];
  }

  /**
   * Process the prefetch queue under concurrency control.
   */
  async processQueue(config, currentVersion) {
    if (this.activePrefetchesCount >= this.maxConcurrentPrefetch || this.prefetchQueue.length === 0) {
      return;
    }

    const { url, resolve, reject } = this.prefetchQueue.shift();
    this.activePrefetchesCount++;

    try {
      const result = await this.performPrefetch(url, config, currentVersion);
      resolve(result);
    } catch (e) {
      reject(e);
    } finally {
      this.activePrefetchesCount--;
      this.processQueue(config, currentVersion);
    }
  }

  /**
   * Actual prefetch network request.
   */
  async performPrefetch(url, config, currentVersion) {
    try {
      emit('prefetch-start', { url });
      const headers = { 'X-Catchy-Request': 'true' };
      if (currentVersion) {
        headers['X-Catchy-Version'] = currentVersion;
      }

      const response = await fetch(url, { headers });

      if (response.status === 409 || response.status === 429) {
        window.location.href = url;
        return null;
      }

      if (!response.ok) {
        emit('prefetch-end', { url, success: false });
        return null;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/html')) {
        emit('prefetch-end', { url, success: false });
        return null;
      }

      const html = await response.text();
      const version = response.headers.get('X-Catchy-Version') || '';

      const titleHeader = response.headers.get('X-Catchy-Title');
      let title = titleHeader ? decodeBase64Utf8(titleHeader) : '';

      const cacheEntry = {
        html,
        version,
        title,
        head: response.headers.get('X-Catchy-Head') || null,
        finalUrl: response.url || url,
      };

      setCachedResponse(url, cacheEntry);
      emit('prefetch-end', { url, success: true });
      return cacheEntry;
    } catch (e) {
      emit('prefetch-end', { url, success: false });
      return null;
    } finally {
      this.activeRequests.delete(url);
    }
  }

  /**
   * Triggers a background prefetch request.
   */
  prefetch(url, config, currentVersion) {
    const cached = getCachedResponse(url, config.cacheTTL);
    if (cached) return Promise.resolve(cached);

    if (this.activeRequests.has(url)) {
      return this.activeRequests.get(url);
    }

    const promise = new Promise((resolve, reject) => {
      this.prefetchQueue.push({ url, resolve, reject });
    });

    this.activeRequests.set(url, promise);
    this.processQueue(config, currentVersion);

    return promise;
  }

  /**
   * Set up event listeners for hover/mouseover prefetching.
   */
  initHover(config, prefetchFn) {
    if (!config.prefetch) return;

    document.addEventListener('mouseenter', (event) => {
      const link = event.target && typeof event.target.closest === 'function' ? event.target.closest('a') : null;
      if (!link || shouldIgnoreLink(link, null, config.ignoreAttribute)) return;

      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = setTimeout(() => {
        prefetchFn(link.href);
      }, config.prefetchDelay);
    }, true);

    document.addEventListener('mouseleave', (event) => {
      const link = event.target && typeof event.target.closest === 'function' ? event.target.closest('a') : null;
      if (!link) return;

      const relatedLink = event.relatedTarget && typeof event.relatedTarget.closest === 'function'
        ? event.relatedTarget.closest('a')
        : null;

      if (relatedLink === link) return;

      clearTimeout(this.hoverTimeout);
    }, true);
  }

  /**
   * Set up IntersectionObserver viewport prefetching.
   */
  initViewport(config, prefetchFn) {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const link = entry.target;
          if (link.href && !shouldIgnoreLink(link, null, config.ignoreAttribute)) {
            prefetchFn(link.href);
          }
          observer.unobserve(link);
        }
      });
    }, { rootMargin: '50px' });

    const observeLinks = (rootNode = document) => {
      const links = rootNode.querySelectorAll('a[data-catchy-prefetch="viewport"]');
      links.forEach(link => observer.observe(link));
    };

    observeLinks();

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'A' && node.getAttribute('data-catchy-prefetch') === 'viewport') {
              observer.observe(node);
            } else {
              observeLinks(node);
            }
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }
}

// Export singleton instance for direct module imports
export const prefetcherInstance = new CatchyPrefetcher();

// Maintain functional wrapper exports for backward compatibility & easy usage
export const getActiveRequests = () => prefetcherInstance.activeRequests;
export const prefetch = (url, config, currentVersion) => prefetcherInstance.prefetch(url, config, currentVersion);
export const initHoverPrefetch = (config, prefetchFn) => prefetcherInstance.initHover(config, prefetchFn);
export const initViewportPrefetch = (config, prefetchFn) => prefetcherInstance.initViewport(config, prefetchFn);
