/**
 * ============================================================================
 * AFO - State Manager
 * ============================================================================
 * 
 * Manages serialization and deserialization of all AFO module states.
 * Saves/loads state per server + character via AFO_STORAGE bridge.
 * 
 * ============================================================================
 */

const AFO_STATE_MANAGER = {
  // Storage key prefix
  KEY_PREFIX: 'gieniobot_state_',

  // ============================================
  // MODULE DEFINITIONS
  // ============================================

  /**
   * Defines which properties to save for each module.
   * Only non-transient, user-configurable properties.
   */
  MODULES: {
    // PVM (Respawn)
    RESP: [
      'stop', 'wait', 'loc', 'code', 'kontoTP', 'codeTP',
      'bless', 'checkSSJ', 'checkOST', 'jaka', 'zmiana', 'multifight',
      'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10',
      'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18',
      'buff_imp', 'buff_clan', 'CONF_SENZU'
    ],

    // PVP
    PVP: [
      'stop', 'wait', 'wait2', 'loc', 'x', 'y', 'startX', 'startY',
      'code', 'autoWars', 'autoClanWars', 'g', 'speed', 'speedMultiplier',
      'higherRebornAvoid', 'dogory', 'tele', 'kontoTP', 'codeTP',
      'buff_imp', 'buff_clan'
    ],

    // LPVM (Listy gończe)
    LPVM: [
      'Stop', 'Born', 'limit', 'limit2', 'wait', 'Map', 'pvm_killed'
    ],

    // GLEBIA (Głębia)
    GLEBIA: [
      'stop', 'code', 'kontoTP', 'speed'
    ],

    // CODE (Kody/Trening)
    CODE: [
      'stop', 'what_to_train', 'what_to_traintime', 'acc', 'zast',
      'b1', 'b2', 'checkSSJ'
    ],

    // DAILY (Daily quests)
    DAILY: [
      'stop', 'enabledQuests', 'combatLoc', 'substance', 'useCompressor'
    ],

    // RES (Resources/Mining) - optional
    RES: [
      'stop', 'loc', 'speed'
    ]
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

  // ============================================
  // SERIALIZE / DESERIALIZE
  // ============================================

  /**
   * Serialize current state of all modules
   * Returns object with all module states
   */
  serialize() {
    const state = {
      savedAt: Date.now(),
      server: typeof GAME !== 'undefined' ? GAME.server : null,
      charId: typeof GAME !== 'undefined' ? GAME.char_id : null,
      modules: {},
      extra: {}
    };

    // Serialize each module
    for (const [moduleName, properties] of Object.entries(this.MODULES)) {
      const moduleObj = window[moduleName];
      if (moduleObj) {
        state.modules[moduleName] = {};
        for (const prop of properties) {
          if (prop in moduleObj) {
            // Deep clone arrays and objects
            const value = moduleObj[prop];
            if (Array.isArray(value)) {
              state.modules[moduleName][prop] = [...value];
            } else if (typeof value === 'object' && value !== null) {
              state.modules[moduleName][prop] = JSON.parse(JSON.stringify(value));
            } else {
              state.modules[moduleName][prop] = value;
            }
          }
        }
      }
    }

    // Save extra GAME data
    if (typeof GAME !== 'undefined') {
      // spawnerIgnore - important for PVM
      if (GAME.spawner && GAME.spawner[1]) {
        state.extra.spawnerIgnore = [...GAME.spawner[1]];
      }
      // usePaToSpawn - PA limit for spawner
      if (GAME.spawner && GAME.spawner[0] !== undefined) {
        state.extra.usePaToSpawn = GAME.spawner[0];
      } else {
        // Fallback: try reading from input
        const paInput = $('#kws_spawn input[name=usePaToSpawn]').val();
        if (paInput) {
          state.extra.usePaToSpawn = parseInt(paInput, 10) || 1000;
        }
      }
    }

    // Save kws automation states (arena, expeditions, abyss)
    if (typeof kws !== 'undefined') {
      state.kws = {
        auto_arena: kws.auto_arena || false,
        autoExpeditions: kws.autoExpeditions || false,
        auto_abyss: kws.auto_abyss || false,
        // Settings for expeditions
        aeCodes: kws.settings?.aeCodes || false
      };
    }

    // Save activities state if available
    if (window.AFO_ACTIVITIES_STATE) {
      state.activities = {
        enabled: window.AFO_ACTIVITIES_STATE.enabled || false,
        selectedActivities: window.AFO_ACTIVITIES_STATE.selectedActivities || [],
        substance: window.AFO_ACTIVITIES_STATE.substance || 'x3'
      };
    }

    return state;
  },

  /**
   * Deserialize and apply state to modules
   * @param {Object} state - State object from serialize()
   * @param {boolean} startModules - Whether to start active modules after restore
   */
  deserialize(state, startModules = false) {
    if (!state || !state.modules) {
      console.warn('[AFO_STATE_MANAGER] Invalid state object');
      return false;
    }

    console.log('[AFO_STATE_MANAGER] Deserialize called, startModules:', startModules);

    // If starting modules, we need to defer the actual restore until AFO is loaded
    // because AFO creates fresh module objects that would overwrite our restored values
    if (startModules) {
      console.log('[AFO_STATE_MANAGER] Deferring restore until AFO is loaded...');
      this._pendingState = state;
      this.startActiveModules(state);
      return true;
    }

    // Otherwise restore immediately (for manual restore when AFO is already loaded)
    return this._doRestore(state);
  },

  /**
   * Internal: Actually restore state to module objects
   * Called after AFO is loaded
   */
  _doRestore(state) {
    console.log('[AFO_STATE_MANAGER] Restoring state from', new Date(state.savedAt).toLocaleTimeString());

    // Log what we're restoring for debugging
    if (state.modules.PVP) {
      console.log('[AFO_STATE_MANAGER] PVP state to restore:', {
        stop: state.modules.PVP.stop,
        code: state.modules.PVP.code,
        kontoTP: state.modules.PVP.kontoTP,
        speed: state.modules.PVP.speed,
        speedMultiplier: state.modules.PVP.speedMultiplier
      });
    }

    // Restore each module
    for (const [moduleName, moduleState] of Object.entries(state.modules)) {
      const moduleObj = window[moduleName];
      if (moduleObj && this.MODULES[moduleName]) {
        console.log(`[AFO_STATE_MANAGER] Restoring ${moduleName}...`);

        for (const [prop, value] of Object.entries(moduleState)) {
          // Only restore properties we know about
          if (this.MODULES[moduleName].includes(prop)) {
            // Deep clone arrays and objects
            if (Array.isArray(value)) {
              moduleObj[prop] = [...value];
            } else if (typeof value === 'object' && value !== null) {
              moduleObj[prop] = JSON.parse(JSON.stringify(value));
            } else {
              moduleObj[prop] = value;
            }
          }
        }
      }
    }

    // Restore extra GAME data
    if (state.extra && typeof GAME !== 'undefined') {
      if (state.extra.spawnerIgnore && GAME.spawner) {
        GAME.spawner[1] = [...state.extra.spawnerIgnore];
      }
      // Restore usePaToSpawn
      if (state.extra.usePaToSpawn !== undefined) {
        if (GAME.spawner) {
          GAME.spawner[0] = state.extra.usePaToSpawn;
        }
        $('#kws_spawn input[name=usePaToSpawn]').val(state.extra.usePaToSpawn);
        console.log('[AFO_STATE_MANAGER] usePaToSpawn restored:', state.extra.usePaToSpawn);
      }
    }

    // Restore activities state
    if (state.activities && window.AFO_ACTIVITIES_STATE) {
      window.AFO_ACTIVITIES_STATE.enabled = state.activities.enabled;
      window.AFO_ACTIVITIES_STATE.selectedActivities = state.activities.selectedActivities || [];
      window.AFO_ACTIVITIES_STATE.substance = state.activities.substance || 'x3';
    }

    return true;
  },

  /**
   * Sync UI elements with restored state
   * Updates checkboxes, status labels, inputs etc.
   */
  syncUI(state) {
    if (!state || !state.modules) return;

    console.log('[AFO_STATE_MANAGER] Syncing UI with restored state...');

    // Helper to update status span
    const setStatus = (selector, isOn) => {
      const el = $(selector);
      if (el.length) {
        el.removeClass('red green').addClass(isOn ? 'green' : 'red').html(isOn ? 'On' : 'Off');
      }
    };

    // ========================
    // PVP UI
    // ========================
    if (state.modules.PVP) {
      const pvp = state.modules.PVP;

      // Main toggle will be handled by click, but update other options
      setStatus('.pvp_Code .pvp_status', pvp.code);
      setStatus('.pvpCODE_konto .pvp_status', pvp.kontoTP);
      setStatus('.pvp_WI .pvp_status', pvp.autoWars);
      setStatus('.pvp_WK .pvp_status', pvp.autoClanWars);
      setStatus('.pvp_rb_avoid .pvp_status', pvp.higherRebornAvoid);
      setStatus('.pvp_buff_imp .pvp_status', pvp.buff_imp);
      setStatus('.pvp_buff_clan .pvp_status', pvp.buff_clan);

      // Show/hide konto option based on code setting
      if (pvp.code) {
        $('#pvp_Panel .pvpCODE_konto').show();
      } else {
        $('#pvp_Panel .pvpCODE_konto').hide();
      }

      // Speed input
      if (pvp.speed) {
        $('#pvp_Panel input[name=speed_capt]').val(pvp.speed);
      }
    }

    // ========================
    // RESP (PVM) UI
    // ========================
    if (state.modules.RESP) {
      const resp = state.modules.RESP;

      setStatus('.resp_bless .resp_status', resp.bless);
      setStatus('.resp_code .resp_status', resp.code);
      setStatus('.resp_konto .resp_status', resp.kontoTP);
      setStatus('.resp_multi .resp_status', resp.multifight);
      setStatus('.resp_buff_imp .resp_status', resp.buff_imp);
      setStatus('.resp_buff_clan .resp_status', resp.buff_clan);

      // SSJ toggle (checkSSJ)
      console.log('[AFO_STATE_MANAGER] RESP SSJ checkSSJ:', resp.checkSSJ);
      setStatus('.resp_sub .resp_status', resp.checkSSJ);

      // Show/hide conditional elements
      if (resp.bless) {
        for (let i = 1; i <= 18; i++) {
          $(`#resp_Panel .resp_bh${i}`).show();
        }
        $('#resp_Panel .resp_on, #resp_Panel .resp_off').show();
      }

      if (resp.code) {
        $('#resp_Panel .resp_konto').show();
      }

      // Subka type (jaka: 0 = OST, 1 = x20) - only if SSJ is enabled
      if (resp.checkSSJ) {
        $('#resp_Panel .resp_ost').show();
        // Update text to show OST or x20 (not On/Off)
        const jakaText = resp.jaka === 0 ? 'OST' : 'x20';
        $('.resp_ost .resp_status').removeClass('red').addClass('green').html(jakaText);
        console.log('[AFO_STATE_MANAGER] RESP subka jaka:', resp.jaka, 'text:', jakaText);
      } else {
        // SSJ is off - hide subka option
        $('#resp_Panel .resp_ost').hide();
      }

      // Buff checkboxes (b1-b18)
      for (let i = 1; i <= 18; i++) {
        const isOn = resp[`b${i}`];
        if (isOn !== undefined) {
          setStatus(`.resp_bh${i} .resp_status`, isOn);
        }
      }

      // Senzu type (CONF_SENZU = 'SENZU_RED', 'SENZU_BLUE', etc. or false)
      const senzuTypes = ['red', 'blue', 'green', 'purple', 'yellow', 'magic'];
      if (resp.CONF_SENZU && resp.CONF_SENZU !== false) {
        // Extract color from 'SENZU_RED' -> 'red'
        const activeType = resp.CONF_SENZU.replace('SENZU_', '').toLowerCase();
        console.log('[AFO_STATE_MANAGER] RESP senzu type:', activeType);

        senzuTypes.forEach(t => {
          if (t === activeType) {
            $(`#resp_Panel .resp_${t}`).show();
            setStatus(`.resp_${t} .resp_status`, true);
          } else {
            $(`#resp_Panel .resp_${t}`).hide();
          }
        });
      } else {
        // No senzu active - show all
        senzuTypes.forEach(t => {
          $(`#resp_Panel .resp_${t}`).show();
          setStatus(`.resp_${t} .resp_status`, false);
        });
      }
    }

    // ========================
    // CODE UI
    // ========================
    if (state.modules.CODE) {
      const code = state.modules.CODE;

      setStatus('.code_acc .code_status', code.acc);
      setStatus('.code_zast .code_status', code.zast);
      setStatus('.code_ssj .code_status', code.checkSSJ);
      setStatus('.code_b1 .code_status', code.b1);
      setStatus('.code_b2 .code_status', code.b2);

      // Training select
      if (code.what_to_train) {
        $('#code_Panel select[name=code_train]').val(code.what_to_train);
      }
      if (code.what_to_traintime) {
        $('#code_Panel select[name=code_traintime]').val(code.what_to_traintime);
      }
    }

    // ========================
    // LPVM UI
    // ========================
    if (state.modules.LPVM) {
      const lpvm = state.modules.LPVM;

      // Born select
      if (lpvm.Born !== undefined) {
        $('#lpvm_Panel select[name=lpvm_born]').val(lpvm.Born);
      }

      // Limit inputs
      if (lpvm.limit) {
        $('#lpvm_Panel input[name=lpvm_limit]').val(lpvm.limit);
        $('#lpvm_Panel input[name=lpvm_capt]').val(lpvm.limit); // Also set lpvm_capt
      }
      if (lpvm.limit2) {
        $('#lpvm_Panel input[name=lpvm_limit2]').val(lpvm.limit2);
      }

      // pvm_killed (executed bounties count)
      if (lpvm.pvm_killed !== undefined) {
        // Find the counter element and update it
        $('#lpvm_Panel .lpvm_executed, #lpvm_Panel .lpvm_killed_count').text(lpvm.pvm_killed);
        // Also update LPVM global
        if (typeof LPVM !== 'undefined') {
          LPVM.pvm_killed = lpvm.pvm_killed;
        }
        console.log('[AFO_STATE_MANAGER] LPVM pvm_killed restored:', lpvm.pvm_killed);
      }
    }

    // ========================
    // GLEBIA UI
    // ========================
    if (state.modules.GLEBIA) {
      const glebia = state.modules.GLEBIA;

      setStatus('.glebia_code .glebia_status', glebia.code);
      setStatus('.glebia_konto .glebia_status', glebia.kontoTP);

      // Speed
      if (glebia.speed) {
        $('#glebia_Panel input[name=glebia_speed]').val(glebia.speed);
      }
    }

    // ========================
    // Spawner checkboxes (GAME.spawner[1])
    // ========================
    if (state.extra && state.extra.spawnerIgnore) {
      const ignore = state.extra.spawnerIgnore;
      $('#kws_spawn input[name="ignoreMobs"]').each((index, el) => {
        $(el).prop('checked', ignore[index] === 1);
      });
    }

    console.log('[AFO_STATE_MANAGER] UI sync complete');
  },

  /**
   * Start modules that were active when state was saved
   */
  startActiveModules(state) {
    if (!state || !state.modules) return;

    // First, make sure AFO is loaded
    this.ensureAFOLoaded(state);
  },

  /**
   * Load AFO if not loaded, then start modules
   */
  ensureAFOLoaded(state) {
    console.log('[AFO_STATE_MANAGER] ensureAFOLoaded called');

    // Check if AFO is already loaded
    if (typeof AFO !== 'undefined' && AFO.loaded) {
      console.log('[AFO_STATE_MANAGER] AFO already loaded and initialized');
      this._prepareAndStart(state);
      return;
    }

    // Check if AFO exists but not yet fully loaded
    if (typeof AFO !== 'undefined') {
      console.log('[AFO_STATE_MANAGER] AFO exists, waiting for .loaded flag...');
      this._waitForAFOLoaded(state);
      return;
    }

    // Check if kws (Gieniobot) has afo_is_loaded flag - means loading is in progress
    if (typeof kws !== 'undefined' && kws.afo_is_loaded) {
      console.log('[AFO_STATE_MANAGER] AFO loading in progress (kws.afo_is_loaded), waiting...');
      this._waitForAFO(state);
      return;
    }

    // Need to load AFO first
    console.log('[AFO_STATE_MANAGER] Loading AFO...');
    const loadAfoButton = document.querySelector('.qlink.load_afo');
    if (loadAfoButton) {
      loadAfoButton.click();
      this._waitForAFO(state);
    } else {
      console.warn('[AFO_STATE_MANAGER] AFO load button not found!');
      // Try waiting anyway in case AFO loads differently
      this._waitForAFO(state);
    }
  },

  /**
   * Wait for AFO object to exist
   */
  _waitForAFO(state) {
    console.log('[AFO_STATE_MANAGER] Waiting for AFO object...');
    let resolved = false;
    const startTime = Date.now();

    const waitInterval = setInterval(() => {
      if (resolved) return;

      if (typeof AFO !== 'undefined') {
        console.log('[AFO_STATE_MANAGER] AFO object found!');
        resolved = true;
        clearInterval(waitInterval);
        this._waitForAFOLoaded(state);
      } else if (Date.now() - startTime > 30000) {
        console.warn('[AFO_STATE_MANAGER] Timeout waiting for AFO object (30s)');
        resolved = true;
        clearInterval(waitInterval);
      }
    }, 500);
  },

  /**
   * Wait for AFO.loaded flag (full initialization)
   */
  _waitForAFOLoaded(state) {
    console.log('[AFO_STATE_MANAGER] Waiting for AFO.loaded flag...');
    let resolved = false;
    const startTime = Date.now();

    const waitInterval = setInterval(() => {
      if (resolved) return;

      if (typeof AFO !== 'undefined' && AFO.loaded) {
        console.log('[AFO_STATE_MANAGER] AFO fully loaded!');
        resolved = true;
        clearInterval(waitInterval);
        // Give a moment for all handlers to bind
        setTimeout(() => {
          this._prepareAndStart(state);
        }, 500);
      } else if (Date.now() - startTime > 30000) {
        console.warn('[AFO_STATE_MANAGER] Timeout waiting for AFO.loaded (30s)');
        resolved = true;
        clearInterval(waitInterval);
        // Try anyway
        this._prepareAndStart(state);
      }
    }, 500);
  },

  /**
   * Prepare game state and start modules
   */
  _prepareAndStart(state) {
    console.log('[AFO_STATE_MANAGER] Preparing game state...');

    // Switch to map page first (user request)
    if (typeof GAME !== 'undefined' && GAME.page_switch) {
      console.log('[AFO_STATE_MANAGER] Switching to game_map...');
      GAME.page_switch('game_map');
    }

    // Wait 1s then start modules
    setTimeout(() => {
      this.doStartModules(state);
    }, 1000);
  },

  /**
   * Actually start the modules
   */
  doStartModules(state) {
    console.log('[AFO_STATE_MANAGER] ========== doStartModules ==========');
    console.log('[AFO_STATE_MANAGER] State to restore:', state);

    // Check if panels exist
    console.log('[AFO_STATE_MANAGER] Checking panels:');
    console.log('  - #resp_Panel exists:', $('#resp_Panel').length > 0);
    console.log('  - #pvp_Panel exists:', $('#pvp_Panel').length > 0);
    console.log('  - #lpvm_Panel exists:', $('#lpvm_Panel').length > 0);
    console.log('  - #glebia_Panel exists:', $('#glebia_Panel').length > 0);
    console.log('  - #code_Panel exists:', $('#code_Panel').length > 0);

    // NOW restore state - AFO has created the module objects
    console.log('[AFO_STATE_MANAGER] Calling _doRestore...');
    this._doRestore(state);

    // Verify restoration
    console.log('[AFO_STATE_MANAGER] After restore, checking global objects:');
    console.log('  - PVP.stop:', typeof PVP !== 'undefined' ? PVP.stop : 'PVP undefined');
    console.log('  - PVP.code:', typeof PVP !== 'undefined' ? PVP.code : 'PVP undefined');
    console.log('  - RESP.stop:', typeof RESP !== 'undefined' ? RESP.stop : 'RESP undefined');

    // Sync UI now that both AFO panels exist AND state is restored
    console.log('[AFO_STATE_MANAGER] Calling syncUI...');
    this.syncUI(state);

    // Use setTimeout to ensure UI is ready
    console.log('[AFO_STATE_MANAGER] Scheduling module starts in 500ms...');
    setTimeout(() => {
      console.log('[AFO_STATE_MANAGER] Starting module activation...');

      // PVM/RESP - need to set stop=true BEFORE click so handler can turn it ON
      if (state.modules.RESP && !state.modules.RESP.stop) {
        console.log('[AFO_STATE_MANAGER] Starting RESP...');
        if (typeof RESP !== 'undefined') {
          RESP.stop = true; // Handler checks if(stop) to turn ON
        }
        $('#resp_Panel .resp_resp').click();
        // Show the panel and update the main panel button
        $('#resp_Panel').show();
        $('.gh_resp .gh_status').removeClass('red').addClass('green').html('On');
        console.log('[AFO_STATE_MANAGER] RESP started and panel shown');
      } else {
        console.log('[AFO_STATE_MANAGER] RESP not started (stop:', state.modules.RESP?.stop, ')');
      }

      // PVP - need to set stop=true BEFORE click so handler can turn it ON
      if (state.modules.PVP && !state.modules.PVP.stop) {
        console.log('[AFO_STATE_MANAGER] Starting PVP...');
        if (typeof PVP !== 'undefined') {
          console.log('[AFO_STATE_MANAGER] Setting PVP.stop = true before click');
          PVP.stop = true; // Handler checks if(stop) to turn ON
        }
        $('#pvp_Panel .pvp_pvp').click();
        // Show the panel and update the main panel button
        $('#pvp_Panel').show();
        $('.gh_pvp .gh_status').removeClass('red').addClass('green').html('On');
        console.log('[AFO_STATE_MANAGER] PVP started and panel shown');
      } else {
        console.log('[AFO_STATE_MANAGER] PVP not started (stop:', state.modules.PVP?.stop, ')');
      }

      // LPVM - need to set Stop=true BEFORE click
      if (state.modules.LPVM && !state.modules.LPVM.Stop) {
        console.log('[AFO_STATE_MANAGER] Starting LPVM...');
        if (typeof LPVM !== 'undefined') {
          LPVM.Stop = true;
        }
        $('#lpvm_Panel .lpvm_lpvm').click();
        // Show the panel and update the main panel button
        $('#lpvm_Panel').show();
        $('.gh_lpvm .gh_status').removeClass('red').addClass('green').html('On');
        console.log('[AFO_STATE_MANAGER] LPVM started and panel shown');
      } else {
        console.log('[AFO_STATE_MANAGER] LPVM not started (Stop:', state.modules.LPVM?.Stop, ')');
      }

      // GLEBIA - need to set stop=true BEFORE click
      if (state.modules.GLEBIA && !state.modules.GLEBIA.stop) {
        console.log('[AFO_STATE_MANAGER] Starting GLEBIA...');
        if (typeof GLEBIA !== 'undefined') {
          GLEBIA.stop = true;
        }
        $('#glebia_Panel .glebia_glebia').click();
        // Show the panel and update the main panel button
        $('#glebia_Panel').show();
        $('.gh_glebia .gh_status').removeClass('red').addClass('green').html('On');
        console.log('[AFO_STATE_MANAGER] GLEBIA started and panel shown');
      }

      // CODE - need to set stop=true BEFORE click
      if (state.modules.CODE && !state.modules.CODE.stop) {
        console.log('[AFO_STATE_MANAGER] Starting CODE...');
        if (typeof CODE !== 'undefined') {
          CODE.stop = true;
        }
        $('#code_Panel .code_code').click();
        // Show the panel and update the main panel button
        $('#code_Panel').show();
        $('.gh_code .gh_status').removeClass('red').addClass('green').html('On');
        console.log('[AFO_STATE_MANAGER] CODE started and panel shown');
      }

      // Activities (arena, expeditions, etc.)
      if (state.activities && state.activities.enabled) {
        console.log('[AFO_STATE_MANAGER] Starting Activities...');
        if (window.AFO_ACTIVITIES_STATE) {
          window.AFO_ACTIVITIES_STATE.shouldAutoStart = true;
        }
      }

      // kws automations (arena, expeditions, abyss) - click buttons to start
      if (state.kws && typeof kws !== 'undefined') {
        // Restore settings first
        if (state.kws.aeCodes && kws.settings) {
          kws.settings.aeCodes = state.kws.aeCodes;
          $('#aeCodes').prop('checked', state.kws.aeCodes);
        }

        // Auto Arena
        if (state.kws.auto_arena) {
          console.log('[AFO_STATE_MANAGER] Starting Auto Arena...');
          setTimeout(() => {
            if (!kws.auto_arena) {
              kws.auto_arena = true;
              kws.manageAutoArena();
              $('.qlink.manage_auto_arena').addClass('kws_active_icon');
            }
          }, 2000);
        }

        // Auto Expeditions
        if (state.kws.autoExpeditions) {
          console.log('[AFO_STATE_MANAGER] Starting Auto Expeditions...');
          setTimeout(() => {
            if (!kws.autoExpeditions) {
              kws.manageAutoExpeditions();
            }
          }, 3000);
        }

        // Auto Abyss - just set the flag, it triggers on button click
        if (state.kws.auto_abyss) {
          console.log('[AFO_STATE_MANAGER] Starting Auto Abyss...');
          setTimeout(() => {
            kws.auto_abyss = true;
            kws.manageAutoAbyss();
            $('.qlink.manage_auto_abyss').addClass('kws_active_icon');
          }, 4000);
        }
      }
    }, 1000);
  },

  // ============================================
  // SAVE / LOAD TO STORAGE
  // ============================================

  /**
   * Save current state to chrome.storage.local
   */
  async save() {
    if (typeof GAME === 'undefined' || !GAME.server || !GAME.char_id) {
      console.warn('[AFO_STATE_MANAGER] GAME not available, cannot save state');
      return false;
    }

    const key = this.getKey(GAME.server, GAME.char_id);
    const state = this.serialize();

    try {
      await AFO_STORAGE.set({ [key]: state });
      console.log(`[AFO_STATE_MANAGER] Saved state for server ${GAME.server}, char ${GAME.char_id}`);
      return true;
    } catch (e) {
      console.error('[AFO_STATE_MANAGER] Save error:', e);
      return false;
    }
  },

  /**
   * Load state from chrome.storage.local
   */
  async load(server, charId) {
    const key = this.getKey(server, charId);

    try {
      const result = await AFO_STORAGE.get(key);
      if (result[key]) {
        return result[key];
      }
      return null;
    } catch (e) {
      console.error('[AFO_STATE_MANAGER] Load error:', e);
      return null;
    }
  },

  /**
   * Load and apply state for current character
   * @param {boolean} startModules - Whether to start active modules
   */
  async loadCurrent(startModules = false) {
    if (typeof GAME === 'undefined' || !GAME.server || !GAME.char_id) {
      console.warn('[AFO_STATE_MANAGER] GAME not available, cannot load state');
      return false;
    }

    const state = await this.load(GAME.server, GAME.char_id);
    if (state) {
      return this.deserialize(state, startModules);
    }
    return false;
  },

  /**
   * Check if state exists for server + character
   */
  async exists(server, charId) {
    const state = await this.load(server, charId);
    return state !== null;
  },

  /**
   * Clear state for specific server + character
   */
  async clear(server, charId) {
    const key = this.getKey(server, charId);

    try {
      await AFO_STORAGE.remove(key);
      console.log(`[AFO_STATE_MANAGER] Cleared state for server ${server}, char ${charId}`);
      return true;
    } catch (e) {
      console.error('[AFO_STATE_MANAGER] Clear error:', e);
      return false;
    }
  },

  /**
   * Clear state for current character
   */
  async clearCurrent() {
    if (typeof GAME === 'undefined' || !GAME.server || !GAME.char_id) {
      return false;
    }
    return await this.clear(GAME.server, GAME.char_id);
  },

  /**
   * Get all saved states (for listing)
   */
  async getAll() {
    try {
      const result = await AFO_STORAGE.get(null);
      const states = [];

      for (const key in result) {
        if (key.startsWith(this.KEY_PREFIX)) {
          const state = result[key];
          states.push({
            key: key,
            server: state.server,
            charId: state.charId,
            savedAt: state.savedAt,
            activeModules: this.getActiveModulesList(state)
          });
        }
      }

      return states;
    } catch (e) {
      console.error('[AFO_STATE_MANAGER] GetAll error:', e);
      return [];
    }
  },

  /**
   * Get list of active modules from state
   */
  getActiveModulesList(state) {
    const active = [];
    if (!state || !state.modules) return active;

    if (state.modules.RESP && !state.modules.RESP.stop) active.push('PVM');
    if (state.modules.PVP && !state.modules.PVP.stop) active.push('PVP');
    if (state.modules.LPVM && !state.modules.LPVM.Stop) active.push('LPVM');
    if (state.modules.GLEBIA && !state.modules.GLEBIA.stop) active.push('GŁĘBIA');
    if (state.modules.CODE && !state.modules.CODE.stop) active.push('KODY');
    if (state.activities && state.activities.enabled) active.push('Activities');

    // kws automations
    if (state.kws) {
      if (state.kws.auto_arena) active.push('Arena');
      if (state.kws.autoExpeditions) active.push('Expeditions');
      if (state.kws.auto_abyss) active.push('Otchłań');
    }

    return active;
  },

  // ============================================
  // UTILITY
  // ============================================

  /**
   * Get human-readable summary of current state
   */
  getSummary() {
    const state = this.serialize();
    const active = this.getActiveModulesList(state);

    return {
      server: state.server,
      charId: state.charId,
      activeModules: active,
      hasAnyActive: active.length > 0
    };
  }
};

// Export
window.AFO_STATE_MANAGER = AFO_STATE_MANAGER;
console.log('[AFO] State Manager module loaded');
