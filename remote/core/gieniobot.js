/**
 * ============================================================================
 * GIENIOBOT MASTER - Main Bot Logic
 * ============================================================================
 * 
 * Version: 2.3.2
 * Repository: https://github.com/rkurski/miszcz
 * 
 * STRUCTURE:
 * ----------
 * Lines 1-70:     Configuration & Socket Detection
 * Lines 67-2342:  Main Gieniobot class with all bot methods
 *   - constructor:          Initialization, CSS, bindings
 *   - Settings:             getSettings, updateSettings
 *   - Automation:           manageAutoExpeditions, manageAutoAbyss, manageAutoArena
 *   - Clan:                 activateAllClanBuffs, freeAssist
 *   - UI:                   updateTopBar, createMinimapSettings
 *   - Combat:               questProceed, pvpKill
 *   - Map:                  parseMapInfo, findQuests, findSK
 *   - Click Handlers:       bindClickHandlers (lines 1264-1819)
 * Lines 2343-2355: kws instance creation
 * Lines 2356-2761: GAME.* method overrides
 * Lines 2762-2770: ekwipunek initialization (ball modules self-initialize)
 * 
 * DEV_MODE:
 * ---------
 * Set GIENIOBOT_DEV_MODE = true for local development (uses extension files)
 * Set GIENIOBOT_DEV_MODE = false for production (fetches from GitHub)
 * 
 * ============================================================================
 */

// ============================================
// CONFIGURATION
// ============================================
// DEV_MODE = true  -> uses local files (edit and refresh, no waiting for GitHub)
// DEV_MODE = false -> uses GitHub (for production/release)
const GIENIOBOT_DEV_MODE = false;

// Read extension URL from DOM element (set by content_script.js, CSP-safe)
const configEl = document.getElementById('__gieniobot_config__');
const GIENIOBOT_LOCAL_URL = configEl ? configEl.dataset.extensionUrl : '';
const GIENIOBOT_GITHUB_URL = 'https://raw.githubusercontent.com/rkurski/miszcz/main/';

// Helper function to get correct URL for resources
function getGieniobotUrl(path) {
  if (GIENIOBOT_DEV_MODE && GIENIOBOT_LOCAL_URL) {
    return GIENIOBOT_LOCAL_URL + path;
  }
  return GIENIOBOT_GITHUB_URL + path;
}

// ============================================
// GLOBAL VARIABLES
// ============================================
var checked = false;
var latency = -1;

console.log('[Gieniobot] Loading, DEV_MODE:', GIENIOBOT_DEV_MODE, 'LOCAL_URL:', GIENIOBOT_LOCAL_URL ? 'yes' : 'no');

