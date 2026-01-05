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
      if (GLEBIA.stop) {
        $(".glebia_toggle .glebia_status").removeClass("red").addClass("green").html("On");
        GLEBIA.stop = false;

        // Reset all attack state for clean start
        GLEBIA.isAttacking = false;
        GLEBIA.attackRetries = 0;
        GLEBIA.tileRetries = 0;
        GLEBIA.lastEnemyCount = -1;
        GLEBIA.caseNumber = 0;

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

    // Speed input handler
    $('#glebia_Panel .glebia_input input').change((e) => {
      GLEBIA.speed = parseInt($(e.target).val()) || 50;
      this.saveSpeed();
    });

    // Initially hide konto button
    $('#glebia_Panel .glebia_konto').hide();

    // Load saved speed
    this.loadSpeed();
    $('#glebia_Panel input[name=glebia_speed]').val(GLEBIA.speed);

    console.log('[AFO_GLEBIA] Handlers bound');
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

  saveSpeed() {
    localStorage.setItem('glebia_speed', GLEBIA.speed);
  },

  loadSpeed() {
    const saved = localStorage.getItem('glebia_speed');
    if (saved) {
      GLEBIA.speed = parseInt(saved) || 50;
    }
  },

  // ============================================
  // MAIN LOOP
  // ============================================

  start() {
    if (GLEBIA.stop) return;

    if (!GAME.is_loading) {
      this.action();
    } else {
      setTimeout(() => this.start(), GLEBIA.wait / this.getSpeedMultiplier());
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
      this.przejdz();
      setTimeout(() => { this.move(7); }, 1000);
    } else if (x === 1 && y === 1 && GLEBIA.loc === 2 && GLEBIA.move3) {
      this.przejdz();
      setTimeout(() => { this.move(7); }, 1000);
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
    const y = GAME.char_data.y;
    if (y <= 1) {
      setTimeout(() => this.start(), GLEBIA.wait);
    } else {
      GAME.emitOrder({ a: 4, dir: 6, vo: GAME.map_options.vo });
      setTimeout(() => { this.cofanie(); }, 50);
    }
  },

  cofanie2() {
    const y = GAME.char_data.y;
    if (y <= 2) {
      setTimeout(() => this.start(), GLEBIA.wait);
    } else {
      GAME.emitOrder({ a: 4, dir: 2, vo: GAME.map_options.vo });
      GLEBIA.move1 = true;
      setTimeout(() => { this.cofanie2(); }, 50);
    }
  },

  move(direction) {
    const valid = [2, 1, 8, 7, 5, 4, 3];
    if (!valid.includes(direction)) return;

    GAME.emitOrder({ a: 4, dir: direction, vo: GAME.map_options.vo });

    // Wait for map to load before continuing (prevents skipping tiles)
    this.waitForLoad(() => {
      setTimeout(() => this.start(), GLEBIA.wait);
    });
  },

  /**
   * Wait for game loading to complete before executing callback
   * Speed affects how long to wait after loading (walking speed)
   */
  waitForLoad(callback) {
    if (GLEBIA.stop) return;

    if (GAME.is_loading || $("#loader").is(":visible")) {
      setTimeout(() => this.waitForLoad(callback), 50);
    } else {
      // Speed affects walking delay: higher speed = shorter delay = faster walking
      // Base: 200ms at speed 10, ~20ms at speed 100
      const walkDelay = Math.max(20, 200 / this.getSpeedMultiplier());
      setTimeout(callback, walkDelay);
    }
  },

  przejdz() {
    GAME.emitOrder({ a: 6, tpid: 0 });
    setTimeout(() => GLEBIA.stop, 1000);
    GLEBIA.move3 = false;
    GLEBIA.move1 = false;
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
          return setTimeout(() => this.check_players(), 150);
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

    this.attackLoop(startX, startY);
  },

  attackLoop(startX, startY) {
    // Check if stopped
    if (GLEBIA.stop) return;

    // CRITICAL: If game is loading/processing, wait and retry - don't send new actions
    if (GAME.is_loading || $("#loader").is(":visible")) {
      setTimeout(() => this.attackLoop(startX, startY), 100);
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

    // Load more players if available - wait after clicking for them to load
    if ($("#player_list_con").find("[data-option=load_more_players]").length != 0) {
      $("#player_list_con").find("[data-option=load_more_players]").click();
      // Wait for players to load before continuing
      setTimeout(() => this.attackLoop(startX, startY), 300);
      return;
    }

    // Count attackable enemies (only those with visible attack button)
    let enemies = $("#player_list_con").find(".player button[data-quick=1]:not(.initial_hide_forced)");
    const enemyCount = enemies.length;

    // No enemies - exit attack mode and continue main loop
    if (enemyCount === 0) {
      GLEBIA.attackRetries = 0;
      GLEBIA.tileRetries = 0;
      GLEBIA.isAttacking = false;
      GLEBIA.caseNumber++;
      setTimeout(() => this.start(), GLEBIA.wait);
      return;
    }

    // Check if we're making progress (enemy count decreased)
    if (GLEBIA.lastEnemyCount === enemyCount) {
      GLEBIA.attackRetries++;
      GLEBIA.tileRetries++;

      // Too many retries on this tile - likely all remaining enemies have cooldown
      // Give up and move on to prevent infinite loop
      if (GLEBIA.tileRetries > 15) {
        console.log('[GLEBIA] Max tile retries reached, moving on');
        GLEBIA.attackRetries = 0;
        GLEBIA.tileRetries = 0;
        GLEBIA.isAttacking = false;
        GLEBIA.caseNumber++;
        setTimeout(() => this.start(), GLEBIA.wait);
        return;
      }

      // Short-term retry - wait a bit for server response
      if (GLEBIA.attackRetries > 5) {
        GLEBIA.attackRetries = 0;
        setTimeout(() => this.attackLoop(startX, startY), 500);
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

    // Attack first enemy
    enemies.eq(0).click();

    // Continue attack loop - FIXED 110ms delay (ASAP, speed doesn't affect attacks)
    setTimeout(() => this.attackLoop(startX, startY), 110);
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
