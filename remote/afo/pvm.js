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
    this.loadBlockedTiles();
  },

  // ============================================
  // BLOCKED TILES (sliders / impassable squares)
  // ============================================
  // Server pushes you back if you step on a slider. We detect this by
  // comparing the position we asked for (a:4 dir) against the position
  // the server reports back. Mismatch -> the target tile is unwalkable.
  // Persisted globally so other characters/sessions reuse the knowledge.

  STORAGE_KEY: 'lpvm_blocked_tiles',

  async loadBlockedTiles() {
    try {
      const data = await AFO_STORAGE.get(this.STORAGE_KEY);
      LPVM.blockedTiles = data[this.STORAGE_KEY] || {};
      const count = Object.values(LPVM.blockedTiles).reduce((s, m) => s + Object.keys(m).length, 0);
      console.log('[AFO_LPVM] Loaded blocked tiles:', count, 'across', Object.keys(LPVM.blockedTiles).length, 'maps');
    } catch (e) {
      console.warn('[AFO_LPVM] Failed to load blocked tiles:', e);
      LPVM.blockedTiles = {};
    }
  },

  saveBlockedTiles() {
    AFO_STORAGE.set({ [this.STORAGE_KEY]: LPVM.blockedTiles })
      .catch(e => console.warn('[AFO_LPVM] Failed to persist blocked tiles:', e));
  },

  markBlocked(mapId, x, y, toX, toY) {
    if (!mapId) return;
    if (!LPVM.blockedTiles[mapId]) LPVM.blockedTiles[mapId] = {};
    const key = x + '_' + y;
    if (LPVM.blockedTiles[mapId][key]) return; // already known
    LPVM.blockedTiles[mapId][key] = { to: { x: toX, y: toY } };
    console.log('[AFO_LPVM] Learned blocker on map', mapId, 'at', key, '-> pushes to', toX + '_' + toY);
    this.saveBlockedTiles();
  },

  // ============================================
  // WATCHDOG + BORN DEGRADATION
  // ============================================
  // If 90s pass without a kill, drop to the next Born tier (M->H->S->U->G).
  // Same trigger on error34 (can't reach target loc). No auto-restore; the
  // UI is updated to mirror manual Born selection so the user sees the state.

  BORN_KEYS: { 2: 'g', 3: 'u', 4: 's', 5: 'h', 6: 'm' },
  STUCK_TIMEOUT_MS: 20000,

  startWatchdog() {
    LPVM._lastKilledAt = Date.now();
    LPVM._lastKilledCount = LPVM.pvm_killed;
    if (this._watchdogId) return;
    this._watchdogId = setInterval(() => {
      if (LPVM.Stop) return;
      if (LPVM.pvm_killed !== LPVM._lastKilledCount) {
        LPVM._lastKilledCount = LPVM.pvm_killed;
        LPVM._lastKilledAt = Date.now();
        return;
      }
      if (Date.now() - LPVM._lastKilledAt > this.STUCK_TIMEOUT_MS) {
        console.warn('[AFO_LPVM] Stuck for', this.STUCK_TIMEOUT_MS / 1000, 's at Born', LPVM.Born, '— degrading');
        LPVM._lastKilledAt = Date.now(); // reset so we don't fire every tick
        this.degradeBorn();
      }
    }, 5000);
  },

  stopWatchdog() {
    if (this._watchdogId) {
      clearInterval(this._watchdogId);
      this._watchdogId = null;
    }
  },

  setBornUI(born) {
    const map = this.BORN_KEYS;
    Object.entries(map).forEach(([val, key]) => {
      const $row = $('#lpvm_Panel .lpvm_' + key);
      const $status = $row.find('.lpvm_status');
      if (parseInt(val) === born) {
        $row.show();
        $status.removeClass('red').addClass('green').html('On');
      } else {
        $row.hide();
        $status.removeClass('green').addClass('red').html('Off');
      }
    });
  },

  degradeBorn() {
    const next = LPVM.Born - 1;
    if (!this.BORN_KEYS[next]) {
      console.warn('[AFO_LPVM] Cannot degrade below G-Born, stopping module');
      LPVM.Stop = true;
      $('.lpvm_lpvm .lpvm_status').removeClass('green').addClass('red').html('Off');
      // Restore visible Born options for manual reselection.
      Object.values(this.BORN_KEYS).forEach(k => $('#lpvm_Panel .lpvm_' + k).show());
      this.stopWatchdog();
      return;
    }
    LPVM.Born = next;
    this.setBornUI(next);
    console.log('[AFO_LPVM] Degraded to Born', next, '(' + this.BORN_KEYS[next].toUpperCase() + ')');
    // Clear stale state and re-enter the loop with fresh list.
    LPVM.Plan = null;
    LPVM.Path = [];
    LPVM._expected = null;
    LPVM._teleporting = false;
    LPVM._pathRetries = 0;
    LPVM._lastKilledCount = LPVM.pvm_killed;
    LPVM._lastKilledAt = Date.now();
    setTimeout(() => this.LoadPVM(), 250);
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
    LPVM._expected = null;
    LPVM._teleporting = false;
    LPVM.Plan = null;
    this.startWatchdog();
    // Throttled diagnostic logs — only first 5 calls per ON, set in bindHandlers.
    if (LPVM._startCallCount === undefined) LPVM._startCallCount = 0;
    LPVM._startCallCount++;
    if (LPVM._startCallCount <= 5) {
      console.log('[AFO_LPVM:Start]', {
        call: LPVM._startCallCount,
        Stop: LPVM.Stop,
        is_loading: GAME.is_loading,
        x: GAME.char_data?.x, y: GAME.char_data?.y,
        socket_connected: GAME.socket?.connected
      });
    }
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

    const mapId = GAME.char_data.loc;
    const blocked = (LPVM.blockedTiles && LPVM.blockedTiles[mapId]) || {};

    for (let i = 0; i < parseInt(GAME.map.max_y); i++) {
      LPVM.Matrix[i] = [];
      for (let j = 0; j < parseInt(GAME.map.max_x); j++) {
        let key = (j + 1) + '_' + (i + 1);
        if (LPVM.Map[key] && LPVM.Map[key].m == 1 && !blocked[key]) {
          LPVM.Matrix[i][j] = 1;
        } else {
          LPVM.Matrix[i][j] = 0;
        }
      }
    }
    return true;
  },

  LoadPVM() {
    GAME.emitOrder( { a: 32, type: 0 });
  },

  KillWanted() {
    if (document.getElementById("special_list_con").childElementCount) {
      LPVM.Killed = true;
      GAME.emitOrder( { a: 32, type: 1, wanted_id: LPVM.Born, quick: 1 });
    }
  },

  Collect() {
    GAME.emitOrder( { a: 32, type: 2, wanted: LPVM.Born });
    LPVM.pvm_killed++;
    this.UpdateKilledCounter(LPVM.pvm_killed);

    // Auto-save state after each reward to preserve progress
    if (typeof AFO_STATE_MANAGER !== 'undefined') {
      AFO_STATE_MANAGER.save();
    }
  },

  Teleport() {
    LPVM._expected = null;
    LPVM._teleporting = false;
    LPVM.Plan = null;
    let loc = parseInt($("#wanted_list .green.option").eq(LPVM.Born).attr("data-loc"));
    if ((LPVM.pvm_killed >= parseInt(LPVM.limit2)) && LPVM.limit) {
      $(".lpvm_lpvm .lpvm_status").removeClass("green").addClass("red").html("Off");
      LPVM.Stop = true;
    } else if (GAME.char_data.loc != loc) {
      GAME.emitOrder( { a: 12, type: 18, loc: loc });
    } else {
      this.Go();
    }
  },

  // Promise wrapper around EasyStar.findPath
  findPathPromise(fromX, fromY, toX, toY) {
    return new Promise((resolve) => {
      this.Finder.findPath(fromX, fromY, toX, toY, (p) => resolve(p));
      this.Finder.calculate();
    });
  },

  // Multi-hop pathfinder. Tries direct EasyStar; if blocked, BFS through TPs.
  // Returns { legs: [{walk:[{x,y}...], tpIndex?, tp?}, ...] } or null.
  async findPathWithTPs(startX, startY, goalX, goalY) {
    const direct = await this.findPathPromise(startX, startY, goalX, goalY);
    if (direct && direct.length > 0) {
      return { legs: [{ walk: direct }] };
    }
    const tps = GAME.tps || [];
    if (!tps.length) return null;

    // BFS by leg count
    const queue = [{ x: startX, y: startY, legs: [], used: new Set() }];
    let safety = 64;
    while (queue.length && safety-- > 0) {
      queue.sort((a, b) => a.legs.length - b.legs.length);
      const cur = queue.shift();

      const reach = await this.findPathPromise(cur.x, cur.y, goalX, goalY);
      if (reach && reach.length > 0) {
        return { legs: [...cur.legs, { walk: reach }] };
      }

      for (let i = 0; i < tps.length; i++) {
        if (cur.used.has(i)) continue;
        const tp = tps[i];
        const tpX = tp.x - 1, tpY = tp.y - 1;
        const toTP = await this.findPathPromise(cur.x, cur.y, tpX, tpY);
        if (toTP && toTP.length > 0) {
          const used = new Set(cur.used); used.add(i);
          queue.push({
            x: tp.target_x - 1,
            y: tp.target_y - 1,
            legs: [...cur.legs, { walk: toTP, tpIndex: i, tp }],
            used
          });
        }
      }
    }
    return null;
  },

  async Go() {
    this.CreateMatrix();
    this.Finder.setGrid(LPVM.Matrix);

    const sx = GAME.char_data.x - 1, sy = GAME.char_data.y - 1;
    const gx = parseInt(GAME.map_wanteds.x) - 1, gy = parseInt(GAME.map_wanteds.y) - 1;

    const plan = await this.findPathWithTPs(sx, sy, gx, gy);

    if (plan) {
      LPVM._pathRetries = 0;
      LPVM.Plan = { legs: plan.legs, curLeg: 0 };
      const tpCount = plan.legs.filter(l => l.tpIndex !== undefined).length;
      if (tpCount > 0) console.log('[AFO_LPVM] Plan uses', tpCount, 'TP hop(s)');
      this.startLeg();
      return;
    }

    LPVM._pathRetries = (LPVM._pathRetries || 0) + 1;
    console.warn('[AFO_LPVM] No path found (incl. TPs), attempt', LPVM._pathRetries);

    if (LPVM._pathRetries >= 5) {
      // Stuck on this map / wanted — let watchdog handle it via Born degradation.
      console.warn('[AFO_LPVM] Max retries reached, forcing re-teleport...');
      LPVM._pathRetries = 0;
      const loc = parseInt($("#wanted_list .green.option").eq(LPVM.Born).attr("data-loc"));
      GAME.emitOrder( { a: 12, type: 18, loc: loc });
    } else {
      setTimeout(() => this.Go(), 1500);
    }
  },

  // Set up Path[] for the current leg, dropping leading tile if we're already on it.
  startLeg() {
    const leg = LPVM.Plan?.legs[LPVM.Plan.curLeg];
    if (!leg) return;
    const path = leg.walk.slice();
    const cx = GAME.char_data.x - 1, cy = GAME.char_data.y - 1;
    if (path.length && path[0].x === cx && path[0].y === cy) path.shift();
    LPVM.Path = path;
    if (path.length === 0) {
      // Already at end of this leg
      this.advanceLeg();
    } else {
      setTimeout(() => this.Move(), LPVM.wait);
    }
  },

  // Finished walking the current leg. If it ends at a TP, use it; otherwise kill wanted.
  advanceLeg() {
    const leg = LPVM.Plan?.legs[LPVM.Plan.curLeg];
    if (!leg) {
      setTimeout(() => this.KillWanted(), 500);
      return;
    }
    if (leg.tpIndex !== undefined) {
      console.log('[AFO_LPVM] Using TP', leg.tp.x + '_' + leg.tp.y, '->', leg.tp.target_x + '_' + leg.tp.target_y);
      this.useTPWithRetry();
      return;
    }
    // No more TPs — final leg done, kill the wanted.
    setTimeout(() => this.KillWanted(), 500);
  },

  // ============================================
  // TP USAGE (pattern stolen from glebia.js)
  // ============================================
  // Server silently drops a:6 if fired too soon after a:4 (cooldown ~250ms)
  // or right after combat ("fresh from combat"). Uses emitOrder (load_start
  // gated) + polls for position change + retries up to 3 times.

  MOVE_COOLDOWN_TURN_MS: 250,

  useTP() {
    const now = performance.now();
    const since = now - (LPVM._lastMoveT || 0);
    const cd = this.MOVE_COOLDOWN_TURN_MS;
    if (since < cd) {
      setTimeout(() => this.useTP(), cd - since);
      return;
    }
    LPVM._teleporting = true;
    LPVM._expected = null;
    GAME.emitOrder({ a: 6, tpid: 0 });
    LPVM._lastMoveT = now;
  },

  useTPWithRetry(retries) {
    if (LPVM.Stop) return;
    if (retries === undefined) retries = 3;
    const startLoc = GAME.char_data.loc;
    const startX = GAME.char_data.x, startY = GAME.char_data.y;
    this.useTP();
    this.waitForPosChange(startLoc, startX, startY, (changed) => {
      if (LPVM.Stop) return;
      if (changed) {
        // We moved — discard plan, replan from new pos.
        LPVM._teleporting = false;
        LPVM.Plan = null;
        LPVM.Path = [];
        setTimeout(() => this.Go(), LPVM.wait);
        return;
      }
      if (retries > 0) {
        console.log('[AFO_LPVM] useTP: pos unchanged, retrying (' + retries + ' left)');
        setTimeout(() => this.useTPWithRetry(retries - 1), 500);
        return;
      }
      console.warn('[AFO_LPVM] useTP: failed after retries, replanning');
      LPVM._teleporting = false;
      LPVM.Plan = null;
      LPVM.Path = [];
      setTimeout(() => this.Go(), 500);
    });
  },

  // Poll char_data until loc OR (x,y) differs from start. Intra-map TPs keep
  // loc the same but change x/y, cross-map TPs change loc.
  waitForPosChange(startLoc, startX, startY, cb) {
    if (LPVM.Stop) return;
    const t0 = performance.now();
    const TIMEOUT_MS = 1500;
    const poll = () => {
      if (LPVM.Stop) return;
      const cd = GAME.char_data;
      if (cd.loc !== startLoc || cd.x !== startX || cd.y !== startY) {
        setTimeout(() => cb(true), 150);
        return;
      }
      if (performance.now() - t0 > TIMEOUT_MS) { cb(false); return; }
      setTimeout(poll, 30);
    };
    setTimeout(poll, 30);
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

    // Remember where we expect to land (1-based, matches res.x/res.y from server)
    LPVM._expected = { x: target.x + 1, y: target.y + 1 };
    LPVM._lastMoveT = performance.now();
    GAME.emitOrder({ a: 4, dir: dir, vo: GAME.map_options.vo });
  },

  Next() {
    if (LPVM.Path.length - 1 > 0) {
      LPVM.Path.shift();
      setTimeout(() => this.Move(), LPVM.wait);
    } else {
      // Finished walking the current leg — use TP or kill wanted.
      this.advanceLeg();
    }
  },

  HandleSockets(res) {
    if (LPVM.Stop) return;

    // error34: "Nie możesz udać się do docelowej lokacji!" — wanted's loc is unreachable
    // (e.g. quest-gated). Degrade Born and retry from the new list.
    if (res.e === 34) {
      console.warn('[AFO_LPVM] error34: cannot reach target location, degrading Born');
      this.degradeBorn();
      return;
    }

    if (res.a === 4 && res.char_id === GAME.char_id) {
      const exp = LPVM._expected;
      LPVM._expected = null;
      if (exp && (exp.x !== res.x || exp.y !== res.y)) {
        // Slider / blocker: server placed us somewhere other than requested.
        this.markBlocked(GAME.char_data.loc, exp.x, exp.y, res.x, res.y);
        LPVM.Path = [];
        LPVM.Plan = null;
        setTimeout(() => this.Go(), LPVM.wait);
        return;
      }
      this.Next();
    } else if (res.a === 32 && res.e == 0) {
      if ($('button[data-wanted="' + LPVM.Born + '"]').html()) {
        setTimeout(() => GAME.emitOrder( { a: 32, type: 2, wanted: LPVM.Born }), 150);
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
        setTimeout(() => GAME.emitOrder( { a: 32, type: 0 }), 100);
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
      console.log('[AFO_LPVM:click]', { Stop: LPVM.Stop });
      if (LPVM.Stop) {
        $(".lpvm_lpvm .lpvm_status").removeClass("red").addClass("green").html("On");
        LPVM.Stop = false;
        LPVM._startCallCount = 0; // reset diagnostic counter for new ON cycle
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
