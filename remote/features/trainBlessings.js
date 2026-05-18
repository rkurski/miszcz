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

    // Track server-confirmed ekw page state (independent of GAME.ekw_page,
    // which we set optimistically before the response lands and can desync).
    let _lastEkwPage = null;
    const _ekwWaiters = {};  // { page: [callback(success), ...] }

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
    // EKW PAGE FETCH (parseData(15)-driven, replaces optimistic GAME.ekw_page)
    // ============================================

    // Hook parseData(case 15) to track which ekw page the server actually
    // confirmed loading into #ekw_page_items. Without this, we relied on
    // GAME.ekw_page (which we set BEFORE the response lands), so a stuck
    // response or fast retry could leave us reading stale DOM → "Brak!".
    function hookParseDataForEkw() {
      if (!GAME.parseData) {
        setTimeout(hookParseDataForEkw, 500);
        return;
      }
      if (GAME._trainBlessPDHooked) return;
      GAME._trainBlessPDHooked = true;

      const origPD = GAME.parseData.bind(GAME);
      GAME.parseData = function (type, res) {
        origPD(type, res);
        if (type === 15 && res && res.page !== undefined) {
          _lastEkwPage = res.page;
          const callbacks = _ekwWaiters[res.page];
          if (callbacks && callbacks.length) {
            _ekwWaiters[res.page] = [];
            callbacks.forEach(cb => cb(true));
          }
        }
      };
      console.log('[TrainBless] Hooked into GAME.parseData (case 15)');
    }

    // Ensure #ekw_page_items currently contains items from the given page,
    // emitting a:12 if needed. Resolves callback with success=true when the
    // server's parseData(15) lands; false on 3s timeout.
    //
    // extraParams (e.g. page2/page3 for sub-categories) force a fresh emit
    // because _lastEkwPage cache only tracks the top-level page id.
    function ensureEkwPage(page, extraParams, cb) {
      if (_lastEkwPage === page && !extraParams) {
        cb(true);
        return;
      }

      if (!_ekwWaiters[page]) _ekwWaiters[page] = [];
      let fired = false;
      const wrappedCb = (success) => {
        if (fired) return;
        fired = true;
        clearTimeout(timeoutId);
        cb(success);
      };
      _ekwWaiters[page].push(wrappedCb);

      const timeoutId = setTimeout(() => {
        const idx = _ekwWaiters[page].indexOf(wrappedCb);
        if (idx >= 0) _ekwWaiters[page].splice(idx, 1);
        wrappedCb(false);
      }, 3000);

      GAME.ekw_page = page;
      const emitData = { a: 12, page: page, used: 1 };
      if (extraParams) Object.assign(emitData, extraParams);
      GAME.socket.emit('ga', emitData);
    }

    // ============================================
    // USE BLESSING (wzorzec z respawn.js:check_bless)
    // ============================================

    function showNoItem(btnElement) {
      const label = btnElement.querySelector('.bless-label');
      const origText = label.textContent;
      label.textContent = 'Brak!';
      btnElement.classList.add('bless-no-item');
      setTimeout(() => {
        label.textContent = origText;
        btnElement.classList.remove('bless-no-item');
      }, 1500);
    }

    function findItemId(baseItemId) {
      return $(`#ekw_page_items`).find(`div[data-base_item_id=${baseItemId}]`).attr('data-item_id');
    }

    function useBless(baseItemId, buffId, btnElement) {
      // Per-button reentry guard — protects against rapid clicks consuming
      // multiple items before the first use completes.
      if (btnElement._afoBlessBusy) return;
      btnElement._afoBlessBusy = true;
      const finish = () => { btnElement._afoBlessBusy = false; };

      const bless = BLESSINGS.find(b => b.baseItemId === baseItemId);
      if (!bless) { finish(); return; }

      const fireUse = (itemId) => {
        GAME.socket.emit('ga', { a: 12, type: 14, iid: parseInt(itemId), page: GAME.ekw_page });
        setTimeout(refreshTimers, 1000);
        finish();
      };

      // Step 1: fetch the bless's primary page; wait for server confirmation.
      ensureEkwPage(bless.page, null, (success) => {
        if (!success) { showNoItem(btnElement); finish(); return; }

        const itemId = findItemId(baseItemId);
        if (itemId) { fireUse(itemId); return; }

        // Step 2 (x3 Rate only): walk fallback page combos until item found
        // or list exhausted.
        if (bless.page !== 1 || RATE_FALLBACKS.length === 0) {
          showNoItem(btnElement); finish(); return;
        }

        let fbIdx = 0;
        const tryFallback = () => {
          if (fbIdx >= RATE_FALLBACKS.length) {
            showNoItem(btnElement); finish(); return;
          }
          const fb = RATE_FALLBACKS[fbIdx++];
          const params = { page2: fb.page2 };
          if (fb.page3 !== undefined) params.page3 = fb.page3;
          ensureEkwPage(fb.page, params, (ok) => {
            if (!ok) { tryFallback(); return; }
            const id = findItemId(baseItemId);
            if (id) { fireUse(id); return; }
            tryFallback();
          });
        };
        tryFallback();
      });
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
    hookParseDataForEkw();

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
