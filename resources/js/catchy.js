/**
 * CatchyUI/Catchy - Alpine.js SPA Plugin v1.5.4
 * (c) 2026 CatchyUI
 * Released under the MIT License.
 */
(() => {
  // resources/js/modules/config.js
  var CatchyConfig = class {
    /**
     * Create a resolved configuration object from window.CatchyConfig.
     *
     * @returns {Object}
     */
    resolve() {
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
        viewTransitions: c.viewTransitions || "fade",
        version: c.version || ""
      };
    }
  };
  var configInstance = new CatchyConfig();
  var resolveConfig = () => configInstance.resolve();

  // resources/js/modules/loader.js
  var CatchyLoader = class {
    constructor() {
      this.element = null;
      this.timer = null;
      this.interval = null;
      this.fadeOutTimer = null;
      this.resetTimer = null;
    }
    /**
     * Initialize the loading bar DOM element and CSS styles.
     *
     * @param {Object} config
     */
    init(config) {
      if (!config.loadingBar || this.element) return;
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
      this.element = document.createElement("div");
      this.element.id = "catchy-loader";
      document.body.appendChild(this.element);
    }
    /**
     * Triggers the CSS loader animation.
     */
    start() {
      document.body.classList.add("catchy-loading");
      document.documentElement.classList.add("catchy-loading");
      if (!this.element) return;
      this.clearTimers();
      this.timer = setTimeout(() => {
        this.element.style.width = "0%";
        this.element.style.opacity = "1";
        let width = 0;
        this.interval = setInterval(() => {
          if (width < 88) {
            width += (90 - width) * 0.08;
            this.element.style.width = `${width}%`;
          }
        }, 150);
      }, 40);
    }
    /**
     * Fills progress loader to 100% and fades out.
     */
    stop() {
      document.body.classList.remove("catchy-loading");
      document.documentElement.classList.remove("catchy-loading");
      if (!this.element) return;
      this.clearTimers();
      this.element.style.width = "100%";
      this.fadeOutTimer = setTimeout(() => {
        this.element.style.opacity = "0";
        this.resetTimer = setTimeout(() => {
          this.element.style.width = "0%";
        }, 400);
      }, 100);
    }
    /**
     * Instantly resets the loader status.
     */
    reset() {
      document.body.classList.remove("catchy-loading");
      document.documentElement.classList.remove("catchy-loading");
      if (!this.element) return;
      this.clearTimers();
      this.element.style.opacity = "0";
      this.element.style.width = "0%";
    }
    /**
     * Utility to clear all running timers.
     */
    clearTimers() {
      clearTimeout(this.timer);
      clearInterval(this.interval);
      clearTimeout(this.fadeOutTimer);
      clearTimeout(this.resetTimer);
    }
  };
  var loaderInstance = new CatchyLoader();
  var initLoader = (config) => loaderInstance.init(config);
  var startLoading = () => loaderInstance.start();
  var stopLoading = () => loaderInstance.stop();
  var resetLoading = () => loaderInstance.reset();

  // resources/js/modules/cache.js
  var CatchyCache = class {
    constructor() {
      this.cache = /* @__PURE__ */ new Map();
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
  };
  var cacheInstance = new CatchyCache();
  var getCachedResponse = (url, ttl) => cacheInstance.get(url, ttl);
  var setCachedResponse = (url, data) => cacheInstance.set(url, data);
  var clearCache = () => cacheInstance.clear();
  var getCache = () => cacheInstance.getRaw();

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
        callback = element.getAttribute("data-catchy-on-beforesend") || element.getAttribute("onbeforesend") || element.getAttribute("beforesend");
      } else if (attrName === "data-catchy-success") {
        callback = element.getAttribute("data-catchy-on-success") || element.getAttribute("onsuccess") || element.getAttribute("success");
      } else if (attrName === "data-catchy-error") {
        callback = element.getAttribute("data-catchy-on-error") || element.getAttribute("onerror") || element.getAttribute("error");
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
  var CatchyHeadMerger = class {
    /**
     * Merges head metadata from incoming document to current document.
     * Handles meta tags, link tags, and style tags.
     *
     * @param {HTMLHeadElement} incomingHead
     */
    merge(incomingHead) {
      if (!incomingHead) return;
      this.mergeMetaTags(incomingHead);
      this.mergeLinkTags(incomingHead);
      this.mergeStyleTags(incomingHead);
    }
    /**
     * Merge head content from base64-encoded X-Catchy-Head header.
     * Parses the HTML fragment and merges relevant elements.
     *
     * @param {string} base64Head - Base64-encoded head HTML content
     */
    mergeFromHeader(base64Head) {
      if (!base64Head) return;
      const headHtml = decodeBase64Utf8(base64Head);
      if (!headHtml) return;
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<head>${headHtml}</head>`, "text/html");
      if (doc.head) {
        this.merge(doc.head);
      }
    }
    /**
     * Merge meta tags from incoming head into current document head.
     */
    mergeMetaTags(incomingHead) {
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
    /**
     * Merge link tags (stylesheets, canonical, etc.) from incoming head.
     */
    mergeLinkTags(incomingHead) {
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
    /**
     * Merge style tags from incoming head.
     */
    mergeStyleTags(incomingHead) {
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
        } else {
          const exists = Array.from(document.head.querySelectorAll("style")).some(
            (s) => s.textContent.trim() === incomingStyle.textContent.trim()
          );
          if (!exists) {
            document.head.appendChild(incomingStyle.cloneNode(true));
          }
        }
      });
    }
  };
  var headMergerInstance = new CatchyHeadMerger();
  var mergeHead = (incomingHead) => headMergerInstance.merge(incomingHead);
  var mergeHeadFromHeader = (base64Head) => headMergerInstance.mergeFromHeader(base64Head);

  // resources/js/modules/forms.js
  var CatchyForms = class {
    /**
     * Helper to wrap XHR in a Promise resembling a fetch Response.
     * Supports upload progress events for file uploads.
     *
     * @param {string} url
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    request(url, options = {}) {
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
    /**
     * Submits a form using AJAX and morphs the response via the visit function.
     *
     * @param {HTMLFormElement} form
     * @param {Function} visitFn - Reference to the visit() function
     * @param {HTMLElement|null} submitter - The button that triggered the submit event
     */
    submit(form, visitFn, submitter = null) {
      let action = form.getAttribute("action") || window.location.href;
      if (submitter && submitter.hasAttribute("formaction")) {
        action = submitter.getAttribute("formaction");
      }
      const method = (form.getAttribute("method") || "GET").toUpperCase();
      const url = new URL(action, window.location.href);
      if (method === "GET") {
        const formData = new FormData(form);
        if (submitter && submitter.name) {
          formData.append(submitter.name, submitter.value);
        }
        const params = new URLSearchParams(formData);
        for (const [key, value] of params.entries()) {
          url.searchParams.set(key, value);
        }
        visitFn(url.toString(), { trigger: form });
      } else {
        const formData = new FormData(form);
        if (submitter && submitter.name) {
          formData.append(submitter.name, submitter.value);
        }
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
  };
  var formsInstance = new CatchyForms();
  var xhrRequest = (url, options) => formsInstance.request(url, options);
  var submitForm = (form, visitFn, submitter) => formsInstance.submit(form, visitFn, submitter);

  // resources/js/modules/prefetch.js
  var CatchyPrefetcher = class {
    constructor() {
      this.activeRequests = /* @__PURE__ */ new Map();
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
        emit("prefetch-start", { url });
        const headers = { "X-Catchy-Request": "true" };
        if (currentVersion) {
          headers["X-Catchy-Version"] = currentVersion;
        }
        const response = await fetch(url, { headers });
        if (response.status === 409 || response.status === 429) {
          window.location.href = url;
          return null;
        }
        if (!response.ok) {
          emit("prefetch-end", { url, success: false });
          return null;
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("text/html")) {
          emit("prefetch-end", { url, success: false });
          return null;
        }
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
        emit("prefetch-end", { url, success: true });
        return cacheEntry;
      } catch (e) {
        emit("prefetch-end", { url, success: false });
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
      document.addEventListener("mouseenter", (event) => {
        const link = event.target && typeof event.target.closest === "function" ? event.target.closest("a") : null;
        if (!link || shouldIgnoreLink(link, null, config.ignoreAttribute)) return;
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = setTimeout(() => {
          prefetchFn(link.href);
        }, config.prefetchDelay);
      }, true);
      document.addEventListener("mouseleave", (event) => {
        const link = event.target && typeof event.target.closest === "function" ? event.target.closest("a") : null;
        if (!link) return;
        const relatedLink = event.relatedTarget && typeof event.relatedTarget.closest === "function" ? event.relatedTarget.closest("a") : null;
        if (relatedLink === link) return;
        clearTimeout(this.hoverTimeout);
      }, true);
    }
    /**
     * Set up IntersectionObserver viewport prefetching.
     */
    initViewport(config, prefetchFn) {
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
  };
  var prefetcherInstance = new CatchyPrefetcher();
  var getActiveRequests = () => prefetcherInstance.activeRequests;
  var prefetch = (url, config, currentVersion) => prefetcherInstance.prefetch(url, config, currentVersion);
  var initHoverPrefetch = (config, prefetchFn) => prefetcherInstance.initHover(config, prefetchFn);
  var initViewportPrefetch = (config, prefetchFn) => prefetcherInstance.initViewport(config, prefetchFn);

  // resources/js/modules/events.js
  var CatchyEvents = class {
    constructor() {
      this.pendingAction = null;
    }
  };
  var eventsInstance = new CatchyEvents();
  function findNestedInput(form, fieldName) {
    if (!fieldName.includes(".")) return null;
    const parts = fieldName.split(".");
    const name = parts[0] + parts.slice(1).map((p) => `[${p}]`).join("");
    return form.querySelector(`[name="${name}"], [name="${name}[]"]`);
  }
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
      if (confirmBtn && eventsInstance.pendingAction) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const actionToRun = eventsInstance.pendingAction.execute;
        const modalId = eventsInstance.pendingAction.modalId;
        eventsInstance.pendingAction = null;
        const modal = document.getElementById(modalId);
        if (modal) emit("modal-close", {}, modal);
        actionToRun();
        return;
      }
      const confirmModalEl = target.closest("[data-catchy-confirm-modal]");
      if (confirmModalEl && (!eventsInstance.pendingAction || eventsInstance.pendingAction.trigger !== confirmModalEl)) {
        const modalId = confirmModalEl.getAttribute("data-catchy-confirm-modal");
        const link2 = target.closest("a");
        if (link2 && !shouldIgnoreLink(link2, event, config.ignoreAttribute)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          eventsInstance.pendingAction = {
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
      const submitter = event.submitter;
      const confirmModalId = form.getAttribute("data-catchy-confirm-modal");
      if (confirmModalId && (!eventsInstance.pendingAction || eventsInstance.pendingAction.trigger !== form)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        eventsInstance.pendingAction = {
          trigger: form,
          modalId: confirmModalId,
          execute: () => {
            submitFormFn(form, submitter);
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
      submitFormFn(form, submitter);
    });
    window.addEventListener("popstate", (event) => {
      const state = event.state;
      visitFn(window.location.href, { state }, false);
    });
    document.addEventListener("catchy:modal-closed", (event) => {
      if (eventsInstance.pendingAction && eventsInstance.pendingAction.modalId === event.target.id) {
        eventsInstance.pendingAction = null;
      }
    });
    document.addEventListener("catchy-modal-closed", (event) => {
      if (eventsInstance.pendingAction && eventsInstance.pendingAction.modalId === event.target.id) {
        eventsInstance.pendingAction = null;
      }
    });
    document.addEventListener("catchy:validation-errors", (event) => {
      const errors = event.detail;
      const form = event.target instanceof HTMLFormElement ? event.target : event.target && typeof event.target.closest === "function" ? event.target.closest("form") : null;
      if (!form || form.hasAttribute("data-catchy-no-validation-errors")) return;
      form.querySelectorAll(".catchy-error").forEach((el) => el.remove());
      form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
      Object.entries(errors).forEach(([fieldName, messages]) => {
        const input = form.querySelector(`[name="${fieldName}"], [name="${fieldName}[]"], #${fieldName}`) || findNestedInput(form, fieldName);
        if (input) {
          input.classList.add("is-invalid");
          const errorEl = document.createElement("span");
          errorEl.className = "catchy-error text-red-500 text-xs mt-1 block";
          errorEl.textContent = Array.isArray(messages) ? messages[0] : messages;
          input.after(errorEl);
        }
      });
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
    closeBtn.innerHTML = window.CatchyConfig && window.CatchyConfig.svg && window.CatchyConfig.svg.close ? window.CatchyConfig.svg.close : "";
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
    const openModal = () => {
      backdrop.offsetHeight;
      backdrop.classList.add("show");
    };
    backdrop.addEventListener("modal-open", openModal);
    backdrop.addEventListener("catchy:modal-open", openModal);
    backdrop.addEventListener("catchy-modal-open", openModal);
    backdrop.addEventListener("modal-close", closeModal);
    backdrop.addEventListener("catchy:modal-close", closeModal);
    backdrop.addEventListener("catchy-modal-close", closeModal);
    const loadModal = (e) => {
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
    };
    backdrop.addEventListener("modal-load", loadModal);
    backdrop.addEventListener("catchy:modal-load", loadModal);
    backdrop.addEventListener("catchy-modal-load", loadModal);
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
  var CatchyRouter = class {
    constructor() {
      this.currentVersion = "";
      this.activeAbortController = null;
    }
    getCurrentVersion() {
      return this.currentVersion;
    }
    setCurrentVersion(version) {
      this.currentVersion = version;
    }
  };
  var routerInstance = new CatchyRouter();
  var getCurrentVersion = () => routerInstance.getCurrentVersion();
  var setCurrentVersion = (version) => routerInstance.setCurrentVersion(version);
  async function visit(url, options = {}, updateHistory = true, config = {}, Alpine = null) {
    if (navigator.onLine === false) {
      emit("flash", { message: "Cannot navigate. You are currently offline.", type: "warning" });
      return;
    }
    if (routerInstance.activeAbortController) {
      routerInstance.activeAbortController.abort();
    }
    routerInstance.activeAbortController = new AbortController();
    const { signal } = routerInstance.activeAbortController;
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
        title = responseData.title || "";
      } else {
        const fetchHeaders = {
          ...options.headers || {},
          "X-Catchy-Request": "true",
          "X-Catchy-Target": targetId
        };
        if (routerInstance.currentVersion) {
          fetchHeaders["X-Catchy-Version"] = routerInstance.currentVersion;
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
        if (response.status === 419) {
          window.location.reload();
          return;
        }
        if (!response.ok) {
          const isHtml = response.headers.get("content-type")?.includes("text/html");
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
        const titleHeader = response.headers.get("X-Catchy-Title");
        title = titleHeader ? decodeBase64Utf8(titleHeader) : "";
      }
      const flashHeader = response ? response.headers.get("X-Catchy-Flash") : null;
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
        if (data.flash) {
          processFlashHeader({ headers: { get: (name) => name.toLowerCase() === "x-catchy-flash" ? data.flash : null } }, trigger);
        }
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
        if (data.flash) {
          processFlashHeader({ headers: { get: (name) => name.toLowerCase() === "x-catchy-flash" ? data.flash : null } }, trigger);
        }
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
      if (data.flash) {
        let activeTrigger = null;
        if (trigger && trigger.id) {
          activeTrigger = document.getElementById(trigger.id);
        }
        if (!activeTrigger && trigger && trigger.tagName === "FORM" && trigger.getAttribute("action")) {
          activeTrigger = document.querySelector(`form[action="${trigger.getAttribute("action")}"]`);
        }
        if (!activeTrigger) {
          activeTrigger = document.querySelector("form") || document.body;
        }
        processFlashHeader({ headers: { get: (name) => name.toLowerCase() === "x-catchy-flash" ? data.flash : null } }, activeTrigger);
      }
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
    const flashHeader = response ? response.headers.get("X-Catchy-Flash") : null;
    if (!flashHeader) return;
    try {
      const flashJson = decodeBase64Utf8(flashHeader);
      const flash = JSON.parse(flashJson);
      emit("flash-raw", flash);
      const flashTypes = ["success", "error", "warning", "info", "status"];
      for (const type of flashTypes) {
        if (flash[type]) {
          emit("flash", { message: flash[type], type });
        }
      }
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
        const spinnerHtml = window.CatchyConfig && window.CatchyConfig.svg && window.CatchyConfig.svg.spinner ? window.CatchyConfig.svg.spinner : "";
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
  function showErrorModal(htmlContent) {
    let overlay = document.getElementById("catchy-error-overlay");
    if (overlay) overlay.remove();
    overlay = document.createElement("div");
    overlay.id = "catchy-error-overlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "999999";
    overlay.style.background = "rgba(15, 23, 42, 0.6)";
    overlay.style.backdropFilter = "blur(4px)";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "20px";
    const modal = document.createElement("div");
    modal.style.width = "100%";
    modal.style.maxWidth = "1200px";
    modal.style.height = "90vh";
    modal.style.background = "white";
    modal.style.borderRadius = "12px";
    modal.style.overflow = "hidden";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
    modal.style.border = "1px solid rgba(226, 232, 240, 0.8)";
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.padding = "14px 20px";
    header.style.borderBottom = "1px solid #e2e8f0";
    header.style.background = "#f8fafc";
    const title = document.createElement("h3");
    title.textContent = "Server Error Response";
    title.style.margin = "0";
    title.style.fontSize = "16px";
    title.style.fontWeight = "600";
    title.style.color = "#0f172a";
    title.style.fontFamily = "system-ui, -apple-system, sans-serif";
    const closeBtn = document.createElement("button");
    const closeIcon = window.CatchyConfig && window.CatchyConfig.svg && window.CatchyConfig.svg.close ? window.CatchyConfig.svg.close : "";
    const finalIcon = closeIcon ? closeIcon.replace('class="', 'style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;" class="') : "";
    closeBtn.innerHTML = `${finalIcon}Close`;
    closeBtn.style.background = "#ef4444";
    closeBtn.style.color = "white";
    closeBtn.style.border = "none";
    closeBtn.style.padding = "6px 14px";
    closeBtn.style.borderRadius = "6px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontWeight = "600";
    closeBtn.style.fontSize = "13px";
    closeBtn.style.fontFamily = "system-ui, -apple-system, sans-serif";
    closeBtn.style.display = "flex";
    closeBtn.style.alignItems = "center";
    closeBtn.style.transition = "background-color 0.2s";
    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.background = "#dc2626";
    });
    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.background = "#ef4444";
    });
    closeBtn.addEventListener("click", () => {
      overlay.remove();
    });
    header.appendChild(title);
    header.appendChild(closeBtn);
    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.flex = "1";
    iframe.style.border = "none";
    modal.appendChild(header);
    modal.appendChild(iframe);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    const escHandler = (e) => {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(htmlContent);
    iframe.contentWindow.document.close();
  }

  // resources/js/modules/lazy.js
  var CatchyLazy = class {
    /**
     * Register the x-catchy-lazy Alpine.js directive.
     *
     * @param {Object} Alpine
     * @param {Object} config
     */
    register(Alpine, config) {
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
  };
  var lazyInstance = new CatchyLazy();
  var registerLazyDirective = (Alpine, config) => lazyInstance.register(Alpine, config);

  // resources/js/modules/sync.js
  var CatchySync = class {
    /**
     * Register the x-catchy-sync Alpine.js directive.
     *
     * @param {Object} Alpine
     * @param {Object} config
     */
    register(Alpine, config) {
      Alpine.directive("catchy-sync", (el, { expression, modifiers }, { evaluate, cleanup }) => {
        const eventName = modifiers.includes("input") ? "input" : "change";
        let debounceMs = 0;
        const debounceIndex = modifiers.indexOf("debounce");
        if (debounceIndex !== -1) {
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
          let url = expression;
          const form = el.closest("form");
          const isGet = modifiers.includes("get");
          try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
            const headers = { "X-Catchy-Request": "true" };
            if (csrfToken && !isGet) {
              headers["X-CSRF-TOKEN"] = csrfToken;
            }
            let body = null;
            let method = isGet ? "GET" : "POST";
            if (isGet) {
              const urlObj = new URL(url, window.location.href);
              if (modifiers.includes("form") && form) {
                const formData = new FormData(form);
                for (const [key, val] of formData.entries()) {
                  if (typeof val === "string") {
                    urlObj.searchParams.set(key, val);
                  }
                }
              } else {
                if (!name) {
                  console.warn("Catchy: x-catchy-sync requires el to have a name or id attribute when not using .form modifier.");
                  return;
                }
                urlObj.searchParams.set(name, value);
              }
              url = urlObj.toString();
            } else {
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
            }
            const response = await fetch(url, {
              method,
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
  };
  var syncInstance = new CatchySync();
  var registerSyncDirective = (Alpine, config) => syncInstance.register(Alpine, config);

  // resources/js/modules/connectivity.js
  var CatchyConnectivity = class {
    /**
     * Initialize connectivity monitoring.
     * Fires toast notifications when online/offline state changes.
     */
    init() {
      window.addEventListener("offline", () => {
        emit("flash", { message: "No internet connection. Operating in offline mode.", type: "danger" });
      });
      window.addEventListener("online", () => {
        emit("flash", { message: "Connection restored. Back online!", type: "success" });
      });
    }
  };
  var connectivityInstance = new CatchyConnectivity();
  var initConnectivity = () => connectivityInstance.init();

  // resources/js/catchy-modular.js
  var CatchyUIEngine = class {
    /**
     * @param {Object} Alpine
     * @param {Object} config
     */
    constructor(Alpine, config) {
      this.Alpine = Alpine;
      this.config = config;
      this.cache = getCache();
    }
    /**
     * Bootstrap and initialize all engine subsystems.
     */
    init() {
      initLoader(this.config);
      registerLazyDirective(this.Alpine, this.config);
      registerSyncDirective(this.Alpine, this.config);
      initEventListeners(this.config, this.visit.bind(this), this.submitForm.bind(this));
      initHoverPrefetch(this.config, this.prefetch.bind(this));
      initViewportPrefetch(this.config, this.prefetch.bind(this));
      initConnectivity();
      this.Alpine.catchy = {
        visit: this.visit.bind(this),
        prefetch: this.prefetch.bind(this),
        cache: this.cache,
        startLoading,
        stopLoading
      };
    }
    /**
     * Trigger SPA navigation visit to a URL.
     */
    visit(url, options = {}, updateHistory = true) {
      return visit(url, options, updateHistory, this.config, this.Alpine);
    }
    /**
     * Prefetch a URL HTML content into SWR cache.
     */
    prefetch(url) {
      return prefetch(url, this.config, getCurrentVersion());
    }
    /**
     * Submit a form programmatically via Catchy SPA visitor.
     */
    submitForm(form, submitter = null) {
      return submitForm(form, this.visit.bind(this), submitter);
    }
  };
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
    if (config.version) {
      setCurrentVersion(config.version);
    }
    const engine = new CatchyUIEngine(Alpine, config);
    engine.init();
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
