/**
 * ============================================================================
 * DEV CONSOLE - wbudowany podgląd logów (bez devtoolsów/eruda)
 * ============================================================================
 *
 * Przybetonowana ikonka w prawym dolnym rogu → panel z logami całej sesji.
 * Powstało do debugowania na mobile (Tauri/Android), gdzie przycisk eruda znika
 * przy przeładowaniach w trakcie reconnectu. Kluczowe cechy:
 *  - przechwytuje console.log/warn/error/info + uncaught errors,
 *  - logi PRZEŻYWAJĄ przeładowania i zmianę subdomeny (serwer↔główna) — trzymane
 *    w AFO_STORAGE (chrome.storage / plik Tauri; localStorage NIE jest współdzielony
 *    między subdomenami),
 *  - kopiowanie / pobieranie całości albo ostatnich X minut (5/15/30/własne).
 *
 * Ładowany wcześnie (zaraz po charactersManager, przed resztą), więc łapie prawie
 * wszystko i renderuje się na każdej stronie (też auth-error).
 * ============================================================================
 */

(function () {
  'use strict';

  if (window.__GIENIOBOT_DEVCONSOLE__) return; // guard double-load
  window.__GIENIOBOT_DEVCONSOLE__ = true;

  const MAX_ENTRIES = 2000;       // ring buffer cap
  const STORAGE_KEY = 'afo_devlog';
  const PERSIST_MS = 3000;
  // A page load counts as a reconnect continuation (→ keep logs) only if reconnect
  // marked activity within this window. Otherwise it's a manual reload/reopen (→ clear).
  const RECONNECT_NAV_WINDOW_MS = 30 * 1000; // 30s
  const MAX_AGE_MS = 30 * 60 * 1000;         // hard cap: drop entries older than 30 min

  const buffer = [];              // { t:ms, level, msg }
  let dirty = false;
  let hydrated = false;
  let canPersist = false;         // gate: never persist before hydrate finished
  let panelOpen = false;
  let logEl = null;               // scrollable log container
  let currentFilterMin = 0;       // 0 = all

  // ============================================
  // LOG CAPTURE
  // ============================================

  function fmtArg(a) {
    if (typeof a === 'string') return a;
    if (a instanceof Error) return a.stack || (a.name + ': ' + a.message);
    try { return JSON.stringify(a); } catch (e) { return String(a); }
  }

  function push(level, args) {
    const msg = Array.prototype.map.call(args, fmtArg).join(' ');
    const entry = { t: Date.now(), level, msg };
    buffer.push(entry);
    if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES);
    dirty = true;
    if (panelOpen && logEl && (currentFilterMin === 0 || entry.t >= Date.now() - currentFilterMin * 60000)) {
      appendLine(entry);
    }
  }

  ['log', 'warn', 'error', 'info'].forEach((m) => {
    const orig = console[m] ? console[m].bind(console) : function () { };
    console[m] = function () {
      try { push(m, arguments); } catch (e) { }
      orig.apply(console, arguments);
    };
  });

  window.addEventListener('error', (e) => {
    try { push('error', ['[uncaught] ' + (e.message || '') + ' @ ' + (e.filename || '') + ':' + (e.lineno || 0)]); } catch (x) { }
  });
  window.addEventListener('unhandledrejection', (e) => {
    try { push('error', ['[unhandledrejection] ' + fmtArg(e && e.reason)]); } catch (x) { }
  });

  // ============================================
  // PERSISTENCE (cross-reload / cross-subdomain via AFO_STORAGE)
  // ============================================

  async function hydrate() {
    if (hydrated || typeof AFO_STORAGE === 'undefined') return;
    hydrated = true;
    try {
      const res = await AFO_STORAGE.get([STORAGE_KEY, 'afo_reconnect_nav']);
      const prev = res && res[STORAGE_KEY];
      const navMark = (res && res['afo_reconnect_nav']) || 0;
      const now = Date.now();

      // Keep logs only if this page load is a CONTINUATION of an active reconnect
      // (reconnect sets afo_reconnect_nav on every step). A fresh manual reload /
      // reopen has no recent mark → start with a clean log.
      const isReconnectContinuation = navMark && (now - navMark) < RECONNECT_NAV_WINDOW_MS;

      if (prev && Array.isArray(prev.entries) && prev.entries.length && isReconnectContinuation) {
        // Continuation: keep, but drop anything older than the hard cap
        const cutoff = now - MAX_AGE_MS;
        const kept = prev.entries.filter(e => e && e.t >= cutoff);
        buffer.unshift(...kept);
        if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES);
        if (panelOpen) renderAll();
      } else if (prev) {
        // Fresh session → discard old logs
        try { await AFO_STORAGE.remove(STORAGE_KEY); } catch (e) { }
      }
    } catch (e) { /* ignore */ }
    canPersist = true; // only start writing after we've decided keep-vs-clear
  }

  async function persist() {
    if (!canPersist || !dirty || typeof AFO_STORAGE === 'undefined') return;
    dirty = false;
    try {
      await AFO_STORAGE.set({ [STORAGE_KEY]: { savedAt: Date.now(), entries: buffer.slice(-MAX_ENTRIES) } });
    } catch (e) { }
  }

  const hydrateTimer = setInterval(() => {
    if (typeof AFO_STORAGE !== 'undefined') { clearInterval(hydrateTimer); hydrate(); }
  }, 500);
  setInterval(persist, PERSIST_MS);
  window.addEventListener('pagehide', persist);
  window.addEventListener('beforeunload', persist);
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });

  // ============================================
  // FORMATTING / EXPORT
  // ============================================

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function stamp(t) {
    const d = new Date(t);
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function filtered(min) {
    if (!min) return buffer.slice();
    const cutoff = Date.now() - min * 60000;
    return buffer.filter(e => e.t >= cutoff);
  }

  function asText(min) {
    return filtered(min).map(e => '[' + stamp(e.t) + '] ' + (e.level === 'log' ? '' : e.level.toUpperCase() + ' ') + e.msg).join('\n');
  }

  // ============================================
  // UI
  // ============================================

  const COLORS = { log: '#d0d0d0', info: '#7fd4ff', warn: '#ffcc66', error: '#ff6b6b' };

  function appendLine(entry) {
    if (!logEl) return;
    const atBottom = logEl.scrollTop + logEl.clientHeight >= logEl.scrollHeight - 30;
    const line = document.createElement('div');
    line.style.cssText = 'padding:1px 0;color:' + (COLORS[entry.level] || '#d0d0d0') + ';border-bottom:1px solid rgba(255,255,255,0.04);';
    line.textContent = '[' + stamp(entry.t) + '] ' + entry.msg;
    logEl.appendChild(line);
    if (atBottom) logEl.scrollTop = logEl.scrollHeight;
  }

  function renderAll() {
    if (!logEl) return;
    logEl.innerHTML = '';
    const list = filtered(currentFilterMin);
    const frag = document.createDocumentFragment();
    for (const e of list) {
      const line = document.createElement('div');
      line.style.cssText = 'padding:1px 0;color:' + (COLORS[e.level] || '#d0d0d0') + ';border-bottom:1px solid rgba(255,255,255,0.04);';
      line.textContent = '[' + stamp(e.t) + '] ' + e.msg;
      frag.appendChild(line);
    }
    logEl.appendChild(frag);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
      'background:#0f3460;color:#fff;padding:8px 16px;border-radius:8px;font:13px sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.5);';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  function copyText(text) {
    // Primary: async clipboard. Fallback: hidden textarea + execCommand (webview-safe).
    const done = () => toast('📋 Skopiowano (' + text.split('\n').length + ' linii)');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      ta.remove();
      done();
    } catch (e) {
      toast('❌ Kopiowanie nie zadziałało — użyj Pobierz');
    }
  }

  function download(text) {
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const d = new Date();
      a.href = url;
      a.download = 'gieniobot-log-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast('💾 Pobieranie...');
    } catch (e) {
      toast('❌ Pobieranie nie zadziałało — użyj Kopiuj');
    }
  }

  function mkBtn(label, bg) {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'background:' + (bg || 'rgba(255,255,255,0.12)') + ';color:#fff;border:none;border-radius:6px;' +
      'padding:7px 10px;margin:2px;font:12px sans-serif;cursor:pointer;white-space:nowrap;';
    return b;
  }

  function buildPanel() {
    const overlay = document.createElement('div');
    overlay.id = 'gb-devconsole-panel';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:rgba(10,12,20,0.97);' +
      'display:flex;flex-direction:column;font-family:sans-serif;';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#0f3460;color:#fff;';
    const title = document.createElement('div');
    title.textContent = '🐛 Gieniobot Logi';
    title.style.cssText = 'font-weight:600;font-size:15px;';
    const closeBtn = mkBtn('✕ Zamknij', 'rgba(244,67,54,0.35)');
    closeBtn.onclick = togglePanel;
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Toolbar
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;padding:6px 8px;background:#12182b;color:#fff;gap:2px;';

    const copyBtn = mkBtn('📋 Kopiuj', 'rgba(76,175,80,0.35)');
    copyBtn.onclick = () => copyText(asText(currentFilterMin));
    const dlBtn = mkBtn('💾 Pobierz', 'rgba(33,150,243,0.35)');
    dlBtn.onclick = () => download(asText(currentFilterMin));

    const sep = document.createElement('span');
    sep.textContent = 'Zakres:';
    sep.style.cssText = 'font:12px sans-serif;color:#9fb3d1;margin:0 4px 0 8px;';

    const filters = [{ l: 'Wszystko', v: 0 }, { l: '5 min', v: 5 }, { l: '15 min', v: 15 }, { l: '30 min', v: 30 }];
    const filterBtns = [];
    function setFilter(v) {
      currentFilterMin = v;
      filterBtns.forEach(fb => fb.el.style.outline = (fb.v === v ? '2px solid #4CAF50' : 'none'));
      customInput.value = (v && !filters.some(f => f.v === v)) ? String(v) : '';
      renderAll();
    }

    bar.appendChild(copyBtn);
    bar.appendChild(dlBtn);
    bar.appendChild(sep);
    filters.forEach(f => {
      const fb = mkBtn(f.l);
      fb.onclick = () => setFilter(f.v);
      filterBtns.push({ el: fb, v: f.v });
      bar.appendChild(fb);
    });

    const customInput = document.createElement('input');
    customInput.type = 'number';
    customInput.placeholder = 'min';
    customInput.style.cssText = 'width:52px;padding:6px;margin:2px;border-radius:6px;border:1px solid #2a3a5a;background:#0a0c14;color:#fff;font:12px sans-serif;';
    const customBtn = mkBtn('OK');
    customBtn.onclick = () => { const v = parseInt(customInput.value, 10); if (v > 0) setFilter(v); };
    bar.appendChild(customInput);
    bar.appendChild(customBtn);

    const clearBtn = mkBtn('🗑 Wyczyść', 'rgba(244,67,54,0.35)');
    clearBtn.onclick = async () => {
      buffer.length = 0;
      dirty = false;
      try { if (typeof AFO_STORAGE !== 'undefined') await AFO_STORAGE.remove(STORAGE_KEY); } catch (e) { }
      renderAll();
      toast('🗑 Logi wyczyszczone');
    };
    bar.appendChild(clearBtn);

    // Log area
    logEl = document.createElement('div');
    logEl.style.cssText = 'flex:1;overflow:auto;padding:8px 10px;font:11px/1.45 monospace;color:#d0d0d0;-webkit-overflow-scrolling:touch;';

    overlay.appendChild(header);
    overlay.appendChild(bar);
    overlay.appendChild(logEl);
    document.body.appendChild(overlay);

    setFilter(0);
    return overlay;
  }

  function togglePanel() {
    const existing = document.getElementById('gb-devconsole-panel');
    if (existing) { existing.remove(); logEl = null; panelOpen = false; return; }
    panelOpen = true;
    buildPanel();
  }

  function mkIcon() {
    if (document.getElementById('gb-devconsole-icon')) return;
    const host = document.body || document.documentElement;
    if (!host) { setTimeout(mkIcon, 500); return; }
    const icon = document.createElement('div');
    icon.id = 'gb-devconsole-icon';
    icon.textContent = '🐛';
    icon.title = 'Gieniobot Logi';
    icon.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:2147483645;width:42px;height:42px;' +
      'border-radius:50%;background:rgba(15,52,96,0.85);color:#fff;font-size:20px;display:flex;' +
      'align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.5);' +
      'user-select:none;-webkit-user-select:none;';
    icon.addEventListener('click', togglePanel);
    host.appendChild(icon);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mkIcon);
  } else {
    mkIcon();
  }

  console.log('[DevConsole] Loaded');
})();