if (typeof GAME === 'undefined') {
  console.log('[Gieniobot] GAME is undefined, skipping initialization!');
} else {
  // ============================================
  // STATE VARIABLES (global for module access)
  // ============================================
  var arena_count = 0;
  var pvp_count = 0;
  var empireDataLoaded = false;           // adimp
  var questRollActive1 = false;           // roll1
  var questRollActive2 = false;           // roll2
  var questRollActive3 = false;           // roll3
  var version = '2.3.2';

  // ============================================
  // SOCKET DETECTION
  // Find GAME.socket by scanning page scripts
  // ============================================
  let waitForGamePid = setInterval(() => {
    if (!GAME.pid) { } else {
      clearInterval(waitForGamePid);
      checked = true;
    }
  }, 50);

  let socketDetector = setInterval(() => {
    clearInterval(socketDetector);
    // Find socket.io instance
    Array.from(document.getElementsByTagName('script')).forEach(script => {
      const scriptContent = script.innerHTML;
      const regex = /const\s+([a-zA-Z0-9_]+)\s*=\s*(io\([^\)]+\));/g;
      let match;
      while ((match = regex.exec(scriptContent)) !== null) {
        if (eval(match[1])['io']) { GAME.socket = eval(match[1]); return; }
      }
    });

    // Find a24value for auth
    window.a24value = null;
    Array.from(document.getElementsByTagName('script')).forEach(script => {
      const scriptContent = script.innerHTML;
      const regex = /a:\s*'([a-zA-Z0-9]+)'/g;
      let match;
      while ((match = regex.exec(scriptContent)) !== null) {
        window.a24value = match[1];
      }
    });

    // ============================================
    // SIDEBAR CSS (inline - no separate file needed)
    // ============================================
    const SIDEBAR_CSS = `
/* ============================================
   KWS SIDEBAR - Main Container
   ============================================ */

#kws_sidebar {
  background: linear-gradient(180deg, rgba(0,20,40,0.95) 0%, rgba(0,10,25,0.98) 100%);
  position: fixed;
  top: 120px;
  left: 5px;
  z-index: 9998;
  width: 220px;
  padding: 5px;
  border-radius: 5px;
  border-image: url(/gfx/layout/mapborder.png) 7 8 7 7 fill;
  border-style: solid;
  border-width: 7px 8px 7px 7px;
  user-select: none;
  font-family: 'Play', sans-serif;
  font-size: 13px;
  color: white;
  transition: left 0.3s ease;
}

/* Collapsed state */
#kws_sidebar.kws-collapsed {
  left: -215px;
}

#kws_sidebar.kws-collapsed:hover {
  left: -5px;
}

/* Header */
.kws-sidebar-header {
  position: absolute;
  top: -27px;
  left: -7px;
  background: rgba(0,0,0,0.9);
  background-size: 100% 100%;
  width: 220px;
  cursor: pointer;
  text-align: center;
  touch-action: none;
  user-select: none;
  font-weight: bold;
  font-size: 12px;
  padding: 5px 0;
  border-radius: 5px 5px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.kws-sidebar-toggle {
  width: 16px;
  height: 16px;
  cursor: pointer;
  transition: transform 0.3s;
}

.kws-sidebar-toggle.rotated {
  transform: rotate(180deg);
}

/* Content */
.kws-sidebar-content {
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.kws-sidebar-content::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Opera */
}

/* Sections */
.kws-sidebar-section {
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  padding-bottom: 8px;
}

.kws-sidebar-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.kws-sidebar-section-title {
  font-weight: bold;
  font-size: 11px;
  color: #63aaff;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.kws-sidebar-section-title.kws-expandable {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.2s;
}

.kws-sidebar-section-title.kws-expandable:hover {
  color: orange;
}

.kws-expand-icon {
  font-size: 10px;
  transition: transform 0.3s;
  display: inline-block;
}

.kws-expand-icon.expanded {
  transform: rotate(90deg);
}

/* Stats Table */
.kws-stats-table {
  width: 100%;
  border-collapse: collapse;
}

.kws-stat-row {
  cursor: pointer;
  transition: background 0.2s;
}

.kws-stat-row:hover {
  background: rgba(255,165,0,0.2);
}

.kws-stat-label {
  font-size: 12px;
  color: #aaa;
  padding: 3px 5px;
  width: 70px;
  text-transform: uppercase;
}

.kws-stat-value {
  font-size: 12px;
  color: white;
  padding: 3px 5px;
  text-align: right;
  font-weight: bold;
}

.kws-stat-value.status-active {
  color: lime;
}

.kws-stat-value.status-timer {
  color: white;
}

/* Additional Stats */
.kws-additional-content {
  margin-top: 5px;
}

.kws-reset-btn {
  background: #31313a69;
  border: solid #ffffff4d 1px;
  width: 100%;
  height: 28px;
  line-height: 26px;
  text-align: center;
  font-family: 'Play', sans-serif;
  font-size: 11px;
  font-weight: Bold;
  color: #fff;
  text-transform: uppercase;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 5px;
  transition: all 0.2s;
}

.kws-reset-btn:hover {
  background: #31313a;
  border-color: orange;
}

/* Spawn Settings */
.kws-spawn-content {
  margin-top: 5px;
}

.kws-spawn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px 10px;
  margin-bottom: 8px;
}

.kws-spawn-checkbox {
  display: flex;
  align-items: center;
  gap: 5px;
}

.kws-spawn-label {
  font-size: 11px;
  color: white;
  cursor: pointer;
}

.kws-spawn-label:hover {
  color: orange;
}

.kws-pa-input {
  width: 100%;
  background: #040e13;
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 3px;
  padding: 6px 8px;
  margin-top: 8px;
  text-align: center;
  font-family: 'Play', sans-serif;
  font-size: 12px;
  box-sizing: border-box;
}

.kws-pa-input::placeholder {
  color: #666;
}

/* Footer */
.kws-sidebar-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.2);
  font-size: 11px;
}

.kws-version {
  color: #888;
}

.kws-latency {
  font-weight: bold;
  cursor: pointer;
}

/* Latency colors */
.kws-latency.latency-good { color: lime; }
.kws-latency.latency-ok { color: yellow; }
.kws-latency.latency-bad { color: orange; }
.kws-latency.latency-critical { color: red; }

/* ============================================
   RESPONSIVE - Mobile
   ============================================ */

@media (max-width: 1024px) {
  #kws_sidebar {
    width: 180px;
    font-size: 11px;
  }

  .kws-sidebar-header {
    width: 180px;
  }

  .kws-stat-label,
  .kws-stat-value {
    font-size: 10px;
    padding: 2px 3px;
  }

  .kws-spawn-label {
    font-size: 10px;
  }
}

@media (max-width: 768px) {
  #kws_sidebar {
    top: 80px;
    width: 160px;
  }

  #kws_sidebar.kws-collapsed {
    left: -155px;
  }

  .kws-sidebar-header {
    width: 160px;
  }
}

/* ============================================
   LEGACY CLEANUP - Hide old elements
   ============================================ */

.kws_top_bar,
.kws_additional_top_bar,
#kws_spawn {
  display: none !important;
}
`;

    // ============================================
    // MAIN BOT CLASS
    // ============================================
    class Gieniobot {
      constructor(charactersManager) {
        console.log('[Gieniobot] Constructor starting...');
        this.charactersManager = charactersManager;
        this.isLogged((data) => {
          Object.defineProperty(GAME, 'pid', {
            writable: false
          });
          Object.defineProperty(GAME, 'login', {
            writable: false
          });
        });
        this.isCheckingTournaments = false;
        this.tournamentCategory = undefined;
        this.newTournamentID = undefined;
        this.tourSigned = false;
        this.firstTournamentPageLoaded = false;
        this.settings = this.getSettings();
        this.createCSS();
        this.createMinimapSettings();
        if ($("#top_bar .adv").length) $("#top_bar .adv").remove();
        this.sortClanPlanets();
        this.loadRiddles((data) => {
          this.riddles = data;
        });
        this.addToCSS(`.kom {background: url(/gfx/layout/tloPilot.png); background-size: cover; border-image: url(/gfx/layout/mapborder.png) 7 8 7 7 fill; border-style: solid; border-width: 7px 8px 7px 7px; box-shadow: none;}.kom .close_kom b {background: url(/gfx/layout/tloPilot.png);}.exchange_win {overflow-y: auto;overflow-x: hidden;padding-right: 10px;box-sizing: border-box;}.exchange_win::-webkit-scrollbar {width: 13px;}.exchange_win::-webkit-scrollbar-track {background: #f0f0f0;border-radius: 10px;}.exchange_win::-webkit-scrollbar-thumb {background: #c0c0c0;border-radius: 10px;border: 2px solid transparent;background-clip: content-box;}.exchange_win {scrollbar-width: thin;scrollbar-color: #c0c0c0 #f0f0f0;}`);
        this.addToCSS(`#emp_list .petopt_btns .newBtn{margin:0px 3px 3px 0px;} .newBtn.do_all_instances{color:#e5d029;}`);
        this.addToCSS(`#quick_bar{z-index:4;} .sideIcons{ width:29px; height:29px; left:-37px; background-size:contain; border-radius:5px; border: 2px solid transparent; } .sideIcons:hover{border-color: #3fc1c9; box-shadow: 0 0 8px 2px #3fc1c9;} .qlink.kws_active_icon{animation-name:kws_active_icon;animation-duration:2s;animation-iteration-count:infinite;}@keyframes kws_active_icon { 0% { box-shadow: 0 0 8px 2px #3fc1c9; border-color: #3fc1c9; } 50% { box-shadow: 0 0 8px 2px #f9ca24; border-color: #f9ca24; } 100% { box-shadow: 0 0 8px 2px #3fc1c9; border-color: #3fc1c9; } } .autoExpeCodes{background:#12121294; border:1px solid rgb(87, 87, 114); border-radius:5px 0px 0px 5px; position:absolute; top:-100px; left:-97px; padding:5px; display:none; color:#ffe500c7; user-select:none;} .manage_autoExpeditions:hover + .autoExpeCodes, .autoExpeCodes:hover{ display:flex; } .autoExpeCodes .newCheckbox{margin: 0 auto; display: block;} .autoArenaBuff{background:#12121294; border:1px solid rgb(87, 87, 114); border-radius:5px 0px 0px 5px; position:absolute; top:-104px; left:-125px; padding:5px; display:none; color:#ffe500c7; user-select:none;} .manage_auto_arena:hover ~ .autoArenaBuff, .autoArenaBuff:hover{ display:flex; } .autoArenaBuff .newCheckbox{margin: 0 auto; display: block;} `);
        this.addToCSS(`.kws_active_button{animation-name:kws_active_button;animation-duration:2s;animation-iteration-count:infinite;}@keyframes kws_active_button { 0% { box-shadow: 0 0 8px 2px #3fc1c9; border-color: #3fc1c9; } 50% { box-shadow: 0 0 8px 2px #f9ca24; border-color: #f9ca24; } 100% { box-shadow: 0 0 8px 2px #3fc1c9; border-color: #3fc1c9; } }`)
        this.addToCSS(`.manage_auto_clanAssist{border-radius:5px; border: 2px solid transparent;} .manage_auto_clanAssist:hover{border-color: #3fc1c9; box-shadow: 0 0 8px 2px #3fc1c9;}`);
        this.addToCSS(`.manage_kukla_guardian{border-radius:5px; border: 2px solid transparent;} .manage_kukla_guardian:hover{border-color: #3fc1c9; box-shadow: 0 0 8px 2px #3fc1c9;}`);
        this.addToCSS(`#secondary_char_stats .instance{margin-top:10px; cursor:pointer; width:100px;} #secondary_char_stats .activities{margin-top:-5px; cursor:pointer; width:100px;} #secondary_char_stats ul {margin-top:-18px; margin-left:-18px;} .ico.a11{background:url("${getGieniobotUrl('images/instances.png')}"); background-repeat: no-repeat; background-size: inherit; background-position: center;} .ico.a12{background-image: url(${getGieniobotUrl('images/activity.png')}); background-repeat: no-repeat; background-size: inherit; background-position: center;}`);
        this.addToCSS(`.ssj_uio{background:url("https://i.imgur.com/EcfEUcG.png");}`);
        this.addToCSS(`#quick_allTransformations { position:absolute; top:33px; z-index:1; background:rgb(0 0 0 / 59%); display:none; flex-direction: column-reverse; padding:5px 5px 0px 5px; border-radius:5px; box-shadow:0px 0px 5px 0px rgb(32 96 185);} .show_qat:hover + #quick_allTransformations, #quick_allTransformations:hover { display:flex; } #quick_allTransformations .option { display:block; margin:0px 0px 5px 0px; }`);
        this.addToCSS(`#player_list_con .glory_rank.war{animation:none !important;background-color:rgb(22 83 106);box-shadow:0px 0px 7px 0px rgb(0 253 255);} .player_clan.enemy img{animation:none !important;box-shadow:0px 0px 10px 1px rgb(0 253 255);}`);
        this.addToCSS(`.better_chat_loading{filter:sepia(1) hue-rotate(270deg);} .better_chat_loading:hover{filter:sepia(1) hue-rotate(90deg);} .chat_icon.load:hover{background:url(/gfx/layout/ikonyChat.png) -90px 0px !important;}`);
        this.addToCSS(`#upg_menu button[data-page="game_buffs"]{display:block !important;}`);
        this.addToCSS(`.qtrack{width:400px;} #drag_con.scroll .qtrack{width:383px;} #quest_track_con #drag_tracker{user-select:none;} #quest_track_con .sep2{height:14px;} #quest_track_con .sep3{height:14px;}`);
        this.addToCSS(`.option.ls.spawner{ position:absolute; top:60px; right:40px; background-size: 100% 100%; border: solid #6f6f6f 1px; }`);
        this.addToCSS(`#kws_minimap_settings{ margin:10px 0px 0px 0px; border-top:solid white 1px; padding-top:10px; } #field_sett #field_options{ height:407px; } #minimap_con{ ${this.minimap.side == 1 ? `left: -4px; right: unset;` : this.minimap.side == 2 ? `left: -210px; right: unset;` : ""} opacity: ${this.minimap.opacity / 100} } #minimap_range{ width:150px; display:inline-block; vertical-align:middle;} .smin_butt{background: #31313a69 !important; border: solid #ffffff4d 1px !important; width:auto !important; height:32px !important; line-height: 30px; display: inline-block; text-align: center; font-family: 'Play', sans-serif; font-size: 13px; font-weight: Bold; color: #fff; text-decoration: none; text-transform: uppercase; border: none; padding: 0 10px; border-radius: 5px; cursor: pointer; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; margin-top:2px; float:none !important;} .smin_input{background: #040e13; height: 31px; border: solid #ffffff4d 1px !important; display: inline-block; text-align:center; font-size: 13px; color: #305779; font-family: 'Play', sans-serif; vertical-align: middle;border-radius: 5px;}`);
        this.addToCSS(`#kws_locInfo{background:url("/gfx/layout/tloPilot.png");position: absolute;top: 220px;z-index: 2;width: 204px;padding: 5px;border-radius: 5px;border-image: url(/gfx/layout/mapborder.png) 7 8 7 7 fill;border-style: solid;border-width: 7px 8px 7px 7px; display:${this.minimap.loc_info == 0 ? `none` : `block`}} #kws_locInfo .sekcja{position:absolute;top:-20px;left:0px;background:url("https://i.imgur.com/Mi3kUpg.png");background-size:100% 100%;width:190px;}`);
        this.addToCSS(`.go_to_emp_con{ position:absolute; top:33px; z-index:1; background:rgb(0 0 0 / 59%); display:none; flex-direction: column-reverse; padding:5px 5px 0px 5px; border-radius:5px; box-shadow:0px 0px 5px 0px rgb(32 96 185);} .empPos:hover + .go_to_emp_con, .go_to_emp_con:hover { display:flex; } .go_to_emp_con .qlink { display:block; margin:0px 0px 5px 0px; }`);
        this.addToCSS(`#ekw_sets_buy button, div[data-option="change_ekw_set"]{height:20px !important; line-height:19px !important; margin-top:9px !important;}`);
        this.addToCSS(`#page_game_camp .ekw_slot.smaller img{ width: 64px; } #page_game_camp div[data-item_id="1923"].smaller img { width: 32px; position: absolute; margin-top: -64px; margin-left: 34px; }`);

        // NEW UNIFIED SIDEBAR (replaces old kws_top_bar + kws_spawn)
        this.addToCSS(SIDEBAR_CSS);
        $("#game_win").append(this.buildSidebarHTML());
        this.initSidebarHandlers();

        this.addToCSS(`#sc_set_select{background:#040e13;color:#fff;font-family:'Play',sans-serif;font-size:13px;padding:3px 8px;border:1px solid white;border-radius:5px;margin:3px 25px 0 0;cursor:pointer;height:24px;float:right;} #sc_set_select:hover{border-color:orange;} #sc_set_select option{background:#040e13;color:#fff;}`);
        this.addToCSS(`#kws_bg_preset_select{background:#040e13;color:#fff;font-family:'Play',sans-serif;font-size:13px;padding:3px 8px;border:1px solid #305779;border-radius:5px;cursor:pointer;} #kws_bg_preset_select:hover{border-color:orange;} #kws_bg_preset_select option{background:#040e13;color:#fff;}`);
        this.addToCSS(`#sc_sets .sc_sets_all { min-width: 40px; width: auto; padding: 0 5px; } .cards_set_name_input { background: #040e13; height: 31px; width: 180px; border: solid #ffffff4d 1px; display: inline-block; text-align: center; font-size: 13px; color: #305779; font-family: 'Play', sans-serif; vertical-align: middle; border-radius: 5px; margin-right: 5px; } .cards_set_name_button { margin-top: 2px; }`);
        this.addToCSS(`.quest_roll1{position:absolute; width:50px; height:50px; background:url('/gfx/layout/dice.png') 0 0; top:-25px; left:25px; cursor:pointer; filter:drop-shadow(0px 0px 10px lime)} .quest_roll2{position:absolute; width:50px; height:50px; background:url('/gfx/layout/dice.png') 0 0; top:-25px; left:75px; cursor:pointer; filter:drop-shadow(0px 0px 10px #00fdff)} .quest_roll3{position:absolute; width:50px; height:50px; background:url('/gfx/layout/dice.png') 0 0; top:-25px; left:125px; cursor:pointer; filter:drop-shadow(0px 0px 10px #ff0000)} .quest_roll:hover{background:url('/gfx/layout/dice.png') 0 -45px;} .quest_roll1:hover{background:url('/gfx/layout/dice.png') 0 -45px;} .quest_roll2:hover{background:url('/gfx/layout/dice.png') 0 -45px;} .quest_roll3:hover{background:url('/gfx/layout/dice.png') 0 -45px;}`);
        this.addToCSS(`#lastmap_bar { top: 115px !important; }`);
        this.addToCSS(`.MoveIcon .pi.kws_pvp{background:url('https://i.imgur.com/QPQBcFp.png') center/contain no-repeat;} .MoveIcon .pi.kws_skip{background:url('https://i.imgur.com/wuK91VF.png') center/contain no-repeat;} .MoveIcon .pi.kws_clock{background:url('https://i.imgur.com/9YCvJKe.png') center/contain no-repeat;} .MoveIcon .pi.kws_alt{background:url('https://up.be3.ovh/upload/1709400449.png') center/contain no-repeat;}`);
        this.addToCSS(`button#changeProfileNext { position: absolute; top: 85px; right: 16px; background: linear-gradient(0deg, rgba(252,238,54,1) 0%, rgba(247,121,12,1) 100%); border: 2px solid #973804; border-radius: 5px; width: 52px; }`);
        this.addToCSS(`button#changeProfileNext:hover {
                    background: linear-gradient(0deg, rgba(247,121,12,1) 0%, rgba(252,238,54,1) 100%);
                    border: 0px solid #973804;
                }`);
        this.addToCSS(`button#changeProfilePrev { position: absolute; top: 85px; right: 75px; background: linear-gradient(0deg, rgba(252,238,54,1) 0%, rgba(247,121,12,1) 100%); border: 2px solid #973804; border-radius: 5px; width: 52px; }`);
        this.addToCSS(`button#changeProfilePrev:hover {
                    background: linear-gradient(0deg, rgba(247,121,12,1) 0%, rgba(252,238,54,1) 100%);
                    border: 0px solid #973804;
                }`);
        $("#bless_type_2").click();
        $(`.channel_opts .option.chat_icon.load`).addClass('better_chat_loading').removeAttr('id').removeAttr('data-option');
        $("#clan_inner_planets h3").eq(0).append(`<button id="poka_telep" style="margin-left:5px;" class="newBtn">pokaż / ukryj salę telep</button>`);
        $(`<button class="newBtn free_assist_for_all" style="margin-right:5px;">Asystuj wszystkim za darmo</button>`).insertBefore(`button[data-option="clan_assist_all"]`);
        $(`<button class="gold_button auto_bless">AUTOMAT</button>`).insertBefore(`button[data-option="grant_buff"]`);
        $(`<button class="gold_button auto_know">AUTOMATY</button>`).insertBefore('button[data-option="show_know2"]');
        $("#clan_inner_wars h3").eq(0).append(` <button class="newBtn activate_all_clan_buffs">Aktywuj wszystkie buffy</button>`);
        // Soul card sets dropdown - in top_bar, float right (where old sc_setss was)
        $("#top_bar").append(`<select id="sc_set_select"><option value="">-- Zestaw kart --</option></select>`);
        // Populate dropdown when module loads
        let scSetAttempts = 0;
        let scSetPopulateInterval = setInterval(() => {
          if (++scSetAttempts > 300) { clearInterval(scSetPopulateInterval); return; }
          if (typeof AFO_SOUL_CARD_SETS !== 'undefined') {
            clearInterval(scSetPopulateInterval);
            const select = $('#sc_set_select');
            AFO_SOUL_CARD_SETS.getSetNames().forEach(name => {
              select.append(`<option value="${name}">${name}</option>`);
            });
            // Restore saved set when char_data is available
            let restoreAttempts = 0;
            let restoreInterval = setInterval(() => {
              if (++restoreAttempts > 150) { clearInterval(restoreInterval); return; }
              if (GAME.char_data?.id) {
                clearInterval(restoreInterval);
                const savedSet = AFO_SOUL_CARD_SETS.loadCurrentSet();
                if (savedSet && AFO_SOUL_CARD_SETS.sets[savedSet] !== undefined) {
                  select.val(savedSet);
                }
              }
            }, 200);
          }
        }, 100);
        $(`#minimap_con`).append(`<div id="kws_locInfo"><div class="sekcja">INFORMACJE O LOKACJI</div><div class="content"></div></div>`);
        $("#sett_page_local div").eq(0).prepend(`<b class=\"green\">Zmień tło strony </b><div class=\"game_input\"><input id=\"new_website_bg\" style=\"width:370px;\" type=\"text\" placeholder=\"Wklej URL obrazka...\"></div><button class=\"option newBtn kws_change_website_bg\" style=\"margin-left:5px;\">Zmień</button><button class=\"option newBtn kws_reset_website_bg\" style=\"margin-left:5px;\">Reset</button><br><b class=\"green\" style=\"margin-top:5px;display:inline-block;\">lub wybierz z listy: </b><select id=\"kws_bg_preset_select\" class=\"select_input\" style=\"margin-left:5px;min-width:200px;\"></select><br><br>`);
        $('.MoveIcon[data-option="mob_spawner_go"]').after('<div class="MoveIcon bigg option" data-option="map_multi_pvp" data-toggle="tooltip" data-original-title="<div class=tt>Multiwalka PvP<br />Klawisz skrótu:<b class=orange>B</b></div>"><i class="pi kws_pvp"></i></div>');
        $('.MoveIcon[data-option="map_multi_pvp"]').after('<div class="MoveIcon bigg option" data-option="map_quest_skip" data-toggle="tooltip" data-original-title="<div class=tt>Opcja Dalej w otwartym zadaniu jeśli jest jedna. Atakuje bosy w zadaniach i zamyka raport z walki. W zadaniu nuda wybiera opcję na zabicie mobków. W zadaniu subki wybiera opcję za 100k. Zamyka komunikaty. Zbiera zasób na którym stoimy.<br />Klawisz skrótu:<b class=orange>X</b></div>"><i class="pi kws_skip"></i></div>');
        $('.MoveIcon[data-option="map_quest_skip"]').after('<div class="MoveIcon bigg option" data-option="map_quest_skip_time" data-toggle="tooltip" data-original-title="<div class=tt>Używanie zegarków w zadaniach<br />Klawisz skrótu:<b class=orange>N</b></div>"><i class="pi kws_clock"></i></div>');
        $('.MoveIcon[data-option="map_quest_skip_time"]').after('<div class="MoveIcon bigg option" data-option="map_alternative_pilot" data-toggle="tooltip" data-original-title="<div class=tt>Ukryje pilota, pokazuje inną klawiaturę<br />Klawisz skrótu:<b class=orange>=</b></div>"><i class="pi kws_alt"></i></div>');
        $("#changeProfile").before('<button id="changeProfilePrev" class="btn_small_gold" data-option="prevChar">Prev</button>');
        $("#changeProfile").after('<button id="changeProfileNext" class="btn_small_gold" data-option="nextChar">Next</button>');
        this.auto_abyss_interval = false;
        this.auto_arena = false;
        this.additionalTopBarVisible = false;
        this.baselinePower = undefined;
        this.baselineLevel = undefined;
        // Store interval ID to prevent memory leak
        this.topBarUpdateInterval = setInterval(() => {
          if ('char_data' in GAME) {
            this.updateTopBar();
          }
        }, 5000);
        this.setWebsiteBackground();

        // Bind click handlers (internal + external module)
        this.bindClickHandlers();
        if (typeof bindAllClickHandlers === 'function') {
          bindAllClickHandlers(this);
        }
        if (!this._socketBound) {
          this._socketBound = true;
          GAME.socket.on('gr', (res) => {
            this.handleSockets(res);
          });
        }

        // Global cleanup on page unload to prevent memory leaks
        window.addEventListener('beforeunload', () => {
          // Clear Gieniobot intervals
          if (this.topBarUpdateInterval) {
            clearInterval(this.topBarUpdateInterval);
          }

          // Clear AFO module intervals
          if (typeof AFO_RECONNECT !== 'undefined' && AFO_RECONNECT.stopDisconnectMonitor) {
            AFO_RECONNECT.stopDisconnectMonitor();
          }

          // Clear AFO_DAILY timeouts
          if (typeof AFO_DAILY !== 'undefined' && AFO_DAILY.clearAllTimeouts) {
            AFO_DAILY.clearAllTimeouts();
          }

          console.log('[Gieniobot] Cleanup on beforeunload');
        });
      }
      isLogged(cb) {
        let waitAttempts = 0;
        let waitForID = setInterval(() => {
          if (++waitAttempts > 150) { clearInterval(waitForID); return; }
          if (GAME.pid) {
            clearInterval(waitForID);
            cb(GAME.pid);
          }
        }, 200);
      }
      loadRiddles(cb) {
        fetch(getGieniobotUrl('remote/data/riddles.json')).then(res => res.json()).then((out) => {
          cb(out)
        }).catch(err => {
          console.warn('[Gieniobot] Failed to load riddles:', err);
        });
      }
      solveRiddle(r_id) {
        let riddle = this.riddles.find((r) => r.id == r_id);
        if (riddle) {
          $("input[id=quest_riddle]").val(riddle.answer);
        } else {
          console.log('riddle id: ', r_id)
        }
      }
      getSettings() {
        let settings = JSON.parse(localStorage.getItem("kws_settings"));
        let settings_sample = {
          hide_tracker: false,
          aeCodes: false,
          sets: {}
        };
        if (settings) {
          for (const key of Object.keys(settings_sample)) {
            if (settings[key] === undefined) {
              settings[key] = settings_sample[key];
            }
          }
          localStorage.setItem("kws_settings", JSON.stringify(settings));
          return settings;
        } else {
          localStorage.setItem("kws_settings", JSON.stringify(settings_sample));
          return settings_sample;
        }
      }
      updateSettings() {
        localStorage.setItem('kws_settings', JSON.stringify(this.settings));
      }
      // Card set name methods removed - replaced by AFO_SOUL_CARD_SETS
      goEmpPos() {
        let imp_pos = $(".empPos").position();
        $(".go_to_emp_con").css("left", imp_pos.left - 5);
      }
      listQts() {
        let trans = this.parseSSJqts(GAME.char_data.race);
        let html = ``;
        for (let i = 0; i < trans.length && trans[i][0] !== GAME.quick_opts.ssj[0]; i++) {
          html += `<div class="option qlink ${trans[i][1]}" data-option="use_transform" data-tech="${trans[i][0]}"></div>`;
        }
        if ($(".show_qat").length) {
          let ssj_pos = $(".show_qat").position();
          $("#quick_allTransformations").css("left", ssj_pos.left - 5);
        }
        $("#quick_allTransformations").html(html);
        option_bind();
      }
      parseSSJqts(race) {
        switch (race) {
          case 0:
            return [
              [19, "ssj1"],
              [25, "ssj2"],
              [26, "ssj3"],
              [30, "ssj4"],
              [39, "ssj5"],
              [72, "ssja"],
              [81, "ssjb"],
              [116, "ssj_uio"]
            ];
          case 1:
            return [
              [46, "ssj1"],
              [50, "ssj2"],
              [53, "ssj3"],
              [55, "ssj4"],
              [39, "ssj5"],
              [72, "ssja"],
              [81, "ssjb"],
              [116, "ssj_uio"]
            ];
          case 2:
            return [
              [63, "ssj1"],
              [64, "ssj2"],
              [66, "ssjm"],
              [39, "ssj5"],
              [72, "ssja"],
              [81, "ssjb"],
              [116, "ssj_uio"]
            ];
          case 3:
            return [
              [78, "ssj1"],
              [76, "ssj2"],
              [79, "ssj3"],
              [39, "ssj5"],
              [72, "ssja"],
              [81, "ssjb"],
              [116, "ssj_uio"]
            ];
          case 4:
            return [
              [92, "ssj1"],
              [93, "ssj2"],
              [99, "ssj3"],
              [100, "ssj4"],
              [39, "ssj5"],
              [72, "ssja"],
              [81, "ssjb"],
              [116, "ssj_uio"]
            ];
          case 5:
            return [
              [101, "ssj1"],
              [102, "ssj2"],
              [103, "ssj3"],
              [110, "ssj4"],
              [39, "ssj5"],
              [72, "ssja"],
              [81, "ssjb"],
              [116, "ssj_uio"]
            ];
          case 6:
            return [
              [121, "ssj1"],
              [122, "ssj2"],
              [123, "ssj3"],
              [124, "ssj4"],
              [39, "ssj5"],
              [72, "ssja"],
              [81, "ssjb"],
              [116, "ssj_uio"]
            ];
          case 7:
            return [
              [127, "ssj1"],
              [128, "ssj2"],
              [129, "ssj3"],
              [132, "ssj4"],
              [39, "ssj5"],
              [72, "ssja"],
              [81, "ssjb"],
              [116, "ssj_uio"]
            ];
          default:
            return [];
        }
      }

      // Automation methods are now in handlers/automation.js

      // Clan methods (freeAssist, autobless, activateAllClanBuffs) 
      // are now in handlers/clan.js

      findWorker(worker, cb) {
        let workerAttempts = 0;
        let waitForWorker = setInterval(() => {
          if (++workerAttempts > 300) { clearInterval(waitForWorker); return; }
          let el = $(`button[data-emp="${worker.id}"]button[data-option="emp_job"]`);
          let emp_local = parseInt(el.attr("data-emp_local"));
          if (el.length) {
            this.workers_info[emp_local] = worker;
            clearInterval(waitForWorker);
            cb(el);
          }
        }, 100);
      }
      doAllInstances(worker, page2 = false) {
        let worker_info = this.workers_info[worker.local];
        let instance_number = this.instanceNumber();
        let kom = $(".kom").text();
        if (instance_number) {
          if (kom.includes("magicznych esencji") || kom.includes("Magicznych Esencji")) { } else if (worker_info.energy > 0) {
            GAME.socket.emit('ga', {
              a: 44,
              type: 8,
              emp: worker.id,
              inst: instance_number
            });
            setTimeout(() => {
              this.doAllInstances(worker)
            }, 250);
          } else if (worker_info.energy == 0) {
            GAME.socket.emit('ga', {
              a: 44,
              type: 9,
              emp: worker_info.id
            });
            setTimeout(() => {
              this.doAllInstances(worker)
            }, 250);
          }
        } else {
          GAME.komunikat("Wszystkie instancje zostały wykonane!");
        }
      }
      instanceNumber() {
        if (GAME.char_data.icd_1 < 2) {
          return 1;
        } else if (GAME.char_data.icd_2 < 2) {
          return 2;
        } else if (GAME.char_data.icd_3 < 2) {
          return 3;
        } else if (GAME.char_data.icd_4 < 2) {
          return 4;
        } else if (GAME.char_data.icd_5 < 2) {
          return 5;
        } else if (GAME.char_data.icd_6 < 2) {
          return 6;
        } else {
          return false;
        }
      }

      // Settings methods (createMinimapSettings, manageMinimapSettings, setWebsiteBackground,
      // manageWebsiteBackground, changeMapSize, manageMapSize, managePilot)
      // are now in handlers/settings.js

      sortClanPlanets() {
        let x = 72;
        let y = -11;
        let pl_sup = 1;
        let pl_sup_css = `#clan_planets.galactic{height:650px !important; width:658px !important;} #clan_planets_simple .tablen1{min-width:295px;}`;
        for (let i = 1; i <= 20; i++) {
          pl_sup_css += `.planet_pos.pos_${i}{left:${x}px !important; top:${y}px !important;}`;
          x += 220;
          y -= 50;
          if (pl_sup >= 3) {
            x = 72;
            y += 90;
            pl_sup = 0;
          }
          pl_sup++;
        }
        this.addToCSS(pl_sup_css);
      }
      getTitlesList(cb) {
        GAME.socket.emit('ga', {
          a: 42,
          type: 9
        });
        JQS.ldr.finish().fadeIn();
        let titleAttempts = 0;
        let wait_for_titles = setInterval(() => {
          if (++titleAttempts > 300) { clearInterval(wait_for_titles); return; }
          let html = $("#char_titles").html();
          if (html.length) {
            clearInterval(wait_for_titles);
            cb(html);
          }
        }, 100);
      }

      // UI methods (updateTopBar, collectActivities, markDaily) 
      // are now in handlers/ui.js

      // Empire methods (wojny2, check_imp, check_imp2)
      // are now in handlers/empire.js

      // Combat methods (vip, bless, questProceed, pvpKill, useCompressor)
      // are now in handlers/combat.js

      arena_count() {
        arena_count++;
        $(".kws_top_bar_section.arena").html(`ARENA: ${arena_count}`);
      }
      pvp_count() {
        pvp_count++;
        $(".kws_top_bar_section.pvp").html(`PVP: ${pvp_count}`);
      }
      check_act() {
        let recived = $("#act_prizes").find("div.act_prize.disabled").length;
        let points = $('#char_activity').text();
        if (points >= 25 && recived < 1) {
          return true;
        } else if (points >= 50 && recived < 2) {
          return true;
        } else if (points >= 75 && recived < 3) {
          return true;
        } else if (points >= 100 && recived < 4) {
          return true;
        } else if (points >= 150 && recived < 5) {
          return true;
        } else {
          return false;
        }
      }
      /**
       * Build unified sidebar HTML (replaces old kws_top_bar + kws_spawn)
       */
      buildSidebarHTML() {
        // Generate spawn checkboxes (grid 2x3)
        // Layout: left column (Normal, Champion, Elita), right column (Legend, Epicki, Mist.)
        const ranks = ['Normal', 'Champion', 'Elita', 'Legenda', 'Epicki', 'Mistyk'];
        const order = [0, 3, 1, 4, 2, 5]; // Normal/Legend, Champion/Epicki, Elita/Mist.
        let spawnCheckboxes = '';
        for (const i of order) {
          const checked = (GAME.spawner && GAME.spawner[1][i]) ? 'checked' : '';
          spawnCheckboxes += `
            <div class="kws-spawn-checkbox">
              <div class="newCheckbox">
                <input id="kws_spawner_ignore_${i}" type="checkbox"
                       class="kws_spawner_check" value="${i}" ${checked} />
                <label for="kws_spawner_ignore_${i}"></label>
              </div>
              <label for="kws_spawner_ignore_${i}" class="kws-spawn-label">${ranks[i]}</label>
            </div>`;
        }

        return `
          <div id="kws_sidebar" class="kws-sidebar">
            <div class="kws-sidebar-header">
              <img src="/gfx/layout/war.png" class="kws-sidebar-toggle">
              <span>GIENIOBOT</span>
            </div>

            <div class="kws-sidebar-content">

              <!-- STATUS Section -->
              <div class="kws-sidebar-section">
                <div class="kws-sidebar-section-title">STATUS</div>
                <table class="kws-stats-table">
                  <tr class="kws-stat-row sk_info" data-page="game_balls">
                    <td class="kws-stat-label">SK</td>
                    <td class="kws-stat-value" id="kws-stat-sk">--</td>
                  </tr>
                  <tr class="kws-stat-row train_upgr_info" data-page="game_train">
                    <td class="kws-stat-label">KODY</td>
                    <td class="kws-stat-value" id="kws-stat-kody">--</td>
                  </tr>
                  <tr class="kws-stat-row">
                    <td class="kws-stat-label">LVL/H</td>
                    <td class="kws-stat-value" id="kws-stat-lvlh">--</td>
                  </tr>
                  <tr class="kws-stat-row">
                    <td class="kws-stat-label">PVP</td>
                    <td class="kws-stat-value" id="kws-stat-pvp">--</td>
                  </tr>
                  <tr class="kws-stat-row" data-page="game_arena">
                    <td class="kws-stat-label">ARENA</td>
                    <td class="kws-stat-value" id="kws-stat-arena">--</td>
                  </tr>
                  <tr class="kws-stat-row trader_info" data-page="game_events" style="display:none;">
                    <td class="kws-stat-label">HANDLARZ</td>
                    <td class="kws-stat-value">✓</td>
                  </tr>
                </table>
              </div>

              <!-- DODATKOWE Section (expandable) -->
              <div class="kws-sidebar-section">
                <div class="kws-sidebar-section-title kws-expandable" id="kws-toggle-additional">
                  <span class="kws-expand-icon">▶</span> DODATKOWE
                </div>
                <div class="kws-additional-content" style="display:none;">
                  <table class="kws-stats-table">
                    <tr><td class="kws-stat-label">MOC</td>
                        <td class="kws-stat-value" id="kws-stat-power">--</td></tr>
                    <tr><td class="kws-stat-label" style="font-size:10px;">FUTURE</td>
                        <td class="kws-stat-value" id="kws-stat-future" style="font-size:10px;">--</td></tr>
                    <tr><td class="kws-stat-label">LVL</td>
                        <td class="kws-stat-value" id="kws-stat-lvl-gained">--</td></tr>
                    <tr><td class="kws-stat-label">PSK</td>
                        <td class="kws-stat-value" id="kws-stat-psk">--</td></tr>
                  </table>
                  <button class="kws-reset-btn" id="kws-reset-stats">RESET</button>
                </div>
              </div>

              <!-- SPAWN Section (expandable, default open) -->
              <div class="kws-sidebar-section">
                <div class="kws-sidebar-section-title kws-expandable" id="kws-toggle-spawn">
                  <span class="kws-expand-icon expanded">▶</span> SPAWN
                </div>
                <div class="kws-spawn-content">
                  <div class="kws-spawn-grid">${spawnCheckboxes}</div>
                  <input id="kws_pa_max" class="kws-pa-input" type="text" placeholder="Max PA" value="${GAME.spawner?.[0] || 1000}" />
                </div>
              </div>

              <!-- Footer -->
              <div class="kws-sidebar-footer">
                <span class="kws-version">v<span id="kws-version-text">${version}</span></span>
                <span class="kws-latency" id="kws-latency">⇅ --</span>
              </div>

            </div>
          </div>`;
      }

      /**
       * Initialize sidebar event handlers
       */
      initSidebarHandlers() {
        // Restore saved state from localStorage
        const sidebarState = {
          collapsed: localStorage.getItem('kws_sidebar_collapsed') === 'true',
          additionalExpanded: localStorage.getItem('kws_sidebar_additional_expanded') === 'true',
          spawnExpanded: localStorage.getItem('kws_sidebar_spawn_expanded') !== 'false', // default true
        };

        if (sidebarState.collapsed) {
          $('#kws_sidebar').addClass('kws-collapsed');
          $('.kws-sidebar-toggle').addClass('rotated');
        }
        if (sidebarState.additionalExpanded) {
          $('#kws-toggle-additional .kws-expand-icon').addClass('expanded');
          $('.kws-additional-content').show();
        }
        // SPAWN: default open, hide only if explicitly set to false
        if (!sidebarState.spawnExpanded) {
          $('#kws-toggle-spawn .kws-expand-icon').removeClass('expanded');
          $('.kws-spawn-content').hide();
        }

        // ============================================
        // UNIFIED: Vertical drag + collapse toggle (with threshold)
        // ============================================
        const sidebar = document.getElementById('kws_sidebar');
        const header = document.querySelector('.kws-sidebar-header');
        const DRAG_THRESHOLD = 5;

        // Restore saved Y position
        const savedTop = localStorage.getItem('kws_sidebar_top');
        if (savedTop) {
          sidebar.style.top = savedTop + 'px';
        }

        let isDragging = false;
        let hasMoved = false;
        let startY = 0, startTop = 0;

        const getY = (e) => e.touches?.[0]?.clientY ?? e.clientY;

        const onStart = (e) => {
          isDragging = true;
          hasMoved = false;
          startY = getY(e);
          startTop = sidebar.getBoundingClientRect().top;
        };

        const onMove = (e) => {
          if (!isDragging) return;

          // Don't allow drag when collapsed
          if (sidebar.classList.contains('kws-collapsed')) return;

          const deltaY = getY(e) - startY;

          // Only start actual drag after threshold
          if (Math.abs(deltaY) > DRAG_THRESHOLD) {
            hasMoved = true;
            e.preventDefault();
            sidebar.style.transition = 'none';
            const newTop = Math.max(0, Math.min(window.innerHeight - 100, startTop + deltaY));
            sidebar.style.top = newTop + 'px';
          }
        };

        const onEnd = () => {
          if (!isDragging) return;
          isDragging = false;

          if (hasMoved) {
            // Was a drag - save position
            sidebar.style.transition = '';
            localStorage.setItem('kws_sidebar_top', parseInt(sidebar.style.top));
          } else {
            // Was a click - toggle collapse
            sidebar.classList.toggle('kws-collapsed');
            document.querySelector('.kws-sidebar-toggle').classList.toggle('rotated');
            const isCollapsed = sidebar.classList.contains('kws-collapsed');
            localStorage.setItem('kws_sidebar_collapsed', isCollapsed.toString());
          }

          hasMoved = false;
        };

        // Mouse events
        header.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);

        // Touch events
        header.addEventListener('touchstart', onStart, { passive: true });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);

        // Expandable sections
        $('#kws-toggle-additional').on('click', function () {
          $(this).find('.kws-expand-icon').toggleClass('expanded');
          $('.kws-additional-content').slideToggle(200);
          const isExpanded = $(this).find('.kws-expand-icon').hasClass('expanded');
          localStorage.setItem('kws_sidebar_additional_expanded', isExpanded.toString());
        });

        $('#kws-toggle-spawn').on('click', function () {
          $(this).find('.kws-expand-icon').toggleClass('expanded');
          $('.kws-spawn-content').slideToggle(200);
          const isExpanded = $(this).find('.kws-expand-icon').hasClass('expanded');
          localStorage.setItem('kws_sidebar_spawn_expanded', isExpanded.toString());
        });

        // Stat row clicks (navigate to pages)
        $('.kws-stat-row[data-page]').on('click', function () {
          const page = $(this).data('page');
          if (page) GAME.page_switch(page);
        });

        // Reset button
        $('#kws-reset-stats').on('click', () => {
          this.resetCalculatedPower();
        });

        // Spawn checkboxes
        $('.kws_spawner_check').on('change', () => {
          // Initialize array with 0s
          const newSpawner = [0, 0, 0, 0, 0, 0];
          // Set values based on checkbox value attribute (rank index)
          $('.kws_spawner_check').each((_, el) => {
            const rankIndex = parseInt(el.value, 10);
            newSpawner[rankIndex] = el.checked ? 1 : 0;
          });
          GAME.spawner[1] = newSpawner;
        });

        // PA input
        $('#kws_pa_max').on('change', (e) => {
          this.updatePaToSpawn($(e.target).val());
        });
      }

      // Legacy method - kept for backward compatibility but no longer used in UI
      spawnList() {
        let mob = "";
        for (var i = 0; i < 6; i++) {
          mob += `<div class="spawn_row"><div class="newCheckbox"><input id="kws_spawner_ignore_${i}" type="checkbox" class="kws_spawner_check" name="ignoreMobs" value="${i}" ${(GAME.spawner && GAME.spawner[1][i] ? 'checked' : '')} /><label for="kws_spawner_ignore_${i}"></label></div>${LNG.lab457}&nbsp;<b>${LNG['mob_rank' + i]}</b></div>`;
        }
        mob += `<div class="spawn_row" style="flex-direction: column;align-items: center;"><div>Użyte PA na spawn</div><div class="game_input small"><input id="kws_pa_max" name="usePaToSpawn" type="text" value="1000"></div></div>`;
        return mob;
      }

      updatePaToSpawn(pats) {
        let pa = parseInt(pats);
        if (!pa || pa <= 0 || pa > 1000 || pa != pats) {
          pa = 1000;
          $("#kws_spawn input[name=usePaToSpawn]").val(pa);
        }
        GAME.spawner[0] = pa;
      }
      calcLVL(exp) {
        let lvls_gained = 0;
        let clvl = GAME.char_data.level;
        let cexp = GAME.char_data.exp + exp;
        let next = GAME.nextLevelExp(clvl, GAME.char_data.reborn);
        if (GAME.char_data.reborn >= 2) {
          while (cexp >= next && clvl < 100000) {
            clvl++;
            lvls_gained++;
            cexp -= next;
            next = GAME.nextLevelExp(clvl, GAME.char_data.reborn);
          }
        } else {
          while (cexp >= next && clvl < 1250) {
            clvl++;
            lvls_gained++;
            next = GAME.nextLevelExp(clvl, GAME.char_data.reborn);
          }
        }
        return `<b class="orange">[~${lvls_gained} lvl'i]</b>`;
      }
      handleSockets(res) {
        // if (res.a !== 598 && res.a !== 596) {
        //   console.log("KWA_HANDLE_SOCKETS: res.a == %s", res.a);
        // }
        switch (res.a) {
          case 7: //?? PvP fight result?
            if (!this.stopped) {
              if ("result" in res && res.result && "reward" in res.result && res.result.reward && "arena_exp" in res.result.reward && res.result.reward.arena_exp && res.result.result === 1) {
                this.arena_count();
              } else if ("result" in res && res.result && "reward" in res.result && res.result.reward && "empire_war" in res.result.reward && res.result.reward.empire_war && res.result.result === 1) {
                this.pvp_count();
              } else {
                break;
              }
            } else {
              break;
            }
          case 57: //Tournament related
            if (res.tours) {
              if (res.a === 57 && res.tours) {
                const foundCatObject = res.tours.find(tour => tour.cat === this.tournamentCategory);
                if (foundCatObject) {
                  this.newTournamentID = foundCatObject.id;
                }
              }
            } else {
              break;
            }
          default:
            //console.log("KWA_HANDLE_SOCKETS: unhandeled response");
            break;
        }
      }
      createCSS() {
        $("head").append(`<style id="kwsCSS"></style>`);
      }
      addToCSS(data) {
        $(`#kwsCSS`).append(data);
      }

      // ============================================
      // CLICK HANDLERS
      // All jQuery click event bindings and keyboard shortcuts
      // are now in handlers/click-handlers.js (ClickHandlersMixin)
      // ============================================

      prepareFutureStatsData() {
        let staty = GAME.char_data;
        if (staty.reborn == 0) {
          var moc = staty.sila + staty.szyb + staty.wytrz + staty.swoli + staty.ki;
          var fb = Math.round(moc / 10000000, 3);
          return `${LNG.lab166} : <span class="orange">${GAME.dots(fb)}</span>`;
        }
        if (staty.reborn == 1) {
          var expm = Math.round(staty.exp / 5000), mocm = Math.round(staty.moc / 10);
          var fb = expm + mocm;
          return `${LNG.lab167} : <span class="orange" id="future_wspol">${GAME.dots(fb)}</span> [${LNG.lab217}: <span class="green">${GAME.dots(mocm)}</span>, ${LNG.lab218}: <span class="green">${GAME.dots(expm)}</span>]`;
        }
        if (staty.reborn == 2) {
          var ps = 0;
          var moc = staty.sila + staty.szyb + staty.wytrz + staty.swoli + staty.ki;
          var mocm = Math.round(moc / 100000000000);
          if (mocm > 1000) mocm = 1000;
          ps += mocm;
          var wsplm = Math.round(staty.reborn_bonus / 100);
          if (wsplm > 1000) wsplm = 1000;
          ps += wsplm;
          var fb = Math.round(staty.god / 10000);
          return `${LNG.lab168} : <span class="orange">${GAME.dots(fb)}</span> ${LNG.lab220} : <span class="orange">${GAME.dots(ps)}</span> [${LNG.lab217}: <span class="green">${GAME.dots(mocm)}</span>, ${LNG.lab219}: <span class="green">${GAME.dots(wsplm)}</span>]`;
        }
        if (staty.reborn == 3) {
          var gki = 1000;
          var wtam = Math.floor(staty.wta / 100000000000);
          gki += wtam;
          var moc = staty.sila + staty.szyb + staty.wytrz + staty.swoli + staty.ki;
          var mocm1 = Math.round(moc / 10000000000000);
          gki += mocm1;
          if (gki > 1000000) gki = 1000000;
          var ps = 10;
          var levm = Math.floor(staty.level / 200);
          ps += levm;
          var moc = staty.sila + staty.szyb + staty.wytrz + staty.swoli + staty.ki + staty.wta;
          var mocm2 = Math.floor(moc / 10000000000000000);
          ps += mocm2;
          if (ps > 150) ps = 150;
          return `${LNG.lab169} : <span class="orange">${GAME.dots(gki)}</span> [1000 + ${LNG.lab217}: <span class="green">${GAME.dots(mocm1)}</span>, ${LNG.lab221}: <span class="green">${GAME.dots(wtam)}</span>] ${LNG.lab170} : <span class="orange">${GAME.dots(ps)}</span> [10+ ${LNG.lab217}: <span class="green">${GAME.dots(mocm2)}</span>, ${LNG.lab222}: <span class="green">${GAME.dots(levm)}</span>]`;
        }
        if (staty.reborn == 4) {
          var ins = 10;
          var wtam = Math.floor(staty.wta / 1000000000000);
          ins += wtam;
          var gkid = staty.gki / 1000;
          ins += gkid;
          if (ins > 100000) ins = 100000;
          return `${LNG.lab434} : <span class="orange">${GAME.dots(ins)}</span> [10 + ${LNG.lab435}: <span class="green">${GAME.dots(gkid)}</span>, ${LNG.lab221}: <span class="green">${GAME.dots(wtam)}</span>]`;
        }
        if (staty.reborn > 4) {
          return ''
        }
      }
      handleAdditionalTopBarVisibility() {
        if (this.additionalTopBarVisible) {
          this.hideAdditionalTopBar();
          this.additionalTopBarVisible = false;
        } else {
          this.showAdditionalTopBar();
          this.additionalTopBarVisible = true;
        }
      }
      resetCalculatedPower() {
        this.baselinePower = undefined;
        this.baselineLevel = undefined;
      }
      showAdditionalTopBar() {
        $("#game_win")[0].style.marginTop = '30px';
        $("#top_bar")[0].style.height = '60px';
        $(".kws_additional_top_bar")[0].style.marginTop = '30px';
        $(".kws_additional_top_bar")[0].style.display = 'block';
      }
      hideAdditionalTopBar() {
        $(".kws_additional_top_bar")[0].style.display = 'none';
        $("#top_bar")[0].style.height = '30px';
        $("#game_win")[0].style.marginTop = '0px';
      }

      // Tournament methods (findTournamentCategory, checkTournamentsSigning, setTimerForTournamentsReset)
      // are now in handlers/tournaments.js

      // Alternative Pilot methods (createAlternativePilot, bindAlternativePilotButtons)
      // are now in handlers/pilot.js

      goToNextChar() {
        this.resetAFO();
        var charId = this.charactersManager.getNextCharId();
        GAME.emitOrder({ a: 2, char_id: charId });
      }
      goToPreviousChar() {
        this.resetAFO();
        var charId = this.charactersManager.getPreviousCharId();
        GAME.emitOrder({ a: 2, char_id: charId });
      }
      adjustCurrentCharacterId() {
        if (!this.charactersManager) return;
        var thisCharId = GAME.char_id;
        if (thisCharId != this.charactersManager.currentCharacterId) {
          this.charactersManager.setCurrentCharacterId(thisCharId);
          // Reset baseline stats when character changes
          this.baselinePower = GAME.char_data.moc;
          this.baselineLevel = GAME.char_data.level;
        }
      }
      resetAFO() {
        //console.log("KWA_RESET_AFO: reset AFO values");
        if ($("#resp_Panel .resp_status").eq(0).hasClass("green")) {
          $("#resp_Panel .resp_button.resp_resp").click();
        }
        if ($("#pvp_Panel .pvp_status").eq(0).hasClass("green")) {
          $("#pvp_Panel .pvp_button.pvp_pvp").click();
        }
        if ($("#lpvm_Panel .lpvm_status").eq(0).hasClass("green")) {
          $("#lpvm_Panel .lpvm_button.lpvm_lpvm").click();
        }
        if ($("#res_Panel .res_status").eq(0).hasClass("green")) {
          $("#res_Panel .res_button.res_res").click();
        }
        if ($(".manage_autoExpeditions").eq(0).hasClass("kws_active_icon")) {
          $(".manage_autoExpeditions").click();
        }
        setTimeout(() => {
          //console.log("KWA_RESET_AFO: reset tournaments values");
          this.tourSigned = false;
          this.tournamentCategory = undefined;
          this.newTournamentID = undefined;
          this.isCheckingTournaments = false;
        }, 1000);
      }
    }

    // ============================================
    // APPLY MIXINS
    // ============================================
    if (typeof AutomationMixin !== 'undefined') {
      Object.assign(Gieniobot.prototype, AutomationMixin);
      console.log('[Gieniobot] AutomationMixin applied');
    }
    if (typeof UIMixin !== 'undefined') {
      Object.assign(Gieniobot.prototype, UIMixin);
      console.log('[Gieniobot] UIMixin applied');
    }
    if (typeof ClanMixin !== 'undefined') {
      Object.assign(Gieniobot.prototype, ClanMixin);
      console.log('[Gieniobot] ClanMixin applied');
    }
    if (typeof MapMixin !== 'undefined') {
      Object.assign(Gieniobot.prototype, MapMixin);
      console.log('[Gieniobot] MapMixin applied');
    }
    if (typeof PilotMixin !== 'undefined') {
      Object.assign(Gieniobot.prototype, PilotMixin);
      console.log('[Gieniobot] PilotMixin applied');
    }
    if (typeof SettingsMixin !== 'undefined') {
      Object.assign(Gieniobot.prototype, SettingsMixin);
      console.log('[Gieniobot] SettingsMixin applied');
    }
    if (typeof CombatMixin !== 'undefined') {
      Object.assign(Gieniobot.prototype, CombatMixin);
      console.log('[Gieniobot] CombatMixin applied');
    }
    if (typeof ClickHandlersMixin !== 'undefined') {
      Object.assign(Gieniobot.prototype, ClickHandlersMixin);
      console.log('[Gieniobot] ClickHandlersMixin applied');
    }
    if (typeof EmpireMixin !== 'undefined') {
      Object.assign(Gieniobot.prototype, EmpireMixin);
      console.log('[Gieniobot] EmpireMixin applied');
    }
    if (typeof TournamentsMixin !== 'undefined') {
      Object.assign(Gieniobot.prototype, TournamentsMixin);
      console.log('[Gieniobot] TournamentsMixin applied');
    }

    if (!window._pongBound) {
      window._pongBound = true;
      GAME.socket.on('pong', function (ms) {
        latency = ms;
      });
    }

    // Wait for charactersManager to be ready
    let charWait = setInterval(() => {
      if (typeof kwsLocalCharacters !== 'undefined' && kwsLocalCharacters !== null) {
        clearInterval(charWait);
        const kws = new Gieniobot(kwsLocalCharacters);
        console.log('[Gieniobot] kws initialized with charactersManager');
        window.kws = kws; // Make globally available

        // Apply GAME.* overrides (now that kws is available)
        if (typeof setupGameOverrides === 'function') {
          setupGameOverrides();
        }
      }
    }, 100);

    // ============================================
    // GAME.* OVERRIDES
    // All GAME.* method overrides are now in handlers/game-overrides.js
    // setupGameOverrides() is called after kws initialization above
    // ============================================

    // ekwipunek initialized after all scripts loaded (ball modules self-initialize via IIFEs)
    let ekwipunekObj = null;

    let ekwWait = setInterval(() => {
      if (typeof ekwipunekMenager !== 'undefined') {
        clearInterval(ekwWait);
        ekwipunekObj = new ekwipunekMenager();
        console.log('[Gieniobot] ekwipunek initialized');
      }
    }, 100);
  }
  )
}