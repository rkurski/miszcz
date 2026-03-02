/**
 * ============================================================================
 * AFO - Reconnect Module Index
 * ============================================================================
 * 
 * Entry point for the reconnect subsystem.
 * Initializes immediately - doesn't wait for GAME (needed on main page).
 * 
 * ============================================================================
 */

const AFO_RECONNECT_INIT = {
  initialized: false,

  /**
   * Initialize all reconnect components
   * Called immediately on any kosmiczni.pl page
   */
  init() {
    if (this.initialized) return;

    console.log('[AFO_RECONNECT_INIT] Initializing reconnect system...');

    // Initialize reconnect FIRST (handles login on main page)
    if (typeof AFO_RECONNECT !== 'undefined') {
      AFO_RECONNECT.init();
    } else {
      console.warn('[AFO_RECONNECT_INIT] Reconnect module not loaded');
    }

    // Initialize UI only if on server page (where GAME will be available)
    // UI needs GAME to show character info, so we defer it
    this.initUIWhenReady();

    this.initialized = true;
    console.log('[AFO_RECONNECT_INIT] Reconnect system initialized');
  },

  /**
   * Initialize UI when GAME becomes available
   */
  initUIWhenReady() {
    let elapsed = 0;
    const MAX_WAIT = 120000; // 2 minutes

    const checkGame = () => {
      if (typeof GAME !== 'undefined' && GAME.char_id && GAME.char_data) {
        // GAME is ready, init UI
        if (typeof AFO_RECONNECT_UI !== 'undefined') {
          setTimeout(() => {
            AFO_RECONNECT_UI.init();
          }, 1000);
        }
      } else if (elapsed < MAX_WAIT) {
        elapsed += 1000;
        setTimeout(checkGame, 1000);
      } else {
        console.warn('[AFO_RECONNECT_INIT] UI init timeout after 2 minutes (GAME not ready)');
      }
    };

    checkGame();
  }
};

// Initialize IMMEDIATELY when script loads
// We need to start on main page too, not just when GAME is ready
(function () {
  console.log('[AFO_RECONNECT_INIT] Script loaded, initializing in 1s...');

  // Small delay to ensure other reconnect scripts are loaded
  setTimeout(() => {
    try {
      AFO_RECONNECT_INIT.init();
    } catch (e) {
      console.error('[AFO_RECONNECT_INIT] Init failed:', e, '- retrying in 5s...');
      setTimeout(() => {
        try {
          AFO_RECONNECT_INIT.initialized = false;
          AFO_RECONNECT_INIT.init();
        } catch (e2) {
          console.error('[AFO_RECONNECT_INIT] Retry also failed:', e2);
        }
      }, 5000);
    }
  }, 1000);
})();

// Export
window.AFO_RECONNECT_INIT = AFO_RECONNECT_INIT;
console.log('[AFO] Reconnect index module loaded');
