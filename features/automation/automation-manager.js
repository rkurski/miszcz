/**
 * Gieniobot Master - Automation Module
 * Auto-expeditions, auto-arena, auto-abyss, etc.
 */

class AutomationManager {
  constructor(socket, settings) {
    this.socket = socket;
    this.settings = settings;

    // State
    this.autoExpeditions = false;
    this.autoExpeditionsInterval = null;

    this.autoArena = false;

    this.autoAbyss = false;
    this.autoAbyssInterval = null;

    this.autoBless = false;
    this.autoBlessInterval = null;
  }

  // =============== AUTO EXPEDITIONS ===============

  /**
   * Toggle auto expeditions
   */
  toggleAutoExpeditions() {
    if (!this.autoExpeditions) {
      this.startAutoExpeditions();
    } else {
      this.stopAutoExpeditions();
    }
  }

  /**
   * Start auto expeditions
   */
  startAutoExpeditions() {
    this.autoExpeditions = true;

    this.autoExpeditionsInterval = setInterval(() => {
      this._runExpeditionCycle();
    }, 4000);

    // Update UI
    const icon = document.querySelector('.qlink.manage_autoExpeditions');
    if (icon) icon.classList.add('kws_active_icon');
  }

  /**
   * Stop auto expeditions
   */
  stopAutoExpeditions() {
    this.autoExpeditions = false;

    if (this.autoExpeditionsInterval) {
      clearInterval(this.autoExpeditionsInterval);
      this.autoExpeditionsInterval = null;
    }

    // Update UI
    const icon = document.querySelector('.qlink.manage_autoExpeditions');
    if (icon) icon.classList.remove('kws_active_icon');
  }

  /**
   * Run single expedition cycle
   * @private
   */
  _runExpeditionCycle() {
    if (!this.autoExpeditions) return;

    const useCodes = this.settings.get('aeCodes');
    const trainTimer = document.querySelector('#train_uptime .timer');
    const isTraining = typeof GAME !== 'undefined' && GAME.is_training;
    const hasTrainTimer = trainTimer && trainTimer.textContent;
    const timedLabel = document.getElementById('timed_label')?.textContent || '';
    const timedActions = GAME?.char_tables?.timed_actions || [];

    // Check if should use training codes
    if (useCodes && !hasTrainTimer && !isTraining) {
      if (timedLabel.includes('Wyprawa') && timedActions[0] !== undefined) {
        // Collect expedition
        this.socket.emit(8, { type: 3 });
      } else {
        // Start training + use code
        this.socket.emit(8, { type: 2, stat: 1, duration: 1 });
        setTimeout(() => {
          this.socket.emit(8, { type: 5, apud: 'vzaaa' });
        }, 1500);
      }
    } else if (useCodes && isTraining && hasTrainTimer) {
      // Collect training
      this.socket.emit(8, { type: 3 });
    } else {
      // Check if should start expedition
      const canStartSecond = GAME?.char_data?.bonus16 > GAME?.getTime?.();
      const needsExpedition = timedActions[0] === undefined ||
        (timedActions[1] === undefined && canStartSecond);

      if (needsExpedition) {
        this.socket.emit(10, { type: 2, ct: 0 });
        if (typeof kom_clear === 'function') kom_clear();
      }
    }

    // Parse timed actions
    if (typeof GAME !== 'undefined' && GAME.parseTimed) {
      setTimeout(() => GAME.parseTimed(), 100);
    }
  }

  // =============== AUTO ARENA ===============

  /**
   * Toggle auto arena
   */
  toggleAutoArena() {
    if (!this.autoArena) {
      this.startAutoArena();
    } else {
      this.stopAutoArena();
    }
  }

  /**
   * Start auto arena
   */
  startAutoArena() {
    this.autoArena = true;

    // Update UI
    const icon = document.querySelector('.qlink.manage_auto_arena');
    if (icon) icon.classList.add('kws_active_icon');

    // Load arena and start attacking
    this.socket.emit(46, { type: 0 });
    setTimeout(() => this._attackArena(), 1000);
  }

  /**
   * Stop auto arena
   */
  stopAutoArena() {
    this.autoArena = false;

    // Update UI
    const icon = document.querySelector('.qlink.manage_auto_arena');
    if (icon) icon.classList.remove('kws_active_icon');
  }

  /**
   * Attack arena opponents
   * @private
   */
  _attackArena() {
    if (!this.autoArena) return;

    const opponents = document.querySelectorAll('#arena_players .player button[data-option="arena_attack"][data-quick="1"]:not(.initial_hide_forced)');

    if (opponents.length > 0 && (!GAME?.timed || GAME.timed === 0)) {
      const index = parseInt(opponents[0].getAttribute('data-index'), 10);
      this.socket.emit(46, { type: 1, index, quick: 1 });
      setTimeout(() => this._attackArena(), 500);
    } else {
      // Reload arena after delay
      setTimeout(() => {
        if (this.autoArena) {
          this.socket.emit(46, { type: 0 });
          setTimeout(() => this._attackArena(), 1000);
        }
      }, 5000);
    }
  }

  // =============== AUTO ABYSS ===============

  /**
   * Toggle auto abyss
   */
  toggleAutoAbyss() {
    if (!this.autoAbyss) {
      this.startAutoAbyss();
    } else {
      this.stopAutoAbyss();
    }
  }

