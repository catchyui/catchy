/**
 * Catchy — Shared Utilities Module
 *
 * Common helper functions used across all Catchy modules.
 */

/**
 * Decode a base64-encoded UTF-8 string (handles multi-byte characters).
 *
 * @param {string} base64Str
 * @returns {string}
 */
export function decodeBase64Utf8(base64Str) {
 try {
 const binaryString = atob(base64Str);
 const bytes = new Uint8Array(binaryString.length);
 for (let i = 0; i < binaryString.length; i++) {
 bytes[i] = binaryString.charCodeAt(i);
 }
 return new TextDecoder('utf-8').decode(bytes);
 } catch (e) {
 return '';
 }
}

/**
 * Dispatch a custom event with both colon and hyphen formats for Alpine.js compatibility.
 *
 * @param {string} name - Event name without prefix (e.g. 'start', 'end', 'flash')
 * @param {Object} detail - Event detail payload
 * @param {EventTarget} target - Target element to dispatch on (default: window)
 * @param {Object} options - Additional event options (bubbles, cancelable)
 * @returns {boolean} - Returns false if any dispatch was prevented
 */
export function emit(name, detail = {}, target = window, options = {}) {
 const eventOptions = {
 bubbles: options.bubbles ?? true,
 cancelable: options.cancelable ?? false,
 detail,
 };

 const colonEvent = new CustomEvent(`catchy:${name}`, eventOptions);
 const hyphenEvent = new CustomEvent(`catchy-${name}`, eventOptions);

 const result1 = target.dispatchEvent(colonEvent);
 const result2 = target.dispatchEvent(hyphenEvent);

 return result1 && result2;
}

/**
 * Re-evaluates and executes any script tags inside a container element.
 *
 * @param {HTMLElement} container
 */
export function executeScriptsInContainer(container) {
 if (!container) return;
 const scripts = container.querySelectorAll('script');
 scripts.forEach(oldScript => {
 if (oldScript.hasAttribute('data-catchy-ignore')) return;

 const newScript = document.createElement('script');
 Array.from(oldScript.attributes).forEach(attr => {
 newScript.setAttribute(attr.name, attr.value);
 });
 newScript.textContent = oldScript.textContent;
 if (oldScript.parentNode) {
 oldScript.parentNode.replaceChild(newScript, oldScript);
 }
 });
}

/**
 * Automatically sets focus on the first element with autofocus or data-catchy-autofocus attributes.
 *
 * @param {HTMLElement} container
 */
export function focusAutofocusElements(container) {
 if (!container) return;
 const autofocusEl = container.querySelector('[autofocus]') || container.querySelector('[data-catchy-autofocus]');
 if (autofocusEl) {
 autofocusEl.focus();
 }
}

/**
 * Checks if a link should be ignored by the Catchy navigation router.
 *
 * @param {HTMLAnchorElement} link
 * @param {MouseEvent|null} event
 * @param {string} ignoreAttribute
 * @returns {boolean}
 */
export function shouldIgnoreLink(link, event, ignoreAttribute) {
 const href = link.getAttribute('href');
 if (!href) return true;

 if (
 href.startsWith('#') ||
 href.startsWith('javascript:') ||
 href.startsWith('mailto:') ||
 href.startsWith('tel:') ||
 href.startsWith('blob:') ||
 href.startsWith('data:')
 ) {
 return true;
 }
 if (link.hasAttribute(ignoreAttribute)) return true;
 if (link.target && link.target.toLowerCase() !== '_self') return true;
 if (link.hasAttribute('download')) return true;
 if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return true;

 try {
 const url = new URL(link.href, window.location.href);
 if (url.origin !== window.location.origin) return true;

 if (
 url.pathname === window.location.pathname &&
 url.search === window.location.search &&
 url.hash !== ''
 ) {
 return true;
 }
 } catch (e) {
 return true;
 }

 return false;
}

/**
 * Checks if a form submission should be ignored by Catchy.
 *
 * @param {HTMLFormElement} form
 * @param {string} ignoreAttribute
 * @returns {boolean}
 */
export function shouldIgnoreForm(form, ignoreAttribute) {
 if (form.hasAttribute(ignoreAttribute)) return true;
 if (form.getAttribute('method')?.toLowerCase() === 'dialog') return true;

 const action = form.getAttribute('action') || window.location.href;
 try {
 const url = new URL(action, window.location.href);
 if (url.origin !== window.location.origin) return true;
 } catch (e) {
 return true;
 }

 if (form.target && form.target.toLowerCase() !== '_self') return true;

 return false;
}

/**
 * Helper to resolve and execute data-catchy-* callback attributes.
 * Supports either a window-scoped function name or direct inline JS.
 *
 * @param {HTMLElement} element
 * @param {string} attrName
 * @param {Object} context
 * @returns {*}
 */
export function executeCallback(element, attrName, context) {
 if (!element || typeof element.getAttribute !== 'function') return;

 let callback = element.getAttribute(attrName);

 // Support fallback aliases for ease of use
 if (!callback) {
 if (attrName === 'data-catchy-beforesend') {
 callback = element.getAttribute('onbeforesend') || element.getAttribute('beforesend');
 } else if (attrName === 'data-catchy-success') {
 callback = element.getAttribute('onsuccess') || element.getAttribute('success');
 } else if (attrName === 'data-catchy-error') {
 callback = element.getAttribute('onerror') || element.getAttribute('error');
 }
 }

 if (!callback) return;

 // Evaluate in Alpine context if available for seamless reactive variable bindings
 if (window.Alpine && typeof window.Alpine.evaluate === 'function') {
 try {
 return window.Alpine.evaluate(element, callback, { extraLocals: { event: context } });
 } catch (e) {
 console.error(`Catchy: Alpine evaluation error for callback "${callback}":`, e);
 }
 }

 try {
 const parts = callback.split('.');
 let func = window;
 for (const part of parts) {
 if (func === undefined || func === null) {
 func = undefined;
 break;
 }
 func = func[part];
 }

 if (typeof func === 'function') {
 return func(context);
 }
 console.warn(`Catchy: Unknown callback "${callback}". Only registered window functions are allowed.`);
 } catch (e) {
 console.error(`Catchy: Error in callback execution for "${callback}":`, e);
 }
}
