class ekwipunekMenager {
  constructor() {
    const mapWrapper = new locationWrapper();
    const questFilter = new filterQuest();
    this.setupCalculatePA();
    const lvl12all = new lv12all();
    lvl12all.initialize();
  }

  setupCalculatePA() {
    const ekwipunekButton = document.querySelector('button.select_page[data-page="game_ekw"]');

    if (ekwipunekButton) {
      ekwipunekButton.addEventListener('click', () => {
        this.createOrUpdatePADisplay();
      });
    } else {
      console.error("Nie znaleziono przycisku Ekwipunek!");
    }
  }

  createOrUpdatePADisplay() {
    const titleDiv = document.querySelector("#page_game_ekw > div.title");
    if (!titleDiv) return;

    let paDiv = document.getElementById("pa_display");

    if (!paDiv) {
      paDiv = document.createElement("div");
      paDiv.id = "pa_display";
      paDiv.innerText = `POSIADANE PA: OBLICZ`;
      paDiv.style.display = "inline-block";
      paDiv.style.color = "lightblue";
      paDiv.style.fontSize = "16px";
      paDiv.style.fontWeight = "bold";
      paDiv.style.cursor = "pointer";
      paDiv.style.position = "relative";
      paDiv.style.left = "40%";
      titleDiv.appendChild(paDiv);
      paDiv.addEventListener("click", () => {
        new calculatePA();
      });
    }
  }
}

class lv12all {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentCardType = null;
    this.targetLevel = 12;
    this.targetCount = 1;
    this.upgradesCompleted = 0;
    this.totalUpgradesNeeded = 0;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getAllCardsByType(cardType) {
    const sc_upgrades = document.getElementById("sc_upgrades");
    if (!sc_upgrades) return [];

    const cardsSameType = Array.from(sc_upgrades.querySelectorAll('div.small_card')).filter(function (div) {
      const img = div.querySelector('img');
      return img && img.src.includes(cardType);
    });

    return cardsSameType.map(function (div) {
      const level = div.querySelector('span') ? div.querySelector('span').textContent : null;
      const stack = div.querySelector('i') ? div.querySelector('i').textContent : null;
      const cardId = div.getAttribute('data-card_id');

      return {
        level: parseInt(level),
        stack: parseInt(stack),
        cardId: cardId
      };
    });
  }

  /**
   * Calculate how many level 1 cards are needed to create X cards of target level
   * @param {number} targetLevel - target level (1-20)
   * @param {number} targetCount - how many cards of that level we want
   * @returns {number} - number of level 1 cards required
   */
  calculateRequiredCards(targetLevel, targetCount) {
    if (targetLevel <= 1) return targetCount;

    // For levels 1-12: each upgrade consumes 1 card (so level N needs N cards total)
    // For levels 13-20: each upgrade needs 2 cards of previous level

    if (targetLevel <= 12) {
      // To get 1 card of level N (where N <= 12), we need N level-1 cards
      return targetCount * targetLevel;
    } else {
      // For levels > 12, we need 2 cards of previous level
      // Level 13 = 2x level 12 = 2 * 12 = 24 level-1 cards
      // Level 14 = 2x level 13 = 2 * 24 = 48 level-1 cards
      // etc.
      let cardsNeeded = 12; // base for level 12
      for (let lvl = 13; lvl <= targetLevel; lvl++) {
        cardsNeeded *= 2;
      }
      return targetCount * cardsNeeded;
    }
  }

  /**
   * Calculate how many cards we can make given current inventory
   * @param {Array} cards - array of card objects with level and stack
   * @param {number} targetLevel - target level
   * @returns {object} - { possible: number, deficit: number, message: string }
   */
  calculatePossibleUpgrades(cards, targetLevel) {
    // Sum up all cards as "level 1 equivalent"
    let totalLevel1Equivalent = 0;

    for (const card of cards) {
      if (card.level <= 12) {
        // Each card of level N is worth N level-1 cards
        totalLevel1Equivalent += card.stack * card.level;
      } else {
        // For levels > 12, calculate the equivalent
        let multiplier = 12;
        for (let lvl = 13; lvl <= card.level; lvl++) {
          multiplier *= 2;
        }
        totalLevel1Equivalent += card.stack * multiplier;
      }
    }

    const requiredPerCard = this.calculateRequiredCards(targetLevel, 1);
    const possibleCount = Math.floor(totalLevel1Equivalent / requiredPerCard);

    return {
      possible: possibleCount,
      totalEquivalent: totalLevel1Equivalent,
      requiredPerCard: requiredPerCard
    };
  }

  /**
   * Wait for upgrade confirmation from server
   * @returns {Promise<boolean>} - true if confirmed, false if timeout
   */
  waitForUpgradeConfirmation(timeout = 10000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        const komCon = document.querySelector('#kom_con .kom .content');
        if (komCon && komCon.textContent.includes('Karta wzmocniona')) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  }

  createModalStyles() {
    if (document.getElementById('sc_upgrade_modal_styles')) return;

    const styles = document.createElement('style');
    styles.id = 'sc_upgrade_modal_styles';
    styles.textContent = `
          #sc_upgrade_modal_overlay {
              display: none;
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.7);
              z-index: 9998;
          }
          #sc_upgrade_modal {
              display: none;
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              border: 2px solid #0f4c75;
              border-radius: 12px;
              padding: 20px;
              z-index: 9999;
              min-width: 320px;
              box-shadow: 0 0 30px rgba(15, 76, 117, 0.5);
          }
          #sc_upgrade_modal .modal-title {
              color: #3fc1c9;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 15px;
              text-transform: uppercase;
          }
          #sc_upgrade_modal .modal-close, #sc_upgrade_modal .modal-minimize {
              position: absolute;
              top: 10px;
              font-size: 20px;
              cursor: pointer;
              font-weight: bold;
          }
          #sc_upgrade_modal .modal-close {
              right: 15px;
              color: #ff6b6b;
          }
          #sc_upgrade_modal .modal-minimize {
              right: 45px;
              color: #f9ca24;
          }
          #sc_upgrade_modal .modal-close:hover { color: #ff4757; }
          #sc_upgrade_modal .modal-minimize:hover { color: #f0932b; }
          #sc_upgrade_modal .form-group {
              margin-bottom: 12px;
          }
          #sc_upgrade_modal label {
              display: block;
              color: #b8b8b8;
              margin-bottom: 5px;
              font-size: 13px;
          }
          #sc_upgrade_modal input[type="number"] {
              width: 100%;
              padding: 8px 12px;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid #0f4c75;
              border-radius: 6px;
              color: #fff;
              font-size: 14px;
              box-sizing: border-box;
          }
          #sc_upgrade_modal input[type="number"]:focus {
              outline: none;
              border-color: #3fc1c9;
          }
          #sc_upgrade_modal .calc-result {
              background: rgba(0, 0, 0, 0.3);
              color: #888;
              border-radius: 8px;
              padding: 12px;
              margin: 15px 0;
              font-size: 13px;
              min-height: 60px;
          }
          #sc_upgrade_modal .calc-result.success {
              border-left: 3px solid #2ed573;
          }
          #sc_upgrade_modal .calc-result.error {
              border-left: 3px solid #ff4757;
          }
          #sc_upgrade_modal .calc-result .stat {
              color: #3fc1c9;
              font-weight: bold;
          }
          #sc_upgrade_modal .calc-result .inventory {
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px solid rgba(255,255,255,0.1);
              font-size: 12px;
              color: #888;
          }
          #sc_upgrade_modal .btn-row {
              display: flex;
              gap: 8px;
              margin-top: 10px;
          }
          #sc_upgrade_modal .modal-btn {
              flex: 1;
              padding: 10px 15px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: bold;
              font-size: 13px;
              text-transform: uppercase;
              transition: all 0.2s;
          }
          #sc_upgrade_modal .btn-calculate {
              background: linear-gradient(135deg, #0f4c75 0%, #1b6ca8 100%);
              color: #fff;
          }
          #sc_upgrade_modal .btn-calculate:hover {
              background: linear-gradient(135deg, #1b6ca8 0%, #2196f3 100%);
          }
          #sc_upgrade_modal .btn-start {
              background: linear-gradient(135deg, #10ac84 0%, #1dd1a1 100%);
              color: #fff;
          }
          #sc_upgrade_modal .btn-start:hover {
              background: linear-gradient(135deg, #1dd1a1 0%, #55efc4 100%);
          }
          #sc_upgrade_modal .btn-start:disabled {
              background: #555;
              cursor: not-allowed;
          }
          #sc_upgrade_modal .btn-pause {
              background: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
              color: #1a1a2e;
          }
          #sc_upgrade_modal .btn-stop {
              background: linear-gradient(135deg, #ee5a24 0%, #ff4757 100%);
              color: #fff;
          }
          #sc_upgrade_modal .progress-section {
              display: none;
              margin-top: 15px;
          }
          #sc_upgrade_modal .progress-bar-container {
              background: rgba(0, 0, 0, 0.4);
              border-radius: 10px;
              overflow: hidden;
              height: 20px;
              margin-bottom: 10px;
          }
          #sc_upgrade_modal .progress-bar {
              height: 100%;
              background: linear-gradient(90deg, #10ac84, #1dd1a1);
              transition: width 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: bold;
              color: #fff;
          }
          #sc_upgrade_modal .progress-text {
              color: #b8b8b8;
              font-size: 12px;
              text-align: center;
          }
          /* Mini Widget */
          #sc_mini_widget {
              display: none;
              position: fixed;
              bottom: 20px;
              right: 20px;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              border: 2px solid #0f4c75;
              border-radius: 10px;
              padding: 10px 15px;
              z-index: 9999;
              cursor: move;
              box-shadow: 0 0 20px rgba(15, 76, 117, 0.5);
              min-width: 180px;
              touch-action: none;
          }
          #sc_mini_widget .mini-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
          }
          #sc_mini_widget .mini-title {
              color: #3fc1c9;
              font-size: 12px;
              font-weight: bold;
          }
          #sc_mini_widget .mini-expand {
              color: #3fc1c9;
              cursor: pointer;
              font-size: 16px;
          }
          #sc_mini_widget .mini-expand:hover {
              color: #55efc4;
          }
          #sc_mini_widget .mini-progress {
              background: rgba(0, 0, 0, 0.4);
              border-radius: 6px;
              overflow: hidden;
              height: 14px;
              margin-bottom: 6px;
          }
          #sc_mini_widget .mini-progress-bar {
              height: 100%;
              background: linear-gradient(90deg, #10ac84, #1dd1a1);
              transition: width 0.3s ease;
          }
          #sc_mini_widget .mini-status {
              color: #b8b8b8;
              font-size: 11px;
              text-align: center;
          }
      `;
    document.head.appendChild(styles);
  }

