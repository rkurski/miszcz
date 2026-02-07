/**
 * ============================================================================
 * Activities Auto-Executor Module (Standalone - loaded via gieniobot)
 * ============================================================================
 * 
 * Automatyczne wykonywanie codziennych aktywności.
 * Wstrzykuje checkboxy i przycisk "Wykonaj" do strony #page_game_activities.
 * 
 * ============================================================================
 */

(function () {
  'use strict';

  // Czekaj na GAME
  const waitForGame = setInterval(() => {
    if (typeof GAME !== 'undefined' && GAME.char_data && GAME.char_id) {
      clearInterval(waitForGame);
      initActivitiesModule();
    }
  }, 100);

  function initActivitiesModule() {

    // ============================================
    // STATE
    // ============================================
    window.ACTIVITIES = window.ACTIVITIES || {
      stop: true,
      paused: false,
      running: false,
      selectedActivities: [],
      completedActivities: [],
      currentActivity: null,
      earnedPoints: 0,  // Punkty zdobyte w tej sesji
      status: 'idle',
      substanceType: 'x20'  // x3, x4, x20, OST
    };

    // ============================================
    // CONFIGURATION
    // ============================================

    // Punkty za każdą aktywność
    const ACTIVITY_POINTS = {
      'Odbierz nagrodę za codzienne logowanie': 5,
      'Ulepsz Kulę Energii': 10,
      'Ulepsz lub połącz dowolny przedmiot': 5,
      'Użyj dowolną fasolkę Senzu lub wyciąg': 10,
      'Przekaż przedmioty na PU klanu': 10,
      'Użyj Substancję Przyspieszającą': 10,
      'Udaj się na wyprawę': 5,
      'Walcz na Arenie PvP': 10,
      'Walcz w Otchłani Dusz': 5,
      'Asystuj w treningu klanowym': 5,
      'Pobłogosław innego gracza': 10,
      'Odbierz nagrodę VIP': 10,
      'Wykonaj zadanie na Prywatnej Planecie': 10,
      'Wykonaj zadanie na Planecie Klanowej': 10,
      'Wykonaj zadanie w siedzibie imperium': 10,
      'Odbierz nagrodę za List Gończy PvM': 10,
      'Ukończ trening': 5,
      'Ulepsz trening': 10,
      'Wykonaj dowolną instancję': 10,
      'Pokonaj wroga imperialnego': 10,
      'Pokonaj wroga klanowego': 10
    };

    function getActivityPoints(activityName) {
      for (const [key, points] of Object.entries(ACTIVITY_POINTS)) {
        if (activityName.includes(key)) {
          return points;
        }
      }
      return 1;  // Default 1 punkt
    }

    // Lista aktywności z warunkami disabled
    const activityRules = {
      'Wykonaj dowolną instancję': () => true,
      'Odbierz nagrodę za List Gończy PvM': () => {
        const reborn = GAME.char_data?.reborn || 0;
        return reborn < 2;
      },
      'Przekaż przedmioty na PU klanu': () => GAME.char_data?.klan_id === 0,
      'Wykonaj zadanie na Planecie Klanowej': () => GAME.char_data?.klan_id === 0,
      'Wykonaj zadanie w siedzibie imperium': () => GAME.char_data?.empire === 0,
      'Wykonaj zadanie na Prywatnej Planecie': () => GAME.quick_opts && !GAME.quick_opts.private_planet,
      'Pokonaj wroga imperialnego': () => GAME.char_data?.empire === 0,
      'Pokonaj wroga klanowego': () => GAME.char_data?.klan_id === 0,
      'Asystuj w treningu klanowym': () => GAME.char_data?.klan_id === 0 || GAME.char_data?.reborn < 1,
      'Pobłogosław innego gracza': () => GAME.char_data?.reborn < 2,
      'Odbierz nagrodę VIP': () => {
        const reborn = GAME.char_data?.reborn || 0;
        const gvip = GAME.char_data?.gvip_level || 0;
        const vip = GAME.char_data?.vip_level || 0;
        return reborn < 3 && gvip === 0 && vip === 0;
      }
    };

    // Aktywności domyślnie odznaczone (ale nie disabled)
    const defaultUnchecked = ['Wykonaj dowolną instancję', 'Udaj się na wyprawę', 'Pokonaj wroga imperialnego', 'Pokonaj wroga klanowego'];

    // ============================================
    // CSS INJECTION
    // ============================================

    function injectCSS() {
      if (document.getElementById('afo_activities_css')) return;

      const css = `
        /* Activities Execute Button */
        #afo_activities_execute_btn {
          margin: 10px 0;
          padding: 0px 20px;
          font-size: 14px;
          cursor: pointer;
        }

        /* Progress modal */
        #afo_activities_modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.95);
          border: 2px solid #ffd700;
          border-radius: 8px;
          padding: 20px;
          z-index: 99999;
          min-width: 300px;
          color: white;
          display: none;
        }
        #afo_activities_modal .modal-title {
          font-size: 16px;
          font-weight: bold;
          color: #ffd700;
          margin-bottom: 15px;
          text-align: center;
        }
        #afo_activities_modal .modal-status {
          font-size: 13px;
          margin-bottom: 10px;
          min-height: 20px;
        }
        #afo_activities_modal .modal-points {
          font-size: 12px;
          color: #aaa;
          margin-bottom: 15px;
        }
        #afo_activities_modal .modal-points b {
          color: #ffd700;
        }
        #afo_activities_modal .modal-controls {
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        #afo_activities_modal .modal-controls button {
          min-width: 80px;
          padding: 0px 12px;
          cursor: pointer;
        }
      `;

      const style = document.createElement('style');
      style.id = 'afo_activities_css';
      style.textContent = css;
      document.head.appendChild(style);
    }

    // ============================================
    // MAIN INJECTION FUNCTION
    // ============================================

    let _injecting = false;  // Prevent multiple simultaneous injections

    function injectActivitiesUI() {
      // Prevent multiple calls
      if (_injecting) return;
      _injecting = true;

      const container = document.getElementById('char_activieties');
      if (!container) {
        console.log('[Activities] Container #char_activieties not found');
        _injecting = false;
        return;
      }

      const activities = container.querySelectorAll('.activity');
      if (activities.length === 0) {
        console.log('[Activities] No .activity elements found');
        _injecting = false;
        return;
      }

      // Check if already fully injected (all activities have checkboxes)
      const existingCheckboxes = container.querySelectorAll('.afo-cb');
      if (existingCheckboxes.length >= activities.length) {
        console.log('[Activities] Already injected, skipping');
        _injecting = false;
        return;
      }

      console.log('[Activities] Injecting checkboxes into', activities.length, 'activities...');

      // Inject checkboxes
      let injectedCount = 0;
      activities.forEach(activityDiv => {
        // Skip if already has checkbox
        if (activityDiv.querySelector('.afo-cb')) return;

        // Get activity text
        const fullText = activityDiv.textContent || '';
        const activityText = fullText.replace(/\d+p\s*$/, '').trim();

        // Check if done
        const isDone = activityDiv.querySelector('img[src*="done.png"]') !== null;

        // Check disabled conditions
        let isDisabled = false;
        for (const [name, checkFn] of Object.entries(activityRules)) {
          if (activityText.includes(name)) {
            isDisabled = checkFn();
            break;
          }
        }

        // Check if default unchecked
        const isDefaultUnchecked = defaultUnchecked.some(name => activityText.includes(name));

        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'afo-cb';
        checkbox.dataset.activity = activityText;
        checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';

        if (isDone) {
          checkbox.checked = false;
          checkbox.disabled = true;
          checkbox.title = 'Już ukończone';
        } else if (isDisabled) {
          checkbox.checked = false;
          checkbox.disabled = true;
          checkbox.title = 'Nie spełniasz wymagań';
        } else {
          checkbox.checked = !isDefaultUnchecked;
        }

        // Insert at beginning
        activityDiv.insertBefore(checkbox, activityDiv.firstChild);
        injectedCount++;

        // Special: Add substance toggle for "Użyj Substancję" activity
        if (activityText.includes('Użyj Substancję Przyspieszającą') && !activityDiv.querySelector('.afo-substance-toggle')) {
          const toggle = document.createElement('span');
          toggle.className = 'afo-substance-toggle';
          toggle.dataset.value = ACTIVITIES.substanceType || 'x20';
          toggle.textContent = ACTIVITIES.substanceType || 'x20';
          toggle.style.cssText = 'background: #555; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-left: 5px; cursor: pointer; color: #ffd700;';
          toggle.title = 'Kliknij aby zmienić typ substancji';

          // Toggle cycle: x3 -> x4 -> x20 -> OST -> x3
          toggle.onclick = (e) => {
            e.stopPropagation();
            const values = ['x3', 'x4', 'x20', 'OST'];
            const current = toggle.dataset.value;
            const idx = values.indexOf(current);
            const next = values[(idx + 1) % values.length];
            toggle.dataset.value = next;
            toggle.textContent = next;
            ACTIVITIES.substanceType = next;
            console.log('[Activities] Substance type changed to:', next);
          };

          // Insert before the points span
          const pointsSpan = activityDiv.querySelector('.pull-right');
          if (pointsSpan) {
            activityDiv.insertBefore(toggle, pointsSpan);
          } else {
            activityDiv.appendChild(toggle);
          }
        }
      });

      // Inject execute button
      if (!document.getElementById('afo_activities_execute_btn')) {
        const page = document.getElementById('page_game_activities');
        if (page) {
          const btn = document.createElement('button');
          btn.id = 'afo_activities_execute_btn';
          btn.className = 'newBtn';
          btn.textContent = 'WYKONAJ ZAZNACZONE';
          btn.onclick = startExecution;

          // Find "Aktywności:" label
          const labels = page.querySelectorAll('p.orange');
          let targetLabel = null;
          labels.forEach(p => {
            if (p.textContent.includes('Aktywności')) {
              targetLabel = p;
            }
          });

          if (targetLabel) {
            targetLabel.parentNode.insertBefore(btn, targetLabel.nextSibling);
          } else {
            container.parentNode.insertBefore(btn, container);
          }
        }
      }

      // Inject modal
      injectModal();

      console.log('[Activities] Injected', injectedCount, 'checkboxes');
      _injecting = false;
    }

    function injectModal() {
      if (document.getElementById('afo_activities_modal')) return;

      const overlay = document.createElement('div');
      overlay.id = 'afo_activities_modal_overlay';

      const modal = document.createElement('div');
      modal.id = 'afo_activities_modal';
      modal.innerHTML = `
        <div class="modal-title">Wykonywanie Aktywności</div>
        <div class="modal-status" id="afo_act_status">Przygotowanie...</div>
        <div class="modal-points">Punkty: <b id="afo_act_points">0</b></div>
        <div class="modal-controls">
          <button class="newBtn" id="afo_act_pause">PAUZA</button>
          <button class="newBtn" id="afo_act_stop">PRZERWIJ</button>
        </div>
      `;

      document.body.appendChild(overlay);
      document.body.appendChild(modal);

      document.getElementById('afo_act_pause').onclick = togglePause;
      document.getElementById('afo_act_stop').onclick = stopExecution;
    }

    // ============================================
    // HOOK INTO GAME.page_switch
    // ============================================

    function hookPageSwitch() {
      if (!GAME.page_switch) {
        console.log('[Activities] GAME.page_switch not found, using fallback');
        return false;
      }

      // Save original
      const originalPageSwitch = GAME.page_switch.bind(GAME);

      // Override
      GAME.page_switch = function (page, arg) {
        // Call original first (pass all arguments)
        originalPageSwitch(page, arg);

        // Check if switching to activities page
        if (page === 'game_activities') {
          console.log('[Activities] Detected switch to game_activities');

          // First attempt after 100ms
          setTimeout(() => {
            injectActivitiesUI();
          }, 100);

          // Retry after 500ms - force inject if checkboxes missing
          setTimeout(() => {
            verifyAndInject();
          }, 500);

          // Final retry after 1s
          setTimeout(() => {
            verifyAndInject();
          }, 1000);
        }
      };

      console.log('[Activities] Hooked into GAME.page_switch');
      return true;
    }

    // Verify checkboxes exist and inject if missing
    function verifyAndInject() {
      const container = document.getElementById('char_activieties');
      if (!container) return;

      const activities = container.querySelectorAll('.activity');
      const checkboxes = container.querySelectorAll('.afo-cb');

      // If we have activities but no/few checkboxes, force reinject
      if (activities.length > 0 && checkboxes.length < activities.length) {
        console.log('[Activities] Checkboxes missing (' + checkboxes.length + '/' + activities.length + '), forcing inject...');
        _injecting = false;  // Reset lock
        injectActivitiesUI();
      }
    }

    // ============================================
    // MODAL CONTROL
    // ============================================

    function showModal() {
      const overlay = document.getElementById('afo_activities_modal_overlay');
      const modal = document.getElementById('afo_activities_modal');
      if (overlay) overlay.style.display = 'block';
      if (modal) modal.style.display = 'block';
    }

    function hideModal() {
      const overlay = document.getElementById('afo_activities_modal_overlay');
      const modal = document.getElementById('afo_activities_modal');
      if (overlay) overlay.style.display = 'none';
      if (modal) modal.style.display = 'none';
    }

    function updateStatus(text) {
      const el = document.getElementById('afo_act_status');
      if (el) el.textContent = text;
    }

    function updatePoints() {
      const el = document.getElementById('afo_act_points');
      if (el) {
        // Pobierz aktualną wartość z gry
        const currentActivity = parseInt($('#char_activity').text()) || 0;
        // Dodaj punkty zdobyte w tej sesji
        const total = currentActivity + ACTIVITIES.earnedPoints;
        el.textContent = `${total}/150`;
      }

      // Also update progress bar if exists
      const progressEl = document.getElementById('afo_act_progress');
      if (progressEl) {
        const total = ACTIVITIES.selectedActivities.length;
        const done = ACTIVITIES.completedActivities.length;
        progressEl.textContent = `${done}/${total}`;
      }
    }

    // ============================================
    // EXECUTION CONTROL
    // ============================================

    function startExecution() {
      // Check if AFO is loaded
      if (typeof AFO_DAILY === 'undefined' || typeof AFO_LPVM === 'undefined') {
        if (typeof GAME !== 'undefined' && GAME.komunikat) {
          GAME.komunikat('⚠️ Najpierw uruchom AFO! Kliknij ikonę AFO w panelu.');
        } else {
          alert('⚠️ Najpierw uruchom AFO! Kliknij ikonę AFO w panelu.');
        }
        return;
      }

      const checkboxes = document.querySelectorAll('.afo-cb:checked:not(:disabled)');
      if (checkboxes.length === 0) {
        if (typeof GAME !== 'undefined' && GAME.komunikat) {
          GAME.komunikat('Nie zaznaczono żadnych aktywności!');
        } else {
          alert('Nie zaznaczono żadnych aktywności!');
        }
        return;
      }

      const selected = [];
      checkboxes.forEach(cb => selected.push(cb.dataset.activity));

      ACTIVITIES.stop = false;
      ACTIVITIES.paused = false;
      ACTIVITIES.running = true;
      ACTIVITIES.selectedActivities = selected;
      ACTIVITIES.completedActivities = [];
      ACTIVITIES.currentActivity = null;
      ACTIVITIES.earnedPoints = 0;  // Reset punktów
      ACTIVITIES.status = 'running';

      console.log('[Activities] Starting with', selected.length, 'activities');

      showModal();
      updateStatus('Rozpoczynanie...');
      updatePoints();
      document.getElementById('afo_act_pause').textContent = 'PAUZA';

      setTimeout(processNextActivity, 500);
    }

    function togglePause() {
      if (!ACTIVITIES.running) return;

      if (ACTIVITIES.paused) {
        ACTIVITIES.paused = false;
        ACTIVITIES.status = 'running';
        document.getElementById('afo_act_pause').textContent = 'PAUZA';
        updateStatus('Wznowiono...');
        processNextActivity();
      } else {
        ACTIVITIES.paused = true;
        ACTIVITIES.status = 'paused';
        document.getElementById('afo_act_pause').textContent = 'WZNÓW';
        updateStatus('⏸ Wstrzymano');
      }
    }

    function stopExecution() {
      ACTIVITIES.stop = true;
      ACTIVITIES.paused = false;
      ACTIVITIES.running = false;
      ACTIVITIES.status = 'stopped';
      ACTIVITIES.currentActivity = null;

      updateStatus('Przerwano');
      console.log('[Activities] Stopped');

      setTimeout(hideModal, 1500);
    }

    function completeExecution() {
      ACTIVITIES.stop = true;
      ACTIVITIES.running = false;
      ACTIVITIES.status = 'completed';

      updateStatus('Ukończono! Zbieram nagrody...');
      updatePoints();
      console.log('[Activities] Completed');

      // Collect activity rewards
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 49, type: 0 });
        setTimeout(() => {
          // Zbierz nagrody
          const received = $("#act_prizes").find("div.act_prize.disabled").length;
          const activity = parseInt($('#char_activity').text());
          const thresholds = [25, 50, 75, 100, 150];

          for (let i = 0; i <= 5; i++) {
            if (received < 5 && activity >= thresholds[i]) {
              const actPrize = $(`#act_prizes button[data-ind=${i}]`).closest(".act_prize");
              if (!actPrize.hasClass("disabled")) {
                GAME.socket.emit('ga', { a: 49, type: 1, ind: i });
              }
            }
          }

          updateStatus('✓ Gotowe!');
          console.log('[Activities] Rewards collected');
        }, 1000);
      }, 500);

      setTimeout(hideModal, 3000);
    }

    // ============================================
    // ACTIVITY PROCESSING
    // ============================================

    // Delay helper
    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============================================
    // ITEM ID MAPPINGS (base_item_id)
    // ============================================
    const ITEM_IDS = {
      // Kule Energii (wszystkie warianty mają ten sam base_item_id)
      'kula_energii': ['1252'],

      // Senzu
      'niebieskie_senzu': ['1244'],

      // Substancje przyspieszające
      'substancja_x3': ['87'],
      'substancja_x4': ['88'],
      'substancja_x20': ['1429'],
      'ostateczna_substancja': ['1578'],

      // Symbole (bez +X) - Normal
      'symbol_sily': ['59'],
      'symbol_szybkosci': ['60'],
      'symbol_wytrzymalosci': ['61'],
      'symbol_sily_woli': ['62'],
      'symbol_ki': ['63'],

      // Odłamek mocy
      'odlamek_mocy': ['1475'],
    };

    // Find item by base_item_id
    function findItemByBaseId(baseItemIds) {
      const container = document.getElementById('ekw_page_items');
      if (!container) {
        console.log('[Activities] Container #ekw_page_items not found');
        return null;
      }

      const items = container.querySelectorAll('.ekw_slot.player_ekw_item');
      console.log('[Activities] Searching for base_item_id in', baseItemIds, 'among', items.length, 'items');

      if (items.length === 0) return null;

      // Debug first 3 items
      console.log('[Activities] Sample base_item_ids:',
        Array.from(items).slice(0, 5).map(i => i.getAttribute('data-base_item_id')).join(', ')
      );

      for (const item of items) {
        const baseId = item.getAttribute('data-base_item_id');
        if (baseItemIds.includes(baseId)) {
          console.log('mom itema')
          const itemId = item.getAttribute('data-item_id');
          const upgrade = item.getAttribute('data-upgrade');
          console.log('[Activities] ✓ FOUND base_item_id=' + baseId + ' item_id=' + itemId + ' upgrade=' + upgrade);
          return {
            element: item,
            itemId: itemId,
            baseItemId: baseId,
            upgrade: upgrade,
            slot: item.getAttribute('data-slot')
          };
        }
      }
      console.log('[Activities] ✗ Not found');
      return null;
    }

    // Find Symbol Normal (bez +X - upgrade=0)
    function findSymbolNormal() {
      const symbolIds = ['59', '60', '61', '62', '63'];  // Siła, Szybkość, Wytrzymałość, Sila Woli, Ki
      const container = document.getElementById('ekw_page_items');
      if (!container) return null;

      const items = container.querySelectorAll('.ekw_slot.player_ekw_item');
      console.log('[Activities] Searching for Symbol Normal (upgrade=0) among', items.length, 'items');

      for (const item of items) {
        const baseId = item.getAttribute('data-base_item_id');
        const upgrade = item.getAttribute('data-upgrade');

        if (symbolIds.includes(baseId) && upgrade === '0') {
          const itemId = item.getAttribute('data-item_id');
          console.log('[Activities] ✓ FOUND Symbol Normal base_id=' + baseId + ' item_id=' + itemId);
          return {
            element: item,
            itemId: itemId,
            baseItemId: baseId,
            upgrade: upgrade
          };
        }
      }
      console.log('[Activities] ✗ Symbol Normal not found');
      return null;
    }

    // Wait for items to load (just wait for any items to appear)
    async function waitForItems(maxWait = 1500) {
      const start = Date.now();
      while (Date.now() - start < maxWait) {
        const container = document.getElementById('ekw_page_items');
        if (container) {
          const items = container.querySelectorAll('.ekw_slot.player_ekw_item');
          if (items.length > 0) {
            console.log('[Activities] Items loaded:', items.length);
            return items.length;
          }
        }
        await delay(100);
      }
      console.log('[Activities] Timeout waiting for items');
      return 0;
    }

    // Navigate to equipment page (no page switch - just fetch data in background)
    async function navigateToEkwPage(page, page2) {
      console.log('[Activities] Fetching ekw page', page, '/', page2, '(no page switch)');
      GAME.emitOrder({ a: 12, page: page, page2: page2 });
      await delay(1000);  // Wait 1s for items to load
    }

    // Find item with pagination (returns when found or gives up)
    async function findWithPagination(findFn, page, maxPage2 = 5) {
      for (let page2 = 0; page2 <= maxPage2; page2++) {
        console.log('[Activities] Checking page', page, '/', page2);
        GAME.emitOrder({ a: 12, page: page, page2: page2 });
        await delay(1000);  // Wait 1s for items to load

        const container = document.getElementById('ekw_page_items');
        const items = container ? container.querySelectorAll('.ekw_slot.player_ekw_item') : [];
        console.log('[Activities] Found', items.length, 'items on this page');

        if (items.length === 0) {
          console.log('[Activities] No items on page, stopping pagination');
          break;
        }

        const result = findFn();
        if (result) {
          return { item: result, page2: page2 };
        }

        // Wait 1s before checking next page
        await delay(1000);
      }
      return null;
    }

    // Activity executor mapping
    const activityExecutors = {
      // a) Ulepsz Kulę Energii
      'Ulepsz Kulę Energii': async () => {
        console.log('[Activities] Executing: Ulepsz Kulę Energii');

        // 1. Navigate to ekw page 3 (Kule Energii)
        await navigateToEkwPage(3, 0);

        // 2. Find Kula Energii by base_item_id
        const item = findItemByBaseId(ITEM_IDS.kula_energii);
        if (!item) {
          console.log('[Activities] Kula Energii not found');
          return false;
        }

        console.log('[Activities] Found Kula Energii:', item.itemId);

        // 3. Execute upgrade emits
        GAME.emitOrder({ a: 45, type: 0, bid: parseInt(item.itemId) });
        await delay(1000);

        GAME.emitOrder({ a: 45, type: 3, bid: GAME.ball_id || parseInt(item.itemId) });
        await delay(1000);

        // 4. Hide soulstone interface
        const soulstoneInterface = document.getElementById('soulstone_interface');
        if (soulstoneInterface) {
          soulstoneInterface.style.display = 'none';
        }

        return true;
      },

      // b) Ulepsz lub połącz dowolny przedmiot
      'Ulepsz lub połącz dowolny przedmiot': async () => {
        console.log('[Activities] Executing: Ulepsz lub połącz przedmiot');

        // 1. Navigate to ekw page 7 (Symbole)
        await navigateToEkwPage(7, 0);

        // 2. Find Symbol Normal (upgrade=0) with pagination
        const result = await findWithPagination(findSymbolNormal, 7, 1);

        if (!result) {
          console.log('[Activities] Symbol Normal not found');
          return false;
        }

        console.log('[Activities] Found Symbol Normal:', result.item.itemId);

        // 3. Execute upgrade emit
        GAME.emitOrder({
          a: 12,
          type: 10,
          iid: parseInt(result.item.itemId),
          page: 7,
          page2: result.page2,
          am: 1
        });
        await delay(1000);

        return true;
      },

      // c) Użyj dowolną fasolkę Senzu lub wyciąg
      'Użyj dowolną fasolkę Senzu lub wyciąg': async () => {
        console.log('[Activities] Executing: Użyj Senzu');

        // 1. Navigate to ekw page 0
        await navigateToEkwPage(0, 0);

        // 2. Find niebieskie senzu with pagination
        const result = await findWithPagination(
          () => findItemByBaseId(ITEM_IDS.niebieskie_senzu),
          0, 5
        );

        if (!result) {
          console.log('[Activities] Niebieskie Senzu not found');
          return false;
        }

        console.log('[Activities] Found Senzu:', result.item.itemId);

        // 3. Use item
        GAME.emitOrder({
          a: 12,
          type: 14,
          iid: parseInt(result.item.itemId),
          page: 0,
          page2: result.page2,
          am: 1
        });
        await delay(1000);

        return true;
      },

      // d) Przekaż przedmioty na PU klanu
      'Przekaż przedmioty na PU klanu': async () => {
        console.log('[Activities] Executing: Przekaż na PU klanu');

        // 1. Navigate to ekw page 0
        await navigateToEkwPage(0, 0);

        // 2. Find odłamek mocy (Czarna Smocza Kula) with pagination
        const result = await findWithPagination(
          () => findItemByBaseId(ITEM_IDS.odlamek_mocy),
          0, 5
        );

        if (!result) {
          console.log('[Activities] Odłamek mocy not found');
          return false;
        }

        console.log('[Activities] Found Odłamek:', result.item.itemId);

        // 3. Transfer to clan
        GAME.emitOrder({
          a: 12,
          type: 21,
          iid: parseInt(result.item.itemId),
          page: 0,
          page2: result.page2,
          am: 1
        });
        await delay(1000);

        return true;
      },

      // e) Użyj Substancję Przyspieszającą
      'Użyj Substancję Przyspieszającą': async () => {
        console.log('[Activities] Executing: Użyj Substancję');

        // Get selected substance type from toggle
        const substanceType = ACTIVITIES.substanceType || 'x20';

        const substanceIds = {
          'x3': ITEM_IDS.substancja_x3,
          'x4': ITEM_IDS.substancja_x4,
          'x20': ITEM_IDS.substancja_x20,
          'OST': ITEM_IDS.ostateczna_substancja
        };

        const targetIds = substanceIds[substanceType];
        console.log('[Activities] Looking for substance type:', substanceType, 'ids:', targetIds);

        // 1. Navigate to ekw page 0
        await navigateToEkwPage(0, 0);

        // 2. Find substance with pagination
        const result = await findWithPagination(
          () => findItemByBaseId(targetIds),
          0, 5
        );

        if (!result) {
          console.log('[Activities] Substancja not found');
          return false;
        }

        console.log('[Activities] Found Substancja:', result.item.itemId);

        // 3. Use substance
        GAME.emitOrder({
          a: 12,
          type: 14,
          iid: parseInt(result.item.itemId),
          page: 0,
          page2: result.page2,
          am: 1
        });
        await delay(1000);

        return true;
      },

      // f) Odbierz nagrodę za codzienne logowanie
      'Odbierz nagrodę za codzienne logowanie': async () => {
        console.log('[Activities] Executing: Odbierz nagrodę logowania');

        if (!GAME.quick_opts.online_reward) {
          console.log('[Activities] Nagroda logowania już odebrana');
          return true;  // Already collected
        }

        GAME.socket.emit('ga', { a: 26, type: 1 });
        await delay(1000);

        const dailyReward = document.getElementById('daily_reward');
        if (dailyReward) {
          dailyReward.style.display = 'none';
        }

        return true;
      },

      // g) Udaj się na wyprawę
      'Udaj się na wyprawę': async () => {
        console.log('[Activities] Executing: Udaj się na wyprawę');

        // Check if expedition already in progress
        if (GAME.char_tables.timed_actions && GAME.char_tables.timed_actions[0] !== undefined) {
          console.log('[Activities] Wyprawa już trwa, czekam...');
        } else {
          // Start expedition
          GAME.socket.emit('ga', { a: 10, type: 2, ct: 0 });
          console.log('[Activities] Wysłano wyprawę');
          await delay(2000);
        }

        // Wait for expedition to complete (check every 5s, max 10 minutes)
        const maxWait = 10 * 60 * 1000;  // 10 minutes
        const start = Date.now();

        while (Date.now() - start < maxWait) {
          if (ACTIVITIES.stop || ACTIVITIES.paused) return false;

          GAME.parseTimed();
          await delay(500);

          if (GAME.char_tables.timed_actions[0] === undefined) {
            console.log('[Activities] Wyprawa zakończona!');
            return true;
          }

          console.log('[Activities] Wyprawa trwa, czekam 5s...');
          await delay(5000);
        }

        console.log('[Activities] Timeout - wyprawa trwa zbyt długo');
        return false;
      },

      // h) Walcz na Arenie PvP
      'Walcz na Arenie PvP': async () => {
        console.log('[Activities] Executing: Walcz na Arenie PvP');

        // Open arena
        GAME.socket.emit('ga', { a: 46, type: 0 });
        await delay(1000);

        // Find opponent
        const opponents = document.querySelectorAll('#arena_players .player button[data-option="arena_attack"][data-quick="1"]:not(.initial_hide_forced)');
        if (opponents.length === 0) {
          console.log('[Activities] Brak przeciwników na arenie');
          return false;
        }

        const opponent = opponents[0];
        const index = parseInt(opponent.getAttribute('data-index'));

        if (isNaN(index)) {
          console.log('[Activities] Nie można odczytać indeksu przeciwnika');
          return false;
        }

        // Attack
        GAME.socket.emit('ga', { a: 46, type: 1, index: index, quick: 1 });
        console.log('[Activities] Atakuję przeciwnika:', index);
        await delay(2000);

        return true;
      },

      // i) Walcz w Otchłani Dusz
      'Walcz w Otchłani Dusz': async () => {
        console.log('[Activities] Executing: Walcz w Otchłani Dusz');

        // Open abyss first
        GAME.socket.emit('ga', { a: 59, type: 0 });
        await delay(1000);

        // Fight
        GAME.emitOrder({ a: 59, type: 1 });
        await delay(2000);

        // Hide fight view
        const fightView = document.getElementById('fight_view');
        if (fightView) {
          fightView.style.display = 'none';
        }

        return true;
      },

      // j) Asystuj w treningu klanowym
      'Asystuj w treningu klanowym': async () => {
        console.log('[Activities] Executing: Asystuj w treningu');

        // Open clan training page
        GAME.emitOrder({ a: 39, type: 54 });
        await delay(1000);

        // Find assist button
        const assistBtn = document.querySelector('button[data-option="clan_assist"]');
        if (!assistBtn) {
          console.log('[Activities] Przycisk asysty nie znaleziony');
          return false;
        }

        const tid = assistBtn.getAttribute('data-tid');
        const target = assistBtn.getAttribute('data-target');

        if (!tid) {
          console.log('[Activities] Brak tid w przycisku');
          return false;
        }

        GAME.emitOrder({ a: 39, type: 55, tid: parseInt(tid), target: parseInt(target || tid) });
        console.log('[Activities] Wysłano asystę tid:', tid);
        await delay(1000);

        return true;
      },

      // k) Pobłogosław innego gracza  
      'Pobłogosław innego gracza': async () => {
        console.log('[Activities] Executing: Pobłogosław gracza');

        // Send bless with all buffs to random target (btype:3 = random)
        GAME.socket.emit('ga', {
          a: 14,
          type: 5,
          buffs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          players: '',  // Empty = random
          btype: 3
        });
        await delay(1000);

        return true;
      },

      // l) Odbierz nagrodę VIP
      'Odbierz nagrodę VIP': async () => {
        console.log('[Activities] Executing: Odbierz nagrodę VIP');

        // Fetch VIP data (no page switch)
        GAME.socket.emit('ga', { a: 54, type: 0 });
        await delay(1000);

        // Collect rewards recursively
        let collected = 0;
        const maxIterations = 20;

        for (let i = 0; i < maxIterations; i++) {
          // Find uncollected monthly reward
          const monthlyReward = document.querySelector('#monthly_vip_rewards .vip_cat.option:not(.disabled):not(.received)');
          if (monthlyReward) {
            const vip = parseInt(monthlyReward.getAttribute('data-vip'));
            const level = parseInt(monthlyReward.getAttribute('data-level'));
            GAME.socket.emit('ga', { a: 54, type: 1, vip: vip, level: level });
            collected++;
            await delay(500);
            continue;
          }

          // Find uncollected general reward
          const generalReward = document.querySelector('#general_vip_rewards .vip_cat.option:not(.disabled):not(.received)');
          if (generalReward) {
            const vip = parseInt(generalReward.getAttribute('data-vip'));
            const level = parseInt(generalReward.getAttribute('data-level'));
            GAME.socket.emit('ga', { a: 54, type: 1, vip: vip, level: level });
            collected++;
            await delay(500);
            continue;
          }

          // No more rewards
          break;
        }

        console.log('[Activities] Odebrano', collected, 'nagród VIP');
        return true;
      },

      // m) Wykonaj zadanie na Prywatnej Planecie
      'Wykonaj zadanie na Prywatnej Planecie': async () => {
        return await runDailyQuestsForLocation('private_planet', 'PP');
      },

      // n) Wykonaj zadanie na Planecie Klanowej
      'Wykonaj zadanie na Planecie Klanowej': async () => {
        return await runDailyQuestsForLocation('clan_planet', 'PK');
      },

      // o) Wykonaj zadanie w siedzibie imperium
      'Wykonaj zadanie w siedzibie imperium': async () => {
        return await runDailyQuestsForLocation('empire_hq', 'Imperium');
      }
    };

    // Helper: Run daily quests for specific location type
    async function runDailyQuestsForLocation(locationType, displayName) {
      console.log('[Activities] Executing: Zadanie na', displayName);

      // Check if AFO_DAILY module is available
      if (typeof AFO_DAILY === 'undefined') {
        console.log('[Activities] AFO_DAILY not available');
        return false;
      }

      // Load quest data if not loaded
      if (!AFO_DAILY.dataLoaded) {
        await AFO_DAILY.loadQuestData();
        await delay(1000);
      }

      // Filter quests by locationType
      const currentBorn = GAME.char_data.reborn;
      const locationQuests = DAILY.questData
        .filter(q => q.born.includes(currentBorn))
        .filter(q => q.locationType === locationType)
        .filter(q => AFO_DAILY.isQuestAvailable(q))
        .filter(q => !DAILY.completedQuests.includes(q.name));

      if (locationQuests.length === 0) {
        console.log('[Activities] Brak zadań dla', displayName);
        return true;  // No quests = success (nothing to do)
      }

      console.log('[Activities] Znaleziono', locationQuests.length, 'zadań dla', displayName);

      // Build queue with only these quests
      DAILY.questQueue = AFO_DAILY.groupPortalQuests(locationQuests);

      // Start daily quest system (override skipped/enabled temporarily)
      DAILY.stop = false;
      DAILY.paused = false;
      DAILY.currentQuestIdx = 0;
      DAILY.currentStageIdx = 0;
      DAILY.ownEmpire = GAME.char_data.empire;
      DAILY.isNavigating = false;
      DAILY.isTeleporting = false;
      DAILY.isInCombat = false;
      DAILY.inPortal = false;
      DAILY.portalGroup = [];
      DAILY.portalGroupIdx = 0;
      DAILY._dialogAttempts = 0;
      DAILY._currentQuest = null;

      // Update UI
      AFO_DAILY.updateStatus(`[Activities] ${displayName}...`);

      // Start processing
      setTimeout(() => AFO_DAILY.processNextQuest(), 500);

      // Wait for completion (check every 2s, max 5 minutes)
      const maxWait = 5 * 60 * 1000;  // 5 minutes
      const start = Date.now();

      while (Date.now() - start < maxWait) {
        if (ACTIVITIES.stop) {
          // Stop daily quests too
          AFO_DAILY.stop('Activities stopped');
          return false;
        }

        if (ACTIVITIES.paused) {
          // Pause daily quests too
          DAILY.paused = true;
          await delay(1000);
          continue;
        } else if (DAILY.paused) {
          // Resume daily quests when activities resume
          DAILY.paused = false;
        }

        // Check if daily quests finished
        if (DAILY.stop) {
          console.log('[Activities] Daily quests finished for', displayName);
          return true;
        }

        await delay(2000);
      }

      console.log('[Activities] Timeout - daily quests took too long for', displayName);
      AFO_DAILY.stop('Timeout');
      return false;
    }

    // Helper: Run LPVM with limit 1 for current born
    async function runLPVMOnce() {
      console.log('[Activities] Executing: List Gończy PvM');

      if (typeof AFO_LPVM === 'undefined') {
        console.log('[Activities] AFO_LPVM not available');
        return false;
      }

      // Set up LPVM for current born, limit 1
      const bornMap = { 0: 2, 1: 2, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
      LPVM.Born = bornMap[GAME.char_data.reborn] || 2;
      LPVM.limit = true;
      LPVM.limit2 = 1;
      LPVM.pvm_killed = 0;
      LPVM.Stop = false;

      // Start LPVM
      AFO_LPVM.Start();
      console.log('[Activities] Started LPVM, born:', LPVM.Born);

      // Wait for completion (check every 2s, max 3 minutes)
      const maxWait = 3 * 60 * 1000;
      const start = Date.now();

      while (Date.now() - start < maxWait) {
        if (ACTIVITIES.stop) {
          LPVM.Stop = true;
          return false;
        }

        if (ACTIVITIES.paused) {
          await delay(1000);
          continue;
        }

        // Check if LPVM finished (killed 1)
        if (LPVM.Stop || LPVM.pvm_killed >= 1) {
          console.log('[Activities] LPVM finished, killed:', LPVM.pvm_killed);
          LPVM.Stop = true;
          return true;
        }

        await delay(2000);
      }

      console.log('[Activities] LPVM timeout');
      LPVM.Stop = true;
      return false;
    }

    // Activity executor additions
    activityExecutors['Odbierz nagrodę za List Gończy PvM'] = async () => {
      return await runLPVMOnce();
    };

    activityExecutors['Ukończ trening'] = async () => {
      console.log('[Activities] Executing: Ukończ trening');

      // Check if already training
      if (GAME.is_training || document.querySelector('#train_uptime .timer')) {
        console.log('[Activities] Trening już trwa');
        return true;
      }

      // Start training (stat: 1, duration: 1 = shortest)
      GAME.socket.emit('ga', { a: 8, type: 2, stat: 1, duration: 1 });
      console.log('[Activities] Rozpoczęto trening');
      await delay(1000);

      return true;
    };

    activityExecutors['Ulepsz trening'] = async () => {
      console.log('[Activities] Executing: Ulepsz trening');

      // First check if we need to start training
      if (!GAME.is_training && !document.querySelector('#train_uptime .timer')) {
        // Start training first
        GAME.socket.emit('ga', { a: 8, type: 2, stat: 1, duration: 1 });
        console.log('[Activities] Rozpoczęto trening dla ulepszenia');
        await delay(1500);
      }

      // Upgrade training
      GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' });
      console.log('[Activities] Ulepszono trening');
      await delay(1000);

      // Check if we should cancel (only if Ukończ trening is NOT selected)
      const hasUkonczTrening = ACTIVITIES.selectedActivities.some(a => a.includes('Ukończ trening'));
      if (!hasUkonczTrening) {
        // Cancel training
        GAME.socket.emit('ga', { a: 8, type: 3 });
        console.log('[Activities] Przerwano trening (tylko ulepszenie)');
        await delay(500);
      }

      return true;
    };

    // Activity priority ordering (lower = earlier)
    const ACTIVITY_PRIORITY = {
      // Normal activities (default priority)
      'Odbierz nagrodę za codzienne logowanie': 1,
      'Odbierz nagrodę VIP': 2,
      'Pobłogosław innego gracza': 3,
      'Walcz w Otchłani Dusz': 4,
      'Walcz na Arenie PvP': 5,
      'Asystuj w treningu klanowym': 6,

      // Equipment activities
      'Ulepsz Kulę Energii': 10,
      'Ulepsz lub połącz dowolny przedmiot': 11,
      'Użyj dowolną fasolkę Senzu lub wyciąg': 12,
      'Przekaż przedmioty na PU klanu': 13,
      'Użyj Substancję Przyspieszającą': 14,

      // Quest activities
      'Odbierz nagrodę za List Gończy PvM': 20,
      'Wykonaj zadanie na Prywatnej Planecie': 21,
      'Wykonaj zadanie na Planecie Klanowej': 22,
      'Wykonaj zadanie w siedzibie imperium': 23,

      // Last activities
      'Udaj się na wyprawę': 90,  // Second to last
      'Ukończ trening': 98,        // Last (but before Ulepsz)
      'Ulepsz trening': 99,        // Last
    };

    function getActivityPriority(activityName) {
      // Find matching priority key
      for (const [key, priority] of Object.entries(ACTIVITY_PRIORITY)) {
        if (activityName.includes(key)) {
          return priority;
        }
      }
      return 50;  // Default middle priority
    }

    // Main activity processor
    async function processNextActivity() {
      if (ACTIVITIES.stop || ACTIVITIES.paused) return;

      // Sort remaining activities by priority
      const remaining = ACTIVITIES.selectedActivities
        .filter(name => !ACTIVITIES.completedActivities.includes(name))
        .sort((a, b) => getActivityPriority(a) - getActivityPriority(b));

      if (remaining.length === 0) {
        completeExecution();
        return;
      }

      const next = remaining[0];
      ACTIVITIES.currentActivity = next;
      updateStatus(next);
      updatePoints();

      console.log('[Activities] Processing:', next);

      // Find executor for this activity
      let executed = false;
      for (const [activityKey, executor] of Object.entries(activityExecutors)) {
        if (next.includes(activityKey)) {
          try {
            executed = await executor();
          } catch (e) {
            console.error('[Activities] Error executing:', activityKey, e);
            executed = false;
          }
          break;
        }
      }

      if (ACTIVITIES.stop || ACTIVITIES.paused) return;

      // Mark as completed (even if failed - we move on)
      ACTIVITIES.completedActivities.push(next);

      // Add points only if successfully executed
      if (executed) {
        const points = getActivityPoints(next);
        ACTIVITIES.earnedPoints += points;
        console.log('[Activities] +' + points + ' punktów (total: ' + ACTIVITIES.earnedPoints + ')');
      }

      updatePoints();  // Update progress display

      if (!executed) {
        console.log('[Activities] Activity failed or not implemented:', next);
      }

      // Wait 1s then process next
      await delay(1000);
      processNextActivity();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    injectCSS();

    // Hook page_switch
    hookPageSwitch();

    // Also check if we're already on activities page
    const currentPage = document.getElementById('page_game_activities');
    if (currentPage && currentPage.style.display === 'block') {
      console.log('[Activities] Already on activities page, injecting now');
      setTimeout(injectActivitiesUI, 200);
    }

    console.log('[Activities] Module initialized');
  }
})();
