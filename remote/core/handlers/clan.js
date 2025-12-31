/**
 * ============================================================================
 * GIENIOBOT - Clan Module
 * ============================================================================
 * 
 * Clan-related features: assist, bless, buffs
 * These methods are mixed into the kwsv3 class.
 * 
 * ============================================================================
 */

const ClanMixin = {

  // ============================================
  // CLAN ASSIST
  // ============================================

  freeAssist() {
    let fafa_el = $(`button[data-option="clan_assist"]:visible`);
    if (fafa_el.length > 0) {
      let fafa_tid = parseInt(fafa_el.eq(0).attr("data-tid"));
      let fafa_target = parseInt(fafa_el.eq(0).attr("data-target"));
      GAME.socket.emit('ga', { a: 39, type: 55, tid: fafa_tid, target: fafa_target });
      fafa_el.eq(0).hide();
      setTimeout(() => {
        this.freeAssist();
      }, 2100);
    } else {
      GAME.socket.emit('ga', { a: 39, type: 54 });
      GAME.komunikat("Asystowano wszystkim!");
    }
  },

  // ============================================
  // AUTO BLESS
  // ============================================

  autobless() {
    let arr = $.map($('.use_buff:checked'), function (e, i) { return +e.value; });
    let btype = $('input[name="bless_type"]:checked').val();
    GAME.socket.emit('ga', { a: 14, type: 5, buffs: arr, players: $('#bless_players').val(), btype: btype });
    function komunikat() {
      kom_clear();
    }
    setTimeout(() => {
      komunikat();
    }, 1000);
  },

  // ============================================
  // CLAN BUFFS
  // ============================================

  activateAllClanBuffs() {
    let abut = $("#clan_buffs").find(`button[data-option="activate_war_buff"]`);
    let isDisabled = $("#clan_buffs").find(`button[data-option="activate_war_buff"]`).parents("tr").hasClass("disabled");
    let cpbt = $("#clan_planet_buffs").html();
    let acpbut = $("#has_clan_planet").find(`button[data-option="activate_prp_buff"]`);

    if (abut.length && !isDisabled) {
      GAME.socket.emit('ga', { a: 39, type: 26 });
      setTimeout(() => {
        this.activateAllClanBuffs();
      }, 200);
    } else if (cpbt == 0) {
      GAME.socket.emit('ga', { a: 39, type: 28 });
      setTimeout(() => {
        this.activateAllClanBuffs();
      }, 200);
    } else if (acpbut.length && $("#clan_planet_buffs .red").eq(0).text() == 0) {
      GAME.socket.emit('ga', { a: 39, type: 29 });
      setTimeout(() => {
        this.activateAllClanBuffs();
      }, 200);
    } else {
      GAME.komunikat("Wszystkie buffy zostały aktywowane!");
    }
  }
};

// Export mixin
window.ClanMixin = ClanMixin;
console.log('[Clan] Module loaded');
