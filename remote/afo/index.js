/**
 * ============================================================================
 * AFO - All For One (Main Coordinator)
 * ============================================================================
 * 
 * This is the main entry point for AFO functionality.
 * It loads all submodules and coordinates their interaction.
 * 
 * Modules:
 * - afo/templates.js  - UI templates (CSS/HTML)
 * - afo/state.js      - State objects (PVP, RESP, LPVM, RES, CODE)
 * - afo/pvp.js        - PVP automation logic
 * - afo/respawn.js    - Respawn/PVM automation logic
 * - afo/pvm.js        - LPVM (Listy gończe) logic
 * - afo/resources.js  - Resource mining logic
 * - afo/codes.js      - Codes/training logic
 * - afo/glebia.js     - Głębia (depth dungeon) logic
 * 
 * ============================================================================
 */

const AFO = {
  version: '2.0.0',
  loaded: false,

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    if (this.loaded) {
      console.log('[AFO] Already loaded');
      return;
    }

    console.log('[AFO] Initializing...');

    // Initialize state with current location
    if (typeof initAFOState === 'function') {
      initAFOState();
    }

    // Load item data from items.json (async, fallback to inline data if fails)
    this.loadItemData();

    // Inject templates
    if (typeof AFO_Templates !== 'undefined') {
      AFO_Templates.injectAll();
    }

    // Bind panel handlers
    this.bindPanelHandlers();

    // Setup GAME overrides
    this.setupGameOverrides();

    // Initial data fetch
    this.fetchInitialData();

    this.loaded = true;
    console.log('[AFO] Initialization complete');
  },

  /**
   * Load item data from items.json for RESP module
   */
  loadItemData() {
    const getAFOUrl = (path) => {
      const configEl = document.getElementById('__gieniobot_config__');
      const devMode = typeof GIENIOBOT_DEV_MODE !== 'undefined' && GIENIOBOT_DEV_MODE;
      const localUrl = configEl ? configEl.dataset.extensionUrl : '';
      const githubUrl = 'https://raw.githubusercontent.com/rkurski/miszcz/develop/';
      return (devMode && localUrl) ? localUrl + path : githubUrl + path;
    };

    fetch(getAFOUrl('remote/data/items.json'))
      .then(response => response.json())
      .then(data => {
        if (typeof AFO_RESP !== 'undefined') {
          AFO_RESP.itemData = data;
          console.log('[AFO] Loaded items.json data');
        }
      })
      .catch(err => {
        console.warn('[AFO] Failed to load items.json, using fallback inline data:', err);
      });
  },

  // ============================================
  // PANEL HANDLERS (Main menu toggles)
  // ============================================

  bindPanelHandlers() {
    // Main panel toggles
    $('#main_Panel .gh_pvp').click(() => {
      if ($(".gh_pvp .gh_status").hasClass("red")) {
        $(".gh_pvp .gh_status").removeClass("red").addClass("green").html("On");
        $("#pvp_Panel").show();
      } else {
        $(".gh_pvp .gh_status").removeClass("green").addClass("red").html("Off");
        $("#pvp_Panel").hide();
        $(".pvp_pvp .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.stop = true;
      }
    });

    $('#main_Panel .gh_resp').click(() => {
      if ($(".gh_resp .gh_status").hasClass("red")) {
        $(".gh_resp .gh_status").removeClass("red").addClass("green").html("On");
        $("#resp_Panel").show();
      } else {
        $(".gh_resp .gh_status").removeClass("green").addClass("red").html("Off");
        $("#resp_Panel").hide();
        RESP.stop = true;
        $(".resp_resp .resp_status").removeClass("green").addClass("red").html("Off");
      }
    });

    $('#main_Panel .gh_res').click(() => {
      if ($(".gh_res .gh_status").hasClass("red")) {
        $(".gh_res .gh_status").removeClass("red").addClass("green").html("On");
        $("#res_Panel").show();
      } else {
        $(".gh_res .gh_status").removeClass("green").addClass("red").html("Off");
        $("#res_Panel").hide();
        RES.stop = true;
        $(".res_res .res_status").removeClass("green").addClass("red").html("Off");
      }
    });

    $('#main_Panel .gh_lpvm').click(() => {
      if ($(".gh_lpvm .gh_status").hasClass("red")) {
        $(".gh_lpvm .gh_status").removeClass("red").addClass("green").html("On");
        $("#lpvm_Panel").show();
      } else {
        $(".gh_lpvm .gh_status").removeClass("green").addClass("red").html("Off");
        $("#lpvm_Panel").hide();
        LPVM.Stop = true;
        $(".lpvm_lpvm .lpvm_status").removeClass("green").addClass("red").html("Off");
      }
    });

    $('#main_Panel .gh_code').click(() => {
      if ($(".gh_code .gh_status").hasClass("red")) {
        $(".gh_code .gh_status").removeClass("red").addClass("green").html("On");
        $("#code_Panel").show();
      } else {
        $(".gh_code .gh_status").removeClass("green").addClass("red").html("Off");
        $("#code_Panel").hide();
        CODE.stop = true;
        $(".code_code .code_status").removeClass("green").addClass("red").html("Off");
      }
    });

    $('#main_Panel .gh_low_lvls').click(() => {
      if ($(".gh_low_lvls .gh_status").hasClass("red")) {
        $(".gh_low_lvls .gh_status").removeClass("red").addClass("green").html("On");
        LOWLVL.stop = false;
      } else {
        $(".gh_low_lvls .gh_status").removeClass("green").addClass("red").html("Off");
        LOWLVL.stop = true;
      }
    });

    // GŁĘBIA main button - show/hide submenu
    $('#main_Panel .gh_glebia').click(() => {
      if ($(".gh_glebia .gh_status").hasClass("red")) {
        $(".gh_glebia .gh_status").removeClass("red").addClass("green").html("On");
        $("#glebia_Panel").show();
      } else {
        $(".gh_glebia .gh_status").removeClass("green").addClass("red").html("Off");
        $("#glebia_Panel").hide();
        $(".glebia_toggle .glebia_status").removeClass("green").addClass("red").html("Off");
        if (typeof GLEBIA !== 'undefined') GLEBIA.stop = true;
      }
    });

    // Initialize submodules that need EasyStar
    if (typeof AFO_LPVM !== 'undefined') AFO_LPVM.init();
    if (typeof AFO_RES !== 'undefined') AFO_RES.init();
    if (typeof AFO_BALL_SEARCHER !== 'undefined') AFO_BALL_SEARCHER.init();

    // Bind submodule handlers
    if (typeof AFO_PVP !== 'undefined') AFO_PVP.bindHandlers();
    if (typeof AFO_RESP !== 'undefined') AFO_RESP.bindHandlers();
    if (typeof AFO_LPVM !== 'undefined') AFO_LPVM.bindHandlers();
    if (typeof AFO_RES !== 'undefined') AFO_RES.bindHandlers();
    if (typeof AFO_CODE !== 'undefined') AFO_CODE.bindHandlers();
    if (typeof AFO_GLEBIA !== 'undefined') AFO_GLEBIA.bindHandlers();
    if (typeof AFO_BALL_SEARCHER !== 'undefined') AFO_BALL_SEARCHER.bindHandlers();

    // List mines after delay
    setTimeout(() => {
      if (typeof AFO_RES !== 'undefined' && GAME.maploaded) {
        AFO_RES.listMines();
      }
    }, 500);

    console.log('[AFO] Panel handlers bound');
  },

  // ============================================
  // GAME OVERRIDES
  // ============================================

  setupGameOverrides() {
    // Override emit for optimized loading
    GAME.emit = function (order, data, force) {
      if (!this.is_loading || force) {
        this.load_start();
        this.socket.emit(order, data);
      } else if (this.debug) console.log('failed order', order, data);
    };

    GAME.emitOrder = function (data, force = false) {
      this.emit('ga', data, force);
    };

    GAME.initiate = function () {
      $('#player_login').text(this.login);
      $('#game_win').show();
      if (this.char_id == 0 && this.pid > 0) {
        this.emitOrder({ a: 1 });
      }
      var len = this.servers.length, con = '';
      for (var i = 0; i < len; i++) {
        con += '<option value="' + this.servers[i] + '">' + LNG['server' + this.servers[i]] + '</option>';
      }
      $('#available_servers').html(con);
      $('#available_servers option[value=' + this.server + ']').prop('selected', true);
    };

    // Setup mapcell property for pathfinding (dynamic lookup)
    (function () {
      let cachedKey;
      function findMapcellKey() {
        if (!cachedKey) {
          cachedKey = Object.keys(GAME).find(z => GAME[z] && GAME[z]['1_1']);
        }
        return cachedKey;
      }
      Object.defineProperty(GAME, 'mapcell', {
        get: function () { return GAME[findMapcellKey()]; }
      });
    })();

    // Override player list parsing for low level filter
    if (!GAME.parseListPlayer_o) {
      GAME.parseListPlayer_o = GAME.parseListPlayer;
      GAME.parseListPlayer = function (entry, pvp_master) {
        if (entry && entry.data) {
          let pd = entry.data;
          if (!LOWLVL.stop && (pd.level < GAME.char_data.level)) {
            return '';
          }
        }
        return GAME.parseListPlayer_o(entry, pvp_master);
      };
    }

    if (!GAME.parsePlayerShadow_o) {
      GAME.parsePlayerShadow_o = GAME.parsePlayerShadow;
      GAME.parsePlayerShadow = function (data, pvp_master) {
        if (data && data.pd) {
          let pd = data.pd;
          if (!LOWLVL.stop && (pd.level < GAME.char_data.level)) {
            return '';
          }
        }
        return GAME.parsePlayerShadow_o(data, pvp_master);
      };
    }

    console.log('[AFO] GAME overrides applied');
  },

  // ============================================
  // INITIAL DATA FETCH
  // ============================================

  fetchInitialData() {
    // Fetch empire data
    setTimeout(() => {
      GAME.socket.emit('ga', { a: 50, type: 0, empire: GAME.char_data.empire });
    }, 300);

    // Fetch clan data only if in a clan
    if (GAME.char_data && GAME.char_data.klan_id > 0) {
      setTimeout(() => {
        GAME.emitOrder({ a: 39, type: 0 });
      }, 600);

      setTimeout(() => {
        GAME.emitOrder({ a: 39, type: 23 });
      }, 900);
    }
  },

  // ============================================
  // UTILITY: Stop all modules
  // ============================================

  stopAll() {
    PVP.stop = true;
    RESP.stop = true;
    LPVM.Stop = true;
    RES.stop = true;
    CODE.stop = true;
    if (typeof GLEBIA !== 'undefined') GLEBIA.stop = true;

    $(".pvp_pvp .pvp_status").removeClass("green").addClass("red").html("Off");
    $(".resp_resp .resp_status").removeClass("green").addClass("red").html("Off");
    $(".lpvm_lpvm .lpvm_status").removeClass("green").addClass("red").html("Off");
    $(".res_res .res_status").removeClass("green").addClass("red").html("Off");
    $(".code_code .code_status").removeClass("green").addClass("red").html("Off");
    $(".glebia_toggle .glebia_status").removeClass("green").addClass("red").html("Off");

    console.log('[AFO] All modules stopped');
  }
};

// Export
window.AFO = AFO;
console.log('[AFO] Main module loaded');
