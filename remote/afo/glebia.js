/**
 * ============================================================================
 * AFO - GŁĘBIA (Depth Dungeon) Module
 * ============================================================================
 * 
 * Automated clearing of the "Głębia" dungeon area.
 * Navigates through the map, attacking players along the way.
 * 
 * Options:
 * - Start: Enable/disable the automation
 * - Kody: Enable/disable automatic training code usage
 * 
 * ============================================================================
 */

const GLEBIA = {
  // State
  stop: true,
  caseNumber: 0,

  // Timing
  wait: 10,
  waitPvp: 200,
  attackDelay: 260,

  // Movement tracking
  dogory: false,
  loc: null,
  move1: false,
  move2: false,
  move3: false,

  // Attack tracking
  attackChecks: 0,
  attackRetries: 0,
  tileRetries: 0,
  lastEnemyCount: -1,
  isAttacking: false,

  // Options
  code: false,
  kontoTP: false,
  rajskaSala: true,  // ON by default — obij also Głębia Rajskiej Sali
  higherRebornAvoid: false,
  speed: 50
};

const AFO_GLEBIA = {

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    console.log('[AFO_GLEBIA] Module initialized');
  },

  // ============================================
  // CLICK HANDLERS
  // ============================================

  bindHandlers() {
    // Start/Stop toggle
    $('#glebia_Panel .glebia_toggle').click(() => {
      console.log('[AFO_GLEBIA:click]', { stop: GLEBIA.stop });
      if (GLEBIA.stop) {
        $(".glebia_toggle .glebia_status").removeClass("red").addClass("green").html("On");
        GLEBIA.stop = false;

        // Reset all attack state for clean start
        GLEBIA.isAttacking = false;
        GLEBIA.attackRetries = 0;
        GLEBIA.tileRetries = 0;
        GLEBIA.lastEnemyCount = -1;
        GLEBIA.caseNumber = 0;
        GLEBIA._startCallCount = 0; // reset diagnostic counter for new ON cycle
        GLEBIA._isLoadingRetries = 0;

        this.start();

        // Stop other modules
        if (typeof PVP !== 'undefined') PVP.stop = true;
        if (typeof RESP !== 'undefined') RESP.stop = true;
        if (typeof LPVM !== 'undefined') LPVM.Stop = true;
        if (typeof RES !== 'undefined') RES.stop = true;
        if (typeof CODE !== 'undefined') CODE.stop = true;

        $(".pvp_pvp .pvp_status").removeClass("green").addClass("red").html("Off");
        $(".resp_resp .resp_status").removeClass("green").addClass("red").html("Off");
        $(".lpvm_lpvm .lpvm_status").removeClass("green").addClass("red").html("Off");
        $(".res_res .res_status").removeClass("green").addClass("red").html("Off");
        $(".code_code .code_status").removeClass("green").addClass("red").html("Off");
      } else {
        $(".glebia_toggle .glebia_status").removeClass("green").addClass("red").html("Off");
        GLEBIA.stop = true;
      }
    });

    // Kody toggle
    $('#glebia_Panel .glebia_code').click(() => {
      if (GLEBIA.code) {
        $(".glebia_code .glebia_status").removeClass("green").addClass("red").html("Off");
        GLEBIA.code = false;
        $('#glebia_Panel .glebia_konto').hide();
      } else {
        $(".glebia_code .glebia_status").removeClass("red").addClass("green").html("On");
        GLEBIA.code = true;
        $('#glebia_Panel .glebia_konto').show();
      }
    });

    // Konto toggle (visible only when Kody is on)
    $('#glebia_Panel .glebia_konto').click(() => {
      if (GLEBIA.kontoTP) {
        $(".glebia_konto .glebia_status").removeClass("green").addClass("red").html("Off");
        GLEBIA.kontoTP = false;
      } else {
        $(".glebia_konto .glebia_status").removeClass("red").addClass("green").html("On");
        GLEBIA.kontoTP = true;
      }
    });

    // Rajska Sala toggle — when OFF, bot stays in Głębia and skips the loc=2 transit.
    $('#glebia_Panel .glebia_sala').click(() => {
      if (GLEBIA.rajskaSala) {
        $(".glebia_sala .glebia_status").removeClass("green").addClass("red").html("Off");
        GLEBIA.rajskaSala = false;
      } else {
        $(".glebia_sala .glebia_status").removeClass("red").addClass("green").html("On");
        GLEBIA.rajskaSala = true;
      }
      this.saveRajskaSala();
    });

    // Unikaj borny toggle — hide higher-reborn players from attack list (>3 only).
    $('#glebia_Panel .glebia_rb_avoid').click(() => {
      if (GLEBIA.higherRebornAvoid) {
        $(".glebia_rb_avoid .glebia_status").removeClass("green").addClass("red").html("Off");
        GLEBIA.higherRebornAvoid = false;
      } else {
        $(".glebia_rb_avoid .glebia_status").removeClass("red").addClass("green").html("On");
        GLEBIA.higherRebornAvoid = true;
      }
    });

    // Speed input handler — clamp to 10-500, reflect clamped value back to UI.
    $('#glebia_Panel input[name=glebia_speed]').on('input change', (e) => {
      let val = parseInt($(e.target).val()) || 100;
      if (val < 10) val = 10;
      if (val > 500) val = 500;
      if (String(val) !== $(e.target).val()) $(e.target).val(val);
      GLEBIA.speed = val;
      this.saveSpeed();
    });

    // Initially hide konto button
    $('#glebia_Panel .glebia_konto').hide();

    // Load saved speed + sala toggle state
    this.loadSpeed();
    this.loadRajskaSala();
    $('#glebia_Panel input[name=glebia_speed]').val(GLEBIA.speed);
    // Reflect sala toggle on the panel
    if (GLEBIA.rajskaSala) {
      $(".glebia_sala .glebia_status").removeClass("red").addClass("green").html("On");
    } else {
      $(".glebia_sala .glebia_status").removeClass("green").addClass("red").html("Off");
    }

    console.log('[AFO_GLEBIA] Handlers bound');
  },

  saveRajskaSala() {
    localStorage.setItem('glebia_rajska_sala', GLEBIA.rajskaSala ? '1' : '0');
  },

  loadRajskaSala() {
    const saved = localStorage.getItem('glebia_rajska_sala');
    if (saved !== null) GLEBIA.rajskaSala = saved === '1';
  },

  // ============================================
  // SPEED HELPERS
  // ============================================

  getSpeedMultiplier() {
    let speed = GLEBIA.speed;
    if (speed < 10) speed = 10;
    if (speed > 500) speed = 500;
    return speed / 50;
  },

  /**
   * Get attack delay based on speed setting.
   * Speed 10 = 200ms, Speed 50 = 100ms, Speed 100 = 50ms
   */
  getAttackDelay() {
    const speed = this.getSpeedMultiplier() * 50;
    return Math.max(30, Math.min(200, Math.round(5000 / speed)));
  },

  /**
   * Get max wait time for is_loading check.
   * Higher speed = shorter wait.
   */
  getLoadingWait() {
    const speed = this.getSpeedMultiplier() * 50;
    return Math.max(20, Math.min(80, Math.round(2500 / speed)));
  },

  // Generic speed-aware delay scaler with floor/ceiling guards.
  scaleDelay(baseMs, minMs, maxMs) {
    const mul = this.getSpeedMultiplier();
    return Math.max(minMs, Math.min(maxMs, Math.round(baseMs / mul)));
  },

  // High-speed bypass: above this threshold we skip is_loading polling.
  shouldBypassLoading() {
    return (GLEBIA.speed || 50) >= 150;
  },

  // === Move cooldown machinery (mirror of AFO_PVP — see pvp.js for rationale) ===
  MOVE_COOLDOWN_TURN_MS: 250,
  MOVE_COOLDOWN_SAME_BASE_MS: 250,
  MOVE_COOLDOWN_SAME_MIN_MS: 60,

  getMoveCooldown(dir) {
    const lastDir = GLEBIA._lastMoveDir;
    if (lastDir !== undefined && lastDir !== dir) return this.MOVE_COOLDOWN_TURN_MS;
    const mul = this.getSpeedMultiplier();
    return Math.min(
      this.MOVE_COOLDOWN_TURN_MS,
      Math.max(this.MOVE_COOLDOWN_SAME_MIN_MS, Math.round(this.MOVE_COOLDOWN_SAME_BASE_MS / mul))
    );
  },

  _moveDelta(dir) {
    switch (dir) {
      case 1: return { dx: 0, dy: 1 };
      case 2: return { dx: 0, dy: -1 };
      case 3: return { dx: 1, dy: 1 };
      case 4: return { dx: -1, dy: 1 };
      case 5: return { dx: 1, dy: -1 };
      case 6: return { dx: -1, dy: -1 };
      case 7: return { dx: 1, dy: 0 };
      case 8: return { dx: -1, dy: 0 };
      default: return { dx: 0, dy: 0 };
    }
  },

  moveAndVerify(dir, cb) {
    if (GLEBIA.stop) return;
    const requiredCd = this.getMoveCooldown(dir);
    const now = performance.now();
    const since = now - (GLEBIA._lastMoveT || 0);
    if (since < requiredCd) {
      setTimeout(() => this.moveAndVerify(dir, cb), requiredCd - since);
      return;
    }

    const startX = GAME.char_data.x;
    const startY = GAME.char_data.y;
    const { dx, dy } = this._moveDelta(dir);
    const targetX = startX + dx;
    const targetY = startY + dy;

    GLEBIA._lastMoveT = now;
    GLEBIA._lastMoveDir = dir;
    GAME.emitOrder({ a: 4, dir: dir, vo: GAME.map_options.vo });

    const t0 = now;
    const TIMEOUT_MS = 600;
    const poll = () => {
      if (GLEBIA.stop) return;
      const cx = GAME.char_data.x;
      const cy = GAME.char_data.y;
      if (cx === targetX && cy === targetY) { setTimeout(cb, 10); return; }
      if (cx !== startX || cy !== startY) { setTimeout(cb, 10); return; }
      if (performance.now() - t0 > TIMEOUT_MS) { cb(); return; }
      setTimeout(poll, 15);
    };
    setTimeout(poll, 15);
  },

  // Idempotent socket listener for fight responses (a:7) and ghost detection.
  // - a:7 → flip _awaitingFight for event-driven attack pacing.
  // - error 55 ("player not on tile") → mark last target as ghost so we skip
  //   them on the next attackLoop pass instead of burning 20 retries on a
  //   player who already walked off (matters on crowded Głębia tiles).
  _bindGrListener() {
    if (GLEBIA._grBound || !GAME || !GAME.socket) return;
    GLEBIA._grBound = true;
    GAME.socket.on('gr', (res) => {
      if (!res) return;
      if ((res.e === 55 || res.me === 55) && GLEBIA._lastAttackTarget) {
        if (!GLEBIA._tileGhosts) GLEBIA._tileGhosts = new Set();
        GLEBIA._tileGhosts.add(GLEBIA._lastAttackTarget);
        GLEBIA._awaitingFight = false;
        return;
      }
      if (res.a === 7 && !res.game_progress) {
        GLEBIA._awaitingFight = false;
        GLEBIA._lastFightRes = res;
      }
    });
    console.log('[AFO_GLEBIA] gr listener bound (ghost-aware)');
  },

  saveSpeed() {
    localStorage.setItem('glebia_speed', GLEBIA.speed);
  },

  loadSpeed() {
    const saved = localStorage.getItem('glebia_speed');
    if (saved) {
      let val = parseInt(saved) || 100;
      if (val < 10) val = 10;
      if (val > 500) val = 500;
      GLEBIA.speed = val;
    }
  },

  // ============================================
  // MAIN LOOP
  // ============================================

  start() {
    // Throttled diagnostic logs — only first 5 calls per ON, set in bindHandlers.
    if (GLEBIA._startCallCount === undefined) GLEBIA._startCallCount = 0;
    GLEBIA._startCallCount++;
    if (GLEBIA._startCallCount <= 5) {
      console.log('[AFO_GLEBIA:start]', {
        call: GLEBIA._startCallCount,
        stop: GLEBIA.stop,
        is_loading: GAME.is_loading,
        caseNumber: GLEBIA.caseNumber,
        x: GAME.char_data?.x, y: GAME.char_data?.y,
        socket_connected: GAME.socket?.connected
      });
    }

    if (GLEBIA.stop) {
      if (GLEBIA._startCallCount <= 5) console.warn('[AFO_GLEBIA:start] silent exit — GLEBIA.stop=true');
      return;
    }

    // Bind socket listener once (idempotent) for event-driven attacks.
    this._bindGrListener();

    // High-speed bypass: at speed >= 150 we don't wait for is_loading to clear.
    const canSkipLoading = GAME.is_loading && this.shouldBypassLoading();

    if (!GAME.is_loading || canSkipLoading) {
      GLEBIA._isLoadingRetries = 0;
      this.action();
    } else {
      // Defensive: cap retries. After 5s of stuck is_loading, force start anyway.
      GLEBIA._isLoadingRetries = (GLEBIA._isLoadingRetries || 0) + 1;
      if (GLEBIA._startCallCount <= 5) {
        console.log('[AFO_GLEBIA:start] retry — is_loading=true, attempt', GLEBIA._isLoadingRetries);
      }
      if (GLEBIA._isLoadingRetries > 50) {
        console.warn('[AFO_GLEBIA:start] is_loading stuck for >5s, forcing action() anyway');
        GLEBIA._isLoadingRetries = 0;
        this.action();
        return;
      }
      setTimeout(() => this.start(), this.scaleDelay(100, 30, 150));
    }
  },

  action() {
    // Check codes if enabled
    if (GLEBIA.code && this.checkCode()) {
      setTimeout(() => this.start(), 1800);
      return;
    }

    switch (GLEBIA.caseNumber) {
      case 0: GLEBIA.caseNumber++; this.check_position_x(); break;
      case 1: GLEBIA.caseNumber++; this.check_position_y(); break;
      case 2: GLEBIA.caseNumber++; this.check_players(); break;
      case 3: GLEBIA.caseNumber++; this.check_players2(); break;
      case 4: this.kill_players(); break; // Don't increment - attackLoop handles progression
      case 5: GLEBIA.caseNumber++; this.check_glebia_location(); break;
      case 6: GLEBIA.caseNumber = 0; this.go(); break;
      default: GLEBIA.caseNumber = 0; break;
    }
  },

  // ============================================
  // NAVIGATION
  // ============================================

  go() {
    GLEBIA.attackChecks = 0;

    const x = GAME.char_data.x;
    const y = GAME.char_data.y;

    if (x === 11 && y === 11 && GLEBIA.dogory && GLEBIA.loc === 1) {
      this.cofanie2();
    } else if (x === 15 && y === 15 && GLEBIA.move3 && GLEBIA.loc === 2) {
      this.cofanie();
    } else if (x === 2 && y === 11 && GLEBIA.loc === 1 && GLEBIA.move1) {
      // Toggle off — instead of entering Rajska Sala, behave as if we just
      // returned from the teleport: reset move1 and let the default branch
      // walk right (move(7) → 3|11 → ... → 10|11 → cofanie2 up). Calling
      // cofanie2() directly from 2|11 emits dir=2 which is blocked (2|10
      // unreachable) — server keeps spamming "Ruch niemożliwy".
      if (GLEBIA.rajskaSala === false) {
        GLEBIA.move1 = false;
        setTimeout(() => this.start(), GLEBIA.wait);
        return;
      }
      this.przejdzWithRetry();
    } else if (x === 1 && y === 1 && GLEBIA.loc === 2 && GLEBIA.move3) {
      this.przejdzWithRetry();
    } else if (((x === 7 && y === 7) && GLEBIA.loc === 2 && GLEBIA.move2) ||
      (x === 9 && y === 7 && GLEBIA.loc === 2 && GLEBIA.move2)) {
      this.move(3);
    } else if (((x === 8 && y === 8) && GLEBIA.loc === 2 && GLEBIA.move2) ||
      (x === 10 && y === 8 && GLEBIA.loc === 2 && GLEBIA.move2)) {
      this.move(5);
    } else if (x === 10 && y === 11 && GLEBIA.loc === 1) {
      GLEBIA.dogory = true;
      this.move(7);
    } else if (x === 10 && y === 2 && GLEBIA.loc === 1) {
      GLEBIA.dogory = false;
      this.move(8);
    } else if (x === 5 && y === 10 && GLEBIA.loc === 1) {
      GLEBIA.move1 = true;
      this.move(8);
    } else if (x === 10 && y === 10 && GLEBIA.loc === 1) {
      GLEBIA.move1 = true;
      this.move(8);
    } else if (x === 3 && y === 1 && GLEBIA.loc === 2) {
      GLEBIA.move1 = false;
      this.move(7);
    } else if (x === 3 && y === 10 && GLEBIA.loc === 1) {
      this.move(4);
    } else if (x === 2 && y === 8 && GLEBIA.loc === 1) {
      this.move(3);
    } else if ((x === 11 && y === 11 && GLEBIA.loc === 1) ||
      (x === 15 && y === 15 && GLEBIA.loc === 2)) {
      this.move(2);
    } else if (x === 5 && y === 7 && GLEBIA.loc === 2) {
      GLEBIA.move2 = true;
      this.move(7);
    } else if (x === 13 && y === 7 && GLEBIA.loc === 2) {
      GLEBIA.move2 = false;
      this.move(7);
    } else if (x === 12 && y === 15 && GLEBIA.loc === 2) {
      GLEBIA.move3 = true;
      this.move(7);
    } else if (x === 5 && y === 11 && GLEBIA.loc === 1) {
      GLEBIA.move3 = false;
      this.move(7);
    } else if (x === 10 && y === 15 && GLEBIA.loc === 2) {
      GLEBIA.move3 = true;
      this.move(7);
    } else if (x === 7 && y === 11 && GLEBIA.loc === 1) {
      GLEBIA.move3 = false;
      this.move(7);
    } else if (x === 7 && y === 7 && GLEBIA.loc === 2) {
      this.move(1);
    } else if ((x < 11 && y % 2 !== 0 && GLEBIA.loc === 1) ||
      (x < 15 && y % 2 !== 0 && GLEBIA.loc === 2)) {
      this.move(7);
    } else if ((x > 2 && y % 2 === 0 && GLEBIA.loc === 1) ||
      (x > 1 && y % 2 === 0 && GLEBIA.loc === 2)) {
      this.move(8);
    } else if ((x === 11 && GLEBIA.loc === 1) ||
      (x === 2 && GLEBIA.loc === 1) ||
      (x === 3 && y === 9 && GLEBIA.loc === 1) ||
      (x === 1 && GLEBIA.loc === 2) ||
      (x === 15 && GLEBIA.loc === 2) ||
      (x === 7 && y === 7 && GLEBIA.loc === 2)) {
      this.move(1);
    }
  },

  cofanie() {
    if (GLEBIA.stop) return;
    const y = GAME.char_data.y;
    if (y <= 1) {
      setTimeout(() => this.start(), GLEBIA.wait);
      return;
    }
    this.moveAndVerify(6, () => this.cofanie());
  },

  cofanie2() {
    if (GLEBIA.stop) return;
    const y = GAME.char_data.y;
    if (y <= 2) {
      setTimeout(() => this.start(), GLEBIA.wait);
      return;
    }
    GLEBIA.move1 = true;
    this.moveAndVerify(2, () => this.cofanie2());
  },

  move(direction) {
    const valid = [1, 2, 3, 4, 5, 6, 7, 8];
    if (!valid.includes(direction)) return;
    this.moveAndVerify(direction, () => setTimeout(() => this.start(), GLEBIA.wait));
  },

  /**
   * Legacy fallback. Kept for any callers that still use it.
   */
  waitForLoad(callback) {
    if (GLEBIA.stop) return;
    if (GAME.is_loading || $("#loader").is(":visible")) {
      setTimeout(() => this.waitForLoad(callback), 50);
    } else {
      const walkDelay = Math.max(20, 200 / this.getSpeedMultiplier());
      setTimeout(callback, walkDelay);
    }
  },

  przejdz() {
    // Respect MOVE_COOLDOWN_TURN_MS — emit a:6 fired too soon after the
    // preceding a:4 gets silently dropped by the server.
    const now = performance.now();
    const since = now - (GLEBIA._lastMoveT || 0);
    const cooldown = this.MOVE_COOLDOWN_TURN_MS || 250;
    if (since < cooldown) {
      setTimeout(() => this.przejdz(), cooldown - since);
      return;
    }
    GAME.emitOrder({ a: 6, tpid: 0 });
    GLEBIA.move3 = false;
    GLEBIA.move1 = false;
    GLEBIA._lastMoveT = now;
  },

  /**
   * Teleport with retry. Empirically the server sometimes responds GR a:6 e=0
   * (formal success) but never follows up with the a:3 loadMap when the
   * character is "fresh from combat" — char_data.loc stays the same. Manual
   * console test always works because the character is idle. Retry up to N
   * times with a 1s pause; that pause lets any post-fight server state settle.
   */
  przejdzWithRetry(retries) {
    if (GLEBIA.stop) return;
    if (retries === undefined) retries = 3;
    const startLoc = GAME.char_data.loc;
    this.przejdz();
    this.waitForLocChange(() => {
      if (GLEBIA.stop) return;
      if (GAME.char_data.loc !== startLoc) {
        setTimeout(() => this.start(), GLEBIA.wait);
        return;
      }
      if (retries > 0) {
        console.log('[GLEBIA] przejdz: loc unchanged, retrying (' + retries + ' left)');
        setTimeout(() => this.przejdzWithRetry(retries - 1), 500);
        return;
      }
      console.warn('[GLEBIA] przejdz: failed after retries, bailing');
      setTimeout(() => this.start(), GLEBIA.wait);
    });
  },

  /**
   * Poll char_data.loc until it changes (or timeout). Used after przejdz() —
   * the teleport ACK is fast but the actual loc change arrives via a separate
   * a:3 (loadMap) response, normally within ~500ms. 1.5s gives margin without
   * making retries painful when the server silently drops the teleport.
   */
  waitForLocChange(cb) {
    if (GLEBIA.stop) return;
    const startLoc = GAME.char_data.loc;
    const t0 = performance.now();
    const TIMEOUT_MS = 1500;
    const poll = () => {
      if (GLEBIA.stop) return;
      if (GAME.char_data.loc !== startLoc) {
        setTimeout(cb, 150);
        return;
      }
      if (performance.now() - t0 > TIMEOUT_MS) { cb(); return; }
      setTimeout(poll, 30);
    };
    setTimeout(poll, 30);
  },

  // ============================================
  // POSITION CHECKS
  // ============================================

  check_position_x() {
    setTimeout(() => this.start(), GLEBIA.wait);
  },

  check_position_y() {
    setTimeout(() => this.start(), GLEBIA.wait);
  },

  // ============================================
  // PLAYER CHECKS
  // ============================================

  check_players() {
    const playerList = document.getElementById("player_list_con");
    if (!playerList || playerList.childElementCount === 0) {
      return setTimeout(() => this.start(), GLEBIA.wait);
    }

    if (typeof LOWLVL !== 'undefined' && LOWLVL.stop === true) {
      if (playerList.children[0] && playerList.children[0].children[1] &&
        playerList.children[0].children[1].childElementCount === 3) {
        const tabb2 = playerList.children[0].children[1].children[0].textContent.split(":");
        if (parseInt(tabb2[1]) <= 1 && GAME.char_data.y === 2) {
          return setTimeout(() => this.check_players(), this.scaleDelay(150, 30, 200));
        }
      }
    }

    setTimeout(() => this.start(), GLEBIA.wait);
  },

  check_players2() {
    // kill_players now handles full attack cycle, just continue to next step
    setTimeout(() => this.start(), GLEBIA.wait);
  },

  // ============================================
  // ATTACK LOGIC (Attack-Until-Clear pattern)
  // ============================================

  /**
   * Attack loop that stays active until all enemies are killed or position changes.
   * This prevents moving to next tile before finishing kills.
   */
  kill_players() {
    // Mark that we're attacking - blocks main loop progression
    GLEBIA.isAttacking = true;

    // Save current position to detect tile change
    const startX = GAME.char_data.x;
    const startY = GAME.char_data.y;

    // Reset attack state
    GLEBIA.attackRetries = 0;
    GLEBIA.lastEnemyCount = -1;
    GLEBIA._cleanupPasses = 0;       // re-check counter for players coming off cooldown
    GLEBIA._myClicksThisCycle = 0;   // count of our own attack clicks on this tile
    GLEBIA._tileGhosts = new Set();  // char_ids that returned "not on tile" — skip them

    this.attackLoop(startX, startY);
  },

  attackLoop(startX, startY) {
    // Check if stopped
    if (GLEBIA.stop) return;

    // If game is loading, wait — do NOT bypass here even at high speed.
    // Game silently drops emit() when is_loading=true (bigcode:7249), so a
    // bypassed click never produces a response, _awaitingFight stays stuck,
    // and we burn retries without progress. Crowded tiles (lots of activity)
    // make this catastrophic — was losing 100+ enemies per tile.
    if (GAME.is_loading || $("#loader").is(":visible")) {
      setTimeout(() => this.attackLoop(startX, startY), this.getLoadingWait());
      return;
    }

    const currentX = GAME.char_data.x;
    const currentY = GAME.char_data.y;

    // Position changed - exit attack mode and continue main loop
    if (currentX !== startX || currentY !== startY) {
      GLEBIA.attackRetries = 0;
      GLEBIA.isAttacking = false;  // Clear flag - allow main loop to continue
      GLEBIA.caseNumber++;  // Move to next step
      setTimeout(() => this.start(), GLEBIA.wait);
      return;
    }

    // Load more players if available - wait after clicking for them to load (speed-aware)
    if ($("#player_list_con").find("[data-option=load_more_players]").length != 0) {
      $("#player_list_con").find("[data-option=load_more_players]").click();
      setTimeout(() => this.attackLoop(startX, startY), this.scaleDelay(300, 50, 350));
      return;
    }

    // Count attackable enemies. Exclude players with active cooldown.
    // Game adds `.timer` element only while cooldown is running and removes
    // the class when it expires (bigcode:16248). `initial_hide_forced` only
    // covers cooldowns present at INITIAL render — cooldowns triggered by our
    // own attacks add a fresh `.timer` but leave the button without that class,
    // so we must filter at the `.player` level to avoid wasted clicks.
    // Also skip "ghost" players — those whose attack returned error 55 (player
    // left the tile mid-attack). On crowded Głębia tiles this previously cost
    // up to 20 retries per ghost.
    const ghosts = GLEBIA._tileGhosts || new Set();
    let enemies = $("#player_list_con .player").filter(function () {
      if ($(this).find(".timer").length !== 0) return false;
      if (ghosts.size > 0) {
        const cid = parseInt($(this).find("button[data-quick=1]").attr('data-char_id'), 10);
        if (ghosts.has(cid)) return false;
      }
      return true;
    }).find("button[data-quick=1]:not(.initial_hide_forced)");
    const enemyCount = enemies.length;

    // Cleanup logic — only wait if SOMEONE'S cooldown is about to expire NOW.
    // Read data-end from .timer (unix seconds) to find the smallest remaining
    // cooldown. If it's >5s we just go — no point standing around for a 4-min
    // foreign cooldown we can't attack anyway.
    if (enemyCount === 0) {
      const now = GAME.getTime();
      const cooldowns = [];
      $("#player_list_con .player .timer").each(function () {
        const end = parseInt($(this).attr('data-end'), 10);
        if (end > 0) cooldowns.push(end - now);
      });
      const minCd = cooldowns.length ? Math.min.apply(null, cooldowns) : 0;
      const CLEANUP_THRESHOLD_S = 5;
      const self = this;
      const moveOn = () => {
        GLEBIA.attackRetries = 0;
        GLEBIA.tileRetries = 0;
        GLEBIA.isAttacking = false;
        GLEBIA._cleanupPasses = 0;
        GLEBIA.caseNumber++;
        setTimeout(() => self.start(), GLEBIA.wait);
      };
      if (minCd > CLEANUP_THRESHOLD_S || minCd <= 0) { moveOn(); return; }
      if ((GLEBIA._cleanupPasses || 0) < 2) {
        GLEBIA._cleanupPasses = (GLEBIA._cleanupPasses || 0) + 1;
        const waitMs = Math.min(3000, minCd * 1000 + 200);
        setTimeout(() => this.attackLoop(startX, startY), waitMs);
        return;
      }
      moveOn();
      return;
    }

    // Found targets — reset cleanup counter so a future emptying gets a fresh budget.
    GLEBIA._cleanupPasses = 0;

    // Check if we're making progress (enemy count decreased)
    if (GLEBIA.lastEnemyCount === enemyCount) {
      GLEBIA.attackRetries++;
      GLEBIA.tileRetries++;

      // Too many retries on this tile - player likely moved or has cooldown.
      // Threshold 20 — event-driven loop iterates fast and a hard-to-kill player
      // (defensive build, miss streak, response lag) can burn retries quickly
      // even when others around them are still attackable.
      if (GLEBIA.tileRetries > 20) {
        console.log('[GLEBIA] Max tile retries reached (' + GLEBIA.tileRetries + '), ' + enemyCount + ' enemies left, moving on');
        GLEBIA.attackRetries = 0;
        GLEBIA.tileRetries = 0;
        GLEBIA.isAttacking = false;
        GLEBIA.caseNumber++;
        setTimeout(() => this.start(), GLEBIA.wait);
        return;
      }

      // Short-term retry - wait a bit for server response (speed-aware)
      if (GLEBIA.attackRetries > 5) {
        GLEBIA.attackRetries = 0;
        setTimeout(() => this.attackLoop(startX, startY), this.scaleDelay(500, 80, 600));
        return;
      }
    } else {
      // Enemy count changed = successful kill(s)!
      if (GLEBIA.lastEnemyCount > 0 && GLEBIA.lastEnemyCount > enemyCount) {
        const killsThisRound = GLEBIA.lastEnemyCount - enemyCount;
        for (let i = 0; i < killsThisRound; i++) {
          if (typeof kws !== 'undefined' && kws.pvp_count) {
            kws.pvp_count();
          }
        }
      }
      // Reset retries - we're making progress
      GLEBIA.attackRetries = 0;
      GLEBIA.tileRetries = 0;
    }

    GLEBIA.lastEnemyCount = enemyCount;

    // Event-driven attack: fire click, then race the gr listener vs a fallback timeout.
    // Listener (a:7) flips _awaitingFight=false the instant server confirms — at high speed
    // we re-enter attackLoop in ~5-10ms instead of waiting full getAttackDelay().
    // eq(0) — list is sorted with attackable players on top; rotating index attacks
    // already-attacked players further down (visible cooldown = wasted click).
    const $btn = enemies.eq(0);
    GLEBIA._lastAttackTarget = parseInt($btn.attr('data-char_id'), 10) || null;
    GLEBIA._awaitingFight = true;
    GLEBIA._myClicksThisCycle = (GLEBIA._myClicksThisCycle || 0) + 1;
    $btn.click();

    const attackDelay = this.getAttackDelay();
    const checkAndContinue = (attempts) => {
      if (GLEBIA.stop) return;
      if (!GLEBIA._awaitingFight) {
        // Server response landed — pause for DOM to refresh player list.
        // Floor 25ms: empirically the player list takes ~20-30ms to update after gr,
        // shorter than that causes false "no progress" detections.
        setTimeout(() => this.attackLoop(startX, startY), Math.max(25, Math.round(attackDelay / 2)));
        return;
      }
      if (attempts >= 3) {
        // Fallback: response didn't arrive, continue with full delay
        setTimeout(() => this.attackLoop(startX, startY), attackDelay);
        return;
      }
      // Re-check the event flag at half-delay granularity
      setTimeout(() => checkAndContinue(attempts + 1), Math.max(10, Math.round(attackDelay / 2)));
    };
    checkAndContinue(0);
  },

  // ============================================
  // LOCATION CHECK
  // ============================================

  check_glebia_location() {
    const locationMap = {
      "Głębia": 1,
      "Głębia Rajskiej Sali": 2
    };

    let currentLoc = locationMap[GAME.current_loc.name] || 7;
    if (GLEBIA.loc !== null && GLEBIA.loc !== currentLoc) {
      GLEBIA.attackChecks = 0;
    }
    GLEBIA.loc = currentLoc;
    setTimeout(() => this.start(), GLEBIA.wait);
  },

  // ============================================
  // CODE AUTOMATION
  // ============================================

  checkCode() {
    if (!GLEBIA.code) return false;

    if (GAME.quick_opts.ssj && $("#ssj_bar").css("display") === "none") {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 18, type: 5, tech_id: GAME.quick_opts.ssj[0] });
      }, 1500);
      return true;
    } else if ($('#ssj_status').text() == "--:--:--" && GAME.quick_opts.ssj) {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 18, type: 6 });
      }, 1500);
      return true;
    } else if ($('#ssj_status').text() <= '00:00:05' && GAME.quick_opts.ssj) {
      return true;
    } else if ($("#train_uptime").find('.timer').length == 0 && !GAME.is_training) {
      GAME.socket.emit('ga', { a: 8, type: 2, stat: 1, duration: 1 });
      if (GLEBIA.kontoTP) {
        setTimeout(() => {
          GAME.socket.emit('ga', { a: 8, type: 5, multi: ':checked', apud: 'vzaaa' });
        }, 1600);
      } else {
        setTimeout(() => {
          GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' });
        }, 1600);
      }
      return true;
    } else if (GAME.is_training && $("#train_uptime").find('.timer').length == 1) {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 8, type: 3 });
      }, 1600);
      return true;
    } else if (GAME.is_training) {
      GAME.socket.emit('ga', { a: 8, type: 3 });
      return true;
    }
    return false;
  }
};

// Export
window.GLEBIA = GLEBIA;
window.AFO_GLEBIA = AFO_GLEBIA;
console.log('[AFO] GŁĘBIA module loaded');
