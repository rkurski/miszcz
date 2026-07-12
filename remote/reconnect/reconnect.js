/**
 * ============================================================================
 * AFO - Reconnect Module
 * ============================================================================
 * 
 * Aggressive auto-reconnection:
 * - On main page: immediately tries to login if credentials exist
 * - On server page: monitors for disconnect and redirects to main page
 * - Always restores saved state after successful login
 * 
 * URL Structure:
 * - https://kosmiczni.pl/ - main/login page  
 * - https://s1.kosmiczni.pl/ - game on server 1 (s1-sXX)
 * 
 * ============================================================================
 */

const AFO_RECONNECT = {
  // ============================================
  // TIMING CONSTANTS (milliseconds)
  // ============================================
  TIMING: {
    CHECK_INTERVAL: 3000,         // How often to check connection (3s)
    INIT_DELAY: 2000,             // Initial delay before starting
    LOGIN_FORM_WAIT: 1000,        // Wait after filling login form
    LOGIN_SUBMIT_WAIT: 2500,      // Wait after submitting login
    LOGIN_PAGE_DELAY: 4000,       // Wait on login page before auto-fill (user reaction time)
    SERVER_SELECT_WAIT: 1500,     // Wait after selecting server
    CHAR_SELECT_DELAY: 5000,      // Wait BEFORE selecting character (user reaction time)
    CHAR_SELECT_WAIT: 2500,       // Wait after selecting character
    SCRIPTS_LOAD_WAIT: 5000,      // Wait for Gieniobot scripts to load
    GAME_READY_CHECK: 500,        // How often to check if GAME is ready
    MAX_WAIT: 60000,              // Max time to wait for any operation
    RETRY_DELAY: 3000             // Delay between retries
  },

  // State
  isInitialized: false,
  isProcessing: false,
  isReconnecting: false,        // true ONLY after disconnect redirect
  monitorRunning: false,
  targetServer: null,
  targetCharId: null,
  savedStateToRestore: null,

  // Page context
  isMainPage: false,
  isServerPage: false,
  currentServer: null,

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log('[AFO_RECONNECT] Initializing...');

    // Detect page context
    this.detectPageContext();

    // Start after brief delay to let page load
    setTimeout(() => {
      this.start();
    }, this.TIMING.INIT_DELAY);
  },

  detectPageContext() {
    const hostname = window.location.hostname;
    console.log('[AFO_RECONNECT] Hostname:', hostname);

    this.isMainPage = hostname === 'kosmiczni.pl' || hostname === 'www.kosmiczni.pl';
    this.isServerPage = /^s\d+\.kosmiczni\.pl$/.test(hostname);

    if (this.isServerPage) {
      const match = hostname.match(/^s(\d+)\./);
      this.currentServer = match ? parseInt(match[1]) : null;
    }

    console.log('[AFO_RECONNECT] Context:', {
      isMainPage: this.isMainPage,
      isServerPage: this.isServerPage,
      currentServer: this.currentServer
    });
  },

  async start() {
    console.log('[AFO_RECONNECT] Starting...');

    try {
      // Auth/session-error page detection. The game may serve this either at a
      // non-root path (e.g. /auth?sid=) OR at '/' with only an error message.
      // Detect by BOTH pathname and DOM content so we never get stuck here.
      if (this.isServerPage && (window.location.pathname !== '/' || this.isAuthErrorPage())) {
        console.log('[AFO_RECONNECT] Non-game/auth-error page detected on server (path:', window.location.pathname, ', authError:', this.isAuthErrorPage(), ') - recovering...');
        if (!this.targetServer) this.targetServer = this.currentServer;
        await this.recoverFromAuthError();
        return;
      }

      // Load reconnect target from chrome.storage (survives cross-subdomain redirect)
      await this.loadReconnectTarget();

      // Load credentials
      const creds = await this.getCredentials();
      if (!creds) {
        console.log('[AFO_RECONNECT] No credentials saved, passive mode');
        // Still monitor for disconnect on server page
        if (this.isServerPage) {
          this.startDisconnectMonitor();
        }
        return;
      }

      // On server page: set targetServer from URL if not already set
      if (this.isServerPage && this.currentServer && !this.targetServer) {
        this.targetServer = this.currentServer;
      }

      // Load saved state (on server page always, on main page only when reconnecting)
      if (this.isServerPage || this.isReconnecting) {
        await this.loadSavedState();
      }

      // MAIN PAGE: Auto-login when reconnecting or when recent state exists
      if (this.isMainPage) {
        if (this.isReconnecting) {
          console.log('[AFO_RECONNECT] On main page, reconnect mode - initiating login...');
          await this.handleMainPage(creds);
        } else {
          // Infer reconnect from recent saved state (catches server restart redirects
          // where disconnect monitor didn't have time to save reconnect target)
          const inferred = await this.inferReconnectFromState();
          if (inferred) {
            console.log('[AFO_RECONNECT] On main page, inferred reconnect from recent state - initiating login...');
            this.isReconnecting = true;
            await this.handleMainPage(creds);
          } else {
            console.log('[AFO_RECONNECT] On main page, normal mode - not auto-logging in');
          }
        }
      }

      // SERVER PAGE: Always handle (monitor + auto-select if saved state exists)
      if (this.isServerPage) {
        await this.handleServerPage(creds);
      }
    } catch (error) {
      console.error('[AFO_RECONNECT] start() failed:', error, '- retrying in 5s...');
      this.isInitialized = false;
      this.isProcessing = false;
      setTimeout(() => {
        this.init();
      }, 5000);
    }
  },

  async loadReconnectTarget() {
    if (typeof AFO_STORAGE === 'undefined') return;

    try {
      const result = await AFO_STORAGE.get('afo_reconnect_target');
      const target = result['afo_reconnect_target'];

      if (target && target.server) {
        this.targetServer = parseInt(target.server);
        this.targetCharId = target.charId ? parseInt(target.charId) : null;
        this.isReconnecting = true;
        console.log('[AFO_RECONNECT] Loaded reconnect target (reconnect mode):', this.targetServer, this.targetCharId);

        // Only clear on server page (where we consume it).
        // On main page we keep it so the flag survives the redirect to server page.
        if (this.isServerPage) {
          await AFO_STORAGE.remove('afo_reconnect_target');
        }
      }
    } catch (e) {
      console.error('[AFO_RECONNECT] Error loading reconnect target:', e);
    }
  },

  // ============================================
  // MAIN PAGE HANDLER
  // ============================================

  async handleMainPage(creds) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Wait for page to be ready + give user time to react
      this._showStatus('Strona główna — auto-logowanie za chwilę...');
      await this.sleep(this.TIMING.LOGIN_PAGE_DELAY);

      // Retry login form detection (DOM may not be ready on mobile)
      const MAX_LOGIN_ATTEMPTS = 8;
      let loginDone = false;

      for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
        if (this.needsCredentialsLogin()) {
          this._showStatus('Wpisuję login i hasło (próba ' + (i + 1) + ')...');
          await this.fillCredentials(creds);
          await this.sleep(this.TIMING.LOGIN_SUBMIT_WAIT);
          loginDone = true;
          break;
        }

        // Already past login (server select visible or redirected)?
        if (this.needsServerSelect()) {
          loginDone = true;
          break;
        }

        console.log('[AFO_RECONNECT] Main page: waiting for login form (attempt ' + (i + 1) + '/' + MAX_LOGIN_ATTEMPTS + ')...');
        await this.sleep(2000);
      }

      if (!loginDone) {
        console.warn('[AFO_RECONNECT] Login form not found after ' + MAX_LOGIN_ATTEMPTS + ' attempts');
      }

      // Retry server select detection / proceed to server.
      const MAX_SERVER_ATTEMPTS = 8;
      for (let i = 0; i < MAX_SERVER_ATTEMPTS; i++) {
        // Check if we've already been redirected (no longer on main page)
        if (window.location.hostname !== 'kosmiczni.pl' && window.location.hostname !== 'www.kosmiczni.pl') {
          console.log('[AFO_RECONNECT] Already redirected to', window.location.hostname);
          return;
        }

        const serverSelectVisible = this.needsServerSelect();

        // Wrong-account guard: the shared-IP glitch sometimes auto-logs a DIFFERENT
        // account. If the shown login (#logged_login) mismatches our credentials,
        // log out and re-login as the correct account before selecting a server.
        if (serverSelectVisible) {
          const loggedLogin = (document.getElementById('logged_login')?.innerText || '').trim();
          if (loggedLogin && creds.login && loggedLogin.toLowerCase() !== creds.login.toLowerCase()) {
            console.warn('[AFO_RECONNECT] Wrong account on server-select: logged="' + loggedLogin + '" expected="' + creds.login + '"');
            await this.handleWrongAccount(creds);
            continue; // re-evaluate fresh (login/server-select for the correct account)
          }
        }

        // Proceed to the target server once login has been submitted. Prefer the
        // detected server-select, but after a couple of attempts fall back anyway:
        // on mobile #logged_id/#server_choose detection (needsServerSelect) is
        // unreliable, so we go DOM-independent. selectServer() clicks the select if
        // present, otherwise navigates directly to main_page/login/<server> (exactly
        // what the game does on server select — see bigcode.html).
        if (this.targetServer && loginDone && (serverSelectVisible || i >= 2)) {
          this._showStatus('Wchodzę na serwer ' + this.targetServer + (serverSelectVisible ? ' (select)' : ' (bezpośrednio)') + '...');
          await this.selectServer(this.targetServer);
          // selectServer navigates away; if for some reason it didn't, the loop/retry continues
          if (window.location.hostname !== 'kosmiczni.pl' && window.location.hostname !== 'www.kosmiczni.pl') return;
        }

        console.log('[AFO_RECONNECT] Main page: waiting for server (attempt ' + (i + 1) + '/' + MAX_SERVER_ATTEMPTS + ', targetServer=' + this.targetServer + ', serverSelect=' + serverSelectVisible + ', loginForm=' + this.needsCredentialsLogin() + ')...');
        await this.sleep(2000);
      }

      // Last resort: logged in but never managed to leave the main page — force a
      // direct navigation to the target server (covers mobile edge cases entirely).
      if (this.targetServer && loginDone &&
        (window.location.hostname === 'kosmiczni.pl' || window.location.hostname === 'www.kosmiczni.pl')) {
        this._showStatus('Wybór serwera nie wykryty — wchodzę bezpośrednio na /login/' + this.targetServer);
        window.location.href = 'https://kosmiczni.pl/login/' + this.targetServer;
        return;
      }

      // Not found - fall through to retry below
      console.warn('[AFO_RECONNECT] Server select not found after ' + MAX_SERVER_ATTEMPTS + ' attempts');

    } catch (error) {
      console.error('[AFO_RECONNECT] Main page error:', error);
    } finally {
      this.isProcessing = false;
    }

    // Never give up - retry after delay (both "not found" and error paths end up here)
    console.log('[AFO_RECONNECT] Retrying main page login in 15s...');
    await this.sleep(15000);
    return this.handleMainPage(creds);
  },

  // ============================================
  // SERVER PAGE HANDLER  
  // ============================================

  async handleServerPage(creds, _attempt) {
    // Track attempts to prevent infinite loop
    if (_attempt === undefined) _attempt = 0;
    const MAX_ATTEMPTS = 60; // max ~3 minutes of retrying (60 * 3s)

    console.log('[AFO_RECONNECT] handleServerPage attempt ' + (_attempt + 1) + '/' + MAX_ATTEMPTS + ' (reconnecting:', this.isReconnecting, ')');

    if (_attempt >= MAX_ATTEMPTS) {
      console.error('[AFO_RECONNECT] handleServerPage: max attempts reached (' + MAX_ATTEMPTS + '), giving up. GAME state:',
        typeof GAME !== 'undefined' ? { pid: GAME.pid, char_id: GAME.char_id, is_disconnected: GAME.is_disconnected } : 'GAME undefined');
      return;
    }

    // Start disconnect monitor immediately (always, regardless of reconnect mode)
    this.startDisconnectMonitor();

    // FAST PATH: auth/session-error page (detected by content) — recover instantly
    // instead of waiting 30s for a GAME that will never load.
    if (this.isAuthErrorPage()) {
      console.log('[AFO_RECONNECT] Auth/error page detected by content in handleServerPage — recovering...');
      await this.recoverFromAuthError();
      return;
    }

    // Wait for GAME to be available (longer timeout for mobile)
    this._showStatus('Serwer ' + this.currentServer + ' — czekam na załadowanie gry...');
    const waitStart = Date.now();
    const gameReady = await this.waitForGame(30000);

    if (!gameReady) {
      // Check if this is actually the game page or a server-rendered error/auth page
      // #game_win is in the static HTML of the game client (bigcode.html line 31), always present
      // On auth error pages (e.g. session expired after server restart) it does NOT exist
      const hasGameStructure = document.getElementById('game_win');

      if (!hasGameStructure) {
        // Not the game page - likely auth error or session expired page
        console.log('[AFO_RECONNECT] No #game_win after 30s - treating as auth/error page. Recovering...');
        await this.recoverFromAuthError();
        return;
      }

      // Game page structure exists but GAME JS not loaded yet - keep retrying
      console.warn('[AFO_RECONNECT] GAME not available after 30s (game structure present, JS still loading). Retrying...');
      await this.sleep(3000);
      return this.handleServerPage(creds, _attempt + 1);
    }

    console.log('[AFO_RECONNECT] GAME ready after ' + (Date.now() - waitStart) + 'ms');

    // Check if disconnected (GAME exists but connection lost)
    if (this.isDisconnected()) {
      if (this.savedStateToRestore) {
        // We have saved state - initiate reconnect regardless of isReconnecting flag
        console.log('[AFO_RECONNECT] Disconnected on server page with saved state, redirecting...');
        await this.saveReconnectTarget();
        window.location.href = 'https://kosmiczni.pl/';
      } else {
        console.log('[AFO_RECONNECT] Disconnected, no saved state - monitor will handle future disconnects');
      }
      return;
    }

    // Check if on character select
    if (this.isCharacterSelectScreen()) {
      if (!this.isReconnecting) {
        console.log('[AFO_RECONNECT] On character select, not reconnecting - skipping auto-select and restore');
        this.savedStateToRestore = null;
        return;
      }

      if (!this.savedStateToRestore) {
        console.log('[AFO_RECONNECT] On character select, no saved state - skipping auto-select');
        return;
      }

      if (this.currentServer !== this.targetServer) {
        console.log('[AFO_RECONNECT] Server mismatch! Current:', this.currentServer, 'Target:', this.targetServer, '- skipping auto-select');
        this.savedStateToRestore = null;
        return;
      }

      // Give user time to manually select a different character
      this._showStatus('Wybór postaci — auto-wybór postaci ' + this.targetCharId + ' za ' + Math.round(this.TIMING.CHAR_SELECT_DELAY / 1000) + 's...');
      await this.sleep(this.TIMING.CHAR_SELECT_DELAY);

      // Re-check: user might have selected a character manually during the delay
      if (this.isFullyLoggedIn()) {
        console.log('[AFO_RECONNECT] User already logged in during wait - checking if state should be restored');
        if (GAME.char_id == this.targetCharId && GAME.server == this.targetServer) {
          await this.restoreState();
        } else {
          console.log('[AFO_RECONNECT] User chose different character (', GAME.char_id, ') than target (', this.targetCharId, ') - skipping restore');
          this.savedStateToRestore = null;
        }
        return;
      }

      // Still on char select - auto-select the target character (or wait for manual selection)
      if (this.isCharacterSelectScreen()) {
        if (this.targetCharId) {
          console.log('[AFO_RECONNECT] Auto-selecting character', this.targetCharId);
        } else {
          console.log('[AFO_RECONNECT] No target charId, waiting for manual character selection...');
        }
        await this.selectCharacter(this.targetCharId);

        // Wait for login (manual or auto)
        if (!this.isFullyLoggedIn()) {
          console.log('[AFO_RECONNECT] Waiting for full login...');
          await this.waitForFullyLoggedIn(60000);
        }

        // Go to map first to avoid GAME.mapCharMove errors
        console.log('[AFO_RECONNECT] Waiting 2s then going to map...');
        await this.sleep(2000);
        if (typeof GAME !== 'undefined' && GAME.page_switch) {
          GAME.page_switch('game_map');
          console.log('[AFO_RECONNECT] Switched to game_map');
          await this.sleep(1000);
        }

        await this.restoreState();
        return;
      }

      return;
    }

    // Check if fully logged in
    if (this.isFullyLoggedIn()) {
      console.log('[AFO_RECONNECT] Already logged in (char_id:', GAME.char_id, 'server:', GAME.server, 'login:', GAME.login, ')');
      // Confirmed logged in → reset the auth-error loop guard
      this.clearReconnectAttempts();
      if (this.savedStateToRestore && this.isReconnecting) {
        // Validate server/char match before restoring
        if (GAME.char_id == this.targetCharId && GAME.server == this.targetServer) {
          await this.restoreState();
        } else {
          console.log('[AFO_RECONNECT] Logged in but server/char mismatch - skipping restore. Current:', GAME.server + '/' + GAME.char_id, 'Target:', this.targetServer + '/' + this.targetCharId);
          this.savedStateToRestore = null;
        }
      } else if (this.savedStateToRestore && !this.isReconnecting) {
        console.log('[AFO_RECONNECT] Already logged in, but not reconnecting - skipping restore');
        this.savedStateToRestore = null;
      }
      return;
    }

    // Otherwise wait and check again (GAME exists but not fully logged in yet)
    console.log('[AFO_RECONNECT] GAME exists but not fully logged in yet, retrying in 3s...',
      { pid: GAME.pid, char_id: GAME.char_id, is_disconnected: GAME.is_disconnected });
    await this.sleep(3000);
    return this.handleServerPage(creds, _attempt + 1);
  },

  // ============================================
  // DISCONNECT MONITOR
  // ============================================

  startDisconnectMonitor() {
    if (this.monitorRunning) {
      console.log('[AFO_RECONNECT] Monitor already running');
      return;
    }

    this.monitorRunning = true;
    console.log('[AFO_RECONNECT] 🔴 Starting disconnect monitor (interval: ' + this.TIMING.CHECK_INTERVAL + 'ms)');

    // Store interval ID to allow cleanup
    this.monitorIntervalId = setInterval(() => {
      if (this.isProcessing) return;

      // Check GAME.is_disconnected - most reliable
      if (typeof GAME !== 'undefined') {
        if (GAME.is_disconnected > 0) {
          console.log('[AFO_RECONNECT] 🔴 Disconnect detected: GAME.is_disconnected =', GAME.is_disconnected);
          this.handleDisconnect();
          return;
        }

        // GAME.pid === 0 means disconnected (but we had char_id before)
        if (GAME.pid === 0 && GAME.char_id > 0) {
          console.log('[AFO_RECONNECT] 🔴 Disconnect detected: GAME.pid = 0');
          this.handleDisconnect();
          return;
        }
      }

      // Check for disconnect message
      const komCon = document.getElementById('kom_con');
      if (komCon && komCon.innerText.includes('Rozłączono z serwerem!')) {
        console.log('[AFO_RECONNECT] 🔴 Disconnect detected: message visible');
        this.handleDisconnect();
        return;
      }

      // Check for hidden game window (only if we have char_id)
      const gameWin = document.querySelector('#game_win');
      if (gameWin && gameWin.style.display === 'none') {
        if (typeof GAME !== 'undefined' && GAME.char_id > 0) {
          console.log('[AFO_RECONNECT] 🔴 Disconnect detected: #game_win hidden');
          this.handleDisconnect();
          return;
        }
      }
    }, this.TIMING.CHECK_INTERVAL);

    // Proactive save on page unload (catches server restart redirects
    // where disconnect monitor doesn't fire in time)
    if (!this._beforeUnloadBound) {
      this._beforeUnloadBound = true;
      window.addEventListener('beforeunload', () => {
        if (!this.isServerPage) return;
        if (typeof GAME === 'undefined' || !GAME.server || !GAME.char_id) return;

        try {
          if (typeof AFO_STATE_MANAGER !== 'undefined') {
            AFO_STATE_MANAGER.save();
          }
          if (typeof AFO_STORAGE !== 'undefined') {
            AFO_STORAGE.set({
              'afo_reconnect_target': {
                server: GAME.server,
                charId: GAME.char_id,
                savedAt: Date.now()
              }
            });
          }
        } catch (e) { /* swallow errors during unload */ }
      });
    }
  },

  stopDisconnectMonitor() {
    if (this.monitorIntervalId) {
      clearInterval(this.monitorIntervalId);
      this.monitorIntervalId = null;
      this.monitorRunning = false;
      console.log('[AFO_RECONNECT] Monitor stopped');
    }
  },

  async handleDisconnect() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    console.log('[AFO_RECONNECT] 🔄 Handling disconnect...');

    // Get credentials
    const creds = await this.getCredentials();
    if (!creds) {
      console.log('[AFO_RECONNECT] No credentials, cannot auto-reconnect');
      this.isProcessing = false;
      return;
    }

    // Save target and redirect with small delay so user can see what's happening
    this._showStatus('Rozłączono z serwerem — przekierowuję na stronę główną...');
    await this.saveReconnectTarget();

    await this.sleep(1500);
    window.location.href = 'https://kosmiczni.pl/';
  },

  // ============================================
  // LOGIN HELPERS
  // ============================================

  needsCredentialsLogin() {
    const notLogged = document.getElementById('not_logged');
    if (!notLogged) return false;

    const style = window.getComputedStyle(notLogged);
    const isVisible = style.display !== 'none' && !notLogged.classList.contains('initial_hide');

    const loginField = document.getElementById('login_login');
    return isVisible && loginField;
  },

  needsServerSelect() {
    const loggedId = document.getElementById('logged_id');
    if (!loggedId) return false;

    const style = window.getComputedStyle(loggedId);
    const isVisible = style.display !== 'none';

    const serverSelect = document.getElementById('server_choose');
    return isVisible && serverSelect;
  },

  async fillCredentials(creds) {
    const loginField = document.getElementById('login_login');
    const passwordField = document.getElementById('login_pass');
    const loginButton = document.getElementById('cg_login_button1');

    if (!loginField || !passwordField) {
      console.log('[AFO_RECONNECT] Login form not found');
      return;
    }

    loginField.value = creds.login;
    passwordField.value = creds.password;

    console.log('[AFO_RECONNECT] Filled credentials, submitting...');

    await this.sleep(this.TIMING.LOGIN_FORM_WAIT);

    if (loginButton) {
      loginButton.click();
    }
  },

  async selectServer(server) {
    const serverSelect = document.getElementById('server_choose');
    const loginButton = document.getElementById('cg_login_button2');

    if (serverSelect) {
      serverSelect.value = server.toString();
      serverSelect.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('[AFO_RECONNECT] Selected server', server, ', submitting...');
      await this.sleep(this.TIMING.SERVER_SELECT_WAIT);
      if (loginButton) loginButton.click();
      // Give the click a moment to trigger navigation
      await this.sleep(2500);
    } else {
      console.log('[AFO_RECONNECT] Server select not found - will try direct navigation');
    }

    // Robust fallback: if we're still on the main page (click didn't navigate — common
    // on mobile/touch), navigate directly the same way the game does on server select
    // (bigcode.html: window.location.href = GAME.main_page + '/login/' + server).
    if (window.location.hostname === 'kosmiczni.pl' || window.location.hostname === 'www.kosmiczni.pl') {
      console.log('[AFO_RECONNECT] Still on main page — navigating directly to /login/' + server);
      window.location.href = 'https://kosmiczni.pl/login/' + server;
    }
  },

  async selectCharacter(charId) {
    if (!charId) {
      console.log('[AFO_RECONNECT] No target charId, waiting for manual selection');
      return;
    }
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      console.log('[AFO_RECONNECT] Selecting character', charId);

      await this.sleep(1000);

      if (typeof GAME !== 'undefined' && GAME.socket) {
        GAME.socket.emit('ga', { a: 2, char_id: parseInt(charId) });
        console.log('[AFO_RECONNECT] Sent character select via socket');
      } else {
        const charElement = document.querySelector(`[data-char_id="${charId}"]`);
        if (charElement) {
          charElement.click();
          console.log('[AFO_RECONNECT] Clicked character in list');
        } else {
          console.log('[AFO_RECONNECT] Character not found in list');
        }
      }

      await this.sleep(this.TIMING.CHAR_SELECT_WAIT);
    } finally {
      this.isProcessing = false;
    }
  },

  // ============================================
  // STATE CHECKS
  // ============================================

  isDisconnected() {
    // GAME not loaded yet ≠ disconnected (critical for mobile where GAME loads slowly)
    if (typeof GAME === 'undefined') return false;

    if (GAME.is_disconnected > 0) return true;
    if (GAME.pid === 0 && !this.isCharacterSelectScreen()) return true;

    const komCon = document.getElementById('kom_con');
    if (komCon && komCon.innerText.includes('Rozłączono z serwerem!')) return true;

    return false;
  },

  isCharacterSelectScreen() {
    const charList = document.querySelector('#char_list_con');
    if (charList && charList.children.length > 0) return true;

    if (typeof GAME !== 'undefined' && GAME.player_chars > 0 && !GAME.char_id) return true;

    return false;
  },

  isFullyLoggedIn() {
    if (typeof GAME === 'undefined') return false;
    return GAME.pid > 0 && GAME.char_id > 0 && GAME.char_data;
  },

  /**
   * Detect the server-side auth/session-expired error page by CONTENT (not just URL).
   * After a server restart the game sometimes serves this page even at pathname '/'
   * (see auth.html): <div class="kom"><div class="content">Uwierzytelnienie sesji nie
   * powiodło się lub sesja wygasła!</div><a class="newBtn" href="https://kosmiczni.pl">
   * Strona Głowna</a></div>. It has NO #game_win, no jQuery and no GAME.
   */
  isAuthErrorPage() {
    try {
      // Real game page always has #game_win in its static HTML → never an error page
      if (document.getElementById('game_win')) return false;

      const kom = document.querySelector('div.kom .content');
      if (kom) {
        const t = (kom.innerText || kom.textContent || '').toLowerCase();
        if (t.includes('uwierzytelnienie') || t.includes('sesja wygas') ||
            t.includes('sesji nie') || t.includes('nie powiod')) {
          return true;
        }
      }

      // Fallback: the "Strona Głowna" recovery link back to the main page
      const btn = document.querySelector('a.newBtn[href*="kosmiczni.pl"]');
      if (btn) return true;
    } catch (e) {
      // DOM not ready / access error — treat as not-an-error-page
    }
    return false;
  },

  /**
   * Recover from an auth/session-error page: register the attempt (loop guard),
   * back off progressively if we're bouncing, then redirect to the main page to
   * restart the login flow. Always redirects even if storage fails.
   */
  async recoverFromAuthError() {
    if (this._recovering) return;
    this._recovering = true;

    if (!this.targetServer && this.currentServer) this.targetServer = this.currentServer;

    this._showStatus('Błąd sesji / strona auth — wracam na stronę główną...');
    const backoff = await this.registerReconnectAttempt();
    if (backoff > 0) {
      this._showStatus('Pętla reconnectu — odczekuję ' + Math.round(backoff / 1000) + 's...');
      console.warn('[AFO_RECONNECT] ⏳ Reconnect loop detected — backing off ' + Math.round(backoff / 1000) + 's before retry');
      if (typeof AFO_RECONNECT_UI !== 'undefined') {
        try { AFO_RECONNECT_UI.showToast('Pętla reconnectu — odczekuję ' + Math.round(backoff / 1000) + 's', 'warning'); } catch (e) { }
      }
      await this.sleep(backoff);
    } else {
      // Brief settle so the server finishes restarting before we hammer login
      await this.sleep(2000);
    }

    await this.saveReconnectTarget();
    window.location.href = 'https://kosmiczni.pl/';
  },

  /**
   * Loop guard for auth-error recovery. Counts attempts in a 5-min window and
   * returns EXTRA backoff ms once we exceed a small threshold (0 = normal).
   */
  async registerReconnectAttempt() {
    if (typeof AFO_STORAGE === 'undefined') return 0;
    const KEY = 'afo_reconnect_attempts';
    const WINDOW = 5 * 60 * 1000; // 5 min
    try {
      const now = Date.now();
      const res = await AFO_STORAGE.get(KEY);
      let rec = res[KEY];
      if (!rec || (now - (rec.firstAt || 0)) > WINDOW) {
        rec = { count: 0, firstAt: now };
      }
      rec.count++;
      rec.lastAt = now;
      await AFO_STORAGE.set({ [KEY]: rec });
      console.log('[AFO_RECONNECT] Reconnect attempt #' + rec.count + ' in current window');
      // After 3 quick attempts, back off: 10s, 20s, 40s, 80s ... cap 120s
      if (rec.count > 3) {
        return Math.min(120000, 10000 * Math.pow(2, rec.count - 4));
      }
      return 0;
    } catch (e) {
      return 0;
    }
  },

  /** Reset the loop-guard counter after a confirmed successful login. */
  async clearReconnectAttempts() {
    if (typeof AFO_STORAGE === 'undefined') return;
    try { await AFO_STORAGE.remove('afo_reconnect_attempts'); } catch (e) { }
  },

  /**
   * Wrong-account guard (game glitch): on shared IP the server sometimes auto-logs
   * a DIFFERENT account. If the login shown on the server-select screen (#logged_login)
   * doesn't match our saved credentials, log out, wait, and log back in correctly.
   * Returns true if a re-login was performed.
   */
  async handleWrongAccount(creds) {
    const logoutBtn = document.getElementById('logout');
    this._showStatus('Złe konto — wylogowuję i loguję jako ' + creds.login + '...');
    if (logoutBtn) logoutBtn.click();
    await this.sleep(2500);

    // Login form should reappear after logout
    for (let i = 0; i < 8; i++) {
      if (this.needsCredentialsLogin()) {
        console.log('[AFO_RECONNECT] Re-filling correct credentials (attempt ' + (i + 1) + ')...');
        await this.fillCredentials(creds);
        await this.sleep(this.TIMING.LOGIN_SUBMIT_WAIT);
        return true;
      }
      await this.sleep(1000);
    }
    console.warn('[AFO_RECONNECT] Login form did not reappear after logout');
    return false;
  },

  // ============================================
  // WAITING HELPERS
  // ============================================

  async waitForGame(timeout = 60000) {
    console.log('[AFO_RECONNECT] Waiting for GAME (timeout: ' + (timeout / 1000) + 's)...');
    const startTime = Date.now();

    return new Promise((resolve) => {
      const check = () => {
        if (typeof GAME !== 'undefined') {
          console.log('[AFO_RECONNECT] GAME found after ' + (Date.now() - startTime) + 'ms');
          resolve(true);
          return;
        }

        if (Date.now() - startTime > timeout) {
          console.warn('[AFO_RECONNECT] GAME not found after ' + timeout + 'ms timeout');
          resolve(false);
          return;
        }

        setTimeout(check, this.TIMING.GAME_READY_CHECK);
      };

      check();
    });
  },

  async waitForFullyLoggedIn(timeout = 60000) {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const check = () => {
        if (this.isFullyLoggedIn()) {
          resolve(true);
          return;
        }

        if (Date.now() - startTime > timeout) {
          resolve(false);
          return;
        }

        setTimeout(check, this.TIMING.GAME_READY_CHECK);
      };

      check();
    });
  },

  // ============================================
  // CREDENTIALS & STATE
  // ============================================

  /**
   * Check if there's a recently saved state (< 10 min) that implies we should reconnect.
   * Catches server restart redirects where disconnect monitor didn't save target in time.
   */
  async inferReconnectFromState() {
    if (typeof AFO_STORAGE === 'undefined') return false;

    try {
      const result = await AFO_STORAGE.get(null);
      const now = Date.now();
      const MAX_AGE = 10 * 60 * 1000; // 10 minutes

      for (const key in result) {
        if (!key.startsWith('gieniobot_state_s') || !result[key]?.savedAt) continue;
        if (now - result[key].savedAt < MAX_AGE) {
          const match = key.match(/gieniobot_state_s(\d+)/);
          if (match) {
            this.targetServer = parseInt(match[1]);
            this.targetCharId = result[key].charId || null;
            this.savedStateToRestore = result[key];
            console.log('[AFO_RECONNECT] Inferred reconnect from recent state (age:', Math.round((now - result[key].savedAt) / 1000), 's, server:', this.targetServer, ')');
            return true;
          }
        }
      }
    } catch (e) {
      console.error('[AFO_RECONNECT] inferReconnectFromState error:', e);
    }

    return false;
  },

  async getCredentials() {
    if (typeof AFO_CREDENTIALS === 'undefined') return null;

    // Credentials are global (one per account)
    return await AFO_CREDENTIALS.get();
  },

  async loadSavedState() {
    if (typeof AFO_STATE_MANAGER === 'undefined') {
      this.savedStateToRestore = null;
      return;
    }

    if (this.targetServer) {
      this.savedStateToRestore = await AFO_STATE_MANAGER.load(this.targetServer, this.targetCharId);
    }

    if (this.savedStateToRestore) {
      console.log('[AFO_RECONNECT] Loaded saved state from', new Date(this.savedStateToRestore.savedAt).toLocaleTimeString(),
        'server:', this.savedStateToRestore.server, 'char:', this.savedStateToRestore.charId);
      // Update targetCharId from saved state (state is per-server, charId stored inside)
      if (this.savedStateToRestore.charId && !this.targetCharId) {
        this.targetCharId = this.savedStateToRestore.charId;
      }
    }
  },

  async restoreState() {
    if (!this.savedStateToRestore) {
      console.log('[AFO_RECONNECT] No saved state to restore');
      return;
    }

    if (typeof AFO_STATE_MANAGER === 'undefined') {
      console.warn('[AFO_RECONNECT] State manager not available');
      return;
    }

    // Must be fully logged in with a real character before restoring (char_id > 0)
    if (!this.isFullyLoggedIn() || !(GAME.char_id > 0)) {
      console.warn('[AFO_RECONNECT] Not fully logged in (char_id > 0 required) - aborting restore. char_id:', typeof GAME !== 'undefined' ? GAME.char_id : 'GAME undefined');
      this.savedStateToRestore = null;
      return;
    }

    // Validate server/char/account match
    if (typeof GAME !== 'undefined') {
      const stateServer = this.savedStateToRestore.server;
      const stateChar = this.savedStateToRestore.charId;
      const stateLogin = this.savedStateToRestore.login;

      if (stateServer && GAME.server && stateServer != GAME.server) {
        console.warn('[AFO_RECONNECT] Server mismatch! State:', stateServer, 'Current:', GAME.server, '- aborting restore');
        this.savedStateToRestore = null;
        return;
      }

      if (stateChar && GAME.char_id && stateChar != GAME.char_id) {
        console.warn('[AFO_RECONNECT] Character mismatch! State:', stateChar, 'Current:', GAME.char_id, '- aborting restore');
        this.savedStateToRestore = null;
        return;
      }

      // Account cross-check (wrong-account glitch): never restore onto a different account
      if (stateLogin && GAME.login && String(stateLogin).toLowerCase() !== String(GAME.login).toLowerCase()) {
        console.warn('[AFO_RECONNECT] Account mismatch! State login:', stateLogin, 'Current:', GAME.login, '- aborting restore');
        this.savedStateToRestore = null;
        return;
      }
    }

    // We're confirmed logged in on the correct account/char → clear the loop guard
    this.clearReconnectAttempts();

    console.log('[AFO_RECONNECT] Waiting for scripts to load...');
    await this.sleep(this.TIMING.SCRIPTS_LOAD_WAIT);

    // Show cancellable progress bar (10 seconds)
    console.log('[AFO_RECONNECT] Showing cancel bar for 10s...');
    const cancelled = await this.showRestoreCountdown(10);

    if (cancelled) {
      console.log('[AFO_RECONNECT] ❌ State restore cancelled by user');
      this._hideStatus();
      if (typeof AFO_RECONNECT_UI !== 'undefined') {
        AFO_RECONNECT_UI.showToast('Przywracanie stanu anulowane', 'warning');
      }
      this.savedStateToRestore = null;
      return;
    }

    this._showStatus('Przywracam zapisany stan modułów...');

    const success = AFO_STATE_MANAGER.deserialize(this.savedStateToRestore, true);

    if (success) {
      this._showStatus('✅ Stan przywrócony — reconnect zakończony'); // auto-hides after 12s

      // Add to history
      if (typeof AFO_RECONNECT_UI !== 'undefined') {
        AFO_RECONNECT_UI.addReconnectTimestamp(Date.now());
      }
    } else {
      console.warn('[AFO_RECONNECT] Failed to restore state');
    }

    this.savedStateToRestore = null;
  },

  /**
   * Show a countdown progress bar with cancel button.
   * Returns true if cancelled, false if countdown completed.
   */
  showRestoreCountdown(seconds) {
    return new Promise((resolve) => {
      const container = document.createElement('div');
      container.id = 'afo-restore-countdown';
      container.innerHTML = `
        <div style="
          position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(145deg, #1a1a2e, #16213e);
          border: 1px solid #0f3460; border-radius: 12px; padding: 16px 24px;
          z-index: 10001; min-width: 300px; max-width: 90vw;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5); color: #fff;
          animation: toastIn 0.3s ease;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 14px; font-weight: 600;">🔄 Przywracanie stanu za <span id="afo-countdown-sec">${seconds}</span>s...</span>
            <button id="afo-countdown-cancel" style="
              background: rgba(244,67,54,0.2); color: #f44336; border: 1px solid rgba(244,67,54,0.3);
              border-radius: 6px; padding: 6px 16px; cursor: pointer; font-size: 13px; font-weight: 600;
            ">Anuluj</button>
          </div>
          <div style="background: rgba(255,255,255,0.1); border-radius: 4px; height: 6px; overflow: hidden;">
            <div id="afo-countdown-bar" style="
              height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A);
              width: 0%; transition: width 1s linear; border-radius: 4px;
            "></div>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      let remaining = seconds;
      const bar = document.getElementById('afo-countdown-bar');
      const secEl = document.getElementById('afo-countdown-sec');
      const cancelBtn = document.getElementById('afo-countdown-cancel');

      let cancelled = false;

      // Start progress
      requestAnimationFrame(() => {
        bar.style.width = `${100 / seconds}%`;
      });

      const interval = setInterval(() => {
        remaining--;
        if (secEl) secEl.textContent = remaining;
        bar.style.width = `${((seconds - remaining) / seconds) * 100}%`;

        if (remaining <= 0) {
          clearInterval(interval);
          container.remove();
          if (!cancelled) resolve(false);
        }
      }, 1000);

      cancelBtn.addEventListener('click', () => {
        cancelled = true;
        clearInterval(interval);
        container.remove();
        resolve(true);
      });
    });
  },

  async saveReconnectTarget() {
    if (typeof AFO_STORAGE === 'undefined') return;

    // Get server/char from GAME (current session) or from target fields
    const server = (typeof GAME !== 'undefined' && GAME.server) ? GAME.server : this.targetServer;
    const charId = (typeof GAME !== 'undefined' && GAME.char_id) ? GAME.char_id : this.targetCharId;

    if (!server) {
      console.warn('[AFO_RECONNECT] No server info available for reconnect target');
      return;
    }

    try {
      await AFO_STORAGE.set({
        'afo_reconnect_target': {
          server: server,
          charId: charId,
          savedAt: Date.now()
        }
      });
      console.log('[AFO_RECONNECT] Saved reconnect target:', server, charId);
    } catch (e) {
      console.error('[AFO_RECONNECT] Error saving reconnect target:', e);
    }
  },

  // ============================================
  // UTILITY
  // ============================================

  /**
   * On-screen reconnect status banner — visible WITHOUT devtools/eruda.
   * Critical for mobile debugging: eruda's console button disappears across the
   * server-restart navigation chain, so this banner is the only way for the user
   * to see (and report) where the flow is / where it got stuck. Recreated on each
   * page load; persists until the next navigation.
   */
  _showStatus(text) {
    try {
      console.log('[AFO_RECONNECT] ' + text);
      if (typeof document === 'undefined') return;
      const host = document.body || document.documentElement;
      if (!host) return;
      let el = document.getElementById('afo-reconnect-status');
      if (!el) {
        el = document.createElement('div');
        el.id = 'afo-reconnect-status';
        // Bottom-center pill (above the 🐛 icon) so it never covers the game topbar.
        el.style.cssText = 'position:fixed;bottom:64px;left:50%;transform:translateX(-50%);' +
          'z-index:2147483644;max-width:92vw;background:rgba(15,52,96,0.96);color:#fff;' +
          'font:12px/1.4 monospace;padding:8px 14px;border-radius:10px;text-align:center;' +
          'pointer-events:none;white-space:pre-wrap;box-shadow:0 4px 16px rgba(0,0,0,0.5);';
        host.appendChild(el);
      }
      const t = new Date().toLocaleTimeString('pl-PL', { hour12: false });
      el.textContent = '🔄 Reconnect [' + t + ']: ' + text;
      // Mark that a reconnect is ACTIVE right now. DevConsole uses this to decide
      // whether a page load is a reconnect continuation (keep logs) or a fresh
      // manual reload/reopen (clear logs). Fire-and-forget; refreshed every step.
      try { if (typeof AFO_STORAGE !== 'undefined') AFO_STORAGE.set({ afo_reconnect_nav: Date.now() }); } catch (e) { }
      // Auto-hide: (re)arm a timer on every update so the banner never lingers.
      if (this._statusHideTimer) clearTimeout(this._statusHideTimer);
      this._statusHideTimer = setTimeout(() => this._hideStatus(), 12000);
    } catch (e) { /* never let status UI break the flow */ }
  },

  _hideStatus() {
    try {
      if (this._statusHideTimer) { clearTimeout(this._statusHideTimer); this._statusHideTimer = null; }
      const el = document.getElementById('afo-reconnect-status');
      if (el) el.remove();
    } catch (e) { /* ignore */ }
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Export
window.AFO_RECONNECT = AFO_RECONNECT;
console.log('[AFO] Reconnect module loaded');
