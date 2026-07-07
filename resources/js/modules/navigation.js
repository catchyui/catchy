/**
 * Catchy  Navigation Module
 *
 * Core visit() function for SPA page transitions.
 * Fully refactored to support SWR caching, targeted element reloads,
 * advanced scroll restoration, lifecycle event hooks, and optimistic UI class toggling.
 */

import { decodeBase64Utf8, emit, executeScriptsInContainer, focusAutofocusElements, executeCallback } from './utils.js';
import { getCachedResponse, setCachedResponse, clearCache } from './cache.js';
import { startLoading, stopLoading, resetLoading } from './loader.js';
import { mergeHead, mergeHeadFromHeader } from './head-merge.js';
import { xhrRequest } from './forms.js';
import { getActiveRequests } from './prefetch.js';
import { resolveModal, resolveOffcanvas, handleLifecycleTriggers } from './events.js';

export class CatchyRouter {
  constructor() {
    this.currentVersion = '';
    this.activeAbortController = null;
  }

  getCurrentVersion() {
    return this.currentVersion;
  }

  setCurrentVersion(version) {
    this.currentVersion = version;
  }
}

export const routerInstance = new CatchyRouter();

export const getCurrentVersion = () => routerInstance.getCurrentVersion();
export const setCurrentVersion = (version) => routerInstance.setCurrentVersion(version);

/**
 * Fetch a page and update the DOM container via Alpine.morph.
 *
 * @param {string} url
 * @param {Object} options
 * @param {boolean} updateHistory
 * @param {Object} config
 * @param {Object} Alpine
 */
export async function visit(url, options = {}, updateHistory = true, config = {}, Alpine = null) {
 if (navigator.onLine === false) {
 emit('flash', { message: 'Cannot navigate. You are currently offline.', type: 'warning' });
 return;
 }

 // Abort any active visit/fetch in progress to prevent page overlapping & race conditions
 if (routerInstance.activeAbortController) {
 routerInstance.activeAbortController.abort();
 }
 routerInstance.activeAbortController = new AbortController();
 const { signal } = routerInstance.activeAbortController;

 const oldPathname = window.location.pathname;

 // Cache current scroll coordinates before navigating away
 try {
 window.history.replaceState({
 ...window.history.state,
 scrollX: window.scrollX,
 scrollY: window.scrollY
 }, '');
 } catch (e) {}

 const trigger = options.trigger || document;

 // 1. Dispatch catchy:before-visit event, cancel if prevented by user
 if (!emit('before-visit', { url, options, trigger }, trigger, { cancelable: true })) {
 return;
 }

 if (executeCallback(trigger, 'data-catchy-beforesend', { url, options, trigger }) === false) {
 return;
 }

 if (!emit('start', { url, options, trigger }, trigger, { cancelable: true })) {
 return;
 }

 // 2. Optimistic UI Updates / Spinner Loader
 const submitBtn = setupSubmitSpinner(trigger);
 const optimisticClasses = trigger && typeof trigger.getAttribute === 'function'
 ? trigger.getAttribute('data-catchy-optimistic-class')
 : null;

 if (optimisticClasses && trigger) {
 trigger.classList.add(...optimisticClasses.split(' ').filter(Boolean));
 }

 const cleanUpUi = () => {
 restoreSubmitButton(submitBtn);
 if (optimisticClasses && trigger) {
 trigger.classList.remove(...optimisticClasses.split(' ').filter(Boolean));
 }
 };

 const isGet = !options.method || options.method.toUpperCase() === 'GET';
 const targetId = getTargetContainerId(trigger, options, config);

 // 3. Stale-While-Revalidate (SWR) Cache check
 const cached = isGet && config.swr ? getCachedResponse(url, config.cacheTTL) : null;

 if (cached) {
 try {
 renderResponseData(cached, targetId, config, Alpine, trigger, false);
 applyScroll(trigger, targetId, cached.finalUrl, oldPathname, options, config);

 if (updateHistory) {
 manageHistory(cached.finalUrl, trigger, isGet, null);
 }

 cleanUpUi();
 emit('end', { url: cached.finalUrl, trigger, fromCache: true }, trigger);
 emit('after-visit', { url: cached.finalUrl, trigger, fromCache: true }, trigger);
 } catch (e) {
 console.error('Catchy: SWR instant render failed, falling back to network.', e);
 }

 // Revalidate silently in the background, passing the original updateHistory and isRevalidation = true
 fetchFreshContent(url, options, targetId, config, Alpine, trigger, cleanUpUi, updateHistory, true, signal);
 return;
 }

 // No SWR cache found -> Full fetch visit
 startLoading();
 fetchFreshContent(url, options, targetId, config, Alpine, trigger, cleanUpUi, updateHistory, false, signal);
}

