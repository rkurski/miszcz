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
    // Calculate stats (existing logic)
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

    // Update sidebar stats (NEW)
    const $sk = $('#kws-stat-sk');
    $sk.text(sk_status);
    $sk.toggleClass('status-active', sk_status === 'AKTYWNE');
    $sk.toggleClass('status-timer', sk_status !== 'AKTYWNE');

    const $kody = $('#kws-stat-kody');
    $kody.text(train_upgr);
    $kody.toggleClass('status-active', train_upgr === 'AKTYWNE');
    $kody.toggleClass('status-timer', train_upgr !== 'AKTYWNE');

    $('#kws-stat-lvlh').text(lvlh);
    $('#kws-stat-pvp').text(pvp_count);
    $('#kws-stat-arena').text(arena_count);

    // Show/hide trader (Saturday only)
    let is_trader = new Date();
    $('.trader_info').toggle(is_trader.getDay() === 6);

    // Update latency
    const $latency = $('#kws-latency');
    $latency.text(`⇅ ${latency}`);
    $latency.removeClass('latency-good latency-ok latency-bad latency-critical');
    if (latency < 51) $latency.addClass('latency-good');
    else if (latency < 100) $latency.addClass('latency-ok');
    else if (latency < 140) $latency.addClass('latency-bad');
    else $latency.addClass('latency-critical');

    // Update additional stats if visible
    if ($('.kws-additional-content').is(':visible')) {
      this.updateAdditionalStats();
    }

    // Secondary stats (existing logic - keep unchanged)
    if ('char_data' in GAME) {
      instances = [GAME.char_data.icd_1, GAME.char_data.icd_2, GAME.char_data.icd_3,
      GAME.char_data.icd_4, GAME.char_data.icd_5, GAME.char_data.icd_6];
      let sum_instances = instances.reduce((a, b) => a + b, 0);
      $("#secondary_char_stats .instance ul").html(`${sum_instances}/12`);

      let activity = $('#char_activity').text();
      let received = $("#act_prizes").find("div.act_prize.disabled").length;
      $("#secondary_char_stats .activities ul").html(`${activity}/185 (${received}/5)`);
    }

    this.adjustCurrentCharacterId();
  },

  updateAdditionalStats() {
    if (this.baselinePower === undefined) {
      this.baselinePower = GAME.char_data.moc;
    }
    if (this.baselineLevel === undefined) {
      this.baselineLevel = GAME.char_data.level;
    }

    let calculated_power = GAME.dots(GAME.char_data.moc - this.baselinePower);
    let futureStats = this.prepareFutureStatsData();
    let calculated_levels = GAME.dots(GAME.char_data.level - this.baselineLevel);

    $('#kws-stat-power').html(`<span style="color:lime;">${calculated_power}</span>`);

    // Hide FUTURE row if empty
    const $futureRow = $('#kws-stat-future').closest('tr');
    if (futureStats && futureStats.length > 0) {
      $futureRow.show();
      $('#kws-stat-future').html(futureStats);
    } else {
      $futureRow.hide();
    }

    $('#kws-stat-lvl-gained').text(calculated_levels);
    $('#kws-stat-psk').text(GAME.dots(GAME.char_data.minor_ball));
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
