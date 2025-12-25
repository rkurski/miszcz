/**
 * Gieniobot Master - Main Application
 * Entry point replacing kwsv3 class
 */

class GieniobotApp {
  constructor() {
    // Core services
    this.settings = null;
    this.socket = null;

    // Managers
    this.ui = null;
    this.characters = null;

    // Feature modules
    this.combat = null;
    this.automation = null;
    this.clan = null;
    this.keyboard = null;

    // State
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Wait for game to be ready
      await this._waitForGame();

      Utils.log('App', 'GAME ready, initializing...');

      // Initialize core services
      this.settings = new SettingsManager();
      this.socket = new SocketService(GAME.socket);

      // Initialize managers
      this.characters = new CharactersManager();
      await this.characters.init();

      this.ui = new UIManager(this.settings, this.socket);

      // Initialize feature modules
      this.combat = new CombatManager(this.socket);
      this.automation = new AutomationManager(this.socket, this.settings);
      this.clan = new ClanManager(this.socket);

      // Initialize UI and bindings
      this.ui.init();
      this._bindClickHandlers();
      this._bindSocketHandlers();

      // Initialize keyboard shortcuts
      this.keyboard = new KeyboardHandler(this);

      // Run startup tasks
      this._runStartupTasks();

      this.isInitialized = true;
      Utils.log('App', 'Initialization complete!');

    } catch (error) {
      console.error('[Gieniobot] Initialization failed:', error);
    }
  }

  /**
   * Wait for GAME object to be available with character selected
   * @private
   */
  _waitForGame() {
    return new Promise((resolve) => {
      let checkCount = 0;
      const check = () => {
        checkCount++;

        // First check if GAME exists and player is logged in
        if (typeof GAME === 'undefined' || !GAME.pid) {
          if (checkCount % 50 === 0) {
            console.log(`[Gieniobot/App] Waiting for GAME.pid... (${checkCount} checks)`);
          }
          setTimeout(check, 100);
          return;
        }

        // Try to find socket if not already set
        if (!GAME.socket) {
          this._findSocket();
        }

        // Check all required conditions
        const hasSocket = GAME.socket && typeof GAME.socket.on === 'function';
        const hasCharId = !!GAME.char_id;
        const hasCharData = GAME.char_data && GAME.char_data.id;

        if (checkCount % 50 === 0) {
          console.log(`[Gieniobot/App] Waiting... socket:${hasSocket} char_id:${hasCharId} char_data:${hasCharData}`);
        }

        // Wait for socket + character to be selected
        if (hasSocket && hasCharId && hasCharData) {
          console.log('[Gieniobot/App] GAME ready with character!');
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      console.log('[Gieniobot/App] Starting to wait for GAME...');
      check();
    });
  }

  /**
   * Find and set GAME.socket by scanning page scripts
   * This is needed because the game doesn't expose socket directly
   * @private
   */
  _findSocket() {
    try {
      Array.from(document.getElementsByTagName('script')).forEach(script => {
        const scriptContent = script.innerHTML;
        const regex = /const\s+([a-zA-Z0-9_]+)\s*=\s*(io\([^\)]+\));/g;
        let match;
        while ((match = regex.exec(scriptContent)) !== null) {
          try {
            const socketVar = eval(match[1]);
            if (socketVar && socketVar['io']) {
              GAME.socket = socketVar;
              console.log('[Gieniobot/App] Socket found and assigned!');
              return;
            }
          } catch (e) {
            // Variable not accessible, continue
          }
        }
      });
    } catch (error) {
      console.error('[Gieniobot/App] Error finding socket:', error);
    }
  }

  /**
   * Bind click event handlers
   * @private
   */
  _bindClickHandlers() {
    const body = document.body;

    // Character navigation
    body.addEventListener('click', (e) => {
      const target = e.target.closest('[data-option]');
      if (!target) return;

      const option = target.getAttribute('data-option');

      switch (option) {
        case 'prevChar':
          this._resetAFO();
          const prevId = this.characters.getPreviousCharId();
          this.socket.selectChar(prevId);
          break;

        case 'nextChar':
          this._resetAFO();
          const nextId = this.characters.getNextCharId();
          this.socket.selectChar(nextId);
          break;

        case 'map_multi_pvp':
          this.combat.pvpKill();
          break;

        case 'map_quest_skip':
          this.combat.questProceed();
          if (typeof kom_clear === 'function') kom_clear();
          break;

        case 'map_quest_skip_time':
          this.combat.useCompressor();
          break;

        case 'map_alternative_pilot':
          this._createAlternativePilot();
          break;
      }
    });

    // Clan buttons
    body.addEventListener('click', (e) => {
      if (e.target.classList.contains('free_assist_for_all')) {
        this.clan.freeAssistAll();
      }

      if (e.target.classList.contains('activate_all_clan_buffs')) {
        this.clan.activateAllBuffs();
      }

      if (e.target.classList.contains('auto_bless')) {
        this.automation.toggleAutoBless();
      }

      if (e.target.id === 'poka_telep') {
        this.clan.toggleTeleportRoom();
      }
    });

    // Automation toggles
    body.addEventListener('click', (e) => {
      if (e.target.closest('.manage_autoExpeditions')) {
        this.automation.toggleAutoExpeditions();
      }

      if (e.target.closest('.manage_auto_arena')) {
        this.automation.toggleAutoArena();
      }

      if (e.target.closest('.manage_auto_abyss')) {
        this.automation.toggleAutoAbyss();
      }
    });

    // Top bar interactions
    body.addEventListener('click', (e) => {
      if (e.target.closest('.additional_stats')) {
        this.ui.toggleAdditionalTopBar();
      }

      if (e.target.closest('.additional_stats_reset')) {
        this.ui.resetCalculatedPower();
      }
    });

    // Instance button
    body.addEventListener('click', (e) => {
      if (e.target.closest('#secondary_char_stats .instance')) {
        this._doAllInstances();
      }

      if (e.target.closest('#secondary_char_stats .activities')) {
        this._collectActivities();
      }
    });

    // Spawner settings
    body.addEventListener('change', (e) => {
      if (e.target.name === 'ignoreMobs') {
        this._updateSpawnerSettings();
      }

      if (e.target.name === 'usePaToSpawn') {
        this._updatePaToSpawn(e.target.value);
      }
    });

    // Make spawn panel draggable
    const spawnPanel = document.getElementById('kws_spawn');
    if (spawnPanel && typeof $ !== 'undefined' && $.fn.draggable) {
      $(spawnPanel).draggable({ handle: '.sekcja' });
    }

    // Spawn switch toggle
    body.addEventListener('click', (e) => {
      if (e.target.closest('.spawn_switch')) {
        const spawn2 = document.getElementById('kws_spawn2');
        if (spawn2) {
          spawn2.style.display = spawn2.style.display === 'none' ? '' : 'none';
        }
      }
    });
  }

  /**
   * Bind socket event handlers
   * @private
   */
  _bindSocketHandlers() {
    // Handle game responses
    this.socket.on('gr', (data) => {
      this._handleGameResponse(data);
    });
  }

  /**
   * Handle game response events
   * @private
   */
  _handleGameResponse(data) {
    // Arena win counter
    if (data.arena && data.arena.exp) {
      this.ui.incrementArenaCount();
    }

    // PvP win counter
    if (data.pvp && data.pvp.we_win === true) {
      this.ui.incrementPvpCount();
    }

    // Adjust current character ID
    if (typeof GAME !== 'undefined' && GAME.char_id) {
      if (GAME.char_id !== this.characters.currentCharacterId) {
        this.characters.setCurrentCharacterId(GAME.char_id);
      }
    }
  }

  /**
   * Run startup tasks
   * @private
   */
  _runStartupTasks() {
    // Update card set names
    if (typeof GAME !== 'undefined' && GAME.char_id) {
      this.ui.updateCardSetNames(GAME.char_id);
    }

    // Show card sets UI
    this.ui.showCardSets();

    // Apply background if saved
    const bg = this.settings.getBackground();
    if (bg) {
      document.body.style.backgroundImage = `url(${bg})`;
    }

    // Apply map size if saved
    const mapSize = this.settings.getMapSize();
    if (mapSize && typeof GAME !== 'undefined' && GAME.map && GAME.map.changeSize) {
      GAME.map.changeSize(mapSize.x, mapSize.y);
    }

    // Initialize game values
    if (typeof GAME !== 'undefined') {
      GAME.startLevel = GAME.char_data?.level || 0;
      GAME.startTime = Date.now();
    }
  }

  /**
   * Reset AFO state when switching characters
   * @private
   */
  _resetAFO() {
    // Stop any running automation
    this.automation.stopAll();

    // Reset tournament state
    setTimeout(() => {
      Utils.log('App', 'AFO state reset');
    }, 1000);
  }

  /**
   * Do all instances for workers
   * @private
   */
  _doAllInstances() {
    const workers = document.querySelectorAll('#emp_list .petopt_cont button[data-option="do_isntance"]:not(.disabled)');

    if (workers.length > 0) {
      workers[0].click();
      setTimeout(() => this._doAllInstances(), 300);
    } else {
      if (typeof GAME !== 'undefined' && GAME.komunikat) {
        GAME.komunikat('Wykonano wszystkie możliwe instancje!');
      }
    }
  }

  /**
   * Collect activity rewards
   * @private
   */
  _collectActivities() {
    const rewards = document.querySelectorAll('#act_prizes div.act_prize:not(.disabled)');

    rewards.forEach((reward, i) => {
      setTimeout(() => reward.click(), i * 200);
    });
  }

  /**
   * Update spawner ignore settings
   * @private
   */
  _updateSpawnerSettings() {
    if (typeof GAME === 'undefined' || !GAME.spawner) return;

    GAME.spawner[1] = Array.from(
      document.querySelectorAll('#kws_spawn input[name="ignoreMobs"]')
    ).map(el => el.checked ? 1 : 0);
  }

  /**
   * Update PA to spawn setting
   * @private
   */
  _updatePaToSpawn(value) {
    if (typeof GAME === 'undefined' || !GAME.spawner) return;

    GAME.spawner[0] = parseInt(value, 10) || 1000;
  }

  /**
   * Create alternative pilot interface
   * @private
   */
  _createAlternativePilot() {
    // This is a complex UI modification - delegating to original implementation
    // Will be fully migrated in later phase
    Utils.log('App', 'Alternative pilot requested');
  }

  /**
   * Go to next character
   */
  goToNextChar() {
    this._resetAFO();
    const charId = this.characters.getNextCharId();
    this.socket.selectChar(charId);
  }

  /**
   * Go to previous character
   */
  goToPreviousChar() {
    this._resetAFO();
    const charId = this.characters.getPreviousCharId();
    this.socket.selectChar(charId);
  }
}

// Global reference for compatibility
var kwsApp = null;

console.log('[Gieniobot/App] app.js loaded, document.readyState:', document.readyState);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  console.log('[Gieniobot/App] Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Gieniobot/App] DOMContentLoaded fired, creating app...');
    kwsApp = new GieniobotApp();
    kwsApp.init();
  });
} else {
  console.log('[Gieniobot/App] DOM ready, creating app immediately...');
  kwsApp = new GieniobotApp();
  kwsApp.init();
}
