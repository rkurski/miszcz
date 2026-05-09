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
   * Generate storage key for server (one state per server)
   * charId parameter kept for backward compatibility but ignored in key
   */
  getKey(server, charId) {
    return `${this.KEY_PREFIX}s${server}`;
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

    // Save Kukla Guardian state (Strażnik Kukli)
    if (typeof KUKLA_GUARDIAN !== 'undefined') {
      state.kuklaGuardian = {
        enabled: KUKLA_GUARDIAN.enabled || false
      };
    }

    // Save Clan Assist state (Automatyczne Asysty)
    if (typeof CLAN_ASSIST !== 'undefined') {
      state.clanAssist = {
        enabled: CLAN_ASSIST.enabled !== false
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

    // Helper: set status span to On/Off with correct class
    const setStatus = (selector, isOn) => {
      const el = $(selector);
      if (el.length) {
        el.removeClass('red green').addClass(isOn ? 'green' : 'red').html(isOn ? 'On' : 'Off');
      }
    };

    // Helper: set status span to custom text with green class
    const setStatusText = (selector, text) => {
      const el = $(selector);
      if (el.length) {
        el.removeClass('red').addClass('green').html(text);
      }
    };

    // ========================
    // RESP (PVM) UI
    // Selectors from: remote/afo/respawn.js:384-550
    // ========================
    if (state.modules.RESP) {
      const resp = state.modules.RESP;

      // Toggle statuses
      setStatus('.resp_bless .resp_status', resp.bless);
      setStatus('.resp_code .resp_status', resp.code);
      setStatus('.resp_konto .resp_status', resp.kontoTP);
      setStatus('.resp_multi .resp_status', resp.multifight);
      setStatus('.resp_buff_imp .resp_status', resp.buff_imp);
      setStatus('.resp_buff_clan .resp_status', resp.buff_clan);

      // .resp_sub controls checkOST (NOT checkSSJ!)
      // See respawn.js:461-471
      setStatus('.resp_sub .resp_status', resp.checkOST);

      // .resp_ssj controls checkSSJ (separate toggle)
      // See respawn.js:491-494
      setStatus('.resp_ssj .resp_status', resp.checkSSJ);

      // Bless buffs b1-b18: show/hide based on bless state
      if (resp.bless) {
        for (let i = 1; i <= 18; i++) $(`#resp_Panel .resp_bh${i}`).show();
        $('#resp_Panel .resp_on, #resp_Panel .resp_off').show();
      } else {
        for (let i = 1; i <= 18; i++) $(`#resp_Panel .resp_bh${i}`).hide();
        $('#resp_Panel .resp_on, #resp_Panel .resp_off').hide();
      }

      // Buff statuses b1-b18 (set regardless of visibility)
      for (let i = 1; i <= 18; i++) {
        if (resp[`b${i}`] !== undefined) {
          setStatus(`.resp_bh${i} .resp_status`, resp[`b${i}`]);
        }
      }

      // Code -> konto visibility
      if (resp.code) {
        $('#resp_Panel .resp_konto').show();
      } else {
        $('#resp_Panel .resp_konto').hide();
      }

      // checkOST -> .resp_ost visibility; OST/x20 text (not On/Off!)
      // See respawn.js:474-481 - uses .html("Ost") / .html("x20")
      if (resp.checkOST) {
        $('#resp_Panel .resp_ost').show();
        const jakaText = resp.jaka === 0 ? 'Ost' : 'x20';
        setStatusText('.resp_ost .resp_status', jakaText);
      } else {
        $('#resp_Panel .resp_ost').hide();
      }

      // Senzu: CONF_SENZU = false (off) or string like 'SENZU_RED'
      // See respawn.js:496-511
      const senzuTypes = ['red', 'blue', 'green', 'purple', 'yellow', 'magic', 'dark'];
      if (resp.CONF_SENZU && resp.CONF_SENZU !== false) {
        const activeType = resp.CONF_SENZU.replace('SENZU_', '').toLowerCase();
        senzuTypes.forEach(t => {
          if (t === activeType) {
            $(`#resp_Panel .resp_${t}`).show();
            setStatus(`.resp_${t} .resp_status`, true);
          } else {
            $(`#resp_Panel .resp_${t}`).hide();
          }
        });
      } else {
        senzuTypes.forEach(t => {
          $(`#resp_Panel .resp_${t}`).show();
          setStatus(`.resp_${t} .resp_status`, false);
        });
      }
    }

    // ========================
    // PVP UI
    // Selectors from: remote/afo/pvp.js:486-581
    // ========================
    if (state.modules.PVP) {
      const pvp = state.modules.PVP;

      setStatus('.pvp_Code .pvp_status', pvp.code);
      setStatus('.pvpCODE_konto .pvp_status', pvp.kontoTP);
      setStatus('.pvp_WI .pvp_status', pvp.autoWars);
      setStatus('.pvp_WK .pvp_status', pvp.autoClanWars);
      setStatus('.pvp_rb_avoid .pvp_status', pvp.higherRebornAvoid);
      setStatus('.pvp_buff_imp .pvp_status', pvp.buff_imp);
      setStatus('.pvp_buff_clan .pvp_status', pvp.buff_clan);

      // Code -> konto visibility
      if (pvp.code) {
        $('#pvp_Panel .pvpCODE_konto').show();
      } else {
        $('#pvp_Panel .pvpCODE_konto').hide();
      }

      // Speed input
      if (pvp.speed !== undefined) {
        $('#pvp_Panel input[name=speed_capt]').val(pvp.speed);
      }
    }

    // ========================
    // CODE UI
    // Selectors from: remote/afo/codes.js:165-218
    // Note: bless toggles are .code_bh1, .code_bh2 (NOT .code_b1, .code_b2!)
    // ========================
    if (state.modules.CODE) {
      const code = state.modules.CODE;

      setStatus('.code_acc .code_status', code.acc);
      setStatus('.code_zast .code_status', code.zast);
      setStatus('.code_ssj .code_status', code.checkSSJ);
      setStatus('.code_bh1 .code_status', code.b1);
      setStatus('.code_bh2 .code_status', code.b2);

      // Training selects
      if (code.what_to_train !== undefined) {
        $('#bot_what_to_train').val(code.what_to_train);
      }
      if (code.what_to_traintime !== undefined) {
        $('#bot_what_to_traintime').val(code.what_to_traintime);
      }
    }

    // ========================
    // LPVM UI
    // Selectors from: remote/afo/pvm.js:237-292
    // ========================
    if (state.modules.LPVM) {
      const lpvm = state.modules.LPVM;

      // Born level buttons: show only selected, hide others
      // Born values: g=2, u=3, s=4, h=5, m=6
      const bornMap = { 2: 'g', 3: 'u', 4: 's', 5: 'h', 6: 'm' };
      const allBornKeys = ['g', 'u', 's', 'h', 'm'];

      if (lpvm.Born !== undefined && bornMap[lpvm.Born]) {
        const activeKey = bornMap[lpvm.Born];
        allBornKeys.forEach(k => {
          if (k === activeKey) {
            $(`#lpvm_Panel .lpvm_${k}`).show();
            setStatus(`.lpvm_${k} .lpvm_status`, true);
          } else {
            $(`#lpvm_Panel .lpvm_${k}`).hide();
          }
        });
      }

      // Limit toggle
      if (lpvm.limit !== undefined) {
        setStatus('.lpvm_limit .lpvm_status', lpvm.limit);
      }

      // Limit2 value input
      if (lpvm.limit2 !== undefined) {
        $('#lpvm_Panel input[name=lpvm_capt]').val(lpvm.limit2);
      }

      // pvm_killed counter
      if (lpvm.pvm_killed !== undefined) {
        $('#lpvm_Panel .pvm_killed b').text(lpvm.pvm_killed);
        if (typeof LPVM !== 'undefined') {
          LPVM.pvm_killed = lpvm.pvm_killed;
        }
      }
    }

    // ========================
    // GLEBIA UI
    // Selectors from: remote/afo/glebia.js:60-132
    // Note: main toggle is .glebia_toggle (NOT .glebia_glebia!)
    // ========================
    if (state.modules.GLEBIA) {
      const glebia = state.modules.GLEBIA;

      setStatus('.glebia_code .glebia_status', glebia.code);
      setStatus('.glebia_konto .glebia_status', glebia.kontoTP);

      // Code -> konto visibility
      if (glebia.code) {
        $('#glebia_Panel .glebia_konto').show();
      } else {
        $('#glebia_Panel .glebia_konto').hide();
      }

      // Speed input
      if (glebia.speed !== undefined) {
        $('#glebia_Panel input[name=glebia_speed]').val(glebia.speed);
      }
    }

    // ========================
    // RES (Zbierajka) UI
    // Selectors from: remote/afo/resources.js:284-300
    // No UI inputs to sync - speed/loc are set programmatically
    // ========================

    // ========================
    // Spawner checkboxes (GAME.spawner[1])
    // ========================
    if (state.extra && state.extra.spawnerIgnore && Array.isArray(state.extra.spawnerIgnore) && state.extra.spawnerIgnore.length === 6) {
      const ignore = state.extra.spawnerIgnore;
      // Use rank index from value attribute, not DOM position
      $('.kws_spawner_check').each((_, el) => {
        const rankIndex = parseInt(el.value, 10);
        if (rankIndex >= 0 && rankIndex < 6) {
          $(el).prop('checked', ignore[rankIndex] === 1);
        }
      });
      // Sync GAME.spawner[1] for consistency
      if (GAME.spawner) {
        GAME.spawner[1] = [...ignore];
      }
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

    // Kick off safe start for each AFO module. These are async and wait
    // (without timeout) for game-ready + handler-bound + module-specific
    // prerequisites. Healthchecks self-heal if a module fails to start.
    console.log('[AFO_STATE_MANAGER] Scheduling module starts in 500ms...');
    setTimeout(() => {
      console.log('[AFO_STATE_MANAGER] Starting module activation (safe-start, polled wait)...');

      // Order matches old behavior so that competitor stops cascade correctly.
      // Each call is fire-and-forget; the module-specific click handler stops
      // its competitors via existing logic in pvp.js / respawn.js / etc.
      this.startAfoModuleSafely('RESP', state);
      this.startAfoModuleSafely('PVP', state);
      this.startAfoModuleSafely('LPVM', state);
      this.startAfoModuleSafely('GLEBIA', state);
      this.startAfoModuleSafely('CODE', state);
      this.startAfoModuleSafely('RES', state);

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

      // ============================================
      // REINIT MODULES (reconnect-safe: restart dependency checks)
      // ============================================
      if (typeof CAMP_STATS !== 'undefined' && CAMP_STATS.reinit) {
        console.log('[AFO_STATE_MANAGER] Calling CAMP_STATS.reinit()');
        CAMP_STATS.reinit();
      }
      if (typeof TRADER_AUTO !== 'undefined' && TRADER_AUTO.reinit) {
        console.log('[AFO_STATE_MANAGER] Calling TRADER_AUTO.reinit()');
        TRADER_AUTO.reinit();
      }

      // Kukla Guardian (Strażnik Kukli)
      if (typeof KUKLA_GUARDIAN !== 'undefined' && KUKLA_GUARDIAN.reinit) {
        console.log('[AFO_STATE_MANAGER] Calling KUKLA_GUARDIAN.reinit()');
        KUKLA_GUARDIAN.reinit();
      }
      if (state.kuklaGuardian && state.kuklaGuardian.enabled && typeof KUKLA_GUARDIAN !== 'undefined') {
        console.log('[AFO_STATE_MANAGER] Starting Kukla Guardian...');
        // Set enabled immediately so parseQuickOpts renders with active class
        KUKLA_GUARDIAN.enabled = true;
        KUKLA_GUARDIAN._stateRestored = true;
        setTimeout(() => {
          if (!KUKLA_GUARDIAN.running) {
            KUKLA_GUARDIAN.start();
          }
          // Ensure icon has active class after any re-render
          $('.qlink.manage_kukla_guardian').addClass('kws_active_icon');
        }, 4500);
      }

      // Clan Assist (Automatyczne Asysty)
      if (typeof CLAN_ASSIST !== 'undefined' && CLAN_ASSIST.reinit) {
        console.log('[AFO_STATE_MANAGER] Calling CLAN_ASSIST.reinit()');
        CLAN_ASSIST.reinit();
      }
      if (state.clanAssist && state.clanAssist.enabled && typeof CLAN_ASSIST !== 'undefined') {
        console.log('[AFO_STATE_MANAGER] Starting Clan Assist...');
        // Set enabled immediately so parseQuickOpts renders with active class
        CLAN_ASSIST.enabled = true;
        setTimeout(() => {
          if (!CLAN_ASSIST.running) {
            CLAN_ASSIST.start();
          }
          // Ensure icon has active class after any re-render
          $('.qlink.manage_auto_clanAssist').addClass('kws_active_icon');
        }, 5000);
      }

      // Show toast after all modules have been started (longest delay is 5s for clan assist)
      setTimeout(() => {
        console.log('[AFO_STATE_MANAGER] ✅ All modules started, restore complete!');
        if (typeof AFO_RECONNECT_UI !== 'undefined') {
          AFO_RECONNECT_UI.showToast('Stan przywrócony!', 'success');
          AFO_RECONNECT_UI.updateStatusFromStorage();
        }
      }, 5500);
    }, 1000);
  },

  // ============================================
  // MODULE STARTUP HELPERS (post-reconnect)
  // Robust restart of AFO modules after server restart / reconnect.
  // Waits indefinitely until game is fully ready, then triggers click,
  // verifies, and self-heals via periodic healthcheck.
  // ============================================

  /**
   * Per-module config for safe restart.
   * Each entry describes: how to find module obj, how to check stop flag,
   * panel selectors, prerequisite for click handler to take effect (e.g. RESP
   * needs GAME.field_mobs, RES needs map_mines.mine_data).
   */
  AFO_MODULE_CONFIGS: {
    RESP: {
      stateKey: 'RESP',
      panelClickSel: '#resp_Panel .resp_resp',
      panelId: '#resp_Panel',
      ghStatusSel: '.gh_resp .gh_status',
      stopProp: 'stop',
      getMod: () => typeof RESP !== 'undefined' ? RESP : null,
      isInactiveInState: (s) => !s.modules.RESP || s.modules.RESP.stop,
      // RESP click handler requires GAME.field_mobs to turn on
      prerequisite: () => typeof GAME !== 'undefined' && !!GAME.field_mobs,
      isRunning: () => typeof RESP !== 'undefined' && RESP.stop === false
    },
    PVP: {
      stateKey: 'PVP',
      panelClickSel: '#pvp_Panel .pvp_pvp',
      panelId: '#pvp_Panel',
      ghStatusSel: '.gh_pvp .gh_status',
      stopProp: 'stop',
      getMod: () => typeof PVP !== 'undefined' ? PVP : null,
      isInactiveInState: (s) => !s.modules.PVP || s.modules.PVP.stop,
      prerequisite: () => true,
      isRunning: () => typeof PVP !== 'undefined' && PVP.stop === false
    },
    LPVM: {
      stateKey: 'LPVM',
      panelClickSel: '#lpvm_Panel .lpvm_lpvm',
      panelId: '#lpvm_Panel',
      ghStatusSel: '.gh_lpvm .gh_status',
      stopProp: 'Stop',
      getMod: () => typeof LPVM !== 'undefined' ? LPVM : null,
      isInactiveInState: (s) => !s.modules.LPVM || s.modules.LPVM.Stop,
      prerequisite: () => true,
      isRunning: () => typeof LPVM !== 'undefined' && LPVM.Stop === false
    },
    GLEBIA: {
      stateKey: 'GLEBIA',
      panelClickSel: '#glebia_Panel .glebia_toggle',
      panelId: '#glebia_Panel',
      ghStatusSel: '.gh_glebia .gh_status',
      stopProp: 'stop',
      getMod: () => typeof GLEBIA !== 'undefined' ? GLEBIA : null,
      isInactiveInState: (s) => !s.modules.GLEBIA || s.modules.GLEBIA.stop,
      prerequisite: () => true,
      isRunning: () => typeof GLEBIA !== 'undefined' && GLEBIA.stop === false
    },
    CODE: {
      stateKey: 'CODE',
      panelClickSel: '#code_Panel .code_code',
      panelId: '#code_Panel',
      ghStatusSel: '.gh_code .gh_status',
      stopProp: 'stop',
      getMod: () => typeof CODE !== 'undefined' ? CODE : null,
      isInactiveInState: (s) => !s.modules.CODE || s.modules.CODE.stop,
      prerequisite: () => true,
      isRunning: () => typeof CODE !== 'undefined' && CODE.stop === false
    },
    RES: {
      stateKey: 'RES',
      panelClickSel: '#res_Panel .res_res',
      panelId: '#res_Panel',
      ghStatusSel: '.gh_res .gh_status',
      stopProp: 'stop',
      getMod: () => typeof RES !== 'undefined' ? RES : null,
      isInactiveInState: (s) => !s.modules.RES || s.modules.RES.stop,
      // RES click handler requires GAME.map_mines.mine_data to be non-empty
      prerequisite: () => typeof GAME !== 'undefined' && GAME.map_mines && GAME.map_mines.mine_data && Object.keys(GAME.map_mines.mine_data).length > 0,
      isRunning: () => typeof RES !== 'undefined' && RES.stop === false
    }
  },

  /**
   * Poll until predicate returns true. NEVER times out — restore must
   * eventually happen even if it takes hours (server outage, no internet, etc).
   * Logs progress every 30s so console shows it's still alive.
   * @param {Function} predicate Returns true when ready
   * @param {string} label Used for periodic progress logs
   * @param {number} interval Polling interval in ms (default 500)
   * @returns {Promise<void>}
   */
  _waitUntil(predicate, label, interval = 500) {
    return new Promise((resolve) => {
      const startedAt = Date.now();
      let lastLogAt = startedAt;
      const tick = () => {
        try {
          if (predicate()) {
            const waited = Date.now() - startedAt;
            if (waited > 2000) {
              console.log(`[AFO_STATE_MANAGER:wait] ${label} ready after ${Math.round(waited / 1000)}s`);
            }
            resolve();
            return;
          }
        } catch (e) {
          // predicate threw — keep waiting; log once
          console.warn(`[AFO_STATE_MANAGER:wait] ${label} predicate threw:`, e?.message || e);
        }
        const now = Date.now();
        if (now - lastLogAt >= 30000) {
          console.log(`[AFO_STATE_MANAGER:wait] still waiting for ${label} (${Math.round((now - startedAt) / 1000)}s)...`);
          lastLogAt = now;
        }
        setTimeout(tick, interval);
      };
      tick();
    });
  },

  /**
   * Wait until the game engine is fully ready for module actions.
   * Required after server restart / reconnect because GAME.is_loading,
   * GAME.char_data, socket sync may take seconds-to-minutes.
   */
  _waitForGameReady() {
    return this._waitUntil(() => {
      return typeof GAME !== 'undefined'
        && GAME.is_loading === false
        && GAME.char_data
        && typeof GAME.char_data.x === 'number'
        && GAME.socket
        && GAME.socket.connected !== false   // socket.io: true OR undefined when ok
        && typeof AFO !== 'undefined'
        && AFO.loaded === true;
    }, 'GAME ready');
  },

  /**
   * Wait until jQuery click handler is bound to the panel selector.
   */
  _waitForHandlerBound(selector) {
    return this._waitUntil(() => {
      const $el = $(selector);
      if (!$el.length) return false;
      const events = $._data($el[0], 'events');
      return !!(events && events.click && events.click.length);
    }, `handler ${selector}`);
  },

  /**
   * Safely (re)start an AFO module after reconnect.
   * Waits for game ready, handler bound, prerequisites met.
   * Sets stop=true (so click handler turns it ON), clicks the panel, then
   * verifies via isRunning(). Schedules a healthcheck 5s later that re-tries
   * indefinitely if module didn't actually start. Idempotent — if user already
   * turned the module on manually, just skips.
   *
   * @param {string} name e.g. 'PVP', 'RESP', etc. (key into AFO_MODULE_CONFIGS)
   * @param {object} state Saved state from storage
   */
  async startAfoModuleSafely(name, state) {
    const cfg = this.AFO_MODULE_CONFIGS[name];
    if (!cfg) {
      console.warn(`[AFO_STATE_MANAGER:start:${name}] no config`);
      return;
    }
    const log = (...args) => console.log(`[AFO_STATE_MANAGER:start:${name}]`, ...args);
    const warn = (...args) => console.warn(`[AFO_STATE_MANAGER:start:${name}]`, ...args);

    if (cfg.isInactiveInState(state)) {
      log(`module not active in saved state, skipping`);
      return;
    }

    log('beginning safe start');

    // 1) Wait for game ready
    await this._waitForGameReady();
    log('game is ready');

    // 2) Wait for handler bound
    await this._waitForHandlerBound(cfg.panelClickSel);
    log(`handler bound on ${cfg.panelClickSel}`);

    // 3) Wait for module-specific prerequisite (e.g. GAME.field_mobs for RESP)
    if (cfg.prerequisite) {
      await this._waitUntil(cfg.prerequisite, `${name} prerequisite`);
      log('prerequisite satisfied');
    }

    // 4) Idempotent: if module is already running (user clicked it manually
    //    while we were waiting), skip.
    if (cfg.isRunning()) {
      log('already running, skipping click');
      this._scheduleHealthcheck(name, state);
      return;
    }

    // 5) Set stop=true so click handler will toggle to ON
    const mod = cfg.getMod();
    if (mod) {
      mod[cfg.stopProp] = true;
    }

    // 6) Click and force panel visible + status updated
    log(`clicking ${cfg.panelClickSel}`);
    $(cfg.panelClickSel).click();
    $(cfg.panelId).show();
    $(cfg.ghStatusSel).removeClass('red').addClass('green').html('On');

    // 7) Verify after a short tick (click handler may bail if its own
    //    prerequisite check fails, e.g. RESP needs GAME.field_mobs again).
    setTimeout(() => {
      if (cfg.isRunning()) {
        log('confirmed running');
      } else {
        warn('NOT running 200ms after click — healthcheck will retry');
      }
      this._scheduleHealthcheck(name, state);
    }, 200);
  },

  /**
   * Periodically check that the module is still running. If not, re-trigger
   * startAfoModuleSafely. Runs forever (cleared on user-initiated stop via
   * canceling on healthcheck if module is missing from state).
   */
  _scheduleHealthcheck(name, state) {
    const cfg = this.AFO_MODULE_CONFIGS[name];
    if (!cfg) return;
    // dedupe: avoid stacking healthchecks for the same module
    if (!this._healthcheckTimers) this._healthcheckTimers = {};
    if (this._healthcheckTimers[name]) clearTimeout(this._healthcheckTimers[name]);

    const tick = () => {
      // Stop healthchecking if state no longer marks module active (user toggled state).
      if (cfg.isInactiveInState(state)) return;
      if (!cfg.isRunning()) {
        console.warn(`[AFO_STATE_MANAGER:healthcheck:${name}] module not running, retrying start`);
        // Fire and forget — startAfoModuleSafely will reschedule healthcheck.
        this.startAfoModuleSafely(name, state);
        return;
      }
      this._healthcheckTimers[name] = setTimeout(tick, 30000);
    };
    this._healthcheckTimers[name] = setTimeout(tick, 5000);
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
   * Clear all saved states (all servers)
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

      for (const key of keysToRemove) {
        await AFO_STORAGE.remove(key);
      }

      console.log(`[AFO_STATE_MANAGER] Cleared all states (${keysToRemove.length} keys)`);
      return true;
    } catch (e) {
      console.error('[AFO_STATE_MANAGER] ClearAll error:', e);
      return false;
    }
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
    if (state.modules.RES && !state.modules.RES.stop) active.push('ZBIERAJKA');
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
