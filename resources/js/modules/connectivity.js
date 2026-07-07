/**
 * CatchyUI  Connectivity Module
 *
 * Class-based online/offline monitoring with toast notifications.
 */

import { emit } from './utils.js';

export class CatchyConnectivity {
  /**
   * Initialize connectivity monitoring.
   * Fires toast notifications when online/offline state changes.
   */
  init() {
    window.addEventListener('offline', () => {
      emit('flash', { message: 'No internet connection. Operating in offline mode.', type: 'danger' });
    });

    window.addEventListener('online', () => {
      emit('flash', { message: 'Connection restored. Back online!', type: 'success' });
    });
  }
}

// Export singleton instance for direct module imports
export const connectivityInstance = new CatchyConnectivity();

// Maintain functional wrapper exports for backward compatibility & easy usage
export const initConnectivity = () => connectivityInstance.init();
