/**
 * ============================================================================
 * GIENIOBOT - Automation Module
 * ============================================================================
 * 
 * Automatic game actions: expeditions, arena, abyss
 * These methods are mixed into the Gieniobot class.
 * 
 * ============================================================================
 */

const AutomationMixin = {

  // ============================================
  // AUTO EXPEDITIONS
  // ============================================

  manageAutoExpeditions() {
    // expedNmbr: 1 when no bonus (to avoid collision with arena/codes), 2 when bonus active
    // let expedNmbr = GAME.char_data.bonus16 < GAME.getTime() ? 1 : 2;
    let expedNmbr = 1;
    if (!this.autoExpeditions) {
      this.autoExpeditions = true;
      this.autoExpeditionsInterval = setInterval(() => {
        let opponents = $("#arena_players").find(`.player button[data-option="arena_attack"][data-quick="1"]:not(.initial_hide_forced)`);
        let opponent = parseInt(opponents.attr("data-index"));
        setTimeout(() => {
          GAME.parseTimed();
        }, 100);
        if (this.settings.aeCodes && $("#train_uptime").find('.timer').length == 0 && !GAME.is_training && $("#timed_label").text().includes("Wyprawa") && GAME.char_tables.timed_actions[0] != undefined) {
          GAME.socket.emit('ga', { a: 8, type: 3 });
        } else if (this.settings.aeCodes && $("#train_uptime").find('.timer').length == 0 && !GAME.is_training) {
          GAME.socket.emit('ga', { a: 8, type: 2, stat: 1, duration: 1 });
          setTimeout(() => {
            GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' });
          }, 1500);
        } else if (this.settings.aeCodes && GAME.is_training && $("#train_uptime").find('.timer').length == 1) {
          GAME.socket.emit('ga', { a: 8, type: 3 });
        } else if (this.settings.aeCodes && GAME.quick_opts.ssj && $("#ssj_bar").css("display") === "none") {
          // Activate SSJ if available and not active
          GAME.socket.emit('ga', { a: 18, type: 5, tech_id: GAME.quick_opts.ssj[0] });
        } else if (this.settings.aeCodes && $('#ssj_status').text() == "--:--:--" && GAME.quick_opts.ssj) {
          // SSJ cooldown finished, reactivate
          setTimeout(() => {
            GAME.socket.emit('ga', { a: 18, type: 6 });
          }, 1500);
        } else if (this.auto_arena && !isNaN(opponent)) {
          // Skip if auto arena is active
        } else if (GAME.char_tables.timed_actions[0] == undefined) {
          // No timed action at all - send expedition
          GAME.socket.emit('ga', { a: 10, type: 2, ct: 0 });
          kom_clear();
        } else if (expedNmbr == 2 && GAME.char_tables.timed_actions[1] == undefined && GAME.char_data.bonus16 > GAME.getTime()) {
          // Has bonus and slot 2 is empty - send second expedition
          GAME.socket.emit('ga', { a: 10, type: 2, ct: 0 });
          kom_clear();
        }
      }, 4000);
      $(".qlink.manage_autoExpeditions").addClass("kws_active_icon");
    } else {
      this.autoExpeditions = false;
      clearInterval(this.autoExpeditionsInterval);
      $(".qlink.manage_autoExpeditions").removeClass("kws_active_icon");
    }
  },

  // ============================================
  // AUTO ABYSS
  // ============================================

  manageAutoAbyss() {
    GAME.socket.emit('ga', { a: 59, type: 0 });
    setTimeout(() => {
      if (GAME.quick_opts.ssj && $("#ssj_bar").css("display") == "none") {
        GAME.socket.emit('ga', { a: 18, type: 5, tech_id: GAME.quick_opts.ssj[0] });
      } else if ($('#ssj_status').text() == "--:--:--") {
        GAME.socket.emit('ga', { a: 18, type: 6 });
      }
    }, 1000);
    if ($("#ss_cd_still").css("display") == "none") {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 59, type: 1 });
      }, 1000);
      setTimeout(() => {
        $('#fight_view').fadeOut();
      }, 2000);
      setTimeout(() => {
        if ((GAME.char_data.reborn == 4 || GAME.char_data.reborn == 5) && GAME.char_data.alt_transform_expiry < GAME.getTime()) {
          GAME.socket.emit('ga', { a: 18, type: 8, tech_id: 134 });
        }
      }, 3000);
    }
  },

  // ============================================
  // AUTO ARENA
  // ============================================

  manageAutoArena() {
    if (this.auto_arena) {
      // Check if PVP buff is enabled and not active - BEFORE loading arena
      if (this.settings.aePvpBuff) {
        const hasBuff = $('#char_buffs').find('[data-buff=71]').length > 0;
        const buffExpiring = $('#char_buffs').find('[data-buff=71]').find('.timer').text() <= '00:00:04';

        if (!hasBuff || buffExpiring) {
          // Ensure we're on inventory page 10 (bless items)
          if (GAME.ekw_page != 10) {
            GAME.ekw_page = 10;
            GAME.socket.emit('ga', { a: 12, page: 10, used: 1 });
            setTimeout(() => this.manageAutoArena(), 500);
            return;
          }

          // Find and use item 1742 (5min PVP CD bless)
          const itemId = $('#ekw_page_items').find('div[data-base_item_id=1742]').attr('data-item_id');
          if (itemId) {
            console.log('[AutoArena] Using PVP buff item 1742 BEFORE arena');
            GAME.socket.emit('ga', { a: 12, type: 14, iid: parseInt(itemId), page: 10 });
            // Wait for buff to apply, then continue to arena
            setTimeout(() => this.manageAutoArena(), 1500);
            return;
          }
        }
      }

      // Buff is active (or not needed), now load arena and attack
      GAME.socket.emit('ga', { a: 46, type: 0 });
      setTimeout(() => {
        this.attackAutoArena();
      }, 1000);
    } else {
      this.stopAutoArena();
    }
  },

  attackAutoArena() {
    let opponents = $("#arena_players").find(`.player button[data-option="arena_attack"][data-quick="1"]:not(.initial_hide_forced)`);
    let opponent = parseInt(opponents.attr("data-index"));
    if (this.auto_arena) {
      if (opponents.length > 0 && GAME.timed == 0) {
        GAME.socket.emit('ga', { a: 46, type: 1, index: opponent, quick: 1 });
        setTimeout(() => {
          this.attackAutoArena();
        }, 500);
      } else {
        setTimeout(() => {
          this.manageAutoArena();
        }, 5000);
      }
    } else {
      this.stopAutoArena();
    }
  },

  stopAutoArena() {
    this.auto_arena = false;
    $(".qlink.manage_auto_arena").removeClass("kws_active_icon");
  }
};

// Export mixin
window.AutomationMixin = AutomationMixin;
console.log('[Automation] Module loaded');