  createModal() {
    if (document.getElementById('sc_upgrade_modal')) return;

    this.createModalStyles();

    const overlay = document.createElement('div');
    overlay.id = 'sc_upgrade_modal_overlay';

    const modal = document.createElement('div');
    modal.id = 'sc_upgrade_modal';
    modal.innerHTML = `
          <span class="modal-minimize" title="Minimalizuj">_</span>
          <span class="modal-close">&times;</span>
          <div class="modal-title">⚔️ ULEPSZ DO...</div>
          
          <div class="form-group">
              <label>Docelowy poziom karty (1-20):</label>
              <input type="number" id="sc_target_level" min="1" max="20" value="12">
          </div>
          
          <div class="form-group">
              <label>Docelowa ilość kart:</label>
              <input type="number" id="sc_target_count" min="1" value="1">
          </div>
          
          <div class="btn-row">
              <button class="modal-btn btn-calculate" id="sc_btn_calculate">📊 PRZELICZ</button>
          </div>
          
          <div class="calc-result" id="sc_calc_result">
              <span style="color: #888;">Kliknij "PRZELICZ" aby zobaczyć wymagania...</span>
          </div>
          
          <div class="btn-row" id="sc_main_controls">
              <button class="modal-btn btn-start" id="sc_btn_start" disabled>▶️ START</button>
          </div>
          
          <div class="progress-section" id="sc_progress_section">
              <div class="progress-bar-container">
                  <div class="progress-bar" id="sc_progress_bar" style="width: 0%">0%</div>
              </div>
              <div class="progress-text" id="sc_progress_text">Przygotowanie...</div>
              <div class="btn-row">
                  <button class="modal-btn btn-pause" id="sc_btn_pause">⏸️ PAUZA</button>
                  <button class="modal-btn btn-stop" id="sc_btn_stop">⏹️ STOP</button>
              </div>
          </div>
      `;

    // Create mini widget
    const miniWidget = document.createElement('div');
    miniWidget.id = 'sc_mini_widget';
    miniWidget.innerHTML = `
        <div class="mini-header">
            <span class="mini-title">⚔️ Ulepszanie</span>
            <span class="mini-expand" title="Rozwiń">⬆</span>
        </div>
        <div class="mini-progress">
            <div class="mini-progress-bar" id="sc_mini_progress_bar" style="width: 0%"></div>
        </div>
        <div class="mini-status" id="sc_mini_status">Wstrzymano</div>
    `;
    document.body.appendChild(miniWidget);

    // Make mini widget draggable (touch + mouse)
    this.makeDraggable(miniWidget);

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // Event listeners
    overlay.addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-minimize').addEventListener('click', () => this.minimizeModal());
    document.getElementById('sc_mini_widget').querySelector('.mini-expand').addEventListener('click', () => this.expandModal());

    document.getElementById('sc_btn_calculate').addEventListener('click', () => this.onCalculate());
    document.getElementById('sc_btn_start').addEventListener('click', () => this.onStart());
    document.getElementById('sc_btn_pause').addEventListener('click', () => this.onPauseResume());
    document.getElementById('sc_btn_stop').addEventListener('click', () => this.onStop());
  }

  showModal() {
    this.createModal();

    // Get current selected card type
    const selected_card = document.querySelector(`div[data-card_id="${GAME.selected_card}"]`);
    if (!selected_card) {
      GAME.komunikat2('Najpierw wybierz kartę!');
      return;
    }

    const img = selected_card.querySelector('img');
    if (!img) return;

    this.currentCardType = img.src.match(/\/gfx\/cards\/(\d+)\.png/)?.[0] || img.src;

    document.getElementById('sc_upgrade_modal_overlay').style.display = 'block';
    document.getElementById('sc_upgrade_modal').style.display = 'block';

    // Reset state
    document.getElementById('sc_main_controls').style.display = 'flex';
    document.getElementById('sc_progress_section').style.display = 'none';
    document.getElementById('sc_btn_start').disabled = true;
    document.getElementById('sc_calc_result').className = 'calc-result';
    document.getElementById('sc_calc_result').innerHTML = '<span style="color: #888;">Kliknij "PRZELICZ" aby zobaczyć wymagania...</span>';
  }

  hideModal() {
    if (this.isRunning) {
      this.onStop();
    }
    document.getElementById('sc_upgrade_modal_overlay').style.display = 'none';
    document.getElementById('sc_upgrade_modal').style.display = 'none';
  }

  onCalculate() {
    const targetLevel = parseInt(document.getElementById('sc_target_level').value) || 12;
    const targetCount = parseInt(document.getElementById('sc_target_count').value) || 1;

    if (targetLevel < 1 || targetLevel > 20) {
      document.getElementById('sc_calc_result').className = 'calc-result error';
      document.getElementById('sc_calc_result').innerHTML = '❌ Poziom musi być między 1 a 20!';
      document.getElementById('sc_btn_start').disabled = true;
      return;
    }

    const cards = this.getAllCardsByType(this.currentCardType);
    if (cards.length === 0) {
      document.getElementById('sc_calc_result').className = 'calc-result error';
      document.getElementById('sc_calc_result').innerHTML = '❌ Nie znaleziono kart tego typu!';
      document.getElementById('sc_btn_start').disabled = true;
      return;
    }

    const result = this.calculatePossibleUpgrades(cards, targetLevel);
    const requiredFromZero = this.calculateRequiredCards(targetLevel, targetCount);

    this.targetLevel = targetLevel;
    this.targetCount = targetCount;

    const resultDiv = document.getElementById('sc_calc_result');
    const startBtn = document.getElementById('sc_btn_start');

    // Check how many we already have at target level or higher
    const existingAtTarget = cards.filter(c => c.level === targetLevel).reduce((sum, c) => sum + c.stack, 0);
    const existingAboveTarget = cards.filter(c => c.level > targetLevel).reduce((sum, c) => sum + c.stack, 0);

    // Build inventory breakdown
    const inventoryBreakdown = cards
      .filter(c => c.stack > 0)
      .sort((a, b) => b.level - a.level)
      .map(c => `lv${c.level}: ${c.stack}x`)
      .join(', ');

    // Calculate ACTUAL COST - how many lv1 cards will be consumed
    // Actual cost = requiredFromZero - value of NON-lv1 cards that will be used
    // Example: need lv13 (24 ekw), have lv12(1)+lv5(1)+lv1(971)
    // We'll use: lv12(12ekw) + lv5(5ekw) + lv1(7) = 24 total
    // So actual lv1 consumed = 24 - 12 - 5 = 7

    let valueFromHigherCards = 0;
    for (const card of cards.filter(c => c.level > 1)) {
      valueFromHigherCards += card.stack * this.calculateRequiredCards(card.level, 1);
    }

    // Actual lv1 cards consumed = max(0, requiredFromZero - valueFromHigherCards)
    // But capped at the lv1 cards we actually have
    const lv1Cards = cards.filter(c => c.level === 1).reduce((s, c) => s + c.stack, 0);
    const actualLv1Consumed = Math.max(0, Math.min(lv1Cards, requiredFromZero - valueFromHigherCards));

    // Also show total cards that will be used (higher + lv1)
    const higherCardsUsedValue = Math.min(valueFromHigherCards, requiredFromZero);

    const inventoryHtml = inventoryBreakdown
      ? `<div class="inventory">🏷️ Posiadane: ${inventoryBreakdown}</div>`
      : '';

    if (result.totalEquivalent >= requiredFromZero) {
      // Calculate remaining after upgrade
      const remaining = result.totalEquivalent - requiredFromZero;

      resultDiv.className = 'calc-result success';
      resultDiv.innerHTML = `
              ✅ <b>Możliwe do wykonania!</b><br>
              🎯 Cel: <span class="stat">${targetCount}x</span> karta lv<span class="stat">${targetLevel}</span><br>
              📦 Od zera potrzeba: <span class="stat">${requiredFromZero}</span> ekw. lv1<br>
              💰 <b>Zużyjesz: <span class="stat" style="color:#f9ca24">${actualLv1Consumed}</span> kart lv1</b> (+ karty wyższego lvl)<br>
              📊 Już posiadasz: <span class="stat">${existingAtTarget}</span>x lv${targetLevel}${existingAboveTarget > 0 ? ` (+${existingAboveTarget} wyższych)` : ''}<br>
              ✨ Zostanie: <span class="stat">${remaining}</span> ekw. lv1
              ${inventoryHtml}
          `;
      startBtn.disabled = false;
    } else {
      resultDiv.className = 'calc-result error';
      resultDiv.innerHTML = `
              ❌ <b>Zbyt mało kart!</b><br>
              🎯 Cel: <span class="stat">${targetCount}x</span> karta lv<span class="stat">${targetLevel}</span><br>
              📦 Od zera potrzeba: <span class="stat">${requiredFromZero}</span> ekw. lv1<br>
              ✨ Masz: <span class="stat">${result.totalEquivalent}</span> ekw. lv1<br>
              ⚠️ Brakuje: <span class="stat">${requiredFromZero - result.totalEquivalent}</span> ekw. lv1<br>
              ⚡ Max możesz stworzyć: <span class="stat">${result.possible}</span>x lv${targetLevel}
              ${inventoryHtml}
          `;
      // Allow starting even with deficit - will upgrade as much as possible
      startBtn.disabled = result.possible === 0;
    }
  }

  async onStart() {
    this.isRunning = true;
    this.isPaused = false;
    this.upgradesCompleted = 0;

    // Switch UI
    document.getElementById('sc_main_controls').style.display = 'none';
    document.getElementById('sc_progress_section').style.display = 'block';
    document.getElementById('sc_btn_pause').textContent = '⏸️ PAUZA';

    await this.runUpgradeProcess();
  }

