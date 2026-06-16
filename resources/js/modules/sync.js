/**
 * Catchy — Sync Directive Module
 *
 * x-catchy-sync Alpine.js directive for real-time form/input syncing.
 */

import { executeScriptsInContainer, focusAutofocusElements } from './utils.js';

/**
 * Register the x-catchy-sync Alpine.js directive.
 *
 * @param {Object} Alpine
 * @param {Object} config
 */
export function registerSyncDirective(Alpine, config) {
    Alpine.directive('catchy-sync', (el, { expression, modifiers }, { evaluate }) => {
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
            const url = expression;
            const form = el.closest('form');

            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                const headers = { 'X-Catchy-SPA': 'true' };
                if (csrfToken) {
                    headers['X-CSRF-TOKEN'] = csrfToken;
                }

                let body;
                if (modifiers.includes('form') && form) {
                    body = new FormData(form);
                } else {
                    if (!name) {
                        console.warn('Catchy: x-catchy-sync requires el to have a name or id attribute when not using .form modifier.');
                        return;
                    }
                    headers['Content-Type'] = 'application/json';
                    body = JSON.stringify({ [name]: value });
                }

                const response = await fetch(url, {
                    method: 'POST',
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
    });
}