  /**
   * Start auto abyss
   */
  startAutoAbyss() {
    this.autoAbyss = true;

    // Update UI
    const icon = document.querySelector('.qlink.manage_auto_abyss');
    if (icon) icon.classList.add('kws_active_icon');

    this.autoAbyssInterval = setInterval(() => {
      this._runAbyssCycle();
    }, 5000);
  }

  /**
   * Stop auto abyss
   */
  stopAutoAbyss() {
    this.autoAbyss = false;

    if (this.autoAbyssInterval) {
      clearInterval(this.autoAbyssInterval);
      this.autoAbyssInterval = null;
    }

    // Update UI
    const icon = document.querySelector('.qlink.manage_auto_abyss');
    if (icon) icon.classList.remove('kws_active_icon');
  }

  /**
   * Run single abyss cycle
   * @private
   */
  _runAbyssCycle() {
    if (!this.autoAbyss) return;

    // Open abyss
    this.socket.emit(59, { type: 0 });

    // Transform if needed
    setTimeout(() => {
      if (GAME?.quick_opts?.ssj) {
        const ssjBar = document.getElementById('ssj_bar');
        if (ssjBar && ssjBar.style.display === 'none') {
          this.socket.emit(18, { type: 5, tech_id: GAME.quick_opts.ssj[0] });
        } else {
          const ssjStatus = document.getElementById('ssj_status');
          if (ssjStatus && ssjStatus.textContent === '--:--:--') {
            this.socket.emit(18, { type: 6 });
          }
        }
      }
    }, 1000);

    // Start fight if ready
    const ssCdStill = document.getElementById('ss_cd_still');
    if (ssCdStill && ssCdStill.style.display === 'none') {
      setTimeout(() => {
        this.socket.emit(59, { type: 1 });
      }, 1000);

      setTimeout(() => {
        const fightView = document.getElementById('fight_view');
        if (fightView) fightView.style.display = 'none';
      }, 2000);

      // Alt transform if needed
      setTimeout(() => {
        const cd = GAME?.char_data;
        if (cd && (cd.reborn === 4 || cd.reborn === 5) && cd.alt_transform_expiry < GAME.getTime()) {
          this.socket.emit(18, { type: 8, tech_id: 134 });
        }
      }, 3000);
    }
  }

  // =============== AUTO BLESS ===============

  /**
   * Toggle auto bless
   */
  toggleAutoBless() {
    if (!this.autoBless) {
      this.startAutoBless();
    } else {
      this.stopAutoBless();
    }
  }

  /**
   * Start auto bless
   */
  startAutoBless() {
    this.autoBless = true;

    this.autoBlessInterval = setInterval(() => {
      this._runBlessCycle();
    }, 11000);

    // Update UI
    const btn = document.querySelector('.auto_bless');
    if (btn) btn.classList.add('kws_active_button');
  }

  /**
   * Stop auto bless
   */
  stopAutoBless() {
    this.autoBless = false;

    if (this.autoBlessInterval) {
      clearInterval(this.autoBlessInterval);
      this.autoBlessInterval = null;
    }

    // Update UI
    const btn = document.querySelector('.auto_bless');
    if (btn) btn.classList.remove('kws_active_button');
  }

  /**
   * Run single bless cycle
   * @private
   */
  _runBlessCycle() {
    const buffs = Array.from(document.querySelectorAll('.use_buff:checked'))
      .map(el => parseInt(el.value, 10));
    const btype = document.querySelector('input[name="bless_type"]:checked')?.value;
    const players = document.getElementById('bless_players')?.value;

    if (buffs.length > 0) {
      this.socket.emit(14, { type: 5, buffs, players, btype });
      setTimeout(() => {
        if (typeof kom_clear === 'function') kom_clear();
      }, 1000);
    }
  }

  // =============== VIP COLLECTION ===============

  /**
   * Collect all VIP rewards
   */
  collectVip() {
    const monthlyReward = document.querySelector('#monthly_vip_rewards .vip_cat.option:not(.disabled):not(.received)');
    const generalReward = document.querySelector('#general_vip_rewards .vip_cat.option:not(.disabled):not(.received)');

    if (monthlyReward) {
      const id = parseInt(monthlyReward.getAttribute('data-vip'), 10);
      const level = parseInt(monthlyReward.getAttribute('data-level'), 10);
      this.socket.emit(54, { type: 1, vip: id, level });
      setTimeout(() => this.collectVip(), 500);
    } else if (generalReward) {
      const id = parseInt(generalReward.getAttribute('data-vip'), 10);
      const level = parseInt(generalReward.getAttribute('data-level'), 10);
      this.socket.emit(54, { type: 1, vip: id, level });
      setTimeout(() => this.collectVip(), 500);
    } else {
      if (typeof GAME !== 'undefined' && GAME.komunikat) {
        GAME.komunikat('Odebrano wszystkie możliwe nagrody z Vipa!!!');
      }
    }
  }

  // =============== CLEANUP ===============

  /**
   * Stop all automation
   */
  stopAll() {
    this.stopAutoExpeditions();
    this.stopAutoArena();
    this.stopAutoAbyss();
    this.stopAutoBless();
  }
}