  onPauseResume() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('sc_btn_pause');
    if (this.isPaused) {
      btn.textContent = '▶️ WZNÓW';
      this.updateProgressText('⏸️ Wstrzymano...');
    } else {
      btn.textContent = '⏸️ PAUZA';
    }
  }

  onStop() {
    this.isRunning = false;
    this.isPaused = false;

    document.getElementById('sc_main_controls').style.display = 'flex';
    document.getElementById('sc_progress_section').style.display = 'none';

    this.onCalculate(); // Refresh calculation
  }

  updateProgress(completed, total) {
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const bar = document.getElementById('sc_progress_bar');
    bar.style.width = `${percent}%`;
    bar.textContent = `${percent}%`;

    // Sync mini widget
    const miniBar = document.getElementById('sc_mini_progress_bar');
    if (miniBar) {
      miniBar.style.width = `${percent}%`;
    }
  }

  updateProgressText(text) {
    document.getElementById('sc_progress_text').textContent = text;

    // Sync mini widget
    const miniStatus = document.getElementById('sc_mini_status');
    if (miniStatus) {
      // Shorter version for mini widget
      miniStatus.textContent = text.length > 30 ? text.substring(0, 27) + '...' : text;
    }
  }

  /**
   * Find the best card to upgrade based on target level strategy
   */
  findCardToUpgrade(cards, targetLevel) {
    // For levels <= 12: upgrade highest level card that's below target
    // For levels > 12: need to build up pairs

    if (targetLevel <= 12) {
      // Find highest level card below target with stack > 1 (need 2 to combine)
      // OR find any card below target if there are level 1 cards available

      const cardsBelow = cards
        .filter(c => c.level < targetLevel && c.stack >= 1)
        .sort((a, b) => b.level - a.level);

      for (const card of cardsBelow) {
        if (card.stack >= 2 || (card.level === 1 && card.stack >= 2)) {
          return card;
        }
        // Check if there's a level 1 card to feed
        const level1 = cards.find(c => c.level === 1 && c.stack >= 1);
        if (level1 && card.level > 1) {
          return card; // This card can be upgraded with a lv1
        }
        if (card.level === 1 && card.stack >= 2) {
          return card;
        }
      }

      // If we have level 1 cards with stack >= 2, upgrade those
      const level1 = cards.find(c => c.level === 1 && c.stack >= 2);
      if (level1) return level1;

    } else {
      // For levels > 12, we need matching pairs
      // First, make sure we have enough level 12 cards
      // Then combine them up

      for (let lvl = targetLevel - 1; lvl >= 12; lvl--) {
        const cardsAtLevel = cards.find(c => c.level === lvl && c.stack >= 2);
        if (cardsAtLevel) {
          return cardsAtLevel;
        }
      }

      // If no pairs at high level, upgrade lower cards first
      const cardsBelow12 = cards
        .filter(c => c.level < 12 && c.stack >= 1)
        .sort((a, b) => b.level - a.level);

      for (const card of cardsBelow12) {
        if (card.stack >= 2) return card;
        const level1 = cards.find(c => c.level === 1 && c.stack >= 1);
        if (level1) return card;
      }
    }

    return null;
  }

  async runUpgradeProcess() {
    const targetLevel = this.targetLevel;
    const targetCount = this.targetCount;

    while (this.isRunning) {
      // Check pause
      while (this.isPaused && this.isRunning) {
        await this.delay(200);
      }

      if (!this.isRunning) break;

      // Refresh card data
      const cards = this.getAllCardsByType(this.currentCardType);

      // Check if we've reached the goal
      const atTarget = cards.filter(c => c.level === targetLevel).reduce((sum, c) => sum + c.stack, 0);

      if (atTarget >= targetCount) {
        this.updateProgress(100, 100);
        this.updateProgressText(`✅ Gotowe! Masz ${atTarget}x kart na poziomie ${targetLevel}`);
        await this.delay(2000);
        this.onStop();
        return;
      }

      // Find card to upgrade
      const cardToUpgrade = this.findCardToUpgrade(cards, targetLevel);

      if (!cardToUpgrade) {
        this.updateProgressText('⚠️ Brak kart do ulepszenia!');
        await this.delay(2000);
        this.onStop();
        return;
      }

      // Upgrade the card
      this.updateProgressText(`Ulepszam kartę lv${cardToUpgrade.level}...`);

      GAME.socket.emit('ga', { a: 58, type: 3, card: cardToUpgrade.cardId });

      // Wait for confirmation
      const confirmed = await this.waitForUpgradeConfirmation(10000);

      if (!confirmed) {
        this.updateProgressText('⚠️ Timeout - brak odpowiedzi serwera');
        await this.delay(2000);
        continue;
      }

      this.upgradesCompleted++;

      // Calculate progress estimate
      const result = this.calculatePossibleUpgrades(cards, targetLevel);
      const progress = Math.min(100, Math.round((atTarget / targetCount) * 100));
      this.updateProgress(progress, 100);
      this.updateProgressText(`Ulepszono: ${this.upgradesCompleted} | Cel: ${atTarget}/${targetCount} kart lv${targetLevel}`);

      // Small delay before next iteration
      await this.delay(300);
    }
  }

  // Minimize/Expand modal methods
  minimizeModal() {
    document.getElementById('sc_upgrade_modal_overlay').style.display = 'none';
    document.getElementById('sc_upgrade_modal').style.display = 'none';
    document.getElementById('sc_mini_widget').style.display = 'block';
  }

  expandModal() {
    document.getElementById('sc_mini_widget').style.display = 'none';
    document.getElementById('sc_upgrade_modal_overlay').style.display = 'block';
    document.getElementById('sc_upgrade_modal').style.display = 'block';
  }

  // Make element draggable (mouse + touch)
  makeDraggable(element) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    const onStart = (e) => {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = element.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
      element.style.transition = 'none';
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      let newX = clientX - offsetX;
      let newY = clientY - offsetY;

      // Constrain to viewport
      const maxX = window.innerWidth - element.offsetWidth;
      const maxY = window.innerHeight - element.offsetHeight;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      element.style.left = newX + 'px';
      element.style.top = newY + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    };

    const onEnd = () => {
      isDragging = false;
      element.style.transition = '';
    };

    // Mouse events
    element.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    // Touch events
    element.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  createButton() {
    const button = document.createElement('button');
    button.className = 'option btn_small_gold';
    button.setAttribute('data-option', 'map_cards');
    button.textContent = 'ULEPSZ DO...';
    button.addEventListener("click", () => {
      this.showModal();
    });

    document.getElementById("soulcard_menu").appendChild(button);
  }

  initialize() {
    if (!document.getElementById("soulcard_menu").querySelector('button[data-option="map_cards"]')) {
      this.createButton();
    }
  }
}

class calculatePA {
  constructor() {
    this.calculateFinalNumber().catch(error => {
      console.error("Błąd podczas obliczania PA:", error);
    });
  }

  async calculateFinalNumber() {
    const initialPA = parseInt(document.querySelector("#char_pa_max").innerText.replace(/\s+/g, ''), 10);
    let finalNumber = initialPA;

    const itemStacks = await this.getItemStacks([1244, 1242, 1259, 1473, 1260, 1472, 1243, 1471, 1494, 1493, 1492, 1489, 1485, 1484, 1483]);

    finalNumber += itemStacks[1244] * 100;
    finalNumber += itemStacks[1242] * 2000;
    finalNumber += itemStacks[1259] * 5000 + (initialPA * 0.03);
    finalNumber += itemStacks[1473] * 5000 + (initialPA * 0.03);
    finalNumber += itemStacks[1260] * 10000 + (initialPA * 0.15);
    finalNumber += itemStacks[1472] * 10000 + (initialPA * 0.15);
    finalNumber += itemStacks[1243] * initialPA;
    finalNumber += itemStacks[1471] * initialPA;
    finalNumber += (itemStacks[1489] * 5000 + (initialPA * 0.03)) * 20;
    finalNumber += (itemStacks[1489] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1494] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1493] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1492] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1485] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1483] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1484] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1484] * initialPA) * 4;

    this.updatePA(GAME.dots(finalNumber));
    //console.log("MAX PA:" + initialPA + " Łączna ilość:" + finalNumber);
  }

  async getItemStacks(itemIds) {
    const stacks = {};
    itemIds.forEach(id => stacks[id] = 0);
    const pages = [
      { page: 0, page2: 0 },
      { page: 0, page2: 1 },
      { page: 0, page2: 2 }
    ];
    for (let page of pages) {
      await GAME.socket.emit('ga', { a: 12, page: page.page, page2: page.page2, used: 1 });
      await new Promise(resolve => setTimeout(resolve, 1500));
      itemIds.forEach(itemId => {
        const itemElement = document.querySelector(`#ekw_page_items [data-base_item_id="${itemId}"]`);
        if (itemElement) {
          const stack = parseInt(itemElement.getAttribute('data-stack'), 10) || 0;
          stacks[itemId] += stack;
        }
      });
    }
    // console.log(stacks);
    return stacks;
  }

  updatePA(finalNumber) {
    const paDiv = document.getElementById("pa_display");
    if (paDiv) {
      paDiv.innerText = `POSIADANE PA: ${finalNumber}`;
    }
  }
}

class locationWrapper {
  constructor() {
    this.locationsGathered = false;
    $("body").on("click", '#map_link_btn', () => {
      if ($("#changeLocationWrapper").length === 0) {
        let locationWrapperCSS = `
              #changeLocationWrapper {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 15px;
                  margin-top: -50px;
                  position: relative; /* Pozycjonowanie względne */
                  z-index: 10; /* Wyższy z-index, aby kontener był nad innymi elementami */
              }
              #changeLocationWrapper .arrow {
                  width: 50px;
                  height: 50px;
                  background: linear-gradient(135deg, rgb(36 210 210 / 80%), rgb(46 215 215 / 10%));
                  color: white;
                  font-size: 20px;
                  font-weight: bold;
                  border: none;
                  border-radius: 50%;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
                  cursor: pointer;
                  transition: transform 0.2s, box-shadow 0.2s;
                  position: relative; /* Pozycjonowanie względne */
                  z-index: 20; /* Zwiększamy z-index, aby strzałki były na wierzchu */
              }
              #changeLocationWrapper .arrow:hover {
                  transform: scale(1.1);
                  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.3);
              }
              #changeLocationText {
                  font-size: 18px;
                  color: rgb(36 210 210 / 80%);
                  font-weight: bold;
                  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
                  white-space: nowrap; /* Zapobiega zawijaniu tekstu */
              }
              #loc_bons {
                  z-index: 20; /* Najwyższy możliwy z-index */
              }`;
        let locationWrapperHTML = `
              <div id="changeLocationWrapper">
                  <button id="leftArrow" class="arrow">← </button>
                  <span id="changeLocationText" class="green"> ZMIEŃ LOKACJĘ </span>
                  <button id="rightArrow" class="arrow"> →</button>
              </div>`;

        $('#map_y').after(`<style>${locationWrapperCSS}</style>${locationWrapperHTML}`);
      }
      if (!this.locationsGathered) {
        this.locationsGathered = true;
        setTimeout(() => {
          GAME.emitOrder({ a: 19, type: 1 });
          setTimeout(() => { document.querySelector("#map_link_btn").click(); }, 1000);
          setTimeout(() => {
            const dataLocArray = [];
            const list = document.querySelector('#tp_list');
            if (list) {
              const items = list.querySelectorAll("[data-loc]");
              items.forEach(item => {
                const dataLocValue = item.getAttribute("data-loc");
                if (dataLocValue && /^\d{1,4}$/.test(dataLocValue)) {
                  dataLocArray.push(dataLocValue);
                }
              });
              // console.log("Zebrane lokalizacje:", dataLocArray);
            } else {
              console.error("Element o ID #tp_list nie został znaleziony.");
            }
            $('#rightArrow').on('click', function () {
              const currentLoc = String(GAME.char_data.loc);
              const currentIndex = dataLocArray.indexOf(currentLoc);
              if (currentIndex === -1) {
                console.error("BRAK");
              } else if (currentIndex > 0) {
                const previousLoc = dataLocArray[currentIndex - 1];
                GAME.emitOrder({ a: 12, type: 18, loc: previousLoc });
              }
            });
            $('#leftArrow').on('click', function () {
              const currentLoc = String(GAME.char_data.loc);
              const currentIndex = dataLocArray.indexOf(currentLoc);
              if (currentIndex === -1) {
                console.error("BRAK");
              } else if (currentIndex < dataLocArray.length - 1) {
                const nextLoc = dataLocArray[currentIndex + 1];
                GAME.emitOrder({ a: 12, type: 18, loc: nextLoc });
              }
            });
          }, 1000);
        }, 2000);
      }
    });
  }
}

