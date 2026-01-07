/**
 * ============================================================================
 * AFO - Daily Quests Automation Module
 * ============================================================================
 * 
 * Automatyczne wykonywanie misji dziennych.
 * Obsługuje: normalne lokacje, prywatną planetę, klanową, imperia, portale.
 * 
 * ============================================================================
 */

const AFO_DAILY = {

  // ============================================
  // STATE (local to this module)
  // ============================================

  Finder: null,               // EasyStar instance for pathfinding
  dataLoaded: false,

  // Stuck detection state
  _lastProgress: 0,
  _lastProgressTime: 0,
  _stuckAttempts: 0,

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    this.loadEasyStar();
    this.bindSocketHandler();
    this.injectCSS();
    console.log('[AFO_DAILY] Module initialized');
  },

  loadEasyStar() {
    // Reuse EasyStar if already loaded by other modules
    if (typeof EasyStar !== 'undefined') {
      this.Finder = new EasyStar.js();
      this.Finder.enableDiagonals();
      this.Finder.setAcceptableTiles([1]);
      console.log('[AFO_DAILY] EasyStar reused');
      return;
    }

    let esjs = document.createElement('script');
    esjs.src = 'https://cdn.jsdelivr.net/npm/easystarjs@0.4.3/bin/easystar-0.4.3.min.js';
    esjs.onload = () => {
      this.Finder = new EasyStar.js();
      this.Finder.enableDiagonals();
      this.Finder.setAcceptableTiles([1]);
      console.log('[AFO_DAILY] EasyStar loaded');
    };
    document.head.append(esjs);
  },

  bindSocketHandler() {
    GAME.socket.on('gr', (msg) => {
      if (!DAILY.stop) {
        this.handleSockets(msg);
      }
    });
  },

  injectCSS() {
    const css = `
      #daily_Panel {
        background: rgba(0,0,0,0.9);
        position: fixed;
        top: 450px;
        left: 65%;
        z-index: 9999;
        width: 320px;
        padding: 1px;
        border-radius: 5px;
        border-style: solid;
        border-width: 7px 8px 7px 7px;
        display: none;
        user-select: none;
        color: #333333;
        max-height: 500px;
      }
      #daily_Panel .sekcja {
        position: absolute;
        top: -27px;
        left: -7px;
        background: rgba(0,0,0,0.9);
        filter: hue-rotate(196deg);
        background-size: 100% 100%;
        width: 320px;
        cursor: all-scroll;
      }
      #daily_Panel .daily_button {
        cursor: pointer;
        text-align: center;
        border-bottom: solid gray 1px;
        color: white;
        padding: 3px;
      }
      #daily_Panel .daily_quest_list {
        max-height: 300px;
        overflow-y: auto;
        padding: 5px;
      }
      #daily_Panel .daily_quest_item {
        display: flex;
        align-items: center;
        padding: 3px 5px;
        color: white;
        border-bottom: 1px solid #333;
        font-size: 12px;
      }
      #daily_Panel .daily_quest_item.completed {
        text-decoration: line-through;
        opacity: 0.5;
      }
      #daily_Panel .daily_quest_item.skipped {
        color: #ff9800;
        text-decoration: line-through;
        opacity: 0.7;
      }
      #daily_Panel .daily_quest_item.current {
        background: rgba(255, 215, 0, 0.2);
      }
      #daily_Panel .daily_quest_item input[type="checkbox"] {
        margin-right: 8px;
      }
      #daily_Panel .daily_quest_item .quest_name {
        flex: 1;
      }
      #daily_Panel .daily_quest_item .quest_loc {
        color: #888;
        font-size: 10px;
      }
      #daily_Panel .daily_controls {
        display: flex;
        justify-content: center;
        gap: 10px;
        padding: 10px;
      }
      #daily_Panel .daily_controls button {
        min-width: 80px;
      }
      #daily_Panel .daily_controls button.hidden {
        display: none;
      }
      #daily_Panel .daily_status {
        text-align: center;
        color: #ffd700;
        padding: 5px;
        font-size: 11px;
      }
      #daily_Panel .daily_options {
        padding: 5px 10px;
        border-top: 1px solid #333;
      }
      #daily_Panel .daily_options label {
        color: white;
        font-size: 11px;
        margin-right: 10px;
      }
      #daily_Panel .daily_options select {
        background: #333;
        color: white;
        border: none;
        padding: 2px;
        font-size: 11px;
      }
      #daily_Panel .daily_quest_item.premium {
        background: linear-gradient(90deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%);
        border-left: 3px solid #ffd700;
      }
      #daily_Panel .daily_quest_item.premium .quest_name {
        color: #ffd700;
        font-weight: bold;
      }
      #daily_Panel .daily_quest_item.waiting {
        background: linear-gradient(90deg, rgba(100,149,237,0.15) 0%, rgba(100,149,237,0.05) 100%);
        border-left: 3px solid #6495ed;
      }
      #daily_Panel .daily_quest_item.waiting .quest_name {
        color: #6495ed;
      }
      #daily_Panel .daily_quest_item .quest_timer {
        color: #6495ed;
        font-size: 10px;
        margin-left: 5px;
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      #daily_Panel .daily_options input[type="checkbox"] {
        margin-right: 4px;
      }
      /* Quest icon sprites */
      #daily_Panel .quest_icon {
        width: 18px;
        height: 18px;
        margin-right: 5px;
        flex-shrink: 0;
        display: inline-block;
        background-image: url('${getGieniobotUrl('images/daily.png')}');
        background-repeat: no-repeat;
        vertical-align: middle;
      }
      #daily_Panel .quest_icon.icon-action { background-position: -10px -10px; }
      #daily_Panel .quest_icon.icon-certyfikat { background-position: -48px -10px; }
      #daily_Panel .quest_icon.icon-kk { background-position: -10px -48px; }
      #daily_Panel .quest_icon.icon-kp { background-position: -48px -48px; }
      #daily_Panel .quest_icon.icon-lpvm { background-position: -86px -10px; }
      #daily_Panel .quest_icon.icon-pvm { background-position: -86px -48px; }
      #daily_Panel .quest_icon.icon-pvp { background-position: -10px -86px; }
      #daily_Panel .quest_icon.icon-resource { background-position: -48px -86px; }
      #daily_Panel .quest_icon.icon-smoczy-token { background-position: -86px -86px; }
      #daily_Panel .quest_icon.icon-wyprawy { background-position: -124px -86px; width: 12px; height: 12px; }
      #daily_Panel .quest_icon.icon-zegarek { background-position: -124px -10px; }
      #daily_Panel .quest_icon.icon-zeni { background-position: -124px -48px; }
    `;

    if (!document.getElementById('daily_quests_css')) {
      const style = document.createElement('style');
      style.id = 'daily_quests_css';
      style.textContent = css;
      document.head.appendChild(style);
    }
  },

  // ============================================
  // TELEPORT LOCATIONS
  // ============================================

  /**
   * Request teleport locations list from server
   * Uses same method as ballSearcher: a:19, type:1
   */
  requestTeleportLocs() {
    GAME.emitOrder({ a: 19, type: 1 });
    console.log('[AFO_DAILY] Requested teleport locations from server');
  },

  /**
   * Get teleport locations from #tp_list DOM (populated by a:19, type:1)
   * Returns array of {id, name, reborn}
   */
  getTeleportLocsFromDOM() {
    const currentReborn = GAME.char_data?.reborn || 0;
    const list = document.querySelector('#tp_list');
    const locs = [];

    if (!list) {
      console.log('[AFO_DAILY] #tp_list not found');
      return locs;
    }

    const items = list.querySelectorAll('[data-loc]');
    items.forEach(item => {
      const locId = item.getAttribute('data-loc');
      const rebornVal = item.getAttribute('data-reborn');
      const locName = item.textContent.trim() || `Lokacja ${locId}`;

      // Only locations for current reborn
      if (locId && /^\d{1,4}$/.test(locId) && parseInt(rebornVal) === currentReborn) {
        locs.push({
          id: parseInt(locId),
          name: locName,
          reborn: parseInt(rebornVal)
        });
      }
    });

    return locs.reverse(); // Oldest first
  },

  /**
   * Get teleport locations options for dropdown
   */
  getTeleportLocationsOptions() {
    const currentBorn = GAME.char_data?.reborn || 0;
    let options = '<option value="current">Obecna lokacja</option>';

    // Add private planet if available
    if (GAME.quick_opts && GAME.quick_opts.private_planet) {
      options += '<option value="private">Prywatna planeta</option>';
    }

    // Get teleport locations from DOM
    const locs = this.getTeleportLocsFromDOM();

    if (locs.length > 0) {
      // Get default location for current born from config
      const defaultLocId = DAILY.config?.defaultCombatLocByBorn?.[currentBorn];

      locs.forEach(loc => {
        const selected = (defaultLocId && loc.id == defaultLocId) ? ' selected' : '';
        options += `<option value="${loc.id}"${selected}>${loc.name}</option>`;
      });
    }

    return options;
  },

  /**
   * Refresh the combat location dropdown with current locations
   */
  refreshCombatLocDropdown() {
    const $select = $('#daily_combat_loc');
    if ($select.length > 0) {
      const currentVal = $select.val();
      $select.html(this.getTeleportLocationsOptions());
      // Try to restore previous selection
      if (currentVal && $select.find(`option[value="${currentVal}"]`).length > 0) {
        $select.val(currentVal);
      }
      console.log('[AFO_DAILY] Combat location dropdown refreshed');
    }
  },

  // ============================================
  // QUEST AVAILABILITY CHECK
  // ============================================

  /**
   * Check if player has access to quest location
   * Hide quests for private planet/clan/empire if player doesn't have them
   */
  isQuestAvailable(quest) {
    if (quest.locationType === 'private_planet') {
      return !!(GAME.quick_opts && GAME.quick_opts.private_planet);
    }
    if (quest.locationType === 'clan_planet') {
      // Check if player is in a clan
      return !!(GAME.char_data && GAME.quick_opts.clan_planet);
    }
    if (quest.locationType === 'empire_hq') {
      return !!(GAME.quick_opts && GAME.quick_opts.empire);
    }
    return true;
  },

  // ============================================
  // DATA LOADING
  // ============================================

  async loadQuestData() {
    if (this.dataLoaded) return true;

    try {
      const configEl = document.getElementById('__gieniobot_config__');
      const devMode = typeof GIENIOBOT_DEV_MODE !== 'undefined' && GIENIOBOT_DEV_MODE;
      const localUrl = configEl ? configEl.dataset.extensionUrl : '';
      const githubUrl = 'https://raw.githubusercontent.com/rkurski/miszcz/main/';

      const baseUrl = (devMode && localUrl) ? localUrl : githubUrl;
      const response = await fetch(baseUrl + 'remote/data/dailyQuests.json');
      const data = await response.json();

      DAILY.questData = data.quests || [];
      DAILY.config = data.config || {};  // Save config (defaultCombatLocByBorn, etc.)
      this.dataLoaded = true;
      console.log(`[AFO_DAILY] Loaded ${DAILY.questData.length} quests, config:`, DAILY.config);

      // Request teleport locations from server and refresh dropdown after delay
      this.requestTeleportLocs();
      setTimeout(() => this.refreshCombatLocDropdown(), 2000);

      return true;
    } catch (error) {
      console.error('[AFO_DAILY] Failed to load quest data:', error);
      GAME.komunikat('[DZIENNE] Błąd ładowania danych questów!');
      return false;
    }
  },

  // ============================================
  // UI - PANEL
  // ============================================

  async showPanel() {
    if (!this.dataLoaded) {
      await this.loadQuestData();
    }

    // Remove existing panel
    $('#daily_Panel').remove();

    const html = `
      <div id="daily_Panel">
        <div class="sekcja daily_dragg">DZIENNE QUESTY</div>
        <div class="daily_status" id="daily_status">Gotowy do startu</div>
        <div class="daily_select_all" style="padding: 5px 10px; border-bottom: 1px solid #333;">
          <button class="newBtn" id="daily_toggle_all_btn" style="font-size: 10px; padding: 2px 6px;">PRZEŁĄCZ</button>
          <button class="newBtn" id="daily_reset_btn" style="font-size: 10px; padding: 2px 6px; margin-left: 5px;">ZERUJ</button>
        </div>
        <div class="daily_quest_list" id="daily_quest_list"></div>
        <div class="daily_options">
          <div style="margin-bottom: 5px;">
            <label>Walka:
              <select id="daily_combat_loc" style="width: 180px;">
                ${this.getTeleportLocationsOptions()}
              </select>
            </label>
          </div>
          <div>
            <label style="cursor: pointer;">
              SUB: <span id="daily_substance_toggle" class="daily_toggle" data-value="x20" style="background: #555; padding: 2px 8px; border-radius: 3px; font-size: 11px;">x20</span>
            </label>
            <label style="cursor: pointer; margin-left: 15px;">
              ⏱ <span id="daily_compressor_toggle" class="daily_toggle" data-value="off" style="background: #555; padding: 2px 8px; border-radius: 3px; font-size: 11px;">NIE</span>
            </label>
          </div>
        </div>
        <div class="daily_controls">
          <button class="newBtn" id="daily_start_btn">START</button>
          <button class="newBtn hidden" id="daily_pause_btn">PAUZA</button>
          <button class="newBtn hidden" id="daily_stop_btn">PRZERWIJ</button>
        </div>
      </div>
    `;

    $('body').append(html);
    $('#daily_Panel').show().draggable({ handle: '.daily_dragg' });

    this.loadCompletedQuests();
    this.loadSkippedQuests();
    this.loadFailedQuests();
    this.renderQuestList();
    this.bindUIHandlers();
  },

  hidePanel() {
    $('#daily_Panel').hide();
  },

  renderQuestList() {
    const currentBorn = GAME.char_data.reborn;
    const quests = DAILY.questData
      .filter(q => q.born.includes(currentBorn))
      .filter(q => this.isQuestAvailable(q));

    let html = '';
    quests.forEach((quest, idx) => {
      const isCompleted = DAILY.completedQuests.includes(quest.name);
      const isUserDisabled = DAILY.skippedQuests.includes(quest.name);  // User unchecked
      const isFailed = DAILY.failedQuests.includes(quest.name);         // Bot couldn't complete
      const isWaiting = DAILY.waitingQuests?.some(w => w.name === quest.name);  // Waiting for timer
      const isCurrent = DAILY.questQueue[DAILY.currentQuestIdx]?.name === quest.name;

      // Checkbox state: enabled from JSON is default, but user can override via skippedQuests
      // If user unchecked (in skippedQuests) -> unchecked
      // If not in skippedQuests and quest.enabled !== false -> checked (enabled defaults to true)
      const isEnabled = !isUserDisabled && quest.enabled !== false;

      const completedClass = isCompleted ? 'completed' : '';
      const failedClass = isFailed ? 'skipped' : '';  // Orange style only for failed
      const currentClass = isCurrent && !DAILY.stop ? 'current' : '';
      const premiumClass = quest.premium ? 'premium' : '';
      const waitingClass = isWaiting ? 'waiting' : '';
      const checked = isEnabled && !isCompleted && !isFailed ? 'checked' : '';

      // Get waiting time from track_quest data-end if applicable
      let waitingInfo = '';
      if (isWaiting) {
        const waitData = DAILY.waitingQuests.find(w => w.name === quest.name);
        if (waitData && waitData.qbId) {
          // Try to get timer from track_quest (more accurate, updates in real-time)
          const trackTimer = $(`#track_quest_${waitData.qbId} .timer[data-end]`);
          if (trackTimer.length > 0) {
            const timerText = trackTimer.text().trim();
            if (timerText) {
              waitingInfo = `<span class="quest_timer">⏱ ${timerText}</span>`;
            }
          }
          // Fallback to calculated time
          if (!waitingInfo && waitData.endTime) {
            const remaining = Math.max(0, waitData.endTime - Date.now());
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            waitingInfo = `<span class="quest_timer">⏱ ${mins}:${secs.toString().padStart(2, '0')}</span>`;
          }
        }
      }

      // Build icon HTML if quest has icon defined (uses CSS sprites)
      let iconHtml = '';
      if (quest.icon) {
        // Icon name is like "action.png" - extract "action" for CSS class
        const iconName = quest.icon.replace('.png', '').replace('_', '-');
        iconHtml = `<span class="quest_icon icon-${iconName}"></span>`;
      }

      html += `
        <div class="daily_quest_item ${completedClass} ${failedClass} ${currentClass} ${premiumClass} ${waitingClass}" data-quest-name="${quest.name}">
          <input type="checkbox" ${checked} ${isCompleted || isFailed ? 'disabled' : ''} data-idx="${idx}">
          ${iconHtml}<span class="quest_name">${quest.name}</span>
          ${waitingInfo}
          <span class="quest_loc">${quest.location.name || ''}</span>
        </div>
      `;
    });

    $('#daily_quest_list').html(html);
  },

  updateStatus(text) {
    $('#daily_status').text(text);
  },

  markQuestComplete(questName) {
    if (!DAILY.completedQuests.includes(questName)) {
      DAILY.completedQuests.push(questName);
      this.saveCompletedQuests();
    }
    $(`.daily_quest_item[data-quest-name="${questName}"]`)
      .addClass('completed')
      .find('input').prop('disabled', true).prop('checked', false);
  },

  markQuestSkipped(questName) {
    // failedQuests = quests bot couldn't complete (orange style, persisted)
    if (!DAILY.failedQuests.includes(questName)) {
      DAILY.failedQuests.push(questName);
      this.saveFailedQuests();
    }
    $(`.daily_quest_item[data-quest-name="${questName}"]`)
      .addClass('skipped')
      .removeClass('current')
      .find('input').prop('disabled', true).prop('checked', false);
  },

  saveCompletedQuests() {
    try {
      localStorage.setItem('daily_completed_' + GAME.char_id, JSON.stringify(DAILY.completedQuests));
    } catch (e) {
      console.warn('[AFO_DAILY] Failed to save completed quests:', e);
    }
  },

  saveSkippedQuests() {
    // skippedQuests = user disabled, NOT persisted (just session state)
    // No-op - checkbox state is session-only
  },

  saveFailedQuests() {
    try {
      localStorage.setItem('daily_failed_' + GAME.char_id, JSON.stringify(DAILY.failedQuests));
    } catch (e) {
      console.warn('[AFO_DAILY] Failed to save failed quests:', e);
    }
  },

  loadCompletedQuests() {
    try {
      const saved = localStorage.getItem('daily_completed_' + GAME.char_id);
      DAILY.completedQuests = saved ? JSON.parse(saved) : [];
    } catch (e) {
      DAILY.completedQuests = [];
    }
  },

  loadSkippedQuests() {
    // skippedQuests = session only, start empty each time
    DAILY.skippedQuests = [];
  },

  loadFailedQuests() {
    try {
      const saved = localStorage.getItem('daily_failed_' + GAME.char_id);
      DAILY.failedQuests = saved ? JSON.parse(saved) : [];
    } catch (e) {
      DAILY.failedQuests = [];
    }
  },

  markQuestCurrent(questName) {
    $('.daily_quest_item').removeClass('current');
    $(`.daily_quest_item[data-quest-name="${questName}"]`).addClass('current');
  },

  bindUIHandlers() {
    // Quest checkbox toggle
    $('#daily_quest_list').on('change', 'input[type="checkbox"]', (e) => {
      const questName = $(e.target).closest('.daily_quest_item').data('quest-name');
      if (e.target.checked) {
        DAILY.skippedQuests = DAILY.skippedQuests.filter(n => n !== questName);
      } else {
        if (!DAILY.skippedQuests.includes(questName)) {
          DAILY.skippedQuests.push(questName);
        }
      }
    });

    // Toggle all button - if any unchecked, select all; otherwise deselect all
    $('#daily_toggle_all_btn').on('click', () => {
      const $checkboxes = $('#daily_quest_list input[type="checkbox"]:not(:disabled)');
      const allChecked = $checkboxes.length > 0 && $checkboxes.filter(':not(:checked)').length === 0;
      $checkboxes.each((_, el) => {
        $(el).prop('checked', !allChecked).trigger('change');
      });
    });

    // Reset button - clear all completed and failed
    $('#daily_reset_btn').on('click', () => {
      if (confirm('Czy na pewno chcesz zresetować wszystkie dzienne questy?')) {
        DAILY.completedQuests = [];
        DAILY.skippedQuests = [];
        DAILY.failedQuests = [];
        this.saveCompletedQuests();
        this.saveFailedQuests();
        this.renderQuestList();
        GAME.komunikat('[DZIENNE] Zresetowano wszystkie questy');
      }
    });

    // Substance toggle (click to switch between x20 and ostateczna)
    $('#daily_substance_toggle').on('click', (e) => {
      const $toggle = $(e.target);
      const currentValue = $toggle.attr('data-value');
      const newValue = currentValue === 'x20' ? 'ostateczna' : 'x20';
      $toggle.attr('data-value', newValue);
      $toggle.text(newValue === 'x20' ? 'x20' : 'ost.');
      DAILY.substance = newValue;
    });

    // Combat location selection
    $('#daily_combat_loc').on('change', (e) => {
      DAILY.combatLoc = $(e.target).val();
      console.log('[AFO_DAILY] Combat location changed:', DAILY.combatLoc);
    });

    // Initialize combatLoc from current dropdown value
    DAILY.combatLoc = $('#daily_combat_loc').val() || 'current';
    console.log('[AFO_DAILY] Combat location initialized:', DAILY.combatLoc);

    // Use compressor (zegarek) toggle - click to switch TAK/NIE
    $('#daily_compressor_toggle').on('click', (e) => {
      const $toggle = $(e.target);
      const currentValue = $toggle.attr('data-value');
      const newValue = currentValue === 'off' ? 'on' : 'off';
      $toggle.attr('data-value', newValue);
      $toggle.text(newValue === 'on' ? 'TAK' : 'NIE');
      $toggle.css('background', newValue === 'on' ? '#4CAF50' : '#555');
      DAILY.useCompressor = (newValue === 'on');
      console.log('[AFO_DAILY] useCompressor:', DAILY.useCompressor);
    });

    // Start button
    $('#daily_start_btn').on('click', () => {
      this.start();
    });

    // Pause button
    $('#daily_pause_btn').on('click', () => {
      if (DAILY.paused) {
        this.resume();
      } else {
        this.pause();
      }
    });

    // Stop button
    $('#daily_stop_btn').on('click', () => {
      this.stop('Zatrzymano przez użytkownika');
    });
  },

  // ============================================
  // MAIN FLOW
  // ============================================

  start() {
    if (!DAILY.stop) {
      GAME.komunikat('[DZIENNE] Już aktywne!');
      return;
    }

    // Build quest queue from checked quests (not in skippedQuests)
    // JSON 'enabled' flag only sets default checkbox state, skippedQuests reflects actual user choice
    const currentBorn = GAME.char_data.reborn;
    const availableQuests = DAILY.questData
      .filter(q => q.born.includes(currentBorn))
      .filter(q => this.isQuestAvailable(q))
      .filter(q => !DAILY.skippedQuests.includes(q.name))  // User unchecked = skip
      .filter(q => !DAILY.completedQuests.includes(q.name))
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));

    if (availableQuests.length === 0) {
      GAME.komunikat('[DZIENNE] Brak questów do wykonania!');
      return;
    }

    // Group portal quests together
    DAILY.questQueue = this.groupPortalQuests(availableQuests);

    // Reset state - FULL RESET including completed quests
    DAILY.stop = false;
    DAILY.paused = false;
    DAILY.currentQuestIdx = 0;
    DAILY.currentStageIdx = 0;
    DAILY.completedQuests = [];  // Reset completed quests!
    DAILY.ownEmpire = GAME.char_data.empire;
    DAILY.isNavigating = false;
    DAILY.isTeleporting = false;
    DAILY.isInCombat = false;
    DAILY.inPortal = false;
    DAILY.portalGroup = [];
    DAILY.portalGroupIdx = 0;
    DAILY._dialogAttempts = 0;
    DAILY._currentQuest = null;

    // Update UI - hide START, show PAUZA and PRZERWIJ
    $('#daily_start_btn').addClass('hidden');
    $('#daily_pause_btn').removeClass('hidden').text('PAUZA');
    $('#daily_stop_btn').removeClass('hidden');

    this.updateStatus(`Rozpoczynam... (${DAILY.questQueue.length} questów)`);
    console.log('[AFO_DAILY] Started with', DAILY.questQueue.length, 'quests');

    // Stop other modules
    RESP.stop = true;
    PVP.stop = true;
    LPVM.Stop = true;
    RES.stop = true;
    CODE.stop = true;

    // Start processing
    setTimeout(() => this.processNextQuest(), 500);
  },

  pause() {
    if (DAILY.stop || DAILY.paused) return;

    DAILY.paused = true;
    PVP.stop = true;  // Stop AFO_PVP if running
    RES.stop = true;  // Stop resource collection if running
    this.stopLPVM();  // Stop LPVM if running (bounty quests)
    this.stopAutoExpeditions();  // Stop auto expeditions if running
    $('#daily_pause_btn').text('WZNÓW');
    this.updateStatus('⏸ Wstrzymano');
    console.log('[AFO_DAILY] Paused');
  },

  resume() {
    if (DAILY.stop || !DAILY.paused) return;

    DAILY.paused = false;
    $('#daily_pause_btn').text('PAUZA');
    this.updateStatus('Wznawianie...');
    console.log('[AFO_DAILY] Resumed');

    // Handle Anielska karta batch - resume combat loop
    if (DAILY._anielskaBatchActive) {
      console.log('[AFO_DAILY] Resuming Anielska batch combat');
      setTimeout(() => this.anielskaCombatLoop(), 300);
      return;
    }

    // Handle bounty quest - resume bounty loop
    if (DAILY._bountyQuest) {
      console.log('[AFO_DAILY] Resuming bounty loop');
      setTimeout(() => this.bountyLoop(), 300);
      return;
    }

    // Handle expedition quest - resume expedition loop
    if (DAILY._expeditionQuest) {
      console.log('[AFO_DAILY] Resuming expedition loop');
      setTimeout(() => this.expeditionLoop(), 300);
      return;
    }

    // If we were in combat, resume combat loop, otherwise continue quest processing
    if (DAILY.isInCombat && DAILY._combatQuest) {
      setTimeout(() => this.combatLoop(), 300);
    } else {
      // Continue from where we were - don't process next, continue current
      const quest = DAILY._currentQuest || DAILY.questQueue[DAILY.currentQuestIdx];
      if (quest) {
        setTimeout(() => this.navigateToQuestNPC(quest), 300);
      } else {
        setTimeout(() => this.processNextQuest(), 500);
      }
    }
  },

  stop(reason) {
    console.log('[AFO_DAILY] Stopped:', reason);

    DAILY.stop = true;
    DAILY.paused = false;
    DAILY.isNavigating = false;
    DAILY.isTeleporting = false;
    DAILY.isInCombat = false;
    PVP.stop = true;  // Stop AFO_PVP if running
    RES.stop = true;  // Stop resource collection if running
    this.stopLPVM();  // Stop LPVM if running (bounty quests)
    this.stopAutoExpeditions();  // Stop auto expeditions if running

    // Clear bounty state
    DAILY._bountyQuest = null;
    DAILY._bountyRequires = null;

    // Clear expedition state
    DAILY._expeditionQuest = null;
    DAILY._expeditionRequires = null;

    // Update UI - show START, hide PAUZA and PRZERWIJ
    $('#daily_start_btn').removeClass('hidden');
    $('#daily_pause_btn').addClass('hidden').text('PAUZA');
    $('#daily_stop_btn').addClass('hidden');

    this.updateStatus(`Zatrzymano: ${reason}`);
    this.renderQuestList();

    const completed = DAILY.completedQuests.length;
    const total = DAILY.questQueue.length;
    GAME.komunikat(`[DZIENNE] ${reason}. Wykonano: ${completed}/${total}`);
  },

  // ============================================
  // QUEST GROUPING
  // ============================================

  groupPortalQuests(quests) {
    // Group quests by portal (same innerLocId and same startLoc)
    // IMPORTANT: Maintain the original priority order - quests are already sorted by priority
    const groups = {};
    const result = [];
    const processedGroups = new Set();

    // First pass: identify portal groups
    quests.forEach(quest => {
      const portal = quest.location?.portal;
      if (portal && portal.innerLocId) {
        const key = `${quest.location.locId}_${portal.innerLocId}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(quest);
      }
    });

    // Second pass: build result maintaining priority order
    // When we encounter a portal quest, add entire group (if not already processed)
    quests.forEach(quest => {
      const portal = quest.location?.portal;
      if (portal && portal.innerLocId) {
        const key = `${quest.location.locId}_${portal.innerLocId}`;
        if (!processedGroups.has(key)) {
          // First time seeing this group - add the first quest as entry point
          const group = groups[key];
          group[0]._isPortalGroupStart = true;
          group[0]._portalGroup = group;
          result.push(group[0]);
          processedGroups.add(key);
        }
        // Other quests in group will be processed within portal
      } else {
        // Non-portal quest - add directly maintaining priority order
        result.push(quest);
      }
    });

    return result;
  },

  // ============================================
  // QUEST PROCESSING
  // ============================================

  processNextQuest() {
    if (DAILY.stop || DAILY.paused) return;

    // Check if processing portal group
    if (DAILY.inPortal && DAILY.portalGroup.length > 0) {
      if (DAILY.portalGroupIdx < DAILY.portalGroup.length) {
        const quest = DAILY.portalGroup[DAILY.portalGroupIdx];
        this.processQuest(quest);
        return;
      } else {
        // All quests in portal done, exit
        this.exitPortal();
        return;
      }
    }

    // Check if done with regular queue
    if (DAILY.currentQuestIdx >= DAILY.questQueue.length) {
      // Check waiting quests before stopping
      if (this.checkWaitingQuests()) {
        return; // Processing a waiting quest
      }
      this.stop('Wykonano wszystkie questy!');
      return;
    }

    const quest = DAILY.questQueue[DAILY.currentQuestIdx];

    // Check if this is a portal group start
    if (quest._isPortalGroupStart && quest._portalGroup) {
      DAILY.portalGroup = quest._portalGroup;
      DAILY.portalGroupIdx = 0;
      DAILY.inPortal = false; // Not yet in portal
    }

    this.processQuest(quest);
  },

  /**
   * Check if any waiting quests are ready to complete
   * Returns true if processing a waiting quest or staying in standby, false if should stop
   */
  checkWaitingQuests() {
    if (!DAILY.waitingQuests || DAILY.waitingQuests.length === 0) {
      return false; // No waiting quests, can stop
    }

    const now = Date.now();

    // Update endTime from track_quest for all waiting quests
    DAILY.waitingQuests.forEach(w => {
      if (w.qbId) {
        const trackTimer = $(`#track_quest_${w.qbId} .timer[data-end]`);
        if (trackTimer.length > 0) {
          const dataEnd = parseInt(trackTimer.attr('data-end'));
          if (dataEnd > 0) {
            w.endTime = dataEnd * 1000;
          }
        }
      }
    });

    // Find quests that are ready (timer expired OR track_quest shows green)
    const readyQuests = DAILY.waitingQuests.filter(w => {
      // Check if timer expired
      if (now >= w.endTime) {
        return true;
      }

      // Check if track_quest shows green (quest might be completable via other means)
      if (w.qbId) {
        const trackQuest = $(`#track_quest_${w.qbId}`);
        if (trackQuest.find('.green').length > 0) {
          return true;
        }
      }

      return false;
    });

    if (readyQuests.length > 0) {
      // Process first ready quest
      const waitData = readyQuests[0];
      console.log('[AFO_DAILY] Waiting quest ready:', waitData.name);

      // Remove from waiting list
      DAILY.waitingQuests = DAILY.waitingQuests.filter(w => w.name !== waitData.name);

      this.updateStatus(`${waitData.name}: Timer zakończony, kończę quest`);
      this.renderQuestList();

      // Navigate back to quest NPC to finish
      const quest = waitData.quest;
      this.goToQuestLocation(quest, () => {
        this.navigateToQuestNPC(quest);
      });

      return true;
    }

    // No ready quests but there are pending - stay in STANDBY mode
    console.log('[AFO_DAILY] Standby mode - waiting for', DAILY.waitingQuests.length, 'quests');
    this.updateWaitingQuestsUI();

    // Return true to prevent stop() from being called
    // Schedule periodic checks
    this.scheduleWaitingCheck();

    return true; // Stay active in standby
  },

  /**
   * Schedule periodic check for waiting quests
   */
  scheduleWaitingCheck() {
    if (DAILY._waitingCheckInterval) {
      clearInterval(DAILY._waitingCheckInterval);
    }

    // Start 1-second timer update for smooth countdown display
    this.startWaitingTimerUpdate();

    // Check every 5 seconds for quest completion
    DAILY._waitingCheckInterval = setInterval(() => {
      if (DAILY.stop || !DAILY.waitingQuests || DAILY.waitingQuests.length === 0) {
        clearInterval(DAILY._waitingCheckInterval);
        DAILY._waitingCheckInterval = null;
        this.stopWaitingTimerUpdate();
        if (!DAILY.stop && DAILY.waitingQuests?.length === 0) {
          this.stop('Wykonano wszystkie questy!');
        }
        return;
      }

      // Check if any are ready
      if (this.checkWaitingQuests()) {
        // A quest became ready and is being processed
        clearInterval(DAILY._waitingCheckInterval);
        DAILY._waitingCheckInterval = null;
        this.stopWaitingTimerUpdate();
      }
    }, 5000);
  },

  /**
   * Start 1-second interval to update waiting quest timers in UI
   */
  startWaitingTimerUpdate() {
    if (DAILY._timerUpdateInterval) {
      clearInterval(DAILY._timerUpdateInterval);
    }

    // Update timer display every second
    DAILY._timerUpdateInterval = setInterval(() => {
      if (DAILY.stop || !DAILY.waitingQuests || DAILY.waitingQuests.length === 0) {
        this.stopWaitingTimerUpdate();
        return;
      }

      // Update each waiting quest's timer display
      DAILY.waitingQuests.forEach(waitData => {
        if (!waitData.qbId) return;

        const $item = $(`.daily_quest_item[data-quest-name="${waitData.name}"]`);
        let $timer = $item.find('.quest_timer');

        // Try to get timer from track_quest first (live game timer)
        const trackTimer = $(`#track_quest_${waitData.qbId} .timer`);
        let timerText = '';

        if (trackTimer.length > 0) {
          timerText = trackTimer.text().trim();
        }

        // Fallback to calculated time if track_quest not available
        if (!timerText && waitData.endTime) {
          const remaining = Math.max(0, waitData.endTime - Date.now());
          const mins = Math.floor(remaining / 60000);
          const secs = Math.floor((remaining % 60000) / 1000);
          timerText = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        if (timerText) {
          if ($timer.length > 0) {
            $timer.text(`⏱ ${timerText}`);
          } else {
            // Insert timer span if not exists
            $item.find('.quest_name').after(`<span class="quest_timer">⏱ ${timerText}</span>`);
          }
        }
      });

      // NOTE: Don't call updateWaitingStatus() here - it would override active task status
      // The waiting status is only shown in standby mode (when all regular quests are done)
    }, 1000);
  },

  /**
   * Stop the timer update interval
   */
  stopWaitingTimerUpdate() {
    if (DAILY._timerUpdateInterval) {
      clearInterval(DAILY._timerUpdateInterval);
      DAILY._timerUpdateInterval = null;
    }
  },

  /**
   * Update status bar with waiting quest info
   */
  updateWaitingStatus() {
    if (!DAILY.waitingQuests || DAILY.waitingQuests.length === 0) return;

    const now = Date.now();
    let closestEnd = Infinity;

    DAILY.waitingQuests.forEach(w => {
      // Try to get accurate time from track_quest
      if (w.qbId) {
        const timerEl = $(`#track_quest_${w.qbId} .timer[data-end]`);
        if (timerEl.length > 0) {
          const dataEnd = parseInt(timerEl.attr('data-end'));
          if (dataEnd > 0) {
            w.endTime = dataEnd * 1000;
          }
        }
      }

      const remaining = Math.max(0, w.endTime - now);
      if (remaining < closestEnd) {
        closestEnd = remaining;
      }
    });

    if (closestEnd < Infinity) {
      const mins = Math.floor(closestEnd / 60000);
      const secs = Math.floor((closestEnd % 60000) / 1000);
      this.updateStatus(`Oczekujące: ${DAILY.waitingQuests.length} (następny za ${mins}:${secs.toString().padStart(2, '0')})`);
    }
  },


  /**
   * Update UI for waiting quests
   */
  updateWaitingQuestsUI() {
    if (!DAILY.waitingQuests || DAILY.waitingQuests.length === 0) return;

    const now = Date.now();
    let closestEnd = Infinity;

    DAILY.waitingQuests.forEach(w => {
      const remaining = Math.max(0, w.endTime - now);
      if (remaining < closestEnd) {
        closestEnd = remaining;
      }
    });

    if (closestEnd < Infinity) {
      const mins = Math.floor(closestEnd / 60000);
      const secs = Math.floor((closestEnd % 60000) / 1000);
      this.updateStatus(`Oczekujące: ${DAILY.waitingQuests.length} (następny za ${mins}:${secs.toString().padStart(2, '0')})`);
    }

    // Re-render to update timers
    this.renderQuestList();

    // Schedule next check
    if (closestEnd > 0) {
      setTimeout(() => {
        if (!DAILY.stop && DAILY.currentQuestIdx >= DAILY.questQueue.length) {
          this.checkWaitingQuests();
        }
      }, Math.min(closestEnd + 1000, 30000)); // Check when timer expires or every 30s
    }
  },

  /**
   * Go to quest location for waiting quest completion
   */
  goToQuestLocation(quest, callback) {
    switch (quest.locationType) {
      case 'private_planet':
        this.goToPrivatePlanet(quest);
        DAILY._afterTeleportCallback = callback;
        break;
      case 'clan_planet':
        this.goToClanPlanet(quest);
        DAILY._afterTeleportCallback = callback;
        break;
      case 'empire_hq':
        this.goToEmpireHQ(quest);
        DAILY._afterTeleportCallback = callback;
        break;
      case 'normal':
      default:
        // Check if need to teleport
        const locId = quest.location?.locId;
        if (locId && GAME.char_data.loc !== locId) {
          this.updateStatus(`Teleport: ${quest.location.name || locId}`);
          DAILY.isTeleporting = true;
          DAILY._currentQuest = quest;
          DAILY._afterTeleportCallback = callback;
          GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });
        } else {
          callback();
        }
        break;
    }
  },

  processQuest(quest) {
    if (DAILY.stop || DAILY.paused) return;

    this.markQuestCurrent(quest.name);
    this.updateStatus(`Quest: ${quest.name}`);
    console.log('[AFO_DAILY] Processing quest:', quest.name);

    // SPECIAL CASE: Anielska karta quests (batch process lvl1-3 together)
    if (quest.name.startsWith('Anielska karta[LvL') && !DAILY._anielskaBatchActive) {
      console.log('[AFO_DAILY] Detected Anielska karta quest - starting batch handler');
      this.handleAnielskaBatch(quest);
      return;
    }

    // Navigate based on location type
    switch (quest.locationType) {
      case 'private_planet':
        this.goToPrivatePlanet(quest);
        break;
      case 'clan_planet':
        this.goToClanPlanet(quest);
        break;
      case 'empire_hq':
        this.goToEmpireHQ(quest);
        break;
      case 'normal':
      default:
        this.goToNormalLocation(quest);
        break;
    }
  },

  // ============================================
  // NAVIGATION - LOCATION TYPES
  // ============================================

  goToNormalLocation(quest) {
    const locId = quest.location.locId;
    const portal = quest.location.portal;

    // Check if need portal entry first (only if portal has entry coords)
    if (portal && portal.entry && !DAILY.inPortal) {
      this.goToPortalEntry(quest);
      return;
    }

    // Special case: quest has portal.exit but no portal.entry
    // This means we're already inside the portal location (e.g. Boski Ulepszacz on Vestria)
    if (portal && portal.exit && !portal.entry && GAME.char_data.loc === locId) {
      console.log('[AFO_DAILY] Already inside portal location (no entry needed):', locId);
      DAILY.inPortal = true;
      DAILY._currentQuest = quest;
      this.navigateToQuestNPC(quest);
      return;
    }

    // If already on location - skip teleport (optimization for multi-quest on same loc)
    if (GAME.char_data.loc === locId) {
      console.log('[AFO_DAILY] Already on location', locId, '- skipping teleport');

      // Check map_quests immediately - same logic as waitForMapQuests
      const questData = this.findQuestByName(quest.name);
      if (questData) {
        console.log('[AFO_DAILY] Quest found on map, navigating to NPC');
        this.navigateToQuestNPC(quest);
      } else {
        // Quest not on map = already completed
        console.log('[AFO_DAILY] Quest not in map_quests - already completed:', quest.name);
        this.markQuestComplete(quest.name);
        this.advanceQuestQueue();
      }
      return;
    }

    // If in portal, navigate within portal
    if (DAILY.inPortal) {
      console.log('[AFO_DAILY] In portal - navigating within portal');
      this.navigateToQuestNPC(quest);
      return;
    }

    // Teleport
    this.updateStatus(`Teleport: ${quest.location.name || locId}`);
    console.log('[AFO_DAILY] Teleporting to location', locId);
    DAILY.isTeleporting = true;
    DAILY._currentQuest = quest;
    GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });
    // Continue in handleSockets
  },

  goToPrivatePlanet(quest) {
    // Check if already on private planet - skip return+teleport
    if (this.isOnPrivatePlanet()) {
      console.log('[AFO_DAILY] Already on private planet, skipping teleport');
      DAILY._currentQuest = quest;
      this.navigateToQuestNPC(quest);
      return;
    }

    // First do return action to leave current location cleanly
    this.updateStatus('Powrót...');
    GAME.socket.emit('ga', { a: 16 });

    setTimeout(() => {
      if (DAILY.stop || DAILY.paused) return;
      this.updateStatus('Teleport: Prywatna planeta');
      DAILY.isTeleporting = true;
      DAILY._currentQuest = quest;
      GAME.socket.emit('ga', { a: 15, type: 13 });
    }, 1000);  // 1s delay for server sync
  },

  goToClanPlanet(quest) {
    // Check if already on clan planet - skip return+teleport
    if (this.isOnClanPlanet()) {
      console.log('[AFO_DAILY] Already on clan planet, skipping teleport');
      DAILY._currentQuest = quest;
      this.navigateToQuestNPC(quest);
      return;
    }

    // First do return action
    this.updateStatus('Powrót...');
    GAME.socket.emit('ga', { a: 16 });

    setTimeout(() => {
      if (DAILY.stop || DAILY.paused) return;
      this.updateStatus('Teleport: Planeta klanowa');
      DAILY.isTeleporting = true;
      DAILY._currentQuest = quest;
      GAME.socket.emit('ga', { a: 39, type: 32 });
    }, 1000);  // 1s delay for server sync
  },

  goToEmpireHQ(quest) {
    // Check if already on own empire HQ - skip return+teleport
    if (this.isOnOwnEmpireHQ()) {
      console.log('[AFO_DAILY] Already on empire HQ, skipping teleport');
      DAILY._currentQuest = quest;
      DAILY.inEmpire = true;
      this.navigateToQuestNPC(quest);
      return;
    }

    // First do return action
    this.updateStatus('Powrót...');
    GAME.socket.emit('ga', { a: 16 });

    setTimeout(() => {
      if (DAILY.stop || DAILY.paused) return;
      this.updateStatus('Wchodzę na siedzibę imperium');
      DAILY.isTeleporting = true;
      DAILY.inEmpire = true;
      DAILY._currentQuest = quest;
      GAME.socket.emit('ga', { a: 50, type: 5, e: DAILY.ownEmpire });
    }, 1000);  // 1s delay for server sync
  },

  // Helper: Check if on private planet
  isOnPrivatePlanet() {
    const locName = GAME.current_loc?.name || '';
    return locName.includes('Prywatna') || locName.includes('prywatna');
  },

  // Helper: Check if on clan planet
  isOnClanPlanet() {
    const locName = GAME.current_loc?.name || '';
    return locName.includes('Klanow') || locName.includes('klanow');
  },

  // Helper: Check if on own empire HQ
  isOnOwnEmpireHQ() {
    const locName = GAME.current_loc?.name || '';
    // Empire HQ names typically include "Siedziba" and empire indicator
    return locName.includes('Siedziba') && DAILY.inEmpire;
  },

  goToPortalEntry(quest) {
    const portal = quest.location.portal;
    const locId = quest.location.locId;

    // First teleport to start location if not there
    if (GAME.char_data.loc !== locId) {
      this.updateStatus(`Teleport: ${quest.location.name || locId}`);
      DAILY.isTeleporting = true;
      GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });
      // Will call goToPortalEntry again after teleport
      return;
    }

    // Navigate to portal entry coords
    this.updateStatus('Idę do portalu...');
    DAILY._currentQuest = quest;  // Save for portal check
    this.navigateToCoords(portal.entry.x, portal.entry.y, () => {
      // We've arrived at portal entry - use the portal!
      console.log('[AFO_DAILY] Arrived at portal entry, using portal');
      DAILY.isTeleporting = true;
      DAILY.currentPortalLocId = portal.innerLocId;
      // Small delay before using portal, then emit via socket
      setTimeout(() => {
        console.log('[AFO_DAILY] Emitting portal use command');
        GAME.socket.emit('ga', { a: 6 });  // Use portal via socket

        // Wait for map to load after portal transition, then continue
        setTimeout(() => {
          if (DAILY.stop || DAILY.paused) return;
          console.log('[AFO_DAILY] Portal transition complete, continuing to NPC');
          DAILY.isTeleporting = false;
          DAILY.inPortal = true;
          DAILY.currentPortalLocId = 0;
          this.afterTeleport();
        }, 2000);  // 2 second delay for portal loading
      }, 300);
    });
  },

  exitPortal() {
    if (!DAILY.inPortal) {
      this.advanceQuestQueue();
      return;
    }

    const currentQuest = DAILY.portalGroup[0];
    const portal = currentQuest?.location?.portal;

    if (!portal) {
      DAILY.inPortal = false;
      this.advanceQuestQueue();
      return;
    }

    this.updateStatus('Wychodzę z portalu...');
    this.navigateToCoords(portal.exit.x, portal.exit.y, () => {
      // We've arrived at portal exit - use the portal to exit!
      console.log('[AFO_DAILY] Arrived at portal exit, using portal');
      DAILY.isTeleporting = true;

      // Small delay before using portal, then emit via socket
      setTimeout(() => {
        console.log('[AFO_DAILY] Emitting portal exit command');
        GAME.socket.emit('ga', { a: 6 });  // Use portal to exit

        // Wait for map to load after portal transition
        setTimeout(() => {
          if (DAILY.stop || DAILY.paused) return;
          console.log('[AFO_DAILY] Portal exit complete');
          DAILY.isTeleporting = false;
          DAILY.inPortal = false;
          this.advanceQuestQueue();
        }, 2000);
      }, 300);
    });
  },

  // ============================================
  // NAVIGATION - PATHFINDING
  // ============================================

  navigateToQuestNPC(quest) {
    // Find quest in GAME.map_quests by name
    const questData = this.findQuestByName(quest.name);

    if (questData) {
      const [x, y] = questData.coords;

      // Save NPC coords for return navigation (dynamic quests like private/clan planet)
      // These coords are from GAME.map_quests which reflect the actual quest position
      if (quest.locationType === 'private_planet' || quest.locationType === 'clan_planet') {
        // Keep persisting the same coords throughout the entire quest
        // Important for multi-stage quests like "Rozwój Planety"
        if (!DAILY._questNpcCoords || DAILY._questNpcCoords.questName !== quest.name) {
          DAILY._questNpcCoords = { x, y, locationType: quest.locationType, questName: quest.name };
        }
        DAILY._dynamicNpcCoords = DAILY._questNpcCoords;
        console.log('[AFO_DAILY] Saved dynamic NPC coords:', DAILY._dynamicNpcCoords);
      }

      this.updateStatus(`Idę do NPC (${x}, ${y})`);
      this.navigateToCoords(x, y, () => {
        this.startDialog(quest, questData.qb_id);
      });
    } else {
      // Quest not found on map - check if it might be already completed
      // (GAME.map_quests has false entry or quest disappeared)
      console.log('[AFO_DAILY] Quest not found on map, checking if completed:', quest.name);

      // Check if quest was previously available (we have coords) but now gone
      const coords = quest.location.coords;
      if (coords) {
        // Navigate to coords and check again
        this.updateStatus(`Sprawdzam quest: ${quest.name}`);
        this.navigateToCoords(coords.x, coords.y, () => {
          const found = this.findQuestByName(quest.name);
          if (found) {
            this.startDialog(quest, found.qb_id);
          } else {
            // Quest is gone from map = completed!
            console.log('[AFO_DAILY] Quest disappeared from map - marking as complete:', quest.name);
            this.onQuestComplete(quest);
          }
        });
      } else {
        // No coords at all - quest is definitely complete or unavailable
        console.log('[AFO_DAILY] Quest has no coords and not on map - marking as complete:', quest.name);
        this.onQuestComplete(quest);
      }
    }
  },

  findQuestByName(name) {
    if (!GAME.map_quests) return null;

    for (let coords in GAME.map_quests) {
      const questsAtCoords = GAME.map_quests[coords];
      if (Array.isArray(questsAtCoords)) {
        for (let quest of questsAtCoords) {
          // Skip if quest entry is false (quest already completed)
          if (quest === false) continue;
          if (quest && quest.name === name) {
            const [x, y] = coords.split('_').map(Number);
            return { qb_id: quest.qb_id, coords: [x, y], data: quest };
          }
        }
      }
    }
    return null;
  },

  navigateToCoords(targetX, targetY, callback) {
    if (DAILY.stop || DAILY.paused) return;

    // Already at target?
    if (GAME.char_data.x === targetX && GAME.char_data.y === targetY) {
      callback();
      return;
    }

    // Create navigation matrix
    if (!this.createMatrix()) {
      console.error('[AFO_DAILY] Failed to create matrix');
      setTimeout(() => this.navigateToCoords(targetX, targetY, callback), 500);
      return;
    }

    DAILY.isNavigating = true;
    DAILY._navCallback = callback;

    this.Finder.setGrid(DAILY.Matrix);
    this.Finder.findPath(
      GAME.char_data.x - 1,
      GAME.char_data.y - 1,
      targetX - 1,
      targetY - 1,
      (path) => {
        if (path === null) {
          console.warn('[AFO_DAILY] No path found to', targetX, targetY);
          DAILY.isNavigating = false;
          // Try to continue anyway
          callback();
          return;
        }

        // Remove current position
        if (path.length > 0 && path[0].x === GAME.char_data.x - 1 && path[0].y === GAME.char_data.y - 1) {
          path.shift();
        }

        DAILY.Path = path;
        console.log('[AFO_DAILY] Path found:', path.length, 'steps');
        setTimeout(() => this.move(), DAILY.wait);
      }
    );
    this.Finder.calculate();
  },

  createMatrix() {
    DAILY.Matrix = [];
    const mapcell = GAME.mapcell;

    if (!mapcell) {
      console.warn('[AFO_DAILY] mapcell not available');
      return false;
    }

    for (let i = 0; i < parseInt(GAME.map.max_y); i++) {
      DAILY.Matrix[i] = [];
      for (let j = 0; j < parseInt(GAME.map.max_x); j++) {
        let key = (j + 1) + '_' + (i + 1);
        if (mapcell[key] && mapcell[key].m == 1) {
          DAILY.Matrix[i][j] = 1;
        } else {
          DAILY.Matrix[i][j] = 0;
        }
      }
    }
    return true;
  },

  move() {
    if (DAILY.stop || DAILY.paused || !DAILY.isNavigating) return;

    if (DAILY.Path.length === 0) {
      DAILY.isNavigating = false;

      console.log('[AFO_DAILY] Path complete at', GAME.char_data.x, GAME.char_data.y);

      // Check if we're at a portal location and need to enter
      // Portal check: look for portal target coords and compare with character position
      const currentQuest = DAILY._currentQuest || DAILY.questQueue[DAILY.currentQuestIdx];
      const portal = currentQuest?.location?.portal;

      if (portal && !DAILY.inPortal) {
        const entryX = portal.entry?.x;
        const entryY = portal.entry?.y;

        // Check if character is at portal entry position
        if (entryX && entryY && GAME.char_data.x === entryX && GAME.char_data.y === entryY) {
          console.log('[AFO_DAILY] At portal entry position, entering portal');
          GAME.emitOrder({ a: 6 });

          // Wait for teleport and then continue
          setTimeout(() => {
            if (DAILY._navCallback) {
              DAILY._navCallback();
              DAILY._navCallback = null;
            }
          }, 1500);
          return;
        }
      }

      // Also check if there's a portal button (fallback)
      const portalBtn = $('button[data-option="use_loc_tp"]').first();
      if (portalBtn.length > 0) {
        console.log('[AFO_DAILY] Found portal button, entering');
        GAME.emitOrder({ a: 6 });

        setTimeout(() => {
          if (DAILY._navCallback) {
            DAILY._navCallback();
            DAILY._navCallback = null;
          }
        }, 1500);
        return;
      }

      if (DAILY._navCallback) {
        DAILY._navCallback();
        DAILY._navCallback = null;
      }
      return;
    }

    const target = DAILY.Path[0];
    const cx = GAME.char_data.x - 1;
    const cy = GAME.char_data.y - 1;
    let dir = null;

    // Calculate direction
    if (target.x > cx && target.y === cy) dir = 7;      // Right
    else if (target.x < cx && target.y === cy) dir = 8; // Left
    else if (target.x === cx && target.y > cy) dir = 1; // Down
    else if (target.x === cx && target.y < cy) dir = 2; // Up
    else if (target.x > cx && target.y > cy) dir = 3;   // Down-Right
    else if (target.x < cx && target.y < cy) dir = 6;   // Up-Left
    else if (target.x > cx && target.y < cy) dir = 5;   // Up-Right
    else if (target.x < cx && target.y > cy) dir = 4;   // Down-Left
    else {
      // Already at target, skip
      DAILY.Path.shift();
      this.move();
      return;
    }

    GAME.socket.emit('ga', { a: 4, dir: dir, vo: GAME.map_options.vo });
    // Movement completion handled in handleSockets
  },

  nextStep() {
    if (!DAILY.isNavigating) return;

    if (DAILY.Path.length > 0) {
      DAILY.Path.shift();
    }

    if (DAILY.Path.length > 0) {
      setTimeout(() => this.move(), DAILY.wait);
    } else {
      DAILY.isNavigating = false;
      if (DAILY._navCallback) {
        DAILY._navCallback();
        DAILY._navCallback = null;
      }
    }
  },

  // ============================================
  // DIALOG HANDLING
  // ============================================

  startDialog(quest, qb_id) {
    if (DAILY.stop || DAILY.paused) return;

    this.updateStatus(`Dialog: ${quest.name}`);
    console.log('[AFO_DAILY] Starting dialog for quest:', quest.name, 'qb_id:', qb_id);

    // Track dialog attempts to prevent infinite loop
    DAILY._dialogAttempts = (DAILY._dialogAttempts || 0) + 1;
    if (DAILY._dialogAttempts > 10) {
      console.warn('[AFO_DAILY] Too many dialog attempts, skipping quest');
      DAILY._dialogAttempts = 0;
      this.skipCurrentQuest('Nie udało się otworzyć dialogu');
      return;
    }

    // Open quest dialog
    GAME.emitOrder({ a: 22, type: 1, id: qb_id });

    // Wait for dialog to appear with proper delay
    this.waitForDialog(quest, qb_id);
  },

  waitForDialog(quest, qb_id) {
    if (DAILY.stop || DAILY.paused) return;

    // Check if dialog appeared
    if ($('#quest_con').is(':visible')) {
      DAILY._dialogAttempts = 0;
      console.log('[AFO_DAILY] Dialog visible, processing');
      setTimeout(() => this.processDialog(quest), 200);
    } else {
      // Wait more
      setTimeout(() => {
        if ($('#quest_con').is(':visible')) {
          DAILY._dialogAttempts = 0;
          this.processDialog(quest);
        } else {
          // Try to open dialog again
          this.startDialog(quest, qb_id);
        }
      }, 500);
    }
  },

  processDialog(quest) {
    if (DAILY.stop || DAILY.paused) return;

    // Check if dialog is still visible
    if (!$('#quest_con').is(':visible')) {
      // Dialog closed after we clicked finish = quest is done!
      if (DAILY._finishClicked) {
        console.log('[AFO_DAILY] Dialog closed after finish click - quest complete');
        DAILY._finishClicked = false;
        this.verifyAndCompleteQuest(quest);
        return;
      }
      // Dialog closed - check if quest is done
      const questData = this.findQuestByName(quest.name);
      if (!questData) {
        this.verifyAndCompleteQuest(quest);
      } else {
        // Try again
        setTimeout(() => this.startDialog(quest, questData.qb_id), 400);
      }
      return;
    }

    // STUDNIA ŻYCZEŃ early detection - handle with special slow timing
    if (quest.name && quest.name.startsWith('Studnia Życzeń')) {
      console.log('[AFO_DAILY] Detected Studnia quest, using special handler');
      this.handleStudniaQuest(quest);
      return;
    }

    // Check for requirements
    const requires = this.parseQuestRequirements();
    console.log('[AFO_DAILY] Parsed requirements:', requires);

    // Handle special quest types FIRST (like combat.js questProceed)
    const questTitle = $('.quest_win .sekcja').text().toLowerCase();
    const finishBtns = $('button[data-option=finish_quest]');

    // STUDNIA SZCZĘŚCIA: 2 buttons where second says "Mam dość tej studni"
    // Debug: log button count and second button text
    console.log('[AFO_DAILY] Studnia check - buttons:', finishBtns.length, 'second text:', finishBtns.eq(1).text().trim());
    if (finishBtns.length === 2 && finishBtns.eq(1).text().trim() === 'Mam dość tej studni') {
      console.log('[AFO_DAILY] Studnia Szczęścia detected - clicking button 2');
      const qb_id = finishBtns.eq(1).attr('data-qb_id');
      DAILY._finishClicked = true;
      GAME.socket.emit('ga', { a: 22, type: 2, button: 2, id: qb_id });
      setTimeout(() => this.afterFinishClick(quest), 1200);
      return;
    }

    // ZADANIE SUBSTANCJI: title starts with "zadanie substancji" and 3 buttons
    if (questTitle.startsWith('zadanie substancji') && finishBtns.length === 3) {
      console.log('[AFO_DAILY] Zadanie Substancji detected - clicking button 3');
      const qb_id = finishBtns.attr('data-qb_id');
      DAILY._finishClicked = true;
      GAME.socket.emit('ga', { a: 22, type: 2, button: 3, id: qb_id });
      setTimeout(() => this.afterFinishClick(quest), 1200);
      return;
    }

    // NUDA: title is "nuda" and 3 buttons
    if (questTitle === 'nuda' && finishBtns.length === 3) {
      console.log('[AFO_DAILY] Nuda detected - clicking button 2');
      const qb_id = finishBtns.attr('data-qb_id');
      DAILY._finishClicked = true;
      GAME.socket.emit('ga', { a: 22, type: 2, button: 2, id: qb_id });
      setTimeout(() => this.afterFinishClick(quest), 1200);
      return;
    }

    // QUEST RIDDLE
    if ($('button[data-option=quest_riddle]').is(':visible')) {
      const qb_id = $('button[data-option=quest_riddle]').attr('data-qid');
      console.log('[AFO_DAILY] Quest riddle detected');
      GAME.socket.emit('ga', { a: 22, type: 7, id: qb_id, ans: $('#quest_riddle').val() });
      setTimeout(() => this.processDialog(quest), 800);
      return;
    }

    // QUEST DUEL
    if ($('button[data-option=quest_duel]').is(':visible')) {
      const fb_id = $('button[data-option=quest_duel]').attr('data-qid');
      console.log('[AFO_DAILY] Quest duel detected');
      GAME.socket.emit('ga', { a: 22, type: 6, id: fb_id });
      setTimeout(() => this.processDialog(quest), 800);
      return;
    }

    // QUEST ACTION (like visiting location)
    if ($('.quest_action').is(':visible')) {
      console.log('[AFO_DAILY] Quest action detected');
      GAME.questAction();
      setTimeout(() => this.processDialog(quest), 800);
      return;
    }

    // Normal finish_quest button handling
    if (finishBtns.length > 0) {
      // Check if requirements are met (or no requirements / ACTION type)
      if (!requires || requires.type === 'ACTION' || requires.current >= requires.target) {
        console.log('[AFO_DAILY] Requirements met, clicking finish button');
        this.clickFinishQuest();
        // Wait longer for dialog to update, then check again
        setTimeout(() => this.afterFinishClick(quest), 1200);
        return;
      }
    }

    // Requirements not met - need to do something
    if (requires && requires.type !== 'ACTION' && requires.current < requires.target) {
      console.log('[AFO_DAILY] Requirements not met:', requires.current, '/', requires.target);
      // Close dialog and handle requirement
      $('#quest_con').hide();
      this.handleQuestRequirement(quest, requires);
      return;
    }

    // No buttons, no requirements - dialog is in limbo state
    // Track attempts to avoid infinite loop
    DAILY._dialogAttempts = (DAILY._dialogAttempts || 0) + 1;
    console.log('[AFO_DAILY] Dialog stuck - attempt', DAILY._dialogAttempts);

    if (DAILY._dialogAttempts >= 10) {
      console.warn('[AFO_DAILY] Dialog stuck after 10 attempts - skipping quest');
      DAILY._dialogAttempts = 0;
      $('#quest_con').hide();
      this.skipQuestWithMark(quest, 'Brak możliwości wykonania');
      return;
    }

    // Wait and check again
    setTimeout(() => this.continueDialog(quest), 800);
  },

  // Called after clicking finish button - check what happened
  afterFinishClick(quest) {
    if (DAILY.stop || DAILY.paused) return;

    // Check if dialog closed
    if (!$('#quest_con').is(':visible')) {
      console.log('[AFO_DAILY] Dialog closed after finish - quest complete');
      DAILY._finishClicked = false;
      this.verifyAndCompleteQuest(quest);
      return;
    }

    // FIRST: Check for special quest types that need specific button clicks
    // These take priority over track_quest green check!
    const finishBtns = $('button[data-option=finish_quest]');
    const questTitle = $('.quest_win .sekcja').text().toLowerCase();

    // STUDNIA SZCZĘŚCIA: 2 buttons where second says "Mam dość tej studni"
    // This means we donated and now need to click "enough" to complete
    if (finishBtns.length === 2 && finishBtns.eq(1).text().trim() === 'Mam dość tej studni') {
      console.log('[AFO_DAILY] Studnia Szczęścia - clicking "Mam dość tej studni" (button 2)');
      const qb_id = finishBtns.eq(1).attr('data-qb_id');
      DAILY._finishClicked = true;
      GAME.socket.emit('ga', { a: 22, type: 2, button: 2, id: qb_id });
      setTimeout(() => this.afterFinishClick(quest), 1500);  // Longer delay for studnia
      return;
    }

    // ZADANIE SUBSTANCJI: title starts with "zadanie substancji" and 3 buttons
    if (questTitle.startsWith('zadanie substancji') && finishBtns.length === 3) {
      console.log('[AFO_DAILY] Zadanie Substancji - clicking button 3');
      const qb_id = finishBtns.attr('data-qb_id');
      DAILY._finishClicked = true;
      GAME.socket.emit('ga', { a: 22, type: 2, button: 3, id: qb_id });
      setTimeout(() => this.afterFinishClick(quest), 1500);
      return;
    }

    // NUDA: title is "nuda" and 3 buttons
    if (questTitle === 'nuda' && finishBtns.length === 3) {
      console.log('[AFO_DAILY] Nuda - clicking button 2');
      const qb_id = finishBtns.attr('data-qb_id');
      DAILY._finishClicked = true;
      GAME.socket.emit('ga', { a: 22, type: 2, button: 2, id: qb_id });
      setTimeout(() => this.afterFinishClick(quest), 1500);
      return;
    }

    // FIRST check if there are NEW requirements (e.g. BOT_KILL stage after dialog)
    // This must be checked BEFORE green status, because track_quest may show green
    // for the PREVIOUS completed requirement, not the new one
    const newRequires = this.parseQuestRequirements();

    if (newRequires && newRequires.type !== 'ACTION' && newRequires.current < newRequires.target) {
      // New stage with new requirements!
      console.log('[AFO_DAILY] New requirements after finish:', newRequires.type, newRequires.current, '/', newRequires.target);
      DAILY._finishClicked = false;
      $('#quest_con').hide();
      this.handleQuestRequirement(quest, newRequires);
      return;
    }

    // NOW check track_quest for completion (green = already done!)
    // Only do this if NO new requirements were found
    const qbId = this.getQuestQbId(quest);
    const trackQuest = $(`#track_quest_${qbId}`);
    if (trackQuest.length > 0 && trackQuest.find('.green').length > 0) {
      // Double-check: make sure there's no "Mam dość tej studni" button
      if (finishBtns.length === 0 || finishBtns.eq(1).text().trim() !== 'Mam dość tej studni') {
        console.log('[AFO_DAILY] Track quest shows green after finish - quest complete');
        DAILY._finishClicked = false;
        $('#quest_con').hide();
        this.verifyAndCompleteQuest(quest);
        return;
      }
    }

    // Still has finish button? Continue clicking
    if (finishBtns.length > 0) {
      console.log('[AFO_DAILY] Still has finish button, clicking again');
      this.clickFinishQuest();
      setTimeout(() => this.afterFinishClick(quest), 1200);
      return;
    }

    // Something else - continue processing
    console.log('[AFO_DAILY] Continuing dialog processing');
    DAILY._finishClicked = false;
    this.processDialog(quest);
  },

  continueDialog(quest) {
    if (DAILY.stop || DAILY.paused) return;

    // Check if quest dialog is still visible
    if (!$('#quest_con').is(':visible')) {
      // Dialog closed after finish click = quest is done!
      if (DAILY._finishClicked) {
        console.log('[AFO_DAILY] Dialog closed after finish - marking complete');
        DAILY._finishClicked = false;
        this.verifyAndCompleteQuest(quest);
        return;
      }
      // Dialog closed = quest might be done
      const questData = this.findQuestByName(quest.name);
      if (!questData) {
        this.verifyAndCompleteQuest(quest);
        return;
      }
      // Quest still there, try dialog again
      setTimeout(() => this.startDialog(quest, questData.qb_id), 500);
      return;
    }

    // Continue processing dialog
    this.processDialog(quest);
  },

  manualQuestProceed() {
    // Fallback quest proceed logic
    if ($("button[data-option=finish_quest]").length >= 1) {
      this.clickFinishQuest();
    } else if ($(".quest_action").is(":visible")) {
      GAME.questAction();
    }
  },

  clickFinishQuest() {
    const btn = $("button[data-option=finish_quest]").first();
    if (btn.length > 0) {
      const qb_id = btn.attr("data-qb_id");
      const button = parseInt(btn.attr("data-button")) || 1;
      console.log('[AFO_DAILY] Clicking finish_quest button:', button, 'qb_id:', qb_id);
      DAILY._finishClicked = true;  // Mark that we clicked finish
      GAME.emitOrder({ a: 22, type: 2, button: button, id: qb_id });
    }
  },

  // Special handler for Studnia Życzeń quests - needs slower timing
  handleStudniaQuest(quest) {
    if (DAILY.stop || DAILY.paused) return;

    console.log('[AFO_DAILY] Handling Studnia Życzeń with slow timing');

    // Check if quest is already completed (GAME.map_quests has [false] for this quest)
    const questData = this.findQuestByName(quest.name);
    if (!questData) {
      console.log('[AFO_DAILY] Studnia quest already completed (not found on map)');
      DAILY._studniaAttempts = 0;
      $('#quest_con').hide();  // Close dialog if still open
      this.onQuestComplete(quest);
      return;
    }

    DAILY._studniaAttempts = (DAILY._studniaAttempts || 0) + 1;

    if (DAILY._studniaAttempts > 20) {
      console.warn('[AFO_DAILY] Studnia: too many attempts, skipping');
      DAILY._studniaAttempts = 0;
      this.skipQuestWithMark(quest, 'Nie udało się ukończyć studni');
      return;
    }

    const finishBtns = $('button[data-option=finish_quest]');

    // Look for "Mam dość tej studni" button (always button 2 when present)
    if (finishBtns.length >= 2) {
      const btn2Text = finishBtns.eq(1).text().trim();
      console.log('[AFO_DAILY] Studnia buttons:', finishBtns.length, 'btn2:', btn2Text);

      if (btn2Text === 'Mam dość tej studni') {
        console.log('[AFO_DAILY] Found "Mam dość" button, clicking');
        const qb_id = finishBtns.eq(1).attr('data-qb_id');
        DAILY._finishClicked = true;
        DAILY._studniaAttempts = 0;
        GAME.socket.emit('ga', { a: 22, type: 2, button: 2, id: qb_id });
        // Much longer delay for studnia - wait for server response
        setTimeout(() => this.afterStudniaClick(quest), 2000);
        return;
      }
    }

    // Only 1 button or no "Mam dość" yet - click first button and wait
    if (finishBtns.length >= 1) {
      console.log('[AFO_DAILY] Studnia: clicking first button, waiting for "Mam dość"');
      const qb_id = finishBtns.first().attr('data-qb_id');
      const button = parseInt(finishBtns.first().attr('data-button')) || 1;
      GAME.socket.emit('ga', { a: 22, type: 2, button: button, id: qb_id });
      // Wait longer, then check for "Mam dość" button
      setTimeout(() => this.handleStudniaQuest(quest), 1500);
      return;
    }

    // No buttons yet - wait
    setTimeout(() => this.handleStudniaQuest(quest), 800);
  },

  afterStudniaClick(quest) {
    if (DAILY.stop || DAILY.paused) return;

    // Check if dialog closed = success
    if (!$('#quest_con').is(':visible')) {
      console.log('[AFO_DAILY] Studnia complete - dialog closed');
      DAILY._finishClicked = false;
      this.verifyAndCompleteQuest(quest);
      return;
    }

    // Dialog still open - might need to click again
    const finishBtns = $('button[data-option=finish_quest]');
    if (finishBtns.length === 0) {
      // No buttons = likely transitioning, wait more
      setTimeout(() => this.afterStudniaClick(quest), 1000);
      return;
    }

    // Continue handling
    this.handleStudniaQuest(quest);
  },

  parseQuestRequirements() {
    const desc = $('#quest_con .quest_desc').text();
    console.log('[AFO_DAILY] parseQuestRequirements desc:', desc.substring(0, 200));

    // Normalize whitespace for easier matching
    const normalizedDesc = desc.replace(/\s+/g, ' ');

    // BOT_KILL: "Pokonaj: MobName(Rank) 20 880/25 000" - numbers may have spaces
    // Also matches "Dowolny przeciwnik(Elita)"
    const mobMatch = normalizedDesc.match(/Pokonaj:\s*([^\(]+)\s*\(([^\)]+)\)\s*([\d\s]+)\s*\/\s*([\d\s]+)/i);
    if (mobMatch) {
      const mobName = mobMatch[1].trim();
      console.log('[AFO_DAILY] BOT_KILL matched:', mobName, mobMatch[2], mobMatch[3], '/', mobMatch[4]);
      return {
        type: 'BOT_KILL',
        mob: mobName.toLowerCase().includes('dowolny') ? 'any' : mobName,
        rank: mobMatch[2].toLowerCase(),
        current: parseInt(mobMatch[3].replace(/\s/g, '')),
        target: parseInt(mobMatch[4].replace(/\s/g, '')),
        isAnyEnemy: mobName.toLowerCase().includes('dowolny')
      };
    }

    // EMPIRE KILL: "Pokonać członków Imperium X 0/20" - empire member kills
    // Empire names: Armi Czerwonej Wstęgi=1, Bogów=2, Demonów Mrozu=3, Saiyan=4
    const empireNameMap = {
      'armi': 1,
      'czerwonej': 1,
      'wstęgi': 1,
      'bogów': 2,
      'bóg': 2,
      'demonów': 3,
      'mrozu': 3,
      'saiyan': 4
    };

    const empMemberMatch = desc.match(/Pokonać\s+członków.*Imperium\s+([^\d]+?)\s*(\d+)\/(\d+)/i);
    if (empMemberMatch) {
      const empireName = empMemberMatch[1].trim().toLowerCase();
      let empireId = 0;

      // Find empire ID from name
      for (const [key, id] of Object.entries(empireNameMap)) {
        if (empireName.includes(key)) {
          empireId = id;
          break;
        }
      }

      console.log('[AFO_DAILY] Empire member kill detected:', empireName, '-> empire', empireId);
      return {
        type: 'PLAYER_KILL',
        targetEmpire: empireId,
        current: parseInt(empMemberMatch[2]),
        target: parseInt(empMemberMatch[3]),
        isEmpireQuest: true
      };
    }

    // Old empire match (fallback)
    const empMatch = desc.match(/wrogów.*Imperium\s+(\d)/i);
    if (empMatch) {
      return {
        type: 'PLAYER_KILL',
        targetEmpire: parseInt(empMatch[1]),
        current: 0,
        target: 10
      };
    }

    const pvpMatch = desc.match(/Pokonaj.*gracz.*(\d+)\/(\d+)/i);
    if (pvpMatch) {
      return {
        type: 'PLAYER_KILL',
        current: parseInt(pvpMatch[1]),
        target: parseInt(pvpMatch[2])
      };
    }

    // PvM POINTS: "Zdobyte punkty PvM 0/500" or "17 412/500" - same as BOT_KILL
    // Note: numbers may have space as thousands separator (e.g. "17 412" = 17412)
    // Use \s+ after PvM to skip whitespace, then capture digits with optional spaces until /
    const pvmMatch = desc.match(/punkty\s+PvM\s+([\d\s]+)\/([\d\s]+)/i);
    if (pvmMatch) {
      const currentVal = parseInt(pvmMatch[1].replace(/\s/g, ''));  // Remove spaces: "17 412" -> 17412
      const targetVal = parseInt(pvmMatch[2].replace(/\s/g, ''));
      console.log('[AFO_DAILY] PvM points parsed:', currentVal, '/', targetVal);
      return {
        type: 'BOT_KILL',  // Treat as bot kill - just fight on current location
        mob: 'any',
        rank: null,  // No specific rank
        current: currentVal,
        target: targetVal,
        isPvmPoints: true  // Flag to indicate it's PvM points, not specific mob
      };
    }

    // PvP WINS: "Wygrane walki PvP 0/10" - need to go to empire and PvP
    const pvpWinsMatch = desc.match(/wygrane\s+walki\s+PvP.*?(\d+)\/(\d+)/i);
    if (pvpWinsMatch) {
      return {
        type: 'PLAYER_KILL',
        current: parseInt(pvpWinsMatch[1]),
        target: parseInt(pvpWinsMatch[2]),
        isPvpWins: true  // Flag for simple PvP wins
      };
    }

    // RESOURCE COLLECT: "Zbierz zasób ResourceName 0/10" - need to mine/gather resources
    // Extract resource name from: <strong class="red3">ResourceName <span>0/10</span></strong>
    const resourceMatch = desc.match(/Zbierz\s+zasób.*?(\d+)\/(\d+)/i);
    if (resourceMatch) {
      // Try to extract resource name from the strong.red3 element
      let resourceName = '';
      const strongEl = $('#quest_con .quest_desc strong.red3');
      if (strongEl.length > 0) {
        // Get text content without the span (which contains the count)
        resourceName = strongEl.clone().children().remove().end().text().trim();
      }
      console.log('[AFO_DAILY] Resource collect detected:', resourceName, resourceMatch[1], '/', resourceMatch[2]);
      return {
        type: 'RESOURCE_COLLECT',
        resourceName: resourceName,
        current: parseInt(resourceMatch[1]),
        target: parseInt(resourceMatch[2])
      };
    }

    // WAIT: "Zaczekać 00:10:00" - timer quest (priority: 1 in JSON)
    const waitMatch = desc.match(/Zaczekać\s+([\d:]+)/i);
    if (waitMatch) {
      const timeString = waitMatch[1];
      const timeSeconds = this.parseTimeToSeconds(timeString);
      console.log('[AFO_DAILY] Wait requirement detected:', timeString, '=', timeSeconds, 'seconds');
      return {
        type: 'WAIT',
        timeString: timeString,
        timeSeconds: timeSeconds,
        current: 0,
        target: 1
      };
    }

    // WYDROPIONE PRZEDMIOTY: "Wydropione przedmioty 0/5 000" - dropped items from killing mobs
    const wydroppedMatch = desc.match(/[Ww]ydropione\s+przedmioty[^\d]*([\d\s]+)\/([\d\s]+)/i);
    if (wydroppedMatch) {
      console.log('[AFO_DAILY] Wydropione przedmioty detected:', wydroppedMatch[1], '/', wydroppedMatch[2]);
      return {
        type: 'BOT_KILL',
        mob: 'any',
        rank: null,
        current: parseInt(wydroppedMatch[1].replace(/\s/g, '')),
        target: parseInt(wydroppedMatch[2].replace(/\s/g, '')),
        isDroppedItems: true
      };
    }

    // ZDOBYTE PRZEDMIOTY: "Zdobyte przedmioty 0/5" - dropped items, treat as BOT_KILL
    const droppedItemsMatch = desc.match(/Zdobyte\s+przedmioty[^\d]*([\d\s]+)\/([\d\s]+)/i);
    if (droppedItemsMatch) {
      console.log('[AFO_DAILY] Dropped items detected:', droppedItemsMatch[1], '/', droppedItemsMatch[2]);
      return {
        type: 'BOT_KILL',
        mob: 'any',
        rank: null,
        current: parseInt(droppedItemsMatch[1].replace(/\s/g, '')),
        target: parseInt(droppedItemsMatch[2].replace(/\s/g, '')),
        isDroppedItems: true
      };
    }

    // ZDOBYC OD: "Zdobyć Sadło od Piaskowy chomik (Legendarny) 0/200"
    const getFromMatch = desc.match(/Zdobyć\s+(.+?)\s+od\s+([^\(]+)\(([^\)]+)\)[^\d]*([\d\s]+)\/([\d\s]+)/i);
    if (getFromMatch) {
      console.log('[AFO_DAILY] Get item from mob detected:', getFromMatch[1], 'from', getFromMatch[2], '(', getFromMatch[3], ')');
      return {
        type: 'BOT_KILL',
        itemName: getFromMatch[1].trim(),
        mob: getFromMatch[2].trim(),
        rank: getFromMatch[3].toLowerCase(),
        current: parseInt(getFromMatch[4].replace(/\s/g, '')),
        target: parseInt(getFromMatch[5].replace(/\s/g, '')),
        isGetItem: true
      };
    }

    // EXPEDITION: "Udaj się na wyprawy 0/10"
    const expeditionMatch = desc.match(/[Uu]daj\s+się\s+na\s+wyprawy.*?(\d+)\/(\d+)/i);
    if (expeditionMatch) {
      console.log('[AFO_DAILY] Expedition detected:', expeditionMatch[1], '/', expeditionMatch[2]);
      return {
        type: 'EXPEDITION',
        current: parseInt(expeditionMatch[1]),
        target: parseInt(expeditionMatch[2])
      };
    }

    // BOUNTY: "Wykonane Listy Gończe PvM 0/60"
    const bountyMatch = desc.match(/[Ww]ykonane\s+[Ll]isty\s+[Gg]ończe.*?(\d+)\/(\d+)/i);
    if (bountyMatch) {
      console.log('[AFO_DAILY] Bounty detected:', bountyMatch[1], '/', bountyMatch[2]);
      return {
        type: 'BOUNTY',
        current: parseInt(bountyMatch[1]),
        target: parseInt(bountyMatch[2])
      };
    }

    return null;
  },

  /**
   * Parse time string like "00:10:00" to seconds
   */
  parseTimeToSeconds(timeStr) {
    const parts = timeStr.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parseInt(timeStr) || 0;
  },

  // ============================================
  // QUEST TYPE HANDLERS
  // ============================================

  handleQuestRequirement(quest, requires) {
    if (DAILY.stop || DAILY.paused) return;

    console.log('[AFO_DAILY] Handling requirement:', requires);
    this.updateStatus(`${quest.name}: ${requires.current}/${requires.target}`);

    // Save original qbId BEFORE we leave the location (important for empire quests!)
    // After going to enemy empire, findQuestByName returns quests from THAT location, not ours
    const questData = this.findQuestByName(quest.name);
    if (questData && questData.qb_id) {
      requires.originalQbId = questData.qb_id;
      console.log('[AFO_DAILY] Saved originalQbId:', requires.originalQbId);
    }

    if (requires.current >= requires.target) {
      // Requirement met, continue dialog
      setTimeout(() => this.continueDialog(quest), 300);
      return;
    }

    switch (requires.type) {
      case 'BOT_KILL':
        this.handleBotKill(quest, requires);
        break;
      case 'PLAYER_KILL':
        this.handlePlayerKill(quest, requires);
        break;
      case 'RESOURCE_COLLECT':
        this.handleResourceCollect(quest, requires);
        break;
      case 'WAIT':
        this.handleWaitQuest(quest, requires);
        break;
      case 'EXPEDITION':
        this.handleExpedition(quest, requires);
        break;
      case 'BOUNTY':
        this.handleBounty(quest, requires);
        break;
      default:
        // Unknown type, try to continue
        setTimeout(() => this.continueDialog(quest), 500);
    }
  },

  /**
   * Handle timer quest - add to waiting queue and continue with other quests
   * If useCompressor is enabled, skip the timer immediately
   */
  handleWaitQuest(quest, requires) {
    if (DAILY.stop || DAILY.paused) return;

    const qbId = requires.originalQbId || this.getQuestQbId(quest);
    console.log('[AFO_DAILY] Handling WAIT quest:', quest.name, 'qbId:', qbId, 'timeSeconds:', requires.timeSeconds);

    // If timer is already 0 or expired, the quest is ready to complete - continue dialog immediately
    if (requires.timeSeconds <= 0) {
      console.log('[AFO_DAILY] Timer already at 0 - quest ready to complete');
      this.updateStatus(`${quest.name}: Timer zakończony, kończę quest`);
      setTimeout(() => this.continueDialog(quest), 500);
      return;
    }

    // Check track_quest to see if timer already expired
    const trackQuest = $(`#track_quest_${qbId}`);
    if (trackQuest.length > 0) {
      // If track_quest has green class, timer is done
      if (trackQuest.find('.green').length > 0) {
        console.log('[AFO_DAILY] Track quest shows green - quest ready to complete');
        setTimeout(() => this.continueDialog(quest), 500);
        return;
      }

      // Check data-end to see if already expired
      const timerEl = trackQuest.find('.timer[data-end]');
      if (timerEl.length > 0) {
        const dataEnd = parseInt(timerEl.attr('data-end'));
        if (dataEnd > 0 && dataEnd * 1000 <= Date.now()) {
          console.log('[AFO_DAILY] Timer data-end shows expired - quest ready to complete');
          setTimeout(() => this.continueDialog(quest), 500);
          return;
        }
      }
    }

    // If useCompressor is enabled, use compressor to skip timer
    if (DAILY.useCompressor) {
      console.log('[AFO_DAILY] useCompressor enabled - attempting to use compressor');
      this.updateStatus(`${quest.name}: Używam zegarka...`);

      // Check if compressor button is visible in dialog
      const compressBtn = $('button[data-option="compress_items"]');

      if (compressBtn.length > 0 && GAME.compress_items && GAME.compress_items[0] && GAME.compress_items[0].stack > 0) {
        // Use the compressor - same logic as combat.js useCompressor()
        const compressorQbId = compressBtn.attr('data-qb_id');
        console.log('[AFO_DAILY] Using compressor with item:', GAME.compress_items[0].id, 'on quest:', compressorQbId);

        GAME.socket.emit('ga', {
          a: 22,
          type: 10,
          item_id: GAME.compress_items[0].id,
          qb_id: compressorQbId
        });

        // Wait and continue dialog to check if quest can be finished
        setTimeout(() => this.continueDialog(quest), 1500);
        return;
      } else {
        // No compressor available or no items - fall back to waiting queue
        console.log('[AFO_DAILY] Compressor button not found or no items, falling back to wait queue');
        // Don't return - let it fall through to waiting queue logic below
      }
    }

    // Get end time from track_quest timer data-end attribute (reuse trackQuest from above)
    let endTime = Date.now() + (requires.timeSeconds * 1000); // Fallback

    const trackQuestEl = $(`#track_quest_${qbId}`);
    if (trackQuestEl.length > 0) {
      const timerEl = trackQuestEl.find('.timer[data-end]');
      if (timerEl.length > 0) {
        const dataEnd = parseInt(timerEl.attr('data-end'));
        if (dataEnd > 0) {
          // data-end is Unix timestamp in seconds
          endTime = dataEnd * 1000;
          console.log('[AFO_DAILY] Got endTime from track_quest data-end:', new Date(endTime));
        }
      }
    }

    // Add quest to waiting queue
    const waitData = {
      name: quest.name,
      quest: quest,
      requires: requires,
      endTime: endTime,
      qbId: qbId
    };

    if (!DAILY.waitingQuests) {
      DAILY.waitingQuests = [];
    }

    // Don't add duplicate
    if (!DAILY.waitingQuests.some(w => w.name === quest.name)) {
      DAILY.waitingQuests.push(waitData);
      console.log('[AFO_DAILY] Added to waiting queue:', quest.name, 'until', new Date(endTime));
    }

    // Update UI and start timer update interval for smooth countdown
    this.renderQuestList();
    this.startWaitingTimerUpdate();  // Start 1-second timer updates immediately
    this.updateStatus(`${quest.name}: Czekam, kontynuuję inne`);
    GAME.komunikat(`[DZIENNE] ${quest.name} - czekam, kontynuuję inne questy`);

    // Close dialog and continue with other quests
    $('#quest_con').hide();

    // Advance to next quest - waiting quests will be checked at end
    this.advanceQuestQueue();
  },

  /**
   * Handle expedition quests using AUTO EXPEDITIONS system
   * Starts auto expeditions, monitors progress, stops when complete
   */
  handleExpedition(quest, requires) {
    if (DAILY.stop || DAILY.paused) return;

    console.log('[AFO_DAILY] Expedition quest detected:', quest.name, requires.current, '/', requires.target);

    // Initialize expedition tracking state
    DAILY._expeditionQuest = quest;
    DAILY._expeditionRequires = requires;
    DAILY._expeditionLastProgress = requires.current;

    this.updateStatus(`${quest.name}: Wyprawy (${requires.current}/${requires.target})`);

    // Close dialog before starting expeditions
    $('#quest_con').hide();

    // Start expedition loop
    this.expeditionLoop();
  },

  /**
   * Main expedition loop - monitors progress and handles completion
   */
  expeditionLoop() {
    if (DAILY.stop || DAILY.paused) return;

    const quest = DAILY._expeditionQuest;
    const requires = DAILY._expeditionRequires;

    if (!quest || !requires) {
      console.warn('[AFO_DAILY] Expedition state lost, skipping');
      this.skipQuestWithMark(quest || { name: 'Unknown' }, 'Błąd stanu ekspedycji');
      return;
    }

    const qbId = requires.originalQbId || this.getQuestQbId(quest);
    const trackQuest = $(`#track_quest_${qbId}`);

    // Check if requirements met (green status)
    if (trackQuest.length > 0 && trackQuest.find('.green').length > 0) {
      console.log('[AFO_DAILY] Expedition quest complete!');
      this.onExpeditionComplete(quest);
      return;
    }

    // Get current progress
    let currentProgress = requires.current;
    const questSpan = $(`.quest_warunek${qbId}`);
    if (questSpan.length > 0) {
      currentProgress = parseInt(questSpan.attr('data-count')) || 0;
    }

    this.updateStatus(`${quest.name}: ${currentProgress}/${requires.target}`);

    // Update progress tracking
    if (currentProgress > DAILY._expeditionLastProgress) {
      DAILY._expeditionLastProgress = currentProgress;
      console.log('[AFO_DAILY] Expedition progress:', currentProgress, '/', requires.target);
    }

    // Check if we've reached target-1 and expedition is in progress
    // When at 9/10 and expedition started, we need to wait for it to finish
    if (currentProgress >= requires.target - 1) {
      // Check if auto expeditions is still needed
      if (currentProgress >= requires.target) {
        // Target reached, stop and complete
        this.onExpeditionComplete(quest);
        return;
      }
    }

    // Ensure auto expeditions is running
    if (typeof kws !== 'undefined' && !kws.autoExpeditions) {
      console.log('[AFO_DAILY] Starting auto expeditions');
      kws.manageAutoExpeditions();  // Toggle ON
    }

    // Continue monitoring every 5 seconds (expeditions take ~5 min each)
    setTimeout(() => this.expeditionLoop(), 5000);
  },

  /**
   * Called when expedition quest requirements are met
   */
  onExpeditionComplete(quest) {
    console.log('[AFO_DAILY] Expedition quest complete:', quest.name);

    // Stop auto expeditions if running
    if (typeof kws !== 'undefined' && kws.autoExpeditions) {
      console.log('[AFO_DAILY] Stopping auto expeditions');
      kws.manageAutoExpeditions();  // Toggle OFF
    }

    // Clear expedition state
    DAILY._expeditionQuest = null;
    DAILY._expeditionRequires = null;

    // Return to quest NPC to complete
    this.navigateToQuestNPC(quest);
  },

  /**
   * Handle bounty quests using LPVM module
   * Uses GAME.char_data.reborn, decreases born on issues, min born=2
   */
  handleBounty(quest, requires) {
    if (DAILY.stop || DAILY.paused) return;

    console.log('[AFO_DAILY] Bounty quest detected:', quest.name, requires.current, '/', requires.target);

    // Initialize bounty tracking state
    DAILY._bountyQuest = quest;
    DAILY._bountyRequires = requires;
    DAILY._bountyBorn = GAME.char_data.reborn;  // Start with current reborn
    DAILY._bountyLastProgress = requires.current;
    DAILY._bountyLastProgressTime = Date.now();
    DAILY._bountyTeleportTime = 0;
    DAILY._bountyLastLocId = GAME.char_data.loc;

    this.updateStatus(`${quest.name}: Listy gończe (${requires.current}/${requires.target})`);

    // Close dialog before starting LPVM
    $('#quest_con').hide();

    // Start bounty loop
    this.bountyLoop();
  },

  /**
   * Main bounty loop - monitors LPVM progress and handles issues
   */
  bountyLoop() {
    if (DAILY.stop || DAILY.paused) return;

    const quest = DAILY._bountyQuest;
    const requires = DAILY._bountyRequires;

    if (!quest || !requires) {
      console.warn('[AFO_DAILY] Bounty state lost, skipping');
      this.skipQuestWithMark(quest || { name: 'Unknown' }, 'Błąd stanu bounty');
      return;
    }

    const qbId = requires.originalQbId || this.getQuestQbId(quest);
    const trackQuest = $(`#track_quest_${qbId}`);

    // Check if requirements met (green status)
    if (trackQuest.length > 0 && trackQuest.find('.green').length > 0) {
      console.log('[AFO_DAILY] Bounty quest complete!');
      this.onBountyComplete(quest);
      return;
    }

    // Get current progress
    let currentProgress = requires.current;
    const questSpan = $(`.quest_warunek${qbId}`);
    if (questSpan.length > 0) {
      currentProgress = parseInt(questSpan.attr('data-count')) || 0;
    }

    this.updateStatus(`${quest.name}: ${currentProgress}/${requires.target}`);

    const now = Date.now();

    // Check for stuck conditions
    let shouldReduceBorn = false;
    let stuckReason = '';

    // Condition 1: Teleport didn't change location within 2s
    if (DAILY._bountyTeleportTime > 0 &&
      now - DAILY._bountyTeleportTime > 2000 &&
      GAME.char_data.loc === DAILY._bountyLastLocId) {
      console.warn('[AFO_DAILY] Bounty: Teleport failed to change location');
      shouldReduceBorn = true;
      stuckReason = 'Teleport nie działa';
      DAILY._bountyTeleportTime = 0;  // Reset
    }

    // Condition 2: No progress for 10 seconds
    if (currentProgress > DAILY._bountyLastProgress) {
      // Progress made - reset tracking
      DAILY._bountyLastProgress = currentProgress;
      DAILY._bountyLastProgressTime = now;
    } else if (now - DAILY._bountyLastProgressTime > 10000) {
      console.warn('[AFO_DAILY] Bounty: No progress for 10 seconds');
      shouldReduceBorn = true;
      stuckReason = 'Brak postępu przez 10s';
      DAILY._bountyLastProgressTime = now;  // Reset timer
    }

    // Handle born reduction
    if (shouldReduceBorn) {
      if (DAILY._bountyBorn > 2) {
        DAILY._bountyBorn--;
        console.log('[AFO_DAILY] Bounty: Reducing born to', DAILY._bountyBorn, 'reason:', stuckReason);
        GAME.komunikat(`[DZIENNE] ${stuckReason} - zmniejszam born do ${DAILY._bountyBorn}`);

        // Restart LPVM with new born
        this.stopLPVM();
        setTimeout(() => this.startLPVM(), 500);
      } else {
        // Already at minimum born - skip quest
        console.warn('[AFO_DAILY] Bounty: At minimum born, skipping quest');
        this.stopLPVM();
        this.skipQuestWithMark(quest, 'Nie udało się na born 2');
        return;
      }
    }

    // Ensure LPVM is running
    if (LPVM.Stop) {
      this.startLPVM();
    }

    // Update teleport tracking (detect when LPVM teleports)
    if (GAME.char_data.loc !== DAILY._bountyLastLocId) {
      DAILY._bountyLastLocId = GAME.char_data.loc;
      DAILY._bountyTeleportTime = 0;  // Clear - teleport succeeded
    }

    // Continue monitoring
    setTimeout(() => this.bountyLoop(), 1000);
  },

  /**
   * Start LPVM for bounty hunting
   */
  startLPVM() {
    if (typeof AFO_LPVM === 'undefined' || typeof LPVM === 'undefined') {
      console.warn('[AFO_DAILY] LPVM module not available');
      this.skipQuestWithMark(DAILY._bountyQuest, 'LPVM niedostępny');
      return;
    }

    console.log('[AFO_DAILY] Starting LPVM with born:', DAILY._bountyBorn);

    // Configure LPVM
    LPVM.Born = DAILY._bountyBorn;
    LPVM.limit = true;
    LPVM.limit2 = 100;  // Max 100 bounties per run
    LPVM.pvm_killed = 0;
    LPVM.Stop = false;

    // Stop other modules
    RESP.stop = true;
    RES.stop = true;
    PVP.stop = true;
    CODE.stop = true;

    // Track when teleport starts
    DAILY._bountyLastLocId = GAME.char_data.loc;
    DAILY._bountyTeleportTime = Date.now();

    // Start LPVM
    AFO_LPVM.Start();
  },

  /**
   * Stop LPVM
   */
  stopLPVM() {
    if (typeof LPVM !== 'undefined') {
      LPVM.Stop = true;
    }
  },

  /**
   * Stop auto expeditions if running
   */
  stopAutoExpeditions() {
    if (typeof kws !== 'undefined' && kws.autoExpeditions) {
      console.log('[AFO_DAILY] Stopping auto expeditions');
      kws.manageAutoExpeditions();  // Toggle OFF
    }
  },

  /**
   * Called when bounty quest requirements are met
   */
  onBountyComplete(quest) {
    console.log('[AFO_DAILY] Bounty quest complete:', quest.name);

    // Stop LPVM
    this.stopLPVM();

    // Clear bounty state
    DAILY._bountyQuest = null;
    DAILY._bountyRequires = null;
    DAILY._bountyBorn = 0;

    // Return to quest location and complete dialog
    const locId = quest.location?.locId;
    if (locId && GAME.char_data.loc !== locId) {
      console.log('[AFO_DAILY] Returning to quest location:', locId);
      this.updateStatus(`${quest.name}: Wracam zakończyć...`);
      DAILY.isTeleporting = true;
      DAILY._currentQuest = quest;
      GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });
      // Continue via handleSockets -> afterTeleport -> navigateToQuestNPC
    } else {
      // Already on location
      this.navigateToQuestNPC(quest);
    }
  },

  handleResourceCollect(quest, requires) {
    if (DAILY.stop || DAILY.paused) return;

    DAILY.isInCombat = true;  // Reuse combat flag for resource collection
    DAILY._combatQuest = quest;
    DAILY._combatRequires = requires;

    this.updateStatus(`${quest.name}: Zbieram ${requires.resourceName || 'zasoby'} ${requires.current}/${requires.target}`);
    console.log('[AFO_DAILY] Starting resource collection for:', requires.resourceName);

    // Find resource ID in GAME.map_mines.mine_data by name
    if (requires.resourceName && typeof GAME.map_mines !== 'undefined') {
      const mineData = Object.entries(GAME.map_mines.mine_data || {});
      let resourceId = null;

      for (const [key, mine] of mineData) {
        if (mine.name && mine.name.includes(requires.resourceName)) {
          resourceId = mine.id;
          console.log('[AFO_DAILY] Found resource ID:', resourceId, 'for', mine.name);
          break;
        }
      }

      if (resourceId) {
        requires.resourceId = resourceId;
      } else {
        console.warn('[AFO_DAILY] Resource not found on map:', requires.resourceName);
        // List available resources
        console.log('[AFO_DAILY] Available resources:', mineData.map(m => m[1].name));
      }
    }

    // Start resource collection loop
    this.resourceCollectLoop(quest, requires);
  },

  resourceCollectLoop(quest, requires) {
    if (DAILY.stop || DAILY.paused) return;

    // Check if requirements met via track_quest .green class (most reliable)
    const qbId = requires.originalQbId;
    if (qbId) {
      const trackQuest = $(`#track_quest_${qbId}`);

      // First check for .green class on the strong element - this means complete!
      if (trackQuest.find('strong.green').length > 0) {
        console.log('[AFO_DAILY] Resource track_quest shows green - complete!');
        this.onResourceComplete(quest);
        return;
      }

      // Also check quest_warunek span - parse TEXT not data-count (game updates text only!)
      const questSpan = $(`.quest_warunek${qbId}`);
      if (questSpan.length > 0) {
        const spanText = questSpan.text().trim();
        // Parse "7/10" or "5 140 /10 000" format
        const slashIdx = spanText.indexOf('/');
        let current = 0;
        let target = requires.target;

        if (slashIdx > -1) {
          current = parseInt(spanText.substring(0, slashIdx).replace(/\s/g, '')) || 0;
          target = parseInt(spanText.substring(slashIdx + 1).replace(/\s/g, '')) || requires.target;
        }

        this.updateStatus(`${quest.name}: ${current}/${target}`);

        if (current >= target) {
          console.log('[AFO_DAILY] Resource collection complete:', current, '/', target);
          this.onResourceComplete(quest);
          return;
        }
      }
    }

    // Try to use AFO_RES if available and we have resource ID
    if (typeof AFO_RES !== 'undefined' && typeof RES !== 'undefined' && requires.resourceId) {
      if (RES.stop) {
        console.log('[AFO_DAILY] Configuring and starting AFO_RES for resource:', requires.resourceId);

        // Configure RES to mine the specific resource
        RES.mined_id = [requires.resourceId];  // Only mine this specific resource
        RES.refresh_mines = true;  // Refresh mine positions
        RES.loc = GAME.char_data.loc;  // Set current location
        RES.stop = false;

        // Stop other modules
        PVP.stop = true;
        RESP.stop = true;
        LPVM.Stop = true;
        CODE.stop = true;

        AFO_RES.Start();  // Note: capital S!
      }
      // Monitor progress
      setTimeout(() => this.resourceCollectLoop(quest, requires), 1500);
      return;
    }

    // Fallback: try to start mining manually if no AFO_RES or no resourceId
    const mineBtn = $('button[data-option=start_mine]');
    if (mineBtn.length > 0) {
      const mineId = mineBtn.attr('data-mid');
      console.log('[AFO_DAILY] Starting mine manually:', mineId);
      GAME.socket.emit('ga', { a: 22, type: 8, mid: parseInt(mineId) });
    }

    // Continue monitoring
    setTimeout(() => this.resourceCollectLoop(quest, requires), 1500);
  },

  onResourceComplete(quest) {
    console.log('[AFO_DAILY] Resource collection complete for:', quest.name);
    DAILY.isInCombat = false;

    // Stop AFO_RES if running
    if (typeof RES !== 'undefined') {
      RES.stop = true;
    }

    // Need to return to quest location first, then reopen dialog
    const locId = quest.location?.locId;
    const currentLoc = GAME.char_data.loc;

    if (locId && currentLoc !== locId) {
      // Teleport back to quest location
      console.log('[AFO_DAILY] Returning to quest location:', locId);
      this.updateStatus('Wracam do lokacji questa...');
      DAILY.isTeleporting = true;
      DAILY._currentQuest = quest;
      GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });
      // Continue in handleSockets -> afterTeleport -> navigateToQuestNPC
    } else {
      // Already on correct location - just navigate to NPC
      setTimeout(() => this.navigateToQuestNPC(quest), 800);
    }
  },

  // ============================================
  // SPECIAL HANDLER: ANIELSKA KARTA BATCH
  // ============================================

  /**
   * Special handler for "Anielska karta" quests from Nowa niebiańska kuźnia
   * Flow: Accept LvL1-3 -> teleport to combat -> progressive filter fight -> return and complete all + LvL4
   */
  handleAnielskaBatch(triggerQuest) {
    if (DAILY.stop || DAILY.paused) return;

    console.log('[AFO_DAILY] Starting Anielska karta batch handler');
    DAILY._anielskaBatchActive = true;

    // Find all Anielska karta quests from queue that need BOT_KILL (LvL1-3)
    // LvL4 and LvL5 are ACTION only, handled separately
    const anielskaCombatQuests = DAILY.questQueue.filter(q =>
      q.name.startsWith('Anielska karta[LvL') &&
      q.stages?.some(s => s.type === 'BOT_KILL') &&
      !DAILY.completedQuests.includes(q.name) &&
      !DAILY.skippedQuests.includes(q.name)
    );

    // Find LvL4 (ACTION only, premium)
    const lvl4Quest = DAILY.questQueue.find(q =>
      q.name === 'Anielska karta[LvL4]' &&
      !DAILY.completedQuests.includes(q.name) &&
      !DAILY.skippedQuests.includes(q.name)
    );

    console.log('[AFO_DAILY] Anielska combat quests:', anielskaCombatQuests.map(q => q.name));
    console.log('[AFO_DAILY] Anielska LvL4:', lvl4Quest?.name || 'none');

    if (anielskaCombatQuests.length === 0) {
      // No combat quests, just process LvL4 if available
      DAILY._anielskaBatchActive = false;
      if (lvl4Quest) {
        this.processQuest(lvl4Quest);
      } else {
        // Skip all anielska quests from queue
        this.skipAnielskaBatch();
      }
      return;
    }

    // Store for later
    DAILY._anielskaCombatQuests = anielskaCombatQuests;
    DAILY._anielskaCombatIdx = 0;
    DAILY._anielskLvl4Quest = lvl4Quest;
    DAILY._anielskAcceptedQbIds = [];

    // Step 1: Go to location and accept all quests
    this.updateStatus('Anielska: Pobieram zadania...');
    this.anielskaTeleportAndAccept();
  },

  anielskaTeleportAndAccept() {
    if (DAILY.stop || DAILY.paused) return;

    const locId = 1245; // Nowa niebiańska kuźnia

    if (GAME.char_data.loc === locId) {
      // Already there, start accepting
      setTimeout(() => this.anielskaAcceptNext(), 500);
    } else {
      // Teleport - use direct setTimeout, don't rely on afterTeleport callback
      console.log('[AFO_DAILY] Anielska: Teleporting to location', locId);
      DAILY._anielskaTeleporting = true;  // Flag to bypass normal afterTeleport flow
      GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });

      // Wait 2s for teleport to complete, then start accepting
      setTimeout(() => {
        if (DAILY.stop || DAILY.paused) return;
        DAILY._anielskaTeleporting = false;
        console.log('[AFO_DAILY] Anielska: Teleport complete, starting accept');
        this.anielskaAcceptNext();
      }, 2000);
    }
  },

  anielskaAcceptNext() {
    if (DAILY.stop || DAILY.paused) return;

    const quests = DAILY._anielskaCombatQuests;
    const idx = DAILY._anielskaCombatIdx;

    if (idx >= quests.length) {
      // All quests accepted, also accept LvL4 if available
      if (DAILY._anielskLvl4Quest) {
        console.log('[AFO_DAILY] Anielska: Accepting LvL4');
        this.anielskaAcceptLvl4();
      } else {
        // Go to combat
        console.log('[AFO_DAILY] Anielska: All quests accepted, starting combat');
        setTimeout(() => this.anielskaStartCombat(), 500);
      }
      return;
    }

    const quest = quests[idx];
    console.log('[AFO_DAILY] Anielska: Accepting quest', quest.name);
    this.updateStatus(`Anielska: ${quest.name}`);

    // Find quest on map
    const questData = this.findQuestByName(quest.name);
    if (!questData) {
      console.log('[AFO_DAILY] Anielska: Quest not on map, skipping:', quest.name);
      DAILY._anielskaCombatIdx++;
      setTimeout(() => this.anielskaAcceptNext(), 300);
      return;
    }

    // Save qb_id for later tracking
    DAILY._anielskAcceptedQbIds.push({ name: quest.name, qbId: questData.qb_id });

    // Navigate to NPC and start dialog loop
    this.navigateToCoords(questData.coords[0], questData.coords[1], () => {
      // Open dialog
      GAME.emitOrder({ a: 22, type: 1, id: questData.qb_id });

      // Start looping through dialog stages until we see BOT_KILL requirement
      setTimeout(() => this.anielskaDialogLoop(quest, questData.qb_id, 0), 800);
    });
  },

  /**
   * Loop through dialog stages until we reach BOT_KILL requirement (Dowolny przeciwnik)
   * Then close dialog and move to next quest
   */
  anielskaDialogLoop(quest, qbId, attempts) {
    if (DAILY.stop || DAILY.paused) return;

    // Safety limit
    if (attempts > 15) {
      console.warn('[AFO_DAILY] Anielska: Too many dialog attempts for', quest.name);
      $('#quest_con').hide();
      DAILY._anielskaCombatIdx++;
      setTimeout(() => this.anielskaAcceptNext(), 500);
      return;
    }

    // Check if we've reached the BOT_KILL stage (Dowolny przeciwnik)
    const questDesc = $('.quest_desc').text();
    if (questDesc.includes('Dowolny przeciwnik') || questDesc.includes('Pokonaj:')) {
      // We're at BOT_KILL stage - quest is "accepted", close and move on
      console.log('[AFO_DAILY] Anielska: Quest', quest.name, 'reached BOT_KILL stage');
      $('#quest_con').hide();
      DAILY._anielskaCombatIdx++;
      setTimeout(() => this.anielskaAcceptNext(), 500);
      return;
    }

    // Not at BOT_KILL yet - click finish button to advance dialog
    const finishBtn = $('button[data-option=finish_quest]').first();
    if (finishBtn.length > 0) {
      const btnQbId = finishBtn.attr('data-qb_id');
      const button = parseInt(finishBtn.attr('data-button')) || 1;
      console.log('[AFO_DAILY] Anielska: Dialog step', attempts, 'for', quest.name);
      GAME.socket.emit('ga', { a: 22, type: 2, button: button, id: btnQbId });

      // Wait and check again
      setTimeout(() => this.anielskaDialogLoop(quest, qbId, attempts + 1), 800);
    } else {
      // No finish button - maybe dialog closed or still loading
      console.log('[AFO_DAILY] Anielska: No finish button, waiting...');
      setTimeout(() => this.anielskaDialogLoop(quest, qbId, attempts + 1), 500);
    }
  },

  anielskaAcceptLvl4() {
    if (DAILY.stop || DAILY.paused) return;

    const quest = DAILY._anielskLvl4Quest;
    const questData = this.findQuestByName(quest.name);

    if (!questData) {
      console.log('[AFO_DAILY] Anielska: LvL4 not on map');
      setTimeout(() => this.anielskaStartCombat(), 500);
      return;
    }

    // Navigate to LvL4 NPC and accept
    this.navigateToCoords(questData.coords[0], questData.coords[1], () => {
      GAME.emitOrder({ a: 22, type: 1, id: questData.qb_id });

      setTimeout(() => {
        const finishBtn = $('button[data-option=finish_quest]').first();
        if (finishBtn.length > 0) {
          const qbId = finishBtn.attr('data-qb_id');
          const button = parseInt(finishBtn.attr('data-button')) || 1;
          console.log('[AFO_DAILY] Anielska: Clicking accept for LvL4');
          GAME.socket.emit('ga', { a: 22, type: 2, button: button, id: qbId });
        }

        setTimeout(() => {
          $('#quest_con').hide();
          this.anielskaStartCombat();
        }, 800);
      }, 800);
    });
  },

  anielskaStartCombat() {
    if (DAILY.stop || DAILY.paused) return;

    // Check if useCombatLocation and teleport if needed
    if (DAILY.combatLoc && DAILY.combatLoc !== 'current') {
      const locId = parseInt(DAILY.combatLoc);
      if (GAME.char_data.loc !== locId) {
        console.log('[AFO_DAILY] Anielska: Teleporting to combat location', locId);
        this.updateStatus('Anielska: Teleport do walki...');
        GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });

        setTimeout(() => {
          if (DAILY.stop || DAILY.paused) return;
          this.anielskaSetFilterAndFight();
        }, 2000);
        return;
      }
    }

    this.anielskaSetFilterAndFight();
  },

  anielskaSetFilterAndFight() {
    if (DAILY.stop || DAILY.paused) return;

    console.log('[AFO_DAILY] Anielska: Starting combat with progressive filter');
    this.updateStatus('Anielska: Walka...');

    // Set initial filter: legendary + epic + mystic (indexes 3, 4, 5)
    // Ignore: normal(0), champion(1), elite(2)
    DAILY._anielskaIgnore = [true, true, true, false, false, false];
    this.setSpawnerCheckboxes(DAILY._anielskaIgnore);

    // Start combat loop
    this.anielskaCombatLoop();
  },

  anielskaCombatLoop() {
    if (DAILY.stop || DAILY.paused) return;

    // Periodic refresh - every 5 seconds, pause for 1.5 seconds to let game catch up
    // This mirrors the logic in combatLoop() for regular BOT_KILL quests
    const now = Date.now();
    if (!DAILY._anielskaLastRefresh) DAILY._anielskaLastRefresh = now;

    if (now - DAILY._anielskaLastRefresh >= 5000) {
      DAILY._anielskaLastRefresh = now;
      console.log('[AFO_DAILY] Anielska: Refresh pause for counter update');
      this.updateStatus('Anielska: Odświeżanie...');

      // Wait 1.5 seconds for game to process drops and update counters
      setTimeout(() => {
        if (DAILY.stop || DAILY.paused) return;
        this.anielskaCombatLoop();
      }, 1500);
      return;
    }

    // Check progress for each quest
    const qbIds = DAILY._anielskAcceptedQbIds;
    let allComplete = true;
    let lvl1Done = false;
    let lvl2Done = false;
    let lvl3Done = false;

    for (const item of qbIds) {
      const trackQuest = $(`#track_quest_${item.qbId}`);
      const isGreen = trackQuest.find('.green').length > 0;

      if (item.name.includes('LvL1]')) lvl1Done = isGreen;
      else if (item.name.includes('LvL2]')) lvl2Done = isGreen;
      else if (item.name.includes('LvL3]')) lvl3Done = isGreen;

      if (!isGreen) allComplete = false;
    }

    console.log('[AFO_DAILY] Anielska progress - LvL1:', lvl1Done, 'LvL2:', lvl2Done, 'LvL3:', lvl3Done);

    if (allComplete) {
      console.log('[AFO_DAILY] Anielska: All combat complete!');
      this.anielskaReturnAndComplete();
      return;
    }

    // Adjust filter based on progress
    // LvL1 wants mystic (index 5), LvL2 wants epic (index 4), LvL3 wants legendary (index 3)
    let newIgnore = [...DAILY._anielskaIgnore];

    if (lvl1Done && !newIgnore[5]) {
      // Mystic done (LvL1) - stop spawning mystic
      console.log('[AFO_DAILY] Anielska: LvL1 done, disabling mystic spawn');
      newIgnore[5] = true;
    }
    if (lvl2Done && !newIgnore[4]) {
      // Epic done (LvL2) - stop spawning epic
      console.log('[AFO_DAILY] Anielska: LvL2 done, disabling epic spawn');
      newIgnore[4] = true;
    }
    if (lvl3Done && !newIgnore[3]) {
      // Legendary done (LvL3) - stop spawning legendary
      console.log('[AFO_DAILY] Anielska: LvL3 done, disabling legendary spawn');
      newIgnore[3] = true;
    }

    // Update filter if changed
    if (JSON.stringify(newIgnore) !== JSON.stringify(DAILY._anielskaIgnore)) {
      DAILY._anielskaIgnore = newIgnore;
      this.setSpawnerCheckboxes(newIgnore);
    }

    // Update status
    const remaining = [!lvl1Done && 'LvL1', !lvl2Done && 'LvL2', !lvl3Done && 'LvL3'].filter(Boolean);
    this.updateStatus(`Anielska: ${remaining.join(', ')}`);

    // Check prereqs and fight
    if (this.checkCombatPrereqs()) {
      setTimeout(() => this.anielskaCombatLoop(), 1700);
      return;
    }

    // Fight using existing doFight logic but with our filter
    const mobCount = this.getMobCount();
    const spawnerIgnore = DAILY._anielskaIgnore;

    if (mobCount > 0) {
      const fm = GAME.field_mobs;
      const fmf = GAME.field_mf;
      const fmi = GAME.field_mob_id;

      if (fmi && fm && fm[fmi - 1] &&
        ((mobCount > 0 && fmf[fmi - 1] < 0) && fm[fmi - 1].ranks[0] ||
          (mobCount > 0 && fmf[fmi - 1] < 1 && fm[fmi - 1].ranks[1]) ||
          (mobCount > 0 && fmf[fmi - 1] < 2 && fm[fmi - 1].ranks[2]) ||
          (mobCount > 0 && fmf[fmi - 1] < 3 && fm[fmi - 1].ranks[3]) ||
          (mobCount > 0 && fmf[fmi - 1] < 4 && fm[fmi - 1].ranks[4]) ||
          (mobCount > 0 && fmf[fmi - 1] < 5 && fm[fmi - 1].ranks[5]))) {
        GAME.socket.emit('ga', { a: 7, order: 2, quick: 1, fo: GAME.map_options.ma });
      } else if (this.getMobCount2() > 0) {
        GAME.socket.emit('ga', { a: 13, mob_num: fmi, fo: GAME.map_options.ma });
      } else {
        GAME.socket.emit('ga', { a: 444, max: GAME.spawner[0], ignore: spawnerIgnore });
      }
    } else {
      GAME.socket.emit('ga', { a: 444, max: GAME.spawner[0], ignore: spawnerIgnore });
    }

    setTimeout(() => this.anielskaCombatLoop(), DAILY.wait);
  },

  anielskaReturnAndComplete() {
    if (DAILY.stop || DAILY.paused) return;

    console.log('[AFO_DAILY] Anielska: Returning to complete quests');
    this.updateStatus('Anielska: Wracam zakończyć...');

    const locId = 1245; // Nowa niebiańska kuźnia

    if (GAME.char_data.loc !== locId) {
      GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });
      setTimeout(() => {
        if (DAILY.stop || DAILY.paused) return;
        this.anielskaCompleteNext(0);
      }, 2000);
    } else {
      setTimeout(() => this.anielskaCompleteNext(0), 500);
    }
  },

  anielskaCompleteNext(idx) {
    if (DAILY.stop || DAILY.paused) return;

    const quests = DAILY._anielskaCombatQuests;

    if (idx >= quests.length) {
      // All combat quests complete, now do LvL4
      if (DAILY._anielskLvl4Quest) {
        this.anielskaCompleteLvl4();
      } else {
        this.anielskaFinish();
      }
      return;
    }

    const quest = quests[idx];
    console.log('[AFO_DAILY] Anielska: Completing', quest.name);
    this.updateStatus(`Anielska: ${quest.name}`);

    const questData = this.findQuestByName(quest.name);
    if (!questData) {
      // Already completed or not found
      this.markQuestComplete(quest.name);
      setTimeout(() => this.anielskaCompleteNext(idx + 1), 300);
      return;
    }

    // Navigate and complete
    this.navigateToCoords(questData.coords[0], questData.coords[1], () => {
      GAME.emitOrder({ a: 22, type: 1, id: questData.qb_id });

      setTimeout(() => {
        // Click finish buttons until dialog closes
        this.anielskaClickFinish(quest, idx);
      }, 800);
    });
  },

  anielskaClickFinish(quest, idx) {
    if (DAILY.stop || DAILY.paused) return;

    if (!$('#quest_con').is(':visible')) {
      // Dialog closed - quest complete
      this.markQuestComplete(quest.name);
      setTimeout(() => this.anielskaCompleteNext(idx + 1), 500);
      return;
    }

    const finishBtn = $('button[data-option=finish_quest]').first();
    if (finishBtn.length > 0) {
      const qbId = finishBtn.attr('data-qb_id');
      const button = parseInt(finishBtn.attr('data-button')) || 1;
      GAME.socket.emit('ga', { a: 22, type: 2, button: button, id: qbId });
    }

    setTimeout(() => this.anielskaClickFinish(quest, idx), 800);
  },

  anielskaCompleteLvl4() {
    if (DAILY.stop || DAILY.paused) return;

    const quest = DAILY._anielskLvl4Quest;
    console.log('[AFO_DAILY] Anielska: Completing LvL4');
    this.updateStatus('Anielska: LvL4');

    const questData = this.findQuestByName(quest.name);
    if (!questData) {
      this.markQuestComplete(quest.name);
      this.anielskaFinish();
      return;
    }

    this.navigateToCoords(questData.coords[0], questData.coords[1], () => {
      GAME.emitOrder({ a: 22, type: 1, id: questData.qb_id });

      setTimeout(() => {
        this.anielskaClickFinishLvl4();
      }, 800);
    });
  },

  anielskaClickFinishLvl4() {
    if (DAILY.stop || DAILY.paused) return;

    if (!$('#quest_con').is(':visible')) {
      this.markQuestComplete(DAILY._anielskLvl4Quest.name);
      this.anielskaFinish();
      return;
    }

    const finishBtn = $('button[data-option=finish_quest]').first();
    if (finishBtn.length > 0) {
      const qbId = finishBtn.attr('data-qb_id');
      const button = parseInt(finishBtn.attr('data-button')) || 1;
      GAME.socket.emit('ga', { a: 22, type: 2, button: button, id: qbId });
    }

    setTimeout(() => this.anielskaClickFinishLvl4(), 800);
  },

  anielskaFinish() {
    console.log('[AFO_DAILY] Anielska: Batch complete!');
    DAILY._anielskaBatchActive = false;
    DAILY._anielskaCombatQuests = null;
    DAILY._anielskLvl4Quest = null;
    DAILY._anielskAcceptedQbIds = null;
    DAILY._anielskaIgnore = null;
    DAILY._anielskaLastRefresh = 0;

    // Skip all anielska quests in queue (they're done)
    this.skipAnielskaBatch();
  },

  skipAnielskaBatch() {
    // Move queue index past all Anielska karta quests
    while (DAILY.currentQuestIdx < DAILY.questQueue.length) {
      const quest = DAILY.questQueue[DAILY.currentQuestIdx];
      if (quest.name.startsWith('Anielska karta[LvL')) {
        DAILY.currentQuestIdx++;
      } else {
        break;
      }
    }

    DAILY._anielskaBatchActive = false;
    setTimeout(() => this.processNextQuest(), 500);
  },


  handleBotKill(quest, requires) {
    if (DAILY.stop || DAILY.paused) return;

    DAILY.isInCombat = true;
    DAILY.killTarget = requires.target;
    DAILY.killCount = requires.current;
    DAILY._combatQuest = quest;
    DAILY._combatRequires = requires;

    // Cache spawner filter once at combat start (to avoid spam in doFight loop)
    DAILY._spawnerIgnore = this.getSpawnerIgnore(requires?.rank);

    // ALWAYS save NPC coords so we can return after combat (even with unstuck moves)
    // This is separate from _originalLocId which is only for combat location teleports
    // For private/clan planet quests - prefer persistent quest coords saved in navigateToQuestNPC
    if (quest.location?.coords) {
      if ((quest.locationType === 'private_planet' || quest.locationType === 'clan_planet')
        && DAILY._questNpcCoords && DAILY._questNpcCoords.questName === quest.name) {
        // Use persisted coords from navigateToQuestNPC (survives across stages)
        DAILY._dynamicNpcCoords = DAILY._questNpcCoords;
        console.log('[AFO_DAILY] Using persisted NPC coords for', quest.locationType, DAILY._questNpcCoords);
      } else {
        DAILY._npcCoords = { x: quest.location.coords.x, y: quest.location.coords.y };
        console.log('[AFO_DAILY] Saved NPC coords for return:', DAILY._npcCoords);
      }
    }

    // Check if quest uses combat location (useCombatLocation flag in JSON)
    // ONLY use combat location when quest.useCombatLocation is explicitly true
    // If not set or false, fight at current location (where the quest is)
    console.log('[AFO_DAILY] Combat loc check - quest.useCombatLocation:', quest.useCombatLocation, 'DAILY.combatLoc:', DAILY.combatLoc);

    // Only teleport to combat location if quest explicitly requires it
    const useCombatLoc = quest.useCombatLocation === true;

    if (useCombatLoc && DAILY.combatLoc && DAILY.combatLoc !== 'current') {
      // Save original location to return after combat
      DAILY._originalLocId = GAME.char_data.loc;
      DAILY._originalCoords = { x: GAME.char_data.x, y: GAME.char_data.y };

      console.log('[AFO_DAILY] Teleporting to combat location:', DAILY.combatLoc);
      this.updateStatus(`${quest.name}: Teleport do walki...`);

      // Teleport to combat location
      if (DAILY.combatLoc === 'private') {
        // Private planet teleport
        GAME.socket.emit('ga', { a: 16 }); // Return first
        setTimeout(() => {
          if (DAILY.stop || DAILY.paused) return;
          GAME.socket.emit('ga', { a: 15, type: 13 });
          // Wait for teleport, then start combat
          setTimeout(() => {
            if (DAILY.stop || DAILY.paused) return;
            console.log('[AFO_DAILY] Arrived at private planet, starting combat');
            this.combatLoop();
          }, 2000);
        }, 800);
      } else {
        // Normal teleport by locId
        const locId = parseInt(DAILY.combatLoc);
        DAILY._targetCombatLocId = locId;  // Save for verification

        if (GAME.char_data.loc === locId) {
          // Already on location
          console.log('[AFO_DAILY] Already on combat location, starting combat');
          this.combatLoop();
        } else {
          GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });
          // Wait for teleport, then verify we arrived
          setTimeout(() => {
            if (DAILY.stop || DAILY.paused) return;
            this.verifyCombatLocation(locId, 0);
          }, 2000);
        }
      }
      return;
    }

    // No combat location teleport needed - start combat immediately
    this.combatLoop();
  },

  /**
   * Verify we arrived at combat location, retry teleport if not
   * Uses GAME.current_loc.id for accurate location check
   */
  verifyCombatLocation(expectedLocId, attempts) {
    if (DAILY.stop || DAILY.paused) return;

    const currentLocId = GAME.current_loc?.id || GAME.char_data.loc;

    if (currentLocId === expectedLocId) {
      // Successfully arrived at combat location
      console.log('[AFO_DAILY] Verified at combat location:', expectedLocId, '- starting combat');
      this.combatLoop();
      return;
    }

    // Not at expected location
    console.warn('[AFO_DAILY] Combat location verification failed! Expected:', expectedLocId, 'Current:', currentLocId, 'Attempt:', attempts + 1);

    if (attempts >= 3) {
      // Max retries reached - skip quest
      console.error('[AFO_DAILY] Failed to teleport to combat location after 3 attempts');
      const quest = DAILY._combatQuest;
      this.skipQuestWithMark(quest, 'Nie udało się teleportować do lokacji walki');
      return;
    }

    // Retry teleport
    console.log('[AFO_DAILY] Retrying teleport to combat location:', expectedLocId);
    this.updateStatus(`Próba teleportu (${attempts + 2}/3)...`);
    GAME.socket.emit('ga', { a: 12, type: 18, loc: expectedLocId });

    // Wait and verify again
    setTimeout(() => {
      if (DAILY.stop || DAILY.paused) return;
      this.verifyCombatLocation(expectedLocId, attempts + 1);
    }, 2500);
  },

  // Check if we need buffs/SSJ/substance before fighting (like RESP.check())
  checkCombatPrereqs() {
    // Check substance first
    if ($("#doubler_bar").css("display") === "none" && GAME.quick_opts.sub) {
      const subIdx = DAILY.substance === 'x20' ? 1 : 0;
      if (GAME.quick_opts.sub[subIdx]) {
        console.log('[AFO_DAILY] Using substance:', DAILY.substance);
        GAME.socket.emit('ga', {
          a: 12,
          type: 14,
          iid: GAME.quick_opts.sub[subIdx].id,
          page: GAME.ekw_page,
          am: 1
        });
        return true;
      }
    }

    // Wait if substance is about to expire
    if ($('#doubler_status').text() <= '00:00:03') {
      return true;
    }

    // Check SSJ
    if (GAME.quick_opts.ssj && $("#ssj_bar").css("display") === "none") {
      console.log('[AFO_DAILY] Activating SSJ');
      GAME.socket.emit('ga', { a: 18, type: 5, tech_id: GAME.quick_opts.ssj[0] });
      return true;
    }

    // SSJ needs to be started
    if ($('#ssj_status').text() == "--:--:--" && GAME.quick_opts.ssj) {
      console.log('[AFO_DAILY] Starting SSJ timer');
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 18, type: 6 });
      }, 1500);
      return true;
    }

    // Wait if SSJ is about to expire
    if ($('#ssj_status').text() <= '00:00:03' && GAME.quick_opts.ssj) {
      return true;
    }

    return false;
  },

  combatLoop() {
    if (DAILY.stop || DAILY.paused) return;

    const quest = DAILY._combatQuest;
    const requires = DAILY._combatRequires;

    if (!quest || !requires) {
      DAILY.isInCombat = false;
      return;
    }

    // Periodic refresh - every 5 seconds, pause for 1.5 seconds to let game catch up
    const now = Date.now();
    if (!DAILY._lastRefresh) DAILY._lastRefresh = now;

    if (now - DAILY._lastRefresh >= 5000) {
      DAILY._lastRefresh = now;
      console.log('[AFO_DAILY] Refresh pause for counter update');
      this.updateStatus(`${quest.name}: Odświeżanie...`);

      // Wait 1.5 seconds for game to process drops and update counters
      setTimeout(() => {
        if (DAILY.stop || DAILY.paused) return;
        this.combatLoop();
      }, 1500);
      return;
    }

    // Check if requirements met via #track_quest element (updates in real-time)
    // Use originalQbId if available (saved before teleporting to combat location)
    // because after teleporting, findQuestByName won't find the quest in DOM
    const qbId = requires.originalQbId || this.getQuestQbId(quest);
    const trackQuest = $(`#track_quest_${qbId}`);

    console.log('[AFO_DAILY] Combat progress check - qbId:', qbId, 'trackQuest found:', trackQuest.length > 0);

    // First check track_quest - it has green class when complete
    if (trackQuest.length > 0 && trackQuest.find('.green').length > 0) {
      console.log('[AFO_DAILY] Track quest shows green - requirements complete');
      this.onCombatComplete(quest);
      return;
    }

    const questSpan = $(`.quest_warunek${qbId}`);
    let currentProgress = 0;
    let target = requires.target;

    // Helper function to parse progress from text like "5 140 /10 000" or "0/10 000"
    // Use simple split on '/' - much more reliable than complex regex
    const parseProgressText = (text) => {
      // Find the last occurrence of pattern "number/number" by splitting on '/'
      const slashIdx = text.lastIndexOf('/');
      if (slashIdx === -1) return null;

      // Extract parts before and after the slash
      const beforeSlash = text.substring(0, slashIdx);
      const afterSlash = text.substring(slashIdx + 1);

      // Extract numbers (remove all non-digit characters except for finding the number)
      // Get the last "word" before slash that contains digits
      const beforeParts = beforeSlash.trim().split(/\s+/);
      let currentStr = '';
      for (let i = beforeParts.length - 1; i >= 0; i--) {
        if (/\d/.test(beforeParts[i])) {
          currentStr = beforeParts[i] + currentStr;
          // Keep going back if previous part is also just digits/spaces
          if (i > 0 && /^[\d\s]+$/.test(beforeParts[i - 1])) {
            currentStr = beforeParts[i - 1] + ' ' + currentStr;
            i--;
          }
        } else {
          break;
        }
      }

      // For after slash, just take all digits
      const afterParts = afterSlash.trim().split(/\s+/);
      let targetStr = '';
      for (const part of afterParts) {
        if (/\d/.test(part)) {
          targetStr += part;
        } else {
          break;
        }
      }

      const current = parseInt(currentStr.replace(/\s/g, '')) || 0;
      const target = parseInt(targetStr.replace(/\s/g, '')) || 0;

      if (target > 0) {
        return { current, target };
      }
      return null;
    };

    if (questSpan.length > 0) {
      // Parse from span TEXT (game updates text, not data-count attribute!)
      const spanText = questSpan.text().trim();
      const parsed = parseProgressText(spanText);

      if (parsed) {
        currentProgress = parsed.current;
        if (parsed.target > 0) target = parsed.target;
        console.log('[AFO_DAILY] Parsed progress from quest_warunek text:', currentProgress, '/', target);
      } else {
        // Fallback to data-count if text parsing fails
        currentProgress = parseInt(questSpan.attr('data-count')) || 0;
        target = parseInt(questSpan.attr('data-max')) || requires.target;
        console.log('[AFO_DAILY] Using quest_warunek data-count fallback:', currentProgress, '/', target);
      }

      if (currentProgress >= target) {
        console.log('[AFO_DAILY] Combat requirements met:', currentProgress, '/', target);
        this.onCombatComplete(quest);
        return;
      }

      this.updateStatus(`${quest.name}: ${currentProgress}/${target}`);
    } else {
      // quest_warunek not found - we may be on a different location (useCombatLocation)
      // First try to find quest_warunek span inside track_quest (most reliable)
      const trackQuestSpan = trackQuest.find(`[class^="quest_warunek"]`);

      if (trackQuestSpan.length > 0) {
        const spanText = trackQuestSpan.text().trim();
        const parsed = parseProgressText(spanText);
        if (parsed) {
          currentProgress = parsed.current;
          if (parsed.target > 0) target = parsed.target;
          console.log('[AFO_DAILY] Parsed progress from track_quest span:', currentProgress, '/', target);
        }
      } else if (trackQuest.length > 0) {
        // Fallback: parse from full track_quest text
        const trackText = trackQuest.text();
        const parsed = parseProgressText(trackText);

        if (parsed) {
          currentProgress = parsed.current;
          if (parsed.target > 0) target = parsed.target;
          console.log('[AFO_DAILY] Parsed progress from track_quest HTML:', currentProgress, '/', target);
        } else {
          // Fallback to requires.current if parsing failed
          currentProgress = requires.current || 0;
          console.log('[AFO_DAILY] Could not parse progress from track_quest, using requires:', currentProgress, '/', target);
        }
      } else {
        // No track_quest element at all - use requires fallback
        currentProgress = requires.current || 0;
        console.log('[AFO_DAILY] No track_quest found, using requires fallback:', currentProgress, '/', target);
      }
      this.updateStatus(`${quest.name}: ${currentProgress}/${target}`);
    }

    // Stuck detection - check if progress is being made
    if (currentProgress > DAILY._lastProgress) {
      // Progress made - reset stuck detection
      DAILY._lastProgress = currentProgress;
      DAILY._lastProgressTime = now;
      DAILY._stuckAttempts = 0;
    } else if (DAILY._lastProgressTime > 0 && now - DAILY._lastProgressTime > 10000) {
      // No progress for 10+ seconds - we might be stuck
      DAILY._stuckAttempts++;
      console.warn('[AFO_DAILY] No progress for 10s, attempt', DAILY._stuckAttempts);

      if (DAILY._stuckAttempts >= 3) {
        console.warn('[AFO_DAILY] Stuck too long, trying random movement');
        this.attemptUnstuckMove();
        DAILY._lastProgressTime = now;
        DAILY._stuckAttempts = 0;
        return;
      }
    }

    // Initialize progress tracking
    if (DAILY._lastProgressTime === 0) {
      DAILY._lastProgress = currentProgress;
      DAILY._lastProgressTime = now;
    }

    // Check prereqs first (like RESP)
    if (this.checkCombatPrereqs()) {
      setTimeout(() => this.combatLoop(), 1700);
      return;
    }

    // Do the fighting (like RESP.fight())
    this.doFight();
  },

  // Called when combat requirements are met
  onCombatComplete(quest) {
    console.log('[AFO_DAILY] Combat complete for:', quest.name);
    DAILY.isInCombat = false;
    DAILY._combatQuest = null;
    DAILY._combatRequires = null;
    DAILY._spawnerIgnore = null;  // Clear spawner filter cache
    DAILY._lastRefresh = 0;

    // Reset stuck detection
    DAILY._lastProgress = 0;
    DAILY._lastProgressTime = 0;
    DAILY._stuckAttempts = 0;

    // Check if we need to return to original location (from useCombatLocation)
    if (DAILY._originalLocId && GAME.char_data.loc !== DAILY._originalLocId) {
      const targetLocId = DAILY._originalLocId;
      console.log('[AFO_DAILY] Returning to quest location:', targetLocId);
      this.updateStatus(`${quest.name}: Wracam do questa...`);

      // Use proper teleport handling - set flags so afterTeleport handles navigation
      // after map_quests is loaded (not just a timeout)
      DAILY.isTeleporting = true;
      DAILY._currentQuest = quest;
      DAILY._returnFromCombat = true;  // Flag to indicate we're returning from combat

      // Teleport back to quest location
      GAME.socket.emit('ga', { a: 12, type: 18, loc: targetLocId });

      // Clear original location after sending teleport
      DAILY._originalLocId = null;
      DAILY._originalCoords = null;

      // Fallback: if teleport doesn't complete in 5 seconds, retry
      setTimeout(() => {
        if (DAILY.isTeleporting && GAME.char_data.loc !== targetLocId) {
          console.warn('[AFO_DAILY] Teleport return timeout, retrying...');
          GAME.socket.emit('ga', { a: 12, type: 18, loc: targetLocId });

          // Final fallback after another 4s
          setTimeout(() => {
            if (DAILY.isTeleporting) {
              console.warn('[AFO_DAILY] Final teleport fallback, forcing afterTeleport');
              DAILY.isTeleporting = false;
              this.afterTeleport();
            }
          }, 4000);
        }
      }, 5000);

      // afterTeleport will be called by handleSockets when 'gr' event fires
      // with the new map data, and will navigate to NPC
      return;
    }

    // Clear original location data
    DAILY._originalLocId = null;
    DAILY._originalCoords = null;

    // Use dynamic NPC coords for private/clan planet quests (saved in navigateToQuestNPC)
    // These are more accurate than _npcCoords for quests with dynamic NPC positions
    let npcCoords = DAILY._dynamicNpcCoords || DAILY._npcCoords;

    // IMPORTANT: Check if npcCoords.locationType matches current quest locationType
    // This prevents using stale coords from a previous different quest type
    if (npcCoords && npcCoords.locationType && npcCoords.locationType !== quest.locationType) {
      console.log('[AFO_DAILY] NPC coords locationType mismatch - ignoring stale coords. Coords type:', npcCoords.locationType, 'Quest type:', quest.locationType);
      npcCoords = null; // Ignore stale coords from different quest type
    }

    // Clear both coord sources regardless (to prevent future contamination)
    DAILY._dynamicNpcCoords = null;
    DAILY._npcCoords = null;

    if (npcCoords) {
      console.log('[AFO_DAILY] Using NPC coords for return:', npcCoords, 'quest type:', quest.locationType);

      const currentX = GAME.char_data.x;
      const currentY = GAME.char_data.y;

      // Check if we're not already at NPC position
      if (currentX !== npcCoords.x || currentY !== npcCoords.y) {
        console.log('[AFO_DAILY] Returning to NPC coords:', npcCoords.x, npcCoords.y, 'from', currentX, currentY);
        this.updateStatus(`${quest.name}: Wracam do NPC...`);
        this.navigateToCoords(npcCoords.x, npcCoords.y, () => {
          const questData = this.findQuestByName(quest.name);
          if (questData) {
            setTimeout(() => this.startDialog(quest, questData.qb_id), 500);
          } else {
            this.onQuestComplete(quest);
          }
        });
        return;
      }
    }

    // Re-open dialog to continue
    const questData = this.findQuestByName(quest.name);
    if (questData) {
      setTimeout(() => this.startDialog(quest, questData.qb_id), 500);
    } else {
      this.onQuestComplete(quest);
    }
  },

  // Attempt to move in a random direction when stuck (no combat progress)
  attemptUnstuckMove() {
    // Try to move in a random direction to unstick
    const dirs = [1, 2, 3, 4, 5, 6, 7, 8]; // All 8 directions
    const randomDir = dirs[Math.floor(Math.random() * dirs.length)];

    console.log('[AFO_DAILY] Attempting unstuck move, direction:', randomDir);
    GAME.socket.emit('ga', { a: 4, dir: randomDir, vo: GAME.map_options.vo });

    // Continue combat loop after movement
    setTimeout(() => this.combatLoop(), 1000);
  },

  // Get spawner ignore array based on required mob rank
  // Also sets the checkboxes in #kws_spawn2 to actually apply the filter
  getSpawnerIgnore(requiredRank) {
    // Ranks: 0=normal, 1=champion, 2=elite/elita, 3=legendary, 4=epicki/lord, 5=mistyczny/blessed
    const rankMap = {
      'normal': 0,
      'champion': 1,
      'elite': 2,
      'elita': 2,
      'legendary': 3,
      'legendarny': 3,
      'lord': 4,
      'epicki': 4,
      'epic': 4,
      'blessed': 5,
      'mistyczny': 5
    };

    const targetRank = rankMap[requiredRank?.toLowerCase()] ?? -1;

    // Create ignore array - ignore all ranks except target
    const ignore = [true, true, true, true, true, true];

    if (targetRank >= 0) {
      ignore[targetRank] = false;  // Don't ignore the rank we need
      console.log('[AFO_DAILY] Filtering to rank:', requiredRank, '-> index', targetRank);
    }

    // Safety check: if ALL ranks are being ignored (all true), enable all as fallback
    if (ignore.every(v => v === true)) {
      console.warn('[AFO_DAILY] All spawn ranks ignored - enabling all as fallback');
      for (let i = 0; i < ignore.length; i++) {
        ignore[i] = false;
      }
    }

    // Click checkboxes in #kws_spawn2 to apply filter
    this.setSpawnerCheckboxes(ignore);

    return ignore;
  },

  // Set spawner checkboxes in UI to match ignore array
  setSpawnerCheckboxes(ignoreArray) {
    for (let i = 0; i < 6; i++) {
      const checkbox = $(`#kws_spawner_ignore_${i}`);
      if (checkbox.length > 0) {
        const shouldBeChecked = ignoreArray[i];
        const isChecked = checkbox.prop('checked');

        if (shouldBeChecked !== isChecked) {
          checkbox.prop('checked', shouldBeChecked);
          checkbox.trigger('change');
          console.log('[AFO_DAILY] Set spawner ignore', i, '=', shouldBeChecked);
        }
      }
    }
  },

  doFight() {
    if (DAILY.stop || DAILY.paused) return;

    const requires = DAILY._combatRequires;
    const mobCount = this.getMobCount();

    // Use cached spawner filter (set once at combat start) to avoid spam
    const spawnerIgnore = DAILY._spawnerIgnore || this.getSpawnerIgnore(requires?.rank);

    if (mobCount > 0) {
      // Fight mobs - use multifight if available (like RESP.fight())
      const fm = GAME.field_mobs;
      const fmf = GAME.field_mf;
      const fmi = GAME.field_mob_id;

      if (fmi && fm && fm[fmi - 1] &&
        ((mobCount > 0 && fmf[fmi - 1] < 0) && fm[fmi - 1].ranks[0] ||
          (mobCount > 0 && fmf[fmi - 1] < 1 && fm[fmi - 1].ranks[1]) ||
          (mobCount > 0 && fmf[fmi - 1] < 2 && fm[fmi - 1].ranks[2]) ||
          (mobCount > 0 && fmf[fmi - 1] < 3 && fm[fmi - 1].ranks[3]) ||
          (mobCount > 0 && fmf[fmi - 1] < 4 && fm[fmi - 1].ranks[4]) ||
          (mobCount > 0 && fmf[fmi - 1] < 5 && fm[fmi - 1].ranks[5]))) {
        // Normal fight
        GAME.socket.emit('ga', { a: 7, order: 2, quick: 1, fo: GAME.map_options.ma });
      } else if (this.getMobCount2() > 0) {
        // Multifight
        GAME.socket.emit('ga', { a: 13, mob_num: fmi, fo: GAME.map_options.ma });
      } else {
        // Spawn mobs with rank filter
        GAME.socket.emit('ga', { a: 444, max: GAME.spawner[0], ignore: spawnerIgnore });
      }
    } else {
      // Spawn mobs with rank filter
      GAME.socket.emit('ga', { a: 444, max: GAME.spawner[0], ignore: spawnerIgnore });
    }

    // Continue combat loop
    setTimeout(() => this.combatLoop(), DAILY.wait);
  },

  getQuestQbId(quest) {
    const questData = this.findQuestByName(quest.name);
    return questData ? questData.qb_id : 0;
  },

  // Count mobs on field (like RESP.MF())
  getMobCount() {
    let r = 0;
    if (GAME.field_mobs) {
      for (let i = 0; i < GAME.map_options.ma.length; i++) {
        if (GAME.map_options.ma[i] === 1) {
          r += parseInt(GAME.field_mobs[0].ranks[i]) || 0;
          if (GAME.field_mobs[1]) r += parseInt(GAME.field_mobs[1].ranks[i]) || 0;
          if (GAME.field_mobs[2]) r += parseInt(GAME.field_mobs[2].ranks[i]) || 0;
          if (GAME.field_mobs[3]) r += parseInt(GAME.field_mobs[3].ranks[i]) || 0;
        }
      }
    }
    return r;
  },

  // Count mobs for multifight (like RESP.MF2())
  getMobCount2() {
    let r = 0;
    if (GAME.field_mobs) {
      for (let i = 0; i < GAME.map_options.ma.length; i++) {
        if (GAME.map_options.ma[i] === 1) {
          r += parseInt(GAME.field_mobs[0].ranks[i]) || 0;
        }
      }
    }
    return r;
  },

  handlePlayerKill(quest, requires) {
    if (DAILY.stop || DAILY.paused) return;

    DAILY.isInCombat = true;
    DAILY._pvpRequires = requires;  // Save for onPvpComplete to access originalQbId

    // For empire quests, need to go to target empire
    // For isPvpWins (simple PvP), pick any enemy empire
    let targetEmpire = requires.targetEmpire;

    if (!targetEmpire && requires.isPvpWins) {
      // Pick any enemy empire (not our own)
      const enemies = [1, 2, 3, 4].filter(e => e !== GAME.char_data.empire);
      targetEmpire = enemies[Math.floor(Math.random() * enemies.length)];
      requires.targetEmpire = targetEmpire;
    }

    if (targetEmpire) {
      this.updateStatus(`Idę na Imperium ${targetEmpire}`);
      // First do return to leave current location
      GAME.socket.emit('ga', { a: 16 });

      setTimeout(() => {
        if (DAILY.stop || DAILY.paused) return;
        // Enter enemy empire
        GAME.socket.emit('ga', { a: 50, type: 5, e: targetEmpire });
        DAILY.targetEmpire = targetEmpire;
        setTimeout(() => this.doPvpCombat(quest, requires), 1500);
      }, 1000);
      return;
    }

    this.doPvpCombat(quest, requires);
  },

  doPvpCombat(quest, requires) {
    if (DAILY.stop || DAILY.paused) return;

    // Wait if game is loading
    if (GAME.is_loading || $("#loader").is(":visible")) {
      setTimeout(() => this.doPvpCombat(quest, requires), 100);
      return;
    }

    // Use the ORIGINAL qbId saved before we left our empire!
    // After entering enemy empire, findQuestByName returns quests from THAT location
    const qbId = requires.originalQbId;

    if (!qbId) {
      // No original qbId saved = bug, try to find it
      console.warn('[AFO_DAILY] No originalQbId saved, trying findQuestByName fallback');
      const questData = this.findQuestByName(quest.name);
      if (!questData?.qb_id) {
        console.log('[AFO_DAILY] Quest not found - marking complete');
        this.stopPvpAndComplete(quest);
        return;
      }
    }

    const trackQuest = $(`#track_quest_${qbId}`);
    const greenSpan = trackQuest.find('.green');

    console.log('[AFO_DAILY] PVP check - qbId:', qbId, 'track:', trackQuest.length, 'green:', greenSpan.length);

    if (trackQuest.length > 0 && greenSpan.length > 0) {
      console.log('[AFO_DAILY] PvP track quest shows green - complete');
      this.stopPvpAndComplete(quest);
      return;
    }

    // Check quest_warunek span inside track_quest element
    // HTML format: <span class="quest_warunek4449594" data-count="9" data-max="20">9/20</span>
    const questSpan = $(`.quest_warunek${qbId}`);
    if (questSpan.length > 0) {
      const current = parseInt(questSpan.attr('data-count')) || 0;
      const target = parseInt(questSpan.attr('data-max')) || requires.target;

      console.log('[AFO_DAILY] Empire quest progress from span:', current, '/', target);
      this.updateStatus(`${quest.name}: ${current}/${target}`);

      if (current >= target) {
        console.log('[AFO_DAILY] PvP requirements met:', current, '/', target);
        this.stopPvpAndComplete(quest);
        return;
      }
    } else {
      // Fallback: try to parse from track_quest HTML text for empire kill quests
      // Format: "Pokonać członków ... Imperium ... <span>9/20</span>"
      if (requires.isEmpireQuest && trackQuest.length > 0) {
        const trackText = trackQuest.text();
        const progressMatch = trackText.match(/(\d+)\/(\d+)/);
        if (progressMatch) {
          const current = parseInt(progressMatch[1]);
          const target = parseInt(progressMatch[2]);

          console.log('[AFO_DAILY] Empire quest progress from text:', current, '/', target);
          this.updateStatus(`${quest.name}: ${current}/${target}`);

          if (current >= target) {
            console.log('[AFO_DAILY] Empire PvP requirements met:', current, '/', target);
            this.stopPvpAndComplete(quest);
            return;
          }
        }
      }
    }

    // Log monitoring
    console.log('[AFO_DAILY] PVP monitoring, PVP.stop =', PVP?.stop);

    // Start AFO_PVP if not already running
    if (typeof AFO_PVP !== 'undefined' && PVP.stop === false) {
      // Already running, just keep monitoring
      setTimeout(() => this.doPvpCombat(quest, requires), 500);
    } else if (typeof AFO_PVP !== 'undefined') {
      console.log('[AFO_DAILY] Starting AFO_PVP (without codes)');
      PVP.stop = false;
      PVP.code = false;  // Disable codes
      AFO_PVP.start();
      // Monitor for completion
      setTimeout(() => this.doPvpCombat(quest, requires), 500);
    } else {
      console.warn('[AFO_DAILY] AFO_PVP not available');
      this.onPvpComplete(quest);
    }
  },

  stopPvpAndComplete(quest) {
    // Stop AFO_PVP
    if (typeof PVP !== 'undefined') {
      PVP.stop = true;
      console.log('[AFO_DAILY] Stopped AFO_PVP');
    }
    this.onPvpComplete(quest);
  },

  pvpMoveToNextTile(quest, requires) {
    if (DAILY.stop || DAILY.paused) return;

    // Simple movement pattern on empire HQ - try all directions
    if (!DAILY._pvpMoveDir) DAILY._pvpMoveDir = 0;

    // Limit retries
    if (DAILY._pvpMoveDir > 20) {
      console.log('[AFO_DAILY] Too many move attempts, waiting...');
      DAILY._pvpMoveDir = 0;
      setTimeout(() => this.doPvpCombat(quest, requires), 2000);
      return;
    }

    const dirs = [
      { x: 0, y: 1 },   // down
      { x: 1, y: 0 },   // right
      { x: 0, y: -1 },  // up
      { x: -1, y: 0 }   // left
    ];

    const dir = dirs[DAILY._pvpMoveDir % dirs.length];
    const newX = GAME.char_data.x + dir.x;
    const newY = GAME.char_data.y + dir.y;

    // Check if tile is walkable
    const mapTile = GAME.map[newY]?.[newX];
    console.log('[AFO_DAILY] Trying move to', newX, newY, 'mapTile:', mapTile);

    if (mapTile !== undefined && mapTile >= 0) {
      console.log('[AFO_DAILY] Moving to tile', newX, newY);
      DAILY._pvpMoveDir++;
      GAME.socket.emit('ga', { a: 4, x: newX, y: newY });
      // Wait longer for movement to complete
      setTimeout(() => this.doPvpCombat(quest, requires), 800);
    } else {
      // Try next direction
      console.log('[AFO_DAILY] Tile not walkable, trying next direction');
      DAILY._pvpMoveDir++;
      this.pvpMoveToNextTile(quest, requires);
    }
  },

  onPvpComplete(quest) {
    DAILY.isInCombat = false;
    DAILY._pvpMoveDir = 0;  // Reset movement direction

    // Get the saved originalQbId from requires
    const requires = DAILY._pvpRequires;
    const originalQbId = requires?.originalQbId;
    console.log('[AFO_DAILY] onPvpComplete, originalQbId:', originalQbId, 'locationType:', quest.locationType);

    // Return from enemy empire if needed
    if (DAILY.targetEmpire && DAILY.targetEmpire !== DAILY.ownEmpire) {
      console.log('[AFO_DAILY] Returning from enemy empire');
      this.updateStatus('Wychodzę z wrogiego imperium...');
      // Use a:16 to properly exit location
      GAME.socket.emit('ga', { a: 16 });
      DAILY.targetEmpire = 0;

      // Wait 1s for exit to complete, then return to appropriate location
      setTimeout(() => {
        if (DAILY.stop || DAILY.paused) return;

        // Check quest type to determine where to return
        if (quest.locationType === 'empire_hq') {
          // Empire quests - return to own empire HQ (this is correct!)
          this.updateStatus('Wracam do własnego imperium...');
          DAILY.isTeleporting = true;
          DAILY._currentQuest = quest;
          GAME.socket.emit('ga', { a: 50, type: 5, e: DAILY.ownEmpire });
          // Continue in handleSockets -> afterTeleport -> navigateToQuestNPC
        } else {
          // Normal quests (like "Zadanie PvP") - wait for loc sync then check
          // Additional 1s delay to ensure GAME.char_data.loc has synced
          setTimeout(() => {
            if (DAILY.stop || DAILY.paused) return;

            const locId = quest.location?.locId;
            console.log('[AFO_DAILY] After exit - current loc:', GAME.char_data.loc, 'quest locId:', locId);

            if (locId && GAME.char_data.loc !== locId) {
              // Need to teleport
              this.updateStatus('Teleport do lokacji questa...');
              DAILY.isTeleporting = true;
              DAILY._currentQuest = quest;
              GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });
              // Continue in handleSockets -> afterTeleport -> navigateToQuestNPC
            } else {
              // Already on location or no locId - just navigate to NPC
              console.log('[AFO_DAILY] Already on quest location, navigating to NPC directly');
              this.navigateToQuestNPC(quest);
            }
          }, 1000);  // Additional 1s delay for loc sync
        }
      }, 1000);
      return;
    }

    setTimeout(() => this.continueDialog(quest), 300);
  },

  // ============================================
  // QUEST COMPLETION
  // ============================================

  // Verify quest is actually complete (not visible in field_opts_con anymore)
  verifyAndCompleteQuest(quest) {
    if (DAILY.stop || DAILY.paused) return;

    // Get quest qb_id
    const questData = this.findQuestByName(quest.name);
    const qbId = questData?.qb_id || DAILY._pvpRequires?.originalQbId;

    // Check if quest is still visible in field_opts_con (means not complete!)
    const questInField = $(`#field_q_${qbId}`);

    if (questInField.length > 0 && questInField.is(':visible')) {
      console.log('[AFO_DAILY] Quest still visible in field_opts_con, needs final click');

      // Track verification attempts
      DAILY._verifyAttempts = (DAILY._verifyAttempts || 0) + 1;
      if (DAILY._verifyAttempts > 5) {
        console.warn('[AFO_DAILY] Too many verify attempts, marking complete anyway');
        DAILY._verifyAttempts = 0;
        this.onQuestComplete(quest);
        return;
      }

      // Try to open dialog and check for requirements
      if (qbId) {
        GAME.socket.emit('ga', { a: 22, type: 1, id: qbId });
        setTimeout(() => {
          // First check if there are new requirements in the dialog
          const newRequires = this.parseQuestRequirements();
          if (newRequires && newRequires.type !== 'ACTION' && newRequires.current < newRequires.target) {
            console.log('[AFO_DAILY] Found new requirements during verification:', newRequires.type);
            DAILY._verifyAttempts = 0;
            $('#quest_con').hide();
            this.handleQuestRequirement(quest, newRequires);
            return;
          }

          // No new requirements - click finish if available
          const finishBtn = $('button[data-option=finish_quest]').first();
          if (finishBtn.length > 0) {
            const btnQbId = finishBtn.attr('data-qb_id');
            const button = parseInt(finishBtn.attr('data-button')) || 1;
            console.log('[AFO_DAILY] Clicking final finish button');
            GAME.socket.emit('ga', { a: 22, type: 2, button: button, id: btnQbId });
          }
          // Check again after delay
          setTimeout(() => this.verifyAndCompleteQuest(quest), 800);
        }, 500);
        return;
      }
    }

    // Quest is not in field_opts_con = truly complete!
    DAILY._verifyAttempts = 0;
    console.log('[AFO_DAILY] Quest verified complete:', quest.name);
    this.onQuestComplete(quest);
  },

  onQuestComplete(quest) {
    console.log('[AFO_DAILY] Quest complete:', quest.name);
    this.markQuestComplete(quest.name);

    DAILY.isInCombat = false;

    // Check if in portal group
    if (DAILY.inPortal && DAILY.portalGroup.length > 0) {
      DAILY.portalGroupIdx++;
      setTimeout(() => this.processNextQuest(), 500);
      return;
    }

    // Check if quest has portal.exit but no portal.entry (special portal like Vestria)
    // Need to exit via portal before continuing
    const portal = quest.location?.portal;
    if (DAILY.inPortal && portal && portal.exit && !portal.entry) {
      console.log('[AFO_DAILY] Exiting special portal location via exit coords');
      this.exitPortal();
      return;
    }

    // Check if we need to exit special location first
    this.exitSpecialLocationIfNeeded(() => {
      this.advanceQuestQueue();
    });
  },

  // Check if on special location and exit with a:16
  exitSpecialLocationIfNeeded(callback) {
    // Use CURRENT quest (the one we just completed), not previous index
    const currentQuest = DAILY._currentQuest || DAILY.questQueue[DAILY.currentQuestIdx];

    // Check what type of location we're on (locationType is at quest level, not location.type)
    const locType = currentQuest?.locationType;
    const isSpecialLoc = locType === 'private_planet' || locType === 'clan_planet' || locType === 'empire_hq';

    // Check if NEXT quest is on the same special location type
    const nextQuest = DAILY.questQueue[DAILY.currentQuestIdx + 1];
    const nextLocType = nextQuest?.locationType;
    const nextIsSameType = nextLocType === locType;

    console.log('[AFO_DAILY] Checking exit for locationType:', locType, 'isSpecial:', isSpecialLoc, 'nextLocType:', nextLocType);

    // Only exit if we're on special location AND next quest is NOT on the same type
    if (isSpecialLoc && !nextIsSameType) {
      console.log('[AFO_DAILY] Exiting special location:', locType);
      this.updateStatus('Wychodzę z lokacji...');
      GAME.socket.emit('ga', { a: 16 });

      // Wait for exit to complete (with cooldown buffer)
      setTimeout(() => {
        if (DAILY.stop || DAILY.paused) return;
        callback();
      }, 1500);  // Increased from 1000 to avoid cooldown issues
    } else {
      if (isSpecialLoc && nextIsSameType) {
        console.log('[AFO_DAILY] Staying on special location - next quest is same type');
      }
      callback();
    }
  },

  // Skip quest and mark it visually (orange color) on the list
  skipQuestWithMark(quest, reason) {
    console.warn('[AFO_DAILY] Skipping quest:', quest.name, '-', reason);
    GAME.komunikat(`[DZIENNE] Pominięto: ${quest.name} - ${reason}`);

    // Mark on UI and save to localStorage
    this.markQuestSkipped(quest.name);

    // Clear states
    DAILY.isInCombat = false;
    DAILY._dialogAttempts = 0;

    // Check if in portal group
    if (DAILY.inPortal && DAILY.portalGroup.length > 0) {
      DAILY.portalGroupIdx++;
      setTimeout(() => this.processNextQuest(), 500);
      return;
    }

    // Exit special location if needed
    this.exitSpecialLocationIfNeeded(() => {
      this.advanceQuestQueue();
    });
  },

  advanceQuestQueue() {
    DAILY.currentQuestIdx++;
    DAILY.currentStageIdx = 0;
    DAILY.inPortal = false;
    DAILY.portalGroup = [];
    DAILY.portalGroupIdx = 0;
    DAILY._currentQuest = null;
    DAILY._questNpcCoords = null;  // Clear quest-persistent NPC coords

    // Check if there are quests at current location that should be done first
    // This handles cases like Tajemniczy Portal teleporting to Vestria where Boski Ulepszacz is
    const currentLocId = GAME.char_data.loc;
    const remainingQuests = DAILY.questQueue.slice(DAILY.currentQuestIdx);

    // Find quest at current location that's later in queue
    const questAtCurrentLoc = remainingQuests.find((q, idx) => {
      if (idx === 0) return false;  // Skip first quest (it's already next)
      return q.location?.locId === currentLocId &&
        !DAILY.completedQuests.includes(q.name) &&
        !DAILY.skippedQuests.includes(q.name);
    });

    if (questAtCurrentLoc) {
      console.log('[AFO_DAILY] Found quest at current location, prioritizing:', questAtCurrentLoc.name);

      // Move this quest to current position
      const questIdx = DAILY.questQueue.indexOf(questAtCurrentLoc);
      if (questIdx > DAILY.currentQuestIdx) {
        // Swap: move found quest to current position
        DAILY.questQueue.splice(questIdx, 1);  // Remove from original position
        DAILY.questQueue.splice(DAILY.currentQuestIdx, 0, questAtCurrentLoc);  // Insert at current
        console.log('[AFO_DAILY] Reordered queue, next quest:', DAILY.questQueue[DAILY.currentQuestIdx]?.name);
      }
    }

    setTimeout(() => this.processNextQuest(), 500);
  },

  skipCurrentQuest(reason) {
    const quest = DAILY.questQueue[DAILY.currentQuestIdx];
    if (quest) {
      console.warn('[AFO_DAILY] Skipping quest:', quest.name, '-', reason);
      GAME.komunikat(`[DZIENNE] Pomijam: ${quest.name} - ${reason}`);
    }
    this.advanceQuestQueue();
  },

  // ============================================
  // SOCKET HANDLER
  // ============================================

  handleSockets(res) {
    if (DAILY.stop) return;

    // Movement completed
    if (res.a === 4 && res.char_id === GAME.char_id && DAILY.isNavigating) {
      this.nextStep();
    }

    // Normal teleport completed (a:12 with show_map)
    if (res.a === 12 && 'show_map' in res && DAILY.isTeleporting) {
      DAILY.isTeleporting = false;
      console.log('[AFO_DAILY] Normal teleport complete');

      // Check if entered portal
      if (DAILY.currentPortalLocId && GAME.char_data.loc === DAILY.currentPortalLocId) {
        DAILY.inPortal = true;
        DAILY.currentPortalLocId = 0;
      }

      this.afterTeleport();
    }

    // Private planet teleport (a:15)
    if (res.a === 15 && DAILY.isTeleporting) {
      DAILY.isTeleporting = false;
      console.log('[AFO_DAILY] Private planet teleport complete');
      this.afterTeleport();
    }

    // Clan planet teleport (a:39)
    if (res.a === 39 && DAILY.isTeleporting) {
      DAILY.isTeleporting = false;
      console.log('[AFO_DAILY] Clan planet teleport complete');
      this.afterTeleport();
    }

    // Empire enter/exit (a:50)
    if (res.a === 50 && DAILY.isTeleporting) {
      DAILY.isTeleporting = false;
      console.log('[AFO_DAILY] Empire action complete');
      this.afterTeleport();
    }
  },

  // Called after any teleport - waits for map data then continues
  afterTeleport() {
    // Skip if Anielska batch handler is managing its own teleport flow
    if (DAILY._anielskaTeleporting || DAILY._anielskaBatchActive) {
      console.log('[AFO_DAILY] afterTeleport skipped - Anielska batch active');
      return;
    }

    // Wait a bit for map data to load, then continue to quest NPC
    setTimeout(() => {
      if (DAILY.stop || DAILY.paused) return;

      const quest = DAILY._currentQuest || DAILY.questQueue[DAILY.currentQuestIdx];
      if (!quest) {
        this.processNextQuest();
        return;
      }

      // If returning from combat location, use saved NPC coords directly
      if (DAILY._returnFromCombat && DAILY._npcCoords) {
        console.log('[AFO_DAILY] Returning from combat, navigating to saved NPC coords:', DAILY._npcCoords);
        DAILY._returnFromCombat = false;
        const npcCoords = DAILY._npcCoords;
        DAILY._npcCoords = null;
        this.navigateToCoords(npcCoords.x, npcCoords.y, () => {
          const questData = this.findQuestByName(quest.name);
          if (questData) {
            this.startDialog(quest, questData.qb_id);
          } else {
            // Quest not found - might be complete
            this.onQuestComplete(quest);
          }
        });
        return;
      }
      DAILY._returnFromCombat = false;  // Clear flag if set but no coords

      // Wait for GAME.map_quests to be populated
      this.waitForMapQuests(quest, 0);
    }, 1000);
  },

  waitForMapQuests(quest, attempts) {
    if (DAILY.stop || DAILY.paused) return;

    // Check if map_quests is loaded (exists and is an object)
    // Empty {} means loaded but no quests = quest already completed
    // undefined/null/false means not yet loaded from server
    const mapQuestsLoaded = GAME.map_quests !== undefined &&
      GAME.map_quests !== null &&
      typeof GAME.map_quests === 'object';

    console.log('[AFO_DAILY] waitForMapQuests - loaded:', mapQuestsLoaded, 'map_quests:', GAME.map_quests);

    if (mapQuestsLoaded) {
      // Check if quest exists on map (not false/completed)
      const questData = this.findQuestByName(quest.name);
      if (questData) {
        console.log('[AFO_DAILY] map_quests loaded, navigating to NPC');
        this.navigateToQuestNPC(quest);
        return;
      }

      // Quest not found on this map - but might be in a portal!
      if (quest.location?.portal && !DAILY.inPortal) {
        console.log('[AFO_DAILY] Quest not on map but has portal - going to portal entry');
        this.goToPortalEntry(quest);
        return;
      }

      // Quest not found and no portal = ALREADY COMPLETED
      // Don't navigate to JSON coords - just mark complete immediately
      // This handles the case where quest was completed in previous session
      console.log('[AFO_DAILY] Quest not in map_quests after teleport - already completed:', quest.name);
      this.markQuestComplete(quest.name);
      this.advanceQuestQueue();
      return;
    }

    // Max 15 attempts (7.5 seconds) - increased for slower connections
    if (attempts >= 15) {
      console.warn('[AFO_DAILY] map_quests timeout after', attempts, 'attempts');

      // If quest has portal, try going there
      if (quest.location?.portal && !DAILY.inPortal) {
        console.log('[AFO_DAILY] Timeout but quest has portal - going to portal entry');
        this.goToPortalEntry(quest);
        return;
      }

      // Try JSON coords
      const coords = quest.location?.coords;
      if (coords) {
        console.log('[AFO_DAILY] Timeout, navigating to JSON coords:', coords);
        this.navigateToCoords(coords.x, coords.y, () => {
          const found = this.findQuestByName(quest.name);
          if (found) {
            this.startDialog(quest, found.qb_id);
          } else {
            console.warn('[AFO_DAILY] Quest not found after timeout - skipping');
            this.skipQuestWithMark(quest, 'Nie znaleziono questa na mapie');
          }
        });
        return;
      }

      // Last resort - try anyway
      const questData = this.findQuestByName(quest.name);
      if (questData) {
        console.warn('[AFO_DAILY] map_quests timeout, trying anyway');
        this.navigateToQuestNPC(quest);
      } else {
        console.warn('[AFO_DAILY] Quest not found after timeout - skipping');
        this.skipQuestWithMark(quest, 'Nie znaleziono questa na mapie');
      }
      return;
    }

    // Wait and retry
    setTimeout(() => this.waitForMapQuests(quest, attempts + 1), 500);
  },

  // ============================================
  // PANEL HANDLERS (called from main AFO)
  // ============================================

  bindHandlers() {
    // Will be called from AFO index.js when "Dzienne" is clicked
    console.log('[AFO_DAILY] Handlers bound');
  }
};

// Export
window.AFO_DAILY = AFO_DAILY;
console.log('[AFO] Daily Quests module loaded');
