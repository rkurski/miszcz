// ========== remote/afo/state.js ==========
/**
 * ============================================================================
 * AFO - State Objects
 * ============================================================================
 * 
 * All state/configuration objects for AFO subsystems.
 * These hold the runtime state for each automation module.
 * 
 * ============================================================================
 */

// ============================================
// LOW LEVEL FILTER
// ============================================
var LOWLVL = {
  stop: true
};

// ============================================
// PVP AUTOMATION STATE
// ============================================
var PVP = {
  stop: true,
  autoWars: true,          // wi - auto declare empire wars
  code: true,
  autoClanWars: true,      // wk - auto declare clan wars
  higherRebornAvoid: false,
  caseNumber: 0,
  wait: 10,
  wait2: 80,
  pvpDelay: 160,           // czekajpvp
  speedMultiplier: 50,     // WSP
  counter: 0,              // licznik
  dogory: false,
  loc: 0,
  adimp: false,
  g: 1,
  tele: false,
  playerTimer: [],         // tabb
  x: 1,
  y: 1,
  war: false,
  buff_imp: false,
  buff_clan: false,
  kontoTP: false,
  codeTP: false,
  clan_list: '',
  speed: 50,
  // Attack tracking (for lag detection)
  attackRetries: 0,
  tileRetries: 0,
  lastEnemyCount: -1,
  startX: 0,
  startY: 0,
  isAttacking: false
};

// ============================================
// RESPAWN/PVM AUTOMATION STATE
// ============================================
var RESP = {
  wait: 30,
  stop: true,
  checkOST: true,
  checkSSJ: true,
  jaka: 0,
  zmiana: false,
  kontoTP: false,
  codeTP: false,
  multifight: true,
  reload: false,
  reloadint: null,

  // Senzu types
  SENZU_BLUE: 'SENZU_BLUE',
  SENZU_GREEN: 'SENZU_GREEN',
  SENZU_YELLOW: 'SENZU_YELLOW',
  SENZU_RED: 'SENZU_RED',
  SENZU_MAGIC: 'SENZU_MAGIC',
  SENZU_PURPLE: 'SENZU_PURPLE',

  // Dynamic amounts
  CONF_BLUE_AMOUNT: function () {
    return Math.floor(GAME.getCharMaxPr() / 100 * 0.9999);
  },
  CONF_GREEN_AMOUNT: function () {
    return Math.floor(GAME.getCharMaxPr() / 2000 * 0.9999);
  },

  CONF_PURPLE_AMOUNT: 30,
  CONF_YELLOW_AMOUNT: 6,
  CONF_SENZU: false,

  // Bless flags
  bless: false,
  checkOST_timer: 0,
  code: true,

  // Bless types (b1-b18)
  b1: false, b2: false, b3: false, b4: false, b5: false,
  b6: false, b7: false, b8: false, b9: false, b10: false,
  b11: false, b12: false, b13: false, b14: false, b15: false,
  b16: false, b17: false, b18: false,

  buff_imp: false,
  buff_clan: false,
  loc: 0, // Will be set to GAME.char_data.loc on init

  // Optimization flags (set to false to disable and revert to original behavior)
  useLoadingCheck: true,      // Wait for GAME.is_loading before emitting
  useDebouncing: true,        // Throttle emits with minimum interval
  minEmitInterval: 30,        // Minimum ms between emits (when debouncing enabled)
  lastEmitTime: 0             // Last emit timestamp (internal use)
};

// ============================================
// LPVM (LISTY GOŃCZE) STATE
// ============================================
var LPVM = {
  Stop: true,
  Matrix: [],
  Map: 0,
  Path: [],
  Born: 2,
  pvm_killed: 0,
  limit: false,
  Killed: false,
  wait: 40,
  limit2: 60
};

// ============================================
// RESOURCES (MINING) STATE
// ============================================
var RES = {
  stop: true,
  last_loc: 0,
  mapcell: false,
  matrix: [],
  steps: [],
  steps_clone: [],
  target: null,
  path: [],
  processing: false,
  mines: {},
  last_mine: 0,
  speed: 100,
  mined_id: [],
  refresh_mines: true,
  first_mine: [],
  loc: 0,
  cdt: null,
  finder: null
};

// ============================================
// CODES/TRAINING STATE
// ============================================
var CODE = {
  licznik: 0,
  licznik2: 0,
  stop: true,
  wait: 2000,
  checkSSJ: true,
  acc: false,
  zast: false,
  b1: false,
  b2: false,
  whatNow: 0,
  what_to_train: 1,
  what_to_traintime: 1
};

// ============================================
// DAILY QUESTS AUTOMATION STATE
// ============================================
var DAILY = {
  stop: true,
  paused: false,

  // Quest data
  questData: [],              // Loaded from JSON
  enabledQuests: [],          // Quest names user wants to do
  completedQuests: [],        // Quest names done this session
  skippedQuests: [],          // Quest names user unchecked

  // Current progress
  currentQuestIdx: 0,
  currentStageIdx: 0,
  questQueue: [],             // Ordered list of quests to process

  // Portal grouping
  portalGroup: [],            // Quests to do in current portal location
  portalGroupIdx: 0,
  inPortal: false,
  currentPortalLocId: 0,

  // Empire handling
  inEmpire: false,
  ownEmpire: 0,
  targetEmpire: 0,

  // Navigation
  isNavigating: false,
  isTeleporting: false,
  Path: [],
  Matrix: [],
  Finder: null,

  // Combat
  isInCombat: false,
  combatTarget: null,
  killCount: 0,
  killTarget: 0,

  // User preferences
  substance: 'x20',           // 'x20' or 'ostateczna' - x20 by default
  combatLoc: 'current',       // 'current', 'private', or locId
  useCompressor: false,       // Use compressor (zegarek) for timer quests

  // Waiting quests (timer quests in progress)
  waitingQuests: [],          // [{name, quest, requires, endTime, qbId}]

  // Timing
  wait: 100
};

// ============================================
// CLAN TRAINING ASSISTANT STATE
// ============================================
var ASSIST = {
  stop: true,
  trainStop: true,
  assistStop: true,
  selectedPlayer: '',
  selectedPlayerId: 0,
  wait: 400,

  // Training state machine
  trainState: 0,
  assistReceived: false,

  // Assist state machine
  assistState: 0,

  // Cached data
  clanMembers: [],
  clanTrains: []
};

// ============================================
// INIT LOCATION-DEPENDENT STATE
// ============================================
function initAFOState() {
  if (typeof GAME !== 'undefined' && GAME.char_data) {
    RESP.loc = GAME.char_data.loc;
    RES.loc = GAME.char_data.loc;
  }
}

// Export all states
window.LOWLVL = LOWLVL;
window.PVP = PVP;
window.RESP = RESP;
window.LPVM = LPVM;
window.RES = RES;
window.CODE = CODE;
window.DAILY = DAILY;
window.ASSIST = ASSIST;
window.initAFOState = initAFOState;

console.log('[AFO] State module loaded');


// ========== remote/afo/templates.js ==========
/**
 * ============================================================================
 * AFO - Panel Templates
 * ============================================================================
 * 
 * CSS styles and HTML templates for all AFO panels.
 * Separated from logic for cleaner code organization.
 * 
 * Modern design with glassmorphism, gradients, and responsive layout.
 * Touch-friendly with viewport containment.
 * 
 * ============================================================================
 */

const AFO_Templates = {

  // ============================================
  // CSS STYLES - Modern Design System
  // ============================================

  css: {
    // Base/shared styles for all panels
    base: `
      /* ========================================
         AFO Design System - Base Variables
         ======================================== */
      :root {
        --afo-bg-primary: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        --afo-bg-header: linear-gradient(90deg, #0f4c75, #1b6ca8);
        --afo-bg-button: rgba(255, 255, 255, 0.05);
        --afo-bg-button-hover: rgba(63, 193, 201, 0.15);
        --afo-accent: #3fc1c9;
        --afo-accent-hover: #55efc4;
        --afo-danger: #ff6b6b;
        --afo-success: #2ed573;
        --afo-warning: #f9ca24;
        --afo-border: #0f4c75;
        --afo-text: #ffffff;
        --afo-text-muted: #b8b8b8;
        --afo-shadow: 0 0 25px rgba(63, 193, 201, 0.25);
        --afo-radius: 12px;
        --afo-radius-sm: 6px;
      }

      /* Status badge styles */
      .gh_status, .pvp_status, .resp_status, .code_status, 
      .lpvm_status, .glebia_status, .res_status {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .red { 
        background: rgba(255, 107, 107, 0.2); 
        color: #ff6b6b; 
      }
      .green { 
        background: rgba(46, 213, 115, 0.2); 
        color: #2ed573; 
      }

      /* Shared panel base */
      .afo-panel {
        background: var(--afo-bg-primary);
        position: fixed;
        z-index: 9999;
        padding: 0;
        border-radius: var(--afo-radius);
        border: 2px solid var(--afo-border);
        box-shadow: var(--afo-shadow);
        user-select: none;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        overflow: hidden;
        touch-action: none;
      }

      /* Panel header - using .afo-header to avoid conflict with game .sekcja */
      .afo-panel .afo-header {
        background: var(--afo-bg-header);
        padding: 10px 14px;
        color: var(--afo-accent);
        font-weight: bold;
        text-align: center;
        cursor: move;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: auto !important;
        height: auto !important;
        line-height: normal !important;
        margin: 0 !important;
        text-shadow: none !important;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .afo-panel .panel-content {
        padding: 8px;
      }

      .afo-panel .afo-button {
        cursor: pointer;
        text-align: left;
        padding: 10px 12px;
        color: white;
        border-radius: var(--afo-radius-sm);
        margin-bottom: 4px;
        background: var(--afo-bg-button);
        transition: all 0.2s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        border: none;
        width: 100%;
        box-sizing: border-box;
      }

      .afo-panel .afo-button:hover {
        background: var(--afo-bg-button-hover);
        transform: translateX(2px);
      }

      .afo-panel .afo-button:active {
        transform: scale(0.98);
      }

      .afo-panel .afo-input {
        width: 100%;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--afo-border);
        border-radius: var(--afo-radius-sm);
        color: white;
        font-size: 12px;
        text-align: center;
        margin-top: 4px;
        box-sizing: border-box;
      }

      .afo-panel .afo-input:focus {
        outline: none;
        border-color: var(--afo-accent);
        box-shadow: 0 0 0 2px rgba(63, 193, 201, 0.2);
      }

      .afo-panel .afo-input::placeholder {
        color: #666;
      }

      .afo-panel .afo-select {
        width: 100%;
        padding: 8px 10px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--afo-border);
        border-radius: var(--afo-radius-sm);
        color: white;
        font-size: 11px;
        margin-top: 4px;
        cursor: pointer;
      }

      .afo-panel .afo-select:focus {
        outline: none;
        border-color: var(--afo-accent);
      }

      .afo-panel .afo-select option {
        background: #1a1a2e;
        color: white;
      }

      /* Fix for newBtn text centering */
      .afo-panel button.newBtn,
      #daily_Panel button.newBtn,
      #ball_searcher_popup button.newBtn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        line-height: 1 !important;
      }

      /* Responsive styles */
      @media (max-width: 768px) {
        .afo-panel {
          max-width: 90vw !important;
        }
        
        .afo-panel .afo-header {
          padding: 8px 10px;
          font-size: 10px;
        }
        
        .afo-panel .afo-button {
          padding: 8px 10px;
          font-size: 11px;
        }
        
        .afo-panel .panel-content {
          padding: 6px;
        }
      }

      @media (max-width: 480px) {
        .afo-panel {
          max-width: 85vw !important;
          min-width: 140px !important;
        }
        
        .afo-panel .afo-button {
          padding: 6px 8px;
          font-size: 10px;
        }
      }
    `,

    main: `
      /* Main panel - special styling to distinguish from sub-panels */
      #main_Panel {
        top: 200px;
        right: 20px;
        width: 170px;
        min-width: 150px;
        border: 2px solid #1b6ca8;
        box-shadow: 0 0 30px rgba(63, 193, 201, 0.35), inset 0 0 20px rgba(63, 193, 201, 0.05);
      }

      #main_Panel .afo-header {
        background: linear-gradient(90deg, #1b6ca8, #3fc1c9);
        color: #ffffff;
        font-size: 12px;
        padding: 12px 14px;
      }
    `,

    pvp: `
      #pvp_Panel {
        top: 400px;
        right: 200px;
        width: 180px;
        min-width: 160px;
      }
    `,

    resp: `
      #resp_Panel {
        top: 400px;
        right: 200px;
        width: 180px;
        min-width: 160px;
        max-height: 80vh;
        overflow-y: auto;
      }

      #resp_Panel::-webkit-scrollbar {
        width: 6px;
      }

      #resp_Panel::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }

      #resp_Panel::-webkit-scrollbar-thumb {
        background: var(--afo-border);
        border-radius: 3px;
      }

      #resp_Panel::-webkit-scrollbar-thumb:hover {
        background: var(--afo-accent);
      }
    `,

    code: `
      #code_Panel {
        top: 400px;
        right: 200px;
        width: 200px;
        min-width: 180px;
      }

      #code_Panel .select-group {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      #code_Panel .select-label {
        color: var(--afo-text-muted);
        font-size: 10px;
        margin-bottom: 4px;
        display: block;
      }
    `,

    res: `
      #res_Panel {
        top: 400px;
        right: 400px;
        width: 170px;
        min-width: 150px;
      }

      #res_Panel .res-info {
        text-align: center;
        color: var(--afo-text-muted);
        font-size: 11px;
        padding: 8px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: var(--afo-radius-sm);
        margin-top: 8px;
      }

      #res_Panel ul {
        margin: 8px 0;
        padding: 0;
        list-style: none;
        color: white;
        text-align: center;
        font-size: 11px;
      }

      #res_Panel ul li {
        padding: 4px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
    `,

    lpvm: `
      #lpvm_Panel {
        top: 500px;
        right: 20px;
        width: 180px;
        min-width: 160px;
      }

      #lpvm_Panel .kill-counter {
        text-align: center;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: var(--afo-radius-sm);
        margin-bottom: 8px;
        color: var(--afo-accent);
        font-size: 12px;
      }

      #lpvm_Panel .kill-counter b {
        font-size: 16px;
        color: var(--afo-success);
      }
    `,

    glebia: `
      #glebia_Panel {
        top: 400px;
        right: 200px;
        width: 180px;
        min-width: 160px;
      }
    `,

    assist: `
      #assist_Panel {
        top: 400px;
        right: 200px;
        width: 200px;
        min-width: 180px;
      }

      #assist_Panel .select-group {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      #assist_Panel .select-label {
        color: var(--afo-text-muted);
        font-size: 10px;
        margin-bottom: 4px;
        display: block;
      }
    `
  },

  // ============================================
  // HTML TEMPLATES - Modern Structure
  // ============================================

  html: {
    main: `
      <div id="main_Panel" class="afo-panel">
        <div class="afo-header panel_dragg">🎮 GIENIOBOT</div>
        <div class="panel-content">
          <div class='afo-button gh_button gh_resp'>
            <span>⚔️ PVM</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_pvp'>
            <span>🗡️ PVP</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_lpvm'>
            <span>📜 Listy</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_res'>
            <span>💎 Zbierajka</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_code'>
            <span>🔑 Kody</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_low_lvls'>
            <span>👁️ Ukryj low</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_glebia'>
            <span>🔪 Głębia</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_daily'>
            <span>📅 Dzienne</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_assist'>
            <span>🤝 Asystent</span>
            <b class='gh_status red'>Off</b>
          </div>
        </div>
      </div>
    `,

    pvp: `
      <div id="pvp_Panel" class="afo-panel">
        <div class="afo-header pvp_dragg">🗡️ PVP</div>
        <div class="panel-content">
          <div class='afo-button pvp_button pvp_pvp'>
            <span>⚔️ PVP</span>
            <b class='pvp_status red'>Off</b>
          </div>
          <div class='afo-button pvp_button pvp_Code'>
            <span>🔑 Kody</span>
            <b class='pvp_status green'>On</b>
          </div>
          <div class="afo-button pvp_button pvpCODE_konto">
            <span>👤 Konto</span>
            <b class="pvp_status red">Off</b>
          </div>
          <div class='afo-button pvp_button pvp_rb_avoid'>
            <span>🛡️ Unikaj borny</span>
            <b class='pvp_status red'>Off</b>
          </div>
          <div class='afo-button pvp_button pvp_WI'>
            <span>🏰 Wojny Imp</span>
            <b class='pvp_status green'>On</b>
          </div>
          <div class='afo-button pvp_button pvp_WK'>
            <span>⚔️ Wojny Klan</span>
            <b class='pvp_status green'>On</b>
          </div>
          <div class='afo-button pvp_button pvp_buff_imp'>
            <span>💪 Bufy IMP</span>
            <b class='pvp_status red'>Off</b>
          </div>
          <div class='afo-button pvp_button pvp_buff_clan'>
            <span>💪 Bufy KLAN</span>
            <b class='pvp_status red'>Off</b>
          </div>
          <input class='afo-input' type='text' placeholder="Lista wojen" name='pvp_capt' value='' />
          <input class='afo-input' type='text' placeholder="Szybkość 10-100" name='speed_capt' value='50' />
        </div>
      </div>
    `,

    resp: `
      <div id="resp_Panel" class="afo-panel">
        <div class="afo-header resp_dragg">⚔️ PVM - SPAWN</div>
        <div class="panel-content">
          <div class="afo-button resp_button resp_resp">
            <span>▶️ RESP</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_code">
            <span>🔑 Kody</span>
            <b class="resp_status green">On</b>
          </div>
          <div class="afo-button resp_button resp_konto">
            <span>👤 Konto</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_sub">
            <span>🧪 Subka</span>
            <b class="resp_status green">On</b>
          </div>
          <div class="afo-button resp_button resp_ost">
            <span>💊 Jaka</span>
            <b class="resp_status green">Ost</b>
          </div>
          <div class="afo-button resp_button resp_multi">
            <span>👥 Multiwalka</span>
            <b class="resp_status green">On</b>
          </div>
          <div class="afo-button resp_button resp_ssj">
            <span>⚡ SSJ</span>
            <b class="resp_status green">On</b>
          </div>
          <div class="afo-button resp_button resp_buff_imp">
            <span>🏰 Bufki IMP</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_buff_clan">
            <span>⚔️ Bufki KLAN</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_blue">
            <span>🔵 BLUE</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_green">
            <span>🟢 GREEN</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_purple">
            <span>🟣 PURPLE</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_yellow">
            <span>🟡 YELLOW</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_red">
            <span>🔴 RED</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_magic">
            <span>✨ Wyciąg</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bless">
            <span>🙏 BŁOGO</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh1">
            <span>🐉 SMOK</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh2">
            <span>📈 5% EXP</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh3">
            <span>💪 5% MOC</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh4">
            <span>📊 150K MAX</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh5">
            <span>💪 5% MOC</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh6">
            <span>🎯 5% PSK</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh7">
            <span>🚀 200% EXP</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh8">
            <span>📈 500 LVL</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh9">
            <span>🌟 500% EXP</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh10">
            <span>💥 25% MOC</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh11">
            <span>📊 100% Limit</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh14">
            <span>📊 100% Limit</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh12">
            <span>📈 200% Przyrost</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh13">
            <span>🔥 300% Przyrost</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh15">
            <span>🔑 5% kod</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh16">
            <span>⏱️ 5 Min cd pvp</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh17">
            <span>⚡ 15% szybciej</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh18">
            <span>🍀 15% szansa</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_on">
            <span>✅ Włącz All</span>
            <b class="resp_status green">On</b>
          </div>
          <div class="afo-button resp_button resp_off">
            <span>❌ Wyłącz All</span>
            <b class="resp_status red">Off</b>
          </div>
        </div>
      </div>
    `,

    code: `
      <div id="code_Panel" class="afo-panel">
        <div class="afo-header code_dragg">🔑 KODY</div>
        <div class="panel-content">
          <div class="afo-button code_button code_code">
            <span>▶️ KODY</span>
            <b class="code_status red">Off</b>
          </div>
          <div class="afo-button code_button code_acc">
            <span>👤 Konto</span>
            <b class="code_status red">Off</b>
          </div>
          <div class="afo-button code_button code_zast">
            <span>👥 Zastępstwa</span>
            <b class="code_status red">Off</b>
          </div>
          <div class="afo-button code_button code_bh1">
            <span>🎓 Błogo 250% tren</span>
            <b class="code_status red">Off</b>
          </div>
          <div class="afo-button code_button code_bh2">
            <span>🔑 Błogo 5% kod</span>
            <b class="code_status red">Off</b>
          </div>
          <div class="select-group">
            <label class='select-label'>Statystyka:</label>
            <select id='bot_what_to_train' class='afo-select'>
              <option value='1'>💪 Siła</option>
              <option value='2'>⚡ Szybkość</option>
              <option value='3'>🛡️ Wytrzymałość</option>
              <option value='4'>🧠 Siła Woli</option>
              <option value='5'>✨ Energia Ki</option>
              <option value='6'>🔮 Wtajemniczenie</option>
            </select>
          </div>
          <div class="select-group">
            <label class='select-label'>Czas treningu:</label>
            <select id='bot_what_to_traintime' class='afo-select'>
              <option value='1'>1 godz.</option>
              <option value='2'>2 godz.</option>
              <option value='3'>3 godz.</option>
              <option value='4'>4 godz.</option>
              <option value='5'>5 godz.</option>
              <option value='6'>6 godz.</option>
              <option value='7'>7 godz.</option>
              <option value='8'>8 godz.</option>
              <option value='9'>9 godz.</option>
              <option value='10'>10 godz.</option>
              <option value='11'>11 godz.</option>
              <option value='12'>12 godz.</option>
            </select>
          </div>
        </div>
      </div>
    `,

    res: `
      <div id="res_Panel" class="afo-panel">
        <div class="afo-header res_dragg">💎 SUROWCE</div>
        <div class="panel-content">
          <div class="afo-button res_button res_res">
            <span>⛏️ ZBIERAJ</span>
            <b class="res_status red">Off</b>
          </div>
          <div class="res-info bt_cool"></div>
          <ul></ul>
        </div>
      </div>
    `,

    lpvm: `
      <div id="lpvm_Panel" class="afo-panel">
        <div class="afo-header lpvm_dragg">📜 LISTY GOŃCZE</div>
        <div class="panel-content">
          <div class='kill-counter pvm_killed'>Wykonane listy: <b>0</b></div>
          <div class="afo-button lpvm_button lpvm_lpvm">
            <span>▶️ START</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <div class="afo-button lpvm_button lpvm_g">
            <span>🔴 G-Born</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <div class="afo-button lpvm_button lpvm_u">
            <span>🔵 U-Born</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <div class="afo-button lpvm_button lpvm_s">
            <span>🟢 S-Born</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <div class="afo-button lpvm_button lpvm_h">
            <span>🟣 H-Born</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <div class="afo-button lpvm_button lpvm_m">
            <span>🟠 M-Born</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <div class="afo-button lpvm_button lpvm_limit">
            <span>📊 Limit</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <input class='afo-input' type='text' placeholder="Ilość list" name='lpvm_capt' value='60' />
        </div>
      </div>
    `,

    glebia: `
      <div id="glebia_Panel" class="afo-panel">
        <div class="afo-header glebia_dragg">🔪 GŁĘBIA</div>
        <div class="panel-content">
          <div class='afo-button glebia_button glebia_toggle'>
            <span>▶️ Start</span>
            <b class='glebia_status red'>Off</b>
          </div>
          <div class='afo-button glebia_button glebia_code'>
            <span>🔑 Kody</span>
            <b class='glebia_status red'>Off</b>
          </div>
          <div class='afo-button glebia_button glebia_konto'>
            <span>👤 Konto</span>
            <b class='glebia_status red'>Off</b>
          </div>
          <input class='afo-input' type='text' placeholder="Szybkość 10-100" name='glebia_speed' value='50' />
        </div>
      </div>
    `,

    assist: `
      <div id="assist_Panel" class="afo-panel">
        <div class="afo-header assist_dragg">🤝 ASYSTENT</div>
        <div class="panel-content">
          <div class='afo-button assist_button assist_train'>
            <span>🏋️ Trenuj</span>
            <b class='assist_status red'>Off</b>
          </div>
          <div class='afo-button assist_button assist_assist'>
            <span>🤝 Asystuj</span>
            <b class='assist_status red'>Off</b>
          </div>
          <div class="select-group">
            <label class='select-label'>Wybierz gracza:</label>
            <select id='assist_player_select' class='afo-select'>
              <option value="0">-</option>
            </select>
          </div>
        </div>
      </div>
    `
  },

  // ============================================
  // HELPER METHODS
  // ============================================

  getAllCSS() {
    return Object.values(this.css).join('\n');
  },

  /**
   * Make an element draggable with touch support and viewport containment
   * @param {HTMLElement} element - The element to make draggable
   * @param {HTMLElement} handle - The drag handle element
   */
  makeDraggable(element, handle) {
    let offsetX = 0, offsetY = 0;
    let isDragging = false;

    const onStart = (e) => {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = element.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
      element.style.transition = 'none';

      // Bring to front
      document.querySelectorAll('.afo-panel').forEach(p => p.style.zIndex = '9999');
      element.style.zIndex = '10000';
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      let newX = clientX - offsetX;
      let newY = clientY - offsetY;

      // Viewport containment
      const maxX = window.innerWidth - element.offsetWidth;
      const maxY = window.innerHeight - element.offsetHeight;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      element.style.left = newX + 'px';
      element.style.top = newY + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    };

    const onEnd = () => {
      isDragging = false;
      element.style.transition = '';
    };

    // Mouse events
    handle.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    // Touch events
    handle.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  },

  /**
   * Constrain all panels to viewport on window resize
   */
  setupViewportContainment() {
    const constrainPanel = (panel) => {
      if (!panel || panel.style.display === 'none') return;

      const rect = panel.getBoundingClientRect();
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;

      let needsUpdate = false;
      let newX = rect.left;
      let newY = rect.top;

      if (rect.left < 0) { newX = 0; needsUpdate = true; }
      if (rect.top < 0) { newY = 0; needsUpdate = true; }
      if (rect.left > maxX) { newX = Math.max(0, maxX); needsUpdate = true; }
      if (rect.top > maxY) { newY = Math.max(0, maxY); needsUpdate = true; }

      if (needsUpdate) {
        panel.style.left = newX + 'px';
        panel.style.top = newY + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
      }
    };

    window.addEventListener('resize', () => {
      document.querySelectorAll('.afo-panel').forEach(constrainPanel);
    });
  },

  injectAll() {
    // Inject all CSS
    $("body").append(`<style id="afo_styles">${this.getAllCSS()}</style>`);

    // Inject all panels
    $("body").append(this.html.main);
    $("body").append(this.html.pvp);
    $("body").append(this.html.resp);
    $("body").append(this.html.code);
    $("body").append(this.html.res);
    $("body").append(this.html.lpvm);
    $("body").append(this.html.glebia);
    $("body").append(this.html.assist);

    // Hide sub-panels initially
    $("#pvp_Panel").hide();
    $("#resp_Panel").hide();
    $("#code_Panel").hide();
    $("#res_Panel").hide();
    $("#lpvm_Panel").hide();
    $("#glebia_Panel").hide();
    $("#assist_Panel").hide();

    // Setup custom draggable with touch support and viewport containment
    this.makeDraggable(document.getElementById('main_Panel'), document.querySelector('.panel_dragg'));
    this.makeDraggable(document.getElementById('pvp_Panel'), document.querySelector('.pvp_dragg'));
    this.makeDraggable(document.getElementById('resp_Panel'), document.querySelector('.resp_dragg'));
    this.makeDraggable(document.getElementById('res_Panel'), document.querySelector('.res_dragg'));
    this.makeDraggable(document.getElementById('lpvm_Panel'), document.querySelector('.lpvm_dragg'));
    this.makeDraggable(document.getElementById('code_Panel'), document.querySelector('.code_dragg'));
    this.makeDraggable(document.getElementById('glebia_Panel'), document.querySelector('.glebia_dragg'));
    this.makeDraggable(document.getElementById('assist_Panel'), document.querySelector('.assist_dragg'));

    // Setup viewport containment on resize
    this.setupViewportContainment();

    console.log('[AFO_Templates] All panels injected with modern UI');
  }
};

