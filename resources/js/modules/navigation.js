/**
 * Catchy — Navigation Module
 *
 * Core visit() function for SPA page transitions.
 */

import { decodeBase64Utf8, emit, executeScriptsInContainer, focusAutofocusElements, executeCallback } from './utils.js';
import { getCachedResponse, setCachedResponse } from './cache.js';
import { startLoading, stopLoading, resetLoading } from './loader.js';
import { mergeHead, mergeHeadFromHeader } from './head-merge.js';
import { xhrRequest } from './forms.js';
import { getActiveRequests } from './prefetch.js';
import { resolveModal, resolveOffcanvas, handleLifecycleTriggers } from './components.js';

let currentVersion = '';

/**
 * Get the current asset version string.
 * @returns {string}
 */
export function getCurrentVersion() {
    return currentVersion;
}

/**
 * Set the current asset version string.
 * @param {string} version
 */
export function setCurrentVersion(version) {
    currentVersion = version;
}

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
    // Check internet connectivity
    if (navigator.onLine === false) {
        emit('flash', { message: 'Cannot navigate. You are currently offline.', type: 'warning' });
        return;
    }

    const oldPathname = window.location.pathname;
    // Save current scroll coordinates in history state before navigating away
    try {
        window.history.replaceState({
            ...window.history.state,
            scrollX: window.scrollX,
            scrollY: window.scrollY
        }, '');
    } catch (e) { }

    const trigger = options.trigger || document;

    // Execute beforesend callback hook if defined
    if (executeCallback(trigger, 'data-catchy-beforesend', { url, options, trigger }) === false) {
        return;
    }

    if (!emit('start', { url, options, trigger }, trigger, { cancelable: true })) {
        return;
    }

    // Find and disable submit button, showing an inline SVG spinner loader
    let submitBtn = null;
    if (trigger && (trigger.tagName === 'FORM' || trigger instanceof HTMLFormElement) && !trigger.hasAttribute('data-catchy-no-loader')) {
        submitBtn = trigger.querySelector('[type="submit"]') || trigger.querySelector('button:not([type="button"])');
        if (submitBtn && !submitBtn.dataset.originalHtml) {
            submitBtn.dataset.originalHtml = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.classList.add('pointer-events-none');
            const spinnerHtml = `<svg class="animate-spin -ms-1 me-2 h-4 w-4 text-current inline-block align-text-bottom" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style="vertical-align: middle;"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> `;
            submitBtn.innerHTML = spinnerHtml + submitBtn.innerHTML;
        }
    }

    function restoreSubmitButton() {
        if (submitBtn && submitBtn.dataset.originalHtml) {
            submitBtn.innerHTML = submitBtn.dataset.originalHtml;
            submitBtn.disabled = false;
            submitBtn.classList.remove('pointer-events-none');
            delete submitBtn.dataset.originalHtml;
        }
    }

    startLoading();

    try {
        let html = '';
        let finalUrl = url;
        let version = '';
        let headContent = null;
        let response = null;

        // 1. Try to resolve from cache (only for GET requests)
        const isGet = !options.method || options.method.toUpperCase() === 'GET';
        const cached = isGet ? getCachedResponse(url, config.cacheTTL) : null;

        if (cached) {
            html = cached.html;
            finalUrl = cached.finalUrl;
            version = cached.version;
            headContent = cached.head || null;
            if (cached.title) document.title = cached.title;
        } else {
            // Check if there is an active prefetch running for this URL
            const activeRequests = getActiveRequests();
            let responseData = null;
            if (isGet && activeRequests.has(url)) {
                responseData = await activeRequests.get(url);
            }

            if (responseData) {
                html = responseData.html;
                finalUrl = responseData.finalUrl;
                version = responseData.version;
                headContent = responseData.head || null;
                if (responseData.title) document.title = responseData.title;
            } else {
                // Perform live fetch
                const fetchHeaders = {
                    ...(options.headers || {}),
                    'X-Catchy-SPA': 'true'
                };
                if (currentVersion) {
                    fetchHeaders['X-Catchy-Version'] = currentVersion;
                }

                const fetchOptions = { ...options, headers: fetchHeaders };

                if (options.method && options.method.toUpperCase() !== 'GET') {
                    response = await xhrRequest(url, fetchOptions);
                } else {
                    response = await fetch(url, fetchOptions);
                }

                // Version mismatch → force hard reload
                if (response.status === 409) {
                    window.location.href = url;
                    return;
                }

                if (!response.ok) {
                    if (response.status === 422 || response.status === 400) {
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            try {
                                const json = JSON.parse(await response.text());
                                if (json.errors) {
                                    emit('validation-errors', json.errors);
                                    if (trigger) emit('validation-errors', json.errors, trigger);
                                }
                            } catch (e) {}
                        }
                    }
                    throw new Error(`Catchy: Request failed with status ${response.status}`);
                }

                // Check for redirect header
                const redirectUrl = response.headers.get('X-Catchy-Redirect');
                if (redirectUrl) {
                    processFlashHeader(response, trigger);
                    visit(redirectUrl, { trigger, targetId: config.containerId }, updateHistory, config, Alpine);
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

                // Process flash messages
                processFlashHeader(response, trigger);

                // Decode and set title
                const titleHeader = response.headers.get('X-Catchy-Title');
                let title = '';
                if (titleHeader) {
                    title = decodeBase64Utf8(titleHeader);
                    if (title) document.title = title;
                }

                // Cache GET requests
                if (isGet) {
                    setCachedResponse(url, { html, version, title, head: headContent, finalUrl });
                }
            }
        }

        // Update version pointer
        if (version) currentVersion = version;

        // Merge head content from header
        if (headContent) {
            mergeHeadFromHeader(headContent);
        }

        // Resolve the target container ID
        const targetId = options.targetId || (trigger && typeof trigger.getAttribute === 'function' ? trigger.getAttribute('data-catchy-target') : null) || config.containerId;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        if (doc.head) mergeHead(doc.head);

        // Check for offcanvas routing
        const isOffcanvasTarget = options.offcanvas || (trigger && typeof trigger.hasAttribute === 'function' && trigger.hasAttribute('data-catchy-offcanvas'));

        if (isOffcanvasTarget) {
            const incomingContent = doc.getElementById(targetId) || doc.getElementById(config.containerId) || doc.body;
            const offcanvas = resolveOffcanvas(trigger);
            if (offcanvas) {
                emit('offcanvas-load', { html: incomingContent.innerHTML, title: doc.title || '' }, offcanvas);
                stopLoading();
                executeCallback(trigger, 'data-catchy-success', { url: finalUrl, trigger });
                handleLifecycleTriggers(trigger, 'success');
                restoreSubmitButton();
                emit('end', { url: finalUrl, trigger }, trigger);
                return;
            }
        }

        // Check for modal routing
        const isModalTarget = options.modal || (trigger && typeof trigger.hasAttribute === 'function' && trigger.hasAttribute('data-catchy-modal'));

        if (isModalTarget) {
            const incomingContent = doc.getElementById(targetId) || doc.getElementById(config.containerId) || doc.body;
            const modal = resolveModal(trigger);
            if (modal) {
                emit('modal-load', { html: incomingContent.innerHTML, title: doc.title || '' }, modal);
                stopLoading();
                executeCallback(trigger, 'data-catchy-success', { url: finalUrl, trigger });
                handleLifecycleTriggers(trigger, 'success');
                restoreSubmitButton();
                emit('end', { url: finalUrl, trigger }, trigger);
                return;
            }
        }

        // Check if trigger was inside an active offcanvas
        const isTriggerInOffcanvas = trigger && typeof trigger.closest === 'function' && (trigger.closest('[catchy-offcanvas]') || trigger.closest('#catchy-offcanvas'));

        if (isTriggerInOffcanvas && options.method && options.method.toUpperCase() !== 'GET') {
            const offcanvas = resolveOffcanvas(trigger);
            if (offcanvas) emit('offcanvas-close', {}, offcanvas);
        }

        // Check if trigger was inside an active modal
        const isTriggerInModal = trigger && typeof trigger.closest === 'function' && (trigger.closest('[catchy-modal]') || trigger.closest('#catchy-modal'));

        if (isTriggerInModal && options.method && options.method.toUpperCase() !== 'GET') {
            const modal = resolveModal(trigger);
            if (modal) emit('modal-close', {}, modal);

            const mainContainer = document.getElementById(config.containerId);
            const incomingMain = doc.getElementById(config.containerId) || doc.body;

            if (mainContainer && incomingMain) {
                if (doc.title) document.title = doc.title;
                emit('morphing', { url: finalUrl, html, element: mainContainer, trigger }, trigger);

                if (!Alpine.morph) {
                    console.error('Catchy: Alpine.morph is not defined. Ensure @alpinejs/morph is loaded and registered.');
                    window.location.href = finalUrl;
                    return;
                }
                Alpine.morph(mainContainer, incomingMain.outerHTML);
                executeScriptsInContainer(mainContainer);
                focusAutofocusElements(mainContainer);
            }
        } else {
            // Standard container morph
            const appContainer = document.getElementById(targetId);
            if (!appContainer) {
                window.location.href = finalUrl;
                return;
            }

            const incomingApp = doc.getElementById(targetId) || doc.getElementById(config.containerId);
            if (!incomingApp) {
                window.location.href = finalUrl;
                return;
            }

            if (doc.title) document.title = doc.title;
            emit('morphing', { url: finalUrl, html, element: appContainer, trigger }, trigger);

            if (!Alpine.morph) {
                console.error('Catchy: Alpine.morph is not defined. Ensure @alpinejs/morph is loaded and registered.');
                window.location.href = finalUrl;
                return;
            }
            Alpine.morph(appContainer, incomingApp.outerHTML);
            executeScriptsInContainer(appContainer);
            focusAutofocusElements(appContainer);
        }

        // Manage History Updates
        const shouldUpdateHistory = updateHistory &&
            (isGet || (response && response.redirected)) &&
            (!trigger || typeof trigger.getAttribute !== 'function' || trigger.getAttribute('data-catchy-history') !== 'false') &&
            (!trigger || typeof trigger.hasAttribute !== 'function' || (!trigger.hasAttribute('data-catchy-modal') && !trigger.hasAttribute('data-catchy-offcanvas')));

        if (shouldUpdateHistory) {
            window.history.pushState({ catchy: true, url: finalUrl }, '', finalUrl);
        }

        // Handle scroll position
        if (options.state && typeof options.state.scrollX === 'number' && typeof options.state.scrollY === 'number') {
            window.scrollTo({ left: options.state.scrollX, top: options.state.scrollY, behavior: 'instant' });
        } else {
            const finalURLObj = new URL(finalUrl);
            const keepScroll = trigger && typeof trigger.getAttribute === 'function' && trigger.getAttribute('data-catchy-scroll') === 'keep';

            if (keepScroll) {
                // Do not change scroll position
            } else if (finalURLObj.hash) {
                const el = document.querySelector(finalURLObj.hash);
                if (el) el.scrollIntoView();
            } else {
                const isFormSubmit = trigger && typeof trigger.tagName === 'string' && trigger.tagName.toUpperCase() === 'FORM';
                if (isGet && targetId === config.containerId && (!isFormSubmit || finalURLObj.pathname !== oldPathname)) {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                }
            }
        }

        stopLoading();
        executeCallback(trigger, 'data-catchy-success', { url: finalUrl, trigger });
        handleLifecycleTriggers(trigger, 'success');
        restoreSubmitButton();
        emit('end', { url: finalUrl, trigger }, trigger);

    } catch (error) {
        resetLoading();
        console.error('Catchy: AJAX request error, falling back to full load.', error);

        executeCallback(trigger, 'data-catchy-error', { url, error, trigger });
        handleLifecycleTriggers(trigger, 'error');
        restoreSubmitButton();
        emit('error', { url, error, trigger }, trigger);

        const isGet = !options.method || options.method.toUpperCase() === 'GET';
        if (isGet) {
            window.location.href = url;
        }
    }
}

/**
 * Process the X-Catchy-Flash header from a response.
 *
 * @param {Object} response
 * @param {HTMLElement} trigger
 */
function processFlashHeader(response, trigger) {
    const flashHeader = response.headers.get('X-Catchy-Flash');
    if (!flashHeader) return;

    try {
        const flashJson = decodeBase64Utf8(flashHeader);
        const flash = JSON.parse(flashJson);
        emit('flash', flash);

        if (flash.validation_errors) {
            emit('validation-errors', flash.validation_errors);
            if (trigger) emit('validation-errors', flash.validation_errors, trigger);
        }
    } catch (e) {
        console.error('Catchy: Failed to decode X-Catchy-Flash header', e);
    }
}
