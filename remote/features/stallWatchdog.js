/**
 * ============================================================================
 * STALL WATCHDOG - Detekcja zawieszenia gry ("infinity spinner") i auto-odzyskanie
 * ============================================================================
 *
 * Background (game client 2.8.129+, connection-recovery.js):
 *  - Every game request goes through a wrapper that sets the global `is_loading=true`
 *    (GAME.load_start → shows #loader, the spinner in the bottom-right corner) and the
 *    ONLY thing that clears it is any 'gr' socket response (GAME.load_stop).
 *  - If the server never answers a request, `is_loading` stays true forever: every
 *    further click / page_switch is silently dropped → the game is frozen until F5.
 *  - The game's own connection-recovery gives up after 30 s (terminal notice) or, after
 *    a successful internal reconnect, drops the player to character select (char_id=0).
 *    The legacy AFO_RECONNECT monitor cannot see either of those states.
 *
 * What this module does (observe-only, never changes game behaviour):
 *  1. Tracks how long `window.is_loading` has been true. After STALL_MS it probes the
 *     socket with `kw_latency` (server acks it, used by the game's own ping widget).
 *     - ack + first stall in SOFT_WINDOW_MS  → soft recovery: GAME.load_stop() (unblocks UI,
 *       bot modules retry on their own).
 *     - no ack, or a second stall inside the window → hard recovery (server really stopped
 *       answering this socket): AFO_STATE_MANAGER.save() + AFO_RECONNECT.handleDisconnect()
 *       (redirect → auto-login → char select → restoreState).
 *  2. Detects the game's connection-recovery states (canSend()===false / socket down for
 *     LINK_DOWN_MS, terminal #connection_notice, char_id lost right after a reconnect) and
 *     triggers the same hard recovery.
 *  3. Persists a diagnostic log (`afo_stall_log` in AFO_STORAGE, survives reload) with the
 *     last outgoing request (a/type), age of the last 'gr', socket state and probe result —
 *     so the user can report which action the server swallows.
 *
 * Debug API: window.STALL_WATCHDOG.{state, T, probe(), getLog(), clearLog(), simulateStall()}
 * ============================================================================
 */