class filterQuest {
  constructor() {
    $("body").on("click", '#map_link_btn', () => {
      if ($("#quest-filter-input").length === 0) {
        let questFilterHTML = `<input type="text" id="quest-filter-input" placeholder="Wpisz coś..." autocomplete="off"/>`;
        let questFilterCSS = {
          position: 'absolute',
          top: '45px',
          right: '120px',
          backgroundSize: '100% 100%',
          border: '1px solid rgb(42 173 173 / 44%)',
          color: 'white',
          width: '200px',
          height: '30px',
          background: 'rgb(249 249 249 / 10%)',
          textAlign: 'center',
          lineHeight: '40px',
          textTransform: 'uppercase',
        };
        $('#rightArrow').after(questFilterHTML);
        $("#quest-filter-input").css(questFilterCSS);
        $("#quest-filter-input").on("input", this.filterQuests);
      }
      this.filterQuests();
    });
    const questContainer = document.querySelector('#drag_con');
    const observer = new MutationObserver(this.filterQuests.bind(this));
    observer.observe(questContainer, { childList: true, subtree: true });
  }
  filterQuests() {
    const inputField = $("#quest-filter-input")[0];
    const searchText = inputField.value.toLowerCase();
    const questContainer = document.querySelector('#drag_con');
    const quests = questContainer.querySelectorAll('.qtrack');
    quests.forEach(quest => {
      const questText = quest.textContent.toLowerCase();
      if (questText.includes(searchText)) {
        quest.style.display = '';
      } else {
        quest.style.display = 'none';
      }
    });
  }
}

class chestOpener {
  static CHEST_IDS = [1486, 1264, 1263, 1262];
  static LOOT_ITEMS = {
    45: { name: 'Amulet', img: '/gfx/items/10/3/45.png' },
    789: { name: 'Strój treningowy', img: '/gfx/items/10/9/789.png' },
    790: { name: 'Strój walki', img: '/gfx/items/10/16/790.png' },
    1228: { name: 'Scouter', img: '/gfx/items/10/23/1228.png' },
    837: { name: 'Pancerz', img: '/gfx/items/10/17/837.png' },
    848: { name: 'Opaska', img: '/gfx/items/10/19/848.png' },
    1238: { name: 'Pas', img: '/gfx/items/10/24/1238.png' },
    838: { name: 'Akcesorium', img: '/gfx/items/10/18/838.png' },
    1218: { name: 'Rękawice', img: '/gfx/items/10/22/1218.png' },
    1058: { name: 'Buty', img: '/gfx/items/10/21/1058.png' },
    362: { name: 'Chi', img: '/gfx/items/10/11/362.png' }
  };

  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.openCount = 0;
    this.targetOpenCount = 100;
    this.currentItemId = null;
    this.useTargetMode = false;
    this.lootTargets = JSON.parse(JSON.stringify(chestOpener.LOOT_ITEMS));

    this.injectStyles();
    this.createModal();
    this.attachMenuListener();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  injectStyles() {
    if (document.getElementById('chest_opener_styles')) return;

    const styles = document.createElement('style');
    styles.id = 'chest_opener_styles';
    styles.textContent = `
      #chest_opener_modal_overlay {
        display: none;
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9998;
      }
      #chest_opener_modal {
        display: none;
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #e17055;
        border-radius: 12px;
        padding: 20px;
        z-index: 9999;
        min-width: 340px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 0 30px rgba(225, 112, 85, 0.4);
      }
      #chest_opener_modal .modal-title {
        color: #e17055;
        font-size: 18px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 15px;
        text-transform: uppercase;
      }
      #chest_opener_modal .modal-close, #chest_opener_modal .modal-minimize {
        position: absolute;
        top: 10px;
        font-size: 20px;
        cursor: pointer;
        font-weight: bold;
      }
      #chest_opener_modal .modal-close { right: 15px; color: #ff6b6b; }
      #chest_opener_modal .modal-minimize { right: 45px; color: #f9ca24; }
      #chest_opener_modal .modal-close:hover { color: #ff4757; }
      #chest_opener_modal .modal-minimize:hover { color: #f0932b; }
      #chest_opener_modal .form-group { margin-bottom: 12px; }
      #chest_opener_modal label {
        display: block;
        color: #b8b8b8;
        margin-bottom: 5px;
        font-size: 13px;
      }
      #chest_opener_modal input[type="number"] {
        width: 100%;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #e17055;
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        box-sizing: border-box;
      }
      #chest_opener_modal input[type="number"]:focus {
        outline: none;
        border-color: #fab1a0;
      }
      #chest_opener_modal .mode-toggle {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }
      #chest_opener_modal .mode-btn {
        flex: 1;
        padding: 10px;
        border: 2px solid #e17055;
        background: transparent;
        color: #e17055;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
      }
      #chest_opener_modal .mode-btn.active {
        background: #e17055;
        color: #1a1a2e;
      }
      #chest_opener_modal .targets-container {
        display: none;
        max-height: 250px;
        overflow-y: auto;
        background: rgba(0,0,0,0.2);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 15px;
      }
      #chest_opener_modal .target-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
        font-size: 13px;
      }
      #chest_opener_modal .target-row label {
        flex: 1;
        margin: 0;
        color: #ddd;
      }
      #chest_opener_modal .target-row input {
        width: 60px;
        padding: 5px;
        text-align: center;
      }
      #chest_opener_modal .target-row .collected {
        color: #55efc4;
        min-width: 50px;
        text-align: right;
      }
      #chest_opener_modal .btn-row {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }
      #chest_opener_modal .modal-btn {
        flex: 1;
        padding: 10px 15px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 13px;
        text-transform: uppercase;
        transition: all 0.2s;
      }
      #chest_opener_modal .btn-start {
        background: linear-gradient(135deg, #e17055 0%, #d63031 100%);
        color: #fff;
      }
      #chest_opener_modal .btn-start:hover {
        background: linear-gradient(135deg, #fab1a0 0%, #e17055 100%);
      }
      #chest_opener_modal .btn-pause {
        background: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
        color: #1a1a2e;
      }
      #chest_opener_modal .btn-stop {
        background: linear-gradient(135deg, #636e72 0%, #2d3436 100%);
        color: #fff;
      }
      #chest_opener_modal .progress-section {
        display: none;
        margin-top: 15px;
      }
      #chest_opener_modal .progress-bar-container {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 10px;
        overflow: hidden;
        height: 20px;
        margin-bottom: 10px;
      }
      #chest_opener_modal .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #e17055, #d63031);
        transition: width 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        color: #fff;
      }
      #chest_opener_modal .progress-text {
        color: #b8b8b8;
        font-size: 12px;
        text-align: center;
      }
      /* Mini Widget */
      #chest_mini_widget {
        display: none;
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #e17055;
        border-radius: 10px;
        padding: 10px 15px;
        z-index: 9999;
        cursor: move;
        box-shadow: 0 0 20px rgba(225, 112, 85, 0.4);
        min-width: 180px;
        touch-action: none;
      }
      #chest_mini_widget .mini-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      #chest_mini_widget .mini-title {
        color: #e17055;
        font-size: 12px;
        font-weight: bold;
      }
      #chest_mini_widget .mini-expand {
        color: #e17055;
        cursor: pointer;
        font-size: 16px;
      }
      #chest_mini_widget .mini-progress {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 6px;
        overflow: hidden;
        height: 14px;
        margin-bottom: 6px;
      }
      #chest_mini_widget .mini-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #e17055, #d63031);
        transition: width 0.3s ease;
      }
      #chest_mini_widget .mini-status {
        color: #b8b8b8;
        font-size: 11px;
        text-align: center;
      }
    `;
    document.head.appendChild(styles);
  }