/**
 * Perform network request to fetch fresh HTML page.
 */
async function fetchFreshContent(url, options, targetId, config, Alpine, trigger, cleanUpUi, updateHistory, isRevalidation = false, signal = null) {
 const isGet = !options.method || options.method.toUpperCase() === 'GET';
 const oldPathname = window.location.pathname;

 try {
 let response = null;

 // Check if there is an active prefetch running for this URL
 const activeRequests = getActiveRequests();
 let responseData = null;
 if (isGet && activeRequests.has(url)) {
 responseData = await activeRequests.get(url);
 }

 let html, finalUrl, version, headContent, title;

 if (responseData) {
 html = responseData.html;
 finalUrl = responseData.finalUrl;
 version = responseData.version;
 headContent = responseData.head || null;
 title = responseData.title || '';
 } else {
 // Setup headers, appending dynamic targets
 const fetchHeaders = {
 ...(options.headers || {}),
 'X-Catchy-Request': 'true',
 'X-Catchy-Target': targetId
 };
 if (routerInstance.currentVersion) {
 fetchHeaders['X-Catchy-Version'] = routerInstance.currentVersion;
 }

 const fetchOptions = { ...options, headers: fetchHeaders, signal };

 if (options.method && options.method.toUpperCase() !== 'GET') {
 response = await xhrRequest(url, fetchOptions);
 } else {
 response = await fetch(url, fetchOptions);
 }

 if (response.status === 409) {
 window.location.href = url;
 return;
 }

 if (response.status === 419) {
 window.location.reload();
 return;
 }

 if (!response.ok) {
 const isHtml = response.headers.get('content-type')?.includes('text/html');
 if (isHtml) {
 const htmlText = await response.text();
 if (config.debug) {
 showErrorModal(htmlText);
 cleanUpUi();
 stopLoading();
 return;
 } else {
 window.location.href = response.url || url;
 return;
 }
 }

 handleFetchError(response, trigger);
 throw new Error(`Catchy: Request failed with status ${response.status}`);
 }

 if (!isGet) {
   clearCache();
 }

 const redirectUrl = response.headers.get('X-Catchy-Redirect');
 if (redirectUrl) {
 
 handleRedirect(redirectUrl, trigger, config, Alpine, updateHistory);
 return;
 }

 const contentType = response.headers.get('content-type');
 if (!contentType || !contentType.includes('text/html')) {
 window.location.href = response.url || url;
 return;
 }

 html = await response.text();
 finalUrl = response.url || url;
 version = response.headers.get('X-Catchy-Version') || '';
 headContent = response.headers.get('X-Catchy-Head') || null;

 

 const titleHeader = response.headers.get('X-Catchy-Title');
 title = titleHeader ? decodeBase64Utf8(titleHeader) : '';
 }

 const flashHeader = response ? response.headers.get('X-Catchy-Flash') : null;
  const dataToRender = { html, version, title, head: headContent, finalUrl, flash: flashHeader };

 if (isGet) {
 setCachedResponse(url, dataToRender);
 }

 if (version) routerInstance.currentVersion = version;
 if (routerInstance.activeAbortController && routerInstance.activeAbortController.signal === signal) {
 routerInstance.activeAbortController = null;
 }

 if (signal && signal.aborted) return;
 if (isRevalidation) {
   try {
     const currentUrlObj = new URL(window.location.href);
     const targetUrlObj = new URL(finalUrl, window.location.href);
     if (currentUrlObj.pathname !== targetUrlObj.pathname || currentUrlObj.search !== targetUrlObj.search) {
       return;
     }
   } catch (e) {
     return;
   }
 }

 // Render fresh updates
 renderResponseData(dataToRender, targetId, config, Alpine, trigger, isRevalidation);

 if (updateHistory && !isRevalidation) {
 manageHistory(finalUrl, trigger, isGet, response);
 }

 // Skip scroll restoration and lifecycle events on background SWR revalidation
 if (!isRevalidation) {
 applyScroll(trigger, targetId, finalUrl, oldPathname, options, config);

 stopLoading();
 executeCallback(trigger, 'data-catchy-success', { url: finalUrl, trigger });
 handleLifecycleTriggers(trigger, 'success');
 cleanUpUi();

 emit('end', { url: finalUrl, trigger }, trigger);
 emit('after-visit', { url: finalUrl, trigger }, trigger);
 } else {
 // Silent revalidation: just stop loading without emitting events
 stopLoading();
 cleanUpUi();
 }

 } catch (error) {
 if (error.name === 'AbortError') {
 // Silently ignore aborted requests from concurrency guards
 return;
 }
 resetLoading();
 cleanUpUi();
 console.error('Catchy: AJAX request error, falling back to full load.', error);

 executeCallback(trigger, 'data-catchy-error', { url, error, trigger });
 handleLifecycleTriggers(trigger, 'error');
 emit('error', { url, error, trigger }, trigger);

 if (isGet) {
 window.location.href = url;
 }
 }
}

