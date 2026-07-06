/**
 * Catchy — Prefetch Module
 *
 * Hover and viewport-based prefetching of same-origin links.
 */

import { getCachedResponse, setCachedResponse } from './cache.js';
import { decodeBase64Utf8, shouldIgnoreLink } from './utils.js';

const activeRequests = new Map();
let hoverTimeout = null;
let activePrefetchesCount = 0;
const MAX_CONCURRENT_PREFETCH = 3;
const prefetchQueue = [];

/**
 * Get the active requests map (for awaiting in-flight prefetches).
 *
 * @returns {Map}
 */
export function getActiveRequests() {
 return activeRequests;
}

/**
 * Helper to process the prefetch queue.
 */
async function processQueue(config, currentVersion) {
 if (activePrefetchesCount >= MAX_CONCURRENT_PREFETCH || prefetchQueue.length === 0) {
 return;
 }

 const { url, resolve, reject } = prefetchQueue.shift();
 activePrefetchesCount++;

 try {
 const result = await performPrefetch(url, config, currentVersion);
 resolve(result);
 } catch (e) {
 reject(e);
 } finally {
 activePrefetchesCount--;
 processQueue(config, currentVersion);
 }
}

/**
 * Actual network fetching.
 */
async function performPrefetch(url, config, currentVersion) {
 try {
 const headers = { 'X-Catchy-Request': 'true' };
 if (currentVersion) {
 headers['X-Catchy-Version'] = currentVersion;
 }

 const response = await fetch(url, { headers });

 if (response.status === 409 || response.status === 429) {
 window.location.href = url;
 return null;
 }

 if (!response.ok) return null;

 const contentType = response.headers.get('content-type');
 if (!contentType || !contentType.includes('text/html')) return null;

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
 return cacheEntry;
 } catch (e) {
 return null;
 } finally {
 activeRequests.delete(url);
 }
}

/**
 * Performs background prefetch for same-origin links.
 *
 * @param {string} url
 * @param {Object} config
 * @param {string} currentVersion
 * @returns {Promise<Object|null>}
 */
export function prefetch(url, config, currentVersion) {
 const cached = getCachedResponse(url, config.cacheTTL);
 if (cached) return Promise.resolve(cached);

 if (activeRequests.has(url)) {
 return activeRequests.get(url);
 }

 const promise = new Promise((resolve, reject) => {
 prefetchQueue.push({ url, resolve, reject });
 });

 activeRequests.set(url, promise);
 processQueue(config, currentVersion);

 return promise;
}

/**
 * Initialize hover-based prefetching.
 *
 * @param {Object} config
 * @param {Function} prefetchFn
 */
export function initHoverPrefetch(config, prefetchFn) {
 if (!config.prefetch) return;

 document.addEventListener('mouseenter', (event) => {
 const link = event.target && typeof event.target.closest === 'function' ? event.target.closest('a') : null;
 if (!link || shouldIgnoreLink(link, null, config.ignoreAttribute)) return;

 clearTimeout(hoverTimeout);
 hoverTimeout = setTimeout(() => {
 prefetchFn(link.href);
 }, config.prefetchDelay);
 }, true);

 document.addEventListener('mouseleave', (event) => {
 const link = event.target && typeof event.target.closest === 'function' ? event.target.closest('a') : null;
 if (link) clearTimeout(hoverTimeout);
 }, true);
}

/**
 * Initialize viewport-based (IntersectionObserver) prefetching.
 *
 * @param {Object} config
 * @param {Function} prefetchFn
 */
export function initViewportPrefetch(config, prefetchFn) {
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
