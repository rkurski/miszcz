/**
 * ============================================================================
 * AFO - Ball Searcher Module
 * ============================================================================
 * 
 * Automatyczne szukanie i zbieranie smoczych kul.
 * Uses EasyStar.js for pathfinding (like LPVM).
 * 
 * ============================================================================
 */

const AFO_BALL_SEARCHER = {

  // ============================================
  // STATE
  // ============================================

  Finder: null,               // EasyStar instance
  active: false,              // Aktywne szukanie
  paused: false,              // Czy pauza
  collectedCount: 0,          // Zebrane kule w tej sesji
  maxBalls: 7,                // Max kul do zebrania
  locations: [],              // Lista lokacji do przeszukania
  currentLocationIndex: 0,    // Aktualna lokacja
  cooldownUntil: 0,           // Timestamp końca cooldownu 61s
  cooldownSeconds: 61,        // Czas cooldownu w sekundach
  updateIntervalId: null,     // Interval dla popup UI updates
  Path: [],                   // Ścieżka EasyStar
  Matrix: [],                 // Mapa dla EasyStar
  currentBallTarget: null,    // Aktualne koordynaty docelowej kuli
  isMoving: false,            // Czy się poruszamy
  isTeleporting: false,       // Czy teleportujemy

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    this.loadEasyStar();
    this.bindSocketHandler();
    this.injectCSS();
    this.setupButtonInjection();
    console.log('[BALL_SEARCHER] Module initialized');
  },

  /**
   * Setup MutationObserver to inject button when dragon balls page opens
   */
  setupButtonInjection() {
    // Also try to inject immediately if page is already open
    this.tryInjectButton();

    // Watch for DOM changes to inject button when db page opens
    const observer = new MutationObserver(() => {
      this.tryInjectButton();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },

  /**
   * Try to inject the "SZUKAJ KUL" button on dragon balls page
   */
  tryInjectButton() {
    // Only inject if dragon balls page is visible and button doesn't exist
    const dbPageSwitch = $('button[data-option="db_page_switch"].active');
    const existingButton = $('.search_balls');

    if (dbPageSwitch.length > 0 && existingButton.length === 0) {
      $(`<button class="gold_button search_balls" style="margin-left:10px;">SZUKAJ KUL</button>`)
        .insertAfter(dbPageSwitch);
      console.log('[BALL_SEARCHER] Button injected');
    }
  },

  loadEasyStar() {
    // Check if already loaded (shared with LPVM)
    if (typeof EasyStar !== 'undefined') {
      this.Finder = new EasyStar.js();
      this.Finder.enableDiagonals();
      this.Finder.setAcceptableTiles([1]);
      console.log('[BALL_SEARCHER] EasyStar already loaded, reusing');
      return;
    }

    let esjs = document.createElement('script');
    esjs.src = 'https://cdn.jsdelivr.net/npm/easystarjs@0.4.3/bin/easystar-0.4.3.min.js';
    esjs.onload = () => {
      this.Finder = new EasyStar.js();
      this.Finder.enableDiagonals();
      this.Finder.setAcceptableTiles([1]);
      console.log('[BALL_SEARCHER] EasyStar loaded');
    };
    document.head.append(esjs);
  },

  bindSocketHandler() {
    GAME.socket.on('gr', (msg) => {
      if (this.active) {
        this.handleSockets(msg);
      }
    });
  },

  injectCSS() {
    const css = `
      #ball_searcher_popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
        width: 320px;
        background: url(/gfx/layout/tloPilot.png);
        background-size: cover;
        border-image: url(/gfx/layout/mapborder.png) 7 8 7 7 fill;
        border-style: solid;
        border-width: 7px 8px 7px 7px;
        box-shadow: 0px 0px 20px rgba(0,0,0,0.8);
        display: none;
      }
      #ball_searcher_popup .sekcja {
        background: rgba(0,0,0,0.7);
        color: #ffd700;
        padding: 8px;
        text-align: center;
        font-weight: bold;
        font-size: 14px;
        margin: 0;
        overflow: hidden;
        width: 310px;
      }
      #ball_searcher_popup .content {
        padding: 15px;
        color: white;
      }
      #ball_searcher_popup .bs_row {
        margin: 8px 0;
        font-size: 13px;
      }
      #ball_searcher_popup .bs_row b {
        color: #ffd700;
      }
      #ball_searcher_popup .bs_cooldown {
        color: #ff6b6b;
        font-weight: bold;
      }
      #ball_searcher_popup .bs_buttons {
        margin-top: 15px;
        text-align: center;
      }
      #ball_searcher_popup .bs_buttons button {
        margin: 0 5px;
        min-width: 80px;
      }
      #ball_searcher_popup .bs_paused {
        color: #ffaa00;
        font-weight: bold;
        text-align: center;
        padding: 5px;
        background: rgba(255,170,0,0.2);
        border-radius: 3px;
        margin-bottom: 10px;
      }
    `;

    if (!document.getElementById('ball_searcher_css')) {
      const style = document.createElement('style');
      style.id = 'ball_searcher_css';
      style.textContent = css;
      document.head.appendChild(style);
    }
  },

  // ============================================
  // VALIDATION
  // ============================================

  canStart() {
    // Check if balls are available for current reborn
    if (!this.areBallsAvailable()) {
      GAME.komunikat('[SZUKACZ KUL] Smocze kule nie są aktywne dla tego borna!');
      return false;
    }

    // Check if bonus8 is active
    if (!this.isBonusActive()) {
      GAME.komunikat('[SZUKACZ KUL] Brak aktywnego bonusu zbierania kul (Smoczy Radar)!');
      return false;
    }

    // TP count will be validated after fetching locations
    // (we don't know location count yet at this point)

    return true;
  },

  areBallsAvailable() {
    // Check if dragon balls are active for current reborn
    // Look for "AKTYWNE" text or active status in UI
    const reborn = GAME.char_data.reborn;
    const dbPanel = $(`#mdbp_${reborn}`);

    if (dbPanel.length === 0) {
      console.warn('[BALL_SEARCHER] Dragon ball panel not found');
      return false;
    }

    // Check if there's a timer (means not active) or if it shows AKTYWNE
    const hasTimer = dbPanel.find('.timer').length > 0;
    const dbText = dbPanel.find('.db_owners').text().trim();

    // If text contains "zresestowane" it means balls are active
    if (dbText.indexOf("Smocze kule zostaną zresestowane za") !== -1) {
      return true;
    }

    // If no timer, balls are active
    if (!hasTimer) {
      return true;
    }

    return false;
  },

  isBonusActive() {
    // bonus8 is timestamp when bonus expires, compare with current game time
    const bonus8 = GAME.char_data.bonus8;
    if (!bonus8 || bonus8 === 0 || bonus8 === null || bonus8 === undefined) {
      return false;
    }
    return bonus8 > GAME.getTime();
  },

  getGlobalAvailableBallsCount() {
    const reborn = GAME.char_data.reborn;
    // Helper to find the panel - ensure we look at the right place
    const dbPanel = $(`#mdbp_${reborn} .db_owners`);
    if (dbPanel.length === 0) {
      // If panel not found, proceed carefully, maybe 0 to stop or assume 7?
      // If we can't see the panel, we probably shouldn't search blindly if strict.
      // But let's assume 0 to be safe and avoid infinite loops.
      return 0;
    }

    // "jeszcze nie odnaleziona" indicates the ball is on the map
    return dbPanel.find('.ball_con:contains("jeszcze nie odnaleziona")').length;
  },

  getTeleportCount() {
    const tpEl = document.getElementById('tp_char_tpp');
    if (tpEl) {
      // Remove spaces (e.g. "1 512" -> "1512")
      const text = tpEl.textContent.replace(/\s+/g, '');
      return parseInt(text) || 0;
    }
    return 0;
  },

  // ============================================
  // UI - POPUP
  // ============================================

  showPopup() {
    // Remove existing popup if any
    $('#ball_searcher_popup').remove();

    const html = `
      <div id="ball_searcher_popup">
        <div class="sekcja">🔮 SZUKACZ KUL</div>
        <div class="content">
          <div id="bs_paused_banner" class="bs_paused" style="display:none;">⏸️ PAUZA</div>
          <div class="bs_row" id="bs_status"><b>Status:</b> Inicjalizacja...</div>
          <div class="bs_row" id="bs_progress"><b>Zebrano:</b> 0 / 7</div>
          <div class="bs_row" id="bs_location"><b>Lokacja:</b> - / -</div>
          <div class="bs_row bs_cooldown" id="bs_cooldown" style="display:none;"><b>Cooldown:</b> <span id="bs_cooldown_timer">61</span>s</div>
          <div class="bs_buttons">
            <button class="newBtn" id="bs_pause_btn">PAUZA</button>
            <button class="newBtn" id="bs_cancel_btn">ANULUJ</button>
          </div>
        </div>
      </div>
    `;

    $('body').append(html);
    $('#ball_searcher_popup').show();

    // Bind popup buttons
    $('#bs_pause_btn').click(() => {
      if (this.paused) {
        this.resume();
      } else {
        this.pause();
      }
    });

    $('#bs_cancel_btn').click(() => {
      this.stop('Anulowano przez użytkownika');
    });
  },

  hidePopup() {
    $('#ball_searcher_popup').remove();
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  },

  updatePopupStatus(status) {
    $('#bs_status').html(`<b>Status:</b> ${status}`);
  },

  updatePopupProgress() {
    $('#bs_progress').html(`<b>Zebrano:</b> ${this.collectedCount} / ${this.maxBalls}`);
  },

  updatePopupLocation() {
    $('#bs_location').html(`<b>Lokacja:</b> ${this.currentLocationIndex + 1} / ${this.locations.length}`);
  },

  startCooldownDisplay() {
    $('#bs_cooldown').show();

    const updateCooldown = () => {
      if (!this.active) return;

      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((this.cooldownUntil - now) / 1000));

      if (remaining > 0) {
        $('#bs_cooldown_timer').text(remaining);
      } else {
        $('#bs_cooldown').hide();
      }
    };

    // Update every second
    if (this.updateIntervalId) clearInterval(this.updateIntervalId);
    this.updateIntervalId = setInterval(updateCooldown, 1000);
    updateCooldown();
  },

  // ============================================
  // MAIN FLOW
  // ============================================

  start() {
    if (this.active) {
      GAME.komunikat('[SZUKACZ KUL] Już aktywny!');
      return;
    }

    if (!this.canStart()) {
      return;
    }

    // Update button state AFTER validation passes
    $('.search_balls').addClass('kws_active_button').text('ZATRZYMAJ');

    // Reset state
    this.active = true;
    this.paused = false;
    this.collectedCount = 0;
    this.currentLocationIndex = 0;
    this.locations = [];
    this.cooldownUntil = 0;
    this.Path = [];
    this.isMoving = false;
    this.isTeleporting = false;
    this.currentBallTarget = null;

    this.showPopup();
    this.updatePopupStatus('Pobieranie lokacji...');

    // Fetch locations
    this.fetchLocations();
  },

  pause() {
    if (!this.active || this.paused) return;

    this.paused = true;
    this.updatePopupStatus('⏸️ Wstrzymano');
    $('#bs_pause_btn').text('WZNÓW');
    $('#bs_paused_banner').show();
    console.log('[BALL_SEARCHER] Paused');
  },

  resume() {
    if (!this.active || !this.paused) return;

    this.paused = false;
    $('#bs_pause_btn').text('PAUZA');
    $('#bs_paused_banner').hide();
    this.updatePopupStatus('Wznawianie...');
    console.log('[BALL_SEARCHER] Resumed');

    // Continue from where we left off
    setTimeout(() => this.processNextLocation(), 500);
  },

  stop(reason) {
    console.log('[BALL_SEARCHER] Stopped:', reason);

    this.active = false;
    this.paused = false;
    this.isMoving = false;
    this.isTeleporting = false;

    this.updatePopupStatus(`Zatrzymano: ${reason}`);

    // Hide popup after delay so user can see the reason
    setTimeout(() => {
      this.hidePopup();
      GAME.komunikat(`[SZUKACZ KUL] ${reason}. Zebrano: ${this.collectedCount}/${this.maxBalls}`);
    }, 2000);

    // Update button state
    $('.search_balls').removeClass('kws_active_button').text('SZUKAJ KUL');
  },

  /**
   * Pause for manual ball pickup when no path found
   * Shows ball coordinates and waits for user to resume
   */
  pauseForManualPickup(ballX, ballY) {
    this.paused = true;
    this.isMoving = false;

    // Get all balls on this map for display
    const ballCoords = [];
    if (GAME.map_balls) {
      Object.keys(GAME.map_balls).forEach(key => {
        const [x, y] = key.split('_').map(Number);
        ballCoords.push(`(${x}, ${y})`);
      });
    }

    const coordsStr = ballCoords.length > 0 ? ballCoords.join(', ') : `(${ballX}, ${ballY})`;

    this.updatePopupStatus(`⚠️ Brak ścieżki! Kule: ${coordsStr}`);
    $('#bs_pause_btn').text('WZNÓW');
    $('#bs_paused_banner').html('⚠️ BRAK ŚCIEŻKI - Podnieś ręcznie i wznów').show();

    GAME.komunikat(`[SZUKACZ KUL] Brak ścieżki do kuli! Koordy: ${coordsStr}. Podnieś ręcznie i wznów.`);
    console.log(`[BALL_SEARCHER] Manual pickup required. Ball coords: ${coordsStr}`);
  },

  // ============================================
  // LOCATION SEARCHING
  // ============================================

  fetchLocations() {
    // Request teleport list
    GAME.emitOrder({ a: 19, type: 1 });

    // Wait for UI to populate
    setTimeout(() => {
      const currentReborn = GAME.char_data.reborn;
      const list = document.querySelector('#tp_list');

      if (!list) {
        this.stop('Nie udało się pobrać listy teleportów');
        return;
      }

      const items = list.querySelectorAll('[data-loc]');
      const locs = [];

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

      if (locs.length === 0) {
        this.stop('Brak dostępnych lokacji dla tego borna');
        return;
      }

      // Reverse to start from oldest locations
      this.locations = locs.reverse();

      console.log(`[BALL_SEARCHER] Found ${this.locations.length} locations for reborn ${currentReborn}`);
      this.updatePopupStatus(`Znaleziono ${this.locations.length} lokacji`);
      this.updatePopupLocation();

      // Check teleport count vs locations
      const tpCount = this.getTeleportCount();
      if (tpCount < this.locations.length) {
        this.stop(`Za mało teleportów! Masz: ${tpCount}, potrzebujesz: ${this.locations.length}`);
        return;
      }

      // Start searching
      setTimeout(() => this.processNextLocation(), 1000);
    }, 2000);
  },

  processNextLocation() {
    if (!this.active || this.paused) return;
    if (this.isMoving || this.isTeleporting) return;

    // Check if we collected all balls
    if (this.collectedCount >= this.maxBalls) {
      this.stop(`Zebrano wszystkie ${this.maxBalls} kul!`);
      return;
    }

    // Check global availability - stop if no balls are left on map
    const globalAvailable = this.getGlobalAvailableBallsCount();
    if (globalAvailable === 0) {
      this.stop('Brak wolnych kul na serwerze (wszystkie zebrane)');
      return;
    }

    // Check if we calculated how many we can actually get
    // We can only get what is available + what we collected this session (if we started with 0)
    // Actually, just checking globalAvailable > 0 is enough for "next iteration".
    // But if we just collected one, globalAvailable might update or not depending on game sync.
    // Assuming UI updates fast enough or we accept one extra teleport check.

    // Check if we checked all locations
    if (this.currentLocationIndex >= this.locations.length) {
      this.stop('Sprawdzono wszystkie lokacje');
      return;
    }

    const loc = this.locations[this.currentLocationIndex];
    this.updatePopupLocation();
    this.updatePopupStatus(`Teleport: ${loc.name}`);

    // Check if already on this location
    if (GAME.char_data.loc === loc.id) {
      console.log(`[BALL_SEARCHER] Already at location ${loc.id}`);
      setTimeout(() => this.checkForBalls(), 500);
    } else {
      this.teleportToLocation(loc.id);
    }
  },

  teleportToLocation(locId) {
    if (!this.active || this.paused) return;

    this.isTeleporting = true;
    console.log(`[BALL_SEARCHER] Teleporting to ${locId}`);

    GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });

    // Teleport completion is handled in handleSockets
  },

  // ============================================
  // BALL HANDLING
  // ============================================

  checkForBalls() {
    if (!this.active || this.paused) return;

    console.log('[BALL_SEARCHER] Checking for balls on map');
    this.updatePopupStatus('Szukam kul na mapie...');

    // Wait a moment for map data to load
    setTimeout(() => {
      if (!GAME.map_balls) {
        console.log('[BALL_SEARCHER] No balls on this map');
        this.updatePopupStatus('Brak kul, następna lokacja...');
        this.currentLocationIndex++;
        setTimeout(() => this.processNextLocation(), 500);
        return;
      }

      // Filter out balls with value false (already picked up)
      // GAME.map_balls format: { "x_y": 1 } for available, { "x_y": false } for picked
      const availableBalls = Object.entries(GAME.map_balls)
        .filter(([key, value]) => value !== false && value)
        .map(([key]) => key);

      if (availableBalls.length === 0) {
        console.log('[BALL_SEARCHER] No available balls on this map (all picked or none)');
        this.updatePopupStatus('Brak kul, następna lokacja...');
        this.currentLocationIndex++;
        setTimeout(() => this.processNextLocation(), 500);
        return;
      }

      // Get first available ball coordinates
      const ballCoordsStr = availableBalls[0];
      const [ballX, ballY] = ballCoordsStr.split('_').map(Number);

      console.log(`[BALL_SEARCHER] Found available ball at ${ballX},${ballY} (${availableBalls.length} total available)`);
      this.currentBallTarget = { x: ballX, y: ballY };

      // Check if we're already at the ball
      if (GAME.char_data.x === ballX && GAME.char_data.y === ballY) {
        this.pickupBall();
      } else {
        this.navigateToBall(ballX, ballY);
      }
    }, 800);
  },

  createMatrix() {
    this.Matrix = [];
    const mapcell = GAME.mapcell;

    if (!mapcell) {
      console.warn('[BALL_SEARCHER] mapcell not available');
      return false;
    }

    for (let i = 0; i < parseInt(GAME.map.max_y); i++) {
      this.Matrix[i] = [];
      for (let j = 0; j < parseInt(GAME.map.max_x); j++) {
        let key = (j + 1) + '_' + (i + 1);
        if (mapcell[key] && mapcell[key].m == 1) {
          this.Matrix[i][j] = 1;
        } else {
          this.Matrix[i][j] = 0;
        }
      }
    }
    return true;
  },

  navigateToBall(targetX, targetY) {
    if (!this.active || this.paused) return;

    this.updatePopupStatus(`Idę do kuli (${targetX}, ${targetY})`);
    console.log(`[BALL_SEARCHER] Navigating to ball at ${targetX},${targetY}`);

    if (!this.createMatrix()) {
      console.error('[BALL_SEARCHER] Failed to create matrix');
      this.currentLocationIndex++;
      setTimeout(() => this.processNextLocation(), 500);
      return;
    }

    this.Finder.setGrid(this.Matrix);
    this.Finder.findPath(
      GAME.char_data.x - 1,
      GAME.char_data.y - 1,
      targetX - 1,
      targetY - 1,
      (path) => {
        if (path === null) {
          console.log('[BALL_SEARCHER] No path found to ball');
          // Pause and show ball coordinates for manual pickup
          this.pauseForManualPickup(targetX, targetY);
          return;
        }

        // Remove current position from path
        if (path.length > 0 && path[0].x === GAME.char_data.x - 1 && path[0].y === GAME.char_data.y - 1) {
          path.shift();
        }

        this.Path = path;
        this.isMoving = true;
        console.log(`[BALL_SEARCHER] Path found, ${path.length} steps`);
        setTimeout(() => this.move(), 200);
      }
    );
    this.Finder.calculate();
  },

  move() {
    if (!this.active || this.paused || !this.isMoving) return;

    if (this.Path.length === 0) {
      this.isMoving = false;
      // Arrived at ball location
      this.pickupBall();
      return;
    }

    const target = this.Path[0];
    const cx = GAME.char_data.x - 1;
    const cy = GAME.char_data.y - 1;
    let dir = null;

    // Calculate direction (same as LPVM)
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
      this.Path.shift();
      this.move();
      return;
    }

    GAME.socket.emit('ga', { a: 4, dir: dir, vo: GAME.map_options.vo });
    // Movement completion handled in handleSockets
  },

  next() {
    if (!this.active || !this.isMoving) return;

    if (this.Path.length > 0) {
      this.Path.shift();
    }

    if (this.Path.length > 0) {
      setTimeout(() => this.move(), 150);
    } else {
      this.isMoving = false;
      // Arrived at ball
      this.pickupBall();
    }
  },

  pickupBall() {
    if (!this.active || this.paused) return;

    // Check cooldown
    const now = Date.now();
    if (this.cooldownUntil > now) {
      const waitMs = this.cooldownUntil - now;
      const waitSec = Math.ceil(waitMs / 1000);
      console.log(`[BALL_SEARCHER] Cooldown active, waiting ${waitSec}s`);
      this.updatePopupStatus(`Cooldown: ${waitSec}s`);
      this.startCooldownDisplay();

      setTimeout(() => this.pickupBall(), waitMs + 500);
      return;
    }

    const pickupButton = $('button.gold_button[data-option="pick_db"][data-id]');

    if (pickupButton.length === 0) {
      console.log('[BALL_SEARCHER] No pickup button found');
      // Maybe ball was taken by someone else, check for more balls
      this.currentBallTarget = null;
      this.checkForBalls();
      return;
    }

    const ballId = pickupButton.data('id');
    console.log(`[BALL_SEARCHER] Picking up ball ID: ${ballId}`);
    this.updatePopupStatus('Podnoszę kulę...');

    GAME.emitOrder({ a: 33, type: 3, id: parseInt(ballId) });

    // Handle pickup response in handleSockets
  },

  handlePickupSuccess() {
    this.collectedCount++;
    this.updatePopupProgress();
    console.log(`[BALL_SEARCHER] Ball collected! Total: ${this.collectedCount}/${this.maxBalls}`);

    // Set cooldown
    this.cooldownUntil = Date.now() + (this.cooldownSeconds * 1000);
    this.startCooldownDisplay();

    // Check if done
    if (this.collectedCount >= this.maxBalls) {
      this.stop(`Zebrano wszystkie ${this.maxBalls} kul!`);
      return;
    }

    // IMMEDIATELY check for more balls on this map or move to next location
    // Don't wait for cooldown - we'll wait when trying to pickup next ball
    this.updatePopupStatus('Szukam następnej kuli...');
    this.currentBallTarget = null;

    setTimeout(() => this.checkForBalls(), 500);
  },

  // ============================================
  // SOCKET HANDLER
  // ============================================

  handleSockets(res) {
    if (!this.active) return;

    // Movement completed
    if (res.a === 4 && res.char_id === GAME.char_id && this.isMoving) {
      this.next();
    }

    // Teleport completed (map loaded)
    if (res.a === 12 && 'show_map' in res && this.isTeleporting) {
      this.isTeleporting = false;
      console.log('[BALL_SEARCHER] Teleport completed');
      setTimeout(() => this.checkForBalls(), 800);
    }

    // Ball pickup response
    if (res.a === 33) {
      if (res.e === 0 || res.success) {
        // Success
        this.handlePickupSuccess();
      } else if (res.e === 2 || res.e === 3) {
        // Ball already taken or error
        console.log('[BALL_SEARCHER] Ball pickup failed, checking for more');
        this.currentBallTarget = null;
        setTimeout(() => this.checkForBalls(), 500);
      }
    }
  },

  // ============================================
  // UI HANDLERS
  // ============================================

  bindHandlers() {
    // Button on dragon balls page
    $('body').on('click', '.search_balls', () => {
      if (this.active) {
        this.stop('Anulowano przez użytkownika');
      } else {
        this.start();
      }
    });

    console.log('[BALL_SEARCHER] Handlers bound');
  }
};

// Export
window.AFO_BALL_SEARCHER = AFO_BALL_SEARCHER;
console.log('[AFO] Ball Searcher module loaded');