// Export
window.AFO_Templates = AFO_Templates;
console.log('[AFO] Templates module loaded');


// ========== remote/afo/pvp.js ==========
/**
 * ============================================================================
 * AFO - PVP Module
 * ============================================================================
 * 
 * PVP automation logic - auto-attacking players, territory control, wars.
 * Uses the global PVP state object from afo/state.js
 * 
 * ============================================================================
 */

const AFO_PVP = {

  // ============================================
  // MAIN PVP LOOP
  // ============================================

  checkBuffsAndSSJ() {
    let imp = $("#leader_player").find("[data-option=show_player]").attr("data-char_id");
    let emp = GAME.char_data.empire;
    let buff = $(".emp_buff .pull-right").find("button").attr("data-option") == "activate_emp_buff";
    let buff_id = $(".emp_buff .pull-right").find("button").attr("data-buff");
    let who_win = $("#gne_satus").text().includes("ZŁO");
    let abut = $("#clan_buffs").find(`button[data-option="activate_war_buff"]`);
    let isDisabled = $("#clan_buffs").find(`button[data-option="activate_war_buff"]`).parents("tr").hasClass("disabled");

    // SSJ activation
    if (GAME.quick_opts.ssj && $("#ssj_bar").css("display") === "none" && PVP.code) {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 18, type: 5, tech_id: GAME.quick_opts.ssj[0] });
      }, 1500);
      return true;
    } else if ($('#ssj_status').text() == "--:--:--" && PVP.code && GAME.quick_opts.ssj) {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 18, type: 6 });
      }, 1500);
      return true;
    } else if ($('#ssj_status').text() <= '00:00:05' && PVP.code && GAME.quick_opts.ssj) {
      return true;
    }
    // Training/codes
    else if ($("#train_uptime").find('.timer').length == 0 && !GAME.is_training && PVP.code) {
      GAME.socket.emit('ga', { a: 8, type: 2, stat: 1, duration: 1 });
      if (PVP.codeTP) {
        setTimeout(() => {
          GAME.socket.emit('ga', { a: 8, type: 5, multi: ':checked', apud: 'vzaaa' });
        }, 1600);
      } else {
        setTimeout(() => {
          GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' });
        }, 1600);
      }
      return true;
    } else if (GAME.is_training && $("#train_uptime").find('.timer').length == 1 && PVP.code) {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 8, type: 3 });
      }, 1600);
      return true;
    } else if (GAME.is_training && PVP.code) {
      GAME.socket.emit('ga', { a: 8, type: 3 });
      return true;
    }
    // Buffs
    else if (imp == GAME.char_id && PVP.buff_imp && buff && buff_id < 4) {
      GAME.socket.emit('ga', { a: 50, type: 6, buff: buff_id });
      return true;
    } else if (imp == GAME.char_id && PVP.buff_imp && buff && buff_id < 7 && ((emp == 1 || emp == 3) && who_win)) {
      GAME.socket.emit('ga', { a: 50, type: 6, buff: buff_id });
      return true;
    } else if (imp == GAME.char_id && PVP.buff_imp && buff && buff_id < 7 && ((emp == 2 || emp == 4) && !who_win)) {
      GAME.socket.emit('ga', { a: 50, type: 6, buff: buff_id });
      return true;
    } else if (PVP.buff_clan && GAME.klan_data != undefined && abut.length && !isDisabled) {
      $(" .newBtn.activate_all_clan_buffs").click();
      return true;
    }
    return false;
  },

  start() {
    if (!PVP.stop && !GAME.is_loading) {
      if ($("#player_list_con").find("[data-option=load_more_players]").length != 0) {
        $("#player_list_con").find("[data-option=load_more_players]").click();
      }
      this.action();
    } else if (GAME.is_loading) {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
    }
  },

  action() {
    switch (PVP.caseNumber) {
      case 0: PVP.caseNumber++; this.check_position_x(); break;
      case 1: PVP.caseNumber++; this.check_position_y(); break;
      case 2: PVP.caseNumber++; this.check(); break;
      case 3: PVP.caseNumber++; this.check_players(); break;
      case 4: this.kill_players(); break; // Don't increment - attackLoop handles progression
      case 5: PVP.caseNumber++; this.check_players2(); break;
      case 6: PVP.caseNumber++; this.declareEmpireWars(); break;
      case 7: PVP.caseNumber++; this.check_location(); break;
      case 8: PVP.caseNumber++; this.check2(); break;
      case 9: PVP.caseNumber++; this.check_players2(); break;
      case 10: PVP.caseNumber++; this.dec_wars(); break;
      case 11: PVP.caseNumber = 0; this.go(); break;
      default: break;
    }
  },

  // ============================================
  // POSITION & PLAYER CHECKS
  // ============================================

  check_position_x() {
    PVP.x = GAME.char_data.x;
    window.setTimeout(() => this.start(), 5);
  },

  check_position_y() {
    PVP.y = GAME.char_data.y;
    window.setTimeout(() => this.start(), 5);
  },

  check_players() {
    if ($("#player_list_con").find("[data-option=load_more_players]").length != 0) {
      $("#player_list_con").find("[data-option=load_more_players]").click();
    }
    if ($("#player_list_con .player").length > 0) {
      PVP.y = GAME.char_data.y;
      if (document.getElementById("player_list_con").children[0].children[1].childElementCount == 3) {
        PVP.playerTimer = $("#player_list_con .player").eq(0).find(".timer").text();
        if (PVP.playerTimer <= '00:01:30' && PVP.y == 2 && PVP.playerTimer != '' || PVP.playerTimer <= '00:00:25' && PVP.playerTimer != '') {
          window.setTimeout(() => this.check_players(), PVP.pvpDelay / this.getSpeedMultiplier() * 4);
        } else {
          window.setTimeout(() => this.start(), PVP.pvpDelay / this.getSpeedMultiplier() / 2);
        }
      } else {
        window.setTimeout(() => this.start(), PVP.pvpDelay / this.getSpeedMultiplier() / 2);
      }
    } else {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier() * 2);
    }
    PVP.counter = 1;
  },

  check_players2() {
    // kill_players now handles full attack cycle with lag detection
    // Just trigger another attack pass and continue
    this.attackLoop();
    PVP.counter = 1;
  },

  // ============================================
  // KILLING LOGIC (Attack-Until-Clear pattern)
  // ============================================

  /**
   * Attack loop that stays active until all enemies are killed or position changes.
   * This prevents moving to next tile before finishing kills.
   */
  kill_players() {
    // Save current position to detect tile change
    PVP.startX = GAME.char_data.x;
    PVP.startY = GAME.char_data.y;

    // Reset attack state
    PVP.attackRetries = 0;
    PVP.lastEnemyCount = -1;

    this.attackLoop();
  },

  attackLoop() {
    // Check if stopped
    if (PVP.stop) return;

    // If game is loading, wait briefly but don't block too long
    // Max wait is affected by speed: faster speed = shorter max wait
    if (GAME.is_loading || $("#loader").is(":visible")) {
      window.setTimeout(() => this.attackLoop(), this.getLoadingWait());
      return;
    }

    const currentX = GAME.char_data.x;
    const currentY = GAME.char_data.y;

    // Position changed - exit attack mode and continue main loop
    if (currentX !== PVP.startX || currentY !== PVP.startY) {
      PVP.attackRetries = 0;
      PVP.caseNumber++;  // Move to next step
      window.setTimeout(() => this.start(), PVP.wait);
      return;
    }

    // Load more players if available - wait after clicking for them to load
    if ($("#player_list_con").find("[data-option=load_more_players]").length != 0) {
      $("#player_list_con").find("[data-option=load_more_players]").click();
      // Wait for players to load before continuing
      window.setTimeout(() => this.attackLoop(), 300);
      return;
    }

    // Count attackable enemies
    let enemies = $("#player_list_con").find(".player button[data-quick=1]:not(.initial_hide_forced)");
    const enemyCount = enemies.length;

    // No enemies - exit attack mode and continue main loop
    if (enemyCount === 0) {
      PVP.attackRetries = 0;
      PVP.tileRetries = 0;
      PVP.caseNumber++;
      kom_clear();
      window.setTimeout(() => this.start(), PVP.wait);
      return;
    }

    // Check if we're making progress (enemy count decreased)
    if (PVP.lastEnemyCount === enemyCount) {
      PVP.attackRetries++;
      PVP.tileRetries++;

      // Too many retries on this tile - player likely moved or has cooldown
      // After 3 failed attempts, move on instead of getting stuck
      if (PVP.tileRetries > 3) {
        console.log('[PVP] Max tile retries reached (' + PVP.tileRetries + '), moving on');
        PVP.attackRetries = 0;
        PVP.tileRetries = 0;
        PVP.caseNumber++;
        window.setTimeout(() => this.start(), PVP.wait);
        return;
      }

      // Short-term retry - wait for server response
      if (PVP.attackRetries > 5) {
        PVP.attackRetries = 0;
        window.setTimeout(() => this.attackLoop(), 500);
        return;
      }
    } else {
      PVP.attackRetries = 0;
    }

    PVP.lastEnemyCount = enemyCount;

    // Attack first enemy
    enemies.eq(0).click();

    // Continue attack loop - delay affected by speed
    window.setTimeout(() => this.attackLoop(), this.getAttackDelay());
  },

  // Legacy alias for compatibility
  kill_players1() {
    this.attackLoop();
  },

  // ============================================
  // EMPIRE CHECKS
  // ============================================

  check_imp() {
    let tab = [];
    for (let i = 0; i < 3; i++) {
      tab[i] = parseInt($("#empire_heroes .activity").eq(i).find("[data-option=show_player]").attr("data-char_id"));
    }
    return tab;
  },

  check_imp2() {
    let tab = [];
    for (let i = 0; i < 3; i++) {
      tab[i] = parseInt($("#empire_efrags .activity").eq(i).find("[data-option=show_player]").attr("data-char_id"));
    }
    return tab;
  },

  // ============================================
  // WARS
  // ============================================

  declareEmpireWars() {
    if (PVP.autoWars) {
      let aimp = $("#e_admiral_player").find("[data-option=show_player]").attr("data-char_id");
      let imp = $("#leader_player").find("[data-option=show_player]").attr("data-char_id");

      if (!PVP.adimp) {
        GAME.socket.emit('ga', { a: 50, type: 0, empire: GAME.char_data.empire });
        PVP.adimp = true;
        window.setTimeout(() => this.declareEmpireWars(), 500);
      } else if (!GAME.emp_enemies.includes(1) && ![GAME.char_data.empire].includes(1) &&
        (this.check_imp().includes(GAME.char_id) || this.check_imp2().includes(GAME.char_id) ||
          imp == GAME.char_id || aimp == GAME.char_id)) {
        GAME.socket.emit('ga', { a: 50, type: 7, target: 1 });
        window.setTimeout(() => this.declareEmpireWars(), 500);
      } else if (!GAME.emp_enemies.includes(2) && ![GAME.char_data.empire].includes(2) &&
        (this.check_imp().includes(GAME.char_id) || this.check_imp2().includes(GAME.char_id) ||
          imp == GAME.char_id || aimp == GAME.char_id)) {
        GAME.socket.emit('ga', { a: 50, type: 7, target: 2 });
        window.setTimeout(() => this.declareEmpireWars(), 500);
      } else if (!GAME.emp_enemies.includes(3) && ![GAME.char_data.empire].includes(3) &&
        (this.check_imp().includes(GAME.char_id) || this.check_imp2().includes(GAME.char_id) ||
          imp == GAME.char_id || aimp == GAME.char_id)) {
        GAME.socket.emit('ga', { a: 50, type: 7, target: 3 });
        window.setTimeout(() => this.declareEmpireWars(), 500);
      } else if (!GAME.emp_enemies.includes(4) && ![GAME.char_data.empire].includes(4) &&
        (this.check_imp().includes(GAME.char_id) || this.check_imp2().includes(GAME.char_id) ||
          imp == GAME.char_id || aimp == GAME.char_id)) {
        GAME.socket.emit('ga', { a: 50, type: 7, target: 4 });
        window.setTimeout(() => this.declareEmpireWars(), 500);
      } else {
        window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
      }
    } else {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
    }
  },

  // ============================================
  // MOVEMENT
  // ============================================

  zejdz() {
    GAME.socket.emit('ga', { a: 16 });
    window.setTimeout(() => this.teleport(), 2000);
  },

  go() {
    let x = GAME.char_data.x;
    let y = GAME.char_data.y;

    if (x == 14 && y == 14 && PVP.loc === 1) {
      this.zejdz(); PVP.g = 2; PVP.tele = true;
    } else if (x == 14 && y == 14 && PVP.loc === 2) {
      this.zejdz(); PVP.g = 3; PVP.tele = true;
    } else if (x == 14 && y == 14 && PVP.loc === 3) {
      this.zejdz(); PVP.g = 4; PVP.tele = true;
    } else if (x == 14 && y == 14 && PVP.loc === 4) {
      this.zejdz(); PVP.g = 1; PVP.tele = true;
    } else if (PVP.loc === 7) {
      this.zejdz(); PVP.tele = true;
    } else if (x == 8 && y == 4 && PVP.loc == 4 || x == 8 && y == 6 && PVP.loc == 4 ||
      x == 12 && y == 7 && PVP.loc == 1 || x == 12 && y == 9 && PVP.loc == 1 ||
      x == 4 && y == 8 && PVP.loc == 1 || x == 4 && y == 10 && PVP.loc == 1 ||
      x == 7 && y == 13 && PVP.loc == 3 || x == 8 && y == 5 && PVP.loc == 2 ||
      x == 8 && y == 7 && PVP.loc == 2 || x == 3 && y == 9 && PVP.loc == 5) {
      this.go_down();
    } else if (x == 8 && y == 5 && PVP.loc == 4 || x == 8 && y == 7 && PVP.loc == 4) {
      this.go_left();
    } else if (x == 5 && y == 11 && PVP.loc == 1 || x == 5 && y == 10 && PVP.loc == 1 ||
      x == 5 && y == 9 && PVP.loc == 1 || x == 5 && y == 8 && PVP.loc == 1) {
      this.go_up();
    } else if (x == 8 && y == 6 && PVP.loc == 2 || x == 8 && y == 8 && PVP.loc == 2) {
      this.go_right();
    } else if (x == 2 && y == 11 && PVP.loc == 3) {
      this.cofanie();
    } else if (x == 7 && y == 7 && PVP.loc == 6 && PVP.dogory || x == 9 && y == 7 && PVP.loc == 6 && PVP.dogory) {
      this.prawodol();
    } else if (x == 8 && y == 8 && PVP.loc == 6 && PVP.dogory || x == 10 && y == 8 && PVP.loc == 6 && PVP.dogory) {
      this.prawogora();
    } else if (x < 14 && y % 2 == 0 && PVP.loc < 5 || x < 15 && y % 2 !== 0 && PVP.loc == 6 ||
      x < 11 && y % 2 == 0 && PVP.loc == 5) {
      this.go_right();
    } else if (y % 2 !== 0 && x > 2 && PVP.loc < 6 || x > 1 && y % 2 == 0 && PVP.loc == 6 || x == 2 && PVP.loc == 6) {
      this.go_left();
    } else if (x == 14 || x == 2 && PVP.loc < 5 || x == 15 && PVP.loc == 6 || x == 1 ||
      x == 11 && PVP.loc == 5 || x == 2 && PVP.loc == 5) {
      this.go_down();
    } else {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
    }
  },

  teleport() {
    if (PVP.tele) {
      GAME.socket.emit('ga', { a: 50, type: 5, e: PVP.g });
      window.setTimeout(() => this.start(), 2000);
      PVP.tele = false;
    } else {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
    }
  },

  check_location() {
    if (GAME.char_data.loc == 351) { PVP.loc = 4; }
    else if (GAME.char_data.loc == 350) { PVP.loc = 3; }
    else if (GAME.char_data.loc == 349) { PVP.loc = 2; }
    else if (GAME.char_data.loc == 348) { PVP.loc = 1; }
    else { PVP.loc = 7; }
    window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
  },

  cofanie() {
    PVP.x = GAME.char_data.x;
    if (PVP.x >= 7) {
      this.go_down();
    } else {
      GAME.emitOrder({ a: 4, dir: 7, vo: GAME.map_options.vo });
      window.setTimeout(() => this.cofanie(), 150);
    }
  },

  prawodol() {
    GAME.emitOrder({ a: 4, dir: 3, vo: GAME.map_options.vo });
    this.waitForLoad(() => this.start());
  },

  prawogora() {
    GAME.emitOrder({ a: 4, dir: 5, vo: GAME.map_options.vo });
    this.waitForLoad(() => this.start());
  },

  go_up() {
    GAME.emitOrder({ a: 4, dir: 2, vo: GAME.map_options.vo });
    this.waitForLoad(() => this.start());
  },

  go_down() {
    GAME.emitOrder({ a: 4, dir: 1, vo: GAME.map_options.vo });
    this.waitForLoad(() => this.start());
  },

  go_left() {
    GAME.emitOrder({ a: 4, dir: 8, vo: GAME.map_options.vo });
    this.waitForLoad(() => this.start());
  },

  go_right() {
    GAME.emitOrder({ a: 4, dir: 7, vo: GAME.map_options.vo });
    this.waitForLoad(() => this.start());
  },

  /**
   * Wait for game loading to complete before executing callback
   * Speed affects how long to wait after loading (walking speed)
   */
  waitForLoad(callback) {
    if (PVP.stop) return;

    if (GAME.is_loading || $("#loader").is(":visible")) {
      window.setTimeout(() => this.waitForLoad(callback), 50);
    } else {
      // Speed affects walking delay: higher speed = shorter delay = faster walking
      const walkDelay = Math.max(20, 200 / this.getSpeedMultiplier());
      window.setTimeout(callback, walkDelay);
    }
  },

  // ============================================
  // UTILITY
  // ============================================

  check() {
    if ($("#ewar_list").text().includes("--:--:--")) {
      window.setTimeout(() => this.check(), 300);
    } else {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
    }
  },

  check2() {
    if (this.checkBuffsAndSSJ()) {
      window.setTimeout(() => this.check2(), 1800);
    } else {
      window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
    }
  },

  dec_wars() {
    let wars = $("#pvp_Panel input[name=pvp_capt]").val();
    let count = wars ? wars.split(";").length : 0;
    if (count > 0 && PVP.autoClanWars && GAME.char_data.klan_id != 0 && GAME.char_data.klan_rent == 0 && GAME.clan_wars.length < count) {
      GAME.socket.emit('ga', { a: 39, type: 24, shorts: wars });
    }
    window.setTimeout(() => this.start(), PVP.wait / this.getSpeedMultiplier());
  },

  getSpeedMultiplier() {
    // Read speed from UI input or PVP.speed
    let speed = parseInt($('#pvp_Panel input[name=speed_capt]').val()) || PVP.speed;
    if (speed < 10) speed = 10;
    if (speed > 500) speed = 500;
    // Sync back to state
    PVP.speed = speed;
    PVP.speedMultiplier = speed;
    return speed / 50;
  },

  saveSpeed() {
    localStorage.setItem('pvp_speed', PVP.speed);
  },

  loadSpeed() {
    const saved = localStorage.getItem('pvp_speed');
    if (saved) {
      PVP.speed = parseInt(saved) || 50;
      PVP.speedMultiplier = PVP.speed;
    }
  },

  /**
   * Get attack delay based on speed setting.
   * Speed 10 = 200ms, Speed 50 = 100ms, Speed 100 = 50ms, Speed 200 = 25ms
   * Formula: 1000 / (speed / 5) = 5000 / speed
   */
  getAttackDelay() {
    const speed = this.getSpeedMultiplier() * 50; // Get actual speed value
    // Base: 50-200ms depending on speed
    // speed 10 -> 200ms, speed 50 -> 100ms, speed 100 -> 50ms
    return Math.max(30, Math.min(200, Math.round(5000 / speed)));
  },

  /**
   * Get max wait time for is_loading check.
   * Higher speed = shorter wait.
   */
  getLoadingWait() {
    const speed = this.getSpeedMultiplier() * 50;
    // speed 10 -> 80ms, speed 50 -> 50ms, speed 100 -> 30ms
    return Math.max(20, Math.min(80, Math.round(2500 / speed)));
  },

  // ============================================
  // PANEL HANDLERS
  // ============================================

  bindHandlers() {
    $('#pvp_Panel .pvp_pvp').click(() => {
      if (PVP.stop) {
        $(".pvp_pvp .pvp_status").removeClass("red").addClass("green").html("On");
        PVP.stop = false;
        this.start();
        // Stop other modules
        RESP.stop = true; RES.stop = true; LPVM.Stop = true; CODE.stop = true;
        $(".code_code .code_status, .lpvm_lpvm .lpvm_status, .res_res .res_status, .resp_resp .resp_status")
          .removeClass("green").addClass("red").html("Off");
      } else {
        $(".pvp_pvp .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.stop = true;
      }
    });

    $('#pvp_Panel .pvp_rb_avoid').click(() => {
      if (PVP.higherRebornAvoid) {
        $(".pvp_rb_avoid .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.higherRebornAvoid = false;
      } else {
        $(".pvp_rb_avoid .pvp_status").removeClass("red").addClass("green").html("On");
        PVP.higherRebornAvoid = true;
      }
    });

    $('#pvp_Panel .pvp_Code').click(() => {
      if (PVP.code) {
        $(".pvp_Code .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.code = false;
        $("#pvp_Panel .pvpCODE_konto").hide();
      } else {
        $(".pvp_Code .pvp_status").removeClass("red").addClass("green").html("On");
        PVP.code = true;
        $("#pvp_Panel .pvpCODE_konto").show();
      }
    });

    $('#pvp_Panel .pvpCODE_konto').click(() => {
      if (PVP.kontoTP) {
        $(".pvpCODE_konto .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.kontoTP = false; PVP.codeTP = false;
      } else {
        $(".pvpCODE_konto .pvp_status").removeClass("red").addClass("green").html("On");
        PVP.kontoTP = true; PVP.codeTP = true;
      }
    });

    $('#pvp_Panel .pvp_WI').click(() => {
      if (PVP.autoWars) {
        $(".pvp_WI .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.autoWars = false;
      } else {
        $(".pvp_WI .pvp_status").removeClass("red").addClass("green").html("On");
        PVP.autoWars = true;
      }
    });

    $('#pvp_Panel .pvp_WK').click(() => {
      if (PVP.autoClanWars) {
        $(".pvp_WK .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.autoClanWars = false;
      } else {
        $(".pvp_WK .pvp_status").removeClass("red").addClass("green").html("On");
        PVP.autoClanWars = true;
      }
    });

    if (GAME.server != '20') {
      $('#pvp_Panel .pvp_buff_imp').click(() => {
        if (PVP.buff_imp) {
          $(".pvp_buff_imp .pvp_status").removeClass("green").addClass("red").html("Off");
          PVP.buff_imp = false;
        } else {
          $(".pvp_buff_imp .pvp_status").removeClass("red").addClass("green").html("On");
          PVP.buff_imp = true;
        }
      });

      $('#pvp_Panel .pvp_buff_clan').click(() => {
        if (PVP.buff_clan) {
          $(".pvp_buff_clan .pvp_status").removeClass("green").addClass("red").html("Off");
          PVP.buff_clan = false;
        } else {
          $(".pvp_buff_clan .pvp_status").removeClass("red").addClass("green").html("On");
          PVP.buff_clan = true;
        }
      });
    }

    // Speed input handler - sync PVP.speed and save to localStorage
    $('#pvp_Panel input[name=speed_capt]').on('input change', (e) => {
      const val = parseInt($(e.target).val()) || 50;
      PVP.speed = val;
      PVP.speedMultiplier = val;
      this.saveSpeed();
    });

    // Load saved values
    this.loadSpeed();
    $("#pvp_Panel input[name=pvp_capt]").val(PVP.clan_list);
    $("#pvp_Panel input[name=speed_capt]").val(PVP.speed);

    console.log('[AFO_PVP] Handlers bound');
  }
};

// Attach methods to global PVP object for backward compatibility
PVP.checkBuffsAndSSJ = () => AFO_PVP.checkBuffsAndSSJ();
PVP.checkkkk = PVP.checkBuffsAndSSJ; // Legacy alias
PVP.start = () => AFO_PVP.start();
PVP.action = () => AFO_PVP.action();

// Export
window.AFO_PVP = AFO_PVP;
console.log('[AFO] PVP module loaded');


// ========== remote/afo/respawn.js ==========
/**
 * ============================================================================
 * AFO - Respawn/PVM Module
 * ============================================================================
 * 
 * RESP system - auto-fighting mobs on spawn, senzu management, bless checking.
 * Uses the global RESP state object from afo/state.js
 * 
 * ============================================================================
 */

const AFO_RESP = {

  // Item data from items.json (loaded on init, fallback to inline if not loaded)
  itemData: null,

  // ============================================
  // MAIN RESPAWN LOOP
  // ============================================

  check() {
    let imp = $("#leader_player").find("[data-option=show_player]").attr("data-char_id");
    let emp = GAME.char_data.empire;
    let buff = $(".emp_buff .pull-right").find("button").attr("data-option") == "activate_emp_buff";
    let buff_id = $(".emp_buff .pull-right").find("button").attr("data-buff");
    let who_win = $("#gne_satus").text().includes("ZŁO");
    let abut = $("#clan_buffs").find(`button[data-option="activate_war_buff"]`);
    let isDisabled = $("#clan_buffs").find(`button[data-option="activate_war_buff"]`).parents("tr").hasClass("disabled");

    if (GAME.char_data.pr <= this.min_pa()) {
      this.useSenzu();
      return true;
    } else if (RESP.checkOST && $("#doubler_bar").css("display") === "none") {
      GAME.socket.emit('ga', { a: 12, type: 14, iid: GAME.quick_opts.sub[RESP.jaka].id, page: GAME.ekw_page, am: 1 });
      return true;
    } else if (RESP.checkOST && $('#doubler_status').text() <= '00:00:03') {
      return true;
    } else if ((!RESP.checkOST && RESP.checkOST_timer <= GAME.getTime()) || (RESP.jaka == 1 && RESP.checkOST_timer <= GAME.getTime())) {
      RESP.checkOST_timer = GAME.getTime() + 60;
      return true;
    } else if (RESP.checkSSJ && GAME.quick_opts.ssj && $("#ssj_bar").css("display") === "none") {
      GAME.socket.emit('ga', { a: 18, type: 5, tech_id: GAME.quick_opts.ssj[0] });
      return true;
    } else if ($('#ssj_status').text() == "--:--:--" && GAME.quick_opts.ssj) {
      // FIX: Check '--:--:--' BEFORE time comparison (like PVP) and use setTimeout
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 18, type: 6 });
      }, 1500);
      return true;
    } else if (RESP.checkSSJ && $('#ssj_status').text() <= '00:00:03' && GAME.quick_opts.ssj) {
      return true;
    } else if ($("#train_uptime").find('.timer').length == 0 && !GAME.is_training && RESP.code) {
      GAME.socket.emit('ga', { a: 8, type: 2, stat: 1, duration: 1 });
      if (RESP.codeTP) {
        setTimeout(() => { GAME.socket.emit('ga', { a: 8, type: 5, multi: ':checked', apud: 'vzaaa' }); }, 1600);
      } else {
        setTimeout(() => { GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' }); }, 1600);
      }
      return true;
    } else if (GAME.is_training && $("#train_uptime").find('.timer').length == 0 && RESP.code) {
      if (RESP.codeTP) {
        setTimeout(() => { GAME.socket.emit('ga', { a: 8, type: 5, multi: ':checked', apud: 'vzaaa' }); }, 1600);
      } else {
        setTimeout(() => { GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' }); }, 1600);
      }
      return true;
    } else if (GAME.is_training && $("#train_uptime").find('.timer').length == 1 && RESP.code) {
      GAME.socket.emit('ga', { a: 8, type: 3 });
      return true;
    } else if (GAME.is_training && RESP.code) {
      GAME.socket.emit('ga', { a: 8, type: 3 });
      return true;
    } else if (imp == GAME.char_id && RESP.buff_imp && buff && buff_id < 4) {
      GAME.socket.emit('ga', { a: 50, type: 6, buff: buff_id });
      return true;
    } else if (imp == GAME.char_id && RESP.buff_imp && buff && buff_id < 7 && ((emp == 1 || emp == 3) && who_win)) {
      GAME.socket.emit('ga', { a: 50, type: 6, buff: buff_id });
      return true;
    } else if (imp == GAME.char_id && RESP.buff_imp && buff && buff_id < 7 && ((emp == 2 || emp == 4) && !who_win)) {
      GAME.socket.emit('ga', { a: 50, type: 6, buff: buff_id });
      return true;
    } else if ((RESP.buff_clan || RESP.buff_imp) && $("#server_time").text() > '00:05:00' && $("#server_time").text() < '01:00:00' && typeof RESP.loaded == 'undefined') {
      RESP.loaded = true;
      setTimeout(() => { GAME.socket.emit('ga', { a: 50, type: 0, empire: GAME.char_data.empire }); }, 300);
      setTimeout(() => { GAME.emitOrder({ a: 39, type: 0 }); }, 600);
      setTimeout(() => { GAME.emitOrder({ a: 39, type: 23 }); }, 900);
      return true;
    } else if (RESP.buff_clan && GAME.klan_data != undefined && abut.length && !isDisabled) {
      $(" .newBtn.activate_all_clan_buffs").click();
      return true;
    }
    return false;
  },

  min_pa() {
    if (GAME.char_data.doubler_rate && GAME.char_data.doubler_rate > 19) {
      let cal_sub = GAME.char_data.doubler_rate;
      let spawner = GAME.spawner[0];
      return cal_sub * this.MF() + parseInt(spawner);
    } else {
      return parseInt(GAME.spawner[0]);
    }
  },

  action() {
    if (!RESP.stop) {
      if (!this.check() && !this.check_bless()) {
        setTimeout(() => {
          if (this.MF() > 0) {
            this.fight();
          } else {
            this.go();
          }
        }, RESP.wait);
      } else {
        setTimeout(() => {
          this.action();
          kom_clear();
        }, 1700);
      }
    }
  },

  fight() {
    // OPTIMIZATION: Wait if game is loading (controlled by flag)
    if (RESP.useLoadingCheck && (GAME.is_loading || $("#loader").is(":visible"))) {
      window.setTimeout(() => this.fight(), 30);
      return;
    }

    if (RESP.reload) {
      setTimeout(() => { GAME.maploaded = false; GAME.prepareMap(); }, 300);
      RESP.reload = false;
    }

    let fm = GAME.field_mobs;
    let fmf = GAME.field_mf;
    let fmi = GAME.field_mob_id;

    // OPTIMIZATION: Debouncing - skip if emitting too fast
    if (RESP.useDebouncing) {
      const now = Date.now();
      if (now - RESP.lastEmitTime < RESP.minEmitInterval) {
        // Too soon, wait a bit and retry
        window.setTimeout(() => this.fight(), RESP.minEmitInterval - (now - RESP.lastEmitTime));
        return;
      }
      RESP.lastEmitTime = now;
    }

    if ((this.MF() > 0 && fmf[fmi - 1] < 0) && fm[fmi - 1].ranks[0] ||
      (this.MF() > 0 && fmf[fmi - 1] < 1 && fm[fmi - 1].ranks[1]) ||
      (this.MF() > 0 && fmf[fmi - 1] < 2 && fm[fmi - 1].ranks[2]) ||
      (this.MF() > 0 && fmf[fmi - 1] < 3 && fm[fmi - 1].ranks[3]) ||
      (this.MF() > 0 && fmf[fmi - 1] < 4 && fm[fmi - 1].ranks[4]) ||
      (this.MF() > 0 && fmf[fmi - 1] < 5 && fm[fmi - 1].ranks[5]) ||
      !RESP.multifight) {
      GAME.socket.emit('ga', { a: 7, order: 2, quick: 1, fo: GAME.map_options.ma });
    } else if (this.MF2() > 0) {
      GAME.socket.emit('ga', { a: 13, mob_num: fmi, fo: GAME.map_options.ma });
    } else {
      GAME.socket.emit('ga', { a: 444, max: GAME.spawner[0], ignore: GAME.spawner[1] });
    }

    // OPTIMIZATION: Wait for response before continuing (controlled by flag)
    if (RESP.useLoadingCheck) {
      this.waitForResponse(() => this.action());
    } else {
      this.action();  // Original behavior
    }
  },

  /**
   * Wait for game to finish processing before executing callback
   */
  waitForResponse(callback) {
    if (GAME.is_loading) {
      setTimeout(() => this.waitForResponse(callback), 20);
    } else {
      callback();
    }
  },

  reload_map() {
    RESP.reload = true;
  },

  MF() {
    let r = 0;
    if (GAME.field_mobs) {
      for (let i = 0; i < GAME.map_options.ma.length; i++) {
        if (GAME.map_options.ma[i] === 1) {
          r += parseInt(GAME.field_mobs[0].ranks[i]);
          if (GAME.field_mobs[1]) r += parseInt(GAME.field_mobs[1].ranks[i]);
          if (GAME.field_mobs[2]) r += parseInt(GAME.field_mobs[2].ranks[i]);
          if (GAME.field_mobs[3]) r += parseInt(GAME.field_mobs[3].ranks[i]);
        }
      }
    }
    return r;
  },

  MF2() {
    let r = 0;
    for (let i = 0; i < GAME.map_options.ma.length; i++) {
      if (GAME.field_mob_id < GAME.field_mobs.length && "ranks" in GAME.field_mobs[GAME.field_mob_id] && GAME.map_options.ma[i] === 1) {
        r += parseInt(GAME.field_mobs[GAME.field_mob_id].ranks[i]);
      }
    }
    return r;
  },

  go() {
    // OPTIMIZATION: Wait if game is loading (controlled by flag)
    if (RESP.useLoadingCheck && (GAME.is_loading || $("#loader").is(":visible"))) {
      window.setTimeout(() => this.go(), 30);
      return;
    }

    // OPTIMIZATION: Debouncing - skip if emitting too fast
    if (RESP.useDebouncing) {
      const now = Date.now();
      if (now - RESP.lastEmitTime < RESP.minEmitInterval) {
        window.setTimeout(() => this.go(), RESP.minEmitInterval - (now - RESP.lastEmitTime));
        return;
      }
      RESP.lastEmitTime = now;
    }

    GAME.socket.emit('ga', { a: 444, max: GAME.spawner[0], ignore: GAME.spawner[1] });

    // OPTIMIZATION: Wait for response before continuing (controlled by flag)
    if (RESP.useLoadingCheck) {
      this.waitForResponse(() => this.action());
    } else {
      this.action();  // Original behavior
    }
  },

  // ============================================
  // BLESS CHECKING
  // ============================================

  check_bless() {
    // Use items.json data if loaded, otherwise fallback to inline
    const blessItems = this.itemData?.blessItems || {
      1: { base: 1801, buff: 100 },
      2: { base: 1628, buff: 53 },
      3: { base: 1630, buff: 55 },
      4: { base: 1796, buff: 96 },
      5: { base: 1794, buff: 94 },
      6: { base: 1792, buff: 92 },
      7: { base: 1790, buff: 90 },
      8: { base: 1745, buff: 74 },
      9: { base: 1608, buff: 52 },
      10: { base: 1559, buff: 50 },
      11: { base: 1795, buff: 95 },
      12: { base: 1793, buff: 93 },
      13: { base: 1753, buff: 82 },
      14: { base: 1752, buff: 81 },
      15: { base: 1751, buff: 80 },
      16: { base: 1742, buff: 71 },
      17: { base: 1747, buff: 76 },
      18: { base: 1746, buff: 75 }
    };

    if (GAME.ekw_page != 10) {
      GAME.ekw_page = 10;
      GAME.socket.emit('ga', { a: 12, page: 10, used: 1 });
      return true;
    }

    // Check bless items 1-18
    for (let i = 1; i <= 18; i++) {
      let item = blessItems[i];
      let itemId = $(`#ekw_page_items`).find(`div[data-base_item_id=${item.base}]`).attr("data-item_id");
      let hasBuff = $(`#char_buffs`).find(`[data-buff=${item.buff}]`).length == 1;
      let buffExpiring = $(`#char_buffs`).find(`[data-buff=${item.buff}]`).find(".timer").text() <= '00:00:04';

      let needsBless = i <= 10 ? RESP.bless : true;

      if ((!hasBuff || buffExpiring) && RESP[`b${i}`] && itemId && needsBless) {
        GAME.socket.emit('ga', { a: 12, type: 14, iid: parseInt(itemId), page: 10 });
        return true;
      }
    }

    return false;
  },

  // ============================================
  // SENZU MANAGEMENT
  // ============================================

  getSenzu(type) {
    // Use items.json data if loaded, otherwise fallback to inline
    const senzuIdData = this.itemData?.senzuIds || {
      SENZU_BLUE: 1244,
      SENZU_PURPLE: 1259,
      SENZU_MAGIC: 1309,
      SENZU_GREEN: 1242,
      SENZU_YELLOW: 1260,
      SENZU_RED: 1243
    };
    // Map type constant to key (e.g., RESP.SENZU_BLUE = 'SENZU_BLUE')
    const senzuId = senzuIdData[type];
    return GAME.quick_opts.senzus.find(s => s.item_id === senzuId);
  },

  useSenzu() {
    if (RESP.stop) return;

    const blue = this.getSenzu(RESP.SENZU_BLUE);
    const purple = this.getSenzu(RESP.SENZU_PURPLE);
    const magic = this.getSenzu(RESP.SENZU_MAGIC);
    const green = this.getSenzu(RESP.SENZU_GREEN);
    const yellow = this.getSenzu(RESP.SENZU_YELLOW);
    const red = this.getSenzu(RESP.SENZU_RED);

    switch (RESP.CONF_SENZU) {
      case RESP.SENZU_BLUE:
        this.useBlue(Math.min(RESP.CONF_BLUE_AMOUNT(), blue.stack));
        break;
      case RESP.SENZU_PURPLE:
        this.usePurple(Math.min(RESP.CONF_PURPLE_AMOUNT, purple.stack));
        break;
      case RESP.SENZU_MAGIC:
        this.useMagic();
        break;
      case RESP.SENZU_GREEN:
        this.useGreen(Math.min(RESP.CONF_GREEN_AMOUNT(), green.stack));
        break;
      case RESP.SENZU_YELLOW:
        this.useYellow(Math.min(RESP.CONF_YELLOW_AMOUNT, yellow.stack));
        break;
      case RESP.SENZU_RED:
        this.useRed();
        break;
      default:
        if (blue && blue.stack > RESP.CONF_BLUE_AMOUNT() * 20) {
          this.useBlue(Math.min(RESP.CONF_BLUE_AMOUNT(), blue.stack));
        } else if (green && green.stack > RESP.CONF_GREEN_AMOUNT() * 5) {
          this.useGreen(Math.min(RESP.CONF_GREEN_AMOUNT(), green.stack));
        } else if (red && red.stack > 0) {
          this.useRed();
        }
    }
  },

  useBlue(amount) {
    const blue = this.getSenzu(RESP.SENZU_BLUE);
    if (blue) GAME.socket.emit('ga', { a: 12, type: 14, iid: blue.id, page: GAME.ekw_page, am: amount });
  },

  useGreen(amount) {
    const green = this.getSenzu(RESP.SENZU_GREEN);
    if (green) GAME.socket.emit('ga', { a: 12, type: 14, iid: green.id, page: GAME.ekw_page, am: amount });
  },

  usePurple(amount) {
    const purple = this.getSenzu(RESP.SENZU_PURPLE);
    if (purple) GAME.socket.emit('ga', { a: 12, type: 14, iid: purple.id, page: GAME.ekw_page, am: amount });
  },

  useYellow(amount) {
    const yellow = this.getSenzu(RESP.SENZU_YELLOW);
    if (yellow) GAME.socket.emit('ga', { a: 12, type: 14, iid: yellow.id, page: GAME.ekw_page, am: amount });
  },

  useRed() {
    const red = this.getSenzu(RESP.SENZU_RED);
    if (red) GAME.socket.emit('ga', { a: 12, type: 14, iid: red.id, page: GAME.ekw_page, am: 1 });
  },

  useMagic() {
    const magic = this.getSenzu(RESP.SENZU_MAGIC);
    if (magic) GAME.socket.emit('ga', { a: 12, type: 14, iid: magic.id, page: GAME.ekw_page, am: 1 });
  },

  // ============================================
  // PANEL HANDLERS
  // ============================================

  bindHandlers() {
    // Keyboard shortcut
    $(document).bind('keydown', '1', function () {
      if (!JQS.chm.is(":focus")) {
        if ($(".gh_resp .gh_status").hasClass("green")) {
          $('#resp_Panel .resp_resp').click();
        }
      }
      return false;
    });

    // Hide bless options initially
    for (let i = 1; i <= 18; i++) {
      $(`#resp_Panel .resp_bh${i}`).hide();
    }
    $('#resp_Panel .resp_on').hide();
    $('#resp_Panel .resp_off').hide();

    // Main resp toggle
    $('#resp_Panel .resp_resp').click(() => {
      if (RESP.stop && GAME.field_mobs) {
        $(".resp_resp .resp_status").removeClass("red").addClass("green").html("On");
        RESP.stop = false;
        this.action();
        RESP.reloadint = setInterval(() => this.reload_map(), 60000);
        RESP.loc = GAME.char_data.loc;
        // Stop other modules
        PVP.stop = true; LPVM.Stop = true; CODE.stop = true;
        $(".code_code .code_status, .lpvm_lpvm .lpvm_status, .pvp_pvp .pvp_status")
          .removeClass("green").addClass("red").html("Off");
      } else {
        $(".resp_resp .resp_status").removeClass("green").addClass("red").html("Off");
        RESP.stop = true;
        clearInterval(RESP.reloadint);
      }
    });

    // Bless toggle
    $('#resp_Panel .resp_bless').click(() => {
      if (RESP.bless) {
        $(".resp_bless .resp_status").removeClass("green").addClass("red").html("Off");
        RESP.bless = false;
        for (let i = 1; i <= 18; i++) $(`#resp_Panel .resp_bh${i}`).hide();
        $('#resp_Panel .resp_on, #resp_Panel .resp_off').hide();
      } else {
        $(".resp_bless .resp_status").removeClass("red").addClass("green").html("On");
        RESP.bless = true;
        for (let i = 1; i <= 18; i++) $(`#resp_Panel .resp_bh${i}`).show();
        $('#resp_Panel .resp_on, #resp_Panel .resp_off').show();
      }
    });

    // Code toggle
    $('#resp_Panel .resp_code').click(() => {
      if (RESP.code) {
        $(".resp_code .resp_status").removeClass("green").addClass("red").html("Off");
        RESP.code = false;
        $('#resp_Panel .resp_konto').hide();
      } else {
        $(".resp_code .resp_status").removeClass("red").addClass("green").html("On");
        RESP.code = true;
        $('#resp_Panel .resp_konto').show();
      }
    });

    // Konto toggle
    $('#resp_Panel .resp_konto').click(() => {
      if (RESP.kontoTP) {
        $(".resp_konto .resp_status").removeClass("green").addClass("red").html("Off");
        RESP.kontoTP = false; RESP.codeTP = false;
      } else {
        $(".resp_konto .resp_status").removeClass("red").addClass("green").html("On");
        RESP.kontoTP = true; RESP.codeTP = true;
      }
    });

    // Sub toggle
    $('#resp_Panel .resp_sub').click(() => {
      if (RESP.checkOST) {
        $(".resp_sub .resp_status").removeClass("green").addClass("red").html("Off");
        RESP.checkOST = false;
        $('#resp_Panel .resp_ost').hide();
      } else {
        $(".resp_sub .resp_status").removeClass("red").addClass("green").html("On");
        RESP.checkOST = true;
        $('#resp_Panel .resp_ost').show();
      }
    });

    // OST toggle
    $('#resp_Panel .resp_ost').click(() => {
      if (RESP.zmiana) {
        $(".resp_ost .resp_status").html("Ost");
        RESP.zmiana = false; RESP.jaka = 0;
      } else {
        $(".resp_ost .resp_status").html("x20");
        RESP.zmiana = true; RESP.jaka = 1;
      }
    });

    // Multi toggle
    $('#resp_Panel .resp_multi').click(() => {
      RESP.multifight = !RESP.multifight;
      $(".resp_multi .resp_status").toggleClass("green red").html(RESP.multifight ? "On" : "Off");
    });

    // SSJ toggle
    $('#resp_Panel .resp_ssj').click(() => {
      RESP.checkSSJ = !RESP.checkSSJ;
      $(".resp_ssj .resp_status").toggleClass("green red").html(RESP.checkSSJ ? "On" : "Off");
    });

    // Senzu toggles
    const senzuTypes = ['red', 'blue', 'green', 'purple', 'yellow', 'magic'];
    senzuTypes.forEach(type => {
      $(`#resp_Panel .resp_${type}`).click(() => {
        const senzuKey = `SENZU_${type.toUpperCase()}`;
        if (RESP.CONF_SENZU === false) {
          $(`.resp_${type} .resp_status`).removeClass("red").addClass("green").html("On");
          RESP.CONF_SENZU = RESP[senzuKey];
          senzuTypes.filter(t => t !== type).forEach(t => $(`#resp_Panel .resp_${t}`).hide());
        } else {
          $(`.resp_${type} .resp_status`).removeClass("green").addClass("red").html("Off");
          RESP.CONF_SENZU = false;
          senzuTypes.forEach(t => $(`#resp_Panel .resp_${t}`).show());
        }
      });
    });

    // All on/off for bless
    $('#resp_Panel .resp_on').click(() => {
      for (let i = 1; i <= 10; i++) {
        $(`.resp_bh${i} .resp_status`).removeClass("red").addClass("green").html("On");
        RESP[`b${i}`] = true;
      }
    });

    $('#resp_Panel .resp_off').click(() => {
      for (let i = 1; i <= 10; i++) {
        $(`.resp_bh${i} .resp_status`).removeClass("green").addClass("red").html("Off");
        RESP[`b${i}`] = false;
      }
    });

    // Individual bless toggles (b1-b18)
    for (let i = 1; i <= 18; i++) {
      $(`#resp_Panel .resp_bh${i}`).click(() => {
        RESP[`b${i}`] = !RESP[`b${i}`];
        $(`.resp_bh${i} .resp_status`).toggleClass("green red").html(RESP[`b${i}`] ? "On" : "Off");
      });
    }

    // Buff toggles
    if (GAME.server != '20') {
      $('#resp_Panel .resp_buff_imp').click(() => {
        RESP.buff_imp = !RESP.buff_imp;
        $(".resp_buff_imp .resp_status").toggleClass("green red").html(RESP.buff_imp ? "On" : "Off");
      });

      $('#resp_Panel .resp_buff_clan').click(() => {
        RESP.buff_clan = !RESP.buff_clan;
        $(".resp_buff_clan .resp_status").toggleClass("green red").html(RESP.buff_clan ? "On" : "Off");
      });
    }

    console.log('[AFO_RESP] Handlers bound');
  }
};

// Attach methods for backward compatibility
RESP.check = () => AFO_RESP.check();
RESP.action = () => AFO_RESP.action();
RESP.fight = () => AFO_RESP.fight();
RESP.go = () => AFO_RESP.go();

// Export
window.AFO_RESP = AFO_RESP;
console.log('[AFO] Respawn module loaded');


// ========== remote/afo/pvm.js ==========
/**
 * ============================================================================
 * AFO - PVM/Listy Gończe Module
 * ============================================================================
 * 
 * LPVM system - hunting wanted mobs using pathfinding.
 * Uses EasyStar.js for pathfinding.
 * 
 * ============================================================================
 */

const AFO_LPVM = {

  Finder: null,
  tppIntervalId: null,

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    this.loadEasyStar();
    this.bindSocketHandler();
    this.injectTPPDisplay();
    this.startTPPUpdater();
  },

  startTPPUpdater() {
    if (this.tppIntervalId) return;
    this.tppIntervalId = setInterval(() => {
      if (!LPVM.Stop) {
        this.updateTPP();
      }
    }, 5000);
  },

  stopTPPUpdater() {
    if (this.tppIntervalId) {
      clearInterval(this.tppIntervalId);
      this.tppIntervalId = null;
    }
  },

  injectTPPDisplay() {
    if ($('#lpvm_tpp_display').length === 0) {
      $('<div id="lpvm_tpp_display" style="text-align:center; color: var(--afo-accent); font-size: 10px; margin: 5px 0;">PT: <b style="color:white">0</b></div>')
        .insertBefore('.panel-content .pvm_killed');
    }
    this.updateTPP();
  },

  updateTPP() {
    if (GAME && GAME.char_data) {
      $('#lpvm_tpp_display b').text(GAME.char_data.tpp || 0);
    }
  },

  loadEasyStar() {
    let esjs = document.createElement('script');
    esjs.src = 'https://cdn.jsdelivr.net/npm/easystarjs@0.4.3/bin/easystar-0.4.3.min.js';
    esjs.onload = () => {
      this.Finder = new EasyStar.js();
      this.Finder.enableDiagonals();
      this.Finder.setAcceptableTiles([1]);
      LPVM.Finder = this.Finder;
      console.log('[AFO_LPVM] EasyStar loaded');
    };
    document.head.append(esjs);
  },

  bindSocketHandler() {
    if (this._socketBound) return;
    this._socketBound = true;
    GAME.socket.on('gr', (msg) => {
      this.HandleSockets(msg);
    });
  },

  // ============================================
  // MAIN LPVM LOGIC
  // ============================================

  UpdateKilledCounter(num) {
    $("#lpvm_Panel .pvm_killed b").text(num);
  },

  Start() {
    this.LoadPVM();
  },

  CreateMatrix() {
    LPVM.Matrix = [];
    LPVM.Map = GAME.mapcell;

    // Check if mapcell is available
    if (!LPVM.Map) {
      console.warn('[AFO_LPVM] mapcell not available, retrying...');
      setTimeout(() => this.CreateMatrix(), 500);
      return false;
    }

    for (let i = 0; i < parseInt(GAME.map.max_y); i++) {
      LPVM.Matrix[i] = [];
      for (let j = 0; j < parseInt(GAME.map.max_x); j++) {
        let key = (j + 1) + '_' + (i + 1);
        if (LPVM.Map[key] && LPVM.Map[key].m == 1) {
          LPVM.Matrix[i][j] = 1;
        } else {
          LPVM.Matrix[i][j] = 0;
        }
      }
    }
    return true;
  },

  LoadPVM() {
    GAME.socket.emit('ga', { a: 32, type: 0 });
  },

  KillWanted() {
    if (document.getElementById("special_list_con").childElementCount) {
      LPVM.Killed = true;
      GAME.socket.emit('ga', { a: 32, type: 1, wanted_id: LPVM.Born, quick: 1 });
    }
  },

  Collect() {
    GAME.socket.emit('ga', { a: 32, type: 2, wanted: LPVM.Born });
    LPVM.pvm_killed++;
    this.UpdateKilledCounter(LPVM.pvm_killed);

    // Auto-save state after each reward to preserve progress
    if (typeof AFO_STATE_MANAGER !== 'undefined') {
      AFO_STATE_MANAGER.save();
    }
  },

  Teleport() {
    let loc = parseInt($("#wanted_list .green.option").eq(LPVM.Born).attr("data-loc"));
    if ((LPVM.pvm_killed >= parseInt(LPVM.limit2)) && LPVM.limit) {
      $(".lpvm_lpvm .lpvm_status").removeClass("green").addClass("red").html("Off");
      LPVM.Stop = true;
    } else if (GAME.char_data.loc != loc) {
      GAME.socket.emit('ga', { a: 12, type: 18, loc: loc });
    } else {
      this.Go();
    }
  },

  Go() {
    this.CreateMatrix();
    this.Finder.setGrid(LPVM.Matrix);
    this.Finder.findPath(
      GAME.char_data.x - 1,
      GAME.char_data.y - 1,
      parseInt(GAME.map_wanteds.x) - 1,
      parseInt(GAME.map_wanteds.y) - 1,
      (path) => {
        if (path !== null && path.length > 0) {
          LPVM._pathRetries = 0;
          if (path[0].x == GAME.char_data.x - 1 && path[0].y == GAME.char_data.y - 1) {
            path.shift();
          }
          if (path.length > 0) {
            LPVM.Path = path;
            setTimeout(() => this.Move(), LPVM.wait);
          } else {
            // Path empty after shift - already at target, try kill
            setTimeout(() => this.KillWanted(), 500);
          }
        } else {
          LPVM._pathRetries = (LPVM._pathRetries || 0) + 1;
          console.warn('[AFO_LPVM] No path found, attempt', LPVM._pathRetries);

          if (LPVM._pathRetries >= 5) {
            // After 5 failed attempts, force re-teleport to refresh location
            console.warn('[AFO_LPVM] Max retries reached, forcing re-teleport...');
            LPVM._pathRetries = 0;
            let loc = parseInt($("#wanted_list .green.option").eq(LPVM.Born).attr("data-loc"));
            GAME.socket.emit('ga', { a: 12, type: 18, loc: loc });
          } else {
            setTimeout(() => this.Go(), 1500);
          }
        }
      }
    );
    this.Finder.calculate();
  },

  Move() {
    if (LPVM.Stop) return;

    // Safety check for empty path
    if (!LPVM.Path || LPVM.Path.length === 0) {
      console.warn('[AFO_LPVM] Path empty in Move, going to target');
      setTimeout(() => this.KillWanted(), 500);
      return;
    }

    let target = LPVM.Path[0];
    let cx = GAME.char_data.x - 1;
    let cy = GAME.char_data.y - 1;
    let dir = null;

    // Calculate direction
    if (target.x > cx && target.y == cy) dir = 7;      // Right
    else if (target.x < cx && target.y == cy) dir = 8; // Left
    else if (target.x == cx && target.y > cy) dir = 1; // Down
    else if (target.x == cx && target.y < cy) dir = 2; // Up
    else if (target.x > cx && target.y > cy) dir = 3;  // Down-Right
    else if (target.x < cx && target.y < cy) dir = 6;  // Up-Left
    else if (target.x > cx && target.y < cy) dir = 5;  // Up-Right
    else if (target.x < cx && target.y > cy) dir = 4;  // Down-Left
    else {
      this.Go();
      return;
    }

    GAME.socket.emit('ga', { a: 4, dir: dir, vo: GAME.map_options.vo });
  },

  Next() {
    if (LPVM.Path.length - 1 > 0) {
      LPVM.Path.shift();
      setTimeout(() => this.Move(), LPVM.wait);
    } else {
      setTimeout(() => this.KillWanted(), 500);
    }
  },

  HandleSockets(res) {
    if (LPVM.Stop) return;

    if (res.a === 4 && res.char_id === GAME.char_id) {
      this.Next();
    } else if (res.a === 32 && res.e == 0) {
      if ($('button[data-wanted="' + LPVM.Born + '"]').html()) {
        setTimeout(() => GAME.socket.emit('ga', { a: 32, type: 2, wanted: LPVM.Born }), 150);
      } else {
        setTimeout(() => this.Teleport(), 150);
      }
    } else if (LPVM.Killed && res.a === 602 && !res.res.wanted) {
      LPVM.Killed = false;
      setTimeout(() => this.Collect(), 150);
    } else if (res.a === 32 && res.e == 2) {
      setTimeout(() => this.Teleport(), 150);
    } else if (res.a === 12) {
      if ("show_map" in res) {
        if (GAME.char_data.x == GAME.map_wanteds.x && GAME.char_data.y == GAME.map_wanteds.y) {
          setTimeout(() => this.KillWanted(), 500);
        } else {
          setTimeout(() => this.Go(), 1000);
        }
      } else {
        setTimeout(() => GAME.socket.emit('ga', { a: 32, type: 0 }), 100);
      }
    } else if (res.a === undefined) {
      setTimeout(() => this.Go(), 500);
    }
  },

  // ============================================
  // PANEL HANDLERS
  // ============================================

  bindHandlers() {
    // Main LPVM toggle
    $('#lpvm_Panel .lpvm_lpvm').click(() => {
      if (LPVM.Stop) {
        $(".lpvm_lpvm .lpvm_status").removeClass("red").addClass("green").html("On");
        LPVM.Stop = false;
        this.Start();
        // Stop other modules
        RESP.stop = true; RES.stop = true; PVP.stop = true; CODE.stop = true;
        $(".code_code .code_status, .pvp_pvp .pvp_status, .res_res .res_status, .resp_resp .resp_status")
          .removeClass("green").addClass("red").html("Off");
      } else {
        $(".lpvm_lpvm .lpvm_status").removeClass("green").addClass("red").html("Off");
        LPVM.Stop = true;
      }
    });

    // Reset counter
    $('#lpvm_Panel .pvm_killed').click(() => {
      LPVM.pvm_killed = 0;
      this.UpdateKilledCounter(0);
    });

    // Born level selectors
    const bornLevels = { g: 2, u: 3, s: 4, h: 5, m: 6 };
    Object.entries(bornLevels).forEach(([key, value]) => {
      $(`#lpvm_Panel .lpvm_${key}`).click(() => {
        if ($(`.lpvm_${key} .lpvm_status`).hasClass("red")) {
          $(`.lpvm_${key} .lpvm_status`).removeClass("red").addClass("green").html("On");
          LPVM.Born = value;
          // Hide other born options
          Object.keys(bornLevels).filter(k => k !== key).forEach(k => {
            $(`#lpvm_Panel .lpvm_${k}`).hide();
          });
        } else {
          $(`.lpvm_${key} .lpvm_status`).removeClass("green").addClass("red").html("Off");
          Object.keys(bornLevels).forEach(k => $(`#lpvm_Panel .lpvm_${k}`).show());
          $(".lpvm_lpvm .lpvm_status").removeClass("green").addClass("red").html("Off");
          LPVM.Stop = true;
        }
      });
    });

    // Limit toggle
    $('#lpvm_Panel .lpvm_limit').click(() => {
      LPVM.limit = !LPVM.limit;
      $(".lpvm_limit .lpvm_status").toggleClass("green red").html(LPVM.limit ? "On" : "Off");
    });

    // Limit value from input
    $("#lpvm_Panel input[name=lpvm_capt]").on('change', function () {
      LPVM.limit2 = parseInt($(this).val()) || 60;
    });

    console.log('[AFO_LPVM] Handlers bound');
  }
};

// Attach methods for backward compatibility
LPVM.UpdateKilledCounter = (num) => AFO_LPVM.UpdateKilledCounter(num);
LPVM.Start = () => AFO_LPVM.Start();
LPVM.Go = () => AFO_LPVM.Go();

// Export
window.AFO_LPVM = AFO_LPVM;
console.log('[AFO] PVM module loaded');


// ========== remote/afo/resources.js ==========
/**
 * ============================================================================
 * AFO - Resources/Mining Module
 * ============================================================================
 * 
 * RES system - automatic resource mining with pathfinding.
 * Uses EasyStar.js for pathfinding.
 * 
 * ============================================================================
 */

const AFO_RES = {

  finder: null,

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    this.loadEasyStar();
    this.bindSocketHandler();
  },

  loadEasyStar() {
    let esjs = document.createElement('script');
    esjs.src = 'https://cdn.jsdelivr.net/npm/easystarjs@0.4.3/bin/easystar-0.4.3.min.js';
    esjs.onload = () => {
      this.finder = new EasyStar.js();
      this.finder.enableDiagonals();
      this.finder.setAcceptableTiles([1]);
      RES.finder = this.finder;
      console.log('[AFO_RES] EasyStar loaded');
    };
    document.head.append(esjs);
  },

  bindSocketHandler() {
    if (this._socketBound) return;
    this._socketBound = true;
    GAME.socket.on('gr', (res) => {
      this.HandleResponse(res);
    });
  },

  // ============================================
  // RESOURCE MINING LOGIC
  // ============================================

  emitOrder(data) {
    if (!RES.processing) {
      RES.processing = true;
      GAME.socket.emit('ga', data);
    }
  },

  Start() {
    if (RES.last_loc != GAME.char_data.loc) {
      this.CreateMatrix();
      RES.last_loc = GAME.char_data.loc;
    }
    if (RES.refresh_mines) {
      this.getMinesPos();
      RES.refresh_mines = false;
    }
    RES.steps_clone = RES.steps.slice();
    if (RES.steps_clone[0][0] == GAME.char_data.x && RES.steps_clone[0][1] == GAME.char_data.y) {
      RES.steps_clone.shift();
    }
    this.finder.setGrid(RES.matrix);
    setTimeout(() => this.Action(), 120);
  },

  Action() {
    RES.stop = false;
    if (!RES.processing) {
      this.Go();
    } else {
      setTimeout(() => this.Action(), 1200);
    }
  },

  GetCooldown() {
    let r;
    if (Object.entries(GAME.map_mines.mine_data).length > 0 &&
      GAME.map_mines.coords[GAME.char_data.x + "_" + GAME.char_data.y][0][2] > 0) {
      let cd = GAME.map_mines.coords[GAME.char_data.x + "_" + GAME.char_data.y][0][2] - GAME.getTime();
      cd += 5;
      r = cd * 1000;
      $(".bt_cool").html(GAME.showTimer(r / 1000));
    } else {
      r = 1000;
    }
    return r;
  },

  getMinesPos() {
    let coords = Object.entries(GAME.map_mines.coords);
    let mines = [];
    for (let i = 0; i < coords.length; i++) {
      if (RES.mined_id.includes(coords[i][1][0][1])) {
        mines.push(coords[i]);
      }
    }
    this.prepareMines(mines);
  },

  prepareMines(mines) {
    RES.steps = [];
    for (let i = 0; i < mines.length; i++) {
      let pos = mines[i][0].split("_");
      if (i == 0) {
        RES.first_mine = [parseInt(pos[0]), parseInt(pos[1])];
      }
      RES.steps.push([parseInt(pos[0]), parseInt(pos[1])]);
      RES.mines[pos[0] + "_" + pos[1]] = mines[i][1][0][0];
      if (i == 0) {
        RES.last_mine = pos[0] + "_" + pos[1];
      }
    }
    RES.steps.push(RES.first_mine);
  },

  listMines() {
    let html = "";
    let mdt = Object.entries(GAME.map_mines.mine_data);
    for (let i = 0; i < mdt.length; i++) {
      if (i == 0) {
        RES.mined_id.push(mdt[i][1].id);
        html += `<div style='margin-bottom:5px; border-bottom:solid gray 1px; padding:3px;'>
          <input class='select_mine' type='checkbox' checked='true' value='${mdt[i][1].id}' ${mdt.length == 1 ? "disabled" : ""}> ${mdt[i][1].name}</div>`;
      } else {
        html += `<div style='margin-bottom:5px; border-bottom:solid gray 1px; padding:3px;'>
          <input class='select_mine' type='checkbox' value='${mdt[i][1].id}'> ${mdt[i][1].name}</div>`;
      }
    }
    $("#res_Panel ul").html(html);
    if (mdt.length == 0) {
      $("#res_Panel ul").html("Brak zasobów");
    }
  },

  CreateMatrix() {
    RES.matrix = [];
    let mapcell = GAME.mapcell;

    // Check if mapcell is available
    if (!mapcell) {
      console.warn('[AFO_RES] mapcell not available, retrying...');
      setTimeout(() => this.CreateMatrix(), 500);
      return false;
    }

    for (let i = 0; i < parseInt(GAME.map.max_y); i++) {
      RES.matrix[i] = [];
      for (let j = 0; j < parseInt(GAME.map.max_x); j++) {
        let key = (j + 1) + '_' + (i + 1);
        if (mapcell[key] && mapcell[key].m == 1) {
          RES.matrix[i][j] = 1;
        } else {
          RES.matrix[i][j] = 0;
        }
      }
    }
    return true;
  },

  Mine() {
    GAME.socket.emit('ga', {
      a: 22,
      type: 8,
      mid: RES.mines[GAME.char_data.x + "_" + GAME.char_data.y]
    });
  },

  Go() {
    if (RES.steps_clone.length > 0) {
      this.finder.findPath(
        GAME.char_data.x - 1,
        GAME.char_data.y - 1,
        RES.steps_clone[0][0] - 1,
        RES.steps_clone[0][1] - 1,
        (path) => {
          if (path !== null) {
            RES.path = path;
            if (RES.steps_clone.length > 0) {
              RES.path.shift();
              let cur = [GAME.char_data.x, GAME.char_data.y];
              setTimeout(() => {
                if (!RES.stop && RES.mines[GAME.char_data.x + "_" + GAME.char_data.y] &&
                  $(`button[data-mid='${RES.mines[GAME.char_data.x + "_" + GAME.char_data.y]}']`).length == 1 &&
                  RES.steps.some(r => r.length == cur.length && r.every((v, i) => cur[i] == v))) {
                  setTimeout(() => this.Mine(), RES.speed);
                } else if (!RES.stop) {
                  setTimeout(() => this.Move(), RES.speed);
                }
              }, 1200);
            }
          }
        }
      );
      this.finder.calculate();
    } else if (!RES.stop && (GAME.char_data.x + "_" + GAME.char_data.y) == RES.last_mine) {
      setTimeout(() => this.Mine(), 1200);
      RES.cdt = setTimeout(() => {
        if (!RES.stop) {
          GAME.loadMapJson(() => {
            GAME.socket.emit('ga', { a: 3, vo: GAME.map_options.vo }, 1);
          });
          setTimeout(() => this.Start(), 2400);
          $(".bt_cool").html("");
        }
      }, this.GetCooldown());
    }
  },

  Move() {
    if (RES.stop) return;

    let target = RES.path[0];
    let cx = GAME.char_data.x - 1;
    let cy = GAME.char_data.y - 1;
    let dir = null;

    if (target.x > cx && target.y == cy) dir = 7;
    else if (target.x < cx && target.y == cy) dir = 8;
    else if (target.x == cx && target.y > cy) dir = 1;
    else if (target.x == cx && target.y < cy) dir = 2;
    else if (target.x > cx && target.y > cy) dir = 3;
    else if (target.x < cx && target.y < cy) dir = 6;
    else if (target.x > cx && target.y < cy) dir = 5;
    else if (target.x < cx && target.y > cy) dir = 4;
    else {
      this.Go();
      return;
    }

    GAME.socket.emit('ga', { a: 4, dir: dir, vo: GAME.map_options.vo });
  },

  Next() {
    if (RES.path.length - 1 > 0) {
      RES.path.shift();
      setTimeout(() => this.Move(), RES.speed);
    } else if (RES.steps_clone.length > 0) {
      RES.steps_clone.shift();
      this.Go();
    }
  },

  HandleResponse(res) {
    // List mines when idle
    if (RES.stop && res.a === 3 && PVP.stop && LPVM.Stop && RESP.stop && CODE.stop) {
      this.listMines();
      this.getMinesPos();
    }

    // Stop if location changed
    if (res.a === 3 && RES.loc != GAME.char_data.loc) {
      RES.stop = true;
      $(".res_res .res_status").removeClass("green").addClass("red").html("Off");
      $(".bt_cool").html("");
      clearTimeout(RES.cdt);
    }
    if (res.a === 3 && RESP.loc != GAME.char_data.loc) {
      RESP.stop = true;
      $(".resp_resp .resp_status").removeClass("green").addClass("red").html("Off");
    }

    RES.processing = false;

    if (!RES.stop && res.a === 4 && res.char_id === GAME.char_id) {
      this.Next();
    } else if (!RES.stop && res.done && res.a === 22) {
      $("button[data-option='start_mine']").remove();
      this.Go();
    }
  },

  // ============================================
  // PANEL HANDLERS
  // ============================================

  bindHandlers() {
    // Main RES toggle
    $('#res_Panel .res_res').click(() => {
      if (RES.stop && Object.entries(GAME.map_mines.mine_data).length > 0) {
        $(".res_res .res_status").removeClass("red").addClass("green").html("On");
        RES.stop = false;
        RES.loc = GAME.char_data.loc;
        this.Start();
        // Stop other modules
        PVP.stop = true; RESP.stop = true; LPVM.Stop = true; CODE.stop = true;
        $(".code_code .code_status, .pvp_pvp .pvp_status, .lpvm_lpvm .lpvm_status, .resp_resp .resp_status")
          .removeClass("green").addClass("red").html("Off");
      } else {
        $(".res_res .res_status").removeClass("green").addClass("red").html("Off");
        RES.stop = true;
        $(".bt_cool").html("");
        clearTimeout(RES.cdt);
      }
    });

    // Mine checkbox selection
    $(document).on('change', '.select_mine', (e) => {
      let val = parseInt($(e.target).val());
      if ($(e.target).is(':checked')) {
        if (!RES.mined_id.includes(val)) {
          RES.mined_id.push(val);
        }
      } else {
        RES.mined_id = RES.mined_id.filter(id => id !== val);
      }
      RES.refresh_mines = true;
    });

    console.log('[AFO_RES] Handlers bound');
  }
};

// Attach methods for backward compatibility
RES.Start = () => AFO_RES.Start();
RES.Action = () => AFO_RES.Action();

// Export
window.AFO_RES = AFO_RES;
console.log('[AFO] Resources module loaded');


// ========== remote/afo/codes.js ==========
/**
 * ============================================================================
 * AFO - Codes/Training Module
 * ============================================================================
 * 
 * CODE system - automatic code usage and training across characters.
 * Supports account characters and substitutes.
 * 
 * ============================================================================
 */

const AFO_CODE = {

  // ============================================
  // MAIN CODE LOOP
  // ============================================

  start() {
    if (CODE.stop) return;

    switch (CODE.whatNow) {
      case 0:
        CODE.whatNow++;
        this.use_char();
        break;
      case 1:
        CODE.whatNow++;
        this.checkTR();
        break;
      case 2:
        CODE.whatNow++;
        this.tren();
        break;
      case 3:
        CODE.whatNow++;
        this.kodyy();
        break;
      case 4:
        CODE.whatNow = 0;
        this.out();
        break;
      default:
        break;
    }
  },

  // ============================================
  // CHARACTER HANDLING
  // ============================================

  get_char_acc() {
    let len = GAME.player_chars;
    let tabela = [];
    for (let i = 0; i < len; i++) {
      tabela[i] = parseInt($("#char_list_con")[0].children[i].attributes[2].value);
    }
    return tabela;
  },

  get_char_zast() {
    let len = $("#zast_list_con li").length;
    let tabela = [];
    for (let i = 0; i < len; i++) {
      tabela[i] = document.getElementById("zast_list_con").children[i].attributes[2].value;
    }
    return tabela;
  },

  use_char() {
    let length = this.get_char_acc().length;
    let length2 = this.get_char_zast().length;

    if (CODE.licznik < length && CODE.acc) {
      GAME.socket.emit('ga', { a: 2, char_id: this.get_char_acc()[CODE.licznik] });
      CODE.licznik++;
      window.setTimeout(() => this.start(), CODE.wait);
    } else if (CODE.licznik2 < length2 && CODE.zast) {
      GAME.socket.emit('ga', { a: 2, char_id: this.get_char_zast()[CODE.licznik2], type: 1 });
      CODE.licznik2++;
      window.setTimeout(() => this.start(), CODE.wait);
    } else {
      CODE.licznik = 0;
      CODE.licznik2 = 0;
      window.setTimeout(() => this.start(), CODE.wait);
    }
  },

  // ============================================
  // TRAINING
  // ============================================

  checkTR() {
    if (CODE.checkSSJ && GAME.quick_opts.ssj) {
      if ($("#ssj_bar").css("display") === "none") {
        GAME.socket.emit('ga', { a: 18, type: 5, tech_id: GAME.quick_opts.ssj[0] });
        window.setTimeout(() => this.start(), CODE.wait);
      } else if ($('#ssj_status').text() == "--:--:--") {
        GAME.socket.emit('ga', { a: 18, type: 6 });
        window.setTimeout(() => this.checkTR(), CODE.wait);
      } else {
        window.setTimeout(() => this.start(), CODE.wait);
      }
    } else {
      window.setTimeout(() => this.start(), CODE.wait);
    }
  },

  tren() {
    let blogo1 = $("#ekw_page_items").find("div[data-base_item_id=1629]").attr("data-item_id");

    if (GAME.is_training) {
      window.setTimeout(() => this.start(), CODE.wait);
    } else if (GAME.ekw_page != 10 && !CODE.acc && !CODE.zast) {
      GAME.ekw_page = 10;
      GAME.socket.emit('ga', { a: 12, page: 10, used: 1 });
      window.setTimeout(() => this.tren(), CODE.wait);
    } else if ($("#char_buffs").find("[data-buff=54]").length != 1 && !GAME.is_training &&
      blogo1 && CODE.b1 && !CODE.acc && !CODE.zast && !CODE.stop) {
      GAME.socket.emit('ga', { a: 12, type: 14, iid: parseInt(blogo1), page: 10 });
      window.setTimeout(() => this.tren(), CODE.wait);
    } else {
      GAME.socket.emit('ga', {
        a: 8,
        type: 2,
        stat: CODE.what_to_train,
        duration: CODE.what_to_traintime
      });
      window.setTimeout(() => this.start(), CODE.wait);
    }
  },

  kodyy() {
    let blogo2 = $("#ekw_page_items").find("div[data-base_item_id=1751]").attr("data-item_id");

    if (GAME.ekw_page != 10 && !CODE.acc && !CODE.zast) {
      GAME.ekw_page = 10;
      GAME.socket.emit('ga', { a: 12, page: 10, used: 1 });
      window.setTimeout(() => this.kodyy(), CODE.wait);
    } else if ($("#char_buffs").find("[data-buff=80]").length != 1 &&
      $("#train_uptime").find('.timer').length == 0 &&
      blogo2 && CODE.b2 && !CODE.acc && !CODE.zast && !CODE.stop) {
      GAME.socket.emit('ga', { a: 12, type: 14, iid: parseInt(blogo2), page: 10 });
      window.setTimeout(() => this.kodyy(), CODE.wait);
    } else if ($("#train_uptime").find('.timer').length == 0) {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' });
      }, 1600);
      window.setTimeout(() => this.start(), CODE.wait);
    } else {
      window.setTimeout(() => this.start(), CODE.wait);
    }
  },

  out() {
    if (CODE.acc || CODE.zast) {
      GAME.socket.emit('ga', { a: 5 });
    }
    window.setTimeout(() => this.start(), CODE.wait);
  },

  // ============================================
  // PANEL HANDLERS
  // ============================================

  bindHandlers() {
    // Main CODE toggle
    $('#code_Panel .code_code').click(() => {
      if (CODE.stop) {
        $(".code_code .code_status").removeClass("red").addClass("green").html("On");
        CODE.stop = false;
        CODE.whatNow = 0;
        this.start();
        // Stop other modules
        PVP.stop = true; RESP.stop = true; LPVM.Stop = true; RES.stop = true;
        $(".pvp_pvp .pvp_status, .resp_resp .resp_status, .lpvm_lpvm .lpvm_status, .res_res .res_status")
          .removeClass("green").addClass("red").html("Off");
      } else {
        $(".code_code .code_status").removeClass("green").addClass("red").html("Off");
        CODE.stop = true;
      }
    });

    // Account toggle
    $('#code_Panel .code_acc').click(() => {
      CODE.acc = !CODE.acc;
      $(".code_acc .code_status").toggleClass("green red").html(CODE.acc ? "On" : "Off");
    });

    // Substitutes toggle
    $('#code_Panel .code_zast').click(() => {
      CODE.zast = !CODE.zast;
      $(".code_zast .code_status").toggleClass("green red").html(CODE.zast ? "On" : "Off");
    });

    // Bless 250% train toggle
    $('#code_Panel .code_bh1').click(() => {
      CODE.b1 = !CODE.b1;
      $(".code_bh1 .code_status").toggleClass("green red").html(CODE.b1 ? "On" : "Off");
    });

    // Bless 5% code toggle
    $('#code_Panel .code_bh2').click(() => {
      CODE.b2 = !CODE.b2;
      $(".code_bh2 .code_status").toggleClass("green red").html(CODE.b2 ? "On" : "Off");
    });

    // Training stat selector
    $('#bot_what_to_train').on('change', function () {
      CODE.what_to_train = parseInt($(this).val());
    });

    // Training time selector
    $('#bot_what_to_traintime').on('change', function () {
      CODE.what_to_traintime = parseInt($(this).val());
    });

    console.log('[AFO_CODE] Handlers bound');
  }
};

// Attach methods for backward compatibility
CODE.start = () => AFO_CODE.start();

// Export
window.AFO_CODE = AFO_CODE;
console.log('[AFO] Codes module loaded');


// ========== remote/afo/glebia.js ==========
/**
 * ============================================================================
 * AFO - GŁĘBIA (Depth Dungeon) Module
 * ============================================================================
 * 
 * Automated clearing of the "Głębia" dungeon area.
 * Navigates through the map, attacking players along the way.
 * 
 * Options:
 * - Start: Enable/disable the automation
 * - Kody: Enable/disable automatic training code usage
 * 
 * ============================================================================
 */

const GLEBIA = {
  // State
  stop: true,
  caseNumber: 0,

  // Timing
  wait: 10,
  waitPvp: 200,
  attackDelay: 260,

  // Movement tracking
  dogory: false,
  loc: null,
  move1: false,
  move2: false,
  move3: false,

  // Attack tracking
  attackChecks: 0,
  attackRetries: 0,
  tileRetries: 0,
  lastEnemyCount: -1,
  isAttacking: false,

  // Options
  code: false,
  kontoTP: false,
  speed: 50
};

const AFO_GLEBIA = {

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    console.log('[AFO_GLEBIA] Module initialized');
  },

  // ============================================
  // CLICK HANDLERS
  // ============================================

  bindHandlers() {
    // Start/Stop toggle
    $('#glebia_Panel .glebia_toggle').click(() => {
      if (GLEBIA.stop) {
        $(".glebia_toggle .glebia_status").removeClass("red").addClass("green").html("On");
        GLEBIA.stop = false;

        // Reset all attack state for clean start
        GLEBIA.isAttacking = false;
        GLEBIA.attackRetries = 0;
        GLEBIA.tileRetries = 0;
        GLEBIA.lastEnemyCount = -1;
        GLEBIA.caseNumber = 0;

        this.start();

        // Stop other modules
        if (typeof PVP !== 'undefined') PVP.stop = true;
        if (typeof RESP !== 'undefined') RESP.stop = true;
        if (typeof LPVM !== 'undefined') LPVM.Stop = true;
        if (typeof RES !== 'undefined') RES.stop = true;
        if (typeof CODE !== 'undefined') CODE.stop = true;

        $(".pvp_pvp .pvp_status").removeClass("green").addClass("red").html("Off");
        $(".resp_resp .resp_status").removeClass("green").addClass("red").html("Off");
        $(".lpvm_lpvm .lpvm_status").removeClass("green").addClass("red").html("Off");
        $(".res_res .res_status").removeClass("green").addClass("red").html("Off");
        $(".code_code .code_status").removeClass("green").addClass("red").html("Off");
      } else {
        $(".glebia_toggle .glebia_status").removeClass("green").addClass("red").html("Off");
        GLEBIA.stop = true;
      }
    });

    // Kody toggle
    $('#glebia_Panel .glebia_code').click(() => {
      if (GLEBIA.code) {
        $(".glebia_code .glebia_status").removeClass("green").addClass("red").html("Off");
        GLEBIA.code = false;
        $('#glebia_Panel .glebia_konto').hide();
      } else {
        $(".glebia_code .glebia_status").removeClass("red").addClass("green").html("On");
        GLEBIA.code = true;
        $('#glebia_Panel .glebia_konto').show();
      }
    });

    // Konto toggle (visible only when Kody is on)
    $('#glebia_Panel .glebia_konto').click(() => {
      if (GLEBIA.kontoTP) {
        $(".glebia_konto .glebia_status").removeClass("green").addClass("red").html("Off");
        GLEBIA.kontoTP = false;
      } else {
        $(".glebia_konto .glebia_status").removeClass("red").addClass("green").html("On");
        GLEBIA.kontoTP = true;
      }
    });

    // Speed input handler
    $('#glebia_Panel input[name=glebia_speed]').on('input change', (e) => {
      GLEBIA.speed = parseInt($(e.target).val()) || 50;
      this.saveSpeed();
    });

    // Initially hide konto button
    $('#glebia_Panel .glebia_konto').hide();

    // Load saved speed
    this.loadSpeed();
    $('#glebia_Panel input[name=glebia_speed]').val(GLEBIA.speed);

    console.log('[AFO_GLEBIA] Handlers bound');
  },

  // ============================================
  // SPEED HELPERS
  // ============================================

  getSpeedMultiplier() {
    let speed = GLEBIA.speed;
    if (speed < 10) speed = 10;
    if (speed > 500) speed = 500;
    return speed / 50;
  },

  /**
   * Get attack delay based on speed setting.
   * Speed 10 = 200ms, Speed 50 = 100ms, Speed 100 = 50ms
   */
  getAttackDelay() {
    const speed = this.getSpeedMultiplier() * 50;
    return Math.max(30, Math.min(200, Math.round(5000 / speed)));
  },

  /**
   * Get max wait time for is_loading check.
   * Higher speed = shorter wait.
   */
  getLoadingWait() {
    const speed = this.getSpeedMultiplier() * 50;
    return Math.max(20, Math.min(80, Math.round(2500 / speed)));
  },

  saveSpeed() {
    localStorage.setItem('glebia_speed', GLEBIA.speed);
  },

  loadSpeed() {
    const saved = localStorage.getItem('glebia_speed');
    if (saved) {
      GLEBIA.speed = parseInt(saved) || 50;
    }
  },

  // ============================================
  // MAIN LOOP
  // ============================================

  start() {
    if (GLEBIA.stop) return;

    if (!GAME.is_loading) {
      this.action();
    } else {
      setTimeout(() => this.start(), GLEBIA.wait / this.getSpeedMultiplier());
    }
  },

  action() {
    // Check codes if enabled
    if (GLEBIA.code && this.checkCode()) {
      setTimeout(() => this.start(), 1800);
      return;
    }

    switch (GLEBIA.caseNumber) {
      case 0: GLEBIA.caseNumber++; this.check_position_x(); break;
      case 1: GLEBIA.caseNumber++; this.check_position_y(); break;
      case 2: GLEBIA.caseNumber++; this.check_players(); break;
      case 3: GLEBIA.caseNumber++; this.check_players2(); break;
      case 4: this.kill_players(); break; // Don't increment - attackLoop handles progression
      case 5: GLEBIA.caseNumber++; this.check_glebia_location(); break;
      case 6: GLEBIA.caseNumber = 0; this.go(); break;
      default: GLEBIA.caseNumber = 0; break;
    }
  },

  // ============================================
  // NAVIGATION
  // ============================================

  go() {
    GLEBIA.attackChecks = 0;

    const x = GAME.char_data.x;
    const y = GAME.char_data.y;

    if (x === 11 && y === 11 && GLEBIA.dogory && GLEBIA.loc === 1) {
      this.cofanie2();
    } else if (x === 15 && y === 15 && GLEBIA.move3 && GLEBIA.loc === 2) {
      this.cofanie();
    } else if (x === 2 && y === 11 && GLEBIA.loc === 1 && GLEBIA.move1) {
      this.przejdz();
      setTimeout(() => { this.move(7); }, 1000);
    } else if (x === 1 && y === 1 && GLEBIA.loc === 2 && GLEBIA.move3) {
      this.przejdz();
      setTimeout(() => { this.move(7); }, 1000);
    } else if (((x === 7 && y === 7) && GLEBIA.loc === 2 && GLEBIA.move2) ||
      (x === 9 && y === 7 && GLEBIA.loc === 2 && GLEBIA.move2)) {
      this.move(3);
    } else if (((x === 8 && y === 8) && GLEBIA.loc === 2 && GLEBIA.move2) ||
      (x === 10 && y === 8 && GLEBIA.loc === 2 && GLEBIA.move2)) {
      this.move(5);
    } else if (x === 10 && y === 11 && GLEBIA.loc === 1) {
      GLEBIA.dogory = true;
      this.move(7);
    } else if (x === 10 && y === 2 && GLEBIA.loc === 1) {
      GLEBIA.dogory = false;
      this.move(8);
    } else if (x === 5 && y === 10 && GLEBIA.loc === 1) {
      GLEBIA.move1 = true;
      this.move(8);
    } else if (x === 10 && y === 10 && GLEBIA.loc === 1) {
      GLEBIA.move1 = true;
      this.move(8);
    } else if (x === 3 && y === 1 && GLEBIA.loc === 2) {
      GLEBIA.move1 = false;
      this.move(7);
    } else if (x === 3 && y === 10 && GLEBIA.loc === 1) {
      this.move(4);
    } else if (x === 2 && y === 8 && GLEBIA.loc === 1) {
      this.move(3);
    } else if ((x === 11 && y === 11 && GLEBIA.loc === 1) ||
      (x === 15 && y === 15 && GLEBIA.loc === 2)) {
      this.move(2);
    } else if (x === 5 && y === 7 && GLEBIA.loc === 2) {
      GLEBIA.move2 = true;
      this.move(7);
    } else if (x === 13 && y === 7 && GLEBIA.loc === 2) {
      GLEBIA.move2 = false;
      this.move(7);
    } else if (x === 12 && y === 15 && GLEBIA.loc === 2) {
      GLEBIA.move3 = true;
      this.move(7);
    } else if (x === 5 && y === 11 && GLEBIA.loc === 1) {
      GLEBIA.move3 = false;
      this.move(7);
    } else if (x === 10 && y === 15 && GLEBIA.loc === 2) {
      GLEBIA.move3 = true;
      this.move(7);
    } else if (x === 7 && y === 11 && GLEBIA.loc === 1) {
      GLEBIA.move3 = false;
      this.move(7);
    } else if (x === 7 && y === 7 && GLEBIA.loc === 2) {
      this.move(1);
    } else if ((x < 11 && y % 2 !== 0 && GLEBIA.loc === 1) ||
      (x < 15 && y % 2 !== 0 && GLEBIA.loc === 2)) {
      this.move(7);
    } else if ((x > 2 && y % 2 === 0 && GLEBIA.loc === 1) ||
      (x > 1 && y % 2 === 0 && GLEBIA.loc === 2)) {
      this.move(8);
    } else if ((x === 11 && GLEBIA.loc === 1) ||
      (x === 2 && GLEBIA.loc === 1) ||
      (x === 3 && y === 9 && GLEBIA.loc === 1) ||
      (x === 1 && GLEBIA.loc === 2) ||
      (x === 15 && GLEBIA.loc === 2) ||
      (x === 7 && y === 7 && GLEBIA.loc === 2)) {
      this.move(1);
    }
  },

  cofanie() {
    const y = GAME.char_data.y;
    if (y <= 1) {
      setTimeout(() => this.start(), GLEBIA.wait);
    } else {
      GAME.emitOrder({ a: 4, dir: 6, vo: GAME.map_options.vo });
      setTimeout(() => { this.cofanie(); }, 50);
    }
  },

  cofanie2() {
    const y = GAME.char_data.y;
    if (y <= 2) {
      setTimeout(() => this.start(), GLEBIA.wait);
    } else {
      GAME.emitOrder({ a: 4, dir: 2, vo: GAME.map_options.vo });
      GLEBIA.move1 = true;
      setTimeout(() => { this.cofanie2(); }, 50);
    }
  },

  move(direction) {
    const valid = [2, 1, 8, 7, 5, 4, 3];
    if (!valid.includes(direction)) return;

    GAME.emitOrder({ a: 4, dir: direction, vo: GAME.map_options.vo });

    // Wait for map to load before continuing (prevents skipping tiles)
    this.waitForLoad(() => {
      setTimeout(() => this.start(), GLEBIA.wait);
    });
  },

  /**
   * Wait for game loading to complete before executing callback
   * Speed affects how long to wait after loading (walking speed)
   */
  waitForLoad(callback) {
    if (GLEBIA.stop) return;

    if (GAME.is_loading || $("#loader").is(":visible")) {
      setTimeout(() => this.waitForLoad(callback), 50);
    } else {
      // Speed affects walking delay: higher speed = shorter delay = faster walking
      // Base: 200ms at speed 10, ~20ms at speed 100
      const walkDelay = Math.max(20, 200 / this.getSpeedMultiplier());
      setTimeout(callback, walkDelay);
    }
  },

  przejdz() {
    GAME.emitOrder({ a: 6, tpid: 0 });
    setTimeout(() => GLEBIA.stop, 1000);
    GLEBIA.move3 = false;
    GLEBIA.move1 = false;
  },

  // ============================================
  // POSITION CHECKS
  // ============================================

  check_position_x() {
    setTimeout(() => this.start(), GLEBIA.wait);
  },

  check_position_y() {
    setTimeout(() => this.start(), GLEBIA.wait);
  },

  // ============================================
  // PLAYER CHECKS
  // ============================================

  check_players() {
    const playerList = document.getElementById("player_list_con");
    if (!playerList || playerList.childElementCount === 0) {
      return setTimeout(() => this.start(), GLEBIA.wait);
    }

    if (typeof LOWLVL !== 'undefined' && LOWLVL.stop === true) {
      if (playerList.children[0] && playerList.children[0].children[1] &&
        playerList.children[0].children[1].childElementCount === 3) {
        const tabb2 = playerList.children[0].children[1].children[0].textContent.split(":");
        if (parseInt(tabb2[1]) <= 1 && GAME.char_data.y === 2) {
          return setTimeout(() => this.check_players(), 150);
        }
      }
    }

    setTimeout(() => this.start(), GLEBIA.wait);
  },

  check_players2() {
    // kill_players now handles full attack cycle, just continue to next step
    setTimeout(() => this.start(), GLEBIA.wait);
  },

  // ============================================
  // ATTACK LOGIC (Attack-Until-Clear pattern)
  // ============================================

  /**
   * Attack loop that stays active until all enemies are killed or position changes.
   * This prevents moving to next tile before finishing kills.
   */
  kill_players() {
    // Mark that we're attacking - blocks main loop progression
    GLEBIA.isAttacking = true;

    // Save current position to detect tile change
    const startX = GAME.char_data.x;
    const startY = GAME.char_data.y;

    // Reset attack state
    GLEBIA.attackRetries = 0;
    GLEBIA.lastEnemyCount = -1;

    this.attackLoop(startX, startY);
  },

  attackLoop(startX, startY) {
    // Check if stopped
    if (GLEBIA.stop) return;

    // If game is loading, wait briefly but don't block too long
    if (GAME.is_loading || $("#loader").is(":visible")) {
      setTimeout(() => this.attackLoop(startX, startY), this.getLoadingWait());
      return;
    }

    const currentX = GAME.char_data.x;
    const currentY = GAME.char_data.y;

    // Position changed - exit attack mode and continue main loop
    if (currentX !== startX || currentY !== startY) {
      GLEBIA.attackRetries = 0;
      GLEBIA.isAttacking = false;  // Clear flag - allow main loop to continue
      GLEBIA.caseNumber++;  // Move to next step
      setTimeout(() => this.start(), GLEBIA.wait);
      return;
    }

    // Load more players if available - wait after clicking for them to load
    if ($("#player_list_con").find("[data-option=load_more_players]").length != 0) {
      $("#player_list_con").find("[data-option=load_more_players]").click();
      // Wait for players to load before continuing
      setTimeout(() => this.attackLoop(startX, startY), 300);
      return;
    }

    // Count attackable enemies (only those with visible attack button)
    let enemies = $("#player_list_con").find(".player button[data-quick=1]:not(.initial_hide_forced)");
    const enemyCount = enemies.length;

    // No enemies - exit attack mode and continue main loop
    if (enemyCount === 0) {
      GLEBIA.attackRetries = 0;
      GLEBIA.tileRetries = 0;
      GLEBIA.isAttacking = false;
      GLEBIA.caseNumber++;
      setTimeout(() => this.start(), GLEBIA.wait);
      return;
    }

    // Check if we're making progress (enemy count decreased)
    if (GLEBIA.lastEnemyCount === enemyCount) {
      GLEBIA.attackRetries++;
      GLEBIA.tileRetries++;

      // Too many retries on this tile - player likely moved or has cooldown
      // After 3 failed attempts, move on instead of getting stuck
      if (GLEBIA.tileRetries > 3) {
        console.log('[GLEBIA] Max tile retries reached (' + GLEBIA.tileRetries + '), moving on');
        GLEBIA.attackRetries = 0;
        GLEBIA.tileRetries = 0;
        GLEBIA.isAttacking = false;
        GLEBIA.caseNumber++;
        setTimeout(() => this.start(), GLEBIA.wait);
        return;
      }

      // Short-term retry - wait a bit for server response
      if (GLEBIA.attackRetries > 5) {
        GLEBIA.attackRetries = 0;
        setTimeout(() => this.attackLoop(startX, startY), 500);
        return;
      }
    } else {
      // Enemy count changed = successful kill(s)!
      if (GLEBIA.lastEnemyCount > 0 && GLEBIA.lastEnemyCount > enemyCount) {
        const killsThisRound = GLEBIA.lastEnemyCount - enemyCount;
        for (let i = 0; i < killsThisRound; i++) {
          if (typeof kws !== 'undefined' && kws.pvp_count) {
            kws.pvp_count();
          }
        }
      }
      // Reset retries - we're making progress
      GLEBIA.attackRetries = 0;
      GLEBIA.tileRetries = 0;
    }

    GLEBIA.lastEnemyCount = enemyCount;

    // Attack first enemy
    enemies.eq(0).click();

    // Continue attack loop - delay affected by speed
    setTimeout(() => this.attackLoop(startX, startY), this.getAttackDelay());
  },

  // ============================================
  // LOCATION CHECK
  // ============================================

  check_glebia_location() {
    const locationMap = {
      "Głębia": 1,
      "Głębia Rajskiej Sali": 2
    };

    let currentLoc = locationMap[GAME.current_loc.name] || 7;
    if (GLEBIA.loc !== null && GLEBIA.loc !== currentLoc) {
      GLEBIA.attackChecks = 0;
    }
    GLEBIA.loc = currentLoc;
    setTimeout(() => this.start(), GLEBIA.wait);
  },

  // ============================================
  // CODE AUTOMATION
  // ============================================

  checkCode() {
    if (!GLEBIA.code) return false;

    if (GAME.quick_opts.ssj && $("#ssj_bar").css("display") === "none") {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 18, type: 5, tech_id: GAME.quick_opts.ssj[0] });
      }, 1500);
      return true;
    } else if ($('#ssj_status').text() == "--:--:--" && GAME.quick_opts.ssj) {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 18, type: 6 });
      }, 1500);
      return true;
    } else if ($('#ssj_status').text() <= '00:00:05' && GAME.quick_opts.ssj) {
      return true;
    } else if ($("#train_uptime").find('.timer').length == 0 && !GAME.is_training) {
      GAME.socket.emit('ga', { a: 8, type: 2, stat: 1, duration: 1 });
      if (GLEBIA.kontoTP) {
        setTimeout(() => {
          GAME.socket.emit('ga', { a: 8, type: 5, multi: ':checked', apud: 'vzaaa' });
        }, 1600);
      } else {
        setTimeout(() => {
          GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' });
        }, 1600);
      }
      return true;
    } else if (GAME.is_training && $("#train_uptime").find('.timer').length == 1) {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 8, type: 3 });
      }, 1600);
      return true;
    } else if (GAME.is_training) {
      GAME.socket.emit('ga', { a: 8, type: 3 });
      return true;
    }
    return false;
  }
};

