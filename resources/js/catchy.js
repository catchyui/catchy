/**
 * Hamzi/Catchy - Alpine.js SPA Plugin v1.5.1
 * (c) 2026 Hamzi
 * Released under the MIT License.
 */
(() => {
 // resources/js/modules/config.js
 function resolveConfig() {
 const c = window.CatchyConfig || {};
 return {
 containerId: c.containerId || "catchy-app",
 ignoreAttribute: c.ignoreAttribute || "data-catchy-ignore",
 prefetch: c.prefetch !== false,
 prefetchDelay: c.prefetchDelay || 75,
 cacheTTL: c.cacheTTL || 3e4,
 swr: c.swr !== false,
 loadingBar: c.loadingBar !== false,
 loadingBarHeight: c.loadingBarHeight || "3px",
 loadingBarColor: c.loadingBarColor || "linear-gradient(to right, #4f46e5, #06b6d4)",
 viewTransitions: c.viewTransitions || "fade"
 };
 }

 // resources/js/modules/loader.js
 var loaderElement = null;
 var loaderTimer = null;
 var progressInterval = null;
 var fadeOutTimer = null;
 var resetTimer = null;
 function initLoader(config) {
 if (!config.loadingBar) return;
 const style = document.createElement("style");
 style.textContent = `
 #catchy-loader {
 position: fixed;
 top: 0;
 left: 0;
 width: 0%;
 height: ${config.loadingBarHeight};
 background: ${config.loadingBarColor};
 z-index: 99999;
 transition: width 0.2s cubic-bezier(0.1, 0.8, 0.29, 1), opacity 0.4s ease;
 opacity: 0;
 pointer-events: none;
 }
 `;
 document.head.appendChild(style);
 loaderElement = document.createElement("div");
 loaderElement.id = "catchy-loader";
 document.body.appendChild(loaderElement);
 }
 function startLoading() {
 document.body.classList.add("catchy-loading");
 document.documentElement.classList.add("catchy-loading");
 if (!loaderElement) return;
 clearTimeout(loaderTimer);
 clearInterval(progressInterval);
 clearTimeout(fadeOutTimer);
 clearTimeout(resetTimer);
 loaderTimer = setTimeout(() => {
 loaderElement.style.width = "0%";
 loaderElement.style.opacity = "1";
 let width = 0;
 progressInterval = setInterval(() => {
 if (width < 88) {
 width += (90 - width) * 0.08;
 loaderElement.style.width = `${width}%`;
 }
 }, 150);
 }, 40);
 }
 function stopLoading() {
 document.body.classList.remove("catchy-loading");
 document.documentElement.classList.remove("catchy-loading");
 if (!loaderElement) return;
 clearTimeout(loaderTimer);
 clearInterval(progressInterval);
 clearTimeout(fadeOutTimer);
 clearTimeout(resetTimer);
 loaderElement.style.width = "100%";
 fadeOutTimer = setTimeout(() => {
 loaderElement.style.opacity = "0";
 resetTimer = setTimeout(() => {
 loaderElement.style.width = "0%";
 }, 400);
 }, 100);
 }
 function resetLoading() {
 document.body.classList.remove("catchy-loading");
 document.documentElement.classList.remove("catchy-loading");
 if (!loaderElement) return;
 clearTimeout(loaderTimer);
 clearInterval(progressInterval);
 clearTimeout(fadeOutTimer);
 clearTimeout(resetTimer);
 loaderElement.style.opacity = "0";
 loaderElement.style.width = "0%";
 }

 // resources/js/modules/cache.js
 var cache = /* @__PURE__ */ new Map();
 var MAX_CACHE_SIZE = 50;
 function getCachedResponse(url, ttl) {
 const entry = cache.get(url);
 if (!entry) return null;
 if (Date.now() - entry.timestamp > ttl) {
 cache.delete(url);
 return null;
 }
 return entry;
 }
 function setCachedResponse(url, data) {
 if (cache.has(url)) {
 cache.delete(url);
 } else if (cache.size >= MAX_CACHE_SIZE) {
 const firstKey = cache.keys().next().value;
 cache.delete(firstKey);
 }
 cache.set(url, { ...data, timestamp: Date.now() });
 }
 function getCache() {
 return cache;
 }

 // resources/js/modules/utils.js
 function decodeBase64Utf8(base64Str) {
 try {
 const binaryString = atob(base64Str);
 const bytes = new Uint8Array(binaryString.length);
 for (let i = 0; i < binaryString.length; i++) {
 bytes[i] = binaryString.charCodeAt(i);
 }
 return new TextDecoder("utf-8").decode(bytes);
 } catch (e) {
 return "";
 }
 }
 function emit(name, detail = {}, target = window, options = {}) {
 const eventOptions = {
 bubbles: options.bubbles ?? true,
 cancelable: options.cancelable ?? false,
 detail
 };
 const colonEvent = new CustomEvent(`catchy:${name}`, eventOptions);
 const hyphenEvent = new CustomEvent(`catchy-${name}`, eventOptions);
 const result1 = target.dispatchEvent(colonEvent);
 const result2 = target.dispatchEvent(hyphenEvent);
 return result1 && result2;
 }
 function executeScriptsInContainer(container) {
 if (!container) return;
 const scripts = container.querySelectorAll("script");
 scripts.forEach((oldScript) => {
 if (oldScript.hasAttribute("data-catchy-ignore")) return;
 const newScript = document.createElement("script");
 Array.from(oldScript.attributes).forEach((attr) => {
 newScript.setAttribute(attr.name, attr.value);
 });
 newScript.textContent = oldScript.textContent;
 if (oldScript.parentNode) {
 oldScript.parentNode.replaceChild(newScript, oldScript);
 }
 });
 }
 function focusAutofocusElements(container) {
 if (!container) return;
 const autofocusEl = container.querySelector("[autofocus]") || container.querySelector("[data-catchy-autofocus]");
 if (autofocusEl) {
 autofocusEl.focus();
 }
 }
 function shouldIgnoreLink(link, event, ignoreAttribute) {
 const href = link.getAttribute("href");
 if (!href) return true;
 if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("blob:") || href.startsWith("data:")) {
 return true;
 }
 if (link.hasAttribute(ignoreAttribute)) return true;
 if (link.target && link.target.toLowerCase() !== "_self") return true;
 if (link.hasAttribute("download")) return true;
 if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return true;
 try {
 const url = new URL(link.href, window.location.href);
 if (url.origin !== window.location.origin) return true;
 if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash !== "") {
 return true;
 }
 } catch (e) {
 return true;
 }
 return false;
 }
 function shouldIgnoreForm(form, ignoreAttribute) {
 if (form.hasAttribute(ignoreAttribute)) return true;
 if (form.getAttribute("method")?.toLowerCase() === "dialog") return true;
 const action = form.getAttribute("action") || window.location.href;
 try {
 const url = new URL(action, window.location.href);
 if (url.origin !== window.location.origin) return true;
 } catch (e) {
 return true;
 }
 if (form.target && form.target.toLowerCase() !== "_self") return true;
 return false;
 }
 function executeCallback(element, attrName, context) {
 if (!element || typeof element.getAttribute !== "function") return;
 let callback = element.getAttribute(attrName);
 if (!callback) {
 if (attrName === "data-catchy-beforesend") {
 callback = element.getAttribute("onbeforesend") || element.getAttribute("beforesend");
 } else if (attrName === "data-catchy-success") {
 callback = element.getAttribute("onsuccess") || element.getAttribute("success");
 } else if (attrName === "data-catchy-error") {
 callback = element.getAttribute("onerror") || element.getAttribute("error");
 }
 }
 if (!callback) return;
 if (window.Alpine && typeof window.Alpine.evaluate === "function") {
 try {
 return window.Alpine.evaluate(element, callback, { extraLocals: { event: context } });
 } catch (e) {
 console.error(`Catchy: Alpine evaluation error for callback "${callback}":`, e);
 }
 }
 try {
 const parts = callback.split(".");
 let func = window;
 for (const part of parts) {
 if (func === void 0 || func === null) {
 func = void 0;
 break;
 }
 func = func[part];
 }
 if (typeof func === "function") {
 return func(context);
 }
 console.warn(`Catchy: Unknown callback "${callback}". Only registered window functions are allowed.`);
 } catch (e) {
 console.error(`Catchy: Error in callback execution for "${callback}":`, e);
 }
 }

 // resources/js/modules/head-merge.js
 function mergeHead(incomingHead) {
 if (!incomingHead) return;
 mergeMetaTags(incomingHead);
 mergeLinkTags(incomingHead);
 mergeStyleTags(incomingHead);
 }
 function mergeHeadFromHeader(base64Head) {
 if (!base64Head) return;
 const headHtml = decodeBase64Utf8(base64Head);
 if (!headHtml) return;
 const parser = new DOMParser();
 const doc = parser.parseFromString(`<head>${headHtml}</head>`, "text/html");
 if (doc.head) {
 mergeHead(doc.head);
 }
 }
 function mergeMetaTags(incomingHead) {
 const currentMetaTags = Array.from(document.head.querySelectorAll("meta"));
 const incomingMetaTags = Array.from(incomingHead.querySelectorAll("meta"));
 incomingMetaTags.forEach((incomingMeta) => {
 const name = incomingMeta.getAttribute("name");
 const property = incomingMeta.getAttribute("property");
 const httpEquiv = incomingMeta.getAttribute("http-equiv");
 let existingMeta = null;
 if (name) {
 existingMeta = currentMetaTags.find((m) => m.getAttribute("name") === name);
 } else if (property) {
 existingMeta = currentMetaTags.find((m) => m.getAttribute("property") === property);
 } else if (httpEquiv) {
 existingMeta = currentMetaTags.find((m) => m.getAttribute("http-equiv") === httpEquiv);
 }
 if (existingMeta) {
 if (existingMeta.getAttribute("content") !== incomingMeta.getAttribute("content")) {
 existingMeta.setAttribute("content", incomingMeta.getAttribute("content"));
 }
 } else {
 document.head.appendChild(incomingMeta.cloneNode(true));
 }
 });
 }
 function mergeLinkTags(incomingHead) {
 const currentLinks = Array.from(document.head.querySelectorAll("link"));
 const incomingLinks = Array.from(incomingHead.querySelectorAll("link"));
 incomingLinks.forEach((incomingLink) => {
 const href = incomingLink.getAttribute("href");
 const rel = incomingLink.getAttribute("rel");
 if (rel === "canonical") {
 const existingCanonical = currentLinks.find((l) => l.getAttribute("rel") === "canonical");
 if (existingCanonical) {
 existingCanonical.setAttribute("href", href);
 } else {
 document.head.appendChild(incomingLink.cloneNode(true));
 }
 } else if (href) {
 const exists = currentLinks.some((l) => l.getAttribute("href") === href && l.getAttribute("rel") === rel);
 if (!exists) {
 document.head.appendChild(incomingLink.cloneNode(true));
 }
 }
 });
 }
 function mergeStyleTags(incomingHead) {
 const incomingStyles = Array.from(incomingHead.querySelectorAll("style"));
 incomingStyles.forEach((incomingStyle) => {
 const styleId = incomingStyle.getAttribute("data-catchy-style-id");
 if (styleId) {
 const existing = document.head.querySelector(`style[data-catchy-style-id="${styleId}"]`);
 if (existing) {
 existing.textContent = incomingStyle.textContent;
 } else {
 document.head.appendChild(incomingStyle.cloneNode(true));
 }
 }
 });
 }

 // resources/js/modules/forms.js
 function xhrRequest(url, options = {}) {
 return new Promise((resolve, reject) => {
 const xhr = new XMLHttpRequest();
 xhr.open(options.method || "GET", url);
 if (options.headers) {
 Object.entries(options.headers).forEach(([key, val]) => {
 xhr.setRequestHeader(key, val);
 });
 }
 if (xhr.upload && options.trigger) {
 xhr.upload.addEventListener("progress", (e) => {
 const percent = e.lengthComputable ? Math.round(e.loaded / e.total * 100) : 0;
 const progressDetail = { loaded: e.loaded, total: e.total, percent, trigger: options.trigger };
 options.trigger.dispatchEvent(new CustomEvent("catchy:progress", {
 bubbles: true,
 detail: progressDetail
 }));
 options.trigger.dispatchEvent(new CustomEvent("catchy-progress", {
 bubbles: true,
 detail: progressDetail
 }));
 });
 }
 xhr.onload = () => {
 const headersMap = /* @__PURE__ */ new Map();
 const rawHeaders = xhr.getAllResponseHeaders();
 rawHeaders.split("\r\n").forEach((line) => {
 const parts = line.split(": ");
 const header = parts.shift().toLowerCase();
 const value = parts.join(": ");
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
 reject(new Error("Catchy: XHR Request failed"));
 };
 if (options.signal) {
 options.signal.addEventListener("abort", () => {
 xhr.abort();
 reject(new DOMException("Aborted", "AbortError"));
 });
 }
 xhr.send(options.body || null);
 });
 }
 function submitForm(form, visitFn) {
 const action = form.getAttribute("action") || window.location.href;
 const method = (form.getAttribute("method") || "GET").toUpperCase();
 const url = new URL(action, window.location.href);
 if (method === "GET") {
 const formData = new FormData(form);
 const params = new URLSearchParams(formData);
 for (const [key, value] of params.entries()) {
 url.searchParams.set(key, value);
 }
 visitFn(url.toString(), { trigger: form });
 } else {
 const formData = new FormData(form);
 if (!formData.has("_method") && method !== "POST") {
 formData.append("_method", method);
 }
 const options = {
 method: "POST",
 body: formData,
 headers: {},
 trigger: form
 };
 const token = document.querySelector('meta[name="csrf-token"]');
 if (token) {
 options.headers["X-CSRF-TOKEN"] = token.getAttribute("content");
 }
 visitFn(url.toString(), options);
 }
 }

 // resources/js/modules/prefetch.js
 var activeRequests = /* @__PURE__ */ new Map();
 var hoverTimeout = null;
 var activePrefetchesCount = 0;
 var MAX_CONCURRENT_PREFETCH = 3;
 var prefetchQueue = [];
 function getActiveRequests() {
 return activeRequests;
 }
 async function processQueue(config, currentVersion2) {
 if (activePrefetchesCount >= MAX_CONCURRENT_PREFETCH || prefetchQueue.length === 0) {
 return;
 }
 const { url, resolve, reject } = prefetchQueue.shift();
 activePrefetchesCount++;
 try {
 const result = await performPrefetch(url, config, currentVersion2);
 resolve(result);
 } catch (e) {
 reject(e);
 } finally {
 activePrefetchesCount--;
 processQueue(config, currentVersion2);
 }
 }
 async function performPrefetch(url, config, currentVersion2) {
 try {
 const headers = { "X-Catchy-Request": "true" };
 if (currentVersion2) {
 headers["X-Catchy-Version"] = currentVersion2;
 }
 const response = await fetch(url, { headers });
 if (response.status === 409 || response.status === 429) {
 window.location.href = url;
 return null;
 }
 if (!response.ok) return null;
 const contentType = response.headers.get("content-type");
 if (!contentType || !contentType.includes("text/html")) return null;
 const html = await response.text();
 const version = response.headers.get("X-Catchy-Version") || "";
 const titleHeader = response.headers.get("X-Catchy-Title");
 let title = titleHeader ? decodeBase64Utf8(titleHeader) : "";
 const cacheEntry = {
 html,
 version,
 title,
 head: response.headers.get("X-Catchy-Head") || null,
 finalUrl: response.url || url
 };
 setCachedResponse(url, cacheEntry);
 return cacheEntry;
 } catch (e) {
 return null;
 } finally {
 activeRequests.delete(url);
 }
 }
 function prefetch(url, config, currentVersion2) {
 const cached = getCachedResponse(url, config.cacheTTL);
 if (cached) return Promise.resolve(cached);
 if (activeRequests.has(url)) {
 return activeRequests.get(url);
 }
 const promise = new Promise((resolve, reject) => {
 prefetchQueue.push({ url, resolve, reject });
 });
 activeRequests.set(url, promise);
 processQueue(config, currentVersion2);
 return promise;
 }
 function initHoverPrefetch(config, prefetchFn) {
 if (!config.prefetch) return;
 document.addEventListener("mouseenter", (event) => {
 const link = event.target && typeof event.target.closest === "function" ? event.target.closest("a") : null;
 if (!link || shouldIgnoreLink(link, null, config.ignoreAttribute)) return;
 clearTimeout(hoverTimeout);
 hoverTimeout = setTimeout(() => {
 prefetchFn(link.href);
 }, config.prefetchDelay);
 }, true);
 document.addEventListener("mouseleave", (event) => {
 const link = event.target && typeof event.target.closest === "function" ? event.target.closest("a") : null;
 if (link) clearTimeout(hoverTimeout);
 }, true);
 }
 function initViewportPrefetch(config, prefetchFn) {
 if (typeof IntersectionObserver === "undefined") return;
 const observer = new IntersectionObserver((entries) => {
 entries.forEach((entry) => {
 if (entry.isIntersecting) {
 const link = entry.target;
 if (link.href && !shouldIgnoreLink(link, null, config.ignoreAttribute)) {
 prefetchFn(link.href);
 }
 observer.unobserve(link);
 }
 });
 }, { rootMargin: "50px" });
 const observeLinks = (rootNode = document) => {
 const links = rootNode.querySelectorAll('a[data-catchy-prefetch="viewport"]');
 links.forEach((link) => observer.observe(link));
 };
 observeLinks();
 const mutationObserver = new MutationObserver((mutations) => {
 mutations.forEach((mutation) => {
 mutation.addedNodes.forEach((node) => {
 if (node.nodeType === Node.ELEMENT_NODE) {
 if (node.tagName === "A" && node.getAttribute("data-catchy-prefetch") === "viewport") {
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

 // resources/js/modules/events.js
 var pendingAction = null;
 function initEventListeners(config, visitFn, submitFormFn) {
 document.addEventListener("click", (event) => {
 const target = event.target;
 if (!target || typeof target.closest !== "function") return;
 const actionEl = target.closest("[data-catchy-click], [data-catchy-action], [data-catchy-on-click]");
 if (actionEl) {
 const actionStr = actionEl.getAttribute("data-catchy-click") || actionEl.getAttribute("data-catchy-action") || actionEl.getAttribute("data-catchy-on-click");
 if (actionStr) {
 if (actionEl.tagName === "A" || actionEl.tagName === "BUTTON" && actionEl.getAttribute("type") !== "submit") {
 event.preventDefault();
 }
 parseShorthandAction(actionStr, actionEl, "click");
 }
 }
 const confirmBtn = target.closest("[data-catchy-confirm-button]");
 if (confirmBtn && pendingAction) {
 event.preventDefault();
 event.stopImmediatePropagation();
 const actionToRun = pendingAction.execute;
 const modalId = pendingAction.modalId;
 pendingAction = null;
 const modal = document.getElementById(modalId);
 if (modal) emit("modal-close", {}, modal);
 actionToRun();
 return;
 }
 const confirmModalEl = target.closest("[data-catchy-confirm-modal]");
 if (confirmModalEl && (!pendingAction || pendingAction.trigger !== confirmModalEl)) {
 const modalId = confirmModalEl.getAttribute("data-catchy-confirm-modal");
 const link2 = target.closest("a");
 if (link2 && !shouldIgnoreLink(link2, event, config.ignoreAttribute)) {
 event.preventDefault();
 event.stopImmediatePropagation();
 pendingAction = {
 trigger: confirmModalEl,
 modalId,
 execute: () => {
 visitFn(link2.href, { trigger: link2 });
 }
 };
 const modal = document.getElementById(modalId);
 if (modal) emit("modal-open", {}, modal);
 return;
 }
 }
 const confirmEl = target.closest("[data-catchy-confirm]");
 if (confirmEl) {
 const confirmMsg = confirmEl.getAttribute("data-catchy-confirm");
 if (confirmMsg && !confirm(confirmMsg)) {
 event.preventDefault();
 event.stopImmediatePropagation();
 return;
 }
 }
 const openModalEl = target.closest("[data-catchy-open-modal]");
 if (openModalEl) {
 const modalId = openModalEl.getAttribute("data-catchy-open-modal");
 const modal = document.getElementById(modalId);
 if (modal) emit("modal-open", {}, modal);
 }
 const closeModalEl = target.closest("[data-catchy-close-modal]");
 if (closeModalEl) {
 const modalId = closeModalEl.getAttribute("data-catchy-close-modal");
 const modal = document.getElementById(modalId);
 if (modal) emit("modal-close", {}, modal);
 }
 const openOffcanvasEl = target.closest("[data-catchy-open-offcanvas]");
 if (openOffcanvasEl) {
 const offcanvasId = openOffcanvasEl.getAttribute("data-catchy-open-offcanvas");
 const offcanvas = document.getElementById(offcanvasId);
 if (offcanvas) emit("offcanvas-open", {}, offcanvas);
 }
 const closeOffcanvasEl = target.closest("[data-catchy-close-offcanvas]");
 if (closeOffcanvasEl) {
 const offcanvasId = closeOffcanvasEl.getAttribute("data-catchy-close-offcanvas");
 const offcanvas = document.getElementById(offcanvasId);
 if (offcanvas) emit("offcanvas-close", {}, offcanvas);
 }
 const link = target.closest("a");
 if (link && !shouldIgnoreLink(link, event, config.ignoreAttribute)) {
 event.preventDefault();
 visitFn(link.href, { trigger: link });
 }
 });
 document.addEventListener("submit", (event) => {
 const form = event.target && typeof event.target.closest === "function" ? event.target.closest("form") : null;
 if (!form || shouldIgnoreForm(form, config.ignoreAttribute)) return;
 const confirmModalId = form.getAttribute("data-catchy-confirm-modal");
 if (confirmModalId && (!pendingAction || pendingAction.trigger !== form)) {
 event.preventDefault();
 event.stopImmediatePropagation();
 pendingAction = {
 trigger: form,
 modalId: confirmModalId,
 execute: () => {
 submitFormFn(form);
 }
 };
 const modal = document.getElementById(confirmModalId);
 if (modal) emit("modal-open", {}, modal);
 return;
 }
 const confirmMsg = form.getAttribute("data-catchy-confirm");
 if (confirmMsg && !confirm(confirmMsg)) {
 event.preventDefault();
 event.stopImmediatePropagation();
 return;
 }
 event.preventDefault();
 submitFormFn(form);
 });
 window.addEventListener("popstate", (event) => {
 const state = event.state;
 visitFn(window.location.href, { state }, false);
 });
 document.addEventListener("catchy:modal-closed", (event) => {
 if (pendingAction && pendingAction.modalId === event.target.id) {
 pendingAction = null;
 }
 });
 document.addEventListener("catchy-modal-closed", (event) => {
 if (pendingAction && pendingAction.modalId === event.target.id) {
 pendingAction = null;
 }
 });
 }
 function createDynamicModal(id = "catchy-dynamic-modal") {
 let modal = document.getElementById(id);
 if (modal) return modal;
 const backdrop = document.createElement("div");
 backdrop.id = id;
 backdrop.className = "catchy-modal-backdrop";
 const container = document.createElement("div");
 container.className = "catchy-modal-container";
 const header = document.createElement("div");
 header.className = "catchy-modal-header";
 const title = document.createElement("h3");
 title.className = "catchy-modal-title";
 title.textContent = "Loading...";
 const closeBtn = document.createElement("button");
 closeBtn.className = "catchy-modal-close";
 closeBtn.setAttribute("aria-label", "Close modal");
 closeBtn.innerHTML = `
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6" style="width: 24px; height: 24px;">
 <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
 </svg>
 `;
 header.appendChild(title);
 header.appendChild(closeBtn);
 const body = document.createElement("div");
 body.className = "catchy-modal-body";
 container.appendChild(header);
 container.appendChild(body);
 backdrop.appendChild(container);
 document.body.appendChild(backdrop);
 const closeModal = () => {
 backdrop.classList.remove("show");
 setTimeout(() => {
 if (backdrop.parentNode) {
 backdrop.parentNode.removeChild(backdrop);
 }
 }, 200);
 document.removeEventListener("keydown", handleEsc);
 };
 const handleEsc = (e) => {
 if (e.key === "Escape") closeModal();
 };
 closeBtn.addEventListener("click", closeModal);
 backdrop.addEventListener("click", (e) => {
 if (e.target === backdrop) closeModal();
 });
 document.addEventListener("keydown", handleEsc);
 backdrop.addEventListener("modal-open", () => {
 backdrop.offsetHeight;
 backdrop.classList.add("show");
 });
 backdrop.addEventListener("modal-close", closeModal);
 backdrop.addEventListener("modal-load", (e) => {
 if (e.detail) {
 if (e.detail.title) title.textContent = e.detail.title;
 body.innerHTML = e.detail.html;
 const scripts = body.querySelectorAll("script");
 scripts.forEach((oldScript) => {
 if (oldScript.hasAttribute("data-catchy-ignore")) return;
 const newScript = document.createElement("script");
 Array.from(oldScript.attributes).forEach((attr) => {
 newScript.setAttribute(attr.name, attr.value);
 });
 newScript.textContent = oldScript.textContent;
 oldScript.parentNode.replaceChild(newScript, oldScript);
 });
 if (window.Alpine && typeof window.Alpine.initTree === "function") {
 window.Alpine.initTree(body);
 }
 }
 });
 return backdrop;
 }
 function resolveModal(triggerElement) {
 const modalAttr = triggerElement && typeof triggerElement.getAttribute === "function" ? triggerElement.getAttribute("data-catchy-modal") || triggerElement.getAttribute("catchy-modal") : null;
 if (modalAttr && modalAttr !== "" && modalAttr !== "true") {
 const specificModal = document.getElementById(modalAttr);
 if (specificModal) return specificModal;
 }
 if (triggerElement && typeof triggerElement.closest === "function") {
 const closestModal = triggerElement.closest("[catchy-modal]") || triggerElement.closest("#catchy-modal");
 if (closestModal) return closestModal;
 }
 const standardModal = document.querySelector("[catchy-modal]") || document.getElementById("catchy-modal");
 if (standardModal) return standardModal;
 const hasModalTrigger = triggerElement && typeof triggerElement.hasAttribute === "function" && (triggerElement.hasAttribute("data-catchy-modal") || triggerElement.hasAttribute("catchy-modal"));
 if (hasModalTrigger) {
 return createDynamicModal();
 }
 return null;
 }
 function resolveOffcanvas(triggerElement) {
 const offcanvasAttr = triggerElement && typeof triggerElement.getAttribute === "function" ? triggerElement.getAttribute("data-catchy-offcanvas") : null;
 if (offcanvasAttr && offcanvasAttr !== "" && offcanvasAttr !== "true") {
 const specificOffcanvas = document.getElementById(offcanvasAttr);
 if (specificOffcanvas) return specificOffcanvas;
 }
 if (triggerElement && typeof triggerElement.closest === "function") {
 const closestOffcanvas = triggerElement.closest("[catchy-offcanvas]") || triggerElement.closest("#catchy-offcanvas");
 if (closestOffcanvas) return closestOffcanvas;
 }
 return document.querySelector("[catchy-offcanvas]") || document.getElementById("catchy-offcanvas");
 }
 function handleLifecycleTriggers(trigger, type) {
 if (!trigger || typeof trigger.getAttribute !== "function") return;
 const shorthand = trigger.getAttribute(`data-catchy-on-${type}`);
 if (shorthand) {
 parseShorthandAction(shorthand, trigger, type);
 }
 const openModal = trigger.getAttribute(`data-catchy-${type}-open-modal`);
 if (openModal) {
 const m = document.getElementById(openModal);
 if (m) emit("modal-open", {}, m);
 }
 const closeModal = trigger.getAttribute(`data-catchy-${type}-close-modal`);
 if (closeModal) {
 const m = document.getElementById(closeModal);
 if (m) emit("modal-close", {}, m);
 }
 const openOffcanvas = trigger.getAttribute(`data-catchy-${type}-open-offcanvas`);
 if (openOffcanvas) {
 const oc = document.getElementById(openOffcanvas);
 if (oc) emit("offcanvas-open", {}, oc);
 }
 const closeOffcanvas = trigger.getAttribute(`data-catchy-${type}-close-offcanvas`);
 if (closeOffcanvas) {
 const oc = document.getElementById(closeOffcanvas);
 if (oc) emit("offcanvas-close", {}, oc);
 }
 if (type === "success" && trigger.tagName === "FORM" && trigger.hasAttribute("data-catchy-success-reset")) {
 trigger.reset();
 }
 const toastMsg = trigger.getAttribute(`data-catchy-${type}-toast`);
 if (toastMsg) {
 emit("flash", { message: toastMsg, type });
 }
 const reloadId = trigger.getAttribute(`data-catchy-${type}-reload`);
 if (reloadId) {
 emit("lazy-reload", { id: reloadId });
 }
 }
 function parseShorthandAction(actionStr, trigger, type) {
 const actions = actionStr.split(";").map((a) => a.trim()).filter(Boolean);
 actions.forEach((action) => {
 const parts = action.split(":");
 const verb = parts[0];
 switch (verb) {
 case "open":
 case "close": {
 const component = parts[1];
 const id = parts[2];
 if (component && id) {
 const el = document.getElementById(id);
 if (el) emit(`${component}-${verb}`, {}, el);
 }
 break;
 }
 case "reset": {
 const id = parts[1];
 if (id) {
 const el = document.getElementById(id);
 if (el && el.tagName === "FORM") el.reset();
 } else if (trigger && trigger.tagName === "FORM") {
 trigger.reset();
 }
 break;
 }
 case "toast": {
 const message = parts.slice(1).join(":");
 if (message) emit("flash", { message, type });
 break;
 }
 case "reload": {
 const id = parts[1];
 if (id) emit("lazy-reload", { id });
 break;
 }
 case "click": {
 const id = parts[1];
 if (id) {
 const el = document.getElementById(id);
 if (el) el.click();
 }
 break;
 }
 case "submit": {
 const id = parts[1];
 if (id) {
 const el = document.getElementById(id);
 if (el && el.tagName === "FORM") {
 el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
 }
 }
 break;
 }
 case "toggle":
 case "add":
 case "remove": {
 const className = parts[1];
 const id = parts[2];
 if (className && id) {
 const el = document.getElementById(id);
 if (el) {
 if (verb === "toggle") el.classList.toggle(className);
 else if (verb === "add") el.classList.add(className);
 else if (verb === "remove") el.classList.remove(className);
 }
 }
 break;
 }
 case "copy": {
 const sourceId = parts[1];
 const targetId = parts[2];
 if (sourceId && targetId) {
 const src = document.getElementById(sourceId);
 const dest = document.getElementById(targetId);
 if (src && dest) {
 if ("value" in src && "value" in dest) {
 dest.value = src.value;
 dest.dispatchEvent(new Event("input", { bubbles: true }));
 dest.dispatchEvent(new Event("change", { bubbles: true }));
 } else {
 dest.innerHTML = src.innerHTML;
 }
 }
 }
 break;
 }
 }
 });
 }

 // resources/js/modules/navigation.js
 var currentVersion = "";
 var activeAbortController = null;
 function getCurrentVersion() {
 return currentVersion;
 }
 async function visit(url, options = {}, updateHistory = true, config = {}, Alpine = null) {
 if (navigator.onLine === false) {
 emit("flash", { message: "Cannot navigate. You are currently offline.", type: "warning" });
 return;
 }
 if (activeAbortController) {
 activeAbortController.abort();
 }
 activeAbortController = new AbortController();
 const { signal } = activeAbortController;
 const oldPathname = window.location.pathname;
 try {
 window.history.replaceState({
 ...window.history.state,
 scrollX: window.scrollX,
 scrollY: window.scrollY
 }, "");
 } catch (e) {
 }
 const trigger = options.trigger || document;
 if (!emit("before-visit", { url, options, trigger }, trigger, { cancelable: true })) {
 return;
 }
 if (executeCallback(trigger, "data-catchy-beforesend", { url, options, trigger }) === false) {
 return;
 }
 if (!emit("start", { url, options, trigger }, trigger, { cancelable: true })) {
 return;
 }
 const submitBtn = setupSubmitSpinner(trigger);
 const optimisticClasses = trigger && typeof trigger.getAttribute === "function" ? trigger.getAttribute("data-catchy-optimistic-class") : null;
 if (optimisticClasses && trigger) {
 trigger.classList.add(...optimisticClasses.split(" ").filter(Boolean));
 }
 const cleanUpUi = () => {
 restoreSubmitButton(submitBtn);
 if (optimisticClasses && trigger) {
 trigger.classList.remove(...optimisticClasses.split(" ").filter(Boolean));
 }
 };
 const isGet = !options.method || options.method.toUpperCase() === "GET";
 const targetId = getTargetContainerId(trigger, options, config);
 const cached = isGet && config.swr ? getCachedResponse(url, config.cacheTTL) : null;
 if (cached) {
 try {
 renderResponseData(cached, targetId, config, Alpine, trigger, false);
 applyScroll(trigger, targetId, cached.finalUrl, oldPathname, options, config);
 if (updateHistory) {
 manageHistory(cached.finalUrl, trigger, isGet, null);
 }
 cleanUpUi();
 emit("end", { url: cached.finalUrl, trigger, fromCache: true }, trigger);
 emit("after-visit", { url: cached.finalUrl, trigger, fromCache: true }, trigger);
 } catch (e) {
 console.error("Catchy: SWR instant render failed, falling back to network.", e);
 }
 fetchFreshContent(url, options, targetId, config, Alpine, trigger, cleanUpUi, updateHistory, true, signal);
 return;
 }
 startLoading();
 fetchFreshContent(url, options, targetId, config, Alpine, trigger, cleanUpUi, updateHistory, false, signal);
 }
 async function fetchFreshContent(url, options, targetId, config, Alpine, trigger, cleanUpUi, updateHistory, isRevalidation = false, signal = null) {
 const isGet = !options.method || options.method.toUpperCase() === "GET";
 const oldPathname = window.location.pathname;
 try {
 let response = null;
 const activeRequests2 = getActiveRequests();
 let responseData = null;
 if (isGet && activeRequests2.has(url)) {
 responseData = await activeRequests2.get(url);
 }
 let html, finalUrl, version, headContent, title;
 if (responseData) {
 html = responseData.html;
 finalUrl = responseData.finalUrl;
 version = responseData.version;
 headContent = responseData.head || null;
 title = responseData.title || "";
 } else {
 const fetchHeaders = {
 ...options.headers || {},
 "X-Catchy-Request": "true",
 "X-Catchy-Target": targetId
 };
 if (currentVersion) {
 fetchHeaders["X-Catchy-Version"] = currentVersion;
 }
 const fetchOptions = { ...options, headers: fetchHeaders, signal };
 if (options.method && options.method.toUpperCase() !== "GET") {
 response = await xhrRequest(url, fetchOptions);
 } else {
 response = await fetch(url, fetchOptions);
 }
 if (response.status === 409) {
 window.location.href = url;
 return;
 }
 if (!response.ok) {
 handleFetchError(response, trigger);
 throw new Error(`Catchy: Request failed with status ${response.status}`);
 }
 const redirectUrl = response.headers.get("X-Catchy-Redirect");
 if (redirectUrl) {
 handleRedirect(redirectUrl, trigger, config, Alpine, updateHistory);
 return;
 }
 const contentType = response.headers.get("content-type");
 if (!contentType || !contentType.includes("text/html")) {
 window.location.href = response.url || url;
 return;
 }
 html = await response.text();
 finalUrl = response.url || url;
 version = response.headers.get("X-Catchy-Version") || "";
 headContent = response.headers.get("X-Catchy-Head") || null;
 processFlashHeader(response, trigger);
 const titleHeader = response.headers.get("X-Catchy-Title");
 title = titleHeader ? decodeBase64Utf8(titleHeader) : "";
 }
 const dataToRender = { html, version, title, head: headContent, finalUrl };
 if (isGet) {
 setCachedResponse(url, dataToRender);
 }
 if (version) currentVersion = version;
 if (activeAbortController && activeAbortController.signal === signal) {
 activeAbortController = null;
 }
 renderResponseData(dataToRender, targetId, config, Alpine, trigger, isRevalidation);
 if (updateHistory && !isRevalidation) {
 manageHistory(finalUrl, trigger, isGet, response);
 }
 if (!isRevalidation) {
 applyScroll(trigger, targetId, finalUrl, oldPathname, options, config);
 stopLoading();
 executeCallback(trigger, "data-catchy-success", { url: finalUrl, trigger });
 handleLifecycleTriggers(trigger, "success");
 cleanUpUi();
 emit("end", { url: finalUrl, trigger }, trigger);
 emit("after-visit", { url: finalUrl, trigger }, trigger);
 } else {
 stopLoading();
 cleanUpUi();
 }
 } catch (error) {
 if (error.name === "AbortError") {
 return;
 }
 resetLoading();
 cleanUpUi();
 console.error("Catchy: AJAX request error, falling back to full load.", error);
 executeCallback(trigger, "data-catchy-error", { url, error, trigger });
 handleLifecycleTriggers(trigger, "error");
 emit("error", { url, error, trigger }, trigger);
 if (isGet) {
 window.location.href = url;
 }
 }
 }
 function renderResponseData(data, targetId, config, Alpine, trigger, isRevalidation = false) {
 if (data.title) {
 document.title = data.title;
 }
 if (data.head) {
 mergeHeadFromHeader(data.head);
 }
 const parser = new DOMParser();
 const doc = parser.parseFromString(data.html, "text/html");
 if (doc.head) {
 mergeHead(doc.head);
 }
 const isModalTarget = trigger && typeof trigger.hasAttribute === "function" && (trigger.hasAttribute("data-catchy-modal") || trigger.hasAttribute("catchy-modal"));
 if (isModalTarget) {
 const incomingContent = doc.getElementById(targetId) || doc.getElementById(config.containerId) || doc.body;
 const modal = resolveModal(trigger);
 if (modal) {
 emit("modal-load", { html: incomingContent.innerHTML, title: doc.title || "" }, modal);
 emit("modal-open", {}, modal);
 return;
 }
 }
 const isOffcanvasTarget = trigger && typeof trigger.hasAttribute === "function" && (trigger.hasAttribute("data-catchy-offcanvas") || trigger.hasAttribute("catchy-offcanvas"));
 if (isOffcanvasTarget) {
 const incomingContent = doc.getElementById(targetId) || doc.getElementById(config.containerId) || doc.body;
 const offcanvas = resolveOffcanvas(trigger);
 if (offcanvas) {
 emit("offcanvas-load", { html: incomingContent.innerHTML, title: doc.title || "" }, offcanvas);
 emit("offcanvas-open", {}, offcanvas);
 return;
 }
 }
 const isTriggerInOffcanvas = trigger && typeof trigger.closest === "function" && (trigger.closest("[catchy-offcanvas]") || trigger.closest("#catchy-offcanvas"));
 const isFormPost = trigger && trigger.tagName === "FORM" && trigger.getAttribute("method")?.toUpperCase() !== "GET";
 if (isTriggerInOffcanvas && isFormPost) {
 const offcanvas = resolveOffcanvas(trigger);
 if (offcanvas) emit("offcanvas-close", {}, offcanvas);
 }
 const isTriggerInModal = trigger && typeof trigger.closest === "function" && (trigger.closest("[catchy-modal]") || trigger.closest("#catchy-modal"));
 if (isTriggerInModal && isFormPost) {
 const modal = resolveModal(trigger);
 if (modal) emit("modal-close", {}, modal);
 }
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
 emit("before-morph", { url: data.finalUrl, element: appContainer, trigger }, trigger);
 emit("morphing", { url: data.finalUrl, html: data.html, element: appContainer, trigger }, trigger);
 if (!Alpine.morph) {
 console.error("Catchy: Alpine.morph is not defined. Ensure @alpinejs/morph is loaded.");
 window.location.href = data.finalUrl;
 return;
 }
 const oobElements = doc.querySelectorAll("[data-catchy-swap-oob], [catchy-swap-oob]");
 let defaultTransition = config.viewTransitions;
 try {
 const currentUrlObj = new URL(window.location.href);
 const targetUrlObj = new URL(data.finalUrl, window.location.href);
 if (currentUrlObj.pathname === targetUrlObj.pathname) {
 defaultTransition = "none";
 }
 } catch (e) {
 }
 const transitionType = isRevalidation ? "none" : trigger && typeof trigger.getAttribute === "function" ? trigger.getAttribute("data-catchy-transition") || trigger.getAttribute("catchy-transition") || defaultTransition : defaultTransition;
 const performDomUpdates = () => {
 Alpine.morph(appContainer, incomingApp.outerHTML, {
 updating(el, toEl, childrenOnly, skip) {
 if (el.nodeType === Node.ELEMENT_NODE && (el.hasAttribute("catchy-persist") || el.hasAttribute("data-catchy-persist") || el.closest("[catchy-persist], [data-catchy-persist]"))) {
 skip();
 }
 }
 });
 executeScriptsInContainer(appContainer);
 focusAutofocusElements(appContainer);
 oobElements.forEach((incomingOob) => {
 const id = incomingOob.id;
 if (!id) {
 console.warn("Catchy: Out-of-band element is missing an ID.", incomingOob);
 return;
 }
 const activeOob = document.getElementById(id);
 if (!activeOob) return;
 const strategy = incomingOob.getAttribute("data-catchy-swap-oob") || incomingOob.getAttribute("catchy-swap-oob");
 if (strategy === "innerHTML") {
 if (Alpine.morph) {
 const temp = document.createElement(activeOob.tagName);
 temp.innerHTML = incomingOob.innerHTML;
 Alpine.morph(activeOob, temp.outerHTML, {
 childrenOnly: true,
 updating(el, toEl, childrenOnly, skip) {
 if (el.nodeType === Node.ELEMENT_NODE && (el.hasAttribute("catchy-persist") || el.hasAttribute("data-catchy-persist") || el.closest("[catchy-persist], [data-catchy-persist]"))) {
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
 if (el.nodeType === Node.ELEMENT_NODE && (el.hasAttribute("catchy-persist") || el.hasAttribute("data-catchy-persist") || el.closest("[catchy-persist], [data-catchy-persist]"))) {
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
 };
 if (transitionType && transitionType !== "none" && document.startViewTransition) {
 document.documentElement.setAttribute("data-catchy-transition", transitionType);
 const transition = document.startViewTransition(() => performDomUpdates());
 transition.ready.catch(() => {
 });
 transition.updateCallbackDone.catch(() => {
 });
 transition.finished.then(() => {
 document.documentElement.removeAttribute("data-catchy-transition");
 emit("after-morph", { url: data.finalUrl, element: appContainer, trigger }, trigger);
 }).catch(() => {
 document.documentElement.removeAttribute("data-catchy-transition");
 emit("after-morph", { url: data.finalUrl, element: appContainer, trigger }, trigger);
 });
 } else {
 performDomUpdates();
 emit("after-morph", { url: data.finalUrl, element: appContainer, trigger }, trigger);
 }
 }
 function applyScroll(trigger, targetId, finalUrl, oldPathname, options, config) {
 if (options.state && typeof options.state.scrollX === "number" && typeof options.state.scrollY === "number") {
 window.scrollTo({ left: options.state.scrollX, top: options.state.scrollY, behavior: "instant" });
 return;
 }
 const scrollSetting = trigger && typeof trigger.getAttribute === "function" ? trigger.getAttribute("data-catchy-scroll") : null;
 if (scrollSetting === "preserve" || scrollSetting === "keep" || options.scroll === "preserve" || options.scroll === "keep") {
 return;
 }
 if (scrollSetting === "top" || options.scroll === "top") {
 window.scrollTo({ top: 0, behavior: "instant" });
 return;
 }
 const finalURLObj = new URL(finalUrl);
 if (finalURLObj.hash) {
 const el = document.querySelector(finalURLObj.hash);
 if (el) el.scrollIntoView();
 return;
 }
 const isFormSubmit = trigger && trigger.tagName === "FORM";
 const isGet = !options.method || options.method.toUpperCase() === "GET";
 if (isGet && targetId === config.containerId && (!isFormSubmit || finalURLObj.pathname !== oldPathname)) {
 window.scrollTo({ top: 0, behavior: "instant" });
 }
 }
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
 function handleFetchError(response, trigger) {
 if (response.status === 422 || response.status === 400) {
 const contentType = response.headers.get("content-type");
 if (contentType && contentType.includes("application/json")) {
 response.text().then((text) => {
 try {
 const json = JSON.parse(text);
 if (json.errors) {
 emit("validation-errors", json.errors);
 if (trigger) emit("validation-errors", json.errors, trigger);
 }
 } catch (e) {
 }
 });
 }
 }
 }
 function processFlashHeader(response, trigger) {
 const flashHeader = response.headers.get("X-Catchy-Flash");
 if (!flashHeader) return;
 try {
 const flashJson = decodeBase64Utf8(flashHeader);
 const flash = JSON.parse(flashJson);
 emit("flash", flash);
 if (flash.validation_errors) {
 emit("validation-errors", flash.validation_errors);
 if (trigger) emit("validation-errors", flash.validation_errors, trigger);
 }
 } catch (e) {
 console.error("Catchy: Failed to decode X-Catchy-Flash header", e);
 }
 }
 function setupSubmitSpinner(trigger) {
 if (trigger && (trigger.tagName === "FORM" || trigger instanceof HTMLFormElement) && !trigger.hasAttribute("data-catchy-no-loader")) {
 const submitBtn = trigger.querySelector('[type="submit"]') || trigger.querySelector('button:not([type="button"])');
 if (submitBtn && !submitBtn.dataset.originalHtml) {
 submitBtn.dataset.originalHtml = submitBtn.innerHTML;
 submitBtn.disabled = true;
 submitBtn.classList.add("pointer-events-none");
 const spinnerHtml = `<svg class="animate-spin -ms-1 me-2 h-4 w-4 text-current inline-block align-text-bottom" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style="vertical-align: middle;"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> `;
 submitBtn.innerHTML = spinnerHtml + submitBtn.innerHTML;
 return submitBtn;
 }
 }
 return null;
 }
 function restoreSubmitButton(submitBtn) {
 if (submitBtn && submitBtn.dataset.originalHtml) {
 submitBtn.innerHTML = submitBtn.dataset.originalHtml;
 submitBtn.disabled = false;
 submitBtn.classList.remove("pointer-events-none");
 delete submitBtn.dataset.originalHtml;
 }
 }
 function getTargetContainerId(trigger, options, config) {
 return options.targetId || (trigger && typeof trigger.getAttribute === "function" ? trigger.getAttribute("data-catchy-target") : null) || config.containerId;
 }
 function manageHistory(finalUrl, trigger, isGet, response) {
 const shouldUpdateHistory = isGet || response && response.redirected;
 const hasHistoryAttr = trigger && typeof trigger.getAttribute === "function" && trigger.getAttribute("data-catchy-history") === "false";
 const isModalOrOffcanvas = trigger && typeof trigger.hasAttribute === "function" && (trigger.hasAttribute("data-catchy-modal") || trigger.hasAttribute("catchy-modal") || trigger.hasAttribute("data-catchy-offcanvas") || trigger.hasAttribute("catchy-offcanvas"));
 if (shouldUpdateHistory && !hasHistoryAttr && !isModalOrOffcanvas) {
 window.history.pushState({ catchy: true, url: finalUrl }, "", finalUrl);
 }
 }

 // resources/js/modules/lazy.js
 function registerLazyDirective(Alpine, config) {
 Alpine.directive("catchy-lazy", (el, { expression, modifiers }, { cleanup }) => {
 const url = expression;
 if (!url) return;
 let loaded = false;
 const loadContent = () => {
 if (loaded) return;
 emit("start", { trigger: el });
 fetch(url, {
 headers: { "X-Catchy-Request": "true" }
 }).then((response) => {
 if (!response.ok) throw new Error("Lazy load failed");
 return response.text();
 }).then((html) => {
 const parser = new DOMParser();
 const doc = parser.parseFromString(html, "text/html");
 const fragment = doc.getElementById(config.containerId) || doc.body;
 el.innerHTML = fragment.innerHTML;
 loaded = true;
 executeScriptsInContainer(el);
 emit("end", { trigger: el });
 }).catch((err) => {
 console.error(err);
 emit("error", { error: err, trigger: el });
 });
 };
 const reloadContent = () => {
 loaded = false;
 loadContent();
 };
 const handleReloadEvent = (event) => {
 if (!event.detail || !event.detail.id || event.detail.id === el.id) {
 reloadContent();
 }
 };
 window.addEventListener("catchy:lazy-reload", handleReloadEvent);
 window.addEventListener("catchy-lazy-reload", handleReloadEvent);
 cleanup(() => {
 window.removeEventListener("catchy:lazy-reload", handleReloadEvent);
 window.removeEventListener("catchy-lazy-reload", handleReloadEvent);
 });
 if (modifiers.includes("intersect")) {
 const observer = new IntersectionObserver((entries) => {
 entries.forEach((entry) => {
 if (entry.isIntersecting) {
 loadContent();
 observer.disconnect();
 }
 });
 }, { threshold: 0.1 });
 observer.observe(el);
 cleanup(() => observer.disconnect());
 } else {
 loadContent();
 }
 });
 }

 // resources/js/modules/sync.js
 function registerSyncDirective(Alpine, config) {
 Alpine.directive("catchy-sync", (el, { expression, modifiers }, { evaluate, cleanup }) => {
 const eventName = modifiers.includes("input") ? "input" : "change";
 let debounceMs = 0;
 const debounceIndex = modifiers.indexOf("debounce");
 if (debounceIndex !== -1 && modifiers[debounceIndex + 1]) {
 const timeStr = modifiers[debounceIndex + 1];
 debounceMs = parseInt(timeStr) || 300;
 }
 let targetId = config.containerId;
 const targetIndex = modifiers.indexOf("target");
 if (targetIndex !== -1 && modifiers[targetIndex + 1]) {
 targetId = modifiers[targetIndex + 1];
 }
 let timeout = null;
 const handler = async () => {
 const value = el.value;
 const name = el.name || el.id;
 const url = expression;
 const form = el.closest("form");
 try {
 const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
 const headers = { "X-Catchy-Request": "true" };
 if (csrfToken) {
 headers["X-CSRF-TOKEN"] = csrfToken;
 }
 let body;
 if (modifiers.includes("form") && form) {
 body = new FormData(form);
 if (!body.has("_token") && csrfToken) {
 body.append("_token", csrfToken);
 }
 } else {
 if (!name) {
 console.warn("Catchy: x-catchy-sync requires el to have a name or id attribute when not using .form modifier.");
 return;
 }
 headers["Content-Type"] = "application/json";
 body = JSON.stringify({ [name]: value });
 }
 const response = await fetch(url, {
 method: "POST",
 headers,
 body
 });
 if (response.ok) {
 const html = await response.text();
 const parser = new DOMParser();
 const doc = parser.parseFromString(html, "text/html");
 const incoming = doc.getElementById(targetId);
 const current = document.getElementById(targetId);
 if (incoming && current) {
 Alpine.morph(current, incoming.outerHTML);
 executeScriptsInContainer(current);
 focusAutofocusElements(current);
 }
 }
 } catch (e) {
 console.error("Catchy: x-catchy-sync request failed:", e);
 }
 };
 const listener = () => {
 if (debounceMs > 0) {
 clearTimeout(timeout);
 timeout = setTimeout(handler, debounceMs);
 } else {
 handler();
 }
 };
 el.addEventListener(eventName, listener);
 cleanup(() => {
 el.removeEventListener(eventName, listener);
 clearTimeout(timeout);
 });
 });
 }

 // resources/js/modules/connectivity.js
 function initConnectivity() {
 window.addEventListener("offline", () => {
 emit("flash", { message: "No internet connection. Operating in offline mode.", type: "danger" });
 });
 window.addEventListener("online", () => {
 emit("flash", { message: "Connection restored. Back online!", type: "success" });
 });
 }

 // resources/js/catchy-modular.js
 function CatchyPlugin(Alpine) {
 "use strict";
 if (Alpine.catchy) {
 return;
 }
 setTimeout(() => {
 if (!Alpine.morph) {
 console.error(
 "Catchy: The Alpine.js Morph plugin is required but not loaded.\nPlease ensure `@alpinejs/morph` is imported and registered:\nhttps://alpinejs.dev/plugins/morph"
 );
 }
 }, 50);
 const config = resolveConfig();
 initLoader(config);
 const boundVisit = (url, options = {}, updateHistory = true) => {
 return visit(url, options, updateHistory, config, Alpine);
 };
 const boundPrefetch = (url) => {
 return prefetch(url, config, getCurrentVersion());
 };
 const boundSubmitForm = (form) => {
 return submitForm(form, boundVisit);
 };
 registerLazyDirective(Alpine, config);
 registerSyncDirective(Alpine, config);
 initEventListeners(config, boundVisit, boundSubmitForm);
 initHoverPrefetch(config, boundPrefetch);
 initViewportPrefetch(config, boundPrefetch);
 initConnectivity();
 Alpine.catchy = {
 visit: boundVisit,
 prefetch: boundPrefetch,
 cache: getCache(),
 startLoading,
 stopLoading
 };
 }
 if (typeof window !== "undefined") {
 window.CatchyPlugin = CatchyPlugin;
 if (window.Alpine) {
 window.Alpine.plugin(CatchyPlugin);
 } else {
 document.addEventListener("alpine:init", () => {
 if (window.Alpine) window.Alpine.plugin(CatchyPlugin);
 });
 }
 document.dispatchEvent(new CustomEvent("catchy:loaded"));
 }
 var catchy_modular_default = CatchyPlugin;
})();
