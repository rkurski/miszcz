/**
 * ============================================================================
 * AFO - Respawn/PVM Module
 * ============================================================================
 * 
 * RESP system - auto-fighting mobs on spawn, senzu management, bless checking.
 * Uses the global RESP state object from afo/state.js
 * 
 * ============================================================================
 */

const AFO_RESP = {

  // Item data from items.json (loaded on init, fallback to inline if not loaded)
  itemData: null,

  // ============================================
  // MAIN RESPAWN LOOP
  // ============================================

  check() {
    let imp = $("#leader_player").find("[data-option=show_player]").attr("data-char_id");
    let emp = GAME.char_data.empire;
    let buff = $(".emp_buff .pull-right").find("button").attr("data-option") == "activate_emp_buff";
    let buff_id = $(".emp_buff .pull-right").find("button").attr("data-buff");
    let who_win = $("#gne_satus").text().includes("ZŁO");
    let abut = $("#clan_buffs").find(`button[data-option="activate_war_buff"]`);
    let isDisabled = $("#clan_buffs").find(`button[data-option="activate_war_buff"]`).parents("tr").hasClass("disabled");

    if (GAME.char_data.pr <= this.min_pa()) {
      this.useSenzu();
      return true;
    } else if (RESP.checkOST && $("#doubler_bar").css("display") === "none") {
      GAME.socket.emit('ga', { a: 12, type: 14, iid: GAME.quick_opts.sub[RESP.jaka].id, page: GAME.ekw_page, am: 1 });
      return true;
    } else if (RESP.checkOST && $('#doubler_status').text() <= '00:00:03') {
      return true;
    } else if ((!RESP.checkOST && RESP.checkOST_timer <= GAME.getTime()) || (RESP.jaka == 1 && RESP.checkOST_timer <= GAME.getTime())) {
      RESP.checkOST_timer = GAME.getTime() + 60;
      return true;
    } else if (RESP.checkSSJ && GAME.quick_opts.ssj && $("#ssj_bar").css("display") === "none") {
      GAME.socket.emit('ga', { a: 18, type: 5, tech_id: GAME.quick_opts.ssj[0] });
      return true;
    } else if ($('#ssj_status').text() == "--:--:--" && GAME.quick_opts.ssj) {
      // FIX: Check '--:--:--' BEFORE time comparison (like PVP) and use setTimeout
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 18, type: 6 });
      }, 1500);
      return true;
    } else if (RESP.checkSSJ && $('#ssj_status').text() <= '00:00:03' && GAME.quick_opts.ssj) {
      return true;
    } else if ($("#train_uptime").find('.timer').length == 0 && !GAME.is_training && RESP.code) {
      GAME.socket.emit('ga', { a: 8, type: 2, stat: 1, duration: 1 });
      if (RESP.codeTP) {
        setTimeout(() => { GAME.socket.emit('ga', { a: 8, type: 5, multi: ':checked', apud: 'vzaaa' }); }, 1600);
      } else {
        setTimeout(() => { GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' }); }, 1600);
      }
      return true;
    } else if (GAME.is_training && $("#train_uptime").find('.timer').length == 0 && RESP.code) {
      if (RESP.codeTP) {
        setTimeout(() => { GAME.socket.emit('ga', { a: 8, type: 5, multi: ':checked', apud: 'vzaaa' }); }, 1600);
      } else {
        setTimeout(() => { GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' }); }, 1600);
      }
      return true;
    } else if (GAME.is_training && $("#train_uptime").find('.timer').length == 1 && RESP.code) {
      GAME.socket.emit('ga', { a: 8, type: 3 });
      return true;
    } else if (GAME.is_training && RESP.code) {
      GAME.socket.emit('ga', { a: 8, type: 3 });
      return true;
    } else if (imp == GAME.char_id && RESP.buff_imp && buff && buff_id < 4) {
      GAME.socket.emit('ga', { a: 50, type: 6, buff: buff_id });
      return true;
    } else if (imp == GAME.char_id && RESP.buff_imp && buff && buff_id < 7 && ((emp == 1 || emp == 3) && who_win)) {
      GAME.socket.emit('ga', { a: 50, type: 6, buff: buff_id });
      return true;
    } else if (imp == GAME.char_id && RESP.buff_imp && buff && buff_id < 7 && ((emp == 2 || emp == 4) && !who_win)) {
      GAME.socket.emit('ga', { a: 50, type: 6, buff: buff_id });
      return true;
    } else if ((RESP.buff_clan || RESP.buff_imp) && $("#server_time").text() > '00:05:00' && $("#server_time").text() < '01:00:00' && typeof RESP.loaded == 'undefined') {
      RESP.loaded = true;
      setTimeout(() => { GAME.socket.emit('ga', { a: 50, type: 0, empire: GAME.char_data.empire }); }, 300);
      setTimeout(() => { GAME.emitOrder({ a: 39, type: 0 }); }, 600);
      setTimeout(() => { GAME.emitOrder({ a: 39, type: 23 }); }, 900);
      return true;
    } else if (RESP.buff_clan && GAME.klan_data != undefined && abut.length && !isDisabled) {
      $(" .newBtn.activate_all_clan_buffs").click();
      return true;
    }
    return false;
  },

  min_pa() {
    if (GAME.char_data.doubler_rate && GAME.char_data.doubler_rate > 19) {
      let cal_sub = GAME.char_data.doubler_rate;
      let spawner = GAME.spawner[0];
      return cal_sub * this.MF() + parseInt(spawner);
    } else {
      return parseInt(GAME.spawner[0]);
    }
  },

  action() {
    if (!RESP.stop) {
      if (!this.check() && !this.check_bless()) {
        setTimeout(() => {
          if (this.MF() > 0) {
            this.fight();
          } else {
            this.go();
          }
        }, RESP.wait);
      } else {
        setTimeout(() => {
          this.action();
          kom_clear();
        }, 1700);
      }
    }
  },

  fight() {
    // OPTIMIZATION: Wait if game is loading (controlled by flag)
    if (RESP.useLoadingCheck && (GAME.is_loading || $("#loader").is(":visible"))) {
      window.setTimeout(() => this.fight(), 30);
      return;
    }

    if (RESP.reload) {
      setTimeout(() => { GAME.maploaded = false; GAME.prepareMap(); }, 300);
      RESP.reload = false;
    }

    let fm = GAME.field_mobs;
    let fmf = GAME.field_mf;
    let fmi = GAME.field_mob_id;

    // OPTIMIZATION: Debouncing - skip if emitting too fast
    if (RESP.useDebouncing) {
      const now = Date.now();
      if (now - RESP.lastEmitTime < RESP.minEmitInterval) {
        // Too soon, wait a bit and retry
        window.setTimeout(() => this.fight(), RESP.minEmitInterval - (now - RESP.lastEmitTime));
        return;
      }
      RESP.lastEmitTime = now;
    }

    if ((this.MF() > 0 && fmf[fmi - 1] < 0) && fm[fmi - 1].ranks[0] ||
      (this.MF() > 0 && fmf[fmi - 1] < 1 && fm[fmi - 1].ranks[1]) ||
      (this.MF() > 0 && fmf[fmi - 1] < 2 && fm[fmi - 1].ranks[2]) ||
      (this.MF() > 0 && fmf[fmi - 1] < 3 && fm[fmi - 1].ranks[3]) ||
      (this.MF() > 0 && fmf[fmi - 1] < 4 && fm[fmi - 1].ranks[4]) ||
      (this.MF() > 0 && fmf[fmi - 1] < 5 && fm[fmi - 1].ranks[5]) ||
      !RESP.multifight) {
      GAME.socket.emit('ga', { a: 7, order: 2, quick: 1, fo: GAME.map_options.ma });
    } else if (this.MF2() > 0) {
      GAME.socket.emit('ga', { a: 13, mob_num: fmi, fo: GAME.map_options.ma });
    } else {
      GAME.socket.emit('ga', { a: 444, max: GAME.spawner[0], ignore: GAME.spawner[1] });
    }

    // OPTIMIZATION: Wait for response before continuing (controlled by flag)
    if (RESP.useLoadingCheck) {
      this.waitForResponse(() => this.action());
    } else {
      this.action();  // Original behavior
    }
  },

  /**
   * Wait for game to finish processing before executing callback
   */
  waitForResponse(callback) {
    if (GAME.is_loading) {
      setTimeout(() => this.waitForResponse(callback), 20);
    } else {
      callback();
    }
  },

  reload_map() {
    RESP.reload = true;
  },

  MF() {
    let r = 0;
    if (GAME.field_mobs) {
      for (let i = 0; i < GAME.map_options.ma.length; i++) {
        if (GAME.map_options.ma[i] === 1) {
          r += parseInt(GAME.field_mobs[0].ranks[i]);
          if (GAME.field_mobs[1]) r += parseInt(GAME.field_mobs[1].ranks[i]);
          if (GAME.field_mobs[2]) r += parseInt(GAME.field_mobs[2].ranks[i]);
          if (GAME.field_mobs[3]) r += parseInt(GAME.field_mobs[3].ranks[i]);
        }
      }
    }
    return r;
  },

  MF2() {
    let r = 0;
    for (let i = 0; i < GAME.map_options.ma.length; i++) {
      if (GAME.field_mob_id < GAME.field_mobs.length && "ranks" in GAME.field_mobs[GAME.field_mob_id] && GAME.map_options.ma[i] === 1) {
        r += parseInt(GAME.field_mobs[GAME.field_mob_id].ranks[i]);
      }
    }
    return r;
  },

  go() {
    // OPTIMIZATION: Wait if game is loading (controlled by flag)
    if (RESP.useLoadingCheck && (GAME.is_loading || $("#loader").is(":visible"))) {
      window.setTimeout(() => this.go(), 30);
      return;
    }

    // OPTIMIZATION: Debouncing - skip if emitting too fast
    if (RESP.useDebouncing) {
      const now = Date.now();
      if (now - RESP.lastEmitTime < RESP.minEmitInterval) {
        window.setTimeout(() => this.go(), RESP.minEmitInterval - (now - RESP.lastEmitTime));
        return;
      }
      RESP.lastEmitTime = now;
    }

    GAME.socket.emit('ga', { a: 444, max: GAME.spawner[0], ignore: GAME.spawner[1] });

    // OPTIMIZATION: Wait for response before continuing (controlled by flag)
    if (RESP.useLoadingCheck) {
      this.waitForResponse(() => this.action());
    } else {
      this.action();  // Original behavior
    }
  },

  // ============================================
  // BLESS CHECKING
  // ============================================

  check_bless() {
    // Use items.json data if loaded, otherwise fallback to inline
    const blessItems = this.itemData?.blessItems || {
      1: { base: 1801, buff: 100 },
      2: { base: 1628, buff: 53 },
      3: { base: 1630, buff: 55 },
      4: { base: 1796, buff: 96 },
      5: { base: 1794, buff: 94 },
      6: { base: 1792, buff: 92 },
      7: { base: 1790, buff: 90 },
      8: { base: 1745, buff: 74 },
      9: { base: 1608, buff: 52 },
      10: { base: 1559, buff: 50 },
      11: { base: 1795, buff: 95 },
      12: { base: 1793, buff: 93 },
      13: { base: 1753, buff: 82 },
      14: { base: 1752, buff: 81 },
      15: { base: 1751, buff: 80 },
      16: { base: 1742, buff: 71 },
      17: { base: 1747, buff: 76 },
      18: { base: 1746, buff: 75 }
    };

    if (GAME.ekw_page != 10) {
      GAME.ekw_page = 10;
      GAME.socket.emit('ga', { a: 12, page: 10, used: 1 });
      return true;
    }

    // Check bless items 1-18
    for (let i = 1; i <= 18; i++) {
      let item = blessItems[i];
      let itemId = $(`#ekw_page_items`).find(`div[data-base_item_id=${item.base}]`).attr("data-item_id");
      let hasBuff = $(`#char_buffs`).find(`[data-buff=${item.buff}]`).length == 1;
      let buffExpiring = $(`#char_buffs`).find(`[data-buff=${item.buff}]`).find(".timer").text() <= '00:00:04';

      let needsBless = i <= 10 ? RESP.bless : true;

      if ((!hasBuff || buffExpiring) && RESP[`b${i}`] && itemId && needsBless) {
        GAME.socket.emit('ga', { a: 12, type: 14, iid: parseInt(itemId), page: 10 });
        return true;
      }
    }

    return false;
  },

  // ============================================
  // SENZU MANAGEMENT
  // ============================================

  getSenzu(type) {
    // Use items.json data if loaded, otherwise fallback to inline
    const senzuIdData = this.itemData?.senzuIds || {
      SENZU_BLUE: 1244,
      SENZU_PURPLE: 1259,
      SENZU_MAGIC: 1309,
      SENZU_GREEN: 1242,
      SENZU_YELLOW: 1260,
      SENZU_RED: 1243
    };
    // Map type constant to key (e.g., RESP.SENZU_BLUE = 'SENZU_BLUE')
    const senzuId = senzuIdData[type];
    return GAME.quick_opts.senzus.find(s => s.item_id === senzuId);
  },

  useSenzu() {
    if (RESP.stop) return;

    const blue = this.getSenzu(RESP.SENZU_BLUE);
    const purple = this.getSenzu(RESP.SENZU_PURPLE);
    const magic = this.getSenzu(RESP.SENZU_MAGIC);
    const green = this.getSenzu(RESP.SENZU_GREEN);
    const yellow = this.getSenzu(RESP.SENZU_YELLOW);
    const red = this.getSenzu(RESP.SENZU_RED);

    switch (RESP.CONF_SENZU) {
      case RESP.SENZU_BLUE:
        this.useBlue(Math.min(RESP.CONF_BLUE_AMOUNT(), blue.stack));
        break;
      case RESP.SENZU_PURPLE:
        this.usePurple(Math.min(RESP.CONF_PURPLE_AMOUNT, purple.stack));
        break;
      case RESP.SENZU_MAGIC:
        this.useMagic();
        break;
      case RESP.SENZU_GREEN:
        this.useGreen(Math.min(RESP.CONF_GREEN_AMOUNT(), green.stack));
        break;
      case RESP.SENZU_YELLOW:
        this.useYellow(Math.min(RESP.CONF_YELLOW_AMOUNT, yellow.stack));
        break;
      case RESP.SENZU_RED:
        this.useRed();
        break;
      default:
        if (blue && blue.stack > RESP.CONF_BLUE_AMOUNT() * 20) {
          this.useBlue(Math.min(RESP.CONF_BLUE_AMOUNT(), blue.stack));
        } else if (green && green.stack > RESP.CONF_GREEN_AMOUNT() * 5) {
          this.useGreen(Math.min(RESP.CONF_GREEN_AMOUNT(), green.stack));
        } else if (red && red.stack > 0) {
          this.useRed();
        }
    }
  },

  useBlue(amount) {
    const blue = this.getSenzu(RESP.SENZU_BLUE);
    if (blue) GAME.socket.emit('ga', { a: 12, type: 14, iid: blue.id, page: GAME.ekw_page, am: amount });
  },

  useGreen(amount) {
    const green = this.getSenzu(RESP.SENZU_GREEN);
    if (green) GAME.socket.emit('ga', { a: 12, type: 14, iid: green.id, page: GAME.ekw_page, am: amount });
  },

  usePurple(amount) {
    const purple = this.getSenzu(RESP.SENZU_PURPLE);
    if (purple) GAME.socket.emit('ga', { a: 12, type: 14, iid: purple.id, page: GAME.ekw_page, am: amount });
  },

  useYellow(amount) {
    const yellow = this.getSenzu(RESP.SENZU_YELLOW);
    if (yellow) GAME.socket.emit('ga', { a: 12, type: 14, iid: yellow.id, page: GAME.ekw_page, am: amount });
  },

  useRed() {
    const red = this.getSenzu(RESP.SENZU_RED);
    if (red) GAME.socket.emit('ga', { a: 12, type: 14, iid: red.id, page: GAME.ekw_page, am: 1 });
  },

  useMagic() {
    const magic = this.getSenzu(RESP.SENZU_MAGIC);
    if (magic) GAME.socket.emit('ga', { a: 12, type: 14, iid: magic.id, page: GAME.ekw_page, am: 1 });
  },

  // ============================================
  // PANEL HANDLERS
  // ============================================

  bindHandlers() {
    // Keyboard shortcut
    $(document).bind('keydown', '1', function () {
      if (!JQS.chm.is(":focus")) {
        if ($(".gh_resp .gh_status").hasClass("green")) {
          $('#resp_Panel .resp_resp').click();
        }
      }
      return false;
    });

    // Hide bless options initially
    for (let i = 1; i <= 18; i++) {
      $(`#resp_Panel .resp_bh${i}`).hide();
    }
    $('#resp_Panel .resp_on').hide();
    $('#resp_Panel .resp_off').hide();

    // Main resp toggle
    $('#resp_Panel .resp_resp').click(() => {
      if (RESP.stop && GAME.field_mobs) {
        $(".resp_resp .resp_status").removeClass("red").addClass("green").html("On");
        RESP.stop = false;
        this.action();
        RESP.reloadint = setInterval(() => this.reload_map(), 60000);
        RESP.loc = GAME.char_data.loc;
        // Stop other modules
        PVP.stop = true; LPVM.Stop = true; CODE.stop = true;
        $(".code_code .code_status, .lpvm_lpvm .lpvm_status, .pvp_pvp .pvp_status")
          .removeClass("green").addClass("red").html("Off");
      } else {
        $(".resp_resp .resp_status").removeClass("green").addClass("red").html("Off");
        RESP.stop = true;
        clearInterval(RESP.reloadint);
      }
    });

    // Bless toggle
    $('#resp_Panel .resp_bless').click(() => {
      if (RESP.bless) {
        $(".resp_bless .resp_status").removeClass("green").addClass("red").html("Off");
        RESP.bless = false;
        for (let i = 1; i <= 18; i++) $(`#resp_Panel .resp_bh${i}`).hide();
        $('#resp_Panel .resp_on, #resp_Panel .resp_off').hide();
      } else {
        $(".resp_bless .resp_status").removeClass("red").addClass("green").html("On");
        RESP.bless = true;
        for (let i = 1; i <= 18; i++) $(`#resp_Panel .resp_bh${i}`).show();
        $('#resp_Panel .resp_on, #resp_Panel .resp_off').show();
      }
    });

    // Code toggle
    $('#resp_Panel .resp_code').click(() => {
      if (RESP.code) {
        $(".resp_code .resp_status").removeClass("green").addClass("red").html("Off");
        RESP.code = false;
        $('#resp_Panel .resp_konto').hide();
      } else {
        $(".resp_code .resp_status").removeClass("red").addClass("green").html("On");
        RESP.code = true;
        $('#resp_Panel .resp_konto').show();
      }
    });

    // Konto toggle
    $('#resp_Panel .resp_konto').click(() => {
      if (RESP.kontoTP) {
        $(".resp_konto .resp_status").removeClass("green").addClass("red").html("Off");
        RESP.kontoTP = false; RESP.codeTP = false;
      } else {
        $(".resp_konto .resp_status").removeClass("red").addClass("green").html("On");
        RESP.kontoTP = true; RESP.codeTP = true;
      }
    });

    // Sub toggle
    $('#resp_Panel .resp_sub').click(() => {
      if (RESP.checkOST) {
        $(".resp_sub .resp_status").removeClass("green").addClass("red").html("Off");
        RESP.checkOST = false;
        $('#resp_Panel .resp_ost').hide();
      } else {
        $(".resp_sub .resp_status").removeClass("red").addClass("green").html("On");
        RESP.checkOST = true;
        $('#resp_Panel .resp_ost').show();
      }
    });

    // OST toggle
    $('#resp_Panel .resp_ost').click(() => {
      if (RESP.zmiana) {
        $(".resp_ost .resp_status").html("Ost");
        RESP.zmiana = false; RESP.jaka = 0;
      } else {
        $(".resp_ost .resp_status").html("x20");
        RESP.zmiana = true; RESP.jaka = 1;
      }
    });

    // Multi toggle
    $('#resp_Panel .resp_multi').click(() => {
      RESP.multifight = !RESP.multifight;
      $(".resp_multi .resp_status").toggleClass("green red").html(RESP.multifight ? "On" : "Off");
    });

    // SSJ toggle
    $('#resp_Panel .resp_ssj').click(() => {
      RESP.checkSSJ = !RESP.checkSSJ;
      $(".resp_ssj .resp_status").toggleClass("green red").html(RESP.checkSSJ ? "On" : "Off");
    });

    // Senzu toggles
    const senzuTypes = ['red', 'blue', 'green', 'purple', 'yellow', 'magic'];
    senzuTypes.forEach(type => {
      $(`#resp_Panel .resp_${type}`).click(() => {
        const senzuKey = `SENZU_${type.toUpperCase()}`;
        if (RESP.CONF_SENZU === false) {
          $(`.resp_${type} .resp_status`).removeClass("red").addClass("green").html("On");
          RESP.CONF_SENZU = RESP[senzuKey];
          senzuTypes.filter(t => t !== type).forEach(t => $(`#resp_Panel .resp_${t}`).hide());
        } else {
          $(`.resp_${type} .resp_status`).removeClass("green").addClass("red").html("Off");
          RESP.CONF_SENZU = false;
          senzuTypes.forEach(t => $(`#resp_Panel .resp_${t}`).show());
        }
      });
    });

    // All on/off for bless
    $('#resp_Panel .resp_on').click(() => {
      for (let i = 1; i <= 10; i++) {
        $(`.resp_bh${i} .resp_status`).removeClass("red").addClass("green").html("On");
        RESP[`b${i}`] = true;
      }
    });

    $('#resp_Panel .resp_off').click(() => {
      for (let i = 1; i <= 10; i++) {
        $(`.resp_bh${i} .resp_status`).removeClass("green").addClass("red").html("Off");
        RESP[`b${i}`] = false;
      }
    });

    // Individual bless toggles (b1-b18)
    for (let i = 1; i <= 18; i++) {
      $(`#resp_Panel .resp_bh${i}`).click(() => {
        RESP[`b${i}`] = !RESP[`b${i}`];
        $(`.resp_bh${i} .resp_status`).toggleClass("green red").html(RESP[`b${i}`] ? "On" : "Off");
      });
    }

    // Buff toggles
    if (GAME.server != '20') {
      $('#resp_Panel .resp_buff_imp').click(() => {
        RESP.buff_imp = !RESP.buff_imp;
        $(".resp_buff_imp .resp_status").toggleClass("green red").html(RESP.buff_imp ? "On" : "Off");
      });

      $('#resp_Panel .resp_buff_clan').click(() => {
        RESP.buff_clan = !RESP.buff_clan;
        $(".resp_buff_clan .resp_status").toggleClass("green red").html(RESP.buff_clan ? "On" : "Off");
      });
    }

    console.log('[AFO_RESP] Handlers bound');
  }
};

// Attach methods for backward compatibility
RESP.check = () => AFO_RESP.check();
RESP.action = () => AFO_RESP.action();
RESP.fight = () => AFO_RESP.fight();
RESP.go = () => AFO_RESP.go();

// Export
window.AFO_RESP = AFO_RESP;
console.log('[AFO] Respawn module loaded');