(function () {
  'use strict';

  if (typeof GAME === 'undefined') {
    console.log('[StallWatchdog] GAME is undefined, skipping initialization');
    return;
  }

  const TAG = '[StallWatchdog]';

  // Timing constants (ms)
  const T = {
    TICK_MS: 1000,            // detector loop interval
    STALL_MS: 12000,          // is_loading continuously true → stall (normal RTT is ~30-50 ms)
    LINK_DOWN_MS: 35000,      // canSend()===false / socket disconnected (game itself retries 30 s)
    CHAR_LOST_MS: 8000,       // char_id===0 after a game-side reconnect
    RECENT_LINK_EVENT_MS: 120000, // char-lost only counts if a link event happened this recently
    PROBE_TIMEOUT_MS: 3000,   // kw_latency ack timeout
    SOFT_WINDOW_MS: 120000,   // second stall inside this window after a soft recovery → hard
    NO_CREDS_COOLDOWN_MS: 60000, // don't spam when hard recovery is impossible (no credentials)
    HARD_RELEASE_MS: 20000,   // if the redirect never happened, re-arm the watchdog
    INIT_MAX_WAIT_MS: 180000, // give up waiting for GAME.socket after 3 min
    MAX_LOG: 30
  };

  const W = {
    started: false,
    hooked: false,
    recovering: false,
    hardStarted: false,
    cooldownUntil: 0,
    wasLoggedIn: false,
    loadingSince: 0,
    noSendSince: 0,
    charLostSince: 0,
    lastLinkEventAt: 0,       // last time we saw socket down / canSend false / #connection_notice
    lastEmit: null,           // { order, a, type, ts } - last non-probe outgoing packet
    lastGrTs: 0,
    lastSoftAt: 0,
    softCount: 0,
    hardCount: 0,
    stallCount: 0
  };

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function fmtAge(ts) { return ts ? ((Date.now() - ts) / 1000).toFixed(1) + 's' : 'n/a'; }

  function canSend() {
    const rec = GAME.connectionRecovery;
    if (!rec || typeof rec.canSend !== 'function') return true;
    try { return !!rec.canSend(); } catch (e) { return true; }
  }

  function socketConnected() {
    const s = GAME.socket;
    return !!(s && s.connected);
  }

  // ============================================
  // HOOKS (diagnostics only)
  // ============================================

  function hookSocket() {
    if (W.hooked || !GAME.socket) return;
    const sock = GAME.socket;

    const origEmit = sock.emit;
    sock.emit = function (order, data) {
      if (order !== 'kw_latency') {
        W.lastEmit = {
          order: order,
          a: data && typeof data === 'object' ? data.a : undefined,
          type: data && typeof data === 'object' ? data.type : undefined,
          ts: Date.now()
        };
      }
      return origEmit.apply(this, arguments);
    };

    sock.on('gr', function () { W.lastGrTs = Date.now(); });

    W.hooked = true;
    console.log(TAG, 'Socket hooked (emit tracking + gr timestamps)');
  }

  // ============================================
  // PROBE
  // ============================================

  /** Ping the server through socket.io ack (no game side effects). */
  function probe() {
    return new Promise(resolve => {
      const s = GAME.socket;
      if (!s || !s.connected) return resolve({ ok: false, reason: 'socket not connected' });
      const t0 = Date.now();
      let done = false;
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        resolve({ ok: false, reason: 'no ack in ' + T.PROBE_TIMEOUT_MS + 'ms' });
      }, T.PROBE_TIMEOUT_MS);
      try {
        s.emit('kw_latency', () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve({ ok: true, ms: Date.now() - t0 });
        });
      } catch (e) {
        done = true;
        clearTimeout(timer);
        resolve({ ok: false, reason: String(e) });
      }
    });
  }

  // ============================================
  // LOG / UI
  // ============================================

  function snapshot(extra) {
    const le = W.lastEmit;
    return Object.assign({
      ts: Date.now(),
      time: new Date().toLocaleString('pl-PL', { hour12: false }),
      server: GAME.server,
      char_id: GAME.char_id,
      pid: GAME.pid,
      is_loading: window.is_loading === true,
      loadingFor: W.loadingSince ? Date.now() - W.loadingSince : 0,
      lastEmit: le ? { order: le.order, a: le.a, type: le.type, age: Date.now() - le.ts } : null,
      lastGrAge: W.lastGrTs ? Date.now() - W.lastGrTs : null,
      socketConnected: socketConnected(),
      canSend: canSend(),
      notice: (document.getElementById('connection_notice') || {}).textContent || null
    }, extra || {});
  }

  function describe(d) {
    const le = d.lastEmit;
    return 'is_loading od ' + (d.loadingFor / 1000).toFixed(1) + 's' +
      ' | ostatni emit: ' + (le ? (le.order + ' a:' + le.a + (le.type !== undefined ? ' type:' + le.type : '') + ' (' + (le.age / 1000).toFixed(1) + 's temu)') : 'brak') +
      ' | ostatni gr: ' + (d.lastGrAge !== null ? (d.lastGrAge / 1000).toFixed(1) + 's temu' : 'brak') +
      ' | socket.connected=' + d.socketConnected + ' canSend=' + d.canSend +
      (d.probe ? ' | sonda kw_latency: ' + (d.probe.ok ? 'ack ' + d.probe.ms + 'ms' : 'BRAK (' + d.probe.reason + ')') : '') +
      (d.action ? ' | akcja: ' + d.action : '');
  }

  async function appendLog(entry) {
    try {
      if (typeof AFO_STORAGE === 'undefined') return;
      const KEY = 'afo_stall_log';
      const res = await AFO_STORAGE.get(KEY);
      const arr = Array.isArray(res[KEY]) ? res[KEY] : [];
      arr.push(entry);
      while (arr.length > T.MAX_LOG) arr.shift();
      await AFO_STORAGE.set({ [KEY]: arr });
    } catch (e) {
      // storage bridge missing/timeout - never break recovery because of logging
    }
  }

  function toast(msg, type) {
    try {
      if (typeof AFO_RECONNECT_UI !== 'undefined' && typeof AFO_RECONNECT_UI.showToast === 'function') {
        AFO_RECONNECT_UI.showToast(msg, type || 'warning');
      }
    } catch (e) { /* ignore */ }
  }

  function status(msg) {
    try {
      if (typeof AFO_RECONNECT !== 'undefined' && typeof AFO_RECONNECT._showStatus === 'function') {
        AFO_RECONNECT._showStatus(msg);
      }
    } catch (e) { /* ignore */ }
  }

  // ============================================
  // RECOVERY
  // ============================================

  async function onStall() {
    if (W.recovering) return;
    W.recovering = true;
    W.stallCount++;

    try {
      const pr = await probe();
      const now = Date.now();
      const softAllowed = pr.ok && (now - W.lastSoftAt > T.SOFT_WINDOW_MS);
      const d = snapshot({ kind: 'stall', probe: pr, action: softAllowed ? 'soft (load_stop)' : (pr.ok ? 'hard (drugi stall w oknie ' + (T.SOFT_WINDOW_MS / 1000) + 's)' : 'hard (brak ack)') });

      console.warn(TAG, 'ZAWIESZENIE:', describe(d));
      appendLog(d);

      if (softAllowed) {
        W.softCount++;
        W.lastSoftAt = now;
        try { GAME.load_stop(); } catch (e) { window.is_loading = false; }
        W.loadingSince = 0;
        toast('Watchdog: gra zawieszona (brak odpowiedzi serwera) — odblokowano', 'warning');
        W.recovering = false;
        return;
      }

      await hardRecover(pr.ok ? 'stall-repeated' : 'stall-no-ack', d);
    } catch (e) {
      console.error(TAG, 'onStall error:', e);
      W.recovering = false;
    }
  }

  async function hardRecover(reason, diag) {
    if (W.hardStarted) return;
    W.hardStarted = true;
    W.recovering = true;
    W.hardCount++;

    const d = diag || snapshot({ kind: 'hard', reason: reason });
    d.kind = d.kind || 'hard';
    d.reason = reason;
    console.warn(TAG, 'HARD RECOVERY (' + reason + '):', describe(d));
    if (!diag) appendLog(d);

    const R = (typeof AFO_RECONNECT !== 'undefined') ? AFO_RECONNECT : null;
    let creds = null;
    try { creds = R ? await R.getCredentials() : null; } catch (e) { creds = null; }

    if (!R || !creds) {
      console.warn(TAG, 'Brak zapisanych danych logowania — nie mogę zrobić auto-reconnectu. Odśwież stronę (F5).');
      status('Gra zawieszona (' + reason + ') — brak danych logowania do auto-reconnectu. Odśwież stronę (F5).');
      toast('Watchdog: gra zawieszona — odśwież stronę (F5)', 'error');
      // At least unblock the UI so the user can click around / see what happened
      if (window.is_loading === true) { try { GAME.load_stop(); } catch (e) { /* ignore */ } }
      W.loadingSince = 0;
      W.cooldownUntil = Date.now() + T.NO_CREDS_COOLDOWN_MS;
      W.hardStarted = false;
      W.recovering = false;
      return;
    }

    try {
      if (GAME.char_id > 0 && typeof AFO_STATE_MANAGER !== 'undefined' &&
          (typeof AFO_STATE_MANAGER.modulesPresent !== 'function' || AFO_STATE_MANAGER.modulesPresent())) {
        await AFO_STATE_MANAGER.save();
      }
    } catch (e) { console.warn(TAG, 'state save failed:', e); }

    let backoff = 0;
    try { backoff = await R.registerReconnectAttempt(); } catch (e) { backoff = 0; }
    if (backoff > 0) {
      console.warn(TAG, 'Pętla reconnectu — odczekuję ' + Math.round(backoff / 1000) + 's');
      status('Zawieszenie gry — pętla reconnectu, odczekuję ' + Math.round(backoff / 1000) + 's...');
      await sleep(backoff);
    }

    await R.handleDisconnect('zawieszenie gry: ' + reason);

    // If we are still on this page after a while (redirect blocked?), re-arm.
    setTimeout(() => { W.hardStarted = false; W.recovering = false; }, T.HARD_RELEASE_MS);
  }

  // ============================================
  // DETECTOR LOOP
  // ============================================

  function tick() {
    if (typeof GAME === 'undefined') return;
    if (!W.hooked && GAME.socket) hookSocket();
    if (W.recovering) return;
    if (typeof AFO_RECONNECT !== 'undefined' && AFO_RECONNECT.isProcessing) return;

    const now = Date.now();
    if (now < W.cooldownUntil) return;

    if (GAME.char_id > 0) { W.wasLoggedIn = true; W.charLostSince = 0; }

    // --- link state (game's connection-recovery.js) ---
    const linkDown = !socketConnected() || !canSend();
    const notice = document.getElementById('connection_notice');
    if (linkDown || notice) W.lastLinkEventAt = now;

    // Terminal notice only ("Połączenie zakończone. Odśwież stronę, aby zalogować się ponownie.").
    // The retrying notice ("Utracono połączenie. Ponowne łączenie…") also carries an
    // "Odśwież / Reload" button, so match the sentence, not the button.
    if (notice && /Połączenie zakończone|zalogować się ponownie/i.test(notice.textContent || '')) {
      hardRecover('terminal-notice');
      return;
    }

    if (linkDown && W.wasLoggedIn) {
      if (!W.noSendSince) W.noSendSince = now;
      else if (now - W.noSendSince >= T.LINK_DOWN_MS) { hardRecover('link-down'); return; }
    } else {
      W.noSendSince = 0;
    }

    // --- char lost after a game-side reconnect (not a manual "Zmień postać") ---
    if (W.wasLoggedIn && GAME.char_id === 0 && !linkDown &&
        W.lastLinkEventAt && (now - W.lastLinkEventAt) < T.RECENT_LINK_EVENT_MS) {
      if (!W.charLostSince) W.charLostSince = now;
      else if (now - W.charLostSince >= T.CHAR_LOST_MS) { hardRecover('char-lost'); return; }
    } else {
      W.charLostSince = 0;
    }

    // --- stall: is_loading stuck ---
    if (window.is_loading === true) {
      if (!W.loadingSince) W.loadingSince = now;
      else if (now - W.loadingSince >= T.STALL_MS && GAME.char_id > 0 && !linkDown) { onStall(); return; }
    } else {
      W.loadingSince = 0;
    }
  }

  // ============================================
  // INIT
  // ============================================

  function start() {
    if (W.started) return;
    W.started = true;
    hookSocket();
    setInterval(tick, T.TICK_MS);
    console.log(TAG, 'Started (stall ' + T.STALL_MS / 1000 + 's, link-down ' + T.LINK_DOWN_MS / 1000 + 's, char-lost ' + T.CHAR_LOST_MS / 1000 + 's)');
  }

  (function waitForSocket() {
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (typeof GAME !== 'undefined' && GAME.socket) {
        clearInterval(iv);
        start();
      } else if (Date.now() - t0 > T.INIT_MAX_WAIT_MS) {
        clearInterval(iv);
        console.warn(TAG, 'GAME.socket not found after ' + T.INIT_MAX_WAIT_MS / 1000 + 's — watchdog not started');
      }
    }, 1000);
  })();

  // ============================================
  // DEBUG API
  // ============================================

  window.STALL_WATCHDOG = {
    state: W,
    T: T,
    probe: probe,
    tick: tick,
    snapshot: () => snapshot(),
    getLog: async () => {
      if (typeof AFO_STORAGE === 'undefined') return [];
      const res = await AFO_STORAGE.get('afo_stall_log');
      return res.afo_stall_log || [];
    },
    clearLog: async () => {
      if (typeof AFO_STORAGE !== 'undefined') await AFO_STORAGE.remove('afo_stall_log');
    },
    /** Test helper: reproduce the frozen state (is_loading=true without a request). */
    simulateStall: () => { GAME.load_start(); console.log(TAG, 'simulateStall: is_loading=true, watchdog should react in ~' + T.STALL_MS / 1000 + 's'); }
  };

  console.log(TAG, 'Loaded');
})();
