/**
 * Hamzi/Catchy - Alpine.js SPA Plugin
 *
 * HTML-over-the-wire navigation utilizing @alpinejs/morph,
 * built-in viewport loaders, intelligent prefetching, and asset version protection.
 */
import { resolveConfig } from './modules/config.js';
import { initLoader, startLoading, stopLoading } from './modules/loader.js';
import { getCache } from './modules/cache.js';
import { visit, getCurrentVersion } from './modules/navigation.js';
import { prefetch, initHoverPrefetch, initViewportPrefetch } from './modules/prefetch.js';
import { submitForm } from './modules/forms.js';
import { registerAlpineComponents } from './modules/components.js';
import { registerSyncDirective } from './modules/sync.js';
import { initEventListeners } from './modules/events.js';
import { initConnectivity } from './modules/connectivity.js';

/**
 * The Catchy Alpine.js Plugin definition.
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

    // Resolve configuration
    const config = resolveConfig();

    // Initialize loading bar
    initLoader(config);

    // Create bound visit function with config and Alpine injected
    const boundVisit = (url, options = {}, updateHistory = true) => {
        return visit(url, options, updateHistory, config, Alpine);
    };

    // Create bound prefetch function
    const boundPrefetch = (url) => {
        return prefetch(url, config, getCurrentVersion());
    };

    // Create bound submitForm function
    const boundSubmitForm = (form) => {
        return submitForm(form, boundVisit);
    };

    // Register Alpine.data() components
    registerAlpineComponents(Alpine, config);

    // Register x-catchy-sync directive
    registerSyncDirective(Alpine, config);

    // Initialize event listeners
    initEventListeners(config, boundVisit, boundSubmitForm);

    // Initialize prefetching
    initHoverPrefetch(config, boundPrefetch);
    initViewportPrefetch(config, boundPrefetch);

    // Initialize connectivity monitoring
    initConnectivity();

    // Expose public API
    Alpine.catchy = {
        visit: boundVisit,
        prefetch: boundPrefetch,
        cache: getCache(),
        startLoading,
        stopLoading
    };
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
}

export default CatchyPlugin;

