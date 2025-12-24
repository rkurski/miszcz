/**
 * Gieniobot Master - Clan Module
 * Clan-related features: buffs, assists, planets
 */

class ClanManager {
  constructor(socket) {
    this.socket = socket;
  }

  /**
   * Assist all clan members for free
   */
  freeAssistAll() {
    const assistBtn = document.querySelector('button[data-option="clan_assist"]:not([style*="display: none"])');

    if (assistBtn) {
      const tid = parseInt(assistBtn.getAttribute('data-tid'), 10);
      const target = parseInt(assistBtn.getAttribute('data-target'), 10);

      this.socket.emit(39, { type: 55, tid, target });
      assistBtn.style.display = 'none';

      setTimeout(() => this.freeAssistAll(), 2100);
    } else {
      // All done
      this.socket.emit(39, { type: 54 });
      if (typeof GAME !== 'undefined' && GAME.komunikat) {
        GAME.komunikat('Asystowano wszystkim!');
      }
    }
  }

  /**
   * Activate all clan buffs
   */
  activateAllBuffs() {
    const warBuffBtn = document.querySelector('#clan_buffs button[data-option="activate_war_buff"]');
    const isDisabled = warBuffBtn?.closest('tr')?.classList.contains('disabled');
    const clanPlanetBuffs = document.getElementById('clan_planet_buffs')?.textContent || '0';
    const prpBuffBtn = document.querySelector('#has_clan_planet button[data-option="activate_prp_buff"]');
    const prpBuffCost = document.querySelector('#clan_planet_buffs .red')?.textContent || '1';

    if (warBuffBtn && !isDisabled) {
      this.socket.emit(39, { type: 26 });
      setTimeout(() => this.activateAllBuffs(), 200);
    } else if (clanPlanetBuffs === '0') {
      this.socket.emit(39, { type: 28 });
      setTimeout(() => this.activateAllBuffs(), 200);
    } else if (prpBuffBtn && parseInt(prpBuffCost, 10) === 0) {
      this.socket.emit(39, { type: 29 });
      setTimeout(() => this.activateAllBuffs(), 200);
    } else {
      if (typeof GAME !== 'undefined' && GAME.komunikat) {
        GAME.komunikat('Wszystkie buffy zostały aktywowane!');
      }
    }
  }

  /**
   * Grant blessings to clan members
   */
  bless() {
    // First load bless page
    this.socket.emit(14, { type: 3 });

    setTimeout(() => {
      const buffs = Array.from(document.querySelectorAll('.use_buff:checked'))
        .map(el => parseInt(el.value, 10));
      const btype = document.querySelector('input[name="bless_type"]:checked')?.value;
      const players = document.getElementById('bless_players')?.value;

      this.socket.emit(14, { type: 5, buffs, players, btype });
    }, 500);
  }

  /**
   * Toggle teleport room visibility
   */
  toggleTeleportRoom() {
    // Load teleport data
    this.socket.emit(39, { type: 35 });
    this.socket.emit(39, { type: 33 });

    const teleRoom = document.getElementById('clan_inner_stelep');
    if (!teleRoom) return;

    if (teleRoom.style.display === 'none') {
      teleRoom.style.cssText = `
                display: block;
                position: absolute;
                padding: 10px;
                border: solid #003e60 2px;
                background: rgb(5 21 36 / 97%);
                z-index: 9999;
                border-radius: 5px;
                margin-top: 85px;
            `;
    } else {
      teleRoom.style.display = 'none';
    }
  }
}
