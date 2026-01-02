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
        width: 280px;
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
        width: 280px;
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

  getTeleportLocationsOptions() {
    let options = '<option value="current">Obecna lokacja</option>';

    // Get teleport locations from game
    if (GAME.teleport_locs && Array.isArray(GAME.teleport_locs)) {
      const currentBorn = GAME.char_data.reborn;

      // Filter and sort by id (oldest first)
      const locs = GAME.teleport_locs
        .filter(loc => loc.reborn <= currentBorn)
        .sort((a, b) => a.id - b.id);

      locs.forEach(loc => {
        options += `<option value="${loc.id}">${loc.name}</option>`;
      });
    }

    // Add private planet if available
    if (GAME.quick_opts && GAME.quick_opts.private_planet) {
      options += '<option value="private">Prywatna planeta</option>';
    }

    return options;
  },

  // ============================================
  // TELEPORT LOCATIONS
  // ============================================

  getTeleportLocationsOptions() {
    const currentBorn = GAME.char_data.reborn;
    let options = '';
    let isFirstLoc = true;

    // Get teleport locations from game
    if (GAME.teleport_locs && Array.isArray(GAME.teleport_locs)) {
      // Filter and sort by id (oldest first)
      const locs = GAME.teleport_locs
        .filter(loc => loc.reborn <= currentBorn)
        .sort((a, b) => a.id - b.id);

      locs.forEach(loc => {
        const selected = isFirstLoc ? ' selected' : '';
        options += `<option value="${loc.id}"${selected}>${loc.name}</option>`;
        isFirstLoc = false;
      });
    }

    // Add current location option
    options += '<option value="current">Obecna lokacja</option>';

    // Add private planet if available
    if (GAME.quick_opts && GAME.quick_opts.private_planet) {
      options += '<option value="private">Prywatna planeta</option>';
    }

    return options;
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
      const githubUrl = 'https://raw.githubusercontent.com/rkurski/miszcz/develop/';

      const baseUrl = (devMode && localUrl) ? localUrl : githubUrl;
      const response = await fetch(baseUrl + 'remote/data/dailyQuests.json');
      const data = await response.json();

      DAILY.questData = data.quests || [];
      this.dataLoaded = true;
      console.log(`[AFO_DAILY] Loaded ${DAILY.questData.length} quests`);
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
        <div class="daily_quest_list" id="daily_quest_list"></div>
        <div class="daily_options">
          <label>SUB: 
            <select id="daily_substance">
              <option value="x20" selected>x20</option>
              <option value="ostateczna">Ostateczna</option>
            </select>
          </label>
          <label>Walka:
            <select id="daily_combat_loc">
              ${this.getTeleportLocationsOptions()}
            </select>
          </label>
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

    this.renderQuestList();
    this.bindUIHandlers();
  },

  hidePanel() {
    $('#daily_Panel').hide();
  },

  renderQuestList() {
    const currentBorn = GAME.char_data.reborn;
    const quests = DAILY.questData.filter(q => q.born.includes(currentBorn));

    let html = '';
    quests.forEach((quest, idx) => {
      const isCompleted = DAILY.completedQuests.includes(quest.name);
      const isSkipped = DAILY.skippedQuests.includes(quest.name);
      const isEnabled = quest.enabled && !isSkipped;
      const isCurrent = DAILY.questQueue[DAILY.currentQuestIdx]?.name === quest.name;

      const completedClass = isCompleted ? 'completed' : '';
      const currentClass = isCurrent && !DAILY.stop ? 'current' : '';
      const checked = isEnabled && !isCompleted ? 'checked' : '';

      html += `
        <div class="daily_quest_item ${completedClass} ${currentClass}" data-quest-name="${quest.name}">
          <input type="checkbox" ${checked} ${isCompleted ? 'disabled' : ''} data-idx="${idx}">
          <span class="quest_name">${quest.name}</span>
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
    }
    $(`.daily_quest_item[data-quest-name="${questName}"]`)
      .addClass('completed')
      .find('input').prop('disabled', true).prop('checked', false);
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

    // Substance selection
    $('#daily_substance').on('change', (e) => {
      DAILY.substance = $(e.target).val();
    });

    // Combat location selection
    $('#daily_combat_loc').on('change', (e) => {
      DAILY.combatLoc = $(e.target).val();
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

    // Build quest queue from enabled quests
    const currentBorn = GAME.char_data.reborn;
    const availableQuests = DAILY.questData
      .filter(q => q.born.includes(currentBorn))
      .filter(q => q.enabled && !DAILY.skippedQuests.includes(q.name))
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
    const groups = {};
    const nonPortal = [];

    quests.forEach(quest => {
      const portal = quest.location?.portal;
      if (portal && portal.innerLocId) {
        const key = `${quest.location.locId}_${portal.innerLocId}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(quest);
      } else {
        nonPortal.push(quest);
      }
    });

    // Flatten: non-portal quests first, then grouped portal quests
    const result = [...nonPortal];

    Object.values(groups).forEach(group => {
      // Mark first quest in group as portal entry point
      if (group.length > 0) {
        group[0]._isPortalGroupStart = true;
        group[0]._portalGroup = group;
        result.push(group[0]);
        // Additional quests in group will be processed within portal
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

    // Check if done
    if (DAILY.currentQuestIdx >= DAILY.questQueue.length) {
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

  processQuest(quest) {
    if (DAILY.stop || DAILY.paused) return;

    this.markQuestCurrent(quest.name);
    this.updateStatus(`Quest: ${quest.name}`);
    console.log('[AFO_DAILY] Processing quest:', quest.name);

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

    // Check if need portal entry first
    if (quest.location.portal && !DAILY.inPortal) {
      this.goToPortalEntry(quest);
      return;
    }

    // If already on location
    if (GAME.char_data.loc === locId || DAILY.inPortal) {
      this.navigateToQuestNPC(quest);
      return;
    }

    // Teleport
    this.updateStatus(`Teleport: ${quest.location.name || locId}`);
    DAILY.isTeleporting = true;
    GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });
    // Continue in handleSockets
  },

  goToPrivatePlanet(quest) {
    // First do return action to leave current location cleanly
    this.updateStatus('Powrót...');
    GAME.socket.emit('ga', { a: 16 });

    setTimeout(() => {
      if (DAILY.stop || DAILY.paused) return;
      this.updateStatus('Teleport: Prywatna planeta');
      DAILY.isTeleporting = true;
      DAILY._currentQuest = quest;
      GAME.socket.emit('ga', { a: 15, type: 13 });
    }, 800);
  },

  goToClanPlanet(quest) {
    // First do return action
    this.updateStatus('Powrót...');
    GAME.socket.emit('ga', { a: 16 });

    setTimeout(() => {
      if (DAILY.stop || DAILY.paused) return;
      this.updateStatus('Teleport: Planeta klanowa');
      DAILY.isTeleporting = true;
      DAILY._currentQuest = quest;
      GAME.socket.emit('ga', { a: 39, type: 32 });
    }, 800);
  },

  goToEmpireHQ(quest) {
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
    }, 800);
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
    this.navigateToCoords(portal.entry.x, portal.entry.y, () => {
      // Enter portal (move to the field triggers portal)
      DAILY.isTeleporting = true;
      DAILY.currentPortalLocId = portal.innerLocId;
      // The map change will be detected in handleSockets
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
      // Moving to exit coords should trigger portal exit
      DAILY.isTeleporting = true;
      // Map change to original loc will be handled in handleSockets
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
        this.onQuestComplete(quest);
        return;
      }
      // Dialog closed - check if quest is done
      const questData = this.findQuestByName(quest.name);
      if (!questData) {
        this.onQuestComplete(quest);
      } else {
        // Try again
        setTimeout(() => this.startDialog(quest, questData.qb_id), 300);
      }
      return;
    }

    // Check for requirements
    const requires = this.parseQuestRequirements();
    console.log('[AFO_DAILY] Parsed requirements:', requires);

    // If there's a finish_quest button, always try to click it first
    if ($("button[data-option=finish_quest]").length > 0) {
      // Check if requirements are met (or no requirements / ACTION type)
      if (!requires || requires.type === 'ACTION' || requires.current >= requires.target) {
        console.log('[AFO_DAILY] Requirements met, clicking finish button');
        this.clickFinishQuest();
        // Wait longer for dialog to update, then check again
        setTimeout(() => this.afterFinishClick(quest), 1000);
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

    // No special requirements - use questProceed to advance
    if (typeof kws !== 'undefined' && typeof kws.questProceed === 'function') {
      kws.questProceed();
    } else {
      this.manualQuestProceed();
    }

    // Wait and check again
    setTimeout(() => this.continueDialog(quest), 600);
  },

  // Called after clicking finish button - check what happened
  afterFinishClick(quest) {
    if (DAILY.stop || DAILY.paused) return;

    // FIRST: Check track_quest for completion (green = already done!)
    const qbId = this.getQuestQbId(quest);
    const trackQuest = $(`#track_quest_${qbId}`);
    if (trackQuest.length > 0 && trackQuest.find('.green').length > 0) {
      console.log('[AFO_DAILY] Track quest shows green after finish - quest complete');
      DAILY._finishClicked = false;
      $('#quest_con').hide();
      this.onQuestComplete(quest);
      return;
    }

    // Check if dialog closed
    if (!$('#quest_con').is(':visible')) {
      console.log('[AFO_DAILY] Dialog closed after finish - quest complete');
      DAILY._finishClicked = false;
      this.onQuestComplete(quest);
      return;
    }

    // Dialog still open - check if there are NEW requirements
    const newRequires = this.parseQuestRequirements();

    if (newRequires && newRequires.type !== 'ACTION' && newRequires.current < newRequires.target) {
      // New stage with new requirements!
      console.log('[AFO_DAILY] New requirements after finish:', newRequires.type, newRequires.current, '/', newRequires.target);
      DAILY._finishClicked = false;
      $('#quest_con').hide();
      this.handleQuestRequirement(quest, newRequires);
      return;
    }

    // Still has finish button? Continue clicking
    if ($("button[data-option=finish_quest]").length > 0) {
      console.log('[AFO_DAILY] Still has finish button, clicking again');
      this.clickFinishQuest();
      setTimeout(() => this.afterFinishClick(quest), 1000);
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
        this.onQuestComplete(quest);
        return;
      }
      // Dialog closed = quest might be done
      const questData = this.findQuestByName(quest.name);
      if (!questData) {
        this.onQuestComplete(quest);
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

  parseQuestRequirements() {
    const desc = $('#quest_con .quest_desc').text();

    // BOT_KILL: "Pokonaj: MobName(Rank) 0/100"
    const mobMatch = desc.match(/Pokonaj:\s*([^\(]+)\(([^\)]+)\)\s*(\d+)\/(\d+)/);
    if (mobMatch) {
      return {
        type: 'BOT_KILL',
        mob: mobMatch[1].trim(),
        rank: mobMatch[2].toLowerCase(),
        current: parseInt(mobMatch[3]),
        target: parseInt(mobMatch[4])
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

    // PvM POINTS: "Zdobyte punkty PvM 0/500" - same as BOT_KILL
    const pvmMatch = desc.match(/punkty\s+PvM.*?(\d+)\/(\d+)/i);
    if (pvmMatch) {
      return {
        type: 'BOT_KILL',  // Treat as bot kill - just fight on current location
        mob: 'any',
        rank: null,  // No specific rank
        current: parseInt(pvmMatch[1]),
        target: parseInt(pvmMatch[2]),
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

    return null;
  },

  // ============================================
  // QUEST TYPE HANDLERS
  // ============================================

  handleQuestRequirement(quest, requires) {
    if (DAILY.stop || DAILY.paused) return;

    console.log('[AFO_DAILY] Handling requirement:', requires);
    this.updateStatus(`${quest.name}: ${requires.current}/${requires.target}`);

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
      default:
        // Unknown type, try to continue
        setTimeout(() => this.continueDialog(quest), 500);
    }
  },

  handleBotKill(quest, requires) {
    if (DAILY.stop || DAILY.paused) return;

    DAILY.isInCombat = true;
    DAILY.killTarget = requires.target;
    DAILY.killCount = requires.current;
    DAILY._combatQuest = quest;
    DAILY._combatRequires = requires;

    // Start combat loop
    this.combatLoop();
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
    const qbId = this.getQuestQbId(quest);
    const trackQuest = $(`#track_quest_${qbId}`);

    // First check track_quest - it has green class when complete
    if (trackQuest.length > 0 && trackQuest.find('.green').length > 0) {
      console.log('[AFO_DAILY] Track quest shows green - requirements complete');
      this.onCombatComplete(quest);
      return;
    }

    // Also check quest_warunek span
    const questSpan = $(`.quest_warunek${qbId}`);
    if (questSpan.length > 0) {
      const current = parseInt(questSpan.attr('data-count')) || 0;
      const target = parseInt(questSpan.attr('data-max')) || requires.target;

      if (current >= target) {
        console.log('[AFO_DAILY] Combat requirements met:', current, '/', target);
        this.onCombatComplete(quest);
        return;
      }

      this.updateStatus(`${quest.name}: ${current}/${target}`);
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
    DAILY._lastRefresh = 0;

    // Re-open dialog to continue
    const questData = this.findQuestByName(quest.name);
    if (questData) {
      setTimeout(() => this.startDialog(quest, questData.qb_id), 500);
    } else {
      this.onQuestComplete(quest);
    }
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
    const spawnerIgnore = this.getSpawnerIgnore(requires?.rank);

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

    // Check track_quest for completion (green = done)
    const qbId = this.getQuestQbId(quest);
    const trackQuest = $(`#track_quest_${qbId}`);

    if (trackQuest.length > 0 && trackQuest.find('.green').length > 0) {
      console.log('[AFO_DAILY] PvP track quest shows green - complete');
      this.stopPvpAndComplete(quest);
      return;
    }

    // Also check quest_warunek
    const questSpan = $(`.quest_warunek${qbId}`);
    if (questSpan.length > 0) {
      const current = parseInt(questSpan.attr('data-count')) || 0;
      const target = parseInt(questSpan.attr('data-max')) || requires.target;

      this.updateStatus(`${quest.name}: ${current}/${target}`);

      if (current >= target) {
        console.log('[AFO_DAILY] PvP requirements met:', current, '/', target);
        this.stopPvpAndComplete(quest);
        return;
      }
    }

    // Start AFO_PVP if not already running
    if (typeof AFO_PVP !== 'undefined' && !PVP.stop) {
      // Already running, just keep monitoring
      setTimeout(() => this.doPvpCombat(quest, requires), 500);
    } else if (typeof AFO_PVP !== 'undefined') {
      console.log('[AFO_DAILY] Starting AFO_PVP');
      PVP.stop = false;
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

    // Return from enemy empire if needed
    if (DAILY.targetEmpire && DAILY.targetEmpire !== DAILY.ownEmpire) {
      console.log('[AFO_DAILY] Returning from enemy empire');
      this.updateStatus('Wychodzę z wrogiego imperium...');
      GAME.socket.emit('ga', { a: 50, type: 4 }); // Exit empire
      DAILY.targetEmpire = 0;

      // Wait 1s, then enter own empire
      setTimeout(() => {
        if (DAILY.stop || DAILY.paused) return;

        this.updateStatus('Wracam do własnego imperium...');
        GAME.socket.emit('ga', { a: 50, type: 5, e: DAILY.ownEmpire });

        // Wait 1s more, then continue dialog
        setTimeout(() => {
          if (DAILY.stop || DAILY.paused) return;
          this.continueDialog(quest);
        }, 1000);
      }, 1000);
      return;
    }

    setTimeout(() => this.continueDialog(quest), 300);
  },

  // ============================================
  // QUEST COMPLETION
  // ============================================

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

    // Check if we need to exit special location first
    this.exitSpecialLocationIfNeeded(() => {
      this.advanceQuestQueue();
    });
  },

  // Check if on special location and exit with a:16
  exitSpecialLocationIfNeeded(callback) {
    const currentQuest = DAILY.questQueue[DAILY.currentQuestIdx - 1] || DAILY._currentQuest;

    // Check what type of location we're on (locationType is at quest level, not location.type)
    const locType = currentQuest?.locationType;
    const needsExit = locType === 'private_planet' || locType === 'clan_planet' || locType === 'empire_hq';

    console.log('[AFO_DAILY] Checking exit for locationType:', locType, 'needsExit:', needsExit);

    if (needsExit) {
      console.log('[AFO_DAILY] Exiting special location:', locType);
      this.updateStatus('Wychodzę z lokacji...');
      GAME.socket.emit('ga', { a: 16 });

      // Wait for exit to complete
      setTimeout(() => {
        if (DAILY.stop || DAILY.paused) return;
        callback();
      }, 1000);
    } else {
      callback();
    }
  },

  advanceQuestQueue() {
    DAILY.currentQuestIdx++;
    DAILY.currentStageIdx = 0;
    DAILY.inPortal = false;
    DAILY.portalGroup = [];
    DAILY.portalGroupIdx = 0;
    DAILY._currentQuest = null;

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
    // Wait a bit for map data to load, then continue to quest NPC
    setTimeout(() => {
      if (DAILY.stop || DAILY.paused) return;

      const quest = DAILY._currentQuest || DAILY.questQueue[DAILY.currentQuestIdx];
      if (!quest) {
        this.processNextQuest();
        return;
      }

      // Wait for GAME.map_quests to be populated
      this.waitForMapQuests(quest, 0);
    }, 1000);
  },

  waitForMapQuests(quest, attempts) {
    if (DAILY.stop || DAILY.paused) return;

    // Check if map_quests has data
    if (GAME.map_quests && Object.keys(GAME.map_quests).length > 0) {
      // Check if quest exists on map (not false/completed)
      const questData = this.findQuestByName(quest.name);
      if (questData) {
        console.log('[AFO_DAILY] map_quests loaded, navigating to NPC');
        this.navigateToQuestNPC(quest);
      } else {
        // Quest not found = already completed!
        console.log('[AFO_DAILY] Quest not available on map - already completed:', quest.name);
        this.onQuestComplete(quest);
      }
      return;
    }

    // Max 10 attempts (5 seconds)
    if (attempts >= 10) {
      // After timeout, check if quest exists
      const questData = this.findQuestByName(quest.name);
      if (questData) {
        console.warn('[AFO_DAILY] map_quests timeout, trying anyway');
        this.navigateToQuestNPC(quest);
      } else {
        console.log('[AFO_DAILY] Quest not found after timeout - marking complete:', quest.name);
        this.onQuestComplete(quest);
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
