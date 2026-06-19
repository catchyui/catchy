/**
 * Catchy — Events Module
 *
 * Global event listeners for click, submit, popstate, and confirmation dialogs.
 */

import { shouldIgnoreLink, shouldIgnoreForm, emit } from './utils.js';
import { submitForm } from './forms.js';
import { parseShorthandAction } from './components.js';

let pendingAction = null;

/**
 * Initialize all global event listeners.
 *
 * @param {Object} config
 * @param {Function} visitFn - Bound visit function
 * @param {Function} submitFormFn - Bound submitForm function
 */
export function initEventListeners(config, visitFn, submitFormFn) {
    // Global Event: Click interceptor
    document.addEventListener('click', (event) => {
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return;

        // Handle Declarative Click Actions (e.g. data-catchy-click / data-catchy-action)
        const actionEl = target.closest('[data-catchy-click], [data-catchy-action], [data-catchy-on-click]');
        if (actionEl) {
            const actionStr = actionEl.getAttribute('data-catchy-click') || actionEl.getAttribute('data-catchy-action') || actionEl.getAttribute('data-catchy-on-click');
            if (actionStr) {
                if (actionEl.tagName === 'A' || (actionEl.tagName === 'BUTTON' && actionEl.getAttribute('type') !== 'submit')) {
                    event.preventDefault();
                }
                parseShorthandAction(actionStr, actionEl, 'click');
            }
        }

        // Handle Confirm Button click inside a modal
        const confirmBtn = target.closest('[data-catchy-confirm-button]');
        if (confirmBtn && pendingAction) {
            event.preventDefault();
            event.stopImmediatePropagation();

            const actionToRun = pendingAction.execute;
            const modalId = pendingAction.modalId;
            pendingAction = null;

            const modal = document.getElementById(modalId);
            if (modal) emit('modal-close', {}, modal);

            actionToRun();
            return;
        }

        // Handle Declarative Confirm via Custom Modal
        const confirmModalEl = target.closest('[data-catchy-confirm-modal]');
        if (confirmModalEl && (!pendingAction || pendingAction.trigger !== confirmModalEl)) {
            const modalId = confirmModalEl.getAttribute('data-catchy-confirm-modal');
            const link = target.closest('a');
            if (link && !shouldIgnoreLink(link, event, config.ignoreAttribute)) {
                event.preventDefault();
                event.stopImmediatePropagation();
                pendingAction = {
                    trigger: confirmModalEl,
                    modalId: modalId,
                    execute: () => { visitFn(link.href, { trigger: link }); }
                };
                const modal = document.getElementById(modalId);
                if (modal) emit('modal-open', {}, modal);
                return;
            }
        }

        // Handle Declarative Confirmation
        const confirmEl = target.closest('[data-catchy-confirm]');
        if (confirmEl) {
            const confirmMsg = confirmEl.getAttribute('data-catchy-confirm');
            if (confirmMsg && !confirm(confirmMsg)) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
        }

        // Handle Modal open/close trigger attributes
        const openModalEl = target.closest('[data-catchy-open-modal]');
        if (openModalEl) {
            const modalId = openModalEl.getAttribute('data-catchy-open-modal');
            const modal = document.getElementById(modalId);
            if (modal) emit('modal-open', {}, modal);
        }

        const closeModalEl = target.closest('[data-catchy-close-modal]');
        if (closeModalEl) {
            const modalId = closeModalEl.getAttribute('data-catchy-close-modal');
            const modal = document.getElementById(modalId);
            if (modal) emit('modal-close', {}, modal);
        }

        // Handle Offcanvas open/close trigger attributes
        const openOffcanvasEl = target.closest('[data-catchy-open-offcanvas]');
        if (openOffcanvasEl) {
            const offcanvasId = openOffcanvasEl.getAttribute('data-catchy-open-offcanvas');
            const offcanvas = document.getElementById(offcanvasId);
            if (offcanvas) emit('offcanvas-open', {}, offcanvas);
        }

        const closeOffcanvasEl = target.closest('[data-catchy-close-offcanvas]');
        if (closeOffcanvasEl) {
            const offcanvasId = closeOffcanvasEl.getAttribute('data-catchy-close-offcanvas');
            const offcanvas = document.getElementById(offcanvasId);
            if (offcanvas) emit('offcanvas-close', {}, offcanvas);
        }

        // Normal link SPA routing
        const link = target.closest('a');
        if (link && !shouldIgnoreLink(link, event, config.ignoreAttribute)) {
            event.preventDefault();
            visitFn(link.href, { trigger: link });
        }
    });

    // Global Event: Form submit interceptor
    document.addEventListener('submit', (event) => {
        const form = event.target && typeof event.target.closest === 'function' ? event.target.closest('form') : null;
        if (!form || shouldIgnoreForm(form, config.ignoreAttribute)) return;

        // Handle Confirm via Custom Modal
        const confirmModalId = form.getAttribute('data-catchy-confirm-modal');
        if (confirmModalId && (!pendingAction || pendingAction.trigger !== form)) {
            event.preventDefault();
            event.stopImmediatePropagation();

            pendingAction = {
                trigger: form,
                modalId: confirmModalId,
                execute: () => { submitFormFn(form); }
            };

            const modal = document.getElementById(confirmModalId);
            if (modal) emit('modal-open', {}, modal);
            return;
        }

        // Handle Declarative Confirmation
        const confirmMsg = form.getAttribute('data-catchy-confirm');
        if (confirmMsg && !confirm(confirmMsg)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }

        event.preventDefault();
        submitFormFn(form);
    });

    // Global Event: Popstate handling
    window.addEventListener('popstate', (event) => {
        const state = event.state;
        visitFn(window.location.href, { state }, false);
    });

    // Reset pending action when modal is closed
    document.addEventListener('catchy:modal-closed', (event) => {
        if (pendingAction && pendingAction.modalId === event.target.id) {
            pendingAction = null;
        }
    });
    document.addEventListener('catchy-modal-closed', (event) => {
        if (pendingAction && pendingAction.modalId === event.target.id) {
            pendingAction = null;
        }
    });
}
