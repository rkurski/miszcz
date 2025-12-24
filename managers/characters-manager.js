/**
 * Gieniobot Master - Characters Manager
 * Refactored version of charactersManager.js
 */

class CharactersManager {
  constructor() {
    this.characters = [];
    this.currentCharacterId = null;
    this._initialized = false;
  }

  /**
   * Initialize character list from DOM
   */
  init() {
    return new Promise((resolve) => {
      this._collectCharacters(resolve);
    });
  }

  /**
   * Collect characters from DOM with retry
   * @private
   */
  _collectCharacters(callback) {
    const charElements = document.querySelectorAll('li[data-option="select_char"]');

    if (charElements.length === 0) {
      setTimeout(() => this._collectCharacters(callback), 100);
      return;
    }

    this.characters = Array.from(charElements).map(el =>
      parseInt(el.getAttribute('data-char_id'), 10)
    );

    if (typeof GAME !== 'undefined' && GAME.char_id) {
      this.currentCharacterId = GAME.char_id;
    } else if (this.characters.length > 0) {
      this.currentCharacterId = this.characters[0];
    }

    this._initialized = true;
    callback(this.characters);
  }

  /**
   * Get current character index in list
   * @private
   */
  _getCurrentIndex() {
    const index = this.characters.indexOf(this.currentCharacterId);
    return index >= 0 ? index : 0;
  }

  /**
   * Set current character ID
   * @param {number} charId - Character ID
   */
  setCurrentCharacterId(charId) {
    if (this.characters.includes(charId)) {
      this.currentCharacterId = charId;
    }
  }

  /**
   * Get next character ID (circular)
   * @returns {number} Next character ID
   */
  getNextCharId() {
    const currentIndex = this._getCurrentIndex();
    const nextIndex = (currentIndex + 1) % this.characters.length;
    this.currentCharacterId = this.characters[nextIndex];
    return this.currentCharacterId;
  }

  /**
   * Get previous character ID (circular)
   * @returns {number} Previous character ID
   */
  getPreviousCharId() {
    const currentIndex = this._getCurrentIndex();
    const prevIndex = (currentIndex - 1 + this.characters.length) % this.characters.length;
    this.currentCharacterId = this.characters[prevIndex];
    return this.currentCharacterId;
  }

  /**
   * Get all character IDs
   * @returns {number[]} Array of character IDs
   */
  getAllCharacters() {
    return [...this.characters];
  }

  /**
   * Get character count
   * @returns {number} Number of characters
   */
  getCount() {
    return this.characters.length;
  }

  /**
   * Check if initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this._initialized;
  }
}