/**
 * Render HTML fragment, handling Modals, Offcanvas, and standard morphing.
 */
function renderResponseData(data, targetId, config, Alpine, trigger, isRevalidation = false) {
 if (data.title) {
 document.title = data.title;
 }

 if (data.head) {
 mergeHeadFromHeader(data.head);
 }

 const parser = new DOMParser();
 const doc = parser.parseFromString(data.html, 'text/html');

 if (doc.head) {
 mergeHead(doc.head);
 }

 const isModalTarget = trigger && typeof trigger.hasAttribute === 'function' && (trigger.hasAttribute('data-catchy-modal') || trigger.hasAttribute('catchy-modal'));
 if (isModalTarget) {
 const incomingContent = doc.getElementById(targetId) || doc.getElementById(config.containerId) || doc.body;
 const modal = resolveModal(trigger);
 if (modal) {
 emit('modal-load', { html: incomingContent.innerHTML, title: doc.title || '' }, modal);
 emit('modal-open', {}, modal);
      if (data.flash) {
        processFlashHeader({ headers: { get: (name) => name.toLowerCase() === 'x-catchy-flash' ? data.flash : null } }, trigger);
      }
      return;
 }
 }

 const isOffcanvasTarget = trigger && typeof trigger.hasAttribute === 'function' && (trigger.hasAttribute('data-catchy-offcanvas') || trigger.hasAttribute('catchy-offcanvas'));
 if (isOffcanvasTarget) {
 const incomingContent = doc.getElementById(targetId) || doc.getElementById(config.containerId) || doc.body;
 const offcanvas = resolveOffcanvas(trigger);
 if (offcanvas) {
 emit('offcanvas-load', { html: incomingContent.innerHTML, title: doc.title || '' }, offcanvas);
 emit('offcanvas-open', {}, offcanvas);
      if (data.flash) {
        processFlashHeader({ headers: { get: (name) => name.toLowerCase() === 'x-catchy-flash' ? data.flash : null } }, trigger);
      }
      return;
 }
 }

 const isTriggerInOffcanvas = trigger && typeof trigger.closest === 'function' && (trigger.closest('[catchy-offcanvas]') || trigger.closest('#catchy-offcanvas'));
 const isFormPost = trigger && trigger.tagName === 'FORM' && trigger.getAttribute('method')?.toUpperCase() !== 'GET';
 if (isTriggerInOffcanvas && isFormPost) {
 const offcanvas = resolveOffcanvas(trigger);
 if (offcanvas) emit('offcanvas-close', {}, offcanvas);
 }

 const isTriggerInModal = trigger && typeof trigger.closest === 'function' && (trigger.closest('[catchy-modal]') || trigger.closest('#catchy-modal'));
 if (isTriggerInModal && isFormPost) {
 const modal = resolveModal(trigger);
 if (modal) emit('modal-close', {}, modal);
 }

 // Standard DOM Morphing target
 const appContainer = document.getElementById(targetId);
 if (!appContainer) {
 window.location.href = data.finalUrl;
 return;
 }

 const incomingApp = doc.getElementById(targetId) || doc.getElementById(config.containerId);
 if (!incomingApp) {
 window.location.href = data.finalUrl;
 return;
 }

 // Emit catchy:before-morph
 emit('before-morph', { url: data.finalUrl, element: appContainer, trigger }, trigger);
 emit('morphing', { url: data.finalUrl, html: data.html, element: appContainer, trigger }, trigger);

 if (!Alpine.morph) {
 console.error('Catchy: Alpine.morph is not defined. Ensure @alpinejs/morph is loaded.');
 window.location.href = data.finalUrl;
 return;
 }

 // Extract Out-of-Band (OOB) elements before morph
 const oobElements = doc.querySelectorAll('[data-catchy-swap-oob], [catchy-swap-oob]');

 // Resolve transition type (disable transitions during background SWR revalidation or same-page navigations)
 let defaultTransition = config.viewTransitions;
 try {
 const currentUrlObj = new URL(window.location.href);
 const targetUrlObj = new URL(data.finalUrl, window.location.href);
 if (currentUrlObj.pathname === targetUrlObj.pathname) {
 defaultTransition = 'none';
 }
 } catch (e) {}

 const transitionType = isRevalidation ? 'none' : (trigger && typeof trigger.getAttribute === 'function'
 ? (trigger.getAttribute('data-catchy-transition') || trigger.getAttribute('catchy-transition') || defaultTransition)
 : defaultTransition);

 const performDomUpdates = () => {
 // Morph the main container, supporting persistent elements (catchy-persist)
 Alpine.morph(appContainer, incomingApp.outerHTML, {
 updating(el, toEl, childrenOnly, skip) {
 if (el.nodeType === Node.ELEMENT_NODE && (
 el.hasAttribute('catchy-persist') || 
 el.hasAttribute('data-catchy-persist') || 
 el.closest('[catchy-persist], [data-catchy-persist]')
 )) {
 skip();
 }
 }
 });
 
 executeScriptsInContainer(appContainer);
 focusAutofocusElements(appContainer);

 // Process Out-of-Band (OOB) updates
 oobElements.forEach(incomingOob => {
 const id = incomingOob.id;
 if (!id) {
 console.warn('Catchy: Out-of-band element is missing an ID.', incomingOob);
 return;
 }
 const activeOob = document.getElementById(id);
 if (!activeOob) return;

 const strategy = incomingOob.getAttribute('data-catchy-swap-oob') || incomingOob.getAttribute('catchy-swap-oob');
 
 if (strategy === 'innerHTML') {
 if (Alpine.morph) {
 const temp = document.createElement(activeOob.tagName);
 temp.innerHTML = incomingOob.innerHTML;
 Alpine.morph(activeOob, temp.outerHTML, {
 childrenOnly: true,
 updating(el, toEl, childrenOnly, skip) {
 if (el.nodeType === Node.ELEMENT_NODE && (
 el.hasAttribute('catchy-persist') || 
 el.hasAttribute('data-catchy-persist') || 
 el.closest('[catchy-persist], [data-catchy-persist]')
 )) {
 skip();
 }
 }
 });
 } else {
 activeOob.innerHTML = incomingOob.innerHTML;
 }
 } else {
 if (Alpine.morph) {
 Alpine.morph(activeOob, incomingOob.outerHTML, {
 updating(el, toEl, childrenOnly, skip) {
 if (el.nodeType === Node.ELEMENT_NODE && (
 el.hasAttribute('catchy-persist') || 
 el.hasAttribute('data-catchy-persist') || 
 el.closest('[catchy-persist], [data-catchy-persist]')
 )) {
 skip();
 }
 }
 });
 } else {
 activeOob.outerHTML = incomingOob.outerHTML;
 }
 }
 
  const reloadedOob = document.getElementById(id) || activeOob;
  executeScriptsInContainer(reloadedOob);
  });
  if (data.flash) {
    let activeTrigger = null;
    if (trigger && trigger.id) {
      activeTrigger = document.getElementById(trigger.id);
    }
    if (!activeTrigger && trigger && trigger.tagName === 'FORM' && trigger.getAttribute('action')) {
      activeTrigger = document.querySelector(`form[action="${trigger.getAttribute('action')}"]`);
    }
    if (!activeTrigger) {
      activeTrigger = document.querySelector('form') || document.body;
    }
    processFlashHeader({ headers: { get: (name) => name.toLowerCase() === 'x-catchy-flash' ? data.flash : null } }, activeTrigger);
  }
};
 if (transitionType && transitionType !== 'none' && document.startViewTransition) {
 document.documentElement.setAttribute('data-catchy-transition', transitionType);
 const transition = document.startViewTransition(() => performDomUpdates());
 
 // Prevent unhandled promise rejections if the transition is aborted/skipped
 transition.ready.catch(() => {});
 transition.updateCallbackDone.catch(() => {});
 
 transition.finished.then(() => {
 document.documentElement.removeAttribute('data-catchy-transition');
 emit('after-morph', { url: data.finalUrl, element: appContainer, trigger }, trigger);
 }).catch(() => {
 document.documentElement.removeAttribute('data-catchy-transition');
 emit('after-morph', { url: data.finalUrl, element: appContainer, trigger }, trigger);
 });
 } else {
 performDomUpdates();
 emit('after-morph', { url: data.finalUrl, element: appContainer, trigger }, trigger);
 }
}

