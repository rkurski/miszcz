/**
 * ============================================================================
 * Train Blessings Quick-Use Module (Standalone)
 * ============================================================================
 *
 * Wstrzykuje sekcję "Blessy" z przyciskami na stronę treningu (#page_game_train).
 * Każdy przycisk używa błogosławieństwa i wyświetla timer aktywnego buffa.
 * Działa standalone, bez zależności od AFO.
 *
 * Flow użycia blessa wzorowany na respawn.js:check_bless (linie 267-284).
 *
 * ============================================================================
 */

(function () {
  'use strict';

  const waitForGame = setInterval(() => {
    if (typeof GAME !== 'undefined' && GAME.char_data && GAME.char_id) {
      clearInterval(waitForGame);
      initTrainBlessings();
    }
  }, 100);

  function initTrainBlessings() {

    // ============================================
    // CONFIG
    // ============================================

    const BLESSINGS = [
      { label: '250% Tren', baseItemId: 1629, buffId: 54, page: 10 },
      { label: '5% Kod', baseItemId: 1751, buffId: 80, page: 10 },
      { label: '5% Rezultat', baseItemId: 2231, buffId: 110, page: 10 },
      { label: 'x3 Rate', baseItemId: 1707, buffId: 201, page: 1 }
    ];

    // x3 Rate fallback pages — if not found on page 1, try these emit combos
    const RATE_FALLBACKS = [
      { page: 10, page2: 1 },
      { page: 10, page2: 1, page3: 2 }
    ];

    // ============================================
    // CSS
    // ============================================

    function injectCSS() {
      if (document.getElementById('afo_train_bless_css')) return;

      const style = document.createElement('style');
      style.id = 'afo_train_bless_css';
      style.textContent = `
        #afo_train_bless_section {
          margin-bottom: 10px;
        }
        #afo_train_bless_section h1 {
          margin-bottom: 6px;
        }
        .afo-bless-btns {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .afo-bless-btn {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          min-width: 90px;
          padding: 5px 10px;
          cursor: pointer;
          text-align: center;
          line-height: 1.3;
          height: 35px;
        }
        .afo-bless-btn .bless-label {
          font-weight: bold;
        }
        .afo-bless-btn .bless-timer {
          font-size: 0.85em;
          color: #888;
        }
        .afo-bless-btn .bless-timer.active {
          color: #5c5;
        }
        .afo-bless-btn.bless-no-item {
          opacity: 0.5;
        }
      `;
      document.head.appendChild(style);
    }

    // ============================================
    // UI INJECTION
    // ============================================

    function injectUI() {
      const trainUpgrade = document.getElementById('train_upgrade');
      if (!trainUpgrade) return;
      if (document.getElementById('afo_train_bless_section')) return;

      const section = document.createElement('div');
      section.id = 'afo_train_bless_section';

      const heading = document.createElement('h1');
      heading.textContent = 'Blessy';
      section.appendChild(heading);

      const btnsContainer = document.createElement('div');
      btnsContainer.className = 'afo-bless-btns';

      for (const bless of BLESSINGS) {
        const btn = document.createElement('button');
        btn.className = 'big_button option afo-bless-btn';
        btn.dataset.baseItemId = bless.baseItemId;
        btn.dataset.buffId = bless.buffId;

        const labelSpan = document.createElement('span');
        labelSpan.className = 'bless-label';
        labelSpan.textContent = bless.label;

        const timerSpan = document.createElement('span');
        timerSpan.className = 'bless-timer';
        timerSpan.textContent = 'Nieaktywny';

        btn.appendChild(labelSpan);
        btn.appendChild(timerSpan);

        btn.addEventListener('click', () => {
          useBless(bless.baseItemId, bless.buffId, btn);
        });

        btnsContainer.appendChild(btn);
      }

      section.appendChild(btnsContainer);
      trainUpgrade.parentNode.insertBefore(section, trainUpgrade);
    }

    // ============================================
    // REFRESH TIMERS
    // ============================================

    function refreshTimers() {
      const btns = document.querySelectorAll('.afo-bless-btn');
      for (const btn of btns) {
        const buffId = btn.dataset.buffId;
        const timerSpan = btn.querySelector('.bless-timer');
        if (!timerSpan) continue;

        const buffEl = $(`#char_buffs`).find(`[data-buff=${buffId}]`);
        if (buffEl.length === 1) {
          const timerText = buffEl.find('.timer').text();
          timerSpan.textContent = timerText || 'Aktywny';
          timerSpan.classList.add('active');
        } else {
          timerSpan.textContent = 'Nieaktywny';
          timerSpan.classList.remove('active');
        }
      }
    }

    // ============================================
    // USE BLESSING (wzorzec z respawn.js:check_bless)
    // ============================================

    function useBless(baseItemId, buffId, btnElement, fallbackIdx) {
      // Find blessing config
      const bless = BLESSINGS.find(b => b.baseItemId === baseItemId);
      const targetPage = bless ? bless.page : 10;
      fallbackIdx = fallbackIdx || 0;

      // Krok 1: Upewnij się że ekw jest na właściwej stronie (respawn.js:267-270)
      if (GAME.ekw_page != targetPage) {
        GAME.ekw_page = targetPage;
        GAME.socket.emit('ga', { a: 12, page: targetPage, used: 1 });
        setTimeout(() => useBless(baseItemId, buffId, btnElement, fallbackIdx), 600);
        return;
      }

      // Krok 2: Znajdź item po base_item_id (respawn.js:276)
      let itemId = $(`#ekw_page_items`).find(`div[data-base_item_id=${baseItemId}]`).attr('data-item_id');

      // x3 Rate fallback — try alternate page combos if item not found
      if (!itemId && bless && bless.page === 1 && fallbackIdx < RATE_FALLBACKS.length) {
        const fb = RATE_FALLBACKS[fallbackIdx];
        GAME.ekw_page = fb.page;
        GAME.socket.emit('ga', { a: 12, page: fb.page, used: 1, page2: fb.page2, ...(fb.page3 !== undefined && { page3: fb.page3 }) });
        setTimeout(() => useBless(baseItemId, buffId, btnElement, fallbackIdx + 1), 600);
        return;
      }

      if (!itemId) {
        // Brak itema w ekwipunku
        const label = btnElement.querySelector('.bless-label');
        const origText = label.textContent;
        label.textContent = 'Brak!';
        btnElement.classList.add('bless-no-item');
        setTimeout(() => {
          label.textContent = origText;
          btnElement.classList.remove('bless-no-item');
        }, 1500);
        return;
      }

      // Krok 3: Użyj blessa (respawn.js:283)
      GAME.socket.emit('ga', { a: 12, type: 14, iid: parseInt(itemId), page: GAME.ekw_page });

      // Odśwież timery po chwili (daj czas na response serwera)
      setTimeout(() => refreshTimers(), 1000);
    }

    // ============================================
    // HOOK page_switch (wzorzec z activitiesExecutor.js / traderAutoBuy.js)
    // ============================================

    function hookPageSwitch() {
      if (!GAME.page_switch) {
        console.log('[TrainBless] GAME.page_switch not found');
        return false;
      }

      const origPageSwitch = GAME.page_switch.bind(GAME);

      GAME.page_switch = function (page, arg) {
        origPageSwitch(page, arg);

        if (page === 'game_train') {
          setTimeout(() => {
            injectUI();
            refreshTimers();
          }, 150);
        }
      };

      console.log('[TrainBless] Hooked into GAME.page_switch');
      return true;
    }

    // ============================================
    // INIT
    // ============================================

    injectCSS();
    hookPageSwitch();

    // If already on train page, inject immediately
    if ($('#page_game_train').is(':visible')) {
      setTimeout(() => {
        injectUI();
        refreshTimers();
      }, 150);
    }

    console.log('[TrainBless] Module initialized');
  }
})();
