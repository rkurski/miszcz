/**
 * ============================================================================
 * AFO - Credentials Manager
 * ============================================================================
 *
 * Manages user login credentials with simple base64 obfuscation.
 * Credentials are global (one per account) - stored via AFO_STORAGE bridge.
 *
 * ============================================================================
 */

const AFO_CREDENTIALS = {
  // Storage key - single global key for the account
  STORAGE_KEY: 'gieniobot_creds',

  // Legacy prefix for cleanup
  LEGACY_PREFIX: 'gieniobot_creds_',

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
  // SAVE / LOAD / DELETE
  // ============================================

  /**
   * Save credentials (global, one per account)
   */
  async save(login, password) {
    const data = {
      login: this.encode(login),
      password: this.encode(password),
      savedAt: Date.now()
    };

    try {
      await AFO_STORAGE.set({ [this.STORAGE_KEY]: data });
      console.log('[AFO_CREDENTIALS] Saved credentials');
      return true;
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Save error:', e);
      return false;
    }
  },

  /**
   * Get saved credentials
   */
  async get() {
    try {
      const result = await AFO_STORAGE.get(this.STORAGE_KEY);
      if (result[this.STORAGE_KEY]) {
        return {
          login: this.decode(result[this.STORAGE_KEY].login),
          password: this.decode(result[this.STORAGE_KEY].password),
          savedAt: result[this.STORAGE_KEY].savedAt
        };
      }

      // Try legacy format migration
      return await this._tryLegacyMigration();
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Get error:', e);
      return null;
    }
  },

  /**
   * Check if credentials exist
   */
  async exists() {
    const creds = await this.get();
    return creds !== null && creds.login && creds.password;
  },

  /**
   * Clear credentials
   */
  async clear() {
    try {
      await AFO_STORAGE.remove(this.STORAGE_KEY);
      console.log('[AFO_CREDENTIALS] Cleared credentials');
      return true;
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Clear error:', e);
      return false;
    }
  },

  /**
   * Migrate from legacy per-server+char format if exists
   */
  async _tryLegacyMigration() {
    try {
      const result = await AFO_STORAGE.get(null);
      for (const key in result) {
        if (key.startsWith(this.LEGACY_PREFIX) && result[key].login) {
          console.log('[AFO_CREDENTIALS] Migrating legacy credentials from', key);
          const login = this.decode(result[key].login);
          const password = this.decode(result[key].password);
          if (login && password) {
            await this.save(login, password);
            // Clean up legacy key
            await AFO_STORAGE.remove(key);
            return { login, password, savedAt: result[key].savedAt };
          }
        }
      }
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Legacy migration error:', e);
    }
    return null;
  }
};

// Export
window.AFO_CREDENTIALS = AFO_CREDENTIALS;
console.log('[AFO] Credentials module loaded');