/**
 * Apply scroll positions based on trigger attributes or options.
 */
function applyScroll(trigger, targetId, finalUrl, oldPathname, options, config) {
 if (options.state && typeof options.state.scrollX === 'number' && typeof options.state.scrollY === 'number') {
 window.scrollTo({ left: options.state.scrollX, top: options.state.scrollY, behavior: 'instant' });
 return;
 }

 const scrollSetting = trigger && typeof trigger.getAttribute === 'function'
 ? trigger.getAttribute('data-catchy-scroll')
 : null;

 if (
 scrollSetting === 'preserve' ||
 scrollSetting === 'keep' ||
 options.scroll === 'preserve' ||
 options.scroll === 'keep'
 ) {
 return;
 }

 if (scrollSetting === 'top' || options.scroll === 'top') {
 window.scrollTo({ top: 0, behavior: 'instant' });
 return;
 }

 const finalURLObj = new URL(finalUrl);
 if (finalURLObj.hash) {
 const el = document.querySelector(finalURLObj.hash);
 if (el) el.scrollIntoView();
 return;
 }

 const isFormSubmit = trigger && trigger.tagName === 'FORM';
 const isGet = !options.method || options.method.toUpperCase() === 'GET';
 if (isGet && targetId === config.containerId && (!isFormSubmit || finalURLObj.pathname !== oldPathname)) {
 window.scrollTo({ top: 0, behavior: 'instant' });
 }
}

