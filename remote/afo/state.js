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

  // Timing
  wait: 100
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
window.initAFOState = initAFOState;

console.log('[AFO] State module loaded');
