/**
 * ============================================================================
 * AFO - Camp Stats (Statystyki Wypraw)
 * ============================================================================
 *
 * Tracks expedition results: value per icon type, items found.
 * Shows session stats and total (localStorage) stats below camp history.
 * Uses MutationObserver on #own_camps to detect new expedition results.
 * Watches for character switches and reloads data accordingly.
 *
 * ============================================================================
 */

const AFO_CAMP_STATS = {
  // Stats structure: { expeditions, values: { "a9": total, "exp": total }, items: { id: {count, src} } }
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

  init() {
    this.currentCharId = GAME.char_id || 0;
    this.buildStorageKey();
    this.loadTotal();
    this.injectCSS();
    this.tryInjectUI();
    this.startObserver();
    this.watchCharSwitch();
    console.log('[AFO_CAMP_STATS] Initialized, key:', this.storageKey);
  },

  buildStorageKey() {
    const server = GAME.server || 0;
    const charId = GAME.char_id || 0;
    this.storageKey = `afo_camp_stats_s${server}_c${charId}`;
  },

  // ============================================
  // CHARACTER SWITCH DETECTION
  // ============================================

  watchCharSwitch() {
    if (this.charWatchInterval) clearInterval(this.charWatchInterval);
    this.charWatchInterval = setInterval(() => {
      if (GAME.char_id && GAME.char_id !== this.currentCharId) {
        console.log('[AFO_CAMP_STATS] Character changed:', this.currentCharId, '->', GAME.char_id);
        this.onCharSwitch();
      }
    }, 1000);
  },

  onCharSwitch() {
    this.currentCharId = GAME.char_id;
    this.buildStorageKey();
    this.session = { expeditions: 0, values: {}, items: {} };
    this.total = { expeditions: 0, values: {}, items: {} };
    this.loadTotal();
    this.lastFirstChild = null;
    this.initialized = false;
    this.render();
  },

  // ============================================
  // PERSISTENCE
  // ============================================

  loadTotal() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.total.expeditions = data.expeditions || 0;
        this.total.values = data.values || {};
        this.total.items = data.items || {};
      }
    } catch (e) {
      console.warn('[AFO_CAMP_STATS] Failed to load stats:', e);
    }
  },

  saveTotal() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.total));
    } catch (e) {
      console.warn('[AFO_CAMP_STATS] Failed to save stats:', e);
    }
  },

  // ============================================
  // PARSING
  // ============================================

  parseCampEntry(el) {
    if (!el || !el.classList || !el.classList.contains('single_camp')) return null;

    const result = { value: 0, icoClass: '', items: [] };

    // Extract value + icon class: number before <i class="ico XXX">
    // Format can have space-separated thousands like "90 610 639 261"
    const div = el.querySelector('div');
    if (div) {
      const icoEl = div.querySelector('i.ico');
      if (icoEl) {
        // Get the specific icon type (e.g. "a9", "exp", etc.)
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
  },

  // ============================================
  // TRACKING
  // ============================================

  addToStats(stats, data) {
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
  },

  recordExpedition(data) {
    if (!data) return;
    this.addToStats(this.session, data);
    this.addToStats(this.total, data);
    this.saveTotal();
    this.render();
  },

  // ============================================
  // OBSERVER
  // ============================================

  startObserver() {
    const ownCamps = document.getElementById('own_camps');
    if (!ownCamps) {
      setTimeout(() => this.startObserver(), 3000);
      return;
    }

    // Snapshot current state so we don't count pre-existing entries
    if (ownCamps.firstElementChild) {
      this.lastFirstChild = ownCamps.firstElementChild.innerHTML;
      this.initialized = true;
    }

    this.observer = new MutationObserver(() => {
      if (!this.uiInjected) this.tryInjectUI();

      const first = ownCamps.firstElementChild;
      if (!first) return;

      // If we haven't seen the initial load yet, just snapshot and skip
      if (!this.initialized) {
        this.lastFirstChild = first.innerHTML;
        this.initialized = true;
        console.log('[AFO_CAMP_STATS] Initial population snapshot taken');
        return;
      }

      if (first.innerHTML !== this.lastFirstChild) {
        this.lastFirstChild = first.innerHTML;
        const data = this.parseCampEntry(first);
        if (data) {
          console.log('[AFO_CAMP_STATS] New expedition:', data);
          this.recordExpedition(data);
        }
      }
    });

    this.observer.observe(ownCamps, { childList: true, subtree: true });
    console.log('[AFO_CAMP_STATS] Observer started');
  },

  // ============================================
  // UI
  // ============================================

  injectCSS() {
    const style = document.createElement('style');
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
        float: right;
        cursor: pointer;
        color: #666;
        font-size: 10px;
      }
      .afo_camp_stat_box .afo_cs_reset:hover {
        color: #f55;
      }
    `;
    document.head.appendChild(style);
  },

  tryInjectUI() {
    if (this.uiInjected) return;
    if (document.getElementById('afo_camp_stats_con')) {
      this.uiInjected = true;
      this.render();
      return;
    }

    const allCamps = document.getElementById('all_camps');
    if (!allCamps) {
      if (this.retryCount < 15) {
        this.retryCount++;
        setTimeout(() => this.tryInjectUI(), 2000);
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
    this.uiInjected = true;
    console.log('[AFO_CAMP_STATS] UI injected');
    this.render();
  },

  renderBox(elId, title, stats, resetFn) {
    const el = document.getElementById(elId);
    if (!el) return;

    // Render value rows per icon type (e.g. ico a9, ico exp)
    const valuesHtml = Object.entries(stats.values)
      .map(([icoClass, total]) => {
        const avg = stats.expeditions > 0 ? Math.round(total / stats.expeditions).toLocaleString('pl-PL') : 0;
        return `<div class="afo_cs_row"><i class="ico ${icoClass}"></i> <span class="orange">${total.toLocaleString('pl-PL')}</span>${stats.expeditions > 0 ? ` (śr. ${avg})` : ''}</div>`;
      })
      .join('');

    const itemsHtml = Object.entries(stats.items)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, info]) => {
        return `<div class="afo_cs_item" data-item_id="${id}">
          <img src="${info.src}">
          <span class="afo_cs_count">${info.count}</span>
        </div>`;
      })
      .join('');

    el.innerHTML = `
      <b>${title} ${resetFn ? `<span class="afo_cs_reset" id="${resetFn}">[Zeruj]</span>` : ''}</b>
      <div class="afo_cs_row">Wypraw: <span class="orange">${stats.expeditions}</span></div>
      ${valuesHtml}
      <div class="afo_cs_items">${itemsHtml || '<span style="color:#666">brak przedmiotów</span>'}</div>
    `;

    if (resetFn) {
      const btn = document.getElementById(resetFn);
      if (btn) {
        btn.addEventListener('click', () => {
          if (!confirm('Czy na pewno chcesz wyzerować statystyki?')) return;
          if (resetFn === 'afo_cs_reset_session') {
            this.session = { expeditions: 0, values: {}, items: {} };
          } else {
            this.total = { expeditions: 0, values: {}, items: {} };
            this.saveTotal();
          }
          this.render();
        });
      }
    }
  },

  render() {
    if (!this.uiInjected) return;
    this.renderBox('afo_cs_session', 'Obecna sesja', this.session, 'afo_cs_reset_session');
    this.renderBox('afo_cs_total', 'Łącznie', this.total, 'afo_cs_reset_total');
  }
};

window.AFO_CAMP_STATS = AFO_CAMP_STATS;
console.log('[AFO] Camp Stats module loaded');
