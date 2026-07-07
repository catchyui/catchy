/**
 * CatchyUI  Lazy Loading Directive
 *
 * Class-based registerer for the x-catchy-lazy Alpine.js directive.
 */

import { emit, executeScriptsInContainer } from './utils.js';

export class CatchyLazy {
  /**
   * Register the x-catchy-lazy Alpine.js directive.
   *
   * @param {Object} Alpine
   * @param {Object} config
   */
  register(Alpine, config) {
    Alpine.directive('catchy-lazy', (el, { expression, modifiers }, { cleanup }) => {
      const url = expression;
      if (!url) return;

      let loaded = false;

      const loadContent = () => {
        if (loaded) return;

        emit('start', { trigger: el });

        fetch(url, {
          headers: { 'X-Catchy-Request': 'true' }
        })
          .then(response => {
            if (!response.ok) throw new Error('Lazy load failed');
            return response.text();
          })
          .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const fragment = doc.getElementById(config.containerId) || doc.body;

            el.innerHTML = fragment.innerHTML;
            loaded = true;

            executeScriptsInContainer(el);

            emit('end', { trigger: el });
          })
          .catch(err => {
            console.error(err);
            emit('error', { error: err, trigger: el });
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

      window.addEventListener('catchy:lazy-reload', handleReloadEvent);
      window.addEventListener('catchy-lazy-reload', handleReloadEvent);

      cleanup(() => {
        window.removeEventListener('catchy:lazy-reload', handleReloadEvent);
        window.removeEventListener('catchy-lazy-reload', handleReloadEvent);
      });

      if (modifiers.includes('intersect')) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
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
}

// Export singleton instance for direct module imports
export const lazyInstance = new CatchyLazy();

// Maintain functional wrapper exports for backward compatibility & easy usage
export const registerLazyDirective = (Alpine, config) => lazyInstance.register(Alpine, config);
