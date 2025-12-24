/**
 * Gieniobot Master - Settings Manager
 * Centralized settings management with localStorage persistence
 */

class SettingsManager {
  constructor() {
    this.STORAGE_KEYS = {
      MAIN: 'kws_settings',
      MINIMAP: 'kws_minimap',
      MAP_SIZE: 'kws_mapsize',
      PILOT: 'kws_pilot',
      BACKGROUND: 'kws_wbg'
    };

    this.defaults = {
      main: {
        hide_tracker: false,
        aeCodes: false,
        sets: {}
      },
      minimap: {
        side: 0,      // 0=right, 1=left, 2=left-outside
        opacity: 100,
        loc_info: 0   // 0=hide, 1=show
      },
      mapSize: {
        x: 13,
        y: 13
      }
    };

    this._cache = {};
    this._initSettings();
  }

  /**
   * Initialize settings from localStorage
   * @private
   */
  _initSettings() {
    // Load and validate main settings
    this._cache.main = this._loadWithDefaults(
      this.STORAGE_KEYS.MAIN,
      this.defaults.main
    );

    // Load minimap settings
    this._cache.minimap = this._loadWithDefaults(
      this.STORAGE_KEYS.MINIMAP,
      this.defaults.minimap
    );

    // Load map size
    this._cache.mapSize = this._loadWithDefaults(
      this.STORAGE_KEYS.MAP_SIZE,
      this.defaults.mapSize
    );

    // Load simple values
    this._cache.pilot = this._loadValue(this.STORAGE_KEYS.PILOT, '0');
    this._cache.background = this._loadValue(this.STORAGE_KEYS.BACKGROUND, null);
  }

  /**
   * Load JSON from localStorage with defaults
   * @private
   */
  _loadWithDefaults(key, defaults) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        localStorage.setItem(key, JSON.stringify(defaults));
        return { ...defaults };
      }

      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new properties
      const merged = { ...defaults, ...parsed };
      localStorage.setItem(key, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.error(`[Settings] Error loading ${key}:`, e);
      localStorage.setItem(key, JSON.stringify(defaults));
      return { ...defaults };
    }
  }

  /**
   * Load simple value from localStorage
   * @private
   */
  _loadValue(key, defaultValue) {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  }

  // =============== MAIN SETTINGS ===============

  /**
   * Get main settings object
   * @returns {Object} Main settings
   */
  getMain() {
    return this._cache.main;
  }

  /**
   * Update main settings
   * @param {Object} updates - Settings to update
   */
  updateMain(updates) {
    this._cache.main = { ...this._cache.main, ...updates };
    localStorage.setItem(this.STORAGE_KEYS.MAIN, JSON.stringify(this._cache.main));
  }

  /**
   * Get setting value from main settings
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  get(key) {
    return this._cache.main[key];
  }

  /**
   * Set setting value in main settings
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  set(key, value) {
    this._cache.main[key] = value;
    localStorage.setItem(this.STORAGE_KEYS.MAIN, JSON.stringify(this._cache.main));
  }

  // =============== MINIMAP SETTINGS ===============

  /**
   * Get minimap settings
   * @returns {Object} Minimap settings
   */
  getMinimap() {
    return this._cache.minimap;
  }

  /**
   * Update minimap settings
   * @param {Object} updates - Settings to update
   */
  updateMinimap(updates) {
    this._cache.minimap = { ...this._cache.minimap, ...updates };
    localStorage.setItem(this.STORAGE_KEYS.MINIMAP, JSON.stringify(this._cache.minimap));
  }

  // =============== MAP SIZE SETTINGS ===============

  /**
   * Get map size settings
   * @returns {Object} Map size {x, y}
   */
  getMapSize() {
    return this._cache.mapSize;
  }

  /**
   * Update map size
   * @param {number} x - Width
   * @param {number} y - Height
   */
  setMapSize(x, y) {
    this._cache.mapSize = { x, y };
    localStorage.setItem(this.STORAGE_KEYS.MAP_SIZE, JSON.stringify(this._cache.mapSize));
  }

  /**
   * Reset map size to default
   */
  resetMapSize() {
    this.setMapSize(this.defaults.mapSize.x, this.defaults.mapSize.y);
  }

  // =============== PILOT SETTINGS ===============

  /**
   * Get pilot visibility setting
   * @returns {boolean} True if pilot should be hidden
   */
  isPilotHidden() {
    return this._cache.pilot === '1';
  }

  /**
   * Set pilot visibility
   * @param {boolean} hidden - True to hide pilot
   */
  setPilotHidden(hidden) {
    this._cache.pilot = hidden ? '1' : '0';
    localStorage.setItem(this.STORAGE_KEYS.PILOT, this._cache.pilot);
  }

  // =============== BACKGROUND SETTINGS ===============

  /**
   * Get custom background URL
   * @returns {string|null} Background URL or null
   */
  getBackground() {
    return this._cache.background;
  }

  /**
   * Set custom background
   * @param {string} url - Background image URL
   */
  setBackground(url) {
    if (url && url.length > 5) {
      this._cache.background = url;
      localStorage.setItem(this.STORAGE_KEYS.BACKGROUND, url);
    }
  }

  /**
   * Remove custom background
   */
  removeBackground() {
    this._cache.background = null;
    localStorage.removeItem(this.STORAGE_KEYS.BACKGROUND);
  }

  // =============== CARD SETS ===============

  /**
   * Get card set names for character
   * @param {number} charId - Character ID
   * @returns {string[]} Array of set names
   */
  getCardSetNames(charId) {
    const sets = this._cache.main.sets || {};
    return sets[charId] || ['I', 'II', 'III', 'IV', 'V'];
  }

  /**
   * Save card set names for character
   * @param {number} charId - Character ID
   * @param {string[]} names - Array of set names
   */
  setCardSetNames(charId, names) {
    if (!this._cache.main.sets) {
      this._cache.main.sets = {};
    }
    this._cache.main.sets[charId] = names;
    this.updateMain({ sets: this._cache.main.sets });
  }

  // =============== UTILITIES ===============

  /**
   * Reset all settings to defaults
   */
  resetAll() {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this._initSettings();
  }

  /**
   * Export all settings as JSON
   * @returns {string} JSON string of all settings
   */
  exportSettings() {
    return JSON.stringify({
      main: this._cache.main,
      minimap: this._cache.minimap,
      mapSize: this._cache.mapSize,
      pilot: this._cache.pilot,
      background: this._cache.background
    }, null, 2);
  }

  /**
   * Import settings from JSON
   * @param {string} json - JSON string
   */
  importSettings(json) {
    try {
      const data = JSON.parse(json);
      if (data.main) this.updateMain(data.main);
      if (data.minimap) this.updateMinimap(data.minimap);
      if (data.mapSize) this.setMapSize(data.mapSize.x, data.mapSize.y);
      if (data.pilot !== undefined) this.setPilotHidden(data.pilot === '1');
      if (data.background) this.setBackground(data.background);
    } catch (e) {
      console.error('[Settings] Import failed:', e);
      throw new Error('Invalid settings format');
    }
  }
}
