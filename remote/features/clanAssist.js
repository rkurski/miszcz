/**
 * ============================================================================
 * CLAN ASSIST - Automatic Clan Training Assists
 * ============================================================================
 * 
 * This module automatically assists clan members in training.
 * Runs every 30 seconds, independently of AFO.
 * 
 * Requirements to run:
 * - GAME.char_data must be defined
 * - GAME.char_data.klan_id != 0 (player must be in a clan)
 * - GAME.char_data.reborn >= 1 (player must have at least 1 reborn)
 * 
 * ============================================================================
 */

(function () {
  'use strict';

  // Wait for GAME to be available
  if (typeof GAME === 'undefined') {
    console.log('[ClanAssist] GAME is undefined, skipping initialization');
    return;
  }

  // Global state
  const CLAN_ASSIST = {
    enabled: false,          // Toggle state for auto-assist (off by default, like other modules)
    running: false,          // Currently processing assists
    lastRun: 0,              // Timestamp of last run
    checkInterval: 30000,    // 30 seconds between checks
    assistCooldown: 3000,    // 3 seconds between assists
    waitAfterOpen: 1000,     // 1 second wait after opening training page
    intervalId: null,        // Interval reference
    assistCount: 0           // Total assists done this session
  };

  // Make it globally accessible for debugging
  window.CLAN_ASSIST = CLAN_ASSIST;

  /**
   * Check if auto-assist should run
   * @returns {boolean}
   */
  function canRun() {
    // Must have GAME.char_data
    if (!GAME.char_data) {
      return false;
    }

    // Must be in a clan
    if (!GAME.char_data.klan_id || GAME.char_data.klan_id === 0) {
      return false;
    }

    // Must have at least 1 reborn
    if (GAME.char_data.reborn === undefined || GAME.char_data.reborn < 1) {
      return false;
    }

    return true;
  }

  /**
   * Delay helper
   * @param {number} ms 
   * @returns {Promise}
   */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process all available assists
   */
  async function processAssists() {
    if (CLAN_ASSIST.running) {
      console.log('[ClanAssist] Already running, skipping');
      return;
    }

    // Check if disabled via toggle
    if (CLAN_ASSIST.enabled === false) {
      console.log('[ClanAssist] Disabled via toggle, skipping');
      return;
    }

    // Check if we can run
    if (!canRun()) {
      console.log('[ClanAssist] Requirements not met, skipping');
      return;
    }

    CLAN_ASSIST.running = true;
    CLAN_ASSIST.lastRun = Date.now();

    try {
      console.log('[ClanAssist] Starting assist cycle...');

      // Step 1: Open clan training page
      GAME.emitOrder({ a: 39, type: 54 });

      // Step 2: Wait 1 second for page to load
      await delay(CLAN_ASSIST.waitAfterOpen);

      // Step 3: Collect ALL available assist buttons and extract their data
      const assistButtons = document.querySelectorAll('button[data-option="clan_assist"]');

      if (!assistButtons || assistButtons.length === 0) {
        console.log('[ClanAssist] No assists available');
        CLAN_ASSIST.running = false;
        return;
      }

      // Extract all tid/target data UPFRONT before executing any assists
      const assistsData = [];
      for (const btn of assistButtons) {
        const tid = btn.getAttribute('data-tid');
        const target = btn.getAttribute('data-target');

        if (tid) {
          assistsData.push({
            tid: parseInt(tid),
            target: parseInt(target || tid)
          });
        }
      }

      console.log('[ClanAssist] Found', assistsData.length, 'assists to process');

      // Step 4: Process each assist with cooldown
      let assistsDone = 0;

      for (const assist of assistsData) {
        // Check if disabled mid-cycle
        if (CLAN_ASSIST.enabled === false) {
          console.log('[ClanAssist] Disabled mid-cycle, stopping assists');
          break;
        }

        // Execute assist
        GAME.emitOrder({
          a: 39,
          type: 55,
          tid: assist.tid,
          target: assist.target
        });

        assistsDone++;
        CLAN_ASSIST.assistCount++;
        console.log('[ClanAssist] Assisted tid:', assist.tid, 'target:', assist.target, '(total:', CLAN_ASSIST.assistCount, ')');

        // Hide the confirmation popup
        await delay(300);
        kom_clear();

        // Wait cooldown between assists (skip delay after last one)
        if (assistsDone < assistsData.length) {
          await delay(CLAN_ASSIST.assistCooldown - 300);
        }
      }

      console.log('[ClanAssist] Cycle complete, assisted:', assistsDone);

    } catch (error) {
      console.error('[ClanAssist] Error:', error);
    } finally {
      CLAN_ASSIST.running = false;
    }
  }

  /**
   * Start the auto-assist system
   */
  function startAutoAssist() {
    if (CLAN_ASSIST.intervalId) {
      console.log('[ClanAssist] Already started');
      return;
    }

    console.log('[ClanAssist] Starting auto-assist system (every', CLAN_ASSIST.checkInterval / 1000, 'seconds)');

    // Run immediately on start
    processAssists();

    // Then run every 30 seconds
    CLAN_ASSIST.intervalId = setInterval(() => {
      // Double-check we're not already running (prevents overlap if assist takes longer)
      if (!CLAN_ASSIST.running) {
        processAssists();
      }
    }, CLAN_ASSIST.checkInterval);
  }

  /**
   * Stop the auto-assist system
   */
  function stopAutoAssist() {
    if (CLAN_ASSIST.intervalId) {
      clearInterval(CLAN_ASSIST.intervalId);
      CLAN_ASSIST.intervalId = null;
      console.log('[ClanAssist] Stopped auto-assist system');
    }
  }

  // Expose control functions
  CLAN_ASSIST.start = startAutoAssist;
  CLAN_ASSIST.stop = stopAutoAssist;
  CLAN_ASSIST.process = processAssists;

  // ============================================
  // AUTO-INITIALIZATION
  // ============================================

  // Wait for game to be fully loaded (char_data available)
  let initAttempts = 0;
  const maxInitAttempts = 60; // 30 seconds max wait (60 * 500ms)

  const initCheck = setInterval(() => {
    initAttempts++;

    if (initAttempts > maxInitAttempts) {
      clearInterval(initCheck);
      console.log('[ClanAssist] Timeout waiting for game data, initialization cancelled');
      return;
    }

    // Check if char_data is available
    if (GAME.char_data) {
      clearInterval(initCheck);

      // Check requirements AND enabled flag
      if (canRun() && CLAN_ASSIST.enabled !== false) {
        console.log('[ClanAssist] Requirements met and enabled, starting auto-assist');
        console.log('[ClanAssist] - Clan ID:', GAME.char_data.klan_id);
        console.log('[ClanAssist] - Reborn:', GAME.char_data.reborn);
        startAutoAssist();
      } else if (!canRun()) {
        console.log('[ClanAssist] Requirements not met:');
        console.log('[ClanAssist] - Clan ID:', GAME.char_data?.klan_id || 'none');
        console.log('[ClanAssist] - Reborn:', GAME.char_data?.reborn ?? 'unknown');
      } else {
        console.log('[ClanAssist] Disabled by toggle, auto-assist not started');
      }
    }
  }, 500);

  console.log('[ClanAssist] Module loaded, waiting for game data...');

})();