/**
 * Append redirects internally.
 */
function handleRedirect(redirectUrl, trigger, config, Alpine, updateHistory) {
 try {
 const targetUrl = new URL(redirectUrl, window.location.href);
 if (targetUrl.origin !== window.location.origin) {
 window.location.href = redirectUrl;
 return;
 }
 } catch (e) {
 window.location.href = redirectUrl;
 return;
 }

 visit(redirectUrl, { trigger, targetId: config.containerId }, updateHistory, config, Alpine);
}

/**
 * Parse errors on failed requests.
 */
function handleFetchError(response, trigger) {
 if (response.status === 422 || response.status === 400) {
 const contentType = response.headers.get('content-type');
 if (contentType && contentType.includes('application/json')) {
 response.text().then(text => {
 try {
 const json = JSON.parse(text);
 if (json.errors) {
 emit('validation-errors', json.errors);
 if (trigger) emit('validation-errors', json.errors, trigger);
 }
 } catch (e) {}
 });
 }
 }
}

/**
 * Process base64 encoded flash headers.
 */
function processFlashHeader(response, trigger) {
 const flashHeader = response ? response.headers.get('X-Catchy-Flash') : null;
 if (!flashHeader) return;

 try {
 const flashJson = decodeBase64Utf8(flashHeader);
 const flash = JSON.parse(flashJson);
 // Emit raw flash payload for advanced consumers
 emit('flash-raw', flash);

 // Emit individual typed flash events (compatible with x-catchy-toasts)
 const flashTypes = ['success', 'error', 'warning', 'info', 'status'];
 for (const type of flashTypes) {
  if (flash[type]) {
   emit('flash', { message: flash[type], type });
  }
 }

 if (flash.validation_errors) {
 emit('validation-errors', flash.validation_errors);
 if (trigger) emit('validation-errors', flash.validation_errors, trigger);
 }
 } catch (e) {
 console.error('Catchy: Failed to decode X-Catchy-Flash header', e);
 }
}

/**
 * Setup inline submit SVG spin animation.
 */