  createModal() {
    if (document.getElementById('chest_opener_modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'chest_opener_modal_overlay';

    const modal = document.createElement('div');
    modal.id = 'chest_opener_modal';

    // Build target rows HTML
    let targetRowsHtml = '';
    for (const [itemId, item] of Object.entries(chestOpener.LOOT_ITEMS)) {
      targetRowsHtml += `
        <div class="target-row">
          <img src="${item.img}" style="width: 24px; height: 24px; margin-right: 6px;">
          <label>${item.name}</label>
          <input type="number" min="0" value="0" data-item-id="${itemId}" class="target-input">
          <span class="collected" data-collected-id="${itemId}">0</span>
        </div>
      `;
    }

    modal.innerHTML = `
      <span class="modal-minimize" title="Minimalizuj">_</span>
      <span class="modal-close">&times;</span>
      <div class="modal-title">📦 Otwieracz</div>
      
      <div class="mode-toggle">
        <button class="mode-btn active" data-mode="count">Ilość</button>
        <button class="mode-btn" data-mode="targets">Do zebrania</button>
      </div>
      
      <div class="form-group" id="chest_count_mode">
        <label>Ile skrzyń otworzyć:</label>
        <input type="number" id="chest_open_count" min="1" value="100">
      </div>
      
      <div class="targets-container" id="chest_targets_mode">
        <label style="margin-bottom: 10px; display: block;">Otwieraj do zebrania:</label>
        ${targetRowsHtml}
      </div>
      
      <div class="btn-row" id="chest_main_controls">
        <button class="modal-btn btn-start" id="chest_btn_start">▶️ START</button>
      </div>
      
      <div class="progress-section" id="chest_progress_section">
        <div class="progress-bar-container">
          <div class="progress-bar" id="chest_progress_bar" style="width: 0%">0%</div>
        </div>
        <div class="progress-text" id="chest_progress_text">Przygotowanie...</div>
        <div class="btn-row">
          <button class="modal-btn btn-pause" id="chest_btn_pause">⏸️ PAUZA</button>
          <button class="modal-btn btn-stop" id="chest_btn_stop">⏹️ STOP</button>
        </div>
      </div>
    `;

    // Mini widget
    const miniWidget = document.createElement('div');
    miniWidget.id = 'chest_mini_widget';
    miniWidget.innerHTML = `
      <div class="mini-header">
        <span class="mini-title">📦 Skrzynie</span>
        <span class="mini-expand" title="Rozwiń">⬆</span>
      </div>
      <div class="mini-progress">
        <div class="mini-progress-bar" id="chest_mini_progress_bar" style="width: 0%"></div>
      </div>
      <div class="mini-status" id="chest_mini_status">Wstrzymano</div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    document.body.appendChild(miniWidget);

    // Make mini widget draggable
    this.makeDraggable(miniWidget);

    // Event listeners
    overlay.addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-minimize').addEventListener('click', () => this.minimizeModal());
    miniWidget.querySelector('.mini-expand').addEventListener('click', () => this.expandModal());

    // Mode toggle
    modal.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
    });

    document.getElementById('chest_btn_start').addEventListener('click', () => this.onStart());
    document.getElementById('chest_btn_pause').addEventListener('click', () => this.onPauseResume());
    document.getElementById('chest_btn_stop').addEventListener('click', () => this.onStop());
  }

  attachMenuListener() {
    // Add button to item menu when chest is selected
    $(document).on('click', '.player_ekw_item', (e) => {
      const item = $(e.currentTarget);
      const baseItemId = parseInt(item.attr('data-base_item_id'));

      setTimeout(() => {
        const menu = document.getElementById('ekw_item_menu');
        if (!menu || menu.style.display === 'none') return;

        // Remove old button if exists
        const oldBtn = menu.querySelector('#ekw_menu_mass_open');
        if (oldBtn) oldBtn.remove();

        if (chestOpener.CHEST_IDS.includes(baseItemId)) {
          const btn = document.createElement('button');
          btn.id = 'ekw_menu_mass_open';
          btn.className = 'ekw_menu_btn option btn_small_gold';
          btn.textContent = 'Otwieracz';
          btn.style.display = '';
          btn.addEventListener('click', () => {
            this.currentItemId = parseInt(item.attr('data-item_id'));
            this.showModal();
          });
          menu.appendChild(btn);
        }
      }, 50);
    });
  }

  switchMode(mode) {
    const countMode = document.getElementById('chest_count_mode');
    const targetsMode = document.getElementById('chest_targets_mode');
    const btns = document.querySelectorAll('#chest_opener_modal .mode-btn');

    btns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    if (mode === 'count') {
      countMode.style.display = 'block';
      targetsMode.style.display = 'none';
      this.useTargetMode = false;
    } else {
      countMode.style.display = 'none';
      targetsMode.style.display = 'block';
      this.useTargetMode = true;
    }
  }

  showModal() {
    // Reset collected counts
    for (const key of Object.keys(this.lootTargets)) {
      this.lootTargets[key].collected = 0;
      const el = document.querySelector(`[data-collected-id="${key}"]`);
      if (el) el.textContent = '0';
    }

    document.getElementById('chest_opener_modal_overlay').style.display = 'block';
    document.getElementById('chest_opener_modal').style.display = 'block';
    document.getElementById('chest_main_controls').style.display = 'flex';
    document.getElementById('chest_progress_section').style.display = 'none';
  }

  hideModal() {
    if (this.isRunning) this.onStop();
    document.getElementById('chest_opener_modal_overlay').style.display = 'none';
    document.getElementById('chest_opener_modal').style.display = 'none';
  }

  minimizeModal() {
    document.getElementById('chest_opener_modal_overlay').style.display = 'none';
    document.getElementById('chest_opener_modal').style.display = 'none';
    document.getElementById('chest_mini_widget').style.display = 'block';
  }

  expandModal() {
    document.getElementById('chest_mini_widget').style.display = 'none';
    document.getElementById('chest_opener_modal_overlay').style.display = 'block';
    document.getElementById('chest_opener_modal').style.display = 'block';
  }

  makeDraggable(element) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    const onStart = (e) => {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = element.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
      element.style.transition = 'none';
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      let newX = Math.max(0, Math.min(clientX - offsetX, window.innerWidth - element.offsetWidth));
      let newY = Math.max(0, Math.min(clientY - offsetY, window.innerHeight - element.offsetHeight));
      element.style.left = newX + 'px';
      element.style.top = newY + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    };

    const onEnd = () => { isDragging = false; element.style.transition = ''; };

    element.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    element.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  async onStart() {
    this.isRunning = true;
    this.isPaused = false;
    this.openCount = 0;

    // Read targets if in target mode
    if (this.useTargetMode) {
      document.querySelectorAll('.target-input').forEach(input => {
        const itemId = input.dataset.itemId;
        this.lootTargets[itemId].target = parseInt(input.value) || 0;
        this.lootTargets[itemId].collected = 0;
      });
    } else {
      this.targetOpenCount = parseInt(document.getElementById('chest_open_count').value) || 100;
    }

    document.getElementById('chest_main_controls').style.display = 'none';
    document.getElementById('chest_progress_section').style.display = 'block';
    document.getElementById('chest_btn_pause').textContent = '⏸️ PAUZA';

    await this.runOpenProcess();
  }

  onPauseResume() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('chest_btn_pause');
    if (this.isPaused) {
      btn.textContent = '▶️ WZNÓW';
      this.updateProgressText('⏸️ Wstrzymano...');
    } else {
      btn.textContent = '⏸️ PAUZA';
    }
  }

  onStop() {
    this.isRunning = false;
    this.isPaused = false;
    document.getElementById('chest_main_controls').style.display = 'flex';
    document.getElementById('chest_progress_section').style.display = 'none';
  }

  updateProgress(percent) {
    const bar = document.getElementById('chest_progress_bar');
    bar.style.width = `${percent}%`;
    bar.textContent = `${percent}%`;
    const miniBar = document.getElementById('chest_mini_progress_bar');
    if (miniBar) miniBar.style.width = `${percent}%`;
  }

  updateProgressText(text) {
    document.getElementById('chest_progress_text').textContent = text;
    const miniStatus = document.getElementById('chest_mini_status');
    if (miniStatus) miniStatus.textContent = text.length > 25 ? text.substring(0, 22) + '...' : text;
  }

  parseDrops(komContent) {
    // Parse items from kom_con response
    // data-item_id in HTML -> dataset.item_id in JS (underscore preserved)
    const items = komContent.querySelectorAll('.ekw_slot');
    items.forEach(item => {
      const itemId = item.getAttribute('data-item_id'); // Use getAttribute for safety
      const countDiv = item.querySelector('div');
      const count = countDiv ? parseInt(countDiv.textContent) || 1 : 1;

      if (itemId && this.lootTargets[itemId]) {
        this.lootTargets[itemId].collected += count;
        const el = document.querySelector(`[data-collected-id="${itemId}"]`);
        if (el) el.textContent = this.lootTargets[itemId].collected;
      }
    });
  }

  checkTargetsReached() {
    if (!this.useTargetMode) return false;

    for (const [itemId, item] of Object.entries(this.lootTargets)) {
      if (item.target > 0 && item.collected < item.target) {
        return false;
      }
    }
    return true;
  }

  async runOpenProcess() {
    while (this.isRunning) {
      // Check pause
      while (this.isPaused && this.isRunning) {
        await this.delay(200);
      }
      if (!this.isRunning) break;

      // Check count limit in count mode
      if (!this.useTargetMode && this.openCount >= this.targetOpenCount) {
        this.updateProgressText(`✅ Gotowe! Otwarto ${this.openCount} skrzyń`);
        this.updateProgress(100);
        await this.delay(2000);
        this.onStop();
        return;
      }

      // Check targets in target mode
      if (this.useTargetMode && this.checkTargetsReached()) {
        this.updateProgressText(`✅ Cele osiągnięte! Otwarto ${this.openCount}`);
        this.updateProgress(100);
        await this.delay(2000);
        this.onStop();
        return;
      }

      // Check if item still exists
      const itemEl = document.querySelector(`[data-item_id="${this.currentItemId}"]`);
      if (!itemEl) {
        this.updateProgressText('⚠️ Skrzynie się skończyły!');
        await this.delay(2000);
        this.onStop();
        return;
      }

      const stack = parseInt(itemEl.dataset.stack) || 0;
      if (stack <= 0) {
        this.updateProgressText('⚠️ Skrzynie się skończyły!');
        await this.delay(2000);
        this.onStop();
        return;
      }

      // Calculate how many to open (max 100)
      let toOpen = 100;
      if (!this.useTargetMode) {
        toOpen = Math.min(100, this.targetOpenCount - this.openCount, stack);
      } else {
        toOpen = Math.min(100, stack);
      }

      this.updateProgressText(`Otwieram ${toOpen} skrzyń...`);

      // Emit open command
      GAME.emitOrder({ a: 12, type: 14, iid: this.currentItemId, page: GAME.ekw_page, page2: GAME.ekw_page2, am: toOpen });

      // Wait for kom_con to appear with drops (poll until it appears or timeout)
      let komContent = null;
      for (let i = 0; i < 30; i++) { // max 3 seconds wait
        await this.delay(100);
        komContent = document.querySelector('#kom_con .limited_kom');
        if (komContent && komContent.querySelectorAll('.ekw_slot').length > 0) {
          break;
        }
      }

      // Parse drops before closing
      if (komContent) {
        this.parseDrops(komContent);
      }

      // Close kom after parsing
      kom_clear();

      this.openCount += toOpen;

      // Update progress
      if (!this.useTargetMode) {
        const percent = Math.round((this.openCount / this.targetOpenCount) * 100);
        this.updateProgress(percent);
      }
      this.updateProgressText(`Otwarto: ${this.openCount} skrzyń`);

      // Wait remaining time to make 1s total between batches
      await this.delay(700);
    }
  }
}

// Initialize chest opener
new chestOpener();

class itemUpgrader {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentItemId = null;
    this.currentItemStack = 0;
    this.currentLevel = 0;
    this.targetLevel = 5;
    this.minToKeep = 10;
    this.successCount = 0;
    this.burnedCount = 0;
    this.totalAttempts = 0;

    this.injectStyles();
    this.createModal();
    this.attachMenuListener();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  injectStyles() {
    if (document.getElementById('item_upgrader_styles')) return;

    const styles = document.createElement('style');
    styles.id = 'item_upgrader_styles';
    styles.textContent = `
      #item_upgrader_modal_overlay {
        display: none;
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9998;
      }
      #item_upgrader_modal {
        display: none;
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #a29bfe;
        border-radius: 12px;
        padding: 20px;
        z-index: 9999;
        min-width: 340px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 0 30px rgba(162, 155, 254, 0.4);
      }
      #item_upgrader_modal .modal-title {
        color: #a29bfe;
        font-size: 18px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 15px;
        text-transform: uppercase;
      }
      #item_upgrader_modal .modal-close, #item_upgrader_modal .modal-minimize {
        position: absolute;
        top: 10px;
        font-size: 20px;
        cursor: pointer;
        font-weight: bold;
      }
      #item_upgrader_modal .modal-close { right: 15px; color: #ff6b6b; }
      #item_upgrader_modal .modal-minimize { right: 45px; color: #f9ca24; }
      #item_upgrader_modal .modal-close:hover { color: #ff4757; }
      #item_upgrader_modal .modal-minimize:hover { color: #f0932b; }
      #item_upgrader_modal .form-group { margin-bottom: 12px; }
      #item_upgrader_modal label {
        display: block;
        color: #b8b8b8;
        margin-bottom: 5px;
        font-size: 13px;
      }
      #item_upgrader_modal input[type="number"] {
        width: 100%;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #a29bfe;
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        box-sizing: border-box;
      }
      #item_upgrader_modal input[type="number"]:focus {
        outline: none;
        border-color: #6c5ce7;
      }
      #item_upgrader_modal .info-box {
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
        padding: 12px;
        margin: 15px 0;
        font-size: 13px;
        color: #ddd;
      }
      #item_upgrader_modal .info-box .highlight {
        color: #a29bfe;
        font-weight: bold;
      }
      #item_upgrader_modal .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin: 15px 0;
      }
      #item_upgrader_modal .stat-box {
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
        padding: 10px;
        text-align: center;
      }
      #item_upgrader_modal .stat-box .stat-label {
        font-size: 11px;
        color: #888;
        text-transform: uppercase;
      }
      #item_upgrader_modal .stat-box .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #a29bfe;
      }
      #item_upgrader_modal .stat-box.success .stat-value { color: #55efc4; }
      #item_upgrader_modal .stat-box.burned .stat-value { color: #ff6b6b; }
      #item_upgrader_modal .btn-row {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }
      #item_upgrader_modal .modal-btn {
        flex: 1;
        padding: 10px 15px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 13px;
        text-transform: uppercase;
        transition: all 0.2s;
      }
      #item_upgrader_modal .btn-start {
        background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
        color: #fff;
      }
      #item_upgrader_modal .btn-start:hover {
        background: linear-gradient(135deg, #6c5ce7 0%, #5f27cd 100%);
      }
      #item_upgrader_modal .btn-pause {
        background: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
        color: #1a1a2e;
      }
      #item_upgrader_modal .btn-stop {
        background: linear-gradient(135deg, #636e72 0%, #2d3436 100%);
        color: #fff;
      }
      #item_upgrader_modal .progress-section {
        display: none;
        margin-top: 15px;
      }
      #item_upgrader_modal .progress-bar-container {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 10px;
        overflow: hidden;
        height: 20px;
        margin-bottom: 10px;
      }
      #item_upgrader_modal .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #a29bfe, #6c5ce7);
        transition: width 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        color: #fff;
      }
      #item_upgrader_modal .progress-text {
        color: #b8b8b8;
        font-size: 12px;
        text-align: center;
      }
      /* Mini Widget */
      #upgrader_mini_widget {
        display: none;
        position: fixed;
        bottom: 140px;
        right: 20px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #a29bfe;
        border-radius: 10px;
        padding: 10px 15px;
        z-index: 9999;
        cursor: move;
        box-shadow: 0 0 20px rgba(162, 155, 254, 0.4);
        min-width: 180px;
        touch-action: none;
      }
      #upgrader_mini_widget .mini-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      #upgrader_mini_widget .mini-title {
        color: #a29bfe;
        font-size: 12px;
        font-weight: bold;
      }
      #upgrader_mini_widget .mini-expand {
        color: #a29bfe;
        cursor: pointer;
        font-size: 16px;
      }
      #upgrader_mini_widget .mini-progress {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 6px;
        overflow: hidden;
        height: 14px;
        margin-bottom: 6px;
      }
      #upgrader_mini_widget .mini-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #a29bfe, #6c5ce7);
        transition: width 0.3s ease;
      }
      #upgrader_mini_widget .mini-status {
        color: #b8b8b8;
        font-size: 11px;
        text-align: center;
      }
    `;
    document.head.appendChild(styles);
  }

  createModal() {
    if (document.getElementById('item_upgrader_modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'item_upgrader_modal_overlay';

    const modal = document.createElement('div');
    modal.id = 'item_upgrader_modal';

    modal.innerHTML = `
      <span class="modal-minimize" title="Minimalizuj">_</span>
      <span class="modal-close">&times;</span>
      <div class="modal-title">⚡ Ulepszacz</div>
      
      <div class="info-box" id="upg_item_info">
        Wybierz przedmiot z opcją "Ulepsz"
      </div>
      
      <div class="form-group">
        <label>Ile przedmiotów ulepszać:</label>
        <div style="display: flex; gap: 8px;">
          <input type="number" id="upg_start_count" min="1" placeholder="Ilość" style="flex: 1;">
          <button class="modal-btn" id="upg_max_btn" style="flex: 0; padding: 8px 15px; background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);">MAX</button>
        </div>
      </div>
      
      <div class="form-group">
        <label>Docelowy plus:</label>
        <input type="number" id="upg_target_level" min="1" max="99" placeholder="np. 10">
      </div>
      
      <div class="form-group">
        <label>Ile przedmiotów ma zostać:</label>
        <input type="number" id="upg_min_keep" min="0" placeholder="0 = do osiągnięcia plusa lub spalenia wszystkiego">
      </div>
      
      <div class="info-box" style="font-size: 12px; color: #888;">
        💡 <b>Jak to działa:</b><br>
        • Ulepszam wszystkie przedmioty poziom po poziomie<br>
        • Gdy pozostanie ≤ minimum → STOP<br>
        • Wynik: minimum przedmiotów na najwyższym osiągniętym +
      </div>
      
      <div class="btn-row" id="upg_main_controls">
        <button class="modal-btn btn-start" id="upg_btn_start">▶️ START</button>
      </div>
      
      <div class="progress-section" id="upg_progress_section">
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Poziom</div>
            <div class="stat-value" id="upg_current_level">+0</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Pozostało</div>
            <div class="stat-value" id="upg_remaining">0</div>
          </div>
          <div class="stat-box success">
            <div class="stat-label">Udane</div>
            <div class="stat-value" id="upg_success">0</div>
          </div>
          <div class="stat-box burned">
            <div class="stat-label">Spalone</div>
            <div class="stat-value" id="upg_burned">0</div>
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" id="upg_progress_bar" style="width: 0%">0%</div>
        </div>
        <div class="progress-text" id="upg_progress_text">Przygotowanie...</div>
        <div class="btn-row">
          <button class="modal-btn btn-pause" id="upg_btn_pause">⏸️ PAUZA</button>
          <button class="modal-btn btn-stop" id="upg_btn_stop">⏹️ STOP</button>
        </div>
      </div>
    `;

    // Mini widget
    const miniWidget = document.createElement('div');
    miniWidget.id = 'upgrader_mini_widget';
    miniWidget.innerHTML = `
      <div class="mini-header">
        <span class="mini-title">⚡ Ulepszacz</span>
        <span class="mini-expand" title="Rozwiń">⬆</span>
      </div>
      <div class="mini-progress">
        <div class="mini-progress-bar" id="upg_mini_progress_bar" style="width: 0%"></div>
      </div>
      <div class="mini-status" id="upg_mini_status">Wstrzymano</div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    document.body.appendChild(miniWidget);

    this.makeDraggable(miniWidget);

    // Event listeners
    overlay.addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-minimize').addEventListener('click', () => this.minimizeModal());
    miniWidget.querySelector('.mini-expand').addEventListener('click', () => this.expandModal());

    document.getElementById('upg_btn_start').addEventListener('click', () => this.onStart());
    document.getElementById('upg_btn_pause').addEventListener('click', () => this.onPauseResume());
    document.getElementById('upg_btn_stop').addEventListener('click', () => this.onStop());
    document.getElementById('upg_max_btn').addEventListener('click', () => {
      document.getElementById('upg_start_count').value = this.currentItemStack;
    });
  }

  attachMenuListener() {
    // Add button when item menu shows "Ulepsz" option
    $(document).on('click', '.player_ekw_item', (e) => {
      const item = $(e.currentTarget);

      setTimeout(() => {
        const menu = document.getElementById('ekw_item_menu');
        if (!menu || menu.style.display === 'none') return;

        const upgBtn = menu.querySelector('#ekw_menu_upg');
        if (!upgBtn || upgBtn.style.display === 'none') return;

        // Remove old button if exists
        const oldBtn = menu.querySelector('#ekw_menu_upgrader');
        if (oldBtn) oldBtn.remove();

        const btn = document.createElement('button');
        btn.id = 'ekw_menu_upgrader';
        btn.className = 'ekw_menu_btn option btn_small_gold';
        btn.textContent = 'Ulepszacz';
        btn.style.display = '';
        btn.addEventListener('click', () => {
          this.currentItemId = parseInt(item.attr('data-item_id'));
          this.baseItemId = parseInt(item.attr('data-base_item_id')); // Store base ID for finding after upgrade
          this.currentItemStack = parseInt(item.attr('data-stack')) || 1;
          this.currentLevel = parseInt(item.attr('data-upgrade')) || 0;
          const itemName = item.find('img').attr('src');
          this.showModal(itemName, this.currentItemStack, this.currentLevel);
        });
        upgBtn.after(btn);
      }, 50);
    });
  }

  showModal(itemImg, stack, level) {
    document.getElementById('upg_item_info').innerHTML = `
      <img src="${itemImg}" style="width: 32px; height: 32px; vertical-align: middle; margin-right: 10px;">
      Posiadasz: <span class="highlight">${stack}</span> szt. na poziomie <span class="highlight">+${level}</span>
    `;

    document.getElementById('item_upgrader_modal_overlay').style.display = 'block';
    document.getElementById('item_upgrader_modal').style.display = 'block';
    document.getElementById('upg_main_controls').style.display = 'flex';
    document.getElementById('upg_progress_section').style.display = 'none';
  }

  hideModal() {
    if (this.isRunning) this.onStop();
    document.getElementById('item_upgrader_modal_overlay').style.display = 'none';
    document.getElementById('item_upgrader_modal').style.display = 'none';
  }

  minimizeModal() {
    document.getElementById('item_upgrader_modal_overlay').style.display = 'none';
    document.getElementById('item_upgrader_modal').style.display = 'none';
    document.getElementById('upgrader_mini_widget').style.display = 'block';
  }

  expandModal() {
    document.getElementById('upgrader_mini_widget').style.display = 'none';
    document.getElementById('item_upgrader_modal_overlay').style.display = 'block';
    document.getElementById('item_upgrader_modal').style.display = 'block';
  }

  makeDraggable(element) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    const onStart = (e) => {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = element.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
      element.style.transition = 'none';
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      let newX = Math.max(0, Math.min(clientX - offsetX, window.innerWidth - element.offsetWidth));
      let newY = Math.max(0, Math.min(clientY - offsetY, window.innerHeight - element.offsetHeight));
      element.style.left = newX + 'px';
      element.style.top = newY + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    };

    const onEnd = () => { isDragging = false; element.style.transition = ''; };

    element.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    element.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  async onStart() {
    this.isRunning = true;
    this.isPaused = false;
    this.startCount = parseInt(document.getElementById('upg_start_count').value) || 100;
    this.targetLevel = parseInt(document.getElementById('upg_target_level').value) || 10;
    this.minToKeep = parseInt(document.getElementById('upg_min_keep').value) || 10;
    this.successCount = 0;
    this.burnedCount = 0;

    // Validate: can't use more than we have
    if (this.startCount > this.currentItemStack) {
      this.startCount = this.currentItemStack;
    }

    document.getElementById('upg_main_controls').style.display = 'none';
    document.getElementById('upg_progress_section').style.display = 'block';
    document.getElementById('upg_btn_pause').textContent = '⏸️ PAUZA';

    await this.runUpgradeProcess();
  }

  onPauseResume() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('upg_btn_pause');
    if (this.isPaused) {
      btn.textContent = '▶️ WZNÓW';
      this.updateProgressText('⏸️ Wstrzymano...');
    } else {
      btn.textContent = '⏸️ PAUZA';
    }
  }

  onStop(hideSummary = true) {
    this.isRunning = false;
    this.isPaused = false;
    document.getElementById('upg_main_controls').style.display = 'flex';
    if (hideSummary) {
      document.getElementById('upg_progress_section').style.display = 'none';
    }
  }

  updateStats(level, remaining, success, burned) {
    document.getElementById('upg_current_level').textContent = `+${level}`;
    document.getElementById('upg_remaining').textContent = remaining;
    document.getElementById('upg_success').textContent = success;
    document.getElementById('upg_burned').textContent = burned;
  }

  updateProgress(percent) {
    const bar = document.getElementById('upg_progress_bar');
    bar.style.width = `${percent}%`;
    bar.textContent = `${percent}%`;
    const miniBar = document.getElementById('upg_mini_progress_bar');
    if (miniBar) miniBar.style.width = `${percent}%`;
  }

  updateProgressText(text) {
    document.getElementById('upg_progress_text').textContent = text;
    const miniStatus = document.getElementById('upg_mini_status');
    if (miniStatus) miniStatus.textContent = text.length > 25 ? text.substring(0, 22) + '...' : text;
  }

  async waitForResult(timeout = 8000) {
    // Wait for kom_con with result
    for (let i = 0; i < timeout / 100; i++) {
      await this.delay(100);
      const kom = document.querySelector('#kom_con .kom .content');
      if (kom && kom.textContent.includes('Operacja zakończona')) {
        // Parse result: "Powiodło się: X" and "Próby nieudane: Y"
        // Numbers may have spaces as thousand separators (e.g. "2 137")
        const successMatch = kom.innerHTML.match(/Powiodło się:\s*<b[^>]*>([\d\s]+)</);
        const failMatch = kom.innerHTML.match(/Próby nieudane:\s*<b[^>]*>([\d\s]+)</);

        // Remove spaces from numbers before parsing
        const success = successMatch ? parseInt(successMatch[1].replace(/\s/g, '')) : 0;
        const failed = failMatch ? parseInt(failMatch[1].replace(/\s/g, '')) : 0;

        kom_clear();
        return { success, failed };
      }
    }
    kom_clear();
    return { success: 0, failed: 0 };
  }

  async runUpgradeProcess() {
    let remaining = this.startCount;
    let level = this.currentLevel;
    let currentItemId = this.currentItemId;

    this.updateStats(level, remaining, 0, 0);
    this.updateProgressText(`Start: ${remaining} przedmiotów na +${level}`);

    await this.delay(500);

    while (this.isRunning && level < this.targetLevel) {
      // Check pause
      while (this.isPaused && this.isRunning) {
        await this.delay(200);
      }
      if (!this.isRunning) break;

      // SMART STOP: if minToKeep > 0 and we're at or below it, we're done!
      if (this.minToKeep > 0 && remaining <= this.minToKeep) {
        this.updateProgressText(`🎯 Cel osiągnięty! ${remaining} szt. na +${level}`);
        this.updateProgress(100);
        await this.delay(3000);
        this.onStop(false);
        return;
      }

      // Check if we have items
      if (remaining <= 0) {
        this.updateProgressText('❌ Wszystko spalone!');
        await this.delay(2000);
        this.onStop();
        return;
      }

      const nextLevel = level + 1;
      this.updateProgressText(`⚡ +${level} → +${nextLevel} (${remaining} szt.)...`);

      // Try to find item - first check if GAME.dragged_item is set and valid
      if (GAME.dragged_item && GAME.dragged_item.id) {
        currentItemId = GAME.dragged_item.id;
      } else {
        // Fallback: find by base_item_id and upgrade level with retries
        let itemEl = null;
        for (let retry = 0; retry < 15; retry++) {
          itemEl = document.querySelector(`[data-base_item_id="${this.baseItemId}"][data-upgrade="${level}"]`);
          if (itemEl) {
            currentItemId = parseInt(itemEl.getAttribute('data-item_id'));
            break;
          }
          await this.delay(300);
        }

        if (!itemEl) {
          this.updateProgressText(`⚠️ Nie znaleziono +${level}! Sprawdź ekwipunek.`);
          await this.delay(3000);
          this.onStop();
          return;
        }
      }

      console.log(`[Ulepszacz] Upgrading item ${currentItemId}, amount: ${remaining}, from +${level} to +${nextLevel}`);

      // Emit upgrade command
      GAME.emitOrder({ a: 12, type: 10, iid: currentItemId, page: GAME.ekw_page, page2: GAME.ekw_page2, am: remaining });

      // Wait for result
      const result = await this.waitForResult(8000);


      if (result.success === 0 && result.failed === 0) {
        this.updateProgressText(`⚠️ Brak odpowiedzi serwera!`);
        await this.delay(2000);
        this.onStop();
        return;
      }

      this.successCount += result.success;
      this.burnedCount += result.failed;

      // Update state
      level = nextLevel;
      remaining = result.success;

      this.updateStats(level, remaining, this.successCount, this.burnedCount);

      // Progress
      const progress = Math.min(99, Math.round((level / this.targetLevel) * 100));
      this.updateProgress(progress);

      // Wait for DOM to update
      await this.delay(1000);

      // Clear GAME.dragged_item to force re-lookup next iteration
      GAME.dragged_item = null;
    }

    // Final message
    if (this.isRunning) {
      if (level >= this.targetLevel && remaining > 0) {
        this.updateProgressText(`🏆 Osiągnięto +${level}! Pozostało: ${remaining}`);
      } else {
        this.updateProgressText(`✅ Zakończono: ${remaining} szt. na +${level}`);
      }
      this.updateProgress(100);
      await this.delay(3000);
      this.onStop(false);
    }
  }
}

