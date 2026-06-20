/**
 * Catchy — Loading Bar Module
 *
 * CSS-only top loading progress bar with smooth animation.
 */

let loaderElement = null;
let loaderTimer = null;
let progressInterval = null;
let fadeOutTimer = null;
let resetTimer = null;

/**
 * Initialize the loading bar DOM element and CSS styles.
 *
 * @param {Object} config
 */
export function initLoader(config) {
    if (!config.loadingBar) return;

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

    loaderElement = document.createElement('div');
    loaderElement.id = 'catchy-loader';
    document.body.appendChild(loaderElement);
}

/**
 * Triggers the CSS loader animation if the request takes more than 120ms.
 */
export function startLoading() {
    document.body.classList.add('catchy-loading');
    document.documentElement.classList.add('catchy-loading');
    if (!loaderElement) return;

    // Clear ALL pending timers to prevent race conditions with rapid navigation
    clearTimeout(loaderTimer);
    clearInterval(progressInterval);
    clearTimeout(fadeOutTimer);
    clearTimeout(resetTimer);

    loaderTimer = setTimeout(() => {
        loaderElement.style.width = '0%';
        loaderElement.style.opacity = '1';

        let width = 0;
        progressInterval = setInterval(() => {
            if (width < 88) {
                width += (90 - width) * 0.08;
                loaderElement.style.width = `${width}%`;
            }
        }, 150);
    }, 120);
}

/**
 * Fills progress loader to 100% and fades out.
 */
export function stopLoading() {
    document.body.classList.remove('catchy-loading');
    document.documentElement.classList.remove('catchy-loading');
    if (!loaderElement) return;
    clearTimeout(loaderTimer);
    clearInterval(progressInterval);
    clearTimeout(fadeOutTimer);
    clearTimeout(resetTimer);

    loaderElement.style.width = '100%';

    fadeOutTimer = setTimeout(() => {
        loaderElement.style.opacity = '0';
        resetTimer = setTimeout(() => {
            loaderElement.style.width = '0%';
        }, 400);
    }, 100);
}

/**
 * Instantly resets the loader status.
 */
export function resetLoading() {
    document.body.classList.remove('catchy-loading');
    document.documentElement.classList.remove('catchy-loading');
    if (!loaderElement) return;
    clearTimeout(loaderTimer);
    clearInterval(progressInterval);
    clearTimeout(fadeOutTimer);
    clearTimeout(resetTimer);
    loaderElement.style.opacity = '0';
    loaderElement.style.width = '0%';
}

