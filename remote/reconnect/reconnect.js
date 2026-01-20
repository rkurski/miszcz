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
    SERVER_SELECT_WAIT: 1500,     // Wait after selecting server
    CHAR_SELECT_WAIT: 2500,       // Wait after selecting character
    SCRIPTS_LOAD_WAIT: 5000,      // Wait for Gieniobot scripts to load
    GAME_READY_CHECK: 500,        // How often to check if GAME is ready
    MAX_WAIT: 60000,              // Max time to wait for any operation
    RETRY_DELAY: 3000             // Delay between retries
  },

  // State
  isInitialized: false,
  isProcessing: false,
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

    // Load target from session storage (if redirected)
    this.loadTargetFromSession();

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

    // Store target
    this.targetServer = creds.server;
    this.targetCharId = creds.charId;

    // Load saved state
    await this.loadSavedState();

    // MAIN PAGE: Try to login immediately
    if (this.isMainPage) {
      console.log('[AFO_RECONNECT] On main page, initiating login...');
      await this.handleMainPage(creds);
    }

    // SERVER PAGE: Check if logged in, if not redirect to main
    if (this.isServerPage) {
      await this.handleServerPage(creds);
    }
  },

  loadTargetFromSession() {
    const server = sessionStorage.getItem('afo_target_server');
    const charId = sessionStorage.getItem('afo_target_char');

    if (server && charId) {
      this.targetServer = parseInt(server);
      this.targetCharId = parseInt(charId);
      console.log('[AFO_RECONNECT] Loaded target from session:', this.targetServer, this.targetCharId);

      // Clear session
      sessionStorage.removeItem('afo_target_server');
      sessionStorage.removeItem('afo_target_char');
    }
  },

  // ============================================
  // MAIN PAGE HANDLER
  // ============================================

  async handleMainPage(creds) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Wait for page to be ready
      await this.sleep(1000);

      // Check if we need to login (show credentials form)
      if (this.needsCredentialsLogin()) {
        console.log('[AFO_RECONNECT] Filling credentials...');
        await this.fillCredentials(creds);
        await this.sleep(this.TIMING.LOGIN_SUBMIT_WAIT);
      }

      // Check if we need to select server
      if (this.needsServerSelect()) {
        console.log('[AFO_RECONNECT] Selecting server', creds.server);
        await this.selectServer(creds.server);
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
    console.log('[AFO_RECONNECT] Handling server page...');

    // Start disconnect monitor immediately
    this.startDisconnectMonitor();

    // Wait for GAME to be available
    await this.waitForGame(10000);

    // Check if disconnected
    if (this.isDisconnected()) {
      console.log('[AFO_RECONNECT] Disconnected on server page, redirecting...');
      this.saveTargetToSession(creds);
      window.location.href = 'https://kosmiczni.pl/';
      return;
    }

    // Check if on character select
    if (this.isCharacterSelectScreen()) {
      console.log('[AFO_RECONNECT] On character select, selecting character...');
      await this.selectCharacter(creds.charId);
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

    // Check if fully logged in
    if (this.isFullyLoggedIn()) {
      console.log('[AFO_RECONNECT] Already logged in');
      // Check if we should restore state
      if (this.savedStateToRestore) {
        await this.restoreState();
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
    this.saveTargetToSession(creds);

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

    if (this.targetServer && this.targetCharId) {
      const creds = await AFO_CREDENTIALS.get(this.targetServer, this.targetCharId);
      if (creds) return creds;
    }

    const allCreds = await AFO_CREDENTIALS.getAll();
    if (allCreds.length > 0) {
      return await AFO_CREDENTIALS.get(allCreds[0].server, allCreds[0].charId);
    }

    return null;
  },

  async loadSavedState() {
    if (typeof AFO_STATE_MANAGER === 'undefined') {
      this.savedStateToRestore = null;
      return;
    }

    if (this.targetServer && this.targetCharId) {
      this.savedStateToRestore = await AFO_STATE_MANAGER.load(this.targetServer, this.targetCharId);
    }

    if (this.savedStateToRestore) {
      console.log('[AFO_RECONNECT] Loaded saved state from', new Date(this.savedStateToRestore.savedAt).toLocaleTimeString());
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

  saveTargetToSession(creds) {
    sessionStorage.setItem('afo_target_server', creds.server.toString());
    sessionStorage.setItem('afo_target_char', creds.charId.toString());
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
