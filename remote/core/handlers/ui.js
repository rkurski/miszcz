/**
 * ============================================================================
 * GIENIOBOT - UI Module
 * ============================================================================
 * 
 * UI management: top bar, activities, quest markers
 * These methods are mixed into the Gieniobot class.
 * 
 * ============================================================================
 */

const UIMixin = {

  // ============================================
  // TOP BAR
  // ============================================

  updateTopBar() {
    let sk_status;
    let instances = [];
    let currentLevel = GAME.char_data.level;
    let currentTime = Date.now();
    let levelsGained = currentLevel - GAME.startLevel;
    let levelsPerHour = levelsGained / ((currentTime - GAME.startTime) / 1000 / 60 / 60);
    let lvlh = levelsPerHour.toFixed(2);

    let dbText = $(`#mdbp_${GAME.char_data.reborn}`).find('.db_owners').text().trim();
    if (dbText.indexOf("Smocze kule zostaną zresestowane za") !== -1) {
      sk_status = "AKTYWNE";
    } else {
      sk_status = $(`#mdbp_${GAME.char_data.reborn}`).find('.timer').length
        ? $(`#mdbp_${GAME.char_data.reborn}`).find('.timer').text()
        : "AKTYWNE";
    }

    let train_upgr = $("#train_uptime").find('.timer').text();
    if (train_upgr.length == 0 || train_upgr == "00:00:00") {
      train_upgr = "AKTYWNE";
    }

    if ('char_data' in GAME) {
      instances = [GAME.char_data.icd_1, GAME.char_data.icd_2, GAME.char_data.icd_3, GAME.char_data.icd_4, GAME.char_data.icd_5, GAME.char_data.icd_6];
    }

    let sum_instances = instances.reduce((a, b) => a + b, 0);
    let activity = $('#char_activity').text();
    let received = $("#act_prizes").find("div.act_prize.disabled").length;
    let is_trader = new Date();
    let trader = `<span class='kws_top_bar_section trader_info' style='cursor:pointer;'>HANDLARZ</span> `;

    var latencyColor;
    switch (true) {
      case (latency < 51): latencyColor = "lime"; break;
      case (latency < 100): latencyColor = "yellow"; break;
      case (latency < 140): latencyColor = "orange"; break;
      default: latencyColor = "red"; break;
    }

    let latencyElement = `<span class='kws_top_bar_section latencyElement' style='cursor:pointer;color:${latencyColor}'>⇅${latency}</span>`;
    let additionalStats = `<span class='kws_top_bar_section additional_stats' style='cursor:pointer;color:${this.additionalTopBarVisible ? "orange" : "white"}'>STATY</span>`;

    let instance = `${sum_instances}/12`;
    $("#secondary_char_stats .instance ul").html(instance);

    let activities = `${activity}/185 (${received}/5)`;
    $("#secondary_char_stats .activities ul").html(activities);

    let innerHTML = ` <span class='kws_top_bar_section sk_info' style='cursor:pointer;'>SK: <span style="color:${sk_status == "AKTYWNE" ? "lime" : "white"};">${sk_status}</span></span> <span class='kws_top_bar_section train_upgr_info' style='cursor:pointer;'>KODY: <span style="color:${train_upgr == "AKTYWNE" ? "lime" : "white"};">${train_upgr}</span></span><span class='kws_top_bar_section lvl' style='cursor:pointer;'>LVL: <span>${lvlh}/H</span></span><span class='kws_top_bar_section pvp' style='cursor:pointer;'>PVP: <span>${pvp_count}</span></span><span class='kws_top_bar_section arena' style='cursor:pointer;'>ARENA: <span>${arena_count}</span></span> ${is_trader.getDay() == 6 ? trader : ''} ${additionalStats} <span class='kws_top_bar_section version' style='cursor:pointer;'>v<span>${version}</span></span> ${latencyElement}`;
    $(".kws_top_bar").html(innerHTML);

    if (this.baselinePower == undefined) {
      this.baselinePower = GAME.char_data.moc;
    }
    if (this.baselineLevel == undefined) {
      this.baselineLevel = GAME.char_data.level;
    }

    let calculated_power = GAME.dots(GAME.char_data.moc - this.baselinePower);
    let calculatedPowerReset = `<span class='kws_additional_top_bar_section additional_stats_reset' style='cursor:pointer;color:"white"'>RESET</span>`;
    let futureStats = this.prepareFutureStatsData();
    let calculated_levels = GAME.dots(GAME.char_data.level - this.baselineLevel);

    $(".kws_additional_top_bar").html(` <span class='kws_additional_top_bar_section pvm_power' style='cursor:pointer;'>ZDOBYTA MOC: <span style="color:lime;">${calculated_power}</span></span> <span class='kws_additional_top_bar_section future_stats' style='cursor:pointer;'>${futureStats.length > 0 ? futureStats : ''}</span><span class='kws_additional_top_bar_section lvlsGained' style='cursor:pointer;'>ZDOBYTE LVL: <span>${calculated_levels}</span></span><span class='kws_additional_top_bar_section psk' style='cursor:pointer;'>PSK: ${GAME.dots(GAME.char_data.minor_ball)}</span> ${calculatedPowerReset}`);

    this.adjustCurrentCharacterId();
  },

  // ============================================
  // ACTIVITIES
  // ============================================

  collectActivities() {
    let received = $("#act_prizes").find("div.act_prize.disabled").length;
    let activity = parseInt($('#char_activity').text());
    let p = [25, 50, 75, 100, 150];
    for (let i = 0; i <= 5; i++) {
      if (received < 5 && activity >= p[i]) {
        let actPrize = $(`#act_prizes button[data-ind=${i}]`).closest(".act_prize");
        if (!actPrize.hasClass("disabled")) {
          GAME.socket.emit('ga', { a: 49, type: 1, ind: i });
        }
      }
    }
  },

  // ============================================
  // QUEST MARKERS
  // ============================================

  markDaily() {
    let daily = ["ZADANIE PVM", "Zadanie PvP", "ROZWÓJ PLANETY", "ZADANIE IMPERIUM", "ZADANIE KLANOWE", "NAJLEPSZY KUCHA...", "REPUTACJA", "SYMBOL WYMIARÓW", "WYMIANA CHI", "ERMITA", "Nuda", "DOSTAWCA", "BOSKA MOC", "ROZGRZEWKA", "BOSKI ULEPSZACZ", "CZAS PODRÓŻNIKÓ...", "STRAŻNIK PORZĄD...", "CODZIENNY INSTY...", "HIPER SCALACZ", "DZIWNY MEDYK"];
    daily = daily.map(item => item.trim().toLowerCase());
    let markedQuests = [];

    const questWithSep3 = document.querySelector('.sep3');
    const lastSep3Element = $('.sep3').last().closest('.qtrack');

    $('#quest_track_con .qtrack b').each(function () {
      let zawartoscB = $(this).text().trim().toLowerCase();
      if (daily.includes(zawartoscB) && !$(this).closest('.qtrack').find('.sep3').length) {
        if (!markedQuests.includes(zawartoscB)) {
          $(this).css("color", "#63aaff");
          if (!$(this).closest('.qtrack').hasClass('cloned')) {
            if (questWithSep3) {
              lastSep3Element.after($(this).closest('.qtrack').clone());
            } else {
              $('#drag_con').prepend($(this).closest('.qtrack').clone());
            }
            $(this).closest('.qtrack').addClass('cloned');
          }
          $(this).closest('.qtrack').remove();
          markedQuests.push(zawartoscB);
        }
      }
    });

    const currentLocation = String(GAME.char_data.loc).toLowerCase();
    $('[id^="track_quest_"]').each(function () {
      const questLoc = $(this).attr("data-loc").toLowerCase();
      let zawartoscB = $(this).find('b').first().text().trim().toLowerCase();
      if (questLoc === currentLocation && !$(this).find('.sep3').length) {
        if (!markedQuests.includes(zawartoscB)) {
          $(this).find('b').first().css("color", "yellow");
          if (!$(this).closest('.qtrack').hasClass('cloned')) {
            if (questWithSep3) {
              lastSep3Element.after($(this).closest('.qtrack').clone());
            } else {
              $('#drag_con').prepend($(this).closest('.qtrack').clone());
            }
            $(this).closest('.qtrack').addClass('cloned');
          }
          $(this).closest('.qtrack').remove();
          markedQuests.push(zawartoscB);
        }
      }
    });
  }
};

// Export mixin
window.UIMixin = UIMixin;
console.log('[UI] Module loaded');
