/**
 * Gieniobot Master - Keyboard Shortcuts Handler
 * Centralized keyboard event handling
 */

class KeyboardHandler {
  constructor(app) {
    this.app = app;
    this.enabled = true;
    this._bindEvents();
  }

  /**
   * Bind keyboard events
   * @private
   */
  _bindEvents() {
    document.addEventListener('keydown', (event) => this._handleKeydown(event));
  }

  /**
   * Handle keydown events
   * @private
   */
  _handleKeydown(event) {
    // Skip if focus is on input elements
    if (this._isInputFocused()) return;
    if (!this.enabled) return;

    const key = event.key;

    switch (key.toLowerCase()) {
      case 'x':
        this.app.combat.questProceed();
        if (typeof kom_clear === 'function') kom_clear();
        break;

      case 'b':
        this.app.combat.pvpKill();
        break;

      case 'n':
        this.app.combat.useCompressor();
        break;

      case '2':
        // Use senzu
        this.app.socket.emit(15, { type: 13 });
        break;

      case '3':
        // Use sfera
        this.app.socket.emit(39, { type: 32 });
        break;

      case '4':
        // Bless
        this.app.clan.bless();
        break;

      case '5':
        // VIP rewards
        this._collectVipRewards();
        break;

      case '6':
        // Rent
        this.app.socket.emit(39, { type: 46, rent: 3 });
        break;

      case '7':
        // Start expedition
        this.app.socket.emit(10, { type: 2, ct: 0 });
        break;

      case '8':
        // Switch equipment set
        this._switchEquipmentSet();
        break;

      case '=':
        // Alternative pilot
        if (this.app.ui.createAlternativePilot) {
          this.app.ui.createAlternativePilot();
        }
        break;

      case ',':
        // Previous character
        this.app.characters.goToPrevious();
        break;

      case '.':
        // Next character
        this.app.characters.goToNext();
        break;
    }
  }

  /**
   * Check if an input element is focused
   * @private
   */
  _isInputFocused() {
    const active = document.activeElement;
    return active && (
      active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.isContentEditable
    );
  }

  /**
   * Collect VIP rewards sequence
   * @private
   */
  _collectVipRewards() {
    setTimeout(() => {
      this.app.socket.emit(54, { type: 0 });
    }, 300);
    setTimeout(() => {
      this.app.automation.collectVip();
    }, 600);
    this.app.socket.emit(15, { type: 7 });
  }

  /**
   * Switch to next equipment set
   * @private
   */
  _switchEquipmentSet() {
    const nextSet = document.querySelector('#ekw_sets .option.ek_sets_all:not(.current)');
    if (nextSet) {
      const setId = nextSet.getAttribute('data-set');
      this.app.socket.emit(64, { type: 2, set: setId });
    }
  }

  /**
   * Enable keyboard handling
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable keyboard handling
   */
  disable() {
    this.enabled = false;
  }
}
