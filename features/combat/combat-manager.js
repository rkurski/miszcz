/**
 * Gieniobot Master - Combat Module
 * PvP, quest progression, and combat-related functions
 */

class CombatManager {
  constructor(socket) {
    this.socket = socket;
  }

  /**
   * Auto-attack all visible PvP targets
   */
  pvpKill() {
    // Check for load more button first
    const loadMoreBtn = document.querySelector('button[data-option="load_more_players"]:not([style*="display: none"])');
    if (loadMoreBtn) {
      loadMoreBtn.click();
      setTimeout(() => this.pvpKill(), 110);
      return;
    }

    // Find and attack visible opponents
    const opponents = document.querySelectorAll('#player_list_con .player button[data-quick="1"]:not(.initial_hide_forced)');
    if (opponents.length > 0) {
      opponents[0].click();
      setTimeout(() => this.pvpKill(), 110);
    }
  }

  /**
   * Progress current quest (click next, attack boss, etc.)
   */
  questProceed() {
    const qcc = document.getElementById('quest_con');
    const isQuestVisible = qcc && window.getComputedStyle(qcc).display !== 'none';

    if (isQuestVisible) {
      this._handleQuestWindow();
    } else {
      this._handleMineStart();
    }
  }

  /**
   * Handle quest window actions
   * @private
   */
  _handleQuestWindow() {
    // Single "finish quest" button
    const finishBtns = document.querySelectorAll('button[data-option="finish_quest"]');
    if (finishBtns.length === 1) {
      const qbId = finishBtns[0].getAttribute('data-qb_id');
      this.socket.emit(22, { type: 2, button: 1, id: qbId });
      this._closeFightView();
      return;
    }

    // Riddle answer
    const riddleBtn = document.querySelector('button[data-option="quest_riddle"]:not([style*="display: none"])');
    if (riddleBtn) {
      const qId = riddleBtn.getAttribute('data-qid');
      const answer = document.getElementById('quest_riddle')?.value || '';
      this.socket.emit(22, { type: 7, id: qId, ans: answer });
      return;
    }

    // Quest duel
    const duelBtn = document.querySelector('button[data-option="quest_duel"]:not([style*="display: none"])');
    if (duelBtn) {
      const fbId = duelBtn.getAttribute('data-qid');
      this.socket.emit(22, { type: 6, id: fbId });
      return;
    }

    // "Nuda" quest - select option 2
    const questTitle = document.querySelector('.quest_win .sekcja');
    if (questTitle && questTitle.textContent.toLowerCase() === 'nuda' && finishBtns.length === 3) {
      const qbId = finishBtns[0].getAttribute('data-qb_id');
      this.socket.emit(22, { type: 2, button: 2, id: qbId });
      return;
    }

    // Substance quest - select option 3 (100k)
    if (questTitle && questTitle.textContent.toLowerCase().startsWith('zadanie substancji') && finishBtns.length === 3) {
      const qbId = finishBtns[0].getAttribute('data-qb_id');
      this.socket.emit(22, { type: 2, button: 3, id: qbId });
      return;
    }

    // "I'm done with this well" option
    if (finishBtns.length === 2 && finishBtns[1].textContent === 'Mam dość tej studni') {
      const qbId = finishBtns[1].getAttribute('data-qb_id');
      this.socket.emit(22, { type: 2, button: 2, id: qbId });
      return;
    }

    // Resource collection
    const resourceSection = document.querySelector('#field_opts_con .sekcja');
    if (resourceSection && resourceSection.textContent === 'Zasoby') {
      const mineBtn = document.querySelector('#field_opts_con .field_option [data-option="start_mine"]');
      if (mineBtn) {
        const mId = mineBtn.getAttribute('data-mid');
        this.socket.emit(22, { type: 8, mid: mId });
      }
      return;
    }

    // Quest action
    const questAction = document.querySelector('.quest_action:not([style*="display: none"])');
    if (questAction && typeof GAME !== 'undefined' && GAME.questAction) {
      GAME.questAction();
    }

    this._closeFightView();
  }

  /**
   * Handle mine start when no quest window
   * @private
   */
  _handleMineStart() {
    const mineBtn = document.querySelector('button[data-option="start_mine"]');
    if (mineBtn) {
      const mineId = parseInt(mineBtn.getAttribute('data-mid'), 10);
      this.socket.emit(22, { type: 8, mid: mineId });
    }
  }

  /**
   * Close fight view after delay
   * @private
   */
  _closeFightView() {
    setTimeout(() => {
      const fightView = document.getElementById('fight_view');
      if (fightView) {
        fightView.style.display = 'none';
      }
    }, 500);

    if (typeof kom_clear === 'function') {
      kom_clear();
    }
  }

  /**
   * Use time compressor in quest
   */
  useCompressor() {
    const qcc = document.getElementById('quest_con');
    const isQuestVisible = qcc && window.getComputedStyle(qcc).display !== 'none';

    if (!isQuestVisible) return;

    const compressorBtn = document.querySelector('#quest_con button[data-option="compress_items"]');
    if (!compressorBtn) return;

    const questId = compressorBtn.getAttribute('data-qb_id');

    if (typeof GAME !== 'undefined' && GAME.compress_items && GAME.compress_items[0]?.stack > 0) {
      this.socket.emit(22, {
        type: 10,
        item_id: GAME.compress_items[0].id,
        qb_id: questId
      });
    }
  }

  /**
   * Solve riddle automatically if answer is known
   * @param {number} riddleId - Riddle ID
   * @param {Object[]} riddles - Array of known riddles
   */
  solveRiddle(riddleId, riddles) {
    const riddle = riddles.find(r => r.id === riddleId);
    if (riddle) {
      const input = document.getElementById('quest_riddle');
      if (input) {
        input.value = riddle.answer;
      }
    }
  }
}
