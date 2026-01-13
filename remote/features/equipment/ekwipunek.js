class ekwipunekMenager {
  constructor() {
    const otwieranieKart = new cardOpen();
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

class cardOpen {
  constructor() {
    $("body").on("click", '#ekw_page_items div[data-base_item_id="1784"]', () => {
      $("#ekw_menu_use").one("click", () => {
        setTimeout(() => {
          $(`<button class="btn_small_gold otwieranie_kart" style="margin-right:4ch;">X100 OPEN</button>`).insertBefore("#kom_con > div > div.content > div:nth-child(1) > button.option.btn_small_gold");
        }, 500);
      });
    });

    $("body").on("click", '.otwieranie_kart', () => {
      let upperLimit = parseInt(document.querySelector("#item_am").value, 10);
      if (!isNaN(upperLimit) && upperLimit > 0) {
        let stopOpening = false;
        for (let i = 0; i < upperLimit; i++) {
          setTimeout(() => {
            if (stopOpening) return;
            let cards = $(`#ekw_page_items div[data-base_item_id="1784"]`);
            if (cards.length === 0) {
              setTimeout(() => { GAME.komunikat("Karty się skończyły."); }, 1000);
              stopOpening = true;
              return;
            }
            let cards_id = parseInt(cards.attr("data-item_id"));
            let stack = parseInt(cards.attr('data-stack'), 10);
            if (stack < 100) {
              GAME.socket.emit('ga', { a: 12, type: 14, iid: cards_id, page: GAME.ekw_page, page2: GAME.ekw_page2, am: stack });
              setTimeout(() => { GAME.komunikat("Karty się skończyły."); }, 1000);
              stopOpening = true;
              return;
            }
            GAME.socket.emit('ga', { a: 12, type: 14, iid: cards_id, page: GAME.ekw_page, page2: GAME.ekw_page2, am: '100' });
          }, i * 2000);
        }
      } else {
        console.error("Wartość #item_am nie jest poprawną liczbą lub jest mniejsza niż 1.");
      }
    });
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