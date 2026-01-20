/**
 * ============================================================================
 * AFO - Reconnect UI
 * ============================================================================
 * 
 * UI components for auto-reconnect feature:
 * - Status icon in top-right corner
 * - Dropdown menu with state info
 * - Credentials form
 * 
 * Mobile-friendly design.
 * 
 * ============================================================================
 */

const AFO_RECONNECT_UI = {
  // State
  isMenuOpen: false,
  currentStatus: 'neutral', // 'neutral', 'saved', 'error', 'unsaved'
  lastSaveTime: null,

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    this.injectCSS();
    this.injectIcon();
    this.injectMenu();
    this.bindEvents();
    this.updateStatusFromStorage();
    console.log('[AFO_RECONNECT_UI] Initialized');
  },

  // ============================================
  // CSS INJECTION
  // ============================================

  injectCSS() {
    const css = `
      /* Reconnect Icon */
      #afo-reconnect-icon {
        position: fixed;
        top: 10px;
        right: 10px;
        width: 40px;
        height: 40px;
        cursor: pointer;
        z-index: 9999;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.7);
        padding: 6px;
        box-sizing: border-box;
        transition: all 0.3s ease;
        border: 2px solid transparent;
      }

      #afo-reconnect-icon:hover {
        transform: scale(1.1);
        background: rgba(0, 0, 0, 0.9);
      }

      #afo-reconnect-icon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      /* Status colors via border */
      #afo-reconnect-icon.status-neutral {
        border-color: #888;
      }

      #afo-reconnect-icon.status-saved {
        border-color: #4CAF50;
        box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
      }

      #afo-reconnect-icon.status-unsaved {
        border-color: #FFC107;
      }

      #afo-reconnect-icon.status-error {
        border-color: #f44336;
        animation: pulse-error 2s infinite;
      }

      @keyframes pulse-error {
        0%, 100% { box-shadow: 0 0 5px rgba(244, 67, 54, 0.5); }
        50% { box-shadow: 0 0 15px rgba(244, 67, 54, 0.8); }
      }

      /* Menu Overlay */
      #afo-reconnect-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9998;
      }

      #afo-reconnect-overlay.open {
        display: block;
      }

      /* Menu Panel */
      #afo-reconnect-menu {
        display: none;
        position: fixed;
        top: 60px;
        right: 10px;
        width: 320px;
        max-width: calc(100vw - 20px);
        max-height: calc(100vh - 80px);
        background: linear-gradient(145deg, #1a1a2e, #16213e);
        border: 1px solid #0f3460;
        border-radius: 12px;
        z-index: 10000;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      #afo-reconnect-menu.open {
        display: flex;
        flex-direction: column;
        animation: slideIn 0.2s ease;
      }

      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Menu Header */
      .afo-menu-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        background: linear-gradient(90deg, #0f3460, #1a1a2e);
        border-bottom: 1px solid #0f3460;
      }

      .afo-menu-header h3 {
        margin: 0;
        font-size: 16px;
        color: #e94560;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .afo-menu-close {
        width: 28px;
        height: 28px;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }

      .afo-menu-close:hover {
        background: rgba(233, 69, 96, 0.5);
      }

      /* Menu Content */
      .afo-menu-content {
        padding: 15px;
        overflow-y: auto;
        flex: 1;
      }

      /* Status Section */
      .afo-status-section {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 15px;
      }

      .afo-status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .afo-status-row:last-child {
        margin-bottom: 0;
      }

      .afo-status-label {
        color: #888;
        font-size: 13px;
      }

      .afo-status-value {
        font-size: 13px;
        font-weight: 600;
      }

      .afo-status-value.saved { color: #4CAF50; }
      .afo-status-value.unsaved { color: #FFC107; }
      .afo-status-value.error { color: #f44336; }
      .afo-status-value.neutral { color: #888; }

      /* Modules List */
      .afo-modules-section {
        margin-bottom: 15px;
      }

      .afo-modules-title {
        color: #e94560;
        font-size: 12px;
        text-transform: uppercase;
        margin-bottom: 10px;
        letter-spacing: 1px;
      }

      .afo-module-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        margin-bottom: 6px;
        font-size: 13px;
        color: #ccc;
      }

      .afo-module-item .icon {
        font-size: 16px;
      }

      .afo-module-item.active {
        background: rgba(76, 175, 80, 0.2);
        border-left: 3px solid #4CAF50;
      }

      .afo-module-item.inactive {
        opacity: 0.6;
      }

      .afo-module-item .info {
        font-size: 11px;
        color: #888;
        margin-left: auto;
      }

      /* Buttons */
      .afo-buttons-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .afo-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 16px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .afo-btn-primary {
        background: linear-gradient(135deg, #e94560, #ff6b6b);
        color: white;
      }

      .afo-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(233, 69, 96, 0.4);
      }

      .afo-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #ccc;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .afo-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .afo-btn-danger {
        background: rgba(244, 67, 54, 0.2);
        color: #f44336;
        border: 1px solid rgba(244, 67, 54, 0.3);
      }

      .afo-btn-danger:hover {
        background: rgba(244, 67, 54, 0.3);
      }

      /* Credentials Form */
      .afo-creds-section {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 12px;
        margin-top: 15px;
        display: none;
      }

      .afo-creds-section.open {
        display: block;
      }

      .afo-creds-title {
        color: #e94560;
        font-size: 12px;
        text-transform: uppercase;
        margin-bottom: 10px;
        letter-spacing: 1px;
      }

      .afo-input-group {
        margin-bottom: 12px;
      }

      .afo-input-group label {
        display: block;
        color: #888;
        font-size: 12px;
        margin-bottom: 5px;
      }

      .afo-input-group input {
        width: 100%;
        padding: 10px 12px;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        box-sizing: border-box;
      }

      .afo-input-group input:focus {
        outline: none;
        border-color: #e94560;
      }

      .afo-creds-info {
        font-size: 11px;
        color: #666;
        margin-top: 10px;
        line-height: 1.4;
      }

      /* Toast Notification */
      .afo-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: #1a1a2e;
        border: 1px solid #0f3460;
        border-radius: 8px;
        color: #fff;
        font-size: 14px;
        z-index: 10001;
        animation: toastIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .afo-toast.success { border-left: 4px solid #4CAF50; }
      .afo-toast.error { border-left: 4px solid #f44336; }
      .afo-toast.warning { border-left: 4px solid #FFC107; }

      @keyframes toastIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Mobile adjustments */
      @media (max-width: 480px) {
        #afo-reconnect-menu {
          right: 5px;
          left: 5px;
          width: auto;
          top: 55px;
        }

        #afo-reconnect-icon {
          width: 36px;
          height: 36px;
          top: 8px;
          right: 8px;
        }
      }
    `;

    const style = document.createElement('style');
    style.id = 'afo-reconnect-css';
    style.textContent = css;
    document.head.appendChild(style);
  },

  // ============================================
  // ICON
  // ============================================

  injectIcon() {
    // Get extension URL for image
    const configEl = document.getElementById('__gieniobot_config__');
    const extensionUrl = configEl ? configEl.dataset.extensionUrl : '';
    const imgSrc = extensionUrl ? `${extensionUrl}images/reconnect.png` : '';

    const icon = document.createElement('div');
    icon.id = 'afo-reconnect-icon';
    icon.className = 'status-neutral';
    icon.innerHTML = imgSrc
      ? `<img src="${imgSrc}" alt="Reconnect" title="Auto-Reconnect">`
      : '🔄';
    icon.title = 'Auto-Reconnect - Kliknij aby otworzyć menu';

    document.body.appendChild(icon);
  },

  // ============================================
  // MENU
  // ============================================

  injectMenu() {
    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'afo-reconnect-overlay';
    document.body.appendChild(overlay);

    // Menu
    const menu = document.createElement('div');
    menu.id = 'afo-reconnect-menu';
    menu.innerHTML = `
      <div class="afo-menu-header">
        <h3>🔄 Auto-Reconnect</h3>
        <button class="afo-menu-close" id="afo-menu-close">×</button>
      </div>
      <div class="afo-menu-content">
        <!-- Status -->
        <div class="afo-status-section">
          <div class="afo-status-row">
            <span class="afo-status-label">Status:</span>
            <span class="afo-status-value neutral" id="afo-status-text">Nie zapisano</span>
          </div>
          <div class="afo-status-row">
            <span class="afo-status-label">Ostatni zapis:</span>
            <span class="afo-status-value" id="afo-last-save">-</span>
          </div>
          <div class="afo-status-row">
            <span class="afo-status-label">Serwer / Postać:</span>
            <span class="afo-status-value" id="afo-server-char">-</span>
          </div>
        </div>

        <!-- Modules -->
        <div class="afo-modules-section">
          <div class="afo-modules-title">Zapisane moduły</div>
          <div id="afo-modules-list">
            <div class="afo-module-item inactive">
              <span class="icon">📭</span>
              Brak zapisanego stanu
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="afo-buttons-section">
          <button class="afo-btn afo-btn-primary" id="afo-btn-save">
            💾 Zapisz obecny stan
          </button>
          <button class="afo-btn afo-btn-secondary" id="afo-btn-credentials">
            👤 Zarządzaj credentials
          </button>
          <button class="afo-btn afo-btn-danger" id="afo-btn-clear">
            🗑️ Wyczyść zapisany stan
          </button>
        </div>

        <!-- Credentials Form -->
        <div class="afo-creds-section" id="afo-creds-section">
          <div class="afo-creds-title">Dane logowania</div>
          <div class="afo-input-group">
            <label for="afo-creds-login">Login</label>
            <input type="text" id="afo-creds-login" placeholder="Twój login">
          </div>
          <div class="afo-input-group">
            <label for="afo-creds-password">Hasło</label>
            <input type="password" id="afo-creds-password" placeholder="Twoje hasło">
          </div>
          <button class="afo-btn afo-btn-primary" id="afo-btn-save-creds" style="margin-top: 10px;">
            💾 Zapisz credentials
          </button>
          <div class="afo-creds-info">
            ⚠️ Dane są przechowywane lokalnie w przeglądarce. 
            Używane tylko do automatycznego logowania po rozłączeniu.
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(menu);
  },

  // ============================================
  // EVENTS
  // ============================================

  bindEvents() {
    // Icon click
    document.getElementById('afo-reconnect-icon').addEventListener('click', () => {
      this.toggleMenu();
    });

    // Close button
    document.getElementById('afo-menu-close').addEventListener('click', () => {
      this.closeMenu();
    });

    // Overlay click
    document.getElementById('afo-reconnect-overlay').addEventListener('click', () => {
      this.closeMenu();
    });

    // Save state button
    document.getElementById('afo-btn-save').addEventListener('click', async () => {
      await this.saveState();
    });

    // Credentials toggle
    document.getElementById('afo-btn-credentials').addEventListener('click', () => {
      this.toggleCredentialsForm();
    });

    // Save credentials button
    document.getElementById('afo-btn-save-creds').addEventListener('click', async () => {
      await this.saveCredentials();
    });

    // Clear button
    document.getElementById('afo-btn-clear').addEventListener('click', async () => {
      await this.clearState();
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMenu();
      }
    });
  },

  // ============================================
  // MENU TOGGLE
  // ============================================

  toggleMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  },

  openMenu() {
    this.isMenuOpen = true;
    document.getElementById('afo-reconnect-menu').classList.add('open');
    document.getElementById('afo-reconnect-overlay').classList.add('open');
    this.refreshMenuContent();
  },

  closeMenu() {
    this.isMenuOpen = false;
    document.getElementById('afo-reconnect-menu').classList.remove('open');
    document.getElementById('afo-reconnect-overlay').classList.remove('open');
    // Close credentials form
    document.getElementById('afo-creds-section').classList.remove('open');
  },

  toggleCredentialsForm() {
    const section = document.getElementById('afo-creds-section');
    section.classList.toggle('open');

    // Load existing credentials if available
    if (section.classList.contains('open')) {
      this.loadExistingCredentials();
    }
  },

  // ============================================
  // REFRESH MENU CONTENT
  // ============================================

  async refreshMenuContent() {
    // Server / Char info
    const serverChar = document.getElementById('afo-server-char');
    if (typeof GAME !== 'undefined' && GAME.server && GAME.char_id) {
      const charName = GAME.char_data?.name || `ID: ${GAME.char_id}`;
      serverChar.textContent = `S${GAME.server} / ${charName}`;
    } else {
      serverChar.textContent = '-';
    }

    // Load saved state
    await this.updateStatusFromStorage();
  },

  async updateStatusFromStorage() {
    if (typeof GAME === 'undefined' || !GAME.server || !GAME.char_id) {
      this.setStatus('neutral', 'Oczekiwanie na grę');
      return;
    }

    try {
      const state = await AFO_STATE_MANAGER.load(GAME.server, GAME.char_id);

      if (state) {
        this.lastSaveTime = state.savedAt;
        this.setStatus('saved', 'Zsynchronizowane');
        this.updateLastSaveTime(state.savedAt);
        this.updateModulesList(state);
      } else {
        this.setStatus('unsaved', 'Nie zapisano');
        this.updateLastSaveTime(null);
        this.updateModulesList(null);
      }
    } catch (e) {
      console.error('[AFO_RECONNECT_UI] Error loading state:', e);
      this.setStatus('error', 'Błąd');
    }
  },

  // ============================================
  // STATUS UPDATES
  // ============================================

  setStatus(status, text) {
    this.currentStatus = status;

    // Update icon
    const icon = document.getElementById('afo-reconnect-icon');
    icon.className = `status-${status}`;

    // Update status text in menu
    const statusText = document.getElementById('afo-status-text');
    if (statusText) {
      statusText.textContent = text;
      statusText.className = `afo-status-value ${status}`;
    }
  },

  updateLastSaveTime(timestamp) {
    const el = document.getElementById('afo-last-save');
    if (!el) return;

    if (timestamp) {
      const date = new Date(timestamp);
      el.textContent = date.toLocaleTimeString('pl-PL');
    } else {
      el.textContent = '-';
    }
  },

  updateModulesList(state) {
    const container = document.getElementById('afo-modules-list');
    if (!container) return;

    if (!state || !state.modules) {
      container.innerHTML = `
        <div class="afo-module-item inactive">
          <span class="icon">📭</span>
          Brak zapisanego stanu
        </div>
      `;
      return;
    }

    const modules = [
      { key: 'RESP', name: 'PVM', icon: '⚔️', stopKey: 'stop' },
      { key: 'PVP', name: 'PVP', icon: '🎯', stopKey: 'stop' },
      { key: 'LPVM', name: 'LPVM', icon: '📋', stopKey: 'Stop' },
      { key: 'GLEBIA', name: 'GŁĘBIA', icon: '🌊', stopKey: 'stop' },
      { key: 'CODE', name: 'KODY', icon: '📝', stopKey: 'stop' },
    ];

    let html = '';

    for (const mod of modules) {
      const modState = state.modules[mod.key];
      const isActive = modState && !modState[mod.stopKey];
      const activeClass = isActive ? 'active' : 'inactive';

      let info = '';
      if (isActive) {
        // Add extra info based on module
        if (mod.key === 'RESP' && modState.loc) {
          info = `loc: ${modState.loc}`;
        } else if (mod.key === 'CODE' && modState.what_to_train) {
          const stats = ['', 'Siła', 'Wyt.', 'Zręcz.', 'Energia'];
          info = stats[modState.what_to_train] || '';
        }
      }

      html += `
        <div class="afo-module-item ${activeClass}">
          <span class="icon">${mod.icon}</span>
          ${mod.name}
          ${info ? `<span class="info">${info}</span>` : ''}
        </div>
      `;
    }

    // Activities
    if (state.activities && state.activities.enabled) {
      html += `
        <div class="afo-module-item active">
          <span class="icon">🎮</span>
          Activities
          <span class="info">${state.activities.selectedActivities?.length || 0} aktywności</span>
        </div>
      `;
    }

    // kws automations
    if (state.kws) {
      if (state.kws.auto_arena) {
        html += `
          <div class="afo-module-item active">
            <span class="icon">🏆</span>
            Arena
          </div>
        `;
      }
      if (state.kws.autoExpeditions) {
        html += `
          <div class="afo-module-item active">
            <span class="icon">🚀</span>
            Expeditions
          </div>
        `;
      }
      if (state.kws.auto_abyss) {
        html += `
          <div class="afo-module-item active">
            <span class="icon">🌀</span>
            Otchłań
          </div>
        `;
      }
    }

    container.innerHTML = html || `
      <div class="afo-module-item inactive">
        <span class="icon">😴</span>
        Żadne moduły nieaktywne
      </div>
    `;
  },

  // ============================================
  // ACTIONS
  // ============================================

  async saveState() {
    try {
      const success = await AFO_STATE_MANAGER.save();

      if (success) {
        this.showToast('Stan zapisany pomyślnie!', 'success');
        await this.updateStatusFromStorage();
      } else {
        this.showToast('Nie udało się zapisać stanu', 'error');
        this.setStatus('error', 'Błąd zapisu');
      }
    } catch (e) {
      console.error('[AFO_RECONNECT_UI] Save error:', e);
      this.showToast('Błąd: ' + e.message, 'error');
    }
  },

  async clearState() {
    if (!confirm('Czy na pewno chcesz wyczyścić zapisany stan?')) {
      return;
    }

    try {
      const success = await AFO_STATE_MANAGER.clearCurrent();

      if (success) {
        this.showToast('Stan wyczyszczony', 'success');
        await this.updateStatusFromStorage();
      } else {
        this.showToast('Nie udało się wyczyścić stanu', 'error');
      }
    } catch (e) {
      console.error('[AFO_RECONNECT_UI] Clear error:', e);
      this.showToast('Błąd: ' + e.message, 'error');
    }
  },

  async loadExistingCredentials() {
    try {
      const creds = await AFO_CREDENTIALS.getCurrent();

      if (creds) {
        document.getElementById('afo-creds-login').value = creds.login || '';
        document.getElementById('afo-creds-password').value = creds.password || '';
      } else {
        // Try to get login from GAME
        if (typeof GAME !== 'undefined' && GAME.login) {
          document.getElementById('afo-creds-login').value = GAME.login;
        }
      }
    } catch (e) {
      console.error('[AFO_RECONNECT_UI] Load credentials error:', e);
    }
  },

  async saveCredentials() {
    const login = document.getElementById('afo-creds-login').value.trim();
    const password = document.getElementById('afo-creds-password').value;

    if (!login || !password) {
      this.showToast('Wpisz login i hasło', 'warning');
      return;
    }

    try {
      const success = await AFO_CREDENTIALS.saveCurrent(login, password);

      if (success) {
        this.showToast('Credentials zapisane!', 'success');
        document.getElementById('afo-creds-section').classList.remove('open');
      } else {
        this.showToast('Nie udało się zapisać credentials', 'error');
      }
    } catch (e) {
      console.error('[AFO_RECONNECT_UI] Save credentials error:', e);
      this.showToast('Błąd: ' + e.message, 'error');
    }
  },

  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================

  showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.afo-toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `afo-toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 3s
    setTimeout(() => {
      toast.style.animation = 'toastIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// Export
window.AFO_RECONNECT_UI = AFO_RECONNECT_UI;
console.log('[AFO] Reconnect UI module loaded');
