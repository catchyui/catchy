/**
 * Catchy — Connectivity Module
 *
 * Online/offline monitoring with toast notifications.
 */

import { emit } from './utils.js';

/**
 * Initialize connectivity monitoring.
 * Fires toast notifications when online/offline state changes.
 */
export function initConnectivity() {
    window.addEventListener('offline', () => {
        emit('flash', { message: 'No internet connection. Operating in offline mode.', type: 'danger' });
    });

    window.addEventListener('online', () => {
        emit('flash', { message: 'Connection restored. Back online!', type: 'success' });
    });
}