// Initialize item upgrader
new itemUpgrader();

class cardPackOpener {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentItemId = null;
    this.currentItemStack = 0;
    this.useLeaveMode = true; // true = "leave X", false = "open X"
    this.targetCount = 0;
    this.openedCount = 0;
    this.collectedCards = {}; // { cardImg: { level, count } }

    this.injectStyles();
    this.createModal();
    this.attachMenuListener();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  injectStyles() {
    if (document.getElementById('card_opener_styles')) return;

    const styles = document.createElement('style');
    styles.id = 'card_opener_styles';
    styles.textContent = `
      #card_opener_modal_overlay {
        display: none;
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9998;
      }
      #card_opener_modal {
        display: none;
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #fd79a8;
        border-radius: 12px;
        padding: 20px;
        z-index: 9999;
        min-width: 360px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 0 30px rgba(253, 121, 168, 0.4);
      }
      #card_opener_modal .modal-title {
        color: #fd79a8;
        font-size: 18px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 15px;
        text-transform: uppercase;
      }
      #card_opener_modal .modal-close, #card_opener_modal .modal-minimize {
        position: absolute;
        top: 10px;
        font-size: 20px;
        cursor: pointer;
        font-weight: bold;
      }
      #card_opener_modal .modal-close { right: 15px; color: #ff6b6b; }
      #card_opener_modal .modal-minimize { right: 45px; color: #f9ca24; }
      #card_opener_modal .form-group { margin-bottom: 12px; }
      #card_opener_modal label {
        display: block;
        color: #b8b8b8;
        margin-bottom: 5px;
        font-size: 13px;
      }
      #card_opener_modal input[type="number"] {
        width: 100%;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #fd79a8;
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        box-sizing: border-box;
      }
      #card_opener_modal .info-box {
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
        padding: 12px;
        margin: 15px 0;
        font-size: 13px;
        color: #ddd;
      }
      #card_opener_modal .info-box .highlight {
        color: #fd79a8;
        font-weight: bold;
      }
      #card_opener_modal .mode-toggle {
        display: flex;
        gap: 5px;
        margin-bottom: 15px;
      }
      #card_opener_modal .mode-btn {
        flex: 1;
        padding: 10px;
        border: 2px solid #fd79a8;
        background: transparent;
        color: #fd79a8;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
      }
      #card_opener_modal .mode-btn.active {
        background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%);
        color: #fff;
      }
      #card_opener_modal .btn-row {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }
      #card_opener_modal .modal-btn {
        flex: 1;
        padding: 10px 15px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 13px;
        text-transform: uppercase;
        transition: all 0.2s;
      }
      #card_opener_modal .btn-start {
        background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%);
        color: #fff;
      }
      #card_opener_modal .btn-pause {
        background: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
        color: #1a1a2e;
      }
      #card_opener_modal .btn-stop {
        background: linear-gradient(135deg, #636e72 0%, #2d3436 100%);
        color: #fff;
      }
      #card_opener_modal .progress-section {
        display: none;
        margin-top: 15px;
      }
      #card_opener_modal .progress-bar-container {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 10px;
        overflow: hidden;
        height: 20px;
        margin-bottom: 10px;
      }
      #card_opener_modal .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #fd79a8, #e84393);
        transition: width 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        color: #fff;
      }
      #card_opener_modal .progress-text {
        color: #b8b8b8;
        font-size: 12px;
        text-align: center;
        margin-bottom: 10px;
      }
      #card_opener_modal .cards-summary {
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
        padding: 10px;
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 10px;
      }
      #card_opener_modal .cards-summary-title {
        color: #fd79a8;
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 8px;
      }
      #card_opener_modal .card-row {
        display: flex;
        align-items: center;
        padding: 3px 0;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      #card_opener_modal .card-row img {
        width: 24px;
        height: 24px;
        margin-right: 8px;
      }
      #card_opener_modal .card-row .card-info {
        flex: 1;
        color: #ddd;
        font-size: 12px;
      }
      #card_opener_modal .card-row .card-count {
        color: #55efc4;
        font-weight: bold;
        font-size: 13px;
      }
      /* Mini Widget */
      #card_mini_widget {
        display: none;
        position: fixed;
        bottom: 200px;
        right: 20px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #fd79a8;
        border-radius: 10px;
        padding: 10px 15px;
        z-index: 9999;
        cursor: move;
        box-shadow: 0 0 20px rgba(253, 121, 168, 0.4);
        min-width: 180px;
        touch-action: none;
      }
      #card_mini_widget .mini-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      #card_mini_widget .mini-title {
        color: #fd79a8;
        font-size: 12px;
        font-weight: bold;
      }
      #card_mini_widget .mini-expand {
        color: #fd79a8;
        cursor: pointer;
        font-size: 16px;
      }
      #card_mini_widget .mini-progress {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 6px;
        overflow: hidden;
        height: 14px;
        margin-bottom: 6px;
      }
      #card_mini_widget .mini-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #fd79a8, #e84393);
        transition: width 0.3s ease;
      }
      #card_mini_widget .mini-status {
        color: #b8b8b8;
        font-size: 11px;
        text-align: center;
      }
    `;
    document.head.appendChild(styles);
  }

