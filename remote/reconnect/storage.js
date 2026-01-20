/**
 * ============================================================================
 * AFO - Storage Bridge
 * ============================================================================
 * 
 * Provides chrome.storage.local access from page context via custom events.
 * Content script (content_script.js) handles the actual storage operations.
 * 
 * ============================================================================
 */

const AFO_STORAGE = {
  // Request ID counter for matching responses
  _requestId: 0,

  // Pending requests waiting for response
  _pending: new Map(),

  // Initialize listener for responses
  _initialized: false,

  /**
   * Initialize the response listener
   */
  init() {
    if (this._initialized) return;

    window.addEventListener('__GIENIOBOT_STORAGE_RESULT__', (event) => {
      const { requestId, success, data, error } = event.detail;
      const pending = this._pending.get(requestId);

      if (pending) {
        this._pending.delete(requestId);
        if (success) {
          pending.resolve(data);
        } else {
          pending.reject(new Error(error || 'Storage operation failed'));
        }
      }
    });

    this._initialized = true;
    console.log('[AFO_STORAGE] Bridge initialized');
  },

  /**
   * Generate unique request ID
   */
  _nextRequestId() {
    return `req_${++this._requestId}_${Date.now()}`;
  },

  /**
   * Send request and wait for response
   */
  _request(eventName, detail, timeout = 5000) {
    this.init(); // Ensure initialized

    const requestId = this._nextRequestId();

    return new Promise((resolve, reject) => {
      // Set timeout
      const timer = setTimeout(() => {
        this._pending.delete(requestId);
        reject(new Error('Storage request timeout'));
      }, timeout);

      // Store pending request
      this._pending.set(requestId, {
        resolve: (data) => {
          clearTimeout(timer);
          resolve(data);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        }
      });

      // Dispatch request event
      window.dispatchEvent(new CustomEvent(eventName, {
        detail: { requestId, ...detail }
      }));
    });
  },

  // ============================================
  // PUBLIC API (mirrors chrome.storage.local)
  // ============================================

  /**
   * Get data from storage
   * @param {string|string[]|null} keys - Keys to get, or null for all
   * @returns {Promise<Object>} - Storage data
   */
  async get(keys) {
    const result = await this._request('__GIENIOBOT_STORAGE_GET__', { keys });
    return result || {};
  },

  /**
   * Set data in storage
   * @param {Object} data - Key-value pairs to set
   * @returns {Promise<void>}
   */
  async set(data) {
    await this._request('__GIENIOBOT_STORAGE_SET__', { data });
  },

  /**
   * Remove keys from storage
   * @param {string|string[]} keys - Keys to remove
   * @returns {Promise<void>}
   */
  async remove(keys) {
    await this._request('__GIENIOBOT_STORAGE_REMOVE__', { keys });
  }
};

// Auto-initialize
AFO_STORAGE.init();

// Export
window.AFO_STORAGE = AFO_STORAGE;
console.log('[AFO] Storage bridge module loaded');
