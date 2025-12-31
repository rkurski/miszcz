/**
 * ============================================================================
 * GIENIOBOT - Combat Module
 * ============================================================================
 * 
 * Combat and quest actions: VIP rewards, bless, quest proceed, PVP, compressor
 * These methods are mixed into the kwsv3 class.
 * 
 * ============================================================================
 */

const CombatMixin = {

  // ============================================
  // VIP REWARDS
  // ============================================

  vip() {
    var month = $("#monthly_vip_rewards").find(".vip_cat.option" + ":not(.disabled)" + ":not(.received)");
    var general = $("#general_vip_rewards").find(".vip_cat.option" + ":not(.disabled)" + ":not(.received)");
    if (month.length) {
      var id = parseInt(month.attr("data-vip"));
      var lvl = parseInt(month.attr("data-level"));
      GAME.socket.emit('ga', {
        a: 54,
        type: 1,
        vip: id,
        level: lvl
      });
      setTimeout(() => {
        this.vip();
      }, 500);
    } else if (general.length) {
      var id = parseInt(general.attr("data-vip"));
      var lvl = parseInt(general.attr("data-level"));
      GAME.socket.emit('ga', {
        a: 54,
        type: 1,
        vip: id,
        level: lvl
      });
      setTimeout(() => {
        this.vip();
      }, 500);
    } else {
      GAME.komunikat("Odebrano wszystkie możliwe nagrody z Vipa!!!");
    }
  },

  // ============================================
  // BLESS
  // ============================================

  bless() {
    GAME.socket.emit('ga', {
      a: 14,
      type: 3
    });
    setTimeout(() => {
      var arr = $.map($('.use_buff:checked'), function (e, i) {
        return +e.value;
      });
      var btype = $('input[name="bless_type"]:checked').val();
      GAME.socket.emit('ga', {
        a: 14,
        type: 5,
        buffs: arr,
        players: $('#bless_players').val(),
        btype: btype
      });
    }, 500);
  },

  // ============================================
  // QUEST PROCEED
  // ============================================

  questProceed() {
    if (JQS.qcc.is(":visible")) {
      if ($("button[data-option=finish_quest]").length === 1) {
        let qb_id = $("button[data-option=finish_quest]").attr("data-qb_id");
        GAME.socket.emit('ga', {
          a: 22,
          type: 2,
          button: 1,
          id: qb_id
        });
      } else if ($("button[data-option=quest_riddle]").is(":visible")) {
        let qb_id = $("button[data-option=quest_riddle]").attr("data-qid");
        GAME.socket.emit('ga', {
          a: 22,
          type: 7,
          id: qb_id,
          ans: $('#quest_riddle').val()
        });
      } else if ($("button[data-option=quest_duel]").is(":visible")) {
        let fb_id = $("button[data-option=quest_duel]").attr("data-qid");
        GAME.socket.emit('ga', {
          a: 22,
          type: 6,
          id: fb_id
        });
      } else if ($(".quest_win .sekcja").text().toLowerCase() === "nuda" && $("button[data-option=finish_quest]").length === 3) {
        let qb_id = $("button[data-option=finish_quest]").attr("data-qb_id");
        GAME.socket.emit('ga', {
          a: 22,
          type: 2,
          button: 2,
          id: qb_id
        });
      } else if ($(".quest_win .sekcja").text().toLowerCase().startsWith("zadanie substancji") && $("button[data-option=finish_quest]").length === 3) {
        let qb_id = $("button[data-option=finish_quest]").attr("data-qb_id");
        GAME.socket.emit('ga', {
          a: 22,
          type: 2,
          button: 3,
          id: qb_id
        });
      } else if ($("button[data-option=finish_quest]").length === 2 && $("button[data-option=finish_quest]").eq(1).html() === "Mam dość tej studni") {
        let qb_id = $("button[data-option=finish_quest]").eq(1).attr("data-qb_id");
        GAME.socket.emit('ga', {
          a: 22,
          type: 2,
          button: 2,
          id: qb_id
        });
      } else if ($("#field_opts_con .sekcja").html() == "Zasoby") {
        let qb_id = $("#field_opts_con .field_option").find("[data-option=start_mine]").attr("data-mid");
        GAME.socket.emit('ga', {
          a: 22,
          type: 8,
          mid: qb_id
        });
      } else if ($(".quest_action").is(":visible")) {
        GAME.questAction()
      }
      setTimeout(() => {
        $('#fight_view').fadeOut();
      }, 500);
      kom_clear();
    } else if ($("button[data-option=start_mine]").length >= 1) {
      let mineID = parseInt($("button[data-option=start_mine]").attr("data-mid"));
      GAME.socket.emit('ga', {
        a: 22,
        type: 8,
        mid: mineID
      });
    }
  },

  // ============================================
  // PVP KILL
  // ============================================

  pvpKill() {
    if (!JQS.chm.is(":focus")) {
      let opponents = $("#player_list_con").find(".player button" + "[data-quick=1]" + ":not(.initial_hide_forced)");
      if ($("button[data-option='load_more_players']").is(":visible")) {
        $("button[data-option='load_more_players']").click();
        setTimeout(() => {
          this.pvpKill();
        }, 110);
      } else if (opponents.length > 0) {
        opponents.eq(0).click();
        setTimeout(() => {
          this.pvpKill();
        }, 110);
      }
    }
  },

  // ============================================
  // USE COMPRESSOR
  // ============================================

  useCompressor() {
    if (JQS.qcc.is(":visible")) {
      let compressors_button = $("#quest_con button[data-option=compress_items]");
      let quest_id = compressors_button.attr("data-qb_id");
      if (compressors_button.length === 1 && GAME.compress_items[0].stack > 0) {
        GAME.socket.emit('ga', {
          a: 22,
          type: 10,
          item_id: GAME.compress_items[0].id,
          qb_id: quest_id
        });
      }
    }
  }
};

// Export mixin
window.CombatMixin = CombatMixin;
console.log('[Combat] Module loaded');