function setupSubmitSpinner(trigger) {
 if (trigger && (trigger.tagName === 'FORM' || trigger instanceof HTMLFormElement) && !trigger.hasAttribute('data-catchy-no-loader')) {
 const submitBtn = trigger.querySelector('[type="submit"]') || trigger.querySelector('button:not([type="button"])');
 if (submitBtn && !submitBtn.dataset.originalHtml) {
 submitBtn.dataset.originalHtml = submitBtn.innerHTML;
 submitBtn.disabled = true;
 submitBtn.classList.add('pointer-events-none');
 const spinnerHtml = (window.CatchyConfig && window.CatchyConfig.svg && window.CatchyConfig.svg.spinner)
  ? window.CatchyConfig.svg.spinner
  : '';
 submitBtn.innerHTML = spinnerHtml + submitBtn.innerHTML;
 return submitBtn;
 }
 }
 return null;
}

/**
 * Remove spinner from submit button.
 */
function restoreSubmitButton(submitBtn) {
 if (submitBtn && submitBtn.dataset.originalHtml) {
 submitBtn.innerHTML = submitBtn.dataset.originalHtml;
 submitBtn.disabled = false;
 submitBtn.classList.remove('pointer-events-none');
 delete submitBtn.dataset.originalHtml;
 }
}

function getTargetContainerId(trigger, options, config) {
 return options.targetId ||
 (trigger && typeof trigger.getAttribute === 'function' ? trigger.getAttribute('data-catchy-target') : null) ||
 config.containerId;
}

function manageHistory(finalUrl, trigger, isGet, response) {
  const shouldUpdateHistory = isGet || (response && response.redirected);
  const hasHistoryAttr = trigger && typeof trigger.getAttribute === 'function' && trigger.getAttribute('data-catchy-history') === 'false';
  const isModalOrOffcanvas = trigger && typeof trigger.hasAttribute === 'function' && (
  trigger.hasAttribute('data-catchy-modal') || 
  trigger.hasAttribute('catchy-modal') || 
  trigger.hasAttribute('data-catchy-offcanvas') ||
  trigger.hasAttribute('catchy-offcanvas')
  );

  if (shouldUpdateHistory && !hasHistoryAttr && !isModalOrOffcanvas) {
  window.history.pushState({ catchy: true, url: finalUrl }, '', finalUrl);
  }
}

/**
 * Show a full screen iframe modal displaying server error response page.
 * Useful for debugging Laravel errors (e.g. Ignition stack trace) in SPA context.
 *
 * @param {string} htmlContent
 */
function showErrorModal(htmlContent) {
  let overlay = document.getElementById('catchy-error-overlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'catchy-error-overlay';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '999999';
  overlay.style.background = 'rgba(15, 23, 42, 0.6)';
  overlay.style.backdropFilter = 'blur(4px)';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';

  const modal = document.createElement('div');
  modal.style.width = '100%';
  modal.style.maxWidth = '1200px';
  modal.style.height = '90vh';
  modal.style.background = 'white';
  modal.style.borderRadius = '12px';
  modal.style.overflow = 'hidden';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
  modal.style.border = '1px solid rgba(226, 232, 240, 0.8)';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.padding = '14px 20px';
  header.style.borderBottom = '1px solid #e2e8f0';
  header.style.background = '#f8fafc';

  const title = document.createElement('h3');
  title.textContent = 'Server Error Response';
  title.style.margin = '0';
  title.style.fontSize = '16px';
  title.style.fontWeight = '600';
  title.style.color = '#0f172a';
  title.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  const closeBtn = document.createElement('button');
  const closeIcon = (window.CatchyConfig && window.CatchyConfig.svg && window.CatchyConfig.svg.close)
    ? window.CatchyConfig.svg.close
    : '';
  const finalIcon = closeIcon ? closeIcon.replace('class="', 'style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;" class="') : '';
  closeBtn.innerHTML = `${finalIcon}Close`;
  closeBtn.style.background = '#ef4444';
  closeBtn.style.color = 'white';
  closeBtn.style.border = 'none';
  closeBtn.style.padding = '6px 14px';
  closeBtn.style.borderRadius = '6px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontWeight = '600';
  closeBtn.style.fontSize = '13px';
  closeBtn.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.transition = 'background-color 0.2s';
  closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = '#dc2626'; });
  closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = '#ef4444'; });

  closeBtn.addEventListener('click', () => {
    overlay.remove();
  });

  header.appendChild(title);
  header.appendChild(closeBtn);

  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.flex = '1';
  iframe.style.border = 'none';

  modal.appendChild(header);
  modal.appendChild(iframe);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const escHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  iframe.contentWindow.document.open();
  iframe.contentWindow.document.write(htmlContent);
  iframe.contentWindow.document.close();
}
