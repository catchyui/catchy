/**
 * Hamzi/Catchy - Alpine.js SPA Plugin v1.4.1
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
      loadingBar: c.loadingBar !== false,
      loadingBarHeight: c.loadingBarHeight || "3px",
      loadingBarColor: c.loadingBarColor || "linear-gradient(to right, #4f46e5, #06b6d4)"
    };
  }

  // resources/js/modules/loader.js
  var loaderElement = null;
  var loaderTimer = null;
  var progressInterval = null;
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
    if (!loaderElement) return;
    clearTimeout(loaderTimer);
    clearInterval(progressInterval);
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
    }, 120);
  }
  function stopLoading() {
    if (!loaderElement) return;
    clearTimeout(loaderTimer);
    clearInterval(progressInterval);
    loaderElement.style.width = "100%";
    setTimeout(() => {
      loaderElement.style.opacity = "0";
      setTimeout(() => {
        loaderElement.style.width = "0%";
      }, 400);
    }, 100);
  }
  function resetLoading() {
    if (!loaderElement) return;
    clearTimeout(loaderTimer);
    clearInterval(progressInterval);
    loaderElement.style.opacity = "0";
    loaderElement.style.width = "0%";
  }

  // resources/js/modules/cache.js
  var cache = /* @__PURE__ */ new Map();
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
      oldScript.parentNode.replaceChild(newScript, oldScript);
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
    if (href.startsWith("#") || href.startsWith("javascript:")) return true;
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
    const callback = element.getAttribute(attrName);
    if (!callback) return;
    try {
      if (typeof window[callback] === "function") {
        return window[callback](context);
      }
      const fn = new Function("event", `with(window) { ${callback} }`);
      return fn(context);
    } catch (e) {
      console.error(`Catchy: Error in ${attrName} callback execution:`, e);
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
  function getActiveRequests() {
    return activeRequests;
  }
  async function prefetch(url, config, currentVersion2) {
    if (getCachedResponse(url, config.cacheTTL) || activeRequests.has(url)) return;
    const promise = (async () => {
      try {
        const headers = { "X-Catchy-SPA": "true" };
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
    })();
    activeRequests.set(url, promise);
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

  // resources/js/modules/components.js
  function resolveModal(triggerElement) {
    const modalAttr = triggerElement && typeof triggerElement.getAttribute === "function" ? triggerElement.getAttribute("data-catchy-modal") : null;
    if (modalAttr && modalAttr !== "" && modalAttr !== "true") {
      const specificModal = document.getElementById(modalAttr);
      if (specificModal) return specificModal;
    }
    if (triggerElement && typeof triggerElement.closest === "function") {
      const closestModal = triggerElement.closest("[catchy-modal]") || triggerElement.closest("#catchy-modal");
      if (closestModal) return closestModal;
    }
    return document.querySelector("[catchy-modal]") || document.getElementById("catchy-modal");
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
        case "reset":
          if (trigger.tagName === "FORM") trigger.reset();
          break;
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
      }
    });
  }
  function registerAlpineComponents(Alpine, config) {
    Alpine.data("catchyModal", (params = {}) => ({
      isOpen: false,
      title: params.title || "",
      content: "",
      open(content = "", title = "") {
        if (content) this.content = content;
        if (title) this.title = title;
        this.isOpen = true;
        document.body.classList.add("overflow-hidden");
        this.$dispatch("catchy:modal-opened");
      },
      close() {
        this.isOpen = false;
        document.body.classList.remove("overflow-hidden");
        this.$dispatch("catchy:modal-closed");
        setTimeout(() => {
          if (!this.isOpen) this.content = "";
        }, 300);
      }
    }));
    Alpine.data("catchyOffcanvas", (params = {}) => ({
      isOpen: false,
      title: params.title || "",
      content: "",
      open(content = "", title = "") {
        if (content) this.content = content;
        if (title) this.title = title;
        this.isOpen = true;
        document.body.classList.add("overflow-hidden");
        this.$dispatch("catchy:offcanvas-opened");
      },
      close() {
        this.isOpen = false;
        document.body.classList.remove("overflow-hidden");
        this.$dispatch("catchy:offcanvas-closed");
        setTimeout(() => {
          if (!this.isOpen) this.content = "";
        }, 300);
      }
    }));
    Alpine.data("catchyToast", (params = {}) => ({
      toasts: [],
      duration: params.duration || 4e3,
      add(message, type = "success") {
        const id = Date.now();
        this.toasts.push({ id, message, type, timer: null });
        this.$nextTick(() => {
          const toast = this.toasts.find((t) => t.id === id);
          if (toast) {
            toast.timer = setTimeout(() => this.remove(id), this.duration);
          }
        });
      },
      remove(id) {
        const index = this.toasts.findIndex((t) => t.id === id);
        if (index !== -1) {
          clearTimeout(this.toasts[index].timer);
          this.toasts.splice(index, 1);
        }
      }
    }));
    Alpine.data("catchyLazy", (params = {}) => ({
      loaded: false,
      error: false,
      reload() {
        this.loaded = false;
        this.error = false;
        this.load();
      },
      load() {
        if (this.loaded) return;
        emit("start", { trigger: this.$el });
        fetch(params.src, {
          headers: { "X-Catchy-SPA": "true" }
        }).then((response) => {
          if (!response.ok) throw new Error("Lazy load failed");
          return response.text();
        }).then((html) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const fragment = doc.getElementById(config.containerId) || doc.body;
          this.$el.innerHTML = fragment.innerHTML;
          this.loaded = true;
          const scripts = this.$el.querySelectorAll("script");
          scripts.forEach((oldScript) => {
            if (oldScript.hasAttribute("data-catchy-ignore")) return;
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach((attr) => {
              newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);
          });
          emit("end", { trigger: this.$el });
        }).catch((err) => {
          console.error(err);
          this.error = true;
          emit("error", { error: err, trigger: this.$el });
        });
      },
      init() {
        if (params.trigger === "intersect") {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.load();
                observer.disconnect();
              }
            });
          }, { threshold: 0.1 });
          observer.observe(this.$el);
        } else {
          this.load();
        }
      }
    }));
    Alpine.data("catchyError", (params = {}) => ({
      error: "",
      normalizeKey(key) {
        return key.replace(/\[\]/g, "").replace(/\[/g, ".").replace(/\]/g, "");
      },
      handleErrors(errors) {
        const target = this.normalizeKey(params.field || "");
        if (errors && errors[target]) {
          this.error = Array.isArray(errors[target]) ? errors[target][0] : errors[target];
        } else {
          this.error = "";
        }
      }
    }));
    Alpine.data("catchyProgress", (params = {}) => ({
      show: false,
      progress: 0,
      init() {
        const forId = params.for || "";
        let target = null;
        if (forId) {
          target = document.getElementById(forId);
        } else {
          target = this.$el.closest("form") || window;
        }
        if (!target) return;
        const handleStart = (e) => {
          if (target === window && e.detail && e.detail.trigger && e.detail.trigger.tagName === "FORM") {
            return;
          }
          this.show = true;
          this.progress = 0;
        };
        const handleProgress = (e) => {
          if (target !== window && e.detail && e.detail.trigger !== target) {
            return;
          }
          this.show = true;
          this.progress = e.detail.percent;
        };
        const handleEnd = () => {
          this.progress = 100;
          setTimeout(() => {
            this.show = false;
            setTimeout(() => {
              this.progress = 0;
            }, 300);
          }, 500);
        };
        const handleError = () => {
          setTimeout(() => {
            this.show = false;
            setTimeout(() => {
              this.progress = 0;
            }, 300);
          }, 500);
        };
        ["catchy-start", "catchy:start"].forEach((e) => target.addEventListener(e, handleStart));
        ["catchy-progress", "catchy:progress"].forEach((e) => target.addEventListener(e, handleProgress));
        ["catchy-end", "catchy:end"].forEach((e) => target.addEventListener(e, handleEnd));
        ["catchy-error", "catchy:error"].forEach((e) => target.addEventListener(e, handleError));
      }
    }));
    Alpine.data("catchyUpload", (params = {}) => ({
      dragover: false,
      files: [],
      updating: false,
      error: "",
      addFiles(fileList) {
        if (this.updating) return;
        this.error = "";
        const newFiles = Array.from(fileList).map((file) => {
          if (file.type.startsWith("image/")) {
            file.previewUrl = URL.createObjectURL(file);
          }
          return file;
        });
        if (params.multiple) {
          this.files = [...this.files, ...newFiles];
        } else {
          this.files.forEach((file) => {
            if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
          });
          this.files = newFiles.slice(0, 1);
        }
        this.updateInput();
      },
      removeFile(index) {
        const file = this.files[index];
        if (file && file.previewUrl) URL.revokeObjectURL(file.previewUrl);
        this.files.splice(index, 1);
        this.updateInput();
      },
      updateInput() {
        this.updating = true;
        try {
          const dt = new DataTransfer();
          this.files.forEach((file) => dt.items.add(file));
          this.$refs.fileInput.files = dt.files;
          this.$refs.fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        } finally {
          this.updating = false;
        }
      },
      getFileSize(size) {
        if (size < 1024) return size + " B";
        if (size < 1048576) return (size / 1024).toFixed(1) + " KB";
        return (size / 1048576).toFixed(1) + " MB";
      },
      isImage(file) {
        return file.type.startsWith("image/");
      },
      getPreviewUrl(file) {
        return file.previewUrl || "";
      },
      handleValidationErrors(event) {
        const key = (params.name || "").replace(/\[\]/g, "").replace(/\[/g, ".").replace(/\]/g, "");
        if (event.detail && event.detail[key]) {
          this.error = event.detail[key][0];
        }
      },
      destroy() {
        this.files.forEach((file) => {
          if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
        });
      }
    }));
  }

  // resources/js/modules/navigation.js
  var currentVersion = "";
  function getCurrentVersion() {
    return currentVersion;
  }
  async function visit(url, options = {}, updateHistory = true, config = {}, Alpine = null) {
    if (navigator.onLine === false) {
      emit("flash", { message: "Cannot navigate. You are currently offline.", type: "warning" });
      return;
    }
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
    if (executeCallback(trigger, "data-catchy-beforesend", { url, options, trigger }) === false) {
      return;
    }
    if (!emit("start", { url, options, trigger }, trigger, { cancelable: true })) {
      return;
    }
    let submitBtn = null;
    if (trigger && (trigger.tagName === "FORM" || trigger instanceof HTMLFormElement) && !trigger.hasAttribute("data-catchy-no-loader")) {
      submitBtn = trigger.querySelector('[type="submit"]') || trigger.querySelector('button:not([type="button"])');
      if (submitBtn && !submitBtn.dataset.originalHtml) {
        submitBtn.dataset.originalHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.classList.add("pointer-events-none");
        const spinnerHtml = `<svg class="animate-spin -ms-1 me-2 h-4 w-4 text-current inline-block align-text-bottom" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style="vertical-align: middle;"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> `;
        submitBtn.innerHTML = spinnerHtml + submitBtn.innerHTML;
      }
    }
    function restoreSubmitButton() {
      if (submitBtn && submitBtn.dataset.originalHtml) {
        submitBtn.innerHTML = submitBtn.dataset.originalHtml;
        submitBtn.disabled = false;
        submitBtn.classList.remove("pointer-events-none");
        delete submitBtn.dataset.originalHtml;
      }
    }
    startLoading();
    try {
      let html = "";
      let finalUrl = url;
      let version = "";
      let headContent = null;
      let response = null;
      const isGet = !options.method || options.method.toUpperCase() === "GET";
      const cached = isGet ? getCachedResponse(url, config.cacheTTL) : null;
      if (cached) {
        html = cached.html;
        finalUrl = cached.finalUrl;
        version = cached.version;
        headContent = cached.head || null;
        if (cached.title) document.title = cached.title;
      } else {
        const activeRequests2 = getActiveRequests();
        let responseData = null;
        if (isGet && activeRequests2.has(url)) {
          responseData = await activeRequests2.get(url);
        }
        if (responseData) {
          html = responseData.html;
          finalUrl = responseData.finalUrl;
          version = responseData.version;
          headContent = responseData.head || null;
          if (responseData.title) document.title = responseData.title;
        } else {
          const fetchHeaders = {
            ...options.headers || {},
            "X-Catchy-SPA": "true"
          };
          if (currentVersion) {
            fetchHeaders["X-Catchy-Version"] = currentVersion;
          }
          const fetchOptions = { ...options, headers: fetchHeaders };
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
            if (response.status === 422 || response.status === 400) {
              const contentType2 = response.headers.get("content-type");
              if (contentType2 && contentType2.includes("application/json")) {
                try {
                  const json = JSON.parse(await response.text());
                  if (json.errors) {
                    emit("validation-errors", json.errors);
                    if (trigger) emit("validation-errors", json.errors, trigger);
                  }
                } catch (e) {
                }
              }
            }
            throw new Error(`Catchy: Request failed with status ${response.status}`);
          }
          const redirectUrl = response.headers.get("X-Catchy-Redirect");
          if (redirectUrl) {
            processFlashHeader(response, trigger);
            visit(redirectUrl, { trigger, targetId: config.containerId }, updateHistory, config, Alpine);
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
          let title = "";
          if (titleHeader) {
            title = decodeBase64Utf8(titleHeader);
            if (title) document.title = title;
          }
          if (isGet) {
            setCachedResponse(url, { html, version, title, head: headContent, finalUrl });
          }
        }
      }
      if (version) currentVersion = version;
      if (headContent) {
        mergeHeadFromHeader(headContent);
      }
      const targetId = options.targetId || (trigger && typeof trigger.getAttribute === "function" ? trigger.getAttribute("data-catchy-target") : null) || config.containerId;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      if (doc.head) mergeHead(doc.head);
      const isOffcanvasTarget = options.offcanvas || trigger && typeof trigger.hasAttribute === "function" && trigger.hasAttribute("data-catchy-offcanvas");
      if (isOffcanvasTarget) {
        const incomingContent = doc.getElementById(targetId) || doc.getElementById(config.containerId) || doc.body;
        const offcanvas = resolveOffcanvas(trigger);
        if (offcanvas) {
          emit("offcanvas-load", { html: incomingContent.innerHTML, title: doc.title || "" }, offcanvas);
          stopLoading();
          executeCallback(trigger, "data-catchy-success", { url: finalUrl, trigger });
          handleLifecycleTriggers(trigger, "success");
          restoreSubmitButton();
          emit("end", { url: finalUrl, trigger }, trigger);
          return;
        }
      }
      const isModalTarget = options.modal || trigger && typeof trigger.hasAttribute === "function" && trigger.hasAttribute("data-catchy-modal");
      if (isModalTarget) {
        const incomingContent = doc.getElementById(targetId) || doc.getElementById(config.containerId) || doc.body;
        const modal = resolveModal(trigger);
        if (modal) {
          emit("modal-load", { html: incomingContent.innerHTML, title: doc.title || "" }, modal);
          stopLoading();
          executeCallback(trigger, "data-catchy-success", { url: finalUrl, trigger });
          handleLifecycleTriggers(trigger, "success");
          restoreSubmitButton();
          emit("end", { url: finalUrl, trigger }, trigger);
          return;
        }
      }
      const isTriggerInOffcanvas = trigger && typeof trigger.closest === "function" && (trigger.closest("[catchy-offcanvas]") || trigger.closest("#catchy-offcanvas"));
      if (isTriggerInOffcanvas && options.method && options.method.toUpperCase() !== "GET") {
        const offcanvas = resolveOffcanvas(trigger);
        if (offcanvas) emit("offcanvas-close", {}, offcanvas);
      }
      const isTriggerInModal = trigger && typeof trigger.closest === "function" && (trigger.closest("[catchy-modal]") || trigger.closest("#catchy-modal"));
      if (isTriggerInModal && options.method && options.method.toUpperCase() !== "GET") {
        const modal = resolveModal(trigger);
        if (modal) emit("modal-close", {}, modal);
        const mainContainer = document.getElementById(config.containerId);
        const incomingMain = doc.getElementById(config.containerId) || doc.body;
        if (mainContainer && incomingMain) {
          if (doc.title) document.title = doc.title;
          emit("morphing", { url: finalUrl, html, element: mainContainer, trigger }, trigger);
          if (!Alpine.morph) {
            console.error("Catchy: Alpine.morph is not defined. Ensure @alpinejs/morph is loaded and registered.");
            window.location.href = finalUrl;
            return;
          }
          Alpine.morph(mainContainer, incomingMain.outerHTML);
          executeScriptsInContainer(mainContainer);
          focusAutofocusElements(mainContainer);
        }
      } else {
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
        emit("morphing", { url: finalUrl, html, element: appContainer, trigger }, trigger);
        if (!Alpine.morph) {
          console.error("Catchy: Alpine.morph is not defined. Ensure @alpinejs/morph is loaded and registered.");
          window.location.href = finalUrl;
          return;
        }
        Alpine.morph(appContainer, incomingApp.outerHTML);
        executeScriptsInContainer(appContainer);
        focusAutofocusElements(appContainer);
      }
      const shouldUpdateHistory = updateHistory && (isGet || response && response.redirected) && (!trigger || typeof trigger.getAttribute !== "function" || trigger.getAttribute("data-catchy-history") !== "false") && (!trigger || typeof trigger.hasAttribute !== "function" || !trigger.hasAttribute("data-catchy-modal") && !trigger.hasAttribute("data-catchy-offcanvas"));
      if (shouldUpdateHistory) {
        window.history.pushState({ catchy: true, url: finalUrl }, "", finalUrl);
      }
      if (options.state && typeof options.state.scrollX === "number" && typeof options.state.scrollY === "number") {
        window.scrollTo({ left: options.state.scrollX, top: options.state.scrollY, behavior: "instant" });
      } else {
        const finalURLObj = new URL(finalUrl);
        const keepScroll = trigger && typeof trigger.getAttribute === "function" && trigger.getAttribute("data-catchy-scroll") === "keep";
        if (keepScroll) {
        } else if (finalURLObj.hash) {
          const el = document.querySelector(finalURLObj.hash);
          if (el) el.scrollIntoView();
        } else {
          const isFormSubmit = trigger && typeof trigger.tagName === "string" && trigger.tagName.toUpperCase() === "FORM";
          if (isGet && targetId === config.containerId && (!isFormSubmit || finalURLObj.pathname !== oldPathname)) {
            window.scrollTo({ top: 0, behavior: "instant" });
          }
        }
      }
      stopLoading();
      executeCallback(trigger, "data-catchy-success", { url: finalUrl, trigger });
      handleLifecycleTriggers(trigger, "success");
      restoreSubmitButton();
      emit("end", { url: finalUrl, trigger }, trigger);
    } catch (error) {
      resetLoading();
      console.error("Catchy: AJAX request error, falling back to full load.", error);
      executeCallback(trigger, "data-catchy-error", { url, error, trigger });
      handleLifecycleTriggers(trigger, "error");
      restoreSubmitButton();
      emit("error", { url, error, trigger }, trigger);
      const isGet = !options.method || options.method.toUpperCase() === "GET";
      if (isGet) {
        window.location.href = url;
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

  // resources/js/modules/sync.js
  function registerSyncDirective(Alpine, config) {
    Alpine.directive("catchy-sync", (el, { expression, modifiers }, { evaluate }) => {
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
          const headers = { "X-Catchy-SPA": "true" };
          if (csrfToken) {
            headers["X-CSRF-TOKEN"] = csrfToken;
          }
          let body;
          if (modifiers.includes("form") && form) {
            body = new FormData(form);
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
    });
  }

  // resources/js/modules/events.js
  var pendingAction = null;
  function initEventListeners(config, visitFn, submitFormFn) {
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!target || typeof target.closest !== "function") return;
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
    registerAlpineComponents(Alpine, config);
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
  }
  var catchy_modular_default = CatchyPlugin;
})();
