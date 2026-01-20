/**
 * ============================================================================
 * AFO - Credentials Manager
 * ============================================================================
 * 
 * Manages user login credentials with simple base64 obfuscation.
 * Data is stored per server + character via AFO_STORAGE bridge.
 * 
 * ============================================================================
 */

const AFO_CREDENTIALS = {
  // Storage key prefix
  KEY_PREFIX: 'gieniobot_creds_',

  // ============================================
  // ENCODING/DECODING (base64 + reverse)
  // ============================================

  /**
   * Simple obfuscation: reverse string + base64
   */
  encode(str) {
    if (!str) return '';
    try {
      // Reverse the string and encode to base64
      const reversed = str.split('').reverse().join('');
      return btoa(unescape(encodeURIComponent(reversed)));
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Encode error:', e);
      return '';
    }
  },

  /**
   * Decode: base64 decode + reverse
   */
  decode(str) {
    if (!str) return '';
    try {
      // Decode from base64 and reverse
      const decoded = decodeURIComponent(escape(atob(str)));
      return decoded.split('').reverse().join('');
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Decode error:', e);
      return '';
    }
  },

  // ============================================
  // STORAGE KEY
  // ============================================

  /**
   * Generate storage key for server + character
   */
  getKey(server, charId) {
    return `${this.KEY_PREFIX}s${server}_c${charId}`;
  },

  /**
   * Generate global key (for current session fallback)
   */
  getGlobalKey() {
    return `${this.KEY_PREFIX}global`;
  },

  // ============================================
  // SAVE / LOAD / DELETE
  // ============================================

  /**
   * Save credentials for specific server + character
   */
  async save(login, password, server, charId) {
    const key = this.getKey(server, charId);
    const data = {
      login: this.encode(login),
      password: this.encode(password),
      server: server,
      charId: charId,
      savedAt: Date.now()
    };

    try {
      await AFO_STORAGE.set({ [key]: data });
      console.log(`[AFO_CREDENTIALS] Saved credentials for server ${server}, char ${charId}`);
      return true;
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Save error:', e);
      return false;
    }
  },

  /**
   * Get credentials for specific server + character
   */
  async get(server, charId) {
    const key = this.getKey(server, charId);

    try {
      const result = await AFO_STORAGE.get(key);
      if (result[key]) {
        return {
          login: this.decode(result[key].login),
          password: this.decode(result[key].password),
          server: result[key].server,
          charId: result[key].charId,
          savedAt: result[key].savedAt
        };
      }
      return null;
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Get error:', e);
      return null;
    }
  },

  /**
   * Check if credentials exist for server + character
   */
  async exists(server, charId) {
    const creds = await this.get(server, charId);
    return creds !== null && creds.login && creds.password;
  },

  /**
   * Delete credentials for specific server + character
   */
  async clear(server, charId) {
    const key = this.getKey(server, charId);

    try {
      await AFO_STORAGE.remove(key);
      console.log(`[AFO_CREDENTIALS] Cleared credentials for server ${server}, char ${charId}`);
      return true;
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Clear error:', e);
      return false;
    }
  },

  /**
   * Get all saved credentials (for listing)
   */
  async getAll() {
    try {
      const result = await AFO_STORAGE.get(null);
      const credentials = [];

      for (const key in result) {
        if (key.startsWith(this.KEY_PREFIX) && key !== this.getGlobalKey()) {
          credentials.push({
            key: key,
            server: result[key].server,
            charId: result[key].charId,
            login: this.decode(result[key].login),
            savedAt: result[key].savedAt
          });
        }
      }

      return credentials;
    } catch (e) {
      console.error('[AFO_CREDENTIALS] GetAll error:', e);
      return [];
    }
  },

  /**
   * Clear all credentials
   */
  async clearAll() {
    try {
      const result = await AFO_STORAGE.get(null);
      const keysToRemove = [];

      for (const key in result) {
        if (key.startsWith(this.KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      if (keysToRemove.length > 0) {
        await AFO_STORAGE.remove(keysToRemove);
        console.log(`[AFO_CREDENTIALS] Cleared ${keysToRemove.length} credentials`);
      }

      return true;
    } catch (e) {
      console.error('[AFO_CREDENTIALS] ClearAll error:', e);
      return false;
    }
  },

  // ============================================
  // HELPER: Get current character credentials
  // ============================================

  /**
   * Get credentials for currently logged character
   * Falls back to trying to find any matching credentials
   */
  async getCurrent() {
    if (typeof GAME === 'undefined' || !GAME.server || !GAME.char_id) {
      console.warn('[AFO_CREDENTIALS] GAME not available, cannot get current credentials');
      return null;
    }

    return await this.get(GAME.server, GAME.char_id);
  },

  /**
   * Save credentials for currently logged character
   */
  async saveCurrent(login, password) {
    if (typeof GAME === 'undefined' || !GAME.server || !GAME.char_id) {
      console.warn('[AFO_CREDENTIALS] GAME not available, cannot save current credentials');
      return false;
    }

    return await this.save(login, password, GAME.server, GAME.char_id);
  }
};

// Export
window.AFO_CREDENTIALS = AFO_CREDENTIALS;
console.log('[AFO] Credentials module loaded');
