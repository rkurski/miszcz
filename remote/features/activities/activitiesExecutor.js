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
      totalPoints: 0,
      status: 'idle'
    };

    // ============================================
    // CONFIGURATION
    // ============================================

    // Lista aktywności z warunkami disabled
    const activityRules = {
      'Przekaż przedmioty na PU klanu': () => GAME.char_data?.klan_id === 0,
      'Wykonaj zadanie na Planecie Klanowej': () => GAME.char_data?.klan_id === 0,
      'Wykonaj zadanie w siedzibie imperium': () => GAME.char_data?.empire === 0,
      'Wykonaj zadanie na Prywatnej Planecie': () => GAME.char_data?.planet_id === 0,
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
    const defaultUnchecked = ['Wykonaj dowolną instancję'];

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
        #afo_activities_modal_overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 99998;
          display: none;
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
      GAME.page_switch = function (page) {
        // Call original first
        originalPageSwitch(page);

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
      const pts = document.getElementById('char_activity');
      if (el && pts) el.textContent = pts.textContent;
    }

    // ============================================
    // EXECUTION CONTROL
    // ============================================

    function startExecution() {
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

      updateStatus('Ukończono!');
      updatePoints();
      console.log('[Activities] Completed');

      setTimeout(hideModal, 2000);
    }

    // ============================================
    // ACTIVITY PROCESSING (placeholder)
    // ============================================

    function processNextActivity() {
      if (ACTIVITIES.stop || ACTIVITIES.paused) return;

      const remaining = ACTIVITIES.selectedActivities.filter(
        name => !ACTIVITIES.completedActivities.includes(name)
      );

      if (remaining.length === 0) {
        completeExecution();
        return;
      }

      const next = remaining[0];
      ACTIVITIES.currentActivity = next;
      updateStatus(next);
      updatePoints();

      console.log('[Activities] Processing:', next);

      // TODO: Tutaj będzie logika wykonywania
      // Na razie placeholder - oznaczamy jako ukończone po 2s
      setTimeout(() => {
        if (ACTIVITIES.stop || ACTIVITIES.paused) return;
        ACTIVITIES.completedActivities.push(next);
        processNextActivity();
      }, 2000);
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
