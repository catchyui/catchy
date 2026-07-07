/**
 * CatchyUI  Sync Directive Module
 *
 * Class-based registerer for the x-catchy-sync Alpine.js directive.
 */

import { executeScriptsInContainer, focusAutofocusElements } from './utils.js';

export class CatchySync {
  /**
   * Register the x-catchy-sync Alpine.js directive.
   *
   * @param {Object} Alpine
   * @param {Object} config
   */
  register(Alpine, config) {
    Alpine.directive('catchy-sync', (el, { expression, modifiers }, { evaluate, cleanup }) => {
      const eventName = modifiers.includes('input') ? 'input' : 'change';

      let debounceMs = 0;
      const debounceIndex = modifiers.indexOf('debounce');
      if (debounceIndex !== -1 && modifiers[debounceIndex + 1]) {
        const timeStr = modifiers[debounceIndex + 1];
        debounceMs = parseInt(timeStr) || 300;
      }

      let targetId = config.containerId;
      const targetIndex = modifiers.indexOf('target');
      if (targetIndex !== -1 && modifiers[targetIndex + 1]) {
        targetId = modifiers[targetIndex + 1];
      }

      let timeout = null;
      const handler = async () => {
        const value = el.value;
        const name = el.name || el.id;
        let url = expression;
        const form = el.closest('form');
        const isGet = modifiers.includes('get');

        try {
          const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
          const headers = { 'X-Catchy-Request': 'true' };
          if (csrfToken && !isGet) {
            headers['X-CSRF-TOKEN'] = csrfToken;
          }

          let body = null;
          let method = isGet ? 'GET' : 'POST';

          if (isGet) {
            const urlObj = new URL(url, window.location.href);
            if (modifiers.includes('form') && form) {
              const formData = new FormData(form);
              for (const [key, val] of formData.entries()) {
                if (typeof val === 'string') {
                  urlObj.searchParams.set(key, val);
                }
              }
            } else {
              if (!name) {
                console.warn('Catchy: x-catchy-sync requires el to have a name or id attribute when not using .form modifier.');
                return;
              }
              urlObj.searchParams.set(name, value);
            }
            url = urlObj.toString();
          } else {
            if (modifiers.includes('form') && form) {
              body = new FormData(form);
              if (!body.has('_token') && csrfToken) {
                body.append('_token', csrfToken);
              }
            } else {
              if (!name) {
                console.warn('Catchy: x-catchy-sync requires el to have a name or id attribute when not using .form modifier.');
                return;
              }
              headers['Content-Type'] = 'application/json';
              body = JSON.stringify({ [name]: value });
            }
          }

          const response = await fetch(url, {
            method: method,
            headers: headers,
            body: body
          });

          if (response.ok) {
            const html = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const incoming = doc.getElementById(targetId);
            const current = document.getElementById(targetId);
            if (incoming && current) {
              Alpine.morph(current, incoming.outerHTML);
              executeScriptsInContainer(current);
              focusAutofocusElements(current);
            }
          }
        } catch (e) {
          console.error('Catchy: x-catchy-sync request failed:', e);
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
}

// Export singleton instance for direct module imports
export const syncInstance = new CatchySync();

// Maintain functional wrapper exports for backward compatibility & easy usage
export const registerSyncDirective = (Alpine, config) => syncInstance.register(Alpine, config);
