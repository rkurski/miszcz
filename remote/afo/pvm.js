/**
 * ============================================================================
 * AFO - PVM/Listy Gończe Module
 * ============================================================================
 * 
 * LPVM system - hunting wanted mobs using pathfinding.
 * Uses EasyStar.js for pathfinding.
 * 
 * ============================================================================
 */

const AFO_LPVM = {

  Finder: null,
  tppIntervalId: null,

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    this.loadEasyStar();
    this.bindSocketHandler();
    this.injectTPPDisplay();
    this.startTPPUpdater();
  },

  startTPPUpdater() {
    if (this.tppIntervalId) return;
    this.tppIntervalId = setInterval(() => {
      if (!LPVM.Stop) {
        this.updateTPP();
      }
    }, 5000);
  },

  stopTPPUpdater() {
    if (this.tppIntervalId) {
      clearInterval(this.tppIntervalId);
      this.tppIntervalId = null;
    }
  },

  injectTPPDisplay() {
    if ($('#lpvm_tpp_display').length === 0) {
      $('<div id="lpvm_tpp_display" style="text-align:center; color: var(--afo-accent); font-size: 10px; margin: 5px 0;">PT: <b style="color:white">0</b></div>')
        .insertBefore('.panel-content .pvm_killed');
    }
    this.updateTPP();
  },

  updateTPP() {
    if (GAME && GAME.char_data) {
      $('#lpvm_tpp_display b').text(GAME.char_data.tpp || 0);
    }
  },

  loadEasyStar() {
    let esjs = document.createElement('script');
    esjs.src = 'https://cdn.jsdelivr.net/npm/easystarjs@0.4.3/bin/easystar-0.4.3.min.js';
    esjs.onload = () => {
      this.Finder = new EasyStar.js();
      this.Finder.enableDiagonals();
      this.Finder.setAcceptableTiles([1]);
      LPVM.Finder = this.Finder;
      console.log('[AFO_LPVM] EasyStar loaded');
    };
    document.head.append(esjs);
  },

  bindSocketHandler() {
    if (this._socketBound) return;
    this._socketBound = true;
    GAME.socket.on('gr', (msg) => {
      this.HandleSockets(msg);
    });
  },

  // ============================================
  // MAIN LPVM LOGIC
  // ============================================

  UpdateKilledCounter(num) {
    $("#lpvm_Panel .pvm_killed b").text(num);
  },

  Start() {
    this.LoadPVM();
  },

  CreateMatrix() {
    LPVM.Matrix = [];
    LPVM.Map = GAME.mapcell;

    // Check if mapcell is available
    if (!LPVM.Map) {
      console.warn('[AFO_LPVM] mapcell not available, retrying...');
      setTimeout(() => this.CreateMatrix(), 500);
      return false;
    }

    for (let i = 0; i < parseInt(GAME.map.max_y); i++) {
      LPVM.Matrix[i] = [];
      for (let j = 0; j < parseInt(GAME.map.max_x); j++) {
        let key = (j + 1) + '_' + (i + 1);
        if (LPVM.Map[key] && LPVM.Map[key].m == 1) {
          LPVM.Matrix[i][j] = 1;
        } else {
          LPVM.Matrix[i][j] = 0;
        }
      }
    }
    return true;
  },

  LoadPVM() {
    GAME.socket.emit('ga', { a: 32, type: 0 });
  },

  KillWanted() {
    if (document.getElementById("special_list_con").childElementCount) {
      LPVM.Killed = true;
      GAME.socket.emit('ga', { a: 32, type: 1, wanted_id: LPVM.Born, quick: 1 });
    }
  },

  Collect() {
    GAME.socket.emit('ga', { a: 32, type: 2, wanted: LPVM.Born });
    LPVM.pvm_killed++;
    this.UpdateKilledCounter(LPVM.pvm_killed);

    // Auto-save state after each reward to preserve progress
    if (typeof AFO_STATE_MANAGER !== 'undefined') {
      AFO_STATE_MANAGER.save();
    }
  },

  Teleport() {
    let loc = parseInt($("#wanted_list .green.option").eq(LPVM.Born).attr("data-loc"));
    if ((LPVM.pvm_killed >= parseInt(LPVM.limit2)) && LPVM.limit) {
      $(".lpvm_lpvm .lpvm_status").removeClass("green").addClass("red").html("Off");
      LPVM.Stop = true;
    } else if (GAME.char_data.loc != loc) {
      GAME.socket.emit('ga', { a: 12, type: 18, loc: loc });
    } else {
      this.Go();
    }
  },

  Go() {
    this.CreateMatrix();
    this.Finder.setGrid(LPVM.Matrix);
    this.Finder.findPath(
      GAME.char_data.x - 1,
      GAME.char_data.y - 1,
      parseInt(GAME.map_wanteds.x) - 1,
      parseInt(GAME.map_wanteds.y) - 1,
      (path) => {
        if (path !== null && path.length > 0) {
          LPVM._pathRetries = 0;
          if (path[0].x == GAME.char_data.x - 1 && path[0].y == GAME.char_data.y - 1) {
            path.shift();
          }
          if (path.length > 0) {
            LPVM.Path = path;
            setTimeout(() => this.Move(), LPVM.wait);
          } else {
            // Path empty after shift - already at target, try kill
            setTimeout(() => this.KillWanted(), 500);
          }
        } else {
          LPVM._pathRetries = (LPVM._pathRetries || 0) + 1;
          console.warn('[AFO_LPVM] No path found, attempt', LPVM._pathRetries);

          if (LPVM._pathRetries >= 5) {
            // After 5 failed attempts, force re-teleport to refresh location
            console.warn('[AFO_LPVM] Max retries reached, forcing re-teleport...');
            LPVM._pathRetries = 0;
            let loc = parseInt($("#wanted_list .green.option").eq(LPVM.Born).attr("data-loc"));
            GAME.socket.emit('ga', { a: 12, type: 18, loc: loc });
          } else {
            setTimeout(() => this.Go(), 1500);
          }
        }
      }
    );
    this.Finder.calculate();
  },

  Move() {
    if (LPVM.Stop) return;

    // Safety check for empty path
    if (!LPVM.Path || LPVM.Path.length === 0) {
      console.warn('[AFO_LPVM] Path empty in Move, going to target');
      setTimeout(() => this.KillWanted(), 500);
      return;
    }

    let target = LPVM.Path[0];
    let cx = GAME.char_data.x - 1;
    let cy = GAME.char_data.y - 1;
    let dir = null;

    // Calculate direction
    if (target.x > cx && target.y == cy) dir = 7;      // Right
    else if (target.x < cx && target.y == cy) dir = 8; // Left
    else if (target.x == cx && target.y > cy) dir = 1; // Down
    else if (target.x == cx && target.y < cy) dir = 2; // Up
    else if (target.x > cx && target.y > cy) dir = 3;  // Down-Right
    else if (target.x < cx && target.y < cy) dir = 6;  // Up-Left
    else if (target.x > cx && target.y < cy) dir = 5;  // Up-Right
    else if (target.x < cx && target.y > cy) dir = 4;  // Down-Left
    else {
      this.Go();
      return;
    }

    GAME.socket.emit('ga', { a: 4, dir: dir, vo: GAME.map_options.vo });
  },

  Next() {
    if (LPVM.Path.length - 1 > 0) {
      LPVM.Path.shift();
      setTimeout(() => this.Move(), LPVM.wait);
    } else {
      setTimeout(() => this.KillWanted(), 500);
    }
  },

  HandleSockets(res) {
    if (LPVM.Stop) return;

    if (res.a === 4 && res.char_id === GAME.char_id) {
      this.Next();
    } else if (res.a === 32 && res.e == 0) {
      if ($('button[data-wanted="' + LPVM.Born + '"]').html()) {
        setTimeout(() => GAME.socket.emit('ga', { a: 32, type: 2, wanted: LPVM.Born }), 150);
      } else {
        setTimeout(() => this.Teleport(), 150);
      }
    } else if (LPVM.Killed && res.a === 602 && !res.res.wanted) {
      LPVM.Killed = false;
      setTimeout(() => this.Collect(), 150);
    } else if (res.a === 32 && res.e == 2) {
      setTimeout(() => this.Teleport(), 150);
    } else if (res.a === 12) {
      if ("show_map" in res) {
        if (GAME.char_data.x == GAME.map_wanteds.x && GAME.char_data.y == GAME.map_wanteds.y) {
          setTimeout(() => this.KillWanted(), 500);
        } else {
          setTimeout(() => this.Go(), 1000);
        }
      } else {
        setTimeout(() => GAME.socket.emit('ga', { a: 32, type: 0 }), 100);
      }
    } else if (res.a === undefined) {
      setTimeout(() => this.Go(), 500);
    }
  },

  // ============================================
  // PANEL HANDLERS
  // ============================================

  bindHandlers() {
    // Main LPVM toggle
    $('#lpvm_Panel .lpvm_lpvm').click(() => {
      if (LPVM.Stop) {
        $(".lpvm_lpvm .lpvm_status").removeClass("red").addClass("green").html("On");
        LPVM.Stop = false;
        this.Start();
        // Stop other modules
        RESP.stop = true; RES.stop = true; PVP.stop = true; CODE.stop = true;
        $(".code_code .code_status, .pvp_pvp .pvp_status, .res_res .res_status, .resp_resp .resp_status")
          .removeClass("green").addClass("red").html("Off");
      } else {
        $(".lpvm_lpvm .lpvm_status").removeClass("green").addClass("red").html("Off");
        LPVM.Stop = true;
      }
    });

    // Reset counter
    $('#lpvm_Panel .pvm_killed').click(() => {
      LPVM.pvm_killed = 0;
      this.UpdateKilledCounter(0);
    });

    // Born level selectors
    const bornLevels = { g: 2, u: 3, s: 4, h: 5, m: 6 };
    Object.entries(bornLevels).forEach(([key, value]) => {
      $(`#lpvm_Panel .lpvm_${key}`).click(() => {
        if ($(`.lpvm_${key} .lpvm_status`).hasClass("red")) {
          $(`.lpvm_${key} .lpvm_status`).removeClass("red").addClass("green").html("On");
          LPVM.Born = value;
          // Hide other born options
          Object.keys(bornLevels).filter(k => k !== key).forEach(k => {
            $(`#lpvm_Panel .lpvm_${k}`).hide();
          });
        } else {
          $(`.lpvm_${key} .lpvm_status`).removeClass("green").addClass("red").html("Off");
          Object.keys(bornLevels).forEach(k => $(`#lpvm_Panel .lpvm_${k}`).show());
          $(".lpvm_lpvm .lpvm_status").removeClass("green").addClass("red").html("Off");
          LPVM.Stop = true;
        }
      });
    });

    // Limit toggle
    $('#lpvm_Panel .lpvm_limit').click(() => {
      LPVM.limit = !LPVM.limit;
      $(".lpvm_limit .lpvm_status").toggleClass("green red").html(LPVM.limit ? "On" : "Off");
    });

    // Limit value from input
    $("#lpvm_Panel input[name=lpvm_capt]").on('change', function () {
      LPVM.limit2 = parseInt($(this).val()) || 60;
    });

    console.log('[AFO_LPVM] Handlers bound');
  }
};

// Attach methods for backward compatibility
LPVM.UpdateKilledCounter = (num) => AFO_LPVM.UpdateKilledCounter(num);
LPVM.Start = () => AFO_LPVM.Start();
LPVM.Go = () => AFO_LPVM.Go();

// Export
window.AFO_LPVM = AFO_LPVM;
console.log('[AFO] PVM module loaded');
