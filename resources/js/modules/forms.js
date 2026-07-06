/**
 * Catchy — Forms Module
 *
 * XHR request wrapper with upload progress tracking.
 */

/**
 * Helper to wrap XHR in a Promise resembling a fetch Response.
 * Supports upload progress events for file uploads.
 *
 * @param {string} url
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export function xhrRequest(url, options = {}) {
 return new Promise((resolve, reject) => {
 const xhr = new XMLHttpRequest();
 xhr.open(options.method || 'GET', url);

 // Set headers
 if (options.headers) {
 Object.entries(options.headers).forEach(([key, val]) => {
 xhr.setRequestHeader(key, val);
 });
 }

 // Add progress tracking
 if (xhr.upload && options.trigger) {
 xhr.upload.addEventListener('progress', (e) => {
 const percent = e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : 0;
 const progressDetail = { loaded: e.loaded, total: e.total, percent, trigger: options.trigger };

 options.trigger.dispatchEvent(new CustomEvent('catchy:progress', {
 bubbles: true,
 detail: progressDetail
 }));
 options.trigger.dispatchEvent(new CustomEvent('catchy-progress', {
 bubbles: true,
 detail: progressDetail
 }));
 });
 }

 xhr.onload = () => {
 const headersMap = new Map();
 const rawHeaders = xhr.getAllResponseHeaders();
 rawHeaders.split('\r\n').forEach(line => {
 const parts = line.split(': ');
 const header = parts.shift().toLowerCase();
 const value = parts.join(': ');
 if (header) {
 headersMap.set(header, value);
 }
 });

 const responseLike = {
 status: xhr.status,
 ok: xhr.status >= 200 && xhr.status < 300,
 url: xhr.responseURL || url,
 redirected: xhr.responseURL && xhr.responseURL !== url,
 headers: {
 get: (name) => headersMap.get(name.toLowerCase()) || null
 },
 text: () => Promise.resolve(xhr.responseText)
 };
 resolve(responseLike);
 };

 xhr.onerror = () => {
 reject(new Error('Catchy: XHR Request failed'));
 };

 if (options.signal) {
 options.signal.addEventListener('abort', () => {
 xhr.abort();
 reject(new DOMException('Aborted', 'AbortError'));
 });
 }

 xhr.send(options.body || null);
 });
}

/**
 * Submits a form using AJAX and morphs the response via the visit function.
 *
 * @param {HTMLFormElement} form
 * @param {Function} visitFn - Reference to the visit() function
 */
export function submitForm(form, visitFn) {
 const action = form.getAttribute('action') || window.location.href;
 const method = (form.getAttribute('method') || 'GET').toUpperCase();
 const url = new URL(action, window.location.href);

 if (method === 'GET') {
 const formData = new FormData(form);
 const params = new URLSearchParams(formData);

 for (const [key, value] of params.entries()) {
 url.searchParams.set(key, value);
 }

 visitFn(url.toString(), { trigger: form });
 } else {
 const formData = new FormData(form);
 if (!formData.has('_method') && method !== 'POST') {
 formData.append('_method', method);
 }
 const options = {
 method: 'POST',
 body: formData,
 headers: {},
 trigger: form
 };

 const token = document.querySelector('meta[name="csrf-token"]');
 if (token) {
 options.headers['X-CSRF-TOKEN'] = token.getAttribute('content');
 }

 visitFn(url.toString(), options);
 }
}
