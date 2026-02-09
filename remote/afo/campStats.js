/**
 * ============================================================================
 * AFO - Camp Stats (Statystyki Wypraw) - Self-Initializing Version
 * ============================================================================
 *
 * Tracks expedition results: value per icon type, items found.
 * Shows session stats and total stats below camp history.
 * Uses MutationObserver on #own_camps to detect new expedition results.
 * Watches for character switches and reloads data accordingly.
 *
 * Features:
 * - Self-initializing (no dependency on AFO.init())
 * - Async storage via AFO_STORAGE (works with Chrome extension & Tauri client)
 * - Silent migration from localStorage (old data preserved as backup)
 * - Export/Import with 3 modes: Replace, Add, Add Difference
 *
 * ============================================================================
 */

(function () {
  'use strict';

  if (typeof GAME === 'undefined') {
    console.log('[CampStats] GAME is undefined, skipping initialization');
    return;
  }

  // ============================================
  // STATE
  // ============================================

  const CAMP_STATS = {
    // Stats structure: { expeditions, values: { "a9": total }, items: { id: {count, src} } }
    session: { expeditions: 0, values: {}, items: {} },
    total: { expeditions: 0, values: {}, items: {} },

    observer: null,
    lastFirstChild: null,
    storageKey: null,
    uiInjected: false,
    retryCount: 0,
    currentCharId: null,
    charWatchInterval: null,
    initialized: false, // true after first #own_camps population is seen

    EXPORT_VERSION: 1
  };

  // Global references
  window.CAMP_STATS = CAMP_STATS;
  window.AFO_CAMP_STATS = CAMP_STATS; // Alias for compatibility

  // ============================================
  // STORAGE KEY
  // ============================================

  function buildStorageKey() {
    const server = GAME.server || 0;
    const charId = GAME.char_id || 0;
    CAMP_STATS.storageKey = `camp_stats_s${server}_c${charId}`;
  }

  // ============================================
  // PERSISTENCE (Async AFO_STORAGE)
  // ============================================

  function applyData(data) {
    CAMP_STATS.total.expeditions = data.expeditions || 0;
    CAMP_STATS.total.values = data.values || {};
    CAMP_STATS.total.items = data.items || {};
  }

  async function loadTotal() {
    try {
      // 1. Try AFO_STORAGE first (new format)
      const stored = await AFO_STORAGE.get(CAMP_STATS.storageKey);
      if (stored && stored[CAMP_STATS.storageKey]) {
        applyData(stored[CAMP_STATS.storageKey]);
        console.log('[CampStats] Loaded from AFO_STORAGE');
        return;
      }

      // 2. Fallback: check localStorage (old data)
      const oldKey = `afo_camp_stats_s${GAME.server}_c${GAME.char_id}`;
      const old = localStorage.getItem(oldKey);
      if (old) {
        const data = JSON.parse(old);
        applyData(data);
        // Migrate to AFO_STORAGE
        await saveTotal();
        console.log('[CampStats] Migrated data from localStorage to AFO_STORAGE');
        // NOTE: We do NOT remove localStorage - it stays as backup
      }
    } catch (e) {
      console.warn('[CampStats] Failed to load stats:', e);
    }
  }

  async function saveTotal() {
    try {
      await AFO_STORAGE.set({
        [CAMP_STATS.storageKey]: {
          expeditions: CAMP_STATS.total.expeditions,
          values: CAMP_STATS.total.values,
          items: CAMP_STATS.total.items
        }
      });
    } catch (e) {
      console.warn('[CampStats] Failed to save stats:', e);
    }
  }

  // ============================================
  // CHARACTER SWITCH DETECTION
  // ============================================

  function watchCharSwitch() {
    if (CAMP_STATS.charWatchInterval) clearInterval(CAMP_STATS.charWatchInterval);
    CAMP_STATS.charWatchInterval = setInterval(() => {
      if (GAME.char_id && GAME.char_id !== CAMP_STATS.currentCharId) {
        console.log('[CampStats] Character changed:', CAMP_STATS.currentCharId, '->', GAME.char_id);
        onCharSwitch();
      }
    }, 5000);
  }

  async function onCharSwitch() {
    CAMP_STATS.currentCharId = GAME.char_id;
    buildStorageKey();
    CAMP_STATS.session = { expeditions: 0, values: {}, items: {} };
    CAMP_STATS.total = { expeditions: 0, values: {}, items: {} };
    await loadTotal();
    CAMP_STATS.lastFirstChild = null;
    CAMP_STATS.initialized = false;
    render();
  }

  // ============================================
  // PARSING
  // ============================================

  function parseCampEntry(el) {
    if (!el || !el.classList || !el.classList.contains('single_camp')) return null;

    const result = { value: 0, icoClass: '', items: [] };

    // Extract value + icon class
    const div = el.querySelector('div');
    if (div) {
      const icoEl = div.querySelector('i.ico');
      if (icoEl) {
        const classes = Array.from(icoEl.classList).filter(c => c !== 'ico');
        result.icoClass = classes[0] || 'unknown';

        if (icoEl.previousSibling && icoEl.previousSibling.nodeType === 3) {
          const raw = icoEl.previousSibling.textContent.replace(/\s/g, '');
          const num = parseInt(raw, 10);
          if (!isNaN(num)) result.value = num;
        }
      }
    }

    // Extract items
    const slots = el.querySelectorAll('.ekw_slot.main_ekw_item');
    slots.forEach(slot => {
      const itemId = slot.getAttribute('data-item_id');
      const img = slot.querySelector('img');
      if (itemId && img) {
        result.items.push({
          id: itemId,
          src: img.getAttribute('src')
        });
      }
    });

    return result;
  }

  // ============================================
  // TRACKING
  // ============================================

  function addToStats(stats, data) {
    stats.expeditions++;
    if (data.icoClass && data.value) {
      stats.values[data.icoClass] = (stats.values[data.icoClass] || 0) + data.value;
    }
    data.items.forEach(item => {
      if (!stats.items[item.id]) {
        stats.items[item.id] = { count: 0, src: item.src };
      }
      stats.items[item.id].count++;
    });
  }

  function recordExpedition(data) {
    if (!data) return;
    addToStats(CAMP_STATS.session, data);
    addToStats(CAMP_STATS.total, data);
    saveTotal(); // Fire-and-forget async save
    render();
  }

  // ============================================
  // OBSERVER
  // ============================================

  function startObserver() {
    const ownCamps = document.getElementById('own_camps');
    if (!ownCamps) {
      setTimeout(startObserver, 3000);
      return;
    }

    // Snapshot current state
    if (ownCamps.firstElementChild) {
      CAMP_STATS.lastFirstChild = ownCamps.firstElementChild.innerHTML;
      CAMP_STATS.initialized = true;
    }

    CAMP_STATS.observer = new MutationObserver(() => {
      if (!CAMP_STATS.uiInjected) tryInjectUI();

      const first = ownCamps.firstElementChild;
      if (!first) return;

      if (!CAMP_STATS.initialized) {
        CAMP_STATS.lastFirstChild = first.innerHTML;
        CAMP_STATS.initialized = true;
        console.log('[CampStats] Initial population snapshot taken');
        return;
      }

      if (first.innerHTML !== CAMP_STATS.lastFirstChild) {
        CAMP_STATS.lastFirstChild = first.innerHTML;
        const data = parseCampEntry(first);
        if (data) {
          console.log('[CampStats] New expedition:', data);
          recordExpedition(data);
        }
      }
    });

    CAMP_STATS.observer.observe(ownCamps, { childList: true, subtree: true });
    console.log('[CampStats] Observer started');
  }

  // ============================================
  // EXPORT / IMPORT
  // ============================================

  function exportStats() {
    const exportData = {
      version: CAMP_STATS.EXPORT_VERSION,
      server: GAME.server,
      charId: GAME.char_id,
      charName: GAME.char_data?.name || 'unknown',
      timestamp: Date.now(),
      data: {
        expeditions: CAMP_STATS.total.expeditions,
        values: { ...CAMP_STATS.total.values },
        items: { ...CAMP_STATS.total.items }
      }
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `camp_stats_s${GAME.server}_${GAME.char_data?.name || GAME.char_id}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('[CampStats] Exported stats');
  }

  function validateImportData(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Nieprawidłowy format JSON' };
    }

    if (!data.version || data.version > CAMP_STATS.EXPORT_VERSION) {
      return { valid: false, error: `Nieobsługiwana wersja: ${data.version}` };
    }

    if (!data.data || typeof data.data !== 'object') {
      return { valid: false, error: 'Brak danych statystyk' };
    }

    const d = data.data;
    if (typeof d.expeditions !== 'number' || d.expeditions < 0) {
      return { valid: false, error: 'Nieprawidłowa liczba wypraw' };
    }

    if (d.values && typeof d.values !== 'object') {
      return { valid: false, error: 'Nieprawidłowy format values' };
    }

    if (d.items && typeof d.items !== 'object') {
      return { valid: false, error: 'Nieprawidłowy format items' };
    }

    return { valid: true };
  }

  async function importStats(jsonString, mode) {
    // mode: 'replace' | 'add' | 'add_diff'

    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      alert('Błąd parsowania JSON: ' + e.message);
      return false;
    }

    const validation = validateImportData(data);
    if (!validation.valid) {
      alert('Błąd walidacji: ' + validation.error);
      return false;
    }

    const imported = data.data;

    switch (mode) {
      case 'replace':
        CAMP_STATS.total.expeditions = imported.expeditions || 0;
        CAMP_STATS.total.values = { ...(imported.values || {}) };
        CAMP_STATS.total.items = {};
        for (const [id, info] of Object.entries(imported.items || {})) {
          CAMP_STATS.total.items[id] = { count: info.count || 0, src: info.src || '' };
        }
        break;

      case 'add':
        CAMP_STATS.total.expeditions += imported.expeditions || 0;
        for (const [key, val] of Object.entries(imported.values || {})) {
          CAMP_STATS.total.values[key] = (CAMP_STATS.total.values[key] || 0) + val;
        }
        for (const [id, info] of Object.entries(imported.items || {})) {
          if (!CAMP_STATS.total.items[id]) {
            CAMP_STATS.total.items[id] = { count: 0, src: info.src || '' };
          }
          CAMP_STATS.total.items[id].count += info.count || 0;
        }
        break;

      case 'add_diff':
        // Add only positive difference (imported - current)
        const expDiff = Math.max(0, (imported.expeditions || 0) - CAMP_STATS.total.expeditions);
        CAMP_STATS.total.expeditions += expDiff;

        for (const [key, val] of Object.entries(imported.values || {})) {
          const current = CAMP_STATS.total.values[key] || 0;
          const diff = Math.max(0, val - current);
          CAMP_STATS.total.values[key] = current + diff;
        }

        for (const [id, info] of Object.entries(imported.items || {})) {
          const currentCount = CAMP_STATS.total.items[id]?.count || 0;
          const diff = Math.max(0, (info.count || 0) - currentCount);
          if (!CAMP_STATS.total.items[id]) {
            CAMP_STATS.total.items[id] = { count: 0, src: info.src || '' };
          }
          CAMP_STATS.total.items[id].count += diff;
        }
        break;

      default:
        alert('Nieznany tryb importu: ' + mode);
        return false;
    }

    await saveTotal();
    render();
    console.log(`[CampStats] Imported stats (mode: ${mode})`);
    return true;
  }

  function showImportModal() {
    // Remove existing modal
    const existing = document.getElementById('afo_cs_import_modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'afo_cs_import_modal';
    modal.className = 'afo_modal_overlay';
    modal.innerHTML = `
      <div class="afo_modal">
        <div class="afo_modal_header">
          <b>Importuj statystyki</b>
          <span class="afo_modal_close" id="afo_cs_modal_close">&times;</span>
        </div>
        <div class="afo_modal_body">
          <div class="afo_cs_import_info">
            Wybierz plik JSON z wyeksportowanymi statystykami lub wklej zawartość:
          </div>
          <input type="file" id="afo_cs_import_file" accept=".json" style="margin: 8px 0; width: 100%;">
          <textarea id="afo_cs_import_text" placeholder="lub wklej JSON tutaj..." rows="5" style="width:100%; box-sizing:border-box; background:#0a1520; color:#ccc; border:1px solid #305779; border-radius:4px; padding:6px;"></textarea>
          <div class="afo_cs_import_mode">
            <label style="color:#f5a623; margin-bottom:4px; display:block;"><b>Tryb importu:</b></label>
            <label><input type="radio" name="import_mode" value="replace"> Zastąp (nadpisz wszystko)</label>
            <label><input type="radio" name="import_mode" value="add" checked> Dodaj (sumuj wartości)</label>
            <label><input type="radio" name="import_mode" value="add_diff"> Dodaj różnicę (tylko większe wartości)</label>
          </div>
        </div>
        <div class="afo_modal_footer">
          <button id="afo_cs_import_confirm" class="afo_btn_green">Importuj</button>
          <button id="afo_cs_import_cancel" class="afo_btn_gray">Anuluj</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // File input handler
    document.getElementById('afo_cs_import_file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('afo_cs_import_text').value = ev.target.result;
        };
        reader.readAsText(file);
      }
    });

    // Close handlers
    const closeModal = () => modal.remove();
    document.getElementById('afo_cs_modal_close').addEventListener('click', closeModal);
    document.getElementById('afo_cs_import_cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Confirm handler
    document.getElementById('afo_cs_import_confirm').addEventListener('click', async () => {
      const text = document.getElementById('afo_cs_import_text').value.trim();
      if (!text) {
        alert('Wprowadź dane do importu');
        return;
      }

      const modeRadio = document.querySelector('input[name="import_mode"]:checked');
      const mode = modeRadio ? modeRadio.value : 'add';

      const success = await importStats(text, mode);
      if (success) {
        modal.remove();
        alert('Import zakończony pomyślnie!');
      }
    });
  }

  // ============================================
  // UI - CSS
  // ============================================

  function injectCSS() {
    if (document.getElementById('camp-stats-css')) return;

    const style = document.createElement('style');
    style.id = 'camp-stats-css';
    style.textContent = `
      #afo_camp_stats_con {
        margin-top: 8px;
        display: flex;
        gap: 10px;
        clear: both;
      }
      .afo_camp_stat_box {
        flex: 1;
        background: rgba(0,0,0,0.3);
        border: 1px solid #305779;
        border-radius: 5px;
        padding: 6px 8px;
        font-size: 12px;
      }
      .afo_camp_stat_box b {
        display: block;
        margin-bottom: 4px;
        color: #f5a623;
        font-size: 13px;
      }
      .afo_camp_stat_box .afo_cs_row {
        margin-bottom: 2px;
      }
      .afo_camp_stat_box .afo_cs_items {
        display: flex;
        flex-wrap: wrap;
        gap: 2px;
        margin-top: 4px;
      }
      .afo_camp_stat_box .afo_cs_item {
        position: relative;
        width: 28px;
        height: 28px;
      }
      .afo_camp_stat_box .afo_cs_item img {
        width: 28px;
        height: 28px;
      }
      .afo_camp_stat_box .afo_cs_item .afo_cs_count {
        position: absolute;
        bottom: -2px;
        right: -2px;
        background: rgba(0,0,0,0.8);
        color: #fff;
        font-size: 9px;
        padding: 0 3px;
        border-radius: 3px;
        line-height: 14px;
        font-weight: bold;
      }
      .afo_camp_stat_box .afo_cs_reset {
        margin-left: 30px;
        float: right;
        cursor: pointer;
        color: #666;
        font-size: 10px;
      }
      .afo_camp_stat_box .afo_cs_reset:hover {
        color: #f55;
      }
      .afo_camp_stat_box .afo_cs_btn {
        float: right;
        cursor: pointer;
        color: #4a9;
        font-size: 10px;
        margin-left: 8px;
      }
      .afo_camp_stat_box .afo_cs_btn:hover {
        color: #6cb;
      }

      /* Modal */
      .afo_modal_overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .afo_modal {
        background: #1a2a3a;
        border: 1px solid #305779;
        border-radius: 8px;
        min-width: 350px;
        max-width: 500px;
      }
      .afo_modal_header {
        padding: 10px 12px;
        border-bottom: 1px solid #305779;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .afo_modal_header b {
        color: #f5a623;
      }
      .afo_modal_close {
        cursor: pointer;
        color: #888;
        font-size: 20px;
        line-height: 1;
      }
      .afo_modal_close:hover {
        color: #f55;
      }
      .afo_modal_body {
        padding: 12px;
      }
      .afo_modal_footer {
        padding: 10px 12px;
        border-top: 1px solid #305779;
        text-align: right;
      }
      .afo_modal_footer button {
        padding: 6px 14px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 8px;
      }
      .afo_btn_green { background: #2a7a2a; color: #fff; }
      .afo_btn_green:hover { background: #3a9a3a; }
      .afo_btn_gray { background: #444; color: #fff; }
      .afo_btn_gray:hover { background: #555; }

      .afo_cs_import_mode {
        margin-top: 10px;
      }
      .afo_cs_import_mode label {
        display: block;
        margin: 4px 0;
        color: #ccc;
      }
      .afo_cs_import_info {
        color: #aaa;
        font-size: 12px;
        margin-bottom: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // UI - INJECTION
  // ============================================

  function tryInjectUI() {
    if (CAMP_STATS.uiInjected) return;
    if (document.getElementById('afo_camp_stats_con')) {
      CAMP_STATS.uiInjected = true;
      render();
      return;
    }

    const allCamps = document.getElementById('all_camps');
    if (!allCamps) {
      if (CAMP_STATS.retryCount < 15) {
        CAMP_STATS.retryCount++;
        setTimeout(tryInjectUI, 2000);
      }
      return;
    }

    const con = document.createElement('div');
    con.id = 'afo_camp_stats_con';
    con.innerHTML = `
      <div class="afo_camp_stat_box" id="afo_cs_session"></div>
      <div class="afo_camp_stat_box" id="afo_cs_total"></div>
    `;
    allCamps.parentNode.insertBefore(con, allCamps.nextSibling);
    CAMP_STATS.uiInjected = true;
    console.log('[CampStats] UI injected');
    render();
  }

  // ============================================
  // UI - RENDERING
  // ============================================

  function renderBox(elId, title, stats, options = {}) {
    const el = document.getElementById(elId);
    if (!el) return;

    const { resetFn, showExportImport } = options;

    // Values per icon type
    const valuesHtml = Object.entries(stats.values)
      .map(([icoClass, total]) => {
        const avg = stats.expeditions > 0 ? Math.round(total / stats.expeditions).toLocaleString('pl-PL') : 0;
        return `<div class="afo_cs_row"><i class="ico ${icoClass}"></i> <span class="orange">${total.toLocaleString('pl-PL')}</span>${stats.expeditions > 0 ? ` (śr. ${avg})` : ''}</div>`;
      })
      .join('');

    // Items sorted by count
    const itemsHtml = Object.entries(stats.items)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, info]) => {
        return `<div class="afo_cs_item" data-item_id="${id}">
          <img src="${info.src}">
          <span class="afo_cs_count">${info.count}</span>
        </div>`;
      })
      .join('');

    // Extra buttons for total box
    const exportImportHtml = showExportImport ? `
      <span class="afo_cs_btn" id="afo_cs_export" title="Eksportuj statystyki do pliku">[Pobierz]</span>
      <span class="afo_cs_btn" id="afo_cs_import" title="Importuj statystyki z pliku">[Importuj]</span>
    ` : '';

    el.innerHTML = `
      <b>${title}
        ${resetFn ? `<span class="afo_cs_reset" id="${resetFn}">[Zeruj]</span>` : ''}
        ${exportImportHtml}
      </b>
      <div class="afo_cs_row">Wypraw: <span class="orange">${stats.expeditions}</span></div>
      ${valuesHtml}
      <div class="afo_cs_items">${itemsHtml || '<span style="color:#666">brak przedmiotów</span>'}</div>
    `;

    // Bind reset button
    if (resetFn) {
      const btn = document.getElementById(resetFn);
      if (btn) {
        btn.addEventListener('click', async () => {
          if (!confirm('Czy na pewno chcesz wyzerować statystyki?')) return;
          if (resetFn === 'afo_cs_reset_session') {
            CAMP_STATS.session = { expeditions: 0, values: {}, items: {} };
          } else {
            CAMP_STATS.total = { expeditions: 0, values: {}, items: {} };
            await saveTotal();
          }
          render();
        });
      }
    }

    // Bind export/import buttons
    if (showExportImport) {
      const exportBtn = document.getElementById('afo_cs_export');
      if (exportBtn) {
        exportBtn.addEventListener('click', exportStats);
      }

      const importBtn = document.getElementById('afo_cs_import');
      if (importBtn) {
        importBtn.addEventListener('click', showImportModal);
      }
    }
  }

  function render() {
    if (!CAMP_STATS.uiInjected) return;
    renderBox('afo_cs_session', 'Obecna sesja', CAMP_STATS.session, { resetFn: 'afo_cs_reset_session' });
    renderBox('afo_cs_total', 'Łącznie', CAMP_STATS.total, { resetFn: 'afo_cs_reset_total', showExportImport: true });
  }

  // ============================================
  // INITIALIZATION (Polled Readiness)
  // ============================================

  async function init() {
    CAMP_STATS.currentCharId = GAME.char_id || 0;
    buildStorageKey();
    await loadTotal();
    injectCSS();
    tryInjectUI();
    startObserver();
    watchCharSwitch();
    console.log('[CampStats] Initialized, key:', CAMP_STATS.storageKey);
  }

  // Wait for GAME.char_data and AFO_STORAGE
  let initAttempts = 0;
  const maxAttempts = 120; // 60 seconds

  const initCheck = setInterval(() => {
    initAttempts++;
    if (initAttempts > maxAttempts) {
      clearInterval(initCheck);
      console.log('[CampStats] Timeout waiting for dependencies');
      return;
    }
    if (GAME.char_data && GAME.socket && typeof AFO_STORAGE !== 'undefined') {
      clearInterval(initCheck);
      init();
    }
  }, 500);

})();

console.log('[AFO] Camp Stats module loaded (self-initializing)');
