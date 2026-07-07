/**
 * CatchyUI/Catchy - Alpine.js SPA Plugin
 *
 * Class-based HTML-over-the-wire navigation utilizing @alpinejs/morph,
 * built-in viewport loaders, intelligent prefetching, and asset version protection.
 */
import { resolveConfig } from './modules/config.js';
import { initLoader, startLoading, stopLoading } from './modules/loader.js';
import { getCache } from './modules/cache.js';
import { visit, getCurrentVersion, setCurrentVersion } from './modules/navigation.js';
import { prefetch, initHoverPrefetch, initViewportPrefetch } from './modules/prefetch.js';
import { submitForm } from './modules/forms.js';
import { registerLazyDirective } from './modules/lazy.js';
import { registerSyncDirective } from './modules/sync.js';
import { initEventListeners } from './modules/events.js';
import { initConnectivity } from './modules/connectivity.js';

/**
 * Clean, Object-Oriented Engine class orchestrating Catchy SPA features.
 */
export class CatchyUIEngine {
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
    // 1. Initialize CSS loading bar progress element
    initLoader(this.config);

    // 2. Register Alpine x-catchy directives
    registerLazyDirective(this.Alpine, this.config);
    registerSyncDirective(this.Alpine, this.config);

    // 3. Setup user interaction event listeners (clicks, submits)
    initEventListeners(this.config, this.visit.bind(this), this.submitForm.bind(this));

    // 4. Register hover/viewport prefetching logic
    initHoverPrefetch(this.config, this.prefetch.bind(this));
    initViewportPrefetch(this.config, this.prefetch.bind(this));

    // 5. Monitor browser online/offline status
    initConnectivity();

    // 6. Bind public API to Alpine namespace
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
}

/**
 * The Catchy Alpine.js Plugin entry function.
 *
 * @param {Object} Alpine
 */
function CatchyPlugin(Alpine) {
  "use strict";

  // Prevent duplicate registrations
  if (Alpine.catchy) {
    return;
  }

  // Defer morph plugin warning check
  setTimeout(() => {
    if (!Alpine.morph) {
      console.error(
        'Catchy: The Alpine.js Morph plugin is required but not loaded.\n' +
        'Please ensure `@alpinejs/morph` is imported and registered:\n' +
        'https://alpinejs.dev/plugins/morph'
      );
    }
  }, 50);

  // Resolve current configuration
  const config = resolveConfig();

  if (config.version) {
    setCurrentVersion(config.version);
  }

  // Instantiate and boot the OOP SPA engine
  const engine = new CatchyUIEngine(Alpine, config);
  engine.init();
}

// Auto-register when loaded via <script> tag (non-module)
if (typeof window !== 'undefined') {
  window.CatchyPlugin = CatchyPlugin;
  if (window.Alpine) {
    window.Alpine.plugin(CatchyPlugin);
  } else {
    document.addEventListener('alpine:init', () => {
      if (window.Alpine) window.Alpine.plugin(CatchyPlugin);
    });
  }
  // Dispatch loaded event for shims
  document.dispatchEvent(new CustomEvent('catchy:loaded'));
}

export default CatchyPlugin;