// Export
window.GLEBIA = GLEBIA;
window.AFO_GLEBIA = AFO_GLEBIA;
console.log('[AFO] GŁĘBIA module loaded');


// ========== remote/afo/ballSearcher.js ==========
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
        .insertBefore(dbPageSwitch);
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
    if (this._socketBound) return;
    this._socketBound = true;
    GAME.socket.on('gr', (msg) => {
      if (this.active) {
        this.handleSockets(msg);
      }
    });
  },

  injectCSS() {
    const css = `
      /* ========================================
         Ball Searcher Popup - Modern Design
         ======================================== */
      #ball_searcher_popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
        width: clamp(280px, 340px, 95vw);
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 12px;
        border: 2px solid #0f4c75;
        box-shadow: 0 0 30px rgba(63, 193, 201, 0.3);
        display: none;
        overflow: hidden;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      #ball_searcher_popup .bs-header {
        background: linear-gradient(90deg, #0f4c75, #1b6ca8);
        color: #ffd700;
        padding: 12px 16px;
        text-align: center;
        font-weight: bold;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1px;
        width: auto !important;
        height: auto !important;
        line-height: normal !important;
        margin: 0 !important;
        text-shadow: none !important;
      }

      #ball_searcher_popup .content {
        padding: 16px;
        color: white;
      }

      #ball_searcher_popup .bs_row {
        margin: 10px 0;
        font-size: 13px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      #ball_searcher_popup .bs_row b {
        color: #3fc1c9;
      }

      #ball_searcher_popup .bs_cooldown {
        color: #ff6b6b;
        font-weight: bold;
        background: rgba(255, 107, 107, 0.15);
        border-left: 3px solid #ff6b6b;
      }

      #ball_searcher_popup .bs_buttons {
        margin-top: 16px;
        display: flex;
        justify-content: center;
        gap: 10px;
      }

      #ball_searcher_popup .bs_buttons button {
        min-width: 100px;
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-transform: uppercase;
      }

      #ball_searcher_popup #bs_pause_btn {
        background: linear-gradient(135deg, #f9ca24, #f0932b);
        color: #bfbfff;
      }

      #ball_searcher_popup #bs_pause_btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(249, 202, 36, 0.3);
      }

      #ball_searcher_popup #bs_cancel_btn {
        background: linear-gradient(135deg, #ee5a24, #ff4757);
        color: white;
      }

      #ball_searcher_popup #bs_cancel_btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
      }

      #ball_searcher_popup .bs_paused {
        color: #f9ca24;
        font-weight: bold;
        text-align: center;
        padding: 10px;
        background: linear-gradient(90deg, rgba(249, 202, 36, 0.2) 0%, rgba(249, 202, 36, 0.05) 100%);
        border-radius: 6px;
        margin-bottom: 12px;
        border-left: 3px solid #f9ca24;
      }

      /* Responsive */
      @media (max-width: 480px) {
        #ball_searcher_popup {
          width: 90vw;
        }
        
        #ball_searcher_popup .bs_buttons button {
          min-width: 80px;
          padding: 8px 16px;
          font-size: 11px;
        }
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
    // bonus17 is timestamp when bonus expires, compare with current game time
    const bonus17 = GAME.char_data.bonus17;
    if (!bonus17 || bonus17 === 0 || bonus17 === null || bonus17 === undefined) {
      return false;
    }
    return bonus17 > GAME.getTime();
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
        <div class="bs-header">🔮 SZUKACZ KUL</div>
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

  navigateToBall(targetX, targetY, retryCount = 0) {
    if (!this.active || this.paused) return;

    this.updatePopupStatus(`Idę do kuli (${targetX}, ${targetY})`);
    console.log(`[BALL_SEARCHER] Navigating to ball at ${targetX},${targetY}`);

    if (!this.createMatrix()) {
      // Retry up to 5 times if mapcell not available yet (like LPVM does)
      if (retryCount < 5) {
        console.warn(`[BALL_SEARCHER] mapcell not available, retrying... (${retryCount + 1}/5)`);
        setTimeout(() => this.navigateToBall(targetX, targetY, retryCount + 1), 500);
        return;
      }
      console.error('[BALL_SEARCHER] Failed to create matrix after retries');
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
      setTimeout(() => this.checkForBalls(), 1200);
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


// ========== remote/afo/assist.js ==========
/**
 * ============================================================================
 * AFO - Clan Training Assistant Module
 * ============================================================================
 *
 * Automates clan training and assists:
 * - TRENUJ: Start training, cancel when selected player assists, loop
 * - ASYSTUJ: Monitor selected player's trainings and assist ASAP
 *
 * ============================================================================
 */

const AFO_ASSIST = {

  // ============================================
  // MAIN LOOPS
  // ============================================

  /**
   * TRENUJ Loop:
   * 1. Start training (1h strength)
   * 2. Wait for selected player to assist
   * 3. Cancel training
   * 4. Cooldown and repeat
   */
  startTraining() {
    if (ASSIST.trainStop || GAME.is_training) return;

    ASSIST.trainState = 1;

    // Start 1h strength training
    GAME.socket.emit('ga', {
      a: 8,
      type: 2,
      stat: 1,      // Siła
      duration: 1   // 1 godzina
    });

    console.log('[AFO_ASSIST] Training started');
    ASSIST.trainState = 2; // Wait for assist

    setTimeout(() => this.checkTrainProgress(), ASSIST.wait);
  },

  checkTrainProgress() {
    if (ASSIST.trainStop) {
      ASSIST.trainState = 0;
      return;
    }

    // Check if assist received
    if (ASSIST.assistReceived && GAME.is_training) {
      console.log('[AFO_ASSIST] Assist received, canceling training');
      this.cancelTraining();
    } else {
      // Keep checking
      setTimeout(() => this.checkTrainProgress(), 1000);
    }
  },

  cancelTraining() {
    ASSIST.trainState = 3;

    // Cancel current training
    GAME.socket.emit('ga', {a: 8, type: 3});

    console.log('[AFO_ASSIST] Training canceled');

    // Reset and restart after cooldown
    setTimeout(() => {
      ASSIST.trainState = 0;
      ASSIST.assistReceived = false;
      this.startTraining(); // Loop
    }, ASSIST.wait);
  },

  /**
   * ASYSTUJ Loop:
   * 1. Fetch clan trainings list
   * 2. Find selected player's training
   * 3. Assist if found and not already assisting
   * 4. Cooldown and repeat
   */
  startAssisting() {
    if (ASSIST.assistStop || ASSIST.selectedPlayerId === 0) return;

    ASSIST.assistState = 1;
    this.fetchTrains();
  },

  fetchTrains() {
    if (ASSIST.assistStop) {
      ASSIST.assistState = 0;
      return;
    }

    // Request clan trainings
    GAME.socket.emit('ga', {a: 39, type: 54});

    console.log('[AFO_ASSIST] Fetching trainings');

    // Wait for parseClanData(17) to populate ASSIST.clanTrains
    setTimeout(() => this.findPlayerTrain(), ASSIST.wait);
  },

  findPlayerTrain() {
    if (ASSIST.assistStop) {
      ASSIST.assistState = 0;
      return;
    }

    ASSIST.assistState = 3;

    const trains = ASSIST.clanTrains;
    if (!trains || trains.length === 0) {
      // No trainings, retry
      setTimeout(() => this.fetchTrains(), 2000);
      return;
    }

    // Find selected player's training where we haven't assisted yet
    const playerTrain = trains.find(t =>
      t.char_id === ASSIST.selectedPlayerId &&
      (!t.helpers || !t.helpers.chars || t.helpers.chars.indexOf(GAME.char_id) === -1)
    );

    if (playerTrain) {
      console.log('[AFO_ASSIST] Found training for', ASSIST.selectedPlayer);
      this.doAssist(playerTrain.id, playerTrain.char_id);
    } else {
      // No training found, retry
      setTimeout(() => this.fetchTrains(), 2000);
    }
  },

  doAssist(tid, target) {
    ASSIST.assistState = 4;

    GAME.socket.emit('ga', {
      a: 39,
      type: 55,
      tid: tid,
      target: target
    });

    console.log('[AFO_ASSIST] Assist sent to', ASSIST.selectedPlayer);

    // Cooldown and restart loop
    setTimeout(() => {
      ASSIST.assistState = 0;
      this.startAssisting();
    }, ASSIST.wait);
  },

  // ============================================
  // CLAN DATA HANDLER (called from hook)
  // ============================================

  handleClanData(res, type) {
    switch(type) {
      case 4:  // Lista członków
        ASSIST.clanMembers = res.players || [];
        this.updateMemberSelect();
        console.log('[AFO_ASSIST] Clan members updated:', ASSIST.clanMembers.length);
        break;

      case 17: // Lista treningów
        ASSIST.clanTrains = res.trains || [];
        console.log('[AFO_ASSIST] Clan trainings updated:', ASSIST.clanTrains.length);
        break;

      case 18: // Aktualizacja treningu (nowa asysta)
        if (res.assistant && res.assistant[0] == ASSIST.selectedPlayerId) {
          ASSIST.assistReceived = true;
          console.log('[AFO_ASSIST] Assist detected from', ASSIST.selectedPlayer);
        }
        break;
    }
  },

  // ============================================
  // UI UPDATES
  // ============================================

  updateMemberSelect() {
    const select = $('#assist_player_select');
    if (select.length === 0) return;

    select.empty();
    select.append('<option value="0">-</option>');

    // Sort alphabetically, exclude self
    const sorted = ASSIST.clanMembers
      .filter(p => p.id !== GAME.char_id)
      .sort((a, b) => a.name.localeCompare(b.name));

    sorted.forEach(player => {
      const selected = player.id == ASSIST.selectedPlayerId ? 'selected' : '';
      select.append(`<option value="${player.id}" ${selected}>${player.name}</option>`);
    });
  },

  // ============================================
  // PANEL HANDLERS
  // ============================================

  bindHandlers() {
    // TRENUJ toggle
    $('#assist_Panel .assist_train').click(() => {
      if (ASSIST.trainStop) {
        ASSIST.trainStop = false;
        ASSIST.trainState = 0;
        ASSIST.assistReceived = false;
        $('.assist_train .assist_status').removeClass('red').addClass('green').html('On');
        this.startTraining();
      } else {
        ASSIST.trainStop = true;
        ASSIST.trainState = 0;
        $('.assist_train .assist_status').removeClass('green').addClass('red').html('Off');
      }
    });

    // ASYSTUJ toggle
    $('#assist_Panel .assist_assist').click(() => {
      if (ASSIST.assistStop) {
        if (ASSIST.selectedPlayerId === 0) {
          GAME.komunikat('Wybierz gracza z listy!');
          return;
        }
        ASSIST.assistStop = false;
        ASSIST.assistState = 0;
        $('.assist_assist .assist_status').removeClass('red').addClass('green').html('On');
        this.startAssisting();
      } else {
        ASSIST.assistStop = true;
        ASSIST.assistState = 0;
        $('.assist_assist .assist_status').removeClass('green').addClass('red').html('Off');
      }
    });

    // Player select change
    $('#assist_player_select').on('change', function() {
      const playerId = parseInt($(this).val());
      const playerName = $(this).find('option:selected').text();

      ASSIST.selectedPlayerId = playerId;
      ASSIST.selectedPlayer = playerName;

      console.log('[AFO_ASSIST] Selected player:', playerName, '(ID:', playerId, ')');
    });

    console.log('[AFO_ASSIST] Handlers bound');
  },

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    // Fetch initial clan members list
    if (GAME.char_data && GAME.char_data.klan_id > 0) {
      setTimeout(() => {
        GAME.socket.emit('ga', {a: 39, type: 15});
        console.log('[AFO_ASSIST] Fetching initial clan members');
      }, 1200);
    }
  }
};

// Export
window.AFO_ASSIST = AFO_ASSIST;
console.log('[AFO] Assist module loaded');


// ========== remote/afo/dailyQuests.js ==========
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

  // Timeout tracking for cleanup
  _pendingTimeouts: [],

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
    if (this._socketBound) return;
    this._socketBound = true;
    GAME.socket.on('gr', (msg) => {
      if (!DAILY.stop) {
        this.handleSockets(msg);
      }
    });
  },

  // Timeout management helpers to prevent memory leaks
  safeSetTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
      // Remove from tracking when executed
      this._pendingTimeouts = this._pendingTimeouts.filter(id => id !== timeoutId);
      callback();
    }, delay);
    this._pendingTimeouts.push(timeoutId);
    return timeoutId;
  },

  clearAllTimeouts() {
    this._pendingTimeouts.forEach(id => clearTimeout(id));
    this._pendingTimeouts = [];
    console.log('[AFO_DAILY] Cleared all pending timeouts');
  },

  injectCSS() {
    const css = `
      /* ========================================
         Daily Quests Panel - Modern Design
         ======================================== */
      #daily_Panel {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        position: fixed;
        top: 300px;
        right: 200px;
        left: auto;
        z-index: 9999;
        width: clamp(280px, 340px, 95vw);
        padding: 0;
        border-radius: 12px;
        border: 2px solid #0f4c75;
        box-shadow: 0 0 25px rgba(63, 193, 201, 0.25);
        display: none;
        user-select: none;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        overflow: hidden;
        touch-action: none;
      }

      #daily_Panel .daily-header {
        background: linear-gradient(90deg, #0f4c75, #1b6ca8);
        padding: 12px 16px;
        color: #3fc1c9;
        font-weight: bold;
        text-align: center;
        cursor: move;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: auto !important;
        height: auto !important;
        line-height: normal !important;
        margin: 0 !important;
        text-shadow: none !important;
      }

      #daily_Panel .daily-header::before {
        content: '📅';
      }

      #daily_Panel .daily_status {
        text-align: center;
        color: #3fc1c9;
        padding: 8px 12px;
        font-size: 11px;
        background: rgba(0, 0, 0, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      #daily_Panel .daily_select_all {
        padding: 8px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: center;
        gap: 8px;
      }

      #daily_Panel .daily_select_all button {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(63, 193, 201, 0.3);
        color: #b8b8b8;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-transform: uppercase;
        font-weight: 600;
      }

      #daily_Panel .daily_select_all button:hover {
        background: rgba(63, 193, 201, 0.2);
        color: #3fc1c9;
        border-color: #3fc1c9;
      }

      #daily_Panel .daily_quest_list {
        max-height: 300px;
        overflow-y: auto;
        padding: 8px;
      }

      #daily_Panel .daily_quest_list::-webkit-scrollbar {
        width: 6px;
      }

      #daily_Panel .daily_quest_list::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }

      #daily_Panel .daily_quest_list::-webkit-scrollbar-thumb {
        background: #0f4c75;
        border-radius: 3px;
      }

      #daily_Panel .daily_quest_list::-webkit-scrollbar-thumb:hover {
        background: #3fc1c9;
      }

      #daily_Panel .daily_quest_item {
        display: flex;
        align-items: center;
        padding: 8px 10px;
        color: white;
        border-radius: 6px;
        font-size: 11px;
        margin-bottom: 4px;
        background: rgba(255, 255, 255, 0.03);
        transition: all 0.2s ease;
      }

      #daily_Panel .daily_quest_item:hover {
        background: rgba(63, 193, 201, 0.1);
      }

      #daily_Panel .daily_quest_item.completed {
        text-decoration: line-through;
        opacity: 0.4;
        background: rgba(46, 213, 115, 0.1);
      }

      #daily_Panel .daily_quest_item.skipped {
        color: #ff9800;
        text-decoration: line-through;
        opacity: 0.6;
        background: rgba(255, 152, 0, 0.1);
      }

      #daily_Panel .daily_quest_item.current {
        background: linear-gradient(90deg, rgba(63, 193, 201, 0.2) 0%, rgba(63, 193, 201, 0.05) 100%);
        border-left: 3px solid #3fc1c9;
      }

      #daily_Panel .daily_quest_item input[type="checkbox"] {
        width: 16px;
        height: 16px;
        margin-right: 10px;
        accent-color: #3fc1c9;
        cursor: pointer;
        flex-shrink: 0;
      }

      #daily_Panel .daily_quest_item .quest_name {
        flex: 1;
        font-weight: 500;
      }

      #daily_Panel .daily_quest_item .quest_loc {
        color: #666;
        font-size: 9px;
        margin-left: 8px;
      }

      #daily_Panel .daily_controls {
        display: flex;
        justify-content: center;
        gap: 10px;
        padding: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      #daily_Panel .daily_controls button {
        min-width: 90px;
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-transform: uppercase;
      }

      #daily_Panel .daily_controls #daily_start_btn {
        background: linear-gradient(135deg, #10ac84, #2ed573);
        color: white;
      }

      #daily_Panel .daily_controls #daily_start_btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(46, 213, 115, 0.3);
      }

      #daily_Panel .daily_controls #daily_pause_btn {
        background: linear-gradient(135deg, #f9ca24, #f0932b);
        color: #bfbfff;
      }

      #daily_Panel .daily_controls #daily_stop_btn {
        background: linear-gradient(135deg, #ee5a24, #ff4757);
        color: white;
      }

      #daily_Panel .daily_controls button.hidden {
        display: none;
      }

      #daily_Panel .daily_options {
        padding: 10px 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.2);
      }

      #daily_Panel .daily_options > div {
        margin-bottom: 8px;
      }

      #daily_Panel .daily_options > div:last-child {
        margin-bottom: 0;
      }

      #daily_Panel .daily_options label {
        color: #b8b8b8;
        font-size: 11px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      #daily_Panel .daily_options select {
        background: rgba(0, 0, 0, 0.4);
        color: white;
        border: 1px solid #0f4c75;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 11px;
        cursor: pointer;
      }

      #daily_Panel .daily_options select:focus {
        outline: none;
        border-color: #3fc1c9;
      }

      #daily_Panel .daily_options .daily_toggle {
        cursor: pointer;
        transition: all 0.2s ease;
      }

      #daily_Panel .daily_options .daily_toggle:hover {
        background: rgba(63, 193, 201, 0.3) !important;
      }

      #daily_Panel .daily_quest_item.premium {
        background: linear-gradient(90deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%);
        border-left: 3px solid #ffd700;
      }

      #daily_Panel .daily_quest_item.premium .quest_name {
        color: #ffd700;
        font-weight: bold;
      }

      #daily_Panel .daily_quest_item.waiting {
        background: linear-gradient(90deg, rgba(100, 149, 237, 0.15) 0%, rgba(100, 149, 237, 0.05) 100%);
        border-left: 3px solid #6495ed;
      }

      #daily_Panel .daily_quest_item.waiting .quest_name {
        color: #6495ed;
      }

      #daily_Panel .daily_quest_item .quest_timer {
        color: #6495ed;
        font-size: 10px;
        margin-left: 6px;
        animation: pulse 1.5s infinite;
        background: rgba(100, 149, 237, 0.2);
        padding: 2px 6px;
        border-radius: 4px;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      #daily_Panel .daily_options input[type="checkbox"] {
        accent-color: #3fc1c9;
      }

      /* Quest icon sprites */
      #daily_Panel .quest_icon {
        width: 18px;
        height: 18px;
        margin-right: 6px;
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

      /* Responsive */
      @media (max-width: 768px) {
        #daily_Panel {
          width: clamp(260px, 90vw, 340px);
          right: 5vw;
        }

        #daily_Panel .sekcja {
          padding: 10px 12px;
          font-size: 11px;
        }

        #daily_Panel .daily_quest_item {
          padding: 6px 8px;
          font-size: 10px;
        }

        #daily_Panel .daily_controls button {
          min-width: 70px;
          padding: 8px 12px;
          font-size: 10px;
        }
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

    // Unbind handlers before removing panel to prevent memory leaks
    this.unbindUIHandlers();

    // Remove existing panel
    $('#daily_Panel').remove();

    const html = `
      <div id="daily_Panel">
        <div class="daily-header daily_dragg">DZIENNE QUESTY</div>
        <div class="daily_status" id="daily_status">Gotowy do startu</div>
        <div class="daily_select_all" style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: center; gap: 8px;">
          <button class="newBtn" id="daily_toggle_all_btn" style="font-size: 10px; padding: 6px 12px;">PRZEŁĄCZ</button>
          <button class="newBtn" id="daily_important_btn" style="font-size: 10px; padding: 6px 12px;">ULUBIONE</button>
          <button class="newBtn" id="daily_reset_btn" style="font-size: 10px; padding: 6px 12px;">ZERUJ</button>
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
    $('#daily_Panel').show().draggable({ handle: '.daily_dragg', containment: 'window' });

    this.loadCompletedQuests();
    this.loadSkippedQuests();
    this.loadFailedQuests();
    this.renderQuestList();
    this.bindUIHandlers();
  },

  hidePanel() {
    this.unbindUIHandlers();
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
    // enabledQuests = quests user explicitly enabled (overriding enabled:false default)
    DAILY.enabledQuests = [];
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

  unbindUIHandlers() {
    // Remove all event handlers to prevent memory leaks
    $('#daily_toggle_all_btn').off('click');
    $('#daily_important_btn').off('click');
    $('#daily_reset_btn').off('click');
    $('#daily_substance_toggle').off('click');
    $('#daily_combat_loc').off('change');
    $('#daily_compressor_toggle').off('click');
    $('#daily_start_btn').off('click');
    $('#daily_pause_btn').off('click');
    $('#daily_stop_btn').off('click');
    // Delegated handlers on #daily_quest_list will be removed with the panel
  },

  bindUIHandlers() {
    // Unbind first to prevent duplicates
    this.unbindUIHandlers();

    // Quest checkbox toggle
    $('#daily_quest_list').on('change', 'input[type="checkbox"]', (e) => {
      const $item = $(e.target).closest('.daily_quest_item');
      const questName = $item.data('quest-name');
      const quest = DAILY.questData?.find(q => q.name === questName);
      const defaultEnabled = quest?.enabled !== false;  // Default is enabled unless explicitly false

      if (e.target.checked) {
        // User checked the box
        DAILY.skippedQuests = DAILY.skippedQuests.filter(n => n !== questName);

        // If quest is disabled by default, track that user explicitly enabled it
        if (!defaultEnabled) {
          if (!DAILY.enabledQuests) DAILY.enabledQuests = [];
          if (!DAILY.enabledQuests.includes(questName)) {
            DAILY.enabledQuests.push(questName);
          }
        }
      } else {
        // User unchecked the box
        if (!DAILY.skippedQuests.includes(questName)) {
          DAILY.skippedQuests.push(questName);
        }

        // Remove from enabledQuests if was there
        if (DAILY.enabledQuests) {
          DAILY.enabledQuests = DAILY.enabledQuests.filter(n => n !== questName);
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

    // Important quests button - select only quests with worth: true flag (respecting born filter)
    $('#daily_important_btn').on('click', () => {
      $('#daily_quest_list input[type="checkbox"]:not(:disabled)').each((_, el) => {
        const $item = $(el).closest('.daily_quest_item');
        const questName = $item.data('quest-name');
        const quest = DAILY.questData?.find(q => q.name === questName);
        const isImportant = quest?.worth === true;

        $(el).prop('checked', isImportant).trigger('change');
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

    // Build quest queue from checked quests
    // Quest is checked if: not in skippedQuests AND (enabled !== false OR user explicitly enabled it)
    // enabledQuests tracks quests user explicitly enabled (overriding enabled:false default)
    const currentBorn = GAME.char_data.reborn;
    const availableQuests = DAILY.questData
      .filter(q => q.born.includes(currentBorn))
      .filter(q => this.isQuestAvailable(q))
      .filter(q => {
        // Check if quest should be executed based on checkbox state
        // Same logic as renderQuestList uses for isEnabled
        const isUserDisabled = DAILY.skippedQuests.includes(q.name);
        const isUserEnabled = DAILY.enabledQuests?.includes(q.name);  // User explicitly enabled

        // If user explicitly disabled (unchecked) -> skip
        if (isUserDisabled) return false;

        // If user explicitly enabled (checked despite enabled:false) -> include
        if (isUserEnabled) return true;

        // Otherwise use JSON default: enabled !== false means include
        return q.enabled !== false;
      })
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

    // Clear any pending timeouts from previous runs
    this.clearAllTimeouts();

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

    // Clear all pending timeouts to prevent phantom operations
    this.clearAllTimeouts();

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

      // Set flag to prevent scheduleWaitingCheck from calling stop() while we're processing
      DAILY._processingWaitingQuest = true;

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
        // Only stop if not currently processing a waiting quest
        if (!DAILY.stop && !DAILY._processingWaitingQuest && DAILY.waitingQuests?.length === 0) {
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
    // Always set _currentQuest so afterTeleport() knows which quest we're processing
    // This is crucial for waiting quests where quest is not in questQueue
    DAILY._currentQuest = quest;

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

    // BUG FIX: If we're inside a portal from a PREVIOUS quest, exit it first before going anywhere else
    // This can happen when portal quest completes and next quest is on a different location
    // We need to walk to portal exit and use a:6 to leave, then teleport normally
    const prevQuest = DAILY.questQueue[DAILY.currentQuestIdx - 1];
    const prevPortal = prevQuest?.location?.portal;
    if (DAILY.inPortal && prevPortal?.innerLocId && GAME.char_data.loc === prevPortal.innerLocId) {
      console.log('[AFO_DAILY] Still inside portal at', prevPortal.innerLocId, '- exiting first before teleporting to', locId);
      this.navigateToCoords(prevPortal.exit.x, prevPortal.exit.y, () => {
        console.log('[AFO_DAILY] At portal exit, using portal to leave');
        GAME.socket.emit('ga', { a: 6 });  // Use portal to exit

        setTimeout(() => {
          if (DAILY.stop || DAILY.paused) return;
          console.log('[AFO_DAILY] Portal exit complete, now continuing to quest location');
          DAILY.inPortal = false;
          // Now proceed with normal teleport - call goToNormalLocation again
          this.goToNormalLocation(quest);
        }, 1500);
      });
      return;
    }

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
        // Quest not on map - try navigating to JSON coords before marking complete
        const coords = quest.location?.coords;
        if (coords) {
          console.log('[AFO_DAILY] Quest not in map_quests, navigating to JSON coords:', coords);
          this.navigateToCoords(coords.x, coords.y, () => {
            const questDataAfterNav = this.findQuestByName(quest.name);
            if (questDataAfterNav) {
              this.startDialog(quest, questDataAfterNav.qb_id);
            } else {
              // Check if ANY quest is at these coords - name might differ
              const anyQuestHere = this.findQuestAtCoords(coords.x, coords.y);
              if (anyQuestHere) {
                console.log('[AFO_DAILY] Found quest with different name:', anyQuestHere.data.name, '- starting dialog');
                this.startDialog(quest, anyQuestHere.qb_id);
              } else {
                // Still not found - truly completed
                console.log('[AFO_DAILY] Quest still not found after navigating - marking complete:', quest.name);
                this.markQuestComplete(quest.name);
                this.advanceQuestQueue();
              }
            }
          });
        } else {
          console.log('[AFO_DAILY] Quest not in map_quests and no coords - marking complete:', quest.name);
          this.markQuestComplete(quest.name);
          this.advanceQuestQueue();
        }
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
    DAILY._teleportStartTime = Date.now();
    DAILY._expectedLocId = locId;
    GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });

    // Teleport timeout - if no socket response within 2.5s, force afterTeleport
    setTimeout(() => {
      if (DAILY.isTeleporting && DAILY._teleportStartTime &&
        Date.now() - DAILY._teleportStartTime >= 2000) {
        console.warn('[AFO_DAILY] Teleport timeout - forcing afterTeleport');
        DAILY.isTeleporting = false;
        this.afterTeleport();
      }
    }, 2500);
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

    const availableQuests = [];

    for (let coords in GAME.map_quests) {
      const questsAtCoords = GAME.map_quests[coords];
      if (Array.isArray(questsAtCoords)) {
        for (let quest of questsAtCoords) {
          // Skip if quest entry is false (quest already completed)
          if (quest === false) continue;
          if (!quest || !quest.name) continue;

          availableQuests.push(quest.name);

          // Exact match only - no partial matching to avoid confusion
          // between similar quest names like "Zadanie" and "Zadanie PvM"
          if (quest.name === name) {
            const [x, y] = coords.split('_').map(Number);
            return { qb_id: quest.qb_id, coords: [x, y], data: quest };
          }
        }
      }
    }

    // Log available quests for debugging when not found
    if (availableQuests.length > 0) {
      console.log('[AFO_DAILY] Quest not found:', name, 'Available quests:', availableQuests);
    }

    return null;
  },

  // Find quest by qb_id (unique identifier) - more reliable than name matching
  findQuestByQbId(targetQbId) {
    if (!GAME.map_quests || !targetQbId) return null;

    for (let coords in GAME.map_quests) {
      const questsAtCoords = GAME.map_quests[coords];
      if (Array.isArray(questsAtCoords)) {
        for (let quest of questsAtCoords) {
          if (quest === false || !quest) continue;
          if (quest.qb_id === targetQbId) {
            const [x, y] = coords.split('_').map(Number);
            return { qb_id: quest.qb_id, coords: [x, y], data: quest };
          }
        }
      }
    }
    return null;
  },

  // Find any quest at given coords (when quest name doesn't match)
  findQuestAtCoords(x, y) {
    if (!GAME.map_quests) return null;

    const coordsKey = `${x}_${y}`;
    const questsAtCoords = GAME.map_quests[coordsKey];

    if (Array.isArray(questsAtCoords)) {
      for (let quest of questsAtCoords) {
        if (quest && quest !== false && quest.qb_id) {
          return { qb_id: quest.qb_id, coords: [x, y], data: quest };
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

    // Always save original qbId when starting dialog - crucial for PvP quests
    // After going to enemy empire, findQuestByName returns THEIR quests, not ours
    if (qb_id) {
      DAILY._originalQbId = qb_id;
    }

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
    // First check if we have a globally saved qbId from startDialog (most reliable)
    if (DAILY._originalQbId) {
      requires.originalQbId = DAILY._originalQbId;
      console.log('[AFO_DAILY] Using saved _originalQbId:', requires.originalQbId);
    } else {
      // Fallback to findQuestByName
      const questData = this.findQuestByName(quest.name);
      if (questData && questData.qb_id) {
        requires.originalQbId = questData.qb_id;
        console.log('[AFO_DAILY] Saved originalQbId from findQuestByName:', requires.originalQbId);
      }
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

    // Remember if we're in portal so we can return to innerLocId later
    const innerLocId = quest.location?.portal?.innerLocId;
    DAILY._wasInPortal = DAILY.inPortal || (innerLocId && GAME.char_data.loc === innerLocId);

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
    // If quest has portal, return to innerLocId (inside portal), not locId (outside)
    const locId = quest.location?.locId;
    const innerLocId = quest.location?.portal?.innerLocId;
    const currentLoc = GAME.char_data.loc;

    // Check if we should return to inner portal location
    const returnLocId = (innerLocId && DAILY._wasInPortal) ? innerLocId : locId;

    if (returnLocId && currentLoc !== returnLocId) {
      console.log('[AFO_DAILY] Returning to quest location:', returnLocId, '(innerLocId:', innerLocId, 'wasInPortal:', DAILY._wasInPortal, ')');
      this.updateStatus(`${quest.name}: Wracam zakończyć...`);
      DAILY.isTeleporting = true;
      DAILY._currentQuest = quest;

      // If returning to inner portal, set inPortal flag
      if (returnLocId === innerLocId) {
        DAILY.inPortal = true;
      }

      GAME.socket.emit('ga', { a: 12, type: 18, loc: returnLocId });
      // Continue via handleSockets -> afterTeleport -> navigateToQuestNPC
    } else {
      // Already on location
      DAILY._wasInPortal = false;  // Clear flag
      this.navigateToQuestNPC(quest);
    }
  },

  handleResourceCollect(quest, requires) {
    if (DAILY.stop || DAILY.paused) return;

    DAILY.isInCombat = true;  // Reuse combat flag for resource collection
    DAILY._combatQuest = quest;
    DAILY._combatRequires = requires;

    // Remember if we're in portal so we can return to innerLocId later
    const innerLocId = quest.location?.portal?.innerLocId;
    DAILY._wasInPortal = DAILY.inPortal || (innerLocId && GAME.char_data.loc === innerLocId);

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

      // Also check quest_warunek span - parse TEXT (game updates text, NOT data-count!)
      const questSpan = $(`.quest_warunek${qbId}`);
      if (questSpan.length > 0) {
        // Parse from text "7/10" or "5 140/10 000" format using regex
        // IMPORTANT: Game updates the TEXT content, not the data-count attribute!
        const spanText = questSpan.text().trim();
        const progressMatch = spanText.match(/^([\d\s]+)\/([\d\s]+)/);
        let current = 0;
        let target = requires.target;

        if (progressMatch) {
          current = parseInt(progressMatch[1].replace(/\s/g, '')) || 0;
          target = parseInt(progressMatch[2].replace(/\s/g, '')) || requires.target;
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
    // If quest has portal, return to innerLocId (inside portal), not locId (outside)
    const locId = quest.location?.locId;
    const innerLocId = quest.location?.portal?.innerLocId;
    const currentLoc = GAME.char_data.loc;

    // Determine correct return location
    // If quest has portal and we need to return inside it
    const returnLocId = (innerLocId && DAILY._wasInPortal) ? innerLocId : locId;

    console.log('[AFO_DAILY] Return location - locId:', locId, 'innerLocId:', innerLocId, 'returnTo:', returnLocId, 'wasInPortal:', DAILY._wasInPortal);

    if (returnLocId && currentLoc !== returnLocId) {
      // Teleport back to quest location
      console.log('[AFO_DAILY] Returning to quest location:', returnLocId);
      this.updateStatus('Wracam do lokacji questa...');
      DAILY.isTeleporting = true;
      DAILY._currentQuest = quest;

      // If returning to inner portal location, set inPortal flag
      if (returnLocId === innerLocId) {
        DAILY.inPortal = true;
      }

      GAME.socket.emit('ga', { a: 12, type: 18, loc: returnLocId });
      // Continue in handleSockets -> afterTeleport -> navigateToQuestNPC
    } else {
      // Already on correct location - just navigate to NPC
      DAILY._wasInPortal = false;  // Clear flag
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

          // VERIFY teleport succeeded before starting combat!
          if (GAME.char_data.loc !== locId) {
            DAILY._anielskaTeleportRetries = (DAILY._anielskaTeleportRetries || 0) + 1;
            console.warn('[AFO_DAILY] Anielska: Combat teleport failed! Expected:', locId, 'Current:', GAME.char_data.loc, 'Retry:', DAILY._anielskaTeleportRetries);

            if (DAILY._anielskaTeleportRetries >= 3) {
              console.error('[AFO_DAILY] Anielska: Combat teleport failed after 3 retries - skipping');
              DAILY._anielskaTeleportRetries = 0;
              this.skipAnielskaBatch();
              return;
            }

            // Retry teleport
            this.anielskaStartCombat();
            return;
          }
          DAILY._anielskaTeleportRetries = 0;

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
      console.log('[AFO_DAILY] Anielska: Teleporting to quest location', locId);
      DAILY._anielskaReturnTeleporting = true;  // Use separate flag for return teleport
      DAILY._anielskaTargetLoc = locId;
      GAME.socket.emit('ga', { a: 12, type: 18, loc: locId });

      // Wait for teleport confirmation via anielskaAfterReturnTeleport
      // Called from handleSockets when a:12 with show_map is received
      return;
    }

    // Already at location - wait for map_quests to load
    this.anielskaWaitForMapQuests(0);
  },

  // Called after return teleport completes (from handleSockets)
  anielskaAfterReturnTeleport() {
    if (DAILY.stop || DAILY.paused) return;

    DAILY._anielskaReturnTeleporting = false;  // Clear return teleport flag
    const locId = DAILY._anielskaTargetLoc || 1245;

    // Verify teleport succeeded
    if (GAME.char_data.loc !== locId) {
      DAILY._anielskaReturnRetries = (DAILY._anielskaReturnRetries || 0) + 1;
      console.warn('[AFO_DAILY] Anielska: Return teleport failed! Expected:', locId, 'Current:', GAME.char_data.loc, 'Retry:', DAILY._anielskaReturnRetries);

      if (DAILY._anielskaReturnRetries >= 3) {
        console.error('[AFO_DAILY] Anielska: Return teleport failed after 3 retries - completing anyway');
        DAILY._anielskaReturnRetries = 0;
      } else {
        // Retry teleport
        setTimeout(() => this.anielskaReturnAndComplete(), 1000);
        return;
      }
    }
    DAILY._anielskaReturnRetries = 0;

    // Wait for map_quests to load
    this.anielskaWaitForMapQuests(0);
  },

  // Wait for map_quests to be populated after teleport
  anielskaWaitForMapQuests(attempts) {
    if (DAILY.stop || DAILY.paused) return;

    const mapQuestsLoaded = GAME.map_quests !== undefined &&
      GAME.map_quests !== null &&
      typeof GAME.map_quests === 'object';

    if (mapQuestsLoaded && Object.keys(GAME.map_quests).length > 0) {
      console.log('[AFO_DAILY] Anielska: map_quests loaded, completing quests');
      this.anielskaCompleteNext(0);
      return;
    }

    if (attempts >= 10) {
      console.warn('[AFO_DAILY] Anielska: map_quests timeout, completing anyway');
      this.anielskaCompleteNext(0);
      return;
    }

    setTimeout(() => this.anielskaWaitForMapQuests(attempts + 1), 500);
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
    DAILY._anielskaTeleporting = false;
    DAILY._anielskaReturnTeleporting = false;
    DAILY._anielskaTeleportRetries = 0;
    DAILY._anielskaReturnRetries = 0;

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

    // Remember if we're in portal so we can return to innerLocId later
    const innerLocId = quest.location?.portal?.innerLocId;
    DAILY._wasInPortal = DAILY.inPortal || (innerLocId && GAME.char_data.loc === innerLocId);

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

      if (DAILY._stuckAttempts >= 2) {
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

    // Quest verified not in field_opts_con... but is it REALLY gone from map data?
    // Use qb_id for exact match to avoid matching similar-named quests
    // (e.g., "Zadanie" vs "Zadanie PvM" in Pałac Wszechmogącego)
    const qbIdToCheck = qbId || DAILY._originalQbId;
    const currentQuestData = qbIdToCheck
      ? this.findQuestByQbId(qbIdToCheck)
      : this.findQuestByName(quest.name);

    if (currentQuestData) {
      console.warn('[AFO_DAILY] Quest still exists in GAME.map_quests - NOT complete:', quest.name, 'qb_id:', qbIdToCheck);

      // Track verification attempts for map existence to avoid infinite loops
      DAILY._verifyMapAttempts = (DAILY._verifyMapAttempts || 0) + 1;

      if (DAILY._verifyMapAttempts > 5) {
        console.warn('[AFO_DAILY] Too many map verify attempts (5), assuming stuck/ghost and marking complete');
        DAILY._verifyMapAttempts = 0;
        this.onQuestComplete(quest);
        return;
      }

      // Quest exists - try to continue it
      if (currentQuestData.qb_id) {
        console.log('[AFO_DAILY] Restarting dialog for incomplete quest, attempt:', DAILY._verifyMapAttempts);
        setTimeout(() => this.startDialog(quest, currentQuestData.qb_id), 800);
      } else {
        // Weird state, just wait and verify again
        setTimeout(() => this.verifyAndCompleteQuest(quest), 800);
      }
      return;
    }

    // Quest is not in field_opts_con AND not in map_quests = truly complete!
    DAILY._verifyAttempts = 0;
    DAILY._verifyMapAttempts = 0;
    console.log('[AFO_DAILY] Quest verified complete (UI + Map Data):', quest.name);
    this.onQuestComplete(quest);
  },

  onQuestComplete(quest) {
    console.log('[AFO_DAILY] Quest complete:', quest.name);
    this.markQuestComplete(quest.name);

    DAILY.isInCombat = false;
    DAILY._processingWaitingQuest = false;  // Clear flag - waiting quest processing done

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
    // BUG FIX: Check if we're inside a portal and need to exit BEFORE clearing inPortal flag
    // This handles case where "Tajemniczy Portal" teleports to Vestria but user skips "Boski Ulepszacz"
    const completedQuest = DAILY._currentQuest || DAILY.questQueue[DAILY.currentQuestIdx];
    const completedPortal = completedQuest?.location?.portal;

    if (DAILY.inPortal && completedPortal?.innerLocId && GAME.char_data.loc === completedPortal.innerLocId) {
      console.log('[AFO_DAILY] Still inside portal at', completedPortal.innerLocId, '- exiting before advancing queue');
      this.updateStatus('Wychodzę z portalu...');

      // Small delay to ensure any previous navigation state is fully cleared
      // This prevents conflicts when advanceQuestQueue is called from a navigation callback
      setTimeout(() => {
        if (DAILY.stop || DAILY.paused) return;

        // Reset navigation state explicitly before starting portal exit navigation
        DAILY.isNavigating = false;
        DAILY._navCallback = null;

        this.navigateToCoords(completedPortal.exit.x, completedPortal.exit.y, () => {
          console.log('[AFO_DAILY] At portal exit, using portal to leave');
          GAME.socket.emit('ga', { a: 6 });  // Use portal to exit

          setTimeout(() => {
            if (DAILY.stop || DAILY.paused) return;
            console.log('[AFO_DAILY] Portal exit complete, now advancing queue');
            DAILY.inPortal = false;
            // Now actually advance the queue (recursive call with inPortal=false)
            this.advanceQuestQueue();
          }, 1500);
        });
      }, 300);
      return;
    }

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
    if (res.a === 12 && 'show_map' in res) {
      // Check for Anielska return teleport first (uses separate flag from accept teleport)
      if (DAILY._anielskaReturnTeleporting) {
        console.log('[AFO_DAILY] Anielska return teleport complete');
        this.anielskaAfterReturnTeleport();
        return;
      }

      if (DAILY.isTeleporting) {
        DAILY.isTeleporting = false;
        console.log('[AFO_DAILY] Normal teleport complete');

        // Check if entered portal
        if (DAILY.currentPortalLocId && GAME.char_data.loc === DAILY.currentPortalLocId) {
          DAILY.inPortal = true;
          DAILY.currentPortalLocId = 0;
        }

        this.afterTeleport();
      }
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

      // Check for callback from goToQuestLocation (used by waiting quests)
      // This ensures waiting quests properly continue to NPC after teleport
      if (DAILY._afterTeleportCallback) {
        const callback = DAILY._afterTeleportCallback;
        DAILY._afterTeleportCallback = null;
        console.log('[AFO_DAILY] Executing _afterTeleportCallback for waiting quest');
        callback();
        return;
      }

      const quest = DAILY._currentQuest || DAILY.questQueue[DAILY.currentQuestIdx];
      if (!quest) {
        this.processNextQuest();
        return;
      }

      // Verify teleport success for normal locations with locId
      // Also accept innerLocId if quest has portal (we might be inside portal)
      const expectedLocId = quest.location?.locId;
      const innerLocId = quest.location?.portal?.innerLocId;
      const currentLoc = GAME.char_data.loc;

      // Valid location: either at expectedLocId OR at innerLocId (inside portal)
      const isAtExpectedLoc = expectedLocId && currentLoc === expectedLocId;
      const isAtInnerLoc = innerLocId && currentLoc === innerLocId;
      const isValidLocation = isAtExpectedLoc || isAtInnerLoc || DAILY.inPortal;

      if (expectedLocId && !isValidLocation) {
        DAILY._teleportRetries = (DAILY._teleportRetries || 0) + 1;
        console.warn('[AFO_DAILY] Teleport verification failed! Expected:', expectedLocId, 'or innerLocId:', innerLocId, 'Current:', currentLoc, 'Retry:', DAILY._teleportRetries);

        if (DAILY._teleportRetries >= 3) {
          console.error('[AFO_DAILY] Teleport failed after 3 retries - skipping quest');
          DAILY._teleportRetries = 0;
          this.skipQuestWithMark(quest, 'Teleport nie powiódł się');
          return;
        }

        // Retry teleport
        console.log('[AFO_DAILY] Retrying teleport to:', expectedLocId);
        DAILY.isTeleporting = true;
        GAME.socket.emit('ga', { a: 12, type: 18, loc: expectedLocId });
        return;
      }
      DAILY._teleportRetries = 0;  // Reset on success

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

      // Quest not found and no portal
      // Verify we're on correct location before marking as completed
      const expectedLocId = quest.location?.locId;
      const innerLocId = quest.location?.portal?.innerLocId;
      const currentLoc = GAME.char_data.loc;

      // For special location types (clan_planet, empire_hq, private_planet) without locId,
      // we can't verify by locId - instead try to navigate to NPC coords from JSON
      const isSpecialLocationType = ['clan_planet', 'empire_hq', 'private_planet'].includes(quest.locationType);

      if (isSpecialLocationType && !expectedLocId) {
        // Special location without locId - quest might still be active but not in map_quests
        // Try to navigate to JSON coords and start dialog
        const coords = quest.location?.coords;
        if (coords) {
          console.log('[AFO_DAILY] Special location quest not in map_quests, navigating to JSON coords:', coords);
          this.navigateToCoords(coords.x, coords.y, () => {
            const questData = this.findQuestByName(quest.name);
            if (questData) {
              this.startDialog(quest, questData.qb_id);
            } else {
              // Still not found after navigating - truly doesn't exist
              console.log('[AFO_DAILY] Quest still not found after navigating - marking complete:', quest.name);
              this.markQuestComplete(quest.name);
              this.advanceQuestQueue();
            }
          });
          return;
        }
      }

      // Valid if at expectedLocId OR innerLocId OR inPortal flag is set
      const isAtExpectedLoc = expectedLocId && currentLoc === expectedLocId;
      const isAtInnerLoc = innerLocId && currentLoc === innerLocId;
      const isValidLocation = isAtExpectedLoc || isAtInnerLoc || DAILY.inPortal;

      if (expectedLocId && !isValidLocation) {
        console.warn('[AFO_DAILY] Quest not in map_quests but wrong location! Expected:', expectedLocId, 'or innerLocId:', innerLocId, 'Current:', currentLoc);
        this.skipQuestWithMark(quest, 'Błąd teleportu - zła lokacja');
        return;
      }
      // Quest not found in map_quests but we're on valid location
      // Try navigating to NPC coords from JSON before marking as completed
      const coords = quest.location?.coords;
      if (coords) {
        console.log('[AFO_DAILY] Quest not in map_quests, navigating to JSON coords:', coords);
        this.navigateToCoords(coords.x, coords.y, () => {
          const questDataAfterNav = this.findQuestByName(quest.name);
          if (questDataAfterNav) {
            this.startDialog(quest, questDataAfterNav.qb_id);
          } else {
            // Check if ANY quest is at these coords - name might differ
            const anyQuestHere = this.findQuestAtCoords(coords.x, coords.y);
            if (anyQuestHere) {
              console.log('[AFO_DAILY] Found quest with different name:', anyQuestHere.data.name, '- starting dialog');
              this.startDialog(quest, anyQuestHere.qb_id);
            } else {
              // Truly not found after navigating - mark complete
              console.log('[AFO_DAILY] Quest not found after navigating - marking complete:', quest.name);
              this.markQuestComplete(quest.name);
              this.advanceQuestQueue();
            }
          }
        });
        return;
      }

      // No coords available - mark as completed
      console.log('[AFO_DAILY] Quest not in map_quests and no coords - marking complete:', quest.name);
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


// ========== remote/afo/index.js ==========
/**
 * ============================================================================
 * AFO - All For One (Main Coordinator)
 * ============================================================================
 * 
 * This is the main entry point for AFO functionality.
 * It loads all submodules and coordinates their interaction.
 * 
 * Modules:
 * - afo/templates.js  - UI templates (CSS/HTML)
 * - afo/state.js      - State objects (PVP, RESP, LPVM, RES, CODE)
 * - afo/pvp.js        - PVP automation logic
 * - afo/respawn.js    - Respawn/PVM automation logic
 * - afo/pvm.js        - LPVM (Listy gończe) logic
 * - afo/resources.js  - Resource mining logic
 * - afo/codes.js      - Codes/training logic
 * - afo/glebia.js     - Głębia (depth dungeon) logic
 * - afo/assist.js     - Clan training assistant logic
 *
 * ============================================================================
 */

const AFO = {
  version: '2.0.0',
  loaded: false,

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    if (this.loaded) {
      console.log('[AFO] Already loaded');
      return;
    }

    console.log('[AFO] Initializing...');

    // Initialize state with current location
    if (typeof initAFOState === 'function') {
      initAFOState();
    }

    // Load item data from items.json (async, fallback to inline data if fails)
    this.loadItemData();

    // Inject templates
    if (typeof AFO_Templates !== 'undefined') {
      AFO_Templates.injectAll();
    }

    // Bind panel handlers
    this.bindPanelHandlers();

    // Setup GAME overrides
    this.setupGameOverrides();

    // Initial data fetch
    this.fetchInitialData();

    this.loaded = true;
    console.log('[AFO] Initialization complete');
  },

  /**
   * Load item data from items.json for RESP module
   */
  loadItemData() {
    const getAFOUrl = (path) => {
      const configEl = document.getElementById('__gieniobot_config__');
      const devMode = typeof GIENIOBOT_DEV_MODE !== 'undefined' && GIENIOBOT_DEV_MODE;
      const localUrl = configEl ? configEl.dataset.extensionUrl : '';
      const githubUrl = 'https://raw.githubusercontent.com/rkurski/miszcz/main/';
      return (devMode && localUrl) ? localUrl + path : githubUrl + path;
    };

    fetch(getAFOUrl('remote/data/items.json'))
      .then(response => response.json())
      .then(data => {
        if (typeof AFO_RESP !== 'undefined') {
          AFO_RESP.itemData = data;
          console.log('[AFO] Loaded items.json data');
        }
      })
      .catch(err => {
        console.warn('[AFO] Failed to load items.json, using fallback inline data:', err);
      });
  },

  // ============================================
  // PANEL HANDLERS (Main menu toggles)
  // ============================================

  bindPanelHandlers() {
    // Main panel toggles
    $('#main_Panel .gh_pvp').click(() => {
      if ($(".gh_pvp .gh_status").hasClass("red")) {
        $(".gh_pvp .gh_status").removeClass("red").addClass("green").html("On");
        $("#pvp_Panel").show();
      } else {
        $(".gh_pvp .gh_status").removeClass("green").addClass("red").html("Off");
        $("#pvp_Panel").hide();
        $(".pvp_pvp .pvp_status").removeClass("green").addClass("red").html("Off");
        PVP.stop = true;
      }
    });

    $('#main_Panel .gh_resp').click(() => {
      if ($(".gh_resp .gh_status").hasClass("red")) {
        $(".gh_resp .gh_status").removeClass("red").addClass("green").html("On");
        $("#resp_Panel").show();
      } else {
        $(".gh_resp .gh_status").removeClass("green").addClass("red").html("Off");
        $("#resp_Panel").hide();
        RESP.stop = true;
        $(".resp_resp .resp_status").removeClass("green").addClass("red").html("Off");
      }
    });

    $('#main_Panel .gh_res').click(() => {
      if ($(".gh_res .gh_status").hasClass("red")) {
        $(".gh_res .gh_status").removeClass("red").addClass("green").html("On");
        $("#res_Panel").show();
      } else {
        $(".gh_res .gh_status").removeClass("green").addClass("red").html("Off");
        $("#res_Panel").hide();
        RES.stop = true;
        $(".res_res .res_status").removeClass("green").addClass("red").html("Off");
      }
    });

    $('#main_Panel .gh_lpvm').click(() => {
      if ($(".gh_lpvm .gh_status").hasClass("red")) {
        $(".gh_lpvm .gh_status").removeClass("red").addClass("green").html("On");
        $("#lpvm_Panel").show();
      } else {
        $(".gh_lpvm .gh_status").removeClass("green").addClass("red").html("Off");
        $("#lpvm_Panel").hide();
        LPVM.Stop = true;
        $(".lpvm_lpvm .lpvm_status").removeClass("green").addClass("red").html("Off");
      }
    });

    $('#main_Panel .gh_code').click(() => {
      if ($(".gh_code .gh_status").hasClass("red")) {
        $(".gh_code .gh_status").removeClass("red").addClass("green").html("On");
        $("#code_Panel").show();
      } else {
        $(".gh_code .gh_status").removeClass("green").addClass("red").html("Off");
        $("#code_Panel").hide();
        CODE.stop = true;
        $(".code_code .code_status").removeClass("green").addClass("red").html("Off");
      }
    });

    $('#main_Panel .gh_low_lvls').click(() => {
      if ($(".gh_low_lvls .gh_status").hasClass("red")) {
        $(".gh_low_lvls .gh_status").removeClass("red").addClass("green").html("On");
        LOWLVL.stop = false;
      } else {
        $(".gh_low_lvls .gh_status").removeClass("green").addClass("red").html("Off");
        LOWLVL.stop = true;
      }
    });

    // GŁĘBIA main button - show/hide submenu
    $('#main_Panel .gh_glebia').click(() => {
      if ($(".gh_glebia .gh_status").hasClass("red")) {
        $(".gh_glebia .gh_status").removeClass("red").addClass("green").html("On");
        $("#glebia_Panel").show();
      } else {
        $(".gh_glebia .gh_status").removeClass("green").addClass("red").html("Off");
        $("#glebia_Panel").hide();
        $(".glebia_toggle .glebia_status").removeClass("green").addClass("red").html("Off");
        if (typeof GLEBIA !== 'undefined') GLEBIA.stop = true;
      }
    });

    // DZIENNE main button - show daily quests panel
    $('#main_Panel .gh_daily').click(() => {
      if ($(".gh_daily .gh_status").hasClass("red")) {
        $(".gh_daily .gh_status").removeClass("red").addClass("green").html("On");
        if (typeof AFO_DAILY !== 'undefined') {
          AFO_DAILY.showPanel();
        }
      } else {
        $(".gh_daily .gh_status").removeClass("green").addClass("red").html("Off");
        if (typeof AFO_DAILY !== 'undefined') {
          AFO_DAILY.hidePanel();
          if (!DAILY.stop) {
            AFO_DAILY.stop('Zamknięto panel');
          }
        }
      }
    });

    // ASYSTENT main button - show/hide submenu
    $('#main_Panel .gh_assist').click(() => {
      if ($(".gh_assist .gh_status").hasClass("red")) {
        $(".gh_assist .gh_status").removeClass("red").addClass("green").html("On");
        $("#assist_Panel").show();
      } else {
        $(".gh_assist .gh_status").removeClass("green").addClass("red").html("Off");
        $("#assist_Panel").hide();
        ASSIST.trainStop = true;
        ASSIST.assistStop = true;
        $(".assist_train .assist_status, .assist_assist .assist_status")
          .removeClass("green").addClass("red").html("Off");
      }
    });

    // Initialize submodules that need EasyStar
    if (typeof AFO_LPVM !== 'undefined') AFO_LPVM.init();
    if (typeof AFO_RES !== 'undefined') AFO_RES.init();
    if (typeof AFO_BALL_SEARCHER !== 'undefined') AFO_BALL_SEARCHER.init();
    if (typeof AFO_DAILY !== 'undefined') AFO_DAILY.init();
    if (typeof AFO_ASSIST !== 'undefined') AFO_ASSIST.init();
    // Note: AFO_CAMP_STATS is now self-initializing (no need to call init() here)

    // Bind submodule handlers
    if (typeof AFO_PVP !== 'undefined') AFO_PVP.bindHandlers();
    if (typeof AFO_RESP !== 'undefined') AFO_RESP.bindHandlers();
    if (typeof AFO_LPVM !== 'undefined') AFO_LPVM.bindHandlers();
    if (typeof AFO_RES !== 'undefined') AFO_RES.bindHandlers();
    if (typeof AFO_CODE !== 'undefined') AFO_CODE.bindHandlers();
    if (typeof AFO_GLEBIA !== 'undefined') AFO_GLEBIA.bindHandlers();
    if (typeof AFO_BALL_SEARCHER !== 'undefined') AFO_BALL_SEARCHER.bindHandlers();
    if (typeof AFO_DAILY !== 'undefined') AFO_DAILY.bindHandlers();
    if (typeof AFO_ASSIST !== 'undefined') AFO_ASSIST.bindHandlers();

    // List mines after delay
    setTimeout(() => {
      if (typeof AFO_RES !== 'undefined' && GAME.maploaded) {
        AFO_RES.listMines();
      }
    }, 500);

    console.log('[AFO] Panel handlers bound');
  },

  // ============================================
  // GAME OVERRIDES
  // ============================================

  setupGameOverrides() {
    // Override emit for optimized loading
    GAME.emit = function (order, data, force) {
      if (!this.is_loading || force) {
        this.load_start();
        this.socket.emit(order, data);
      } else if (this.debug) console.log('failed order', order, data);
    };

    GAME.emitOrder = function (data, force = false) {
      this.emit('ga', data, force);
    };

    GAME.initiate = function () {
      $('#player_login').text(this.login);
      $('#game_win').show();
      if (this.char_id == 0 && this.pid > 0) {
        this.emitOrder({ a: 1 });
      }
      var len = this.servers.length, con = '';
      for (var i = 0; i < len; i++) {
        con += '<option value="' + this.servers[i] + '">' + LNG['server' + this.servers[i]] + '</option>';
      }
      $('#available_servers').html(con);
      $('#available_servers option[value=' + this.server + ']').prop('selected', true);
    };

    // Setup mapcell property for pathfinding (dynamic lookup)
    (function () {
      let cachedKey;
      function findMapcellKey() {
        if (!cachedKey) {
          cachedKey = Object.keys(GAME).find(z => GAME[z] && GAME[z]['1_1']);
        }
        return cachedKey;
      }
      Object.defineProperty(GAME, 'mapcell', {
        get: function () { return GAME[findMapcellKey()]; }
      });
    })();

    // Override player list parsing for low level filter
    if (!GAME.parseListPlayer_o) {
      GAME.parseListPlayer_o = GAME.parseListPlayer;
      GAME.parseListPlayer = function (entry, pvp_master) {
        if (entry && entry.data) {
          let pd = entry.data;
          if (!LOWLVL.stop && (pd.level < GAME.char_data.level)) {
            return '';
          }
        }
        return GAME.parseListPlayer_o(entry, pvp_master);
      };
    }

    if (!GAME.parsePlayerShadow_o) {
      GAME.parsePlayerShadow_o = GAME.parsePlayerShadow;
      GAME.parsePlayerShadow = function (data, pvp_master) {
        if (data && data.pd) {
          let pd = data.pd;
          if (!LOWLVL.stop && (pd.level < GAME.char_data.level)) {
            return '';
          }
        }
        return GAME.parsePlayerShadow_o(data, pvp_master);
      };
    }

    // Hook parseClanData for ASSIST module
    if (!GAME.parseClanData_original) {
      GAME.parseClanData_original = GAME.parseClanData.bind(GAME);
      GAME.parseClanData = function(res, type) {
        GAME.parseClanData_original(res, type);
        if (typeof AFO_ASSIST !== 'undefined') {
          AFO_ASSIST.handleClanData(res, type);
        }
      };
    }

    console.log('[AFO] GAME overrides applied');
  },

  // ============================================
  // INITIAL DATA FETCH
  // ============================================

  fetchInitialData() {
    // Fetch empire data
    setTimeout(() => {
      GAME.socket.emit('ga', { a: 50, type: 0, empire: GAME.char_data.empire });
    }, 300);

    // Fetch clan data only if in a clan
    if (GAME.char_data && GAME.char_data.klan_id > 0) {
      setTimeout(() => {
        GAME.emitOrder({ a: 39, type: 0 });
      }, 600);

      setTimeout(() => {
        GAME.emitOrder({ a: 39, type: 23 });
      }, 900);
    }
  },

  // ============================================
  // UTILITY: Stop all modules
  // ============================================

  stopAll() {
    PVP.stop = true;
    RESP.stop = true;
    LPVM.Stop = true;
    RES.stop = true;
    CODE.stop = true;
    DAILY.stop = true;
    if (typeof GLEBIA !== 'undefined') GLEBIA.stop = true;
    if (typeof ASSIST !== 'undefined') {
      ASSIST.trainStop = true;
      ASSIST.assistStop = true;
    }

    $(".pvp_pvp .pvp_status").removeClass("green").addClass("red").html("Off");
    $(".resp_resp .resp_status").removeClass("green").addClass("red").html("Off");
    $(".lpvm_lpvm .lpvm_status").removeClass("green").addClass("red").html("Off");
    $(".res_res .res_status").removeClass("green").addClass("red").html("Off");
    $(".code_code .code_status").removeClass("green").addClass("red").html("Off");
    $(".glebia_toggle .glebia_status").removeClass("green").addClass("red").html("Off");
    $(".gh_daily .gh_status").removeClass("green").addClass("red").html("Off");
    $(".assist_train .assist_status, .assist_assist .assist_status")
      .removeClass("green").addClass("red").html("Off");

    console.log('[AFO] All modules stopped');
  }
};

// Export
window.AFO = AFO;
console.log('[AFO] Main module loaded');

