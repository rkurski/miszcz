/**
 * ============================================================================
 * AFO - PVP Module
 * ============================================================================
 * 
 * PVP automation logic - auto-attacking players, territory control, wars.
 * Uses the global PVP state object from afo/state.js
 * 
 * ============================================================================
 */

const AFO_PVP = {

  // ============================================
  // MAIN PVP LOOP
  // ============================================

  checkBuffsAndSSJ() {
    let imp = $("#leader_player").find("[data-option=show_player]").attr("data-char_id");
    let emp = GAME.char_data.empire;
    let buff = $(".emp_buff .pull-right").find("button").attr("data-option") == "activate_emp_buff";
    let buff_id = $(".emp_buff .pull-right").find("button").attr("data-buff");
    let who_win = $("#gne_satus").text().includes("ZŁO");
    let abut = $("#clan_buffs").find(`button[data-option="activate_war_buff"]`);
    let isDisabled = $("#clan_buffs").find(`button[data-option="activate_war_buff"]`).parents("tr").hasClass("disabled");

    // SSJ activation
    if (GAME.quick_opts.ssj && $("#ssj_bar").css("display") === "none" && PVP.code) {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 18, type: 5, tech_id: GAME.quick_opts.ssj[0] });
      }, 1500);
      return true;
    } else if ($('#ssj_status').text() == "--:--:--" && PVP.code && GAME.quick_opts.ssj) {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 18, type: 6 });
      }, 1500);
      return true;
    } else if ($('#ssj_status').text() <= '00:00:05' && PVP.code && GAME.quick_opts.ssj) {
      return true;
    }
    // Training/codes
    else if ($("#train_uptime").find('.timer').length == 0 && !GAME.is_training && PVP.code) {
      GAME.socket.emit('ga', { a: 8, type: 2, stat: 1, duration: 1 });
      if (PVP.codeTP) {
        setTimeout(() => {
          GAME.socket.emit('ga', { a: 8, type: 5, multi: ':checked', apud: 'vzaaa' });
        }, 1600);
      } else {
        setTimeout(() => {
          GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' });
        }, 1600);
      }
      return true;
    } else if (GAME.is_training && $("#train_uptime").find('.timer').length == 1 && PVP.code) {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 8, type: 3 });
      }, 1600);
      return true;
    } else if (GAME.is_training && PVP.code) {
      GAME.socket.emit('ga', { a: 8, type: 3 });
      return true;
    }
    // Buffs
    else if (imp == GAME.char_id && PVP.buff_imp && buff && buff_id < 4) {
      GAME.socket.emit('ga', { a: 50, type: 6, buff: buff_id });
      return true;
    } else if (imp == GAME.char_id && PVP.buff_imp && buff && buff_id < 7 && ((emp == 1 || emp == 3) && who_win)) {
      GAME.socket.emit('ga', { a: 50, type: 6, buff: buff_id });
      return true;
    } else if (imp == GAME.char_id && PVP.buff_imp && buff && buff_id < 7 && ((emp == 2 || emp == 4) && !who_win)) {
      GAME.socket.emit('ga', { a: 50, type: 6, buff: buff_id });
      return true;
    } else if (PVP.buff_clan && GAME.klan_data != undefined && abut.length && !isDisabled) {
      $(" .newBtn.activate_all_clan_buffs").click();
      return true;
    }
    return false;
  },

  start() {
    // Heartbeat for watchdog — proves chain is alive.
    PVP._lastTick = Date.now();

    // Throttled diagnostic logs — only first 5 calls per ON, set in bindHandlers.
    if (PVP._startCallCount === undefined) PVP._startCallCount = 0;
    PVP._startCallCount++;
    if (PVP._startCallCount <= 5) {
      console.log('[AFO_PVP:start]', {
        call: PVP._startCallCount,
        stop: PVP.stop,
        is_loading: GAME.is_loading,
        caseNumber: PVP.caseNumber,
        x: GAME.char_data?.x, y: GAME.char_data?.y,
        socket_connected: GAME.socket?.connected
      });
    }

    // Bind socket listener once (idempotent) for event-driven attacks.
    this._bindGrListener();

    // High-speed bypass: at speed >= 150 we don't wait for is_loading to clear.
    const canSkipLoading = GAME.is_loading && this.shouldBypassLoading();

    if (!PVP.stop && (!GAME.is_loading || canSkipLoading)) {
      PVP._isLoadingRetries = 0;
      if ($("#player_list_con").find("[data-option=load_more_players]").length != 0) {
        $("#player_list_con").find("[data-option=load_more_players]").click();
      }
      this.action();
    } else if (GAME.is_loading) {
      // Defensive: cap retries. After 5s of stuck is_loading, force start anyway
      // (game optimization changed timing — is_loading sometimes never clears).
      PVP._isLoadingRetries = (PVP._isLoadingRetries || 0) + 1;
      if (PVP._startCallCount <= 5) {
        console.log('[AFO_PVP:start] retry — is_loading=true, attempt', PVP._isLoadingRetries);
      }
      if (PVP._isLoadingRetries > 50) {
        console.warn('[AFO_PVP:start] is_loading stuck for >5s, forcing action() anyway');
        PVP._isLoadingRetries = 0;
        this.action();
        return;
      }
      window.setTimeout(() => this.start(), this.scaleDelay(100, 30, 150));
    } else if (PVP._startCallCount <= 5) {
      // Silent exit — PVP.stop became true. Log it so we see the path.
      console.warn('[AFO_PVP:start] silent exit — stop=' + PVP.stop + ', is_loading=' + GAME.is_loading);
    }
  },

  action() {
    switch (PVP.caseNumber) {
      case 0: PVP.caseNumber++; this.check_position_x(); break;
      case 1: PVP.caseNumber++; this.check_position_y(); break;
      case 2: PVP.caseNumber++; this.check(); break;
      case 3: PVP.caseNumber++; this.check_players(); break;
      case 4: this.kill_players(); break; // Don't increment - attackLoop handles progression
      case 5: PVP.caseNumber++; this.check_players2(); break;
      case 6: PVP.caseNumber++; this.declareEmpireWars(); break;
      case 7: PVP.caseNumber++; this.check_location(); break;
      case 8: PVP.caseNumber++; this.check2(); break;
      case 9: PVP.caseNumber++; this.check_players2(); break;
      case 10: PVP.caseNumber++; this.dec_wars(); break;
      case 11: PVP.caseNumber = 0; this.go(); break;
      default: break;
    }
  },

  // ============================================
  // POSITION & PLAYER CHECKS
  // ============================================

  check_position_x() {
    PVP.x = GAME.char_data.x;
    window.setTimeout(() => this.start(), 5);
  },

  check_position_y() {
    PVP.y = GAME.char_data.y;
    window.setTimeout(() => this.start(), 5);
  },

  check_players() {
    if ($("#player_list_con").find("[data-option=load_more_players]").length != 0) {
      $("#player_list_con").find("[data-option=load_more_players]").click();
    }
    if ($("#player_list_con .player").length > 0) {
      PVP.y = GAME.char_data.y;
      if (document.getElementById("player_list_con").children[0].children[1].childElementCount == 3) {
        PVP.playerTimer = $("#player_list_con .player").eq(0).find(".timer").text();
        if (PVP.playerTimer <= '00:01:30' && PVP.y == 2 && PVP.playerTimer != '' || PVP.playerTimer <= '00:00:25' && PVP.playerTimer != '') {
          window.setTimeout(() => this.check_players(), PVP.pvpDelay / this.getSpeedMultiplier() * 4);
        } else {
          window.setTimeout(() => this.start(), PVP.pvpDelay / this.getSpeedMultiplier() / 2);
        }
      } else {
        window.setTimeout(() => this.start(), PVP.pvpDelay / this.getSpeedMultiplier() / 2);
      }
    } else {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier() * 2);
    }
    PVP.counter = 1;
  },

  check_players2() {
    // kill_players now handles full attack cycle with lag detection
    // Just trigger another attack pass and continue
    this.attackLoop();
    PVP.counter = 1;
  },

  // ============================================
  // KILLING LOGIC (Attack-Until-Clear pattern)
  // ============================================

  /**
   * Attack loop that stays active until all enemies are killed or position changes.
   * This prevents moving to next tile before finishing kills.
   */
  kill_players() {
    // Save current position to detect tile change
    PVP.startX = GAME.char_data.x;
    PVP.startY = GAME.char_data.y;

    // Reset attack state
    PVP.attackRetries = 0;
    PVP.lastEnemyCount = -1;
    PVP._cleanupPasses = 0;       // re-check counter for players coming off cooldown
    PVP._myClicksThisCycle = 0;   // count of our own attack clicks on this tile
    PVP._tileGhosts = new Set();  // char_ids that returned "not on tile" — skip them

    this.attackLoop();
  },

  attackLoop() {
    // Check if stopped
    if (PVP.stop) return;

    // Heartbeat for watchdog — proves chain is alive.
    PVP._lastTick = Date.now();

    // If game is loading, wait briefly but don't block too long.
    // High-speed bypass: at speed >= 150 we don't wait for is_loading.
    if ((GAME.is_loading || $("#loader").is(":visible")) && !this.shouldBypassLoading()) {
      // Cap retries — mirrors start()'s _isLoadingRetries pattern. Without this,
      // a stuck is_loading (e.g. dropped gr response after socket hiccup) silently
      // freezes attackLoop forever. After ~5-8s, bail back to start() which can
      // re-evaluate position and reset the state machine.
      PVP._attackLoadingRetries = (PVP._attackLoadingRetries || 0) + 1;
      if (PVP._attackLoadingRetries > 100) {
        console.warn('[AFO_PVP:attackLoop] is_loading stuck for >5s, bailing to start()');
        PVP._attackLoadingRetries = 0;
        PVP._awaitingFight = false;
        window.setTimeout(() => this.start(), PVP.wait);
        return;
      }
      window.setTimeout(() => this.attackLoop(), this.getLoadingWait());
      return;
    }
    PVP._attackLoadingRetries = 0;

    const currentX = GAME.char_data.x;
    const currentY = GAME.char_data.y;

    // Position changed - exit attack mode and continue main loop
    if (currentX !== PVP.startX || currentY !== PVP.startY) {
      PVP.attackRetries = 0;
      PVP.caseNumber++;  // Move to next step
      window.setTimeout(() => this.start(), PVP.wait);
      return;
    }

    // Load more players if available - wait after clicking for them to load
    if ($("#player_list_con").find("[data-option=load_more_players]").length != 0) {
      $("#player_list_con").find("[data-option=load_more_players]").click();
      // Wait for players to load before continuing (speed-aware)
      window.setTimeout(() => this.attackLoop(), this.scaleDelay(300, 50, 350));
      return;
    }

    // Count attackable enemies. Exclude players with active cooldown.
    // Game adds `.timer` element only while cooldown is running and removes
    // the class when it expires (bigcode:16248). `initial_hide_forced` only
    // covers cooldowns present at INITIAL render — cooldowns triggered by our
    // own attacks add a fresh `.timer` but leave the button without that class,
    // so we must filter at the `.player` level to avoid wasted clicks.
    // Also skip "ghost" players — those whose attack returned error 55 (player
    // already left the tile). Their entry stays in the list until the server
    // refreshes it, and attacking them again just wastes retries.
    const ghosts = PVP._tileGhosts || new Set();
    let enemies = $("#player_list_con .player").filter(function () {
      if ($(this).find(".timer").length !== 0) return false;
      if (ghosts.size > 0) {
        const cid = parseInt($(this).find("button[data-quick=1]").attr('data-char_id'), 10);
        if (ghosts.has(cid)) return false;
      }
      return true;
    }).find("button[data-quick=1]:not(.initial_hide_forced)");
    const enemyCount = enemies.length;

    // Cleanup logic — only wait if someone's cooldown is about to expire NOW.
    // Each .timer has data-end=<unix seconds>. Compute the smallest remaining
    // cooldown across all players on the tile. If even the soonest is >5s, no
    // sense waiting — go. If it's small, wait precisely that long (cap ~3s).
    // This kills the long pause when the only "blocker" is a 4-minute foreign
    // cooldown (we can't attack them anyway).
    if (enemyCount === 0) {
      const now = GAME.getTime();
      const cooldowns = [];
      $("#player_list_con .player .timer").each(function () {
        const end = parseInt($(this).attr('data-end'), 10);
        if (end > 0) cooldowns.push(end - now);
      });
      const minCd = cooldowns.length ? Math.min.apply(null, cooldowns) : 0;
      const CLEANUP_THRESHOLD_S = 5;

      const moveOn = () => {
        PVP.attackRetries = 0;
        PVP.tileRetries = 0;
        PVP._cleanupPasses = 0;
        PVP.caseNumber++;
        kom_clear();
        window.setTimeout(() => this.start(), PVP.wait);
      };

      if (minCd > CLEANUP_THRESHOLD_S || minCd <= 0) {
        moveOn();
        return;
      }
      if ((PVP._cleanupPasses || 0) < 2) {
        PVP._cleanupPasses = (PVP._cleanupPasses || 0) + 1;
        const waitMs = Math.min(3000, minCd * 1000 + 200);
        window.setTimeout(() => this.attackLoop(), waitMs);
        return;
      }
      moveOn();
      return;
    }

    // Found targets — reset cleanup counter so a future emptying gets a fresh budget.
    PVP._cleanupPasses = 0;

    // Check if we're making progress (enemy count decreased)
    if (PVP.lastEnemyCount === enemyCount) {
      PVP.attackRetries++;
      PVP.tileRetries++;

      // Too many retries on this tile - player likely moved or has cooldown.
      // Threshold 20 — event-driven loop iterates fast and a hard-to-kill player
      // (defensive build, miss streak, response lag) can burn retries quickly
      // even when others around them are still attackable.
      if (PVP.tileRetries > 20) {
        console.log('[PVP] Max tile retries reached (' + PVP.tileRetries + '), ' + enemyCount + ' enemies left, moving on');
        PVP.attackRetries = 0;
        PVP.tileRetries = 0;
        PVP.caseNumber++;
        window.setTimeout(() => this.start(), PVP.wait);
        return;
      }

      // Short-term retry - wait for server response (speed-aware)
      if (PVP.attackRetries > 5) {
        PVP.attackRetries = 0;
        window.setTimeout(() => this.attackLoop(), this.scaleDelay(500, 80, 600));
        return;
      }
    } else {
      // Progress! Reset both counters (bug fix — was only resetting attackRetries).
      PVP.attackRetries = 0;
      PVP.tileRetries = 0;
    }

    PVP.lastEnemyCount = enemyCount;

    // Event-driven attack: fire click, then race the gr listener vs a fallback timeout.
    // Listener (a:7) flips _awaitingFight=false the instant server confirms — at high speed
    // we re-enter attackLoop in ~5-10ms instead of waiting full getAttackDelay().
    // eq(0) — list is sorted with attackable players on top; rotating index attacks
    // already-attacked players further down (visible cooldown = wasted click).
    const $btn = enemies.eq(0);
    PVP._lastAttackTarget = parseInt($btn.attr('data-char_id'), 10) || null;
    PVP._awaitingFight = true;
    PVP._myClicksThisCycle = (PVP._myClicksThisCycle || 0) + 1;
    $btn.click();

    const attackDelay = this.getAttackDelay();
    const checkAndContinue = (attempts) => {
      if (PVP.stop) return;
      if (!PVP._awaitingFight) {
        // Server response landed — pause for DOM to refresh player list.
        // Floor 25ms: empirically the player list takes ~20-30ms to update after gr,
        // shorter than that causes false "no progress" detections.
        window.setTimeout(() => this.attackLoop(), Math.max(25, Math.round(attackDelay / 2)));
        return;
      }
      if (attempts >= 3) {
        // Fallback: response didn't arrive, continue with full delay
        window.setTimeout(() => this.attackLoop(), attackDelay);
        return;
      }
      // Re-check the event flag at half-delay granularity
      window.setTimeout(() => checkAndContinue(attempts + 1), Math.max(10, Math.round(attackDelay / 2)));
    };
    checkAndContinue(0);
  },

  // Legacy alias for compatibility
  kill_players1() {
    this.attackLoop();
  },

  // ============================================
  // EMPIRE CHECKS
  // ============================================

  check_imp() {
    let tab = [];
    for (let i = 0; i < 3; i++) {
      tab[i] = parseInt($("#empire_heroes .activity").eq(i).find("[data-option=show_player]").attr("data-char_id"));
    }
    return tab;
  },

  check_imp2() {
    let tab = [];
    for (let i = 0; i < 3; i++) {
      tab[i] = parseInt($("#empire_efrags .activity").eq(i).find("[data-option=show_player]").attr("data-char_id"));
    }
    return tab;
  },

  // ============================================
  // WARS
  // ============================================

  declareEmpireWars() {
    if (PVP.autoWars) {
      let aimp = $("#e_admiral_player").find("[data-option=show_player]").attr("data-char_id");
      let imp = $("#leader_player").find("[data-option=show_player]").attr("data-char_id");

      if (!PVP.adimp) {
        GAME.socket.emit('ga', { a: 50, type: 0, empire: GAME.char_data.empire });
        PVP.adimp = true;
        window.setTimeout(() => this.declareEmpireWars(), this.scaleDelay(500, 100, 600));
      } else if (!GAME.emp_enemies.includes(1) && ![GAME.char_data.empire].includes(1) &&
        (this.check_imp().includes(GAME.char_id) || this.check_imp2().includes(GAME.char_id) ||
          imp == GAME.char_id || aimp == GAME.char_id)) {
        GAME.socket.emit('ga', { a: 50, type: 7, target: 1 });
        window.setTimeout(() => this.declareEmpireWars(), this.scaleDelay(500, 100, 600));
      } else if (!GAME.emp_enemies.includes(2) && ![GAME.char_data.empire].includes(2) &&
        (this.check_imp().includes(GAME.char_id) || this.check_imp2().includes(GAME.char_id) ||
          imp == GAME.char_id || aimp == GAME.char_id)) {
        GAME.socket.emit('ga', { a: 50, type: 7, target: 2 });
        window.setTimeout(() => this.declareEmpireWars(), this.scaleDelay(500, 100, 600));
      } else if (!GAME.emp_enemies.includes(3) && ![GAME.char_data.empire].includes(3) &&
        (this.check_imp().includes(GAME.char_id) || this.check_imp2().includes(GAME.char_id) ||
          imp == GAME.char_id || aimp == GAME.char_id)) {
        GAME.socket.emit('ga', { a: 50, type: 7, target: 3 });
        window.setTimeout(() => this.declareEmpireWars(), this.scaleDelay(500, 100, 600));
      } else if (!GAME.emp_enemies.includes(4) && ![GAME.char_data.empire].includes(4) &&
        (this.check_imp().includes(GAME.char_id) || this.check_imp2().includes(GAME.char_id) ||
          imp == GAME.char_id || aimp == GAME.char_id)) {
        GAME.socket.emit('ga', { a: 50, type: 7, target: 4 });
        window.setTimeout(() => this.declareEmpireWars(), this.scaleDelay(500, 100, 600));
      } else {
        window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
      }
    } else {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
    }
  },

  // ============================================
  // MOVEMENT
  // ============================================

  zejdz() {
    GAME.socket.emit('ga', { a: 16 });
    window.setTimeout(() => this.teleport(), this.scaleDelay(2000, 300, 2500));
  },

  go() {
    let x = GAME.char_data.x;
    let y = GAME.char_data.y;

    if (x == 14 && y == 14 && PVP.loc === 1) {
      this.zejdz(); PVP.g = 2; PVP.tele = true;
    } else if (x == 14 && y == 14 && PVP.loc === 2) {
      this.zejdz(); PVP.g = 3; PVP.tele = true;
    } else if (x == 14 && y == 14 && PVP.loc === 3) {
      this.zejdz(); PVP.g = 4; PVP.tele = true;
    } else if (x == 14 && y == 14 && PVP.loc === 4) {
      this.zejdz(); PVP.g = 1; PVP.tele = true;
    } else if (PVP.loc === 7) {
      this.zejdz(); PVP.tele = true;
    } else if (x == 8 && y == 4 && PVP.loc == 4 || x == 8 && y == 6 && PVP.loc == 4 ||
      x == 12 && y == 7 && PVP.loc == 1 || x == 12 && y == 9 && PVP.loc == 1 ||
      x == 4 && y == 8 && PVP.loc == 1 || x == 4 && y == 10 && PVP.loc == 1 ||
      x == 7 && y == 13 && PVP.loc == 3 || x == 8 && y == 5 && PVP.loc == 2 ||
      x == 8 && y == 7 && PVP.loc == 2 || x == 3 && y == 9 && PVP.loc == 5) {
      this.go_down();
    } else if (x == 8 && y == 5 && PVP.loc == 4 || x == 8 && y == 7 && PVP.loc == 4) {
      this.go_left();
    } else if (x == 5 && y == 11 && PVP.loc == 1 || x == 5 && y == 10 && PVP.loc == 1 ||
      x == 5 && y == 9 && PVP.loc == 1 || x == 5 && y == 8 && PVP.loc == 1) {
      this.go_up();
    } else if (x == 8 && y == 6 && PVP.loc == 2 || x == 8 && y == 8 && PVP.loc == 2) {
      this.go_right();
    } else if (x == 2 && y == 11 && PVP.loc == 3) {
      this.cofanie();
    } else if (x == 7 && y == 7 && PVP.loc == 6 && PVP.dogory || x == 9 && y == 7 && PVP.loc == 6 && PVP.dogory) {
      this.prawodol();
    } else if (x == 8 && y == 8 && PVP.loc == 6 && PVP.dogory || x == 10 && y == 8 && PVP.loc == 6 && PVP.dogory) {
      this.prawogora();
    } else if (x < 14 && y % 2 == 0 && PVP.loc < 5 || x < 15 && y % 2 !== 0 && PVP.loc == 6 ||
      x < 11 && y % 2 == 0 && PVP.loc == 5) {
      this.go_right();
    } else if (y % 2 !== 0 && x > 2 && PVP.loc < 6 || x > 1 && y % 2 == 0 && PVP.loc == 6 || x == 2 && PVP.loc == 6) {
      this.go_left();
    } else if (x == 14 || x == 2 && PVP.loc < 5 || x == 15 && PVP.loc == 6 || x == 1 ||
      x == 11 && PVP.loc == 5 || x == 2 && PVP.loc == 5) {
      this.go_down();
    } else {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
    }
  },

  teleport() {
    if (PVP.tele) {
      GAME.socket.emit('ga', { a: 50, type: 5, e: PVP.g });
      window.setTimeout(() => this.start(), this.scaleDelay(2000, 300, 2500));
      PVP.tele = false;
    } else {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
    }
  },

  check_location() {
    if (GAME.char_data.loc == 351) { PVP.loc = 4; }
    else if (GAME.char_data.loc == 350) { PVP.loc = 3; }
    else if (GAME.char_data.loc == 349) { PVP.loc = 2; }
    else if (GAME.char_data.loc == 348) { PVP.loc = 1; }
    else { PVP.loc = 7; }
    window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
  },

  // Direction → expected delta(x,y). Matches bigcode dir codes.
  // 1=down 2=up 3=down-right 5=up-right 7=right 8=left
  _moveDelta(dir) {
    switch (dir) {
      case 1: return { dx: 0, dy: 1 };
      case 2: return { dx: 0, dy: -1 };
      case 3: return { dx: 1, dy: 1 };
      case 5: return { dx: 1, dy: -1 };
      case 7: return { dx: 1, dy: 0 };
      case 8: return { dx: -1, dy: 0 };
      default: return { dx: 0, dy: 0 };
    }
  },

  // Movement cadence. Bigcode move_speed=250 is the animation duration, not a
  // hard rate limit — empirically the server accepts same-direction emits at
  // ~30ms intervals (observed: 5 tiles in 282ms). What actually gets dropped is
  // a *direction change* sent too soon after another emit (manifested as the
  // y=11 loop: dir=7 spam landed, follow-up dir=1 was emitted ~32ms later and
  // ignored). So we use two cooldowns:
  //   - TURN: 250ms when the new direction differs from the previous emit.
  //   - SAME: scales with the speed slider (60-250ms) so it actually does
  //     something — was the bug user reported after the first fix.
  MOVE_COOLDOWN_TURN_MS: 250,
  MOVE_COOLDOWN_SAME_BASE_MS: 250,
  MOVE_COOLDOWN_SAME_MIN_MS: 60,

  getMoveCooldown(dir) {
    const lastDir = PVP._lastMoveDir;
    if (lastDir !== undefined && lastDir !== dir) return this.MOVE_COOLDOWN_TURN_MS;
    const mul = this.getSpeedMultiplier(); // speed/50
    return Math.min(
      this.MOVE_COOLDOWN_TURN_MS,
      Math.max(this.MOVE_COOLDOWN_SAME_MIN_MS, Math.round(this.MOVE_COOLDOWN_SAME_BASE_MS / mul))
    );
  },

  /**
   * Emit one movement and wait for char_data to actually update (not just for
   * #loader to vanish). Eliminates the race where go()/cofanie() re-reads stale
   * char_data and re-issues the same direction.
   *
   * Respects MOVE_COOLDOWN_MS — if previous emit was less than that ago, we
   * defer this one. Polls every 15ms up to 600ms after emit; calls cb once
   * position changes or budget expires.
   */
  moveAndVerify(dir, cb) {
    if (PVP.stop) return;

    // Defer if previous emit was too recent. Cooldown depends on whether this
    // is a direction change (sticky 250ms) or continuation (speed-scaled).
    const requiredCd = this.getMoveCooldown(dir);
    const now = performance.now();
    const since = now - (PVP._lastMoveT || 0);
    if (since < requiredCd) {
      window.setTimeout(() => this.moveAndVerify(dir, cb), requiredCd - since);
      return;
    }

    const startX = GAME.char_data.x;
    const startY = GAME.char_data.y;
    const { dx, dy } = this._moveDelta(dir);
    const targetX = startX + dx;
    const targetY = startY + dy;

    PVP._lastMoveT = now;
    PVP._lastMoveDir = dir;
    GAME.emitOrder({ a: 4, dir: dir, vo: GAME.map_options.vo });

    const t0 = now;
    const TIMEOUT_MS = 600;
    const poll = () => {
      if (PVP.stop) return;
      const cx = GAME.char_data.x;
      const cy = GAME.char_data.y;
      if (cx === targetX && cy === targetY) {
        // Tiny settle delay so subsequent DOM (player_list) is fresh.
        window.setTimeout(cb, 10);
        return;
      }
      if (cx !== startX || cy !== startY) {
        // Combat push / unexpected — exit, let go() re-evaluate.
        window.setTimeout(cb, 10);
        return;
      }
      if (performance.now() - t0 > TIMEOUT_MS) {
        cb();
        return;
      }
      window.setTimeout(poll, 15);
    };
    window.setTimeout(poll, 15);
  },

  /**
   * Cofanie — z 2|11 wracamy w prawo aż do x=7, potem schodzimy w dół.
   * Każdy krok czeka na faktyczną zmianę char_data.x (brak spamu emitów).
   */
  cofanie() {
    if (PVP.stop) return;
    PVP.x = GAME.char_data.x;
    if (PVP.x >= 7) {
      this.go_down();
      return;
    }
    this.moveAndVerify(7, () => this.cofanie());
  },

  prawodol() {
    this.moveAndVerify(3, () => this.start());
  },

  prawogora() {
    this.moveAndVerify(5, () => this.start());
  },

  go_up() {
    this.moveAndVerify(2, () => this.start());
  },

  go_down() {
    this.moveAndVerify(1, () => this.start());
  },

  go_left() {
    this.moveAndVerify(8, () => this.start());
  },

  go_right() {
    this.moveAndVerify(7, () => this.start());
  },

  /**
   * Legacy fallback. Kept for any callers that still use it (none in current pvp.js,
   * but glebia.js / other modules may share the file).
   */
  waitForLoad(callback) {
    if (PVP.stop) return;

    if (GAME.is_loading || $("#loader").is(":visible")) {
      window.setTimeout(() => this.waitForLoad(callback), 50);
    } else {
      const walkDelay = Math.max(20, 200 / this.getSpeedMultiplier());
      window.setTimeout(callback, walkDelay);
    }
  },

  // ============================================
  // UTILITY
  // ============================================

  check() {
    if ($("#ewar_list").text().includes("--:--:--")) {
      window.setTimeout(() => this.check(), this.scaleDelay(300, 80, 400));
    } else {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
    }
  },

  check2() {
    if (this.checkBuffsAndSSJ()) {
      window.setTimeout(() => this.check2(), 1800);
    } else {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
    }
  },

  dec_wars() {
    let wars = $("#pvp_Panel input[name=pvp_capt]").val();
    let count = wars ? wars.split(";").length : 0;
    if (count > 0 && PVP.autoClanWars && GAME.char_data.klan_id != 0 && GAME.char_data.klan_rent == 0 && GAME.clan_wars.length < count) {
      GAME.socket.emit('ga', { a: 39, type: 24, shorts: wars });
    }
    window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
  },

  getSpeedMultiplier() {
    // Read speed from UI input or PVP.speed
    let speed = parseInt($('#pvp_Panel input[name=speed_capt]').val()) || PVP.speed;
    if (speed < 10) speed = 10;
    if (speed > 500) speed = 500;
    // Sync back to state
    PVP.speed = speed;
    PVP.speedMultiplier = speed;
    return speed / 50;
  },

  saveSpeed() {
    localStorage.setItem('pvp_speed', PVP.speed);
  },

  loadSpeed() {
    const saved = localStorage.getItem('pvp_speed');
    if (saved) {
      let val = parseInt(saved) || 100;
      if (val < 10) val = 10;
      if (val > 500) val = 500;
      PVP.speed = val;
      PVP.speedMultiplier = val;
    }
  },

  /**
   * Get attack delay based on speed setting.
   * Speed 10 = 200ms, Speed 50 = 100ms, Speed 100 = 50ms, Speed 200 = 25ms
   * Formula: 1000 / (speed / 5) = 5000 / speed
   */
  getAttackDelay() {
    const speed = this.getSpeedMultiplier() * 50; // Get actual speed value
    // Base: 50-200ms depending on speed
    // speed 10 -> 200ms, speed 50 -> 100ms, speed 100 -> 50ms
    return Math.max(30, Math.min(200, Math.round(5000 / speed)));
  },

  /**
   * Get max wait time for is_loading check.
   * Higher speed = shorter wait.
   */
  getLoadingWait() {
    const speed = this.getSpeedMultiplier() * 50;
    // speed 10 -> 80ms, speed 50 -> 50ms, speed 100 -> 30ms
    return Math.max(20, Math.min(80, Math.round(2500 / speed)));
  },

  // Generic speed-aware delay scaler with floor/ceiling guards.
  scaleDelay(baseMs, minMs, maxMs) {
    const mul = this.getSpeedMultiplier();
    return Math.max(minMs, Math.min(maxMs, Math.round(baseMs / mul)));
  },

  // High-speed bypass: above this threshold we skip is_loading polling.
  shouldBypassLoading() {
    return (PVP.speed || 50) >= 150;
  },

  // Idempotent socket listener for fight responses (a:7) and ghost detection.
  // - a:7 → flip _awaitingFight so attackLoop can fire next attack without fixed delay.
  // - error 55 ("player not on tile") → mark last target as ghost so the next
  //   attackLoop pass skips them and tries the rest of the tile instead of
  //   burning 20 retries on a player who already walked off.
  //
  // Re-binds when GAME.socket reference changes (socket.io reconnect creates a
  // new manager/socket object). Otherwise after a reconnect the listener wires
  // up to the dead socket and _awaitingFight never clears → wasted attack ticks.
  _bindGrListener() {
    if (!GAME || !GAME.socket) return;
    if (PVP._grBoundSocket === GAME.socket) return;
    PVP._grBoundSocket = GAME.socket;
    GAME.socket.on('gr', (res) => {
      if (!res) return;
      // Ghost detection — error 55 can land in either field depending on flow.
      if ((res.e === 55 || res.me === 55) && PVP._lastAttackTarget) {
        if (!PVP._tileGhosts) PVP._tileGhosts = new Set();
        PVP._tileGhosts.add(PVP._lastAttackTarget);
        PVP._awaitingFight = false;
        return;
      }
      if (res.a === 7 && !res.game_progress) {
        PVP._awaitingFight = false;
        PVP._lastFightRes = res;
      }
    });
    console.log('[AFO_PVP] gr listener bound (event-driven attack)');
  },

  // ============================================
  // PANEL HANDLERS
  // ============================================

  bindHandlers() {
    $('#pvp_Panel .pvp_pvp').click(() => {
      if (PVP.stop) {
        $(".pvp_pvp .pvp_status").removeClass("red").addClass("green").html("On");
        PVP.stop = false;
        PVP._startCallCount = 0; // reset diagnostic counter for new ON cycle
        PVP._isLoadingRetries = 0;
        PVP._attackLoadingRetries = 0;
        PVP._lastTick = Date.now(); // prime watchdog
        this.start();
        // Stop other modules
        RESP.stop = true; RES.stop = true; LPVM.Stop = true; CODE.stop = true;
        $(".code_code .code_status, .lpvm_lpvm .lpvm_status, .res_res .res_status, .resp_resp .resp_status")
          .removeClass("green").addClass("red").html("Off");
      } else {
        $(".pvp_pvp .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.stop = true;
      }
    });

    $('#pvp_Panel .pvp_rb_avoid').click(() => {
      if (PVP.higherRebornAvoid) {
        $(".pvp_rb_avoid .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.higherRebornAvoid = false;
      } else {
        $(".pvp_rb_avoid .pvp_status").removeClass("red").addClass("green").html("On");
        PVP.higherRebornAvoid = true;
      }
    });

    $('#pvp_Panel .pvp_Code').click(() => {
      if (PVP.code) {
        $(".pvp_Code .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.code = false;
        $("#pvp_Panel .pvpCODE_konto").hide();
      } else {
        $(".pvp_Code .pvp_status").removeClass("red").addClass("green").html("On");
        PVP.code = true;
        $("#pvp_Panel .pvpCODE_konto").show();
      }
    });

    $('#pvp_Panel .pvpCODE_konto').click(() => {
      if (PVP.kontoTP) {
        $(".pvpCODE_konto .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.kontoTP = false; PVP.codeTP = false;
      } else {
        $(".pvpCODE_konto .pvp_status").removeClass("red").addClass("green").html("On");
        PVP.kontoTP = true; PVP.codeTP = true;
      }
    });

    $('#pvp_Panel .pvp_WI').click(() => {
      if (PVP.autoWars) {
        $(".pvp_WI .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.autoWars = false;
      } else {
        $(".pvp_WI .pvp_status").removeClass("red").addClass("green").html("On");
        PVP.autoWars = true;
      }
    });

    $('#pvp_Panel .pvp_WK').click(() => {
      if (PVP.autoClanWars) {
        $(".pvp_WK .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.autoClanWars = false;
      } else {
        $(".pvp_WK .pvp_status").removeClass("red").addClass("green").html("On");
        PVP.autoClanWars = true;
      }
    });

    if (GAME.server != '20') {
      $('#pvp_Panel .pvp_buff_imp').click(() => {
        if (PVP.buff_imp) {
          $(".pvp_buff_imp .pvp_status").removeClass("green").addClass("red").html("Off");
          PVP.buff_imp = false;
        } else {
          $(".pvp_buff_imp .pvp_status").removeClass("red").addClass("green").html("On");
          PVP.buff_imp = true;
        }
      });

      $('#pvp_Panel .pvp_buff_clan').click(() => {
        if (PVP.buff_clan) {
          $(".pvp_buff_clan .pvp_status").removeClass("green").addClass("red").html("Off");
          PVP.buff_clan = false;
        } else {
          $(".pvp_buff_clan .pvp_status").removeClass("red").addClass("green").html("On");
          PVP.buff_clan = true;
        }
      });
    }

    // Speed input handler - sync PVP.speed, clamp to 10-500, persist.
    $('#pvp_Panel input[name=speed_capt]').on('input change', (e) => {
      let val = parseInt($(e.target).val()) || 100;
      if (val < 10) val = 10;
      if (val > 500) val = 500;
      if (String(val) !== $(e.target).val()) $(e.target).val(val);
      PVP.speed = val;
      PVP.speedMultiplier = val;
      this.saveSpeed();
    });

    // Load saved values
    this.loadSpeed();
    $("#pvp_Panel input[name=pvp_capt]").val(PVP.clan_list);
    $("#pvp_Panel input[name=speed_capt]").val(PVP.speed);

    this._startWatchdog();

    console.log('[AFO_PVP] Handlers bound');
  },

  // Watchdog — detects silent freeze (chain died without exception/log) and
  // recovers by flipping PVP.stop briefly so any zombie setTimeout exits via
  // the existing `if (PVP.stop) return;` guards, then restarting cleanly.
  //
  // Threshold (60s) is intentionally very conservative: max legitimate delay
  // anywhere in pvp.js is ~3s (cooldown wait), and start() ticks at sub-second
  // intervals normally. 60s without a tick is genuinely broken.
  //
  // Restart only proceeds if the UI is still showing "On" — guards against
  // user toggling off during the 1s recovery gap (in which case we leave it off).
  _startWatchdog() {
    if (PVP._watchdogInterval) clearInterval(PVP._watchdogInterval);
    PVP._watchdogInterval = setInterval(() => {
      if (PVP.stop) return;
      const last = PVP._lastTick || 0;
      if (!last) return;
      const staleMs = Date.now() - last;
      if (staleMs < 60000) return;

      console.warn('[AFO_PVP:watchdog] freeze detected — restarting', {
        staleMs,
        case: PVP.caseNumber,
        awaiting: PVP._awaitingFight,
        attackRetries: PVP.attackRetries,
        tileRetries: PVP.tileRetries,
        isLoadingRetries: PVP._isLoadingRetries,
        attackLoadingRetries: PVP._attackLoadingRetries,
        is_loading: typeof GAME !== 'undefined' ? GAME.is_loading : undefined,
        loaderVisible: $("#loader").is(":visible"),
        x: typeof GAME !== 'undefined' && GAME.char_data ? GAME.char_data.x : undefined,
        y: typeof GAME !== 'undefined' && GAME.char_data ? GAME.char_data.y : undefined,
        loc: typeof GAME !== 'undefined' && GAME.char_data ? GAME.char_data.loc : undefined,
        socketConnected: typeof GAME !== 'undefined' && GAME.socket ? GAME.socket.connected : undefined
      });

      // Reset _lastTick first to prevent immediate re-trigger on next interval.
      PVP._lastTick = Date.now();

      // Stop-flip restart — zombie setTimeouts will exit via PVP.stop guard
      // during the 1s gap. Then we reset per-cycle state and restart.
      PVP.stop = true;
      window.setTimeout(() => {
        // Only restart if user still wants it on (UI shows green "On").
        if (!$('#pvp_Panel .pvp_pvp .pvp_status').hasClass('green')) {
          console.warn('[AFO_PVP:watchdog] UI off, not restarting');
          return;
        }
        // Reset chain state — start clean.
        PVP.caseNumber = 0;
        PVP._awaitingFight = false;
        PVP.attackRetries = 0;
        PVP.tileRetries = 0;
        PVP.lastEnemyCount = -1;
        PVP._isLoadingRetries = 0;
        PVP._attackLoadingRetries = 0;
        PVP._cleanupPasses = 0;
        PVP._myClicksThisCycle = 0;
        PVP._tileGhosts = new Set();
        PVP._startCallCount = 0;
        PVP.stop = false;
        PVP._lastTick = Date.now();
        AFO_PVP.start();
        console.warn('[AFO_PVP:watchdog] restarted');
      }, 1000);
    }, 10000);
    console.log('[AFO_PVP] watchdog started (60s freeze threshold)');
  }
};

// Attach methods to global PVP object for backward compatibility
PVP.checkBuffsAndSSJ = () => AFO_PVP.checkBuffsAndSSJ();
PVP.checkkkk = PVP.checkBuffsAndSSJ; // Legacy alias
PVP.start = () => AFO_PVP.start();
PVP.action = () => AFO_PVP.action();

// Export
window.AFO_PVP = AFO_PVP;
console.log('[AFO] PVP module loaded');