  createModal() {
    if (document.getElementById('card_opener_modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'card_opener_modal_overlay';

    const modal = document.createElement('div');
    modal.id = 'card_opener_modal';

    modal.innerHTML = `
      <span class="modal-minimize" title="Minimalizuj">_</span>
      <span class="modal-close">&times;</span>
      <div class="modal-title">🃏 Rozpakowywacz</div>
      
      <div class="info-box" id="card_item_info">
        Wybierz paczkę kart
      </div>
      
      <div class="mode-toggle">
        <button class="mode-btn active" id="card_mode_leave">Zostaw X</button>
        <button class="mode-btn" id="card_mode_open">Otwórz X</button>
      </div>
      
      <div class="form-group">
        <label id="card_count_label">Ile paczek zostawić:</label>
        <input type="number" id="card_target_count" min="0" placeholder="0 = otwórz wszystkie">
      </div>
      
      <div class="btn-row" id="card_main_controls">
        <button class="modal-btn btn-start" id="card_btn_start">▶️ START</button>
      </div>
      
      <div class="progress-section" id="card_progress_section">
        <div class="progress-bar-container">
          <div class="progress-bar" id="card_progress_bar" style="width: 0%">0%</div>
        </div>
        <div class="progress-text" id="card_progress_text">Przygotowanie...</div>
        <div class="cards-summary" id="card_summary">
          <div class="cards-summary-title">📋 Zdobyte karty:</div>
          <div id="card_summary_list"></div>
        </div>
        <div class="btn-row">
          <button class="modal-btn btn-pause" id="card_btn_pause">⏸️ PAUZA</button>
          <button class="modal-btn btn-stop" id="card_btn_stop">⏹️ STOP</button>
        </div>
      </div>
    `;

    // Mini widget
    const miniWidget = document.createElement('div');
    miniWidget.id = 'card_mini_widget';
    miniWidget.innerHTML = `
      <div class="mini-header">
        <span class="mini-title">🃏 Karty</span>
        <span class="mini-expand" title="Rozwiń">⬆</span>
      </div>
      <div class="mini-progress">
        <div class="mini-progress-bar" id="card_mini_progress_bar" style="width: 0%"></div>
      </div>
      <div class="mini-status" id="card_mini_status">Wstrzymano</div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    document.body.appendChild(miniWidget);

    this.makeDraggable(miniWidget);

    // Event listeners
    overlay.addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-minimize').addEventListener('click', () => this.minimizeModal());
    miniWidget.querySelector('.mini-expand').addEventListener('click', () => this.expandModal());

    document.getElementById('card_mode_leave').addEventListener('click', () => this.setMode(true));
    document.getElementById('card_mode_open').addEventListener('click', () => this.setMode(false));
    document.getElementById('card_btn_start').addEventListener('click', () => this.onStart());
    document.getElementById('card_btn_pause').addEventListener('click', () => this.onPauseResume());
    document.getElementById('card_btn_stop').addEventListener('click', () => this.onStop());
  }

  setMode(leaveMode) {
    this.useLeaveMode = leaveMode;
    const leaveBtn = document.getElementById('card_mode_leave');
    const openBtn = document.getElementById('card_mode_open');
    const label = document.getElementById('card_count_label');

    if (leaveMode) {
      leaveBtn.classList.add('active');
      openBtn.classList.remove('active');
      label.textContent = 'Ile paczek zostawić:';
    } else {
      leaveBtn.classList.remove('active');
      openBtn.classList.add('active');
      label.textContent = 'Ile paczek otworzyć:';
    }
  }

  attachMenuListener() {
    // Add button when item is a card pack (check for cards pattern in result)
    $(document).on('click', '.player_ekw_item', (e) => {
      const item = $(e.currentTarget);

      setTimeout(() => {
        const menu = document.getElementById('ekw_item_menu');
        if (!menu || menu.style.display === 'none') return;

        // Check if "Użyj" button exists (card packs have it)
        const useBtn = menu.querySelector('#ekw_menu_use');
        if (!useBtn || useBtn.style.display === 'none') return;

        // Check if it's likely a card pack by image path
        const imgSrc = item.attr('data-img') || '';
        if (!imgSrc.includes('card') && !imgSrc.includes('paczk')) {
          // Alternative: check if it's in cards category or similar
          // For now, add button to all "usable" items - user can decide
        }

        // Remove old button if exists
        const oldBtn = menu.querySelector('#ekw_menu_card_opener');
        if (oldBtn) oldBtn.remove();

        const btn = document.createElement('button');
        btn.id = 'ekw_menu_card_opener';
        btn.className = 'ekw_menu_btn option btn_small_gold';
        btn.textContent = 'Otwieracz';
        btn.style.display = '';
        btn.addEventListener('click', () => {
          this.currentItemId = parseInt(item.attr('data-item_id'));
          this.currentItemStack = parseInt(item.attr('data-stack')) || 1;
          const itemImg = item.find('img').attr('src');
          this.showModal(itemImg, this.currentItemStack);
        });
        useBtn.after(btn);
      }, 50);
    });
  }

  showModal(itemImg, stack) {
    document.getElementById('card_item_info').innerHTML = `
      <img src="${itemImg}" style="width: 32px; height: 32px; vertical-align: middle; margin-right: 10px;">
      Posiadasz: <span class="highlight">${stack}</span> paczek
    `;

    document.getElementById('card_opener_modal_overlay').style.display = 'block';
    document.getElementById('card_opener_modal').style.display = 'block';
    document.getElementById('card_main_controls').style.display = 'flex';
    document.getElementById('card_progress_section').style.display = 'none';
  }

  hideModal() {
    if (this.isRunning) this.onStop(true);
    document.getElementById('card_opener_modal_overlay').style.display = 'none';
    document.getElementById('card_opener_modal').style.display = 'none';
  }

  minimizeModal() {
    document.getElementById('card_opener_modal_overlay').style.display = 'none';
    document.getElementById('card_opener_modal').style.display = 'none';
    document.getElementById('card_mini_widget').style.display = 'block';
  }

  expandModal() {
    document.getElementById('card_mini_widget').style.display = 'none';
    document.getElementById('card_opener_modal_overlay').style.display = 'block';
    document.getElementById('card_opener_modal').style.display = 'block';
  }

  makeDraggable(element) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    const onStart = (e) => {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = element.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
      element.style.transition = 'none';
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      let newX = Math.max(0, Math.min(clientX - offsetX, window.innerWidth - element.offsetWidth));
      let newY = Math.max(0, Math.min(clientY - offsetY, window.innerHeight - element.offsetHeight));
      element.style.left = newX + 'px';
      element.style.top = newY + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    };

    const onEnd = () => { isDragging = false; element.style.transition = ''; };

    element.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    element.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  async onStart() {
    this.isRunning = true;
    this.isPaused = false;
    this.targetCount = parseInt(document.getElementById('card_target_count').value) || 0;
    this.openedCount = 0;
    this.collectedCards = {};

    // Calculate how many to open
    let toOpen;
    if (this.useLeaveMode) {
      toOpen = Math.max(0, this.currentItemStack - this.targetCount);
    } else {
      toOpen = Math.min(this.currentItemStack, this.targetCount || this.currentItemStack);
    }

    if (toOpen <= 0) {
      this.updateProgressText('❌ Nie ma czego otwierać!');
      return;
    }

    this.totalToOpen = toOpen;

    document.getElementById('card_main_controls').style.display = 'none';
    document.getElementById('card_progress_section').style.display = 'block';
    document.getElementById('card_btn_pause').textContent = '⏸️ PAUZA';
    document.getElementById('card_summary_list').innerHTML = '';

    await this.runOpenProcess();
  }

  onPauseResume() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('card_btn_pause');
    if (this.isPaused) {
      btn.textContent = '▶️ WZNÓW';
      this.updateProgressText('⏸️ Wstrzymano...');
    } else {
      btn.textContent = '⏸️ PAUZA';
    }
  }

  onStop(hideProgress = true) {
    this.isRunning = false;
    this.isPaused = false;
    document.getElementById('card_main_controls').style.display = 'flex';
    if (hideProgress) {
      document.getElementById('card_progress_section').style.display = 'none';
    }
  }

  updateProgress(percent) {
    const bar = document.getElementById('card_progress_bar');
    bar.style.width = `${percent}%`;
    bar.textContent = `${percent}%`;
    const miniBar = document.getElementById('card_mini_progress_bar');
    if (miniBar) miniBar.style.width = `${percent}%`;
  }

  updateProgressText(text) {
    document.getElementById('card_progress_text').textContent = text;
    const miniStatus = document.getElementById('card_mini_status');
    if (miniStatus) miniStatus.textContent = text.length > 25 ? text.substring(0, 22) + '...' : text;
  }

  updateCardSummary() {
    const list = document.getElementById('card_summary_list');
    let html = '';

    // Sort by count ascending (rarest first)
    const sorted = Object.entries(this.collectedCards).sort((a, b) => a[1].count - b[1].count);

    for (const [img, data] of sorted) {
      html += `
        <div class="card-row">
          <img src="${img}">
          <span class="card-info">Lv ${data.level}</span>
          <span class="card-count">x${data.count}</span>
        </div>
      `;
    }

    list.innerHTML = html || '<div style="color:#888;text-align:center;">Brak kart</div>';
  }

  parseCards() {
    const container = document.querySelector('#kom_con .limited_kom');
    if (!container) return;

    const cards = container.querySelectorAll('.small_card');
    cards.forEach(card => {
      const img = card.querySelector('img');
      const levelSpan = card.querySelector('span');
      const countI = card.querySelector('i');

      if (img && levelSpan && countI) {
        const imgSrc = img.getAttribute('src');
        const level = parseInt(levelSpan.textContent) || 1;
        const count = parseInt(countI.textContent) || 1;

        if (!this.collectedCards[imgSrc]) {
          this.collectedCards[imgSrc] = { level, count: 0 };
        }
        this.collectedCards[imgSrc].count += count;
      }
    });

    this.updateCardSummary();
  }

  async waitForCardsResult(timeout = 5000) {
    for (let i = 0; i < timeout / 100; i++) {
      await this.delay(100);
      const kom = document.querySelector('#kom_con .kom .content');
      if (kom && kom.textContent.includes('Użyto przedmiotu')) {
        // Wait a bit for cards to render
        await this.delay(200);
        this.parseCards();
        kom_clear();
        return true;
      }
    }
    kom_clear();
    return false;
  }

  async runOpenProcess() {
    let remaining = this.totalToOpen;

    this.updateProgressText(`Otwieranie ${remaining} paczek...`);

    while (this.isRunning && remaining > 0) {
      // Check pause
      while (this.isPaused && this.isRunning) {
        await this.delay(200);
      }
      if (!this.isRunning) break;

      // Open in batches of max 100
      const batchSize = Math.min(100, remaining);

      this.updateProgressText(`📦 Otwieranie ${batchSize} paczek...`);

      // Emit open command
      GAME.emitOrder({ a: 12, type: 14, iid: this.currentItemId, page: GAME.ekw_page, page2: GAME.ekw_page2, am: batchSize });

      // Wait for result
      const success = await this.waitForCardsResult(8000);

      if (success) {
        this.openedCount += batchSize;
        remaining -= batchSize;

        // Update progress
        const percent = Math.round(((this.totalToOpen - remaining) / this.totalToOpen) * 100);
        this.updateProgress(percent);
        this.updateProgressText(`✅ Otwarto ${this.openedCount}/${this.totalToOpen}`);
      } else {
        this.updateProgressText('⚠️ Brak odpowiedzi!');
        await this.delay(2000);
        this.onStop(false);
        return;
      }

      // Delay between batches
      await this.delay(800);
    }

    // Final message
    if (this.isRunning) {
      const totalCards = Object.values(this.collectedCards).reduce((sum, c) => sum + c.count, 0);
      this.updateProgressText(`🎉 Gotowe! ${totalCards} kart z ${this.openedCount} paczek`);
      this.updateProgress(100);
      await this.delay(2000);
      this.onStop(false);
    }
  }
}

// Initialize card pack opener
new cardPackOpener();