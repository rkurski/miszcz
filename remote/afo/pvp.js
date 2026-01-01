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
    if (!PVP.stop && !GAME.is_loading) {
      if ($("#player_list_con").find("[data-option=load_more_players]").length != 0) {
        $("#player_list_con").find("[data-option=load_more_players]").click();
      }
      this.action();
    } else if (GAME.is_loading) {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
    }
  },

  action() {
    switch (PVP.caseNumber) {
      case 0: PVP.caseNumber++; this.check_position_x(); break;
      case 1: PVP.caseNumber++; this.check_position_y(); break;
      case 2: PVP.caseNumber++; this.check(); break;
      case 3: PVP.caseNumber++; this.check_players(); break;
      case 4: PVP.caseNumber++; this.kill_players(); break;
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

    this.attackLoop();
  },

  attackLoop() {
    // Check if stopped
    if (PVP.stop) return;

    // CRITICAL: If game is loading/processing, wait and retry - don't send new actions
    if (GAME.is_loading || $("#loader").is(":visible")) {
      window.setTimeout(() => this.attackLoop(), 100);
      return;
    }

    const currentX = GAME.char_data.x;
    const currentY = GAME.char_data.y;

    // Position changed - exit attack mode and continue main loop
    if (currentX !== PVP.startX || currentY !== PVP.startY) {
      PVP.attackRetries = 0;
      window.setTimeout(() => this.start(), PVP.wait);
      return;
    }

    // Load more players if available
    if ($("#player_list_con").find("[data-option=load_more_players]").length != 0) {
      $("#player_list_con").find("[data-option=load_more_players]").click();
    }

    // Count attackable enemies
    let enemies = $("#player_list_con").find(".player button[data-quick=1]:not(.initial_hide_forced)");
    const enemyCount = enemies.length;

    // No enemies - exit attack mode and continue main loop
    if (enemyCount === 0) {
      PVP.attackRetries = 0;
      kom_clear();
      window.setTimeout(() => this.start(), PVP.wait);
      return;
    }

    // Check if we're making progress (enemy count decreased)
    if (PVP.lastEnemyCount === enemyCount) {
      PVP.attackRetries++;

      // Too many retries with no progress - probably lag, wait longer and try again
      if (PVP.attackRetries > 5) {
        PVP.attackRetries = 0;
        // Wait longer for server to catch up, then try again
        window.setTimeout(() => this.attackLoop(), 500);
        return;
      }
    } else {
      // Making progress, reset retries
      PVP.attackRetries = 0;
    }

    PVP.lastEnemyCount = enemyCount;

    // Attack first enemy
    enemies.eq(0).click();

    // Continue attack loop with delay
    const delay = Math.max(110, PVP.pvpDelay / this.getSpeedMultiplier());
    window.setTimeout(() => this.attackLoop(), delay);
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
        window.setTimeout(() => this.declareEmpireWars(), 500);
      } else if (!GAME.emp_enemies.includes(1) && ![GAME.char_data.empire].includes(1) &&
        (this.check_imp().includes(GAME.char_id) || this.check_imp2().includes(GAME.char_id) ||
          imp == GAME.char_id || aimp == GAME.char_id)) {
        GAME.socket.emit('ga', { a: 50, type: 7, target: 1 });
        window.setTimeout(() => this.declareEmpireWars(), 500);
      } else if (!GAME.emp_enemies.includes(2) && ![GAME.char_data.empire].includes(2) &&
        (this.check_imp().includes(GAME.char_id) || this.check_imp2().includes(GAME.char_id) ||
          imp == GAME.char_id || aimp == GAME.char_id)) {
        GAME.socket.emit('ga', { a: 50, type: 7, target: 2 });
        window.setTimeout(() => this.declareEmpireWars(), 500);
      } else if (!GAME.emp_enemies.includes(3) && ![GAME.char_data.empire].includes(3) &&
        (this.check_imp().includes(GAME.char_id) || this.check_imp2().includes(GAME.char_id) ||
          imp == GAME.char_id || aimp == GAME.char_id)) {
        GAME.socket.emit('ga', { a: 50, type: 7, target: 3 });
        window.setTimeout(() => this.declareEmpireWars(), 500);
      } else if (!GAME.emp_enemies.includes(4) && ![GAME.char_data.empire].includes(4) &&
        (this.check_imp().includes(GAME.char_id) || this.check_imp2().includes(GAME.char_id) ||
          imp == GAME.char_id || aimp == GAME.char_id)) {
        GAME.socket.emit('ga', { a: 50, type: 7, target: 4 });
        window.setTimeout(() => this.declareEmpireWars(), 500);
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
    window.setTimeout(() => this.teleport(), 2000);
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
      window.setTimeout(() => this.start(), 2000);
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

  cofanie() {
    PVP.x = GAME.char_data.x;
    if (PVP.x >= 7) {
      this.go_down();
    } else {
      GAME.emitOrder({ a: 4, dir: 7, vo: GAME.map_options.vo });
      window.setTimeout(() => this.cofanie(), 150);
    }
  },

  prawodol() {
    GAME.emitOrder({ a: 4, dir: 3, vo: GAME.map_options.vo });
    window.setTimeout(() => this.start(), PVP.wait2 / this.getSpeedMultiplier());
  },

  prawogora() {
    GAME.emitOrder({ a: 4, dir: 5, vo: GAME.map_options.vo });
    window.setTimeout(() => this.start(), PVP.wait2 / this.getSpeedMultiplier());
  },

  go_up() {
    GAME.emitOrder({ a: 4, dir: 2, vo: GAME.map_options.vo });
    window.setTimeout(() => this.start(), PVP.wait2 / this.getSpeedMultiplier());
  },

  go_down() {
    GAME.emitOrder({ a: 4, dir: 1, vo: GAME.map_options.vo });
    window.setTimeout(() => this.start(), PVP.wait2 / this.getSpeedMultiplier());
  },

  go_left() {
    GAME.emitOrder({ a: 4, dir: 8, vo: GAME.map_options.vo });
    window.setTimeout(() => this.start(), PVP.wait2 / this.getSpeedMultiplier());
  },

  go_right() {
    GAME.emitOrder({ a: 4, dir: 7, vo: GAME.map_options.vo });
    window.setTimeout(() => this.start(), PVP.wait2 / this.getSpeedMultiplier());
  },

  // ============================================
  // UTILITY
  // ============================================

  check() {
    if ($("#ewar_list").text().includes("--:--:--")) {
      window.setTimeout(() => this.check(), 300);
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
    let speed = PVP.speedMultiplier;
    if (speed < 10) speed = 10;
    if (speed > 500) speed = 500;
    if ($("#pvp_Panel input[name=speed_capt]").val() == '') speed = 50;
    return speed / 50;
  },

  // ============================================
  // PANEL HANDLERS
  // ============================================

  bindHandlers() {
    $('#pvp_Panel .pvp_pvp').click(() => {
      if (PVP.stop) {
        $(".pvp_pvp .pvp_status").removeClass("red").addClass("green").html("On");
        PVP.stop = false;
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

    // Load saved values
    $("#pvp_Panel input[name=pvp_capt]").val(PVP.clan_list);
    $("#pvp_Panel input[name=speed_capt]").val(PVP.speed);

    console.log('[AFO_PVP] Handlers bound');
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
