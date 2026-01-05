/**
 * ============================================================================
 * GIENIOBOT - Empire Module
 * ============================================================================
 * 
 * Empire wars and related functionality.
 * These methods are mixed into the Gieniobot class.
 * 
 * ============================================================================
 */

const EmpireMixin = {

  // ============================================
  // EMPIRE WARS
  // ============================================

  wojny2() {
    var aimp = $("#e_admiral_player").find("[data-option=show_player]").attr("data-char_id");
    var imp = $("#leader_player").find("[data-option=show_player]").attr("data-char_id");
    if (!empireDataLoaded) {
      setTimeout(() => {
        GAME.socket.emit('ga', {
          a: 50,
          type: 0,
          empire: GAME.char_data.empire
        });
      }, 100);
      empireDataLoaded = true;
      setTimeout(() => {
        this.wojny2();
      }, 300);
    } else if (!GAME.emp_enemies.includes(1) && ![GAME.char_data.empire].includes(1) && (kws.check_imp().includes(GAME.char_id) || kws.check_imp2().includes(GAME.char_id) || imp == GAME.char_id || aimp == GAME.char_id)) {
      GAME.socket.emit('ga', { a: 50, type: 7, target: 1 });
      setTimeout(() => { this.wojny2(); }, 300);
    } else if (!GAME.emp_enemies.includes(2) && ![GAME.char_data.empire].includes(2) && (kws.check_imp().includes(GAME.char_id) || kws.check_imp2().includes(GAME.char_id) || imp == GAME.char_id || aimp == GAME.char_id)) {
      GAME.socket.emit('ga', { a: 50, type: 7, target: 2 });
      setTimeout(() => { this.wojny2(); }, 300);
    } else if (!GAME.emp_enemies.includes(3) && ![GAME.char_data.empire].includes(3) && (kws.check_imp().includes(GAME.char_id) || kws.check_imp2().includes(GAME.char_id) || imp == GAME.char_id || aimp == GAME.char_id)) {
      GAME.socket.emit('ga', { a: 50, type: 7, target: 3 });
      setTimeout(() => { this.wojny2(); }, 300);
    } else if (!GAME.emp_enemies.includes(4) && ![GAME.char_data.empire].includes(4) && (kws.check_imp().includes(GAME.char_id) || kws.check_imp2().includes(GAME.char_id) || imp == GAME.char_id || aimp == GAME.char_id)) {
      GAME.socket.emit('ga', { a: 50, type: 7, target: 4 });
      setTimeout(() => { this.wojny2(); }, 300);
    }
  },

  check_imp() {
    var tab = [];
    for (var i = 0; i < 3; i++) {
      tab[i] = parseInt($("#empire_heroes .activity").eq(i).find("[data-option=show_player]").attr("data-char_id"));
    }
    return tab;
  },

  check_imp2() {
    var tab = [];
    for (var i = 0; i < 3; i++) {
      tab[i] = parseInt($("#empire_efrags .activity").eq(i).find("[data-option=show_player]").attr("data-char_id"));
    }
    return tab;
  }
};

// Export mixin
window.EmpireMixin = EmpireMixin;
console.log('[Empire] Module loaded');
