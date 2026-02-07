/**
 * ============================================================================
 * KUKLA GUARDIAN - Strażnik Kukli (Dragon Ball Auto-Fighter)
 * ============================================================================
 *
 * This module automatically fights dragon balls (kukle) every 30 seconds.
 * Goes to game_balls page and triggers fights for all available balls.
 *
 * Default state:
 * - ON for GAME.server == 20 && GAME.char_data.id == 2860
 * - OFF for everyone else
 *
 * ============================================================================
 */

(function () {
  'use strict';

  // Wait for GAME to be available
  if (typeof GAME === 'undefined') {
    console.log('[KuklaGuardian] GAME is undefined, skipping initialization');
    return;
  }

  /**
   * Delay helper
   * @param {number} ms
   * @returns {Promise}
   */
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Global state
  const KUKLA_GUARDIAN = {
    enabled: false,          // Toggle state (set dynamically based on server/char)
    running: false,          // Currently processing fights
    timer: null,             // Timeout reference
    loopInterval: 30000,     // 30 seconds between loops
    fightDelay: 2000,        // 2 seconds between fights
    pageLoadDelay: 1000,     // 1 second wait after page switch
    fightCount: 0,           // Total fights this session
    // Pause/resume combat modules during fights
    pauseDelay: 2000,        // 2s wait after pausing before fights
    _pausedModules: null,    // Snapshot of paused modules (null = not paused)
    _safetyTimer: null       // Safety timer to force resume after 120s
  };

  // Make it globally accessible
  window.KUKLA_GUARDIAN = KUKLA_GUARDIAN;

  /**
   * Check if this is the special user (default ON)
   * @returns {boolean}
   */
  function isSpecialUser() {
    // return GAME.server === 20 && GAME.char_data && GAME.char_data.id === 2860;
    false
  }

  /**
   * Get default enabled state based on server/char
   * @returns {boolean}
   */
  function getDefaultEnabled() {
    return isSpecialUser();
  }

  /**
   * Snapshot which combat modules (PVP, RESP) are active and pause them.
   * @returns {Object|null} snapshot or null if no combat modules are active
   */
  function snapshotAndPauseCombatModules() {
    const snapshot = {
      PVP: typeof PVP !== 'undefined' && PVP.stop === false,
      RESP: typeof RESP !== 'undefined' && RESP.stop === false
    };

    if (!snapshot.PVP && !snapshot.RESP) return null;

    if (snapshot.PVP) PVP.stop = true;
    if (snapshot.RESP) RESP.stop = true;

    console.log('[KuklaGuardian] Paused combat modules:', JSON.stringify(snapshot));
    return snapshot;
  }

  /**
   * Resume combat modules that were active before the pause.
   * @param {Object} snapshot - from snapshotAndPauseCombatModules()
   */
  function resumeCombatModules(snapshot) {
    if (!snapshot) return;

    if (snapshot.PVP && typeof PVP !== 'undefined' && typeof AFO_PVP !== 'undefined') {
      PVP.stop = false;
      AFO_PVP.start();
      console.log('[KuklaGuardian] Resumed PVP');
    }

    if (snapshot.RESP && typeof RESP !== 'undefined' && typeof AFO_RESP !== 'undefined') {
      RESP.stop = false;
      AFO_RESP.action();
      if (!RESP.reloadint) {
        RESP.reloadint = setInterval(() => AFO_RESP.reload_map(), 60000);
      }
      console.log('[KuklaGuardian] Resumed RESP');
    }
  }

  /**
   * Run one cycle of ball fighting
   */
  async function runOnce() {
    if (!KUKLA_GUARDIAN.running) return;

    try {
      console.log('[KuklaGuardian] Loading balls data (no page switch)');
      GAME.emitOrder({a: 33, type: 0});

      await delay(KUKLA_GUARDIAN.pageLoadDelay);

      const buttons = [...document.querySelectorAll('button.option[data-option="ball_fight"]')];

      console.log(`[KuklaGuardian] Found ${buttons.length} balls to fight`);

      if (buttons.length > 0) {
        // Pause PVP/RESP if active
        const snapshot = snapshotAndPauseCombatModules();
        KUKLA_GUARDIAN._pausedModules = snapshot;

        if (snapshot) {
          // Safety timer: auto-resume after 120s in case of total hang
          KUKLA_GUARDIAN._safetyTimer = setTimeout(() => {
            console.warn('[KuklaGuardian] Safety timer triggered! Force-resuming modules.');
            if (KUKLA_GUARDIAN._pausedModules) {
              resumeCombatModules(KUKLA_GUARDIAN._pausedModules);
              KUKLA_GUARDIAN._pausedModules = null;
            }
          }, 120000);

          // Wait for current actions to finish
          console.log(`[KuklaGuardian] Waiting ${KUKLA_GUARDIAN.pauseDelay}ms for modules to settle...`);
          await delay(KUKLA_GUARDIAN.pauseDelay);
        }

        // Fight all balls
        for (const btn of buttons) {
          if (!KUKLA_GUARDIAN.running) break;

          const ballId = btn.dataset.ball_id;
          const charId = btn.dataset.char_id;

          console.log(`[KuklaGuardian] emitOrder → ball=${ballId}, char=${charId}`);

          try {
            GAME.emitOrder({
              a: 33,
              type: 6,
              char_id: Number(charId),
              ball: Number(ballId)
            });
            KUKLA_GUARDIAN.fightCount++;
          } catch (e) {
            console.warn('[KuklaGuardian] emitOrder error:', e);
          }

          await delay(KUKLA_GUARDIAN.fightDelay);
        }

        // Resume paused modules
        if (KUKLA_GUARDIAN._pausedModules) {
          console.log('[KuklaGuardian] Fights complete, resuming modules...');
          resumeCombatModules(KUKLA_GUARDIAN._pausedModules);
          KUKLA_GUARDIAN._pausedModules = null;
        }
        if (KUKLA_GUARDIAN._safetyTimer) {
          clearTimeout(KUKLA_GUARDIAN._safetyTimer);
          KUKLA_GUARDIAN._safetyTimer = null;
        }
      }
    } catch (e) {
      console.error('[KuklaGuardian] runOnce error:', e);
    } finally {
      // Safety: resume modules even on error
      if (KUKLA_GUARDIAN._pausedModules) {
        console.log('[KuklaGuardian] Finally: resuming modules after error/stop');
        resumeCombatModules(KUKLA_GUARDIAN._pausedModules);
        KUKLA_GUARDIAN._pausedModules = null;
      }
      if (KUKLA_GUARDIAN._safetyTimer) {
        clearTimeout(KUKLA_GUARDIAN._safetyTimer);
        KUKLA_GUARDIAN._safetyTimer = null;
      }

      if (KUKLA_GUARDIAN.running) {
        KUKLA_GUARDIAN.timer = setTimeout(() => runOnce(), KUKLA_GUARDIAN.loopInterval);
      }
    }
  }

  /**
   * Start the guardian
   */
  function start() {
    if (KUKLA_GUARDIAN.running) {
      console.log('[KuklaGuardian] Already running');
      return;
    }

    KUKLA_GUARDIAN.running = true;
    KUKLA_GUARDIAN.enabled = true;
    console.log('[KuklaGuardian] START');
    runOnce();
  }

  /**
   * Stop the guardian
   */
  function stop() {
    KUKLA_GUARDIAN.running = false;
    KUKLA_GUARDIAN.enabled = false;
    if (KUKLA_GUARDIAN.timer) {
      clearTimeout(KUKLA_GUARDIAN.timer);
      KUKLA_GUARDIAN.timer = null;
    }

    // Resume any paused modules
    if (KUKLA_GUARDIAN._pausedModules) {
      console.log('[KuklaGuardian] Stop called while modules paused, resuming...');
      resumeCombatModules(KUKLA_GUARDIAN._pausedModules);
      KUKLA_GUARDIAN._pausedModules = null;
    }
    if (KUKLA_GUARDIAN._safetyTimer) {
      clearTimeout(KUKLA_GUARDIAN._safetyTimer);
      KUKLA_GUARDIAN._safetyTimer = null;
    }

    console.log('[KuklaGuardian] STOP');
  }

  // Expose start/stop methods
  KUKLA_GUARDIAN.start = start;
  KUKLA_GUARDIAN.stop = stop;

  /**
   * Initialize - wait for char_data and auto-start if enabled
   */
  async function init() {
    // Wait up to 30 seconds for char_data
    const maxWait = 30000;
    const checkInterval = 500;
    let waited = 0;

    while (!GAME.char_data && waited < maxWait) {
      await delay(checkInterval);
      waited += checkInterval;
    }

    if (!GAME.char_data) {
      console.log('[KuklaGuardian] char_data not available after 30s, skipping init');
      return;
    }

    // Set default enabled state based on server/char
    // Note: This may be overridden by state restore from stateManager
    const defaultEnabled = getDefaultEnabled();

    // Only auto-start if enabled is explicitly true (not restored yet)
    // The state manager will handle restore if needed
    if (KUKLA_GUARDIAN.enabled === false && defaultEnabled) {
      // Check if state was already restored (stateManager sets this)
      if (!KUKLA_GUARDIAN._stateRestored) {
        KUKLA_GUARDIAN.enabled = true;
        console.log(`[KuklaGuardian] Auto-enabled for special user (server=${GAME.server}, char=${GAME.char_data.id})`);
        start();
      }
    } else if (KUKLA_GUARDIAN.enabled === true) {
      // Already enabled (possibly by state restore), start if not running
      if (!KUKLA_GUARDIAN.running) {
        console.log('[KuklaGuardian] Starting (enabled=true)');
        start();
      }
    }

    console.log(`[KuklaGuardian] Initialized - enabled=${KUKLA_GUARDIAN.enabled}, isSpecialUser=${isSpecialUser()}`);
  }

  // Start initialization
  init();

})();
