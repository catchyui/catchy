/**
 * CatchyUI  Configuration Module
 *
 * Class-based resolver for window.CatchyConfig.
 */

export class CatchyConfig {
  /**
   * Create a resolved configuration object from window.CatchyConfig.
   *
   * @returns {Object}
   */
  resolve() {
    const c = window.CatchyConfig || {};
    return {
      containerId: c.containerId || 'catchy-app',
      ignoreAttribute: c.ignoreAttribute || 'data-catchy-ignore',
      prefetch: c.prefetch !== false,
      prefetchDelay: c.prefetchDelay || 75,
      cacheTTL: c.cacheTTL || 30000,
      swr: c.swr !== false,
      loadingBar: c.loadingBar !== false,
      loadingBarHeight: c.loadingBarHeight || '3px',
      loadingBarColor: c.loadingBarColor || 'linear-gradient(to right, #4f46e5, #06b6d4)',
      viewTransitions: c.viewTransitions || 'fade',
    };
  }
}

// Export singleton instance for direct module imports
export const configInstance = new CatchyConfig();

// Maintain functional wrapper exports for backward compatibility & easy usage
export const resolveConfig = () => configInstance.resolve();
