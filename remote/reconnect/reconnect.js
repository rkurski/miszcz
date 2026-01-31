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

    // MAIN PAGE: Auto-login ONLY when reconnecting after disconnect
    if (this.isMainPage) {
      if (this.isReconnecting) {
        console.log('[AFO_RECONNECT] On main page, reconnect mode - initiating login...');
        await this.handleMainPage(creds);
      } else {
        console.log('[AFO_RECONNECT] On main page, normal mode - not auto-logging in');
      }
    }

    // SERVER PAGE: Always handle (monitor + auto-select if saved state exists)
    if (this.isServerPage) {
      await this.handleServerPage(creds);
    }
  },

  async loadReconnectTarget() {
    if (typeof AFO_STORAGE === 'undefined') return;

    try {
      const result = await AFO_STORAGE.get('afo_reconnect_target');
      const target = result['afo_reconnect_target'];

      if (target && target.server && target.charId) {
        this.targetServer = parseInt(target.server);
        this.targetCharId = parseInt(target.charId);
        this.isReconnecting = true;
        console.log('[AFO_RECONNECT] Loaded reconnect target (reconnect mode):', this.targetServer, this.targetCharId);

        // Clear target immediately so it doesn't trigger again on next page load
        await AFO_STORAGE.remove('afo_reconnect_target');
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
      console.log('[AFO_RECONNECT] Waiting before auto-login (giving user time to react)...');
      await this.sleep(this.TIMING.LOGIN_PAGE_DELAY);

      // Check if we need to login (show credentials form)
      if (this.needsCredentialsLogin()) {
        console.log('[AFO_RECONNECT] Filling credentials...');
        await this.fillCredentials(creds);
        await this.sleep(this.TIMING.LOGIN_SUBMIT_WAIT);
      }

      // Check if we need to select server
      if (this.needsServerSelect() && this.targetServer) {
        console.log('[AFO_RECONNECT] Selecting server', this.targetServer);
        await this.selectServer(this.targetServer);
        // After server select, page will redirect to server page
        return;
      }

      // If neither form is visible, we might already be on the way
      console.log('[AFO_RECONNECT] Waiting for redirect...');

    } catch (error) {
      console.error('[AFO_RECONNECT] Main page error:', error);
    } finally {
      this.isProcessing = false;
    }
  },

  // ============================================
  // SERVER PAGE HANDLER  
  // ============================================

  async handleServerPage(creds) {
    console.log('[AFO_RECONNECT] Handling server page... (reconnecting:', this.isReconnecting, ')');

    // Start disconnect monitor immediately (always, regardless of reconnect mode)
    this.startDisconnectMonitor();

    // Wait for GAME to be available
    await this.waitForGame(10000);

    // Check if disconnected
    if (this.isDisconnected()) {
      if (this.isReconnecting) {
        console.log('[AFO_RECONNECT] Disconnected on server page, redirecting...');
        await this.saveReconnectTarget();
        window.location.href = 'https://kosmiczni.pl/';
      } else {
        console.log('[AFO_RECONNECT] Disconnected, but not in reconnect mode - monitor will handle it');
      }
      return;
    }

    // Check if on character select
    if (this.isCharacterSelectScreen()) {
      // Auto-select only if we have saved state AND we're on the correct server
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
      console.log('[AFO_RECONNECT] On character select, waiting', this.TIMING.CHAR_SELECT_DELAY, 'ms before auto-selecting (saved state exists for char', this.targetCharId, ')...');
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

      // Still on char select - auto-select the target character
      if (this.isCharacterSelectScreen()) {
        console.log('[AFO_RECONNECT] Auto-selecting character', this.targetCharId);
        await this.selectCharacter(this.targetCharId);
        await this.waitForFullyLoggedIn();

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
      console.log('[AFO_RECONNECT] Already logged in');
      if (this.savedStateToRestore) {
        // Validate server/char match before restoring
        if (GAME.char_id == this.targetCharId && GAME.server == this.targetServer) {
          await this.restoreState();
        } else {
          console.log('[AFO_RECONNECT] Logged in but server/char mismatch - skipping restore. Current:', GAME.server + '/' + GAME.char_id, 'Target:', this.targetServer + '/' + this.targetCharId);
          this.savedStateToRestore = null;
        }
      }
      return;
    }

    // Otherwise wait and check again
    console.log('[AFO_RECONNECT] Waiting for game state...');
    await this.sleep(2000);
    await this.handleServerPage(creds);
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

    setInterval(() => {
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
    console.log('[AFO_RECONNECT] Saving target and redirecting to main page in 1.5s...');
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

    if (!serverSelect) {
      console.log('[AFO_RECONNECT] Server select not found');
      return;
    }

    serverSelect.value = server.toString();
    serverSelect.dispatchEvent(new Event('change', { bubbles: true }));

    console.log('[AFO_RECONNECT] Selected server', server, ', submitting...');

    await this.sleep(this.TIMING.SERVER_SELECT_WAIT);

    if (loginButton) {
      loginButton.click();
    }
  },

  async selectCharacter(charId) {
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
    if (typeof GAME === 'undefined') return true;
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

  // ============================================
  // WAITING HELPERS
  // ============================================

  async waitForGame(timeout = 60000) {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const check = () => {
        if (typeof GAME !== 'undefined') {
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

    // Validate server/char match
    if (typeof GAME !== 'undefined') {
      const stateServer = this.savedStateToRestore.server;
      const stateChar = this.savedStateToRestore.charId;

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
    }

    console.log('[AFO_RECONNECT] Waiting for scripts to load...');
    await this.sleep(this.TIMING.SCRIPTS_LOAD_WAIT);

    console.log('[AFO_RECONNECT] Restoring saved state...');

    const success = AFO_STATE_MANAGER.deserialize(this.savedStateToRestore, true);

    if (success) {
      console.log('[AFO_RECONNECT] ✅ State restored successfully!');
      if (typeof AFO_RECONNECT_UI !== 'undefined') {
        AFO_RECONNECT_UI.showToast('Stan przywrócony!', 'success');
      }
    } else {
      console.warn('[AFO_RECONNECT] Failed to restore state');
    }

    this.savedStateToRestore = null;
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Export
window.AFO_RECONNECT = AFO_RECONNECT;
console.log('[AFO] Reconnect module loaded');
