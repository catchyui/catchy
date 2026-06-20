/**
 * Catchy — Lazy Loading Directive
 *
 * Register the x-catchy-lazy Alpine.js directive.
 * Usage:
 *   <div x-catchy-lazy="/url">...</div>
 *   <div x-catchy-lazy.intersect="/url">...</div>
 */
import { emit, executeScriptsInContainer } from './utils.js';

export function registerLazyDirective(Alpine, config) {
    Alpine.directive('catchy-lazy', (el, { expression, modifiers }, { cleanup }) => {
        const url = expression;
        if (!url) return;

        let loaded = false;

        const loadContent = () => {
            if (loaded) return;

            emit('start', { trigger: el });

            fetch(url, {
                headers: { 'X-Catchy-SPA': 'true' }
            })
            .then(response => {
                if (!response.ok) throw new Error('Lazy load failed');
                return response.text();
            })
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Extract either the specified target container or search for container ID
                const fragment = doc.getElementById(config.containerId) || doc.body;

                el.innerHTML = fragment.innerHTML;
                loaded = true;

                // Re-execute scripts within newly added content
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

        // Bind global reload listener
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

        // Initialize loading
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
