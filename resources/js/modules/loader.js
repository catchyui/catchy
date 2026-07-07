/**
 * CatchyUI  Loading Bar Module
 *
 * Class-based CSS top loading progress bar with smooth animation.
 */

export class CatchyLoader {
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

    const style = document.createElement('style');
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

    this.element = document.createElement('div');
    this.element.id = 'catchy-loader';
    document.body.appendChild(this.element);
  }

  /**
   * Triggers the CSS loader animation.
   */
  start() {
    document.body.classList.add('catchy-loading');
    document.documentElement.classList.add('catchy-loading');
    if (!this.element) return;

    this.clearTimers();

    this.timer = setTimeout(() => {
      this.element.style.width = '0%';
      this.element.style.opacity = '1';

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
    document.body.classList.remove('catchy-loading');
    document.documentElement.classList.remove('catchy-loading');
    if (!this.element) return;

    this.clearTimers();

    this.element.style.width = '100%';

    this.fadeOutTimer = setTimeout(() => {
      this.element.style.opacity = '0';
      this.resetTimer = setTimeout(() => {
        this.element.style.width = '0%';
      }, 400);
    }, 100);
  }

  /**
   * Instantly resets the loader status.
   */
  reset() {
    document.body.classList.remove('catchy-loading');
    document.documentElement.classList.remove('catchy-loading');
    if (!this.element) return;

    this.clearTimers();
    this.element.style.opacity = '0';
    this.element.style.width = '0%';
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
}

// Export singleton instance for direct module imports
export const loaderInstance = new CatchyLoader();

// Maintain functional wrapper exports for backward compatibility & easy usage
export const initLoader = (config) => loaderInstance.init(config);
export const startLoading = () => loaderInstance.start();
export const stopLoading = () => loaderInstance.stop();
export const resetLoading = () => loaderInstance.reset();
