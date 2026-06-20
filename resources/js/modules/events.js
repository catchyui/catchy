/**
 * Catchy — Events Module
 *
 * Global event listeners for click, submit, popstate, and confirmation dialogs.
 */

import { shouldIgnoreLink, shouldIgnoreForm, emit } from './utils.js';
import { submitForm } from './forms.js';

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

/**
 * Resolves the target modal element based on the trigger or default selectors.
 *
 * @param {HTMLElement} triggerElement
 * @returns {HTMLElement|null}
 */
export function resolveModal(triggerElement) {
    const modalAttr = triggerElement && typeof triggerElement.getAttribute === 'function' ? triggerElement.getAttribute('data-catchy-modal') : null;
    if (modalAttr && modalAttr !== '' && modalAttr !== 'true') {
        const specificModal = document.getElementById(modalAttr);
        if (specificModal) return specificModal;
    }
    if (triggerElement && typeof triggerElement.closest === 'function') {
        const closestModal = triggerElement.closest('[catchy-modal]') || triggerElement.closest('#catchy-modal');
        if (closestModal) return closestModal;
    }
    return document.querySelector('[catchy-modal]') || document.getElementById('catchy-modal');
}

/**
 * Resolves the target offcanvas element based on the trigger or default selectors.
 *
 * @param {HTMLElement} triggerElement
 * @returns {HTMLElement|null}
 */
export function resolveOffcanvas(triggerElement) {
    const offcanvasAttr = triggerElement && typeof triggerElement.getAttribute === 'function' ? triggerElement.getAttribute('data-catchy-offcanvas') : null;
    if (offcanvasAttr && offcanvasAttr !== '' && offcanvasAttr !== 'true') {
        const specificOffcanvas = document.getElementById(offcanvasAttr);
        if (specificOffcanvas) return specificOffcanvas;
    }
    if (triggerElement && typeof triggerElement.closest === 'function') {
        const closestOffcanvas = triggerElement.closest('[catchy-offcanvas]') || triggerElement.closest('#catchy-offcanvas');
        if (closestOffcanvas) return closestOffcanvas;
    }
    return document.querySelector('[catchy-offcanvas]') || document.getElementById('catchy-offcanvas');
}

/**
 * Declaratively handles opening/closing of modals and offcanvas drawers
 * based on request success/error state.
 *
 * @param {HTMLElement} trigger
 * @param {string} type ('success' | 'error')
 */
export function handleLifecycleTriggers(trigger, type) {
    if (!trigger || typeof trigger.getAttribute !== 'function') return;

    // Parse shorthand: data-catchy-on-{type}="action:component:id"
    const shorthand = trigger.getAttribute(`data-catchy-on-${type}`);
    if (shorthand) {
        parseShorthandAction(shorthand, trigger, type);
    }

    // Legacy verbose attributes
    const openModal = trigger.getAttribute(`data-catchy-${type}-open-modal`);
    if (openModal) {
        const m = document.getElementById(openModal);
        if (m) emit('modal-open', {}, m);
    }

    const closeModal = trigger.getAttribute(`data-catchy-${type}-close-modal`);
    if (closeModal) {
        const m = document.getElementById(closeModal);
        if (m) emit('modal-close', {}, m);
    }

    const openOffcanvas = trigger.getAttribute(`data-catchy-${type}-open-offcanvas`);
    if (openOffcanvas) {
        const oc = document.getElementById(openOffcanvas);
        if (oc) emit('offcanvas-open', {}, oc);
    }

    const closeOffcanvas = trigger.getAttribute(`data-catchy-${type}-close-offcanvas`);
    if (closeOffcanvas) {
        const oc = document.getElementById(closeOffcanvas);
        if (oc) emit('offcanvas-close', {}, oc);
    }

    // Auto-reset form inputs on success
    if (type === 'success' && trigger.tagName === 'FORM' && trigger.hasAttribute('data-catchy-success-reset')) {
        trigger.reset();
    }

    // Trigger dynamic toasts
    const toastMsg = trigger.getAttribute(`data-catchy-${type}-toast`);
    if (toastMsg) {
        emit('flash', { message: toastMsg, type: type });
    }

    // Trigger dynamic lazy reloading
    const reloadId = trigger.getAttribute(`data-catchy-${type}-reload`);
    if (reloadId) {
        emit('lazy-reload', { id: reloadId });
    }
}

/**
 * Parse a shorthand action string like "close:modal:id" or "reset" or "toast:message".
 *
 * @param {string} actionStr
 * @param {HTMLElement} trigger
 * @param {string} type
 */
export function parseShorthandAction(actionStr, trigger, type) {
    const actions = actionStr.split(';').map(a => a.trim()).filter(Boolean);

    actions.forEach(action => {
        const parts = action.split(':');
        const verb = parts[0];

        switch (verb) {
            case 'open':
            case 'close': {
                const component = parts[1]; // 'modal' or 'offcanvas'
                const id = parts[2];
                if (component && id) {
                    const el = document.getElementById(id);
                    if (el) emit(`${component}-${verb}`, {}, el);
                }
                break;
            }
            case 'reset': {
                const id = parts[1];
                if (id) {
                    const el = document.getElementById(id);
                    if (el && el.tagName === 'FORM') el.reset();
                } else if (trigger && trigger.tagName === 'FORM') {
                    trigger.reset();
                }
                break;
            }
            case 'toast': {
                const message = parts.slice(1).join(':');
                if (message) emit('flash', { message, type });
                break;
            }
            case 'reload': {
                const id = parts[1];
                if (id) emit('lazy-reload', { id });
                break;
            }
            case 'click': {
                const id = parts[1];
                if (id) {
                    const el = document.getElementById(id);
                    if (el) el.click();
                }
                break;
            }
            case 'submit': {
                const id = parts[1];
                if (id) {
                    const el = document.getElementById(id);
                    if (el && el.tagName === 'FORM') {
                        el.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    }
                }
                break;
            }
            case 'toggle':
            case 'add':
            case 'remove': {
                const className = parts[1];
                const id = parts[2];
                if (className && id) {
                    const el = document.getElementById(id);
                    if (el) {
                        if (verb === 'toggle') el.classList.toggle(className);
                        else if (verb === 'add') el.classList.add(className);
                        else if (verb === 'remove') el.classList.remove(className);
                    }
                }
                break;
            }
            case 'copy': {
                const sourceId = parts[1];
                const targetId = parts[2];
                if (sourceId && targetId) {
                    const src = document.getElementById(sourceId);
                    const dest = document.getElementById(targetId);
                    if (src && dest) {
                        if ('value' in src && 'value' in dest) {
                            dest.value = src.value;
                            dest.dispatchEvent(new Event('input', { bubbles: true }));
                            dest.dispatchEvent(new Event('change', { bubbles: true }));
                        } else {
                            dest.innerHTML = src.innerHTML;
                        }
                    }
                }
                break;
            }
        }
    });
}
