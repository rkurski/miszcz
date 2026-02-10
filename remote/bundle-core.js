// ========== remote/features/characters/charactersManager.js ==========
class KwsCharactersManager {
  constructor() {
      this.characters = [];
      this.currentCharacterId = 0;
      this.currentIndex = 0;
      this.shouldReport = true;
  }
  setCurrentCharacterId(charId) {
      this.currentCharacterId = charId;
      this.currentIndex = this.characters.findIndex((value, index, array) => {
          return value == charId;
      });
  }
  getNextCharId() {
      if (this.characters.length == 1) {
          return this.currentCharacterId;
      }

      var returnCharId;

      if (this.currentIndex == this.characters.length - 1) {
          returnCharId = this.characters[0];
      } else {
          returnCharId = this.characters[this.currentIndex + 1];
      }

      this.setCurrentCharacterId(returnCharId);

      return returnCharId;
  }
  getPreviousCharId() {
      if (this.characters.length == 1) {
          return this.currentCharacterId;
      }

      var returnCharId;

      if (this.currentIndex == 0) {
          returnCharId = this.characters[this.characters.length - 1];
      } else {
          returnCharId = this.characters[this.currentIndex - 1];
      }

      this.setCurrentCharacterId(returnCharId);

      return returnCharId;
  }
}

function getCharacters() {
  if ($("#server_choose").is(":visible")) {
      if (this.shouldReport) {
          $("#logout").eq(0).click();
          this.shouldReport = false;
      }
  }
  var allCharacters = [...$("li[data-option=select_char]")];
  if (allCharacters.length == 0) {
      setTimeout(getCharacters, 200);
  } else {
      var kwsCharactersManager = new KwsCharactersManager();
      allCharacters.forEach((element, index, array) => {
          kwsCharactersManager.characters.push(element.getAttribute("data-char_id"));
      });
      kwsLocalCharacters = kwsCharactersManager;
  }
}

var kwsLocalCharacters = undefined;
getCharacters();

// ========== remote/core/handlers/click-handlers.js ==========
/**
 * ============================================================================
 * GIENIOBOT - Click Handlers Module
 * ============================================================================
 * 
 * All jQuery click event bindings and keyboard shortcuts.
 * This mixin is applied to the Gieniobot class.
 * 
 * Handlers include:
 * - Clan handlers (assist, buffs)
 * - Auto knowledge handlers
 * - Settings handlers (minimap, map size, background)
 * - Keyboard shortcuts
 * - UI toggle handlers
 * - Quest roll handlers
 * 
 * ============================================================================
 */

const ClickHandlersMixin = {

  bindClickHandlers() {
    // --- CLAN HANDLERS ---
    $("body").on("click", ".free_assist_for_all", () => {
      this.freeAssist();
    });

    // --- AUTOMATIC BLESS ---
    let isAutoBlessActive = false;
    let blessInterval = null;
    $("body").on("click", '.auto_bless', () => {
      if (isAutoBlessActive) {
        clearInterval(blessInterval);
        blessInterval = null;
        isAutoBlessActive = false;
        $(".auto_bless").removeClass("kws_active_button");
      } else {
        blessInterval = setInterval(this.autobless, 11000);
        isAutoBlessActive = true;
        $(".auto_bless").addClass("kws_active_button");
      }
    });

    // --- AUTOMATIC KNOWLEDGE ---
    let knowStatus = false;
    let mbornInterval = null;
    let gohanInterval = null;

    $("body").on("click", '.auto_know', () => {
      if (!knowStatus) {
        GAME.komunikat2("Której wiedzy chcesz się uczyć?");
        let komunikatElement = document.querySelector('#kom_con .kom');
        if (komunikatElement) {
          if (!komunikatElement.querySelector('.gohan') && !komunikatElement.querySelector('.mborn')) {
            if (GAME.char_data.race == 7) {
              komunikatElement.innerHTML += `
                <button class="newBtn gohan">Wiedza Gohan</button>
                <button class="newBtn mborn">Wiedza MBorn</button>
                <button class="newBtn mbornKody">Wiedza MBorn + Kody</button>`;
            } else {
              komunikatElement.innerHTML += `
                <button class="newBtn mborn">Wiedza MBorn</button>
                <button class="newBtn mbornKody">Wiedza MBorn + Kody</button>`;
            }
          }
          let closeKomElement = document.querySelector("#kom_con > div > div.close_kom");
          if (closeKomElement && !closeKomElement.hasAttribute("data-close-handler")) {
            closeKomElement.setAttribute("data-close-handler", "true");
            closeKomElement.addEventListener("click", () => { kom_clear(); });
          }
        } else {
          console.error('Element .game-komunikat nie istnieje!');
        }
      } else if (knowStatus) {
        knowStatus = false;
        if (mbornInterval) { clearInterval(mbornInterval); }
        if (gohanInterval) { clearInterval(gohanInterval); }
        GAME.komunikat("Zaprzestałeś robienia Wiedzy.");
      }
    });

    $("body").on("click", '.mborn', () => {
      knowStatus = true;
      GAME.socket.emit('ga', { a: 9, type: 3, nid: 382 });
      mbornInterval = setInterval(wiedza_M, 60000);
      function wiedza_M() {
        if (knowStatus) {
          if (GAME.char_tables.timed_actions[0] == undefined || GAME.char_tables.timed_actions[1] == undefined) {
            GAME.socket.emit('ga', { a: 9, type: 3, nid: 382 });
            kom_clear();
          }
        }
      }
    });

    $("body").on("click", '.mbornKody', () => {
      knowStatus = true;
      GAME.socket.emit('ga', { a: 9, type: 3, nid: 382 });
      mbornInterval = setInterval(wiedza_M, 10000);
      function wiedza_M() {
        if (knowStatus) {
          if ($("#train_uptime").find('.timer').length == 0 && !GAME.is_training && $("#timed_label").text().includes("Kontrola Chaosu") && GAME.char_tables.timed_actions[0] != undefined) {
            GAME.socket.emit('ga', { a: 8, type: 3 });
          } else if ($("#train_uptime").find('.timer').length == 0 && !GAME.is_training) {
            GAME.socket.emit('ga', { a: 8, type: 2, stat: 1, duration: 1 });
            setTimeout(() => {
              GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' });
            }, 1500);
          } else if (GAME.is_training && $("#train_uptime").find('.timer').length == 1) {
            GAME.socket.emit('ga', { a: 8, type: 3 });
          } else if (GAME.char_tables.timed_actions[0] == undefined) {
            GAME.socket.emit('ga', { a: 9, type: 3, nid: 382 });
            kom_clear();
          }
        }
      }
    });

    $("body").on("click", '.gohan', () => {
      knowStatus = true;
      GAME.socket.emit('ga', { a: 9, type: 3, nid: 288 });
      gohanInterval = setInterval(wiedza_gohan, 60000);
      function wiedza_gohan() {
        if (knowStatus) {
          if (GAME.char_tables.timed_actions[0] == undefined || GAME.char_tables.timed_actions[1] == undefined) {
            GAME.socket.emit('ga', { a: 9, type: 3, nid: 288 });
            kom_clear();
          } else {
            console.log("Wiedza trwa.")
          }
        }
      }
    });

    // --- CLAN BUFFS ---
    $("body").on("click", ".activate_all_clan_buffs", () => {
      this.activateAllClanBuffs();
    });

    // --- INSTANCES ---
    $("body").on("click", ".do_all_instances", (event) => {
      let worker = {};
      worker.id = parseInt($(event.target).attr("data-emp"));
      worker.local = parseInt($(event.target).attr("data-emp_local"));
      this.doAllInstances(worker);
    });

    // --- TELEPORT HANDLERS ---
    $("#poka_telep").click(() => {
      GAME.socket.emit('ga', { a: 39, type: 35 });
      GAME.socket.emit('ga', { a: 39, type: 33 });
      if ($("#clan_inner_stelep").css("display") == "none") {
        $("#clan_inner_stelep").css("cssText", `display:block;position:absolute;padding:10px;border:solid #003e60 2px;background:rgb(5 21 36 / 97%);z-index:9999;border-radius:5px;margin-top:85px;`);
      } else {
        $("#clan_inner_stelep").attr("style", "display:none;");
      }
    });

    // --- CHARACTER SWITCHING ---
    $("body").on("click", "#changeProfile", () => {
      this.resetAFO();
    });
    $("body").on("click", "#changeProfilePrev", () => {
      this.goToPreviousChar();
      this.resetCalculatedPower();
    });
    $("body").on("click", "#changeProfileNext", () => {
      this.goToNextChar();
      this.resetCalculatedPower();
    });

    // --- CLAN TELEPORT ---
    $("body").on("click", `button[data-page="stelep"].cps`, () => {
      $("#clan_inner_stelep").attr("style", "");
    }).on("click", `button[data-option="clan_tp_go"]`, () => {
      if ($("#clan_inner_stelep").css("padding") == "10px") {
        GAME.socket.emit('ga', { a: 39, type: 33 });
      }
    }).on("click", `button[data-option="invade_planet"]`, () => {
      if ($("#clan_inner_stelep").css("padding") == "10px") {
        GAME.socket.emit('ga', { a: 39, type: 33 });
      }
    });

    // --- CHAT LOADING ---
    $("body").on("click", `.better_chat_loading`, () => {
      if (GAME.chat_data[GAME.chat_channel].messages.length == 0) {
        GAME.socket.emit('ga', { a: 600, channel: GAME.chat_channel, lm: GAME.chat_data[GAME.chat_channel].last_message });
      } else {
        GAME.socket.emit('ga', { a: 600, channel: GAME.chat_channel, lm: GAME.chat_data[GAME.chat_channel].messages[0].time });
      }
    });

    // --- QUEST TELEPORT ---
    $("body").on("click", `div[tp_data=go_teleport]`, (th) => {
      const selectedText = window.getSelection().toString().trim();
      if (!selectedText) {
        let loc = parseInt($(th.target).closest(".qtrack").attr("data-loc"));
        GAME.socket.emit('ga', { a: 12, type: 18, loc: loc });
      }
    });

    // --- TOP BAR HANDLERS ---
    $("body").on("click", `.kws_top_bar_section.sk_info`, () => {
      GAME.page_switch('game_balls');
    });
    $("body").on("click", `.kws_top_bar_section.trader_info`, () => {
      GAME.page_switch('game_events');
    });

    // --- SOUL CARD SET HANDLER ---
    $("body").on("change", "#sc_set_select", async function () {
      const setName = $(this).val();
      if (setName && typeof AFO_SOUL_CARD_SETS !== 'undefined' && AFO_SOUL_CARD_SETS.sets[setName] !== undefined) {
        await AFO_SOUL_CARD_SETS.switchToSet(setName);
        // Selection stays - it's saved and restored on reload
      }
    });

    // --- ADDITIONAL STATS ---
    $("body").on("click", `.kws_top_bar_section.additional_stats`, () => {
      this.handleAdditionalTopBarVisibility();
    });
    $("body").on("click", `.kws_additional_top_bar_section.additional_stats_reset`, () => {
      this.resetCalculatedPower();
    });
    $("body").on("click", `.kws_top_bar_section.train_upgr_info`, () => {
      GAME.page_switch('game_train');
    });

    // --- TRACKER ---
    $('#drag_tracker').off('click').on('click', () => {
      if (!this.settings.hide_tracker) {
        $('#drag_con').hide();
        this.settings.hide_tracker = true;
      } else {
        $('#drag_con').show();
        this.settings.hide_tracker = false;
      }
      this.updateSettings();
    });

    // --- TITLES ---
    $("body").on("click", ".qlink.get_titles_list", () => {
      this.getTitlesList((html) => {
        JQS.ldr.finish().fadeOut();
        GAME.komunikat2(`<table id="char_titles" class="fast_titles_table" style="margin:0 auto;">${html}</table>`);
        option_bind();
        tooltip_bind();
      });
    });
    $("body").on("click", ".fast_titles_table .option", () => {
      setTimeout(() => {
        GAME.maploaded = false;
        GAME.prepareMap();
      }, 300);
    });

    // --- AUTO ABYSS ---
    $("body").on("click", `.qlink.manage_auto_abyss`, () => {
      if (!this.auto_abyss) {
        this.auto_abyss = true;
        $(".qlink.manage_auto_abyss").addClass("kws_active_icon");
        this.auto_abyss_interval = setInterval(() => { this.manageAutoAbyss(); }, 5000);
      } else {
        this.auto_abyss = false;
        $(".qlink.manage_auto_abyss").removeClass("kws_active_icon");
        clearInterval(this.auto_abyss_interval);
      }
    });

    // --- AUTO ARENA ---
    $("body").on("click", `.qlink.manage_auto_arena`, () => {
      if (!this.auto_arena) {
        this.auto_arena = true;
        $(".qlink.manage_auto_arena").addClass("kws_active_icon");
        this.manageAutoArena();
      } else {
        this.stopAutoArena();
      }
    });

    // --- AUTO EXPEDITIONS ---
    $("body").on("click", `.qlink.manage_autoExpeditions`, () => {
      this.manageAutoExpeditions();
    });

    // --- ACTIVITIES & INSTANCES ---
    $("body").on("click", `#secondary_char_stats .activities`, () => {
      GAME.socket.emit('ga', { a: 49, type: 0 });
      setTimeout(() => { this.collectActivities(); }, 1000);
    });
    $("body").on("click", `#secondary_char_stats .instance`, () => {
      GAME.socket.emit('ga', { a: 44, type: 0 });
      setTimeout(() => { $("#page_game_emp .newBtn.do_all_instances").eq(0).click(); }, 1000);
    });

    // --- EQUIPMENT ---
    $("body").on("click", `#page_game_ekw .ekw_bck .ekw_slot`, (e) => {
      let slot = $(e.target).closest(".ekw_slot").attr("id");
      let slot_number = slot.replace(/[^0-9]/g, "");
      GAME.socket.emit('ga', { a: 12, type: 4, slot: slot_number, page: GAME.ekw_page, page2: GAME.ekw_page2 });
    });

    // --- MINIMAP SETTINGS ---
    $("body").on("change", "#minimap_side", (el) => {
      let value = parseInt($(el.target).val());
      if (value == 0) { $("#minimap_con").css({ "right": "-5px", "left": "unset" }); }
      else if (value == 1) { $("#minimap_con").css({ "left": "-4px", "right": "unset" }); }
      else if (value == 2) { $("#minimap_con").css({ "left": "-210px", "right": "unset" }); }
      this.minimap.side = value;
      this.manageMinimapSettings("save");
    });

    $("#minimap_range").on("input", (el) => {
      let value = parseInt($(el.target).val());
      $("#minimap_con").css({ "opacity": value / 100 });
      this.minimap.opacity = value;
      this.manageMinimapSettings("save");
    }).mouseup((el) => {
      let value = parseInt($(el.target).val());
      $("#minimap_con").css({ "opacity": value / 100 });
    });

    $("body").on("change", "#kws_sh_locInfo", (el) => {
      let value = parseInt($(el.target).val());
      if (value == 1) { $("#kws_locInfo").css({ "display": "block", "background-size": "cover" }); }
      else { $("#kws_locInfo").css({ "display": "none" }); }
      this.minimap.loc_info = value;
      this.manageMinimapSettings("save");
    });

    $("body").on("change", "#kws_hidePilot", (el) => {
      let value = parseInt($(el.target).val());
      this.managePilot("set", value);
    });

    // --- MAP SIZE ---
    $("body").on("click", `.kws_mapsize_change`, () => {
      let width = parseInt($(`input[name="kws_map_width"]`).val());
      let height = parseInt($(`input[name="kws_map_height"]`).val());
      if (width && height) { this.manageMapSize("change", [width, height]); }
    });
    $("body").on("click", `.kws_mapsize_reset`, () => {
      this.manageMapSize("reset");
    });

    // --- WEBSITE BACKGROUND ---
    $("body").on("click", `.kws_change_website_bg`, () => {
      let url = $("#new_website_bg").val();
      this.manageWebsiteBackground("set", url);
      // Reset preset select when using custom URL
      $("#kws_bg_preset_select").val("");
    });
    $("body").on("click", `.kws_reset_website_bg`, () => {
      this.manageWebsiteBackground("reset");
      $("#kws_bg_preset_select").val("");
    });

    // --- WEBSITE BACKGROUND PRESETS ---
    $("body").on("change", "#kws_bg_preset_select", (el) => {
      const idx = $(el.target).val();
      if (idx !== "" && this.BACKGROUND_PRESETS && this.BACKGROUND_PRESETS[idx]) {
        const preset = this.BACKGROUND_PRESETS[idx];
        $("#new_website_bg").val(preset.url);
        this.manageWebsiteBackground("set", preset.url);
      }
    });

    // Populate preset select on page load
    if (this.BACKGROUND_PRESETS) {
      $("#kws_bg_preset_select").html(this.getBackgroundPresetsSelectHTML());
    }

    // --- COMBAT HANDLERS ---
    $("body").on("click", `[data-option="map_multi_pvp"]`, () => { this.pvpKill(); });
    $("body").on("click", `[data-option="map_quest_skip"]`, () => { this.questProceed(); kom_clear(); });
    $("body").on("click", `[data-option="map_quest_skip_time"]`, () => { this.useCompressor(); });
    $("body").on("click", `[data-option="map_alternative_pilot"]`, () => { this.toggleAlternativePilot(); });

    // --- KEYBOARD SHORTCUTS ---
    $(document).keydown((event) => {
      if (!$("input, textarea").is(":focus")) {
        if (event.key === "x" || event.key === "X") { this.questProceed(); kom_clear(); }
        else if (event.key === "b" || event.key === "B") { this.pvpKill(); }
        else if (event.key === "n" || event.key === "N") { this.useCompressor(); }
        else if (event.key === "2") { GAME.socket.emit('ga', { a: 15, type: 13 }); }
        else if (event.key === "3") { GAME.socket.emit('ga', { a: 39, type: 32 }); }
        else if (event.key === "4") { this.bless(); }
        else if (event.key === "5") {
          setTimeout(() => { GAME.socket.emit('ga', { a: 54, type: 0 }); }, 300);
          setTimeout(() => { this.vip(); }, 600);
          GAME.socket.emit('ga', { a: 15, type: 7 });
        }
        else if (event.key === "6") { GAME.socket.emit('ga', { a: 39, type: 46, rent: 3 }); }
        else if (event.key === "7") { GAME.socket.emit('ga', { a: 10, type: 2, ct: 0 }); }
        else if (event.key === "8") {
          let set = $("#ekw_sets").find(".option.ek_sets_all:not(.current)").attr("data-set");
          if (set != undefined) { GAME.socket.emit('ga', { a: 64, type: 2, set: set }); }
        }
        else if (event.key === "=") { this.toggleAlternativePilot(); }
        else if (event.key === ",") { this.goToPreviousChar(); }
        else if (event.key === ".") { this.goToNextChar(); }
      }
    });

    // --- AFO LOADER ---
    $("body").on("click", ".qlink.load_afo", () => {
      if (typeof this.afo_is_loaded == 'undefined') {
        this.afo_is_loaded = true;
        fetch(getGieniobotUrl('remote/afo/loader.js'))
          .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
          })
          .then(data => {
            const script = document.createElement('script');
            script.textContent = data;
            document.body.appendChild(script);
          })
          .catch(() => {
            this.afo_is_loaded = undefined;
            GAME.komunikat("Wystąpił błąd w ładowaniu skryptu, odśwież stronę i spróbuj ponownie!");
          });
      } else {
        GAME.komunikat("Wystąpił błąd w ładowaniu skryptu, odśwież stronę i spróbuj ponownie!");
      }
    });

    // --- EMPIRE ---
    $("body").on("click", ".qlink.go_to_emp", (el) => {
      let emp = parseInt($(el.target).attr("emp"));
      GAME.socket.emit('ga', { a: 50, type: 5, e: emp });
    });

    // --- SPAWNER ---
    $("#kws_spawn").draggable({ handle: ".sekcja" });
    $('.spawn_switch').on('click', function () { $("#kws_spawn2").toggle(); });
    $("#kws_spawn input[type=checkbox], input[type=text]").change((chb) => {
      switch ($(chb.target).attr("name")) {
        case "ignoreMobs":
          GAME.spawner[1] = $('#kws_spawn input[name="ignoreMobs"]').map((index, element) => {
            return element.checked ? 1 : 0;
          }).get();
          break;
        case "usePaToSpawn":
          this.updatePaToSpawn($(chb.target).val());
          break;
      }
    });

    // --- SECONDARY STATS UI ---
    $("#secondary_char_stats").append(` <div class="instance" data-toggle="tooltip" data-original-title="<div class=tt>Instancje <br /><span class=&quot;red&quot;><b>Kliknij by wykonać instancje</b></span></div>" class=""><i class="ico a11"></i> <span> <ul><ul/></span></div> <div class="activities" data-toggle="tooltip" data-original-title="<div class=tt>Aktywności <br /><span class=&quot;red&quot;><b>Kliknij by odebrać aktywności</b></span></div>" class=""><i class="ico a12"></i> <span> <ul><ul/></span></div>`);

    // --- AUTO EXPEDITION CODES ---
    $("body").on('change', '.autoExpeCodes input[type=checkbox]', (el) => {
      let name = $(el.target).attr("name");
      if (name === 'aeCodes') {
        this.settings.aeCodes = $(el.target).is(':checked') ? true : false;
      }
      this.updateSettings();
    });

    // --- PVP BUFF CHECKBOX ---
    $("body").on('change', '.autoArenaBuff input[type=checkbox]', (el) => {
      let name = $(el.target).attr("name");
      if (name === 'aePvpBuff') {
        this.settings.aePvpBuff = $(el.target).is(':checked') ? true : false;
      }
      this.updateSettings();
    });

    // --- AUTO CLAN ASSIST TOGGLE ---
    $("body").on("click", `.qlink.manage_auto_clanAssist`, () => {
      if (typeof CLAN_ASSIST === 'undefined') return;

      if (CLAN_ASSIST.enabled !== false) {
        // Currently enabled, disable it
        CLAN_ASSIST.enabled = false;
        CLAN_ASSIST.stop();
        $(".qlink.manage_auto_clanAssist").removeClass("kws_active_icon");
        console.log('[ClanAssist] Disabled via toggle');
      } else {
        // Currently disabled, enable it
        CLAN_ASSIST.enabled = true;
        CLAN_ASSIST.start();
        $(".qlink.manage_auto_clanAssist").addClass("kws_active_icon");
        console.log('[ClanAssist] Enabled via toggle');
      }
    });

    // --- KUKLA GUARDIAN TOGGLE (Strażnik Kukli) ---
    $("body").on("click", `.qlink.manage_kukla_guardian`, () => {
      if (typeof KUKLA_GUARDIAN === 'undefined') return;

      if (KUKLA_GUARDIAN.enabled === true) {
        // Currently enabled, disable it
        KUKLA_GUARDIAN.stop();
        $(".qlink.manage_kukla_guardian").removeClass("kws_active_icon");
        console.log('[KuklaGuardian] Disabled via toggle');
      } else {
        // Currently disabled, enable it
        KUKLA_GUARDIAN.start();
        $(".qlink.manage_kukla_guardian").addClass("kws_active_icon");
        console.log('[KuklaGuardian] Enabled via toggle');
      }
    });

    // --- QUEST ROLL HANDLERS ---
    $("body").on("click", `.quest_roll1.option`, () => {
      var id = parseInt($(".quest_roll.option").attr("data-qb_id"));
      if (questRollActive1) { questRollActive1 = false; }
      else { questRollActive1 = true; GAME.socket.emit('ga', { a: 22, type: 1, id: id }); }
    });
    $("body").on("click", `.quest_roll2.option`, () => {
      var id = parseInt($(".quest_roll.option").attr("data-qb_id"));
      if (questRollActive2) { questRollActive2 = false; }
      else { questRollActive2 = true; GAME.socket.emit('ga', { a: 22, type: 1, id: id }); }
    });
    $("body").on("click", `.quest_roll3.option`, () => {
      var id = parseInt($(".quest_roll.option").attr("data-qb_id"));
      if (questRollActive3) { questRollActive3 = false; }
      else { questRollActive3 = true; GAME.socket.emit('ga', { a: 22, type: 1, id: id }); }
    });
  }
};

// Export mixin
window.ClickHandlersMixin = ClickHandlersMixin;
console.log('[ClickHandlers] Module loaded');


// ========== remote/core/handlers/automation.js ==========
/**
 * ============================================================================
 * GIENIOBOT - Automation Module
 * ============================================================================
 * 
 * Automatic game actions: expeditions, arena, abyss
 * These methods are mixed into the Gieniobot class.
 * 
 * ============================================================================
 */

const AutomationMixin = {

  // ============================================
  // AUTO EXPEDITIONS
  // ============================================

  manageAutoExpeditions() {
    // expedNmbr: 1 when no bonus (to avoid collision with arena/codes), 2 when bonus active
    // let expedNmbr = GAME.char_data.bonus16 < GAME.getTime() ? 1 : 2;
    let expedNmbr = 1;
    if (!this.autoExpeditions) {
      this.autoExpeditions = true;
      this.autoExpeditionsInterval = setInterval(() => {
        let opponents = $("#arena_players").find(`.player button[data-option="arena_attack"][data-quick="1"]:not(.initial_hide_forced)`);
        let opponent = parseInt(opponents.attr("data-index"));
        setTimeout(() => {
          GAME.parseTimed();
        }, 100);
        if (this.settings.aeCodes && $("#train_uptime").find('.timer').length == 0 && !GAME.is_training && $("#timed_label").text().includes("Wyprawa") && GAME.char_tables.timed_actions[0] != undefined) {
          GAME.socket.emit('ga', { a: 8, type: 3 });
        } else if (this.settings.aeCodes && $("#train_uptime").find('.timer').length == 0 && !GAME.is_training) {
          GAME.socket.emit('ga', { a: 8, type: 2, stat: 1, duration: 1 });
          setTimeout(() => {
            GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' });
          }, 1500);
        } else if (this.settings.aeCodes && GAME.is_training && $("#train_uptime").find('.timer').length == 1) {
          GAME.socket.emit('ga', { a: 8, type: 3 });
        } else if (this.settings.aeCodes && GAME.quick_opts.ssj && $("#ssj_bar").css("display") === "none") {
          // Activate SSJ if available and not active
          GAME.socket.emit('ga', { a: 18, type: 5, tech_id: GAME.quick_opts.ssj[0] });
        } else if (this.settings.aeCodes && $('#ssj_status').text() == "--:--:--" && GAME.quick_opts.ssj) {
          // SSJ cooldown finished, reactivate
          setTimeout(() => {
            GAME.socket.emit('ga', { a: 18, type: 6 });
          }, 1500);
        } else if (this.auto_arena && !isNaN(opponent)) {
          // Skip if auto arena is active
        } else if (GAME.char_tables.timed_actions[0] == undefined) {
          // No timed action at all - send expedition
          GAME.socket.emit('ga', { a: 10, type: 2, ct: 0 });
          kom_clear();
        } else if (expedNmbr == 2 && GAME.char_tables.timed_actions[1] == undefined && GAME.char_data.bonus16 > GAME.getTime()) {
          // Has bonus and slot 2 is empty - send second expedition
          GAME.socket.emit('ga', { a: 10, type: 2, ct: 0 });
          kom_clear();
        }
      }, 4000);
      $(".qlink.manage_autoExpeditions").addClass("kws_active_icon");
    } else {
      this.autoExpeditions = false;
      clearInterval(this.autoExpeditionsInterval);
      $(".qlink.manage_autoExpeditions").removeClass("kws_active_icon");
    }
  },

  // ============================================
  // AUTO ABYSS
  // ============================================

  manageAutoAbyss() {
    GAME.socket.emit('ga', { a: 59, type: 0 });
    setTimeout(() => {
      if (GAME.quick_opts.ssj && $("#ssj_bar").css("display") == "none") {
        GAME.socket.emit('ga', { a: 18, type: 5, tech_id: GAME.quick_opts.ssj[0] });
      } else if ($('#ssj_status').text() == "--:--:--") {
        GAME.socket.emit('ga', { a: 18, type: 6 });
      }
    }, 1000);
    if ($("#ss_cd_still").css("display") == "none") {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 59, type: 1 });
      }, 1000);
      setTimeout(() => {
        $('#fight_view').fadeOut();
      }, 2000);
      setTimeout(() => {
        if ((GAME.char_data.reborn == 4 || GAME.char_data.reborn == 5) && GAME.char_data.alt_transform_expiry < GAME.getTime()) {
          GAME.socket.emit('ga', { a: 18, type: 8, tech_id: 134 });
        }
      }, 3000);
    }
  },

  // ============================================
  // AUTO ARENA
  // ============================================

  manageAutoArena() {
    if (this.auto_arena) {
      // Check if PVP buff is enabled and not active - BEFORE loading arena
      if (this.settings.aePvpBuff) {
        const hasBuff = $('#char_buffs').find('[data-buff=71]').length > 0;
        const buffExpiring = $('#char_buffs').find('[data-buff=71]').find('.timer').text() <= '00:00:04';

        if (!hasBuff || buffExpiring) {
          // Ensure we're on inventory page 10 (bless items)
          if (GAME.ekw_page != 10) {
            GAME.ekw_page = 10;
            GAME.socket.emit('ga', { a: 12, page: 10, used: 1 });
            setTimeout(() => this.manageAutoArena(), 500);
            return;
          }

          // Find and use item 1742 (5min PVP CD bless)
          const itemId = $('#ekw_page_items').find('div[data-base_item_id=1742]').attr('data-item_id');
          if (itemId) {
            console.log('[AutoArena] Using PVP buff item 1742 BEFORE arena');
            GAME.socket.emit('ga', { a: 12, type: 14, iid: parseInt(itemId), page: 10 });
            // Wait for buff to apply, then continue to arena
            setTimeout(() => this.manageAutoArena(), 1500);
            return;
          }
        }
      }

      // Buff is active (or not needed), now load arena and attack
      GAME.socket.emit('ga', { a: 46, type: 0 });
      setTimeout(() => {
        this.attackAutoArena();
      }, 1000);
    } else {
      this.stopAutoArena();
    }
  },

  attackAutoArena() {
    let opponents = $("#arena_players").find(`.player button[data-option="arena_attack"][data-quick="1"]:not(.initial_hide_forced)`);
    let opponent = parseInt(opponents.attr("data-index"));
    if (this.auto_arena) {
      if (opponents.length > 0 && GAME.timed == 0) {
        GAME.socket.emit('ga', { a: 46, type: 1, index: opponent, quick: 1 });
        setTimeout(() => {
          this.attackAutoArena();
        }, 500);
      } else {
        setTimeout(() => {
          this.manageAutoArena();
        }, 5000);
      }
    } else {
      this.stopAutoArena();
    }
  },

  stopAutoArena() {
    this.auto_arena = false;
    $(".qlink.manage_auto_arena").removeClass("kws_active_icon");
  }
};

// Export mixin
window.AutomationMixin = AutomationMixin;
console.log('[Automation] Module loaded');


// ========== remote/core/handlers/ui.js ==========
/**
 * ============================================================================
 * GIENIOBOT - UI Module
 * ============================================================================
 * 
 * UI management: top bar, activities, quest markers
 * These methods are mixed into the Gieniobot class.
 * 
 * ============================================================================
 */

const UIMixin = {

  // ============================================
  // TOP BAR
  // ============================================

  updateTopBar() {
    let sk_status;
    let instances = [];
    let currentLevel = GAME.char_data.level;
    let currentTime = Date.now();
    let levelsGained = currentLevel - GAME.startLevel;
    let levelsPerHour = levelsGained / ((currentTime - GAME.startTime) / 1000 / 60 / 60);
    let lvlh = levelsPerHour.toFixed(2);

    let dbText = $(`#mdbp_${GAME.char_data.reborn}`).find('.db_owners').text().trim();
    if (dbText.indexOf("Smocze kule zostaną zresestowane za") !== -1) {
      sk_status = "AKTYWNE";
    } else {
      sk_status = $(`#mdbp_${GAME.char_data.reborn}`).find('.timer').length
        ? $(`#mdbp_${GAME.char_data.reborn}`).find('.timer').text()
        : "AKTYWNE";
    }

    let train_upgr = $("#train_uptime").find('.timer').text();
    if (train_upgr.length == 0 || train_upgr == "00:00:00") {
      train_upgr = "AKTYWNE";
    }

    if ('char_data' in GAME) {
      instances = [GAME.char_data.icd_1, GAME.char_data.icd_2, GAME.char_data.icd_3, GAME.char_data.icd_4, GAME.char_data.icd_5, GAME.char_data.icd_6];
    }

    let sum_instances = instances.reduce((a, b) => a + b, 0);
    let activity = $('#char_activity').text();
    let received = $("#act_prizes").find("div.act_prize.disabled").length;
    let is_trader = new Date();
    let trader = `<span class='kws_top_bar_section trader_info' style='cursor:pointer;'>HANDLARZ</span> `;

    var latencyColor;
    switch (true) {
      case (latency < 51): latencyColor = "lime"; break;
      case (latency < 100): latencyColor = "yellow"; break;
      case (latency < 140): latencyColor = "orange"; break;
      default: latencyColor = "red"; break;
    }

    let latencyElement = `<span class='kws_top_bar_section latencyElement' style='cursor:pointer;color:${latencyColor}'>⇅${latency}</span>`;
    let additionalStats = `<span class='kws_top_bar_section additional_stats' style='cursor:pointer;color:${this.additionalTopBarVisible ? "orange" : "white"}'>STATY</span>`;

    let instance = `${sum_instances}/12`;
    $("#secondary_char_stats .instance ul").html(instance);

    let activities = `${activity}/185 (${received}/5)`;
    $("#secondary_char_stats .activities ul").html(activities);

    let innerHTML = ` <span class='kws_top_bar_section sk_info' style='cursor:pointer;'>SK: <span style="color:${sk_status == "AKTYWNE" ? "lime" : "white"};">${sk_status}</span></span> <span class='kws_top_bar_section train_upgr_info' style='cursor:pointer;'>KODY: <span style="color:${train_upgr == "AKTYWNE" ? "lime" : "white"};">${train_upgr}</span></span><span class='kws_top_bar_section lvl' style='cursor:pointer;'>LVL: <span>${lvlh}/H</span></span><span class='kws_top_bar_section pvp' style='cursor:pointer;'>PVP: <span>${pvp_count}</span></span><span class='kws_top_bar_section arena' style='cursor:pointer;'>ARENA: <span>${arena_count}</span></span> ${is_trader.getDay() == 6 ? trader : ''} ${additionalStats} <span class='kws_top_bar_section version' style='cursor:pointer;'>v<span>${version}</span></span> ${latencyElement}`;
    $(".kws_top_bar").html(innerHTML);

    if (this.baselinePower == undefined) {
      this.baselinePower = GAME.char_data.moc;
    }
    if (this.baselineLevel == undefined) {
      this.baselineLevel = GAME.char_data.level;
    }

    let calculated_power = GAME.dots(GAME.char_data.moc - this.baselinePower);
    let calculatedPowerReset = `<span class='kws_additional_top_bar_section additional_stats_reset' style='cursor:pointer;color:"white"'>RESET</span>`;
    let futureStats = this.prepareFutureStatsData();
    let calculated_levels = GAME.dots(GAME.char_data.level - this.baselineLevel);

    $(".kws_additional_top_bar").html(` <span class='kws_additional_top_bar_section pvm_power' style='cursor:pointer;'>ZDOBYTA MOC: <span style="color:lime;">${calculated_power}</span></span> <span class='kws_additional_top_bar_section future_stats' style='cursor:pointer;'>${futureStats.length > 0 ? futureStats : ''}</span><span class='kws_additional_top_bar_section lvlsGained' style='cursor:pointer;'>ZDOBYTE LVL: <span>${calculated_levels}</span></span><span class='kws_additional_top_bar_section psk' style='cursor:pointer;'>PSK: ${GAME.dots(GAME.char_data.minor_ball)}</span> ${calculatedPowerReset}`);

    this.adjustCurrentCharacterId();
  },

  // ============================================
  // ACTIVITIES
  // ============================================

  collectActivities() {
    let received = $("#act_prizes").find("div.act_prize.disabled").length;
    let activity = parseInt($('#char_activity').text());
    let p = [25, 50, 75, 100, 150];
    for (let i = 0; i <= 5; i++) {
      if (received < 5 && activity >= p[i]) {
        let actPrize = $(`#act_prizes button[data-ind=${i}]`).closest(".act_prize");
        if (!actPrize.hasClass("disabled")) {
          GAME.socket.emit('ga', { a: 49, type: 1, ind: i });
        }
      }
    }
  },

  // ============================================
  // QUEST MARKERS
  // ============================================

  markDaily() {
    let daily = ["ZADANIE PVM", "Zadanie PvP", "ROZWÓJ PLANETY", "ZADANIE IMPERIUM", "ZADANIE KLANOWE", "NAJLEPSZY KUCHA...", "REPUTACJA", "SYMBOL WYMIARÓW", "WYMIANA CHI", "ERMITA", "Nuda", "DOSTAWCA", "BOSKA MOC", "ROZGRZEWKA", "BOSKI ULEPSZACZ", "CZAS PODRÓŻNIKÓ...", "STRAŻNIK PORZĄD...", "CODZIENNY INSTY...", "HIPER SCALACZ", "DZIWNY MEDYK"];
    daily = daily.map(item => item.trim().toLowerCase());
    let markedQuests = [];

    const questWithSep3 = document.querySelector('.sep3');
    const lastSep3Element = $('.sep3').last().closest('.qtrack');

    $('#quest_track_con .qtrack b').each(function () {
      let zawartoscB = $(this).text().trim().toLowerCase();
      if (daily.includes(zawartoscB) && !$(this).closest('.qtrack').find('.sep3').length) {
        if (!markedQuests.includes(zawartoscB)) {
          $(this).css("color", "#63aaff");
          if (!$(this).closest('.qtrack').hasClass('cloned')) {
            if (questWithSep3) {
              lastSep3Element.after($(this).closest('.qtrack').clone());
            } else {
              $('#drag_con').prepend($(this).closest('.qtrack').clone());
            }
            $(this).closest('.qtrack').addClass('cloned');
          }
          $(this).closest('.qtrack').remove();
          markedQuests.push(zawartoscB);
        }
      }
    });

    const currentLocation = String(GAME.char_data.loc).toLowerCase();
    $('[id^="track_quest_"]').each(function () {
      const questLoc = $(this).attr("data-loc").toLowerCase();
      let zawartoscB = $(this).find('b').first().text().trim().toLowerCase();
      if (questLoc === currentLocation && !$(this).find('.sep3').length) {
        if (!markedQuests.includes(zawartoscB)) {
          $(this).find('b').first().css("color", "yellow");
          if (!$(this).closest('.qtrack').hasClass('cloned')) {
            if (questWithSep3) {
              lastSep3Element.after($(this).closest('.qtrack').clone());
            } else {
              $('#drag_con').prepend($(this).closest('.qtrack').clone());
            }
            $(this).closest('.qtrack').addClass('cloned');
          }
          $(this).closest('.qtrack').remove();
          markedQuests.push(zawartoscB);
        }
      }
    });
  }
};

// Export mixin
window.UIMixin = UIMixin;
console.log('[UI] Module loaded');


// ========== remote/core/handlers/clan.js ==========
/**
 * ============================================================================
 * GIENIOBOT - Clan Module
 * ============================================================================
 * 
 * Clan-related features: assist, bless, buffs
 * These methods are mixed into the Gieniobot class.
 * 
 * ============================================================================
 */

const ClanMixin = {

  // ============================================
  // CLAN ASSIST
  // ============================================

  freeAssist() {
    let fafa_el = $(`button[data-option="clan_assist"]:visible`);
    if (fafa_el.length > 0) {
      let fafa_tid = parseInt(fafa_el.eq(0).attr("data-tid"));
      let fafa_target = parseInt(fafa_el.eq(0).attr("data-target"));
      GAME.socket.emit('ga', { a: 39, type: 55, tid: fafa_tid, target: fafa_target });
      fafa_el.eq(0).hide();
      setTimeout(() => {
        this.freeAssist();
      }, 2100);
    } else {
      GAME.socket.emit('ga', { a: 39, type: 54 });
      GAME.komunikat("Asystowano wszystkim!");
    }
  },

  // ============================================
  // AUTO BLESS
  // ============================================

  autobless() {
    let arr = $.map($('.use_buff:checked'), function (e, i) { return +e.value; });
    let btype = $('input[name="bless_type"]:checked').val();
    GAME.socket.emit('ga', { a: 14, type: 5, buffs: arr, players: $('#bless_players').val(), btype: btype });
    function komunikat() {
      kom_clear();
    }
    setTimeout(() => {
      komunikat();
    }, 1000);
  },

  // ============================================
  // CLAN BUFFS
  // ============================================

  activateAllClanBuffs() {
    let abut = $("#clan_buffs").find(`button[data-option="activate_war_buff"]`);
    let isDisabled = $("#clan_buffs").find(`button[data-option="activate_war_buff"]`).parents("tr").hasClass("disabled");
    let cpbt = $("#clan_planet_buffs").html();
    let acpbut = $("#has_clan_planet").find(`button[data-option="activate_prp_buff"]`);

    if (abut.length && !isDisabled) {
      GAME.socket.emit('ga', { a: 39, type: 26 });
      setTimeout(() => {
        this.activateAllClanBuffs();
      }, 200);
    } else if (cpbt == 0) {
      GAME.socket.emit('ga', { a: 39, type: 28 });
      setTimeout(() => {
        this.activateAllClanBuffs();
      }, 200);
    } else if (acpbut.length && $("#clan_planet_buffs .red").eq(0).text() == 0) {
      GAME.socket.emit('ga', { a: 39, type: 29 });
      setTimeout(() => {
        this.activateAllClanBuffs();
      }, 200);
    } else {
      GAME.komunikat("Wszystkie buffy zostały aktywowane!");
    }
  }
};

// Export mixin
window.ClanMixin = ClanMixin;
console.log('[Clan] Module loaded');


// ========== remote/core/handlers/map.js ==========
/**
 * ============================================================================
 * GIENIOBOT - Map Module
 * ============================================================================
 * 
 * Map-related features: quest parsing, location info
 * These methods are mixed into the Gieniobot class.
 * 
 * TODO: SK Finder needs to be rewritten from scratch
 * 
 * ============================================================================
 */

const MapMixin = {

  // ============================================
  // MAP INFO
  // ============================================

  parseMapInfo(quests, where) {
    let mapInfo = Object.values(quests).filter(this.filterQuests);
    let questsCoords = this.findQuests(mapInfo, GAME.map_quests);
    // SK finder disabled - needs rewrite
    let mapSK = Object.keys(GAME.map_balls) ? Object.keys(GAME.map_balls).length : 0;
    $(`#kws_locInfo .content`).html(`Zadania: ${mapInfo.length} ${questsCoords}SK: ${mapSK}`);
  },

  filterQuests(quest) {
    let steps = quest.length;
    if (steps > 0 && quest[steps - 1] && quest[steps - 1].end != 1) {
      return quest;
    }
  },

  // ============================================
  // QUEST FINDER
  // ============================================

  findQuests(mapInfo, quests) {
    let content = "<ul style='padding-inline-start: 15px;'>";

    mapInfo.forEach(infoArray => {
      if (infoArray[0] !== false) {
        let questData = infoArray[0];
        let qb_id = questData.qb_id.toString();
        let coord = '';

        for (let key in quests) {
          if (quests[key][0] && quests[key][0].qb_id === parseInt(qb_id)) {
            coord = key;
            break;
          }
        }

        if (coord) {
          let coordParts = coord.split('_').map(part => parseInt(part));
          let formattedKey = coordParts.join(' | ');
          content += `<li>${formattedKey}: ${questData.name}</li>`;
        }
      }
    });

    content += "</ul>";
    return content;
  }

  // TODO: findSK() - needs complete rewrite
};

// Export mixin
window.MapMixin = MapMixin;
console.log('[Map] Module loaded');


// ========== remote/core/handlers/pilot.js ==========
/**
 * ============================================================================
 * GIENIOBOT - Alternative Pilot Module
 * ============================================================================
 *
 * Virtual keyboard overlay for mobile/touch control.
 * Creates on-screen buttons that simulate keyboard input for map navigation.
 * Toggle on/off with "=" key or alt pilot button. Draggable with touch support.
 *
 * ============================================================================
 */

const PilotMixin = {

  _altPilotActive: false,

  toggleAlternativePilot() {
    if (this._altPilotActive) {
      this.destroyAlternativePilot();
    } else {
      this.createAlternativePilot();
    }
  },

  createAlternativePilot() {
    if (this._altPilotActive) return;

    // Hide original pilot
    this._hideOriginalPilot();

    // Inject styles (with ID for easy removal)
    if (!$('#kws_alt_pilot_styles').length) {
      $('head').append(`<style id="kws_alt_pilot_styles">
        #kws_alt_pilot_container {
          position: absolute;
          z-index: 9998;
          background: url(/gfx/layout/tloPilot.png);
          background-size: cover;
          border-image: url(/gfx/layout/mapborder.png) 7 8 7 7 fill;
          border-style: solid;
          border-width: 7px 8px 7px 7px;
          padding: 8px;
        }
        #kws_alt_pilot_header {
          background: url("https://i.imgur.com/Mi3kUpg.png");
          background-size: 100% 100%;
          padding: 5px 10px;
          cursor: move;
          text-align: center;
          color: #fff;
          font-family: 'Play', sans-serif;
          font-weight: bold;
          font-size: 14px;
          user-select: none;
          margin-bottom: 6px;
          border-radius: 3px;
        }
        #kws_alt_pilot_content {
          display: grid;
          grid-template-columns: auto auto;
          gap: 6px;
        }
        .kws_alt_col {}
        .kws_alt_group_label {
          color: #305779;
          font-family: 'Play', sans-serif;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 3px;
          padding-left: 2px;
        }
        .kws_alt_btn_group {
          display: grid;
          gap: 4px;
          margin-bottom: 6px;
        }
        .kws_alt_btn_group.g3 { grid-template-columns: repeat(3, 1fr); }
        .kws_alt_separator {
          border: none;
          border-top: 1px solid #305779;
          margin: 4px 0;
        }
        .kws_alt_btn {
          min-width: 60px;
          min-height: 60px;
          border-radius: 5px;
          border: 2px solid #305779;
          padding: 4px;
          background: rgba(4, 14, 19, 0.85);
          color: #fff;
          cursor: pointer;
          font-size: 22px;
          font-family: 'Play', sans-serif;
          font-weight: bold;
          text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
          transition: border-color 0.15s, box-shadow 0.15s;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .kws_alt_btn:hover { border-color: #3fc1c9; box-shadow: 0 0 8px 2px #3fc1c9; }
        .kws_alt_btn:active { background: rgba(63, 193, 201, 0.25); border-color: #f9ca24; }
        .kws_alt_btn.small {
          min-width: 52px;
          min-height: 52px;
          font-size: 14px;
        }
        .kws_alt_btn.close_btn {
          border-color: #993333;
          color: #ff6b6b;
          min-height: 28px;
          min-width: unset;
          font-size: 11px;
          padding: 3px 8px;
          opacity: 0.7;
        }
        .kws_alt_btn.close_btn:hover { border-color: #ff4444; box-shadow: 0 0 8px 2px #ff4444; opacity: 1; }
        .kws_alt_btn.txt_btn { font-size: 11px; line-height: 1.1; }
        .kws_alt_btn.ico_btn.clock { background-image: url('https://i.imgur.com/9YCvJKe.png'); background-size: contain; }
      </style>`);
    }

    // Build HTML - two columns: left = directions+actions, right = x5+combat
    const html = `
      <div id="kws_alt_pilot_container">
        <div id="kws_alt_pilot_header">PILOT</div>

        <div id="kws_alt_pilot_content">
          <div class="kws_alt_col">
            <div class="kws_alt_group_label">Kierunki</div>
            <div class="kws_alt_btn_group g3">
              <button id="klawiszq" class="kws_alt_btn">Q</button>
              <button id="klawiszw" class="kws_alt_btn">&#8593;</button>
              <button id="klawisze" class="kws_alt_btn">E</button>
              <button id="klawisza" class="kws_alt_btn">&#8592;</button>
              <button id="klawiszs" class="kws_alt_btn">&#8595;</button>
              <button id="klawiszd" class="kws_alt_btn">&#8594;</button>
              <button id="klawiszz" class="kws_alt_btn">Z</button>
              <button id="klawiszx" class="kws_alt_btn">X</button>
              <button id="klawiszc" class="kws_alt_btn">C</button>
            </div>
            <div class="kws_alt_group_label">Akcje</div>
            <div class="kws_alt_btn_group g3">
              <button id="klawiszy" class="kws_alt_btn">Y</button>
              <button id="klawiszr" class="kws_alt_btn">R</button>
              <button id="klawiszv" class="kws_alt_btn">V</button>
            </div>
          </div>

          <div class="kws_alt_col">
            <div class="kws_alt_group_label">Ruch x5</div>
            <div class="kws_alt_btn_group g3">
              <button id="klawiszqx3" class="kws_alt_btn small">Qx5</button>
              <button id="klawiszwx3" class="kws_alt_btn small">&#8593;x5</button>
              <button id="klawiszex3" class="kws_alt_btn small">Ex5</button>
              <button id="klawiszax3" class="kws_alt_btn small">&#8592;x5</button>
              <button id="klawiszsx3" class="kws_alt_btn small">&#8595;x5</button>
              <button id="klawiszdx3" class="kws_alt_btn small">&#8594;x5</button>
              <button id="klawiszzx3" class="kws_alt_btn small">Zx5</button>
              <button id="klawiszb5" class="kws_alt_btn small">B</button>
              <button id="klawiszcx3" class="kws_alt_btn small">Cx5</button>
              <button id="klawiszvx3" class="kws_alt_btn small">Vx5</button>
              <button id="klawiszn" class="kws_alt_btn small ico_btn clock" title="Zegarek (N)"></button>
            </div>
          </div>
        </div>

        <div style="margin-top:6px;">
          <div class="kws_alt_group_label">Skróty</div>
          <div class="kws_alt_btn_group" style="grid-template-columns: repeat(6, 1fr); margin-bottom:6px;">
            <!-- <button id="klawisz1" class="kws_alt_btn small">1</button> // native game key -->
            <button id="klawisz2" class="kws_alt_btn small txt_btn" title="Prywatna Planeta">PP</button>
            <button id="klawisz3" class="kws_alt_btn small txt_btn" title="Klanowa Planeta">PK</button>
            <button id="klawisz4" class="kws_alt_btn small txt_btn" title="Błogosławieństwo">BLESS</button>
            <button id="klawisz5" class="kws_alt_btn small txt_btn" title="VIP + Ekspedycja">VIP</button>
            <!-- <button id="klawisz6" class="kws_alt_btn small txt_btn" title="Postać klanowa">KLAN</button> -->
            <button id="klawisz7" class="kws_alt_btn small txt_btn" title="Ustaw wyprawę">WYP</button>
            <button id="klawisz8" class="kws_alt_btn small txt_btn" title="Zmień zestaw">SET</button>
            <!-- <button id="klawisz9" class="kws_alt_btn small">9</button> // native game key -->
          </div>
          <button id="klawiszspacja" class="kws_alt_btn close_btn" style="width:100%;">ZAMKNIJ</button>
        </div>
      </div>`;

    $('body').append(html);

    // Position at center of current viewport (works with mobile zoom)
    this._positionAltPilotInViewport();

    // Make draggable
    this._makeAltPilotDraggable();

    // Bind button handlers
    this.bindAlternativePilotButtons();

    this._altPilotActive = true;
  },

  destroyAlternativePilot() {
    $('#kws_alt_pilot_container').remove();
    $('#kws_alt_pilot_styles').remove();

    // Show original pilot
    this._showOriginalPilot();

    this._altPilotActive = false;
  },

  _positionAltPilotInViewport() {
    const el = document.getElementById('kws_alt_pilot_container');
    if (!el) return;

    // Calculate center of the current visible viewport
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    // Temporarily show to measure
    const elW = el.offsetWidth;
    const elH = el.offsetHeight;

    // Center horizontally, position near top third vertically
    let posX = scrollX + Math.max(0, (vpW - elW) / 2);
    let posY = scrollY + Math.max(10, (vpH - elH) / 3);

    el.style.left = posX + 'px';
    el.style.top = posY + 'px';
  },

  _hideOriginalPilot() {
    var kwsHidePilotElement = document.getElementById('kws_hidePilot');
    var mapPilotElement = document.getElementById('map_pilot');
    if (kwsHidePilotElement) {
      kwsHidePilotElement.value = '1';
      var changeEvent = new Event('change');
      kwsHidePilotElement.dispatchEvent(changeEvent);
      if (kwsHidePilotElement.value === '1' && mapPilotElement) {
        mapPilotElement.style.display = 'none';
      }
      var clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
      kwsHidePilotElement.dispatchEvent(clickEvent);
    }
  },

  _showOriginalPilot() {
    var kwsHidePilotElement = document.getElementById('kws_hidePilot');
    var mapPilotElement = document.getElementById('map_pilot');
    if (kwsHidePilotElement) {
      kwsHidePilotElement.value = '0';
      var changeEvent = new Event('change');
      kwsHidePilotElement.dispatchEvent(changeEvent);
      if (kwsHidePilotElement.value === '0' && mapPilotElement) {
        mapPilotElement.style.display = 'block';
      }
      var clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
      kwsHidePilotElement.dispatchEvent(clickEvent);
    }
  },

  _makeAltPilotDraggable() {
    const element = document.getElementById('kws_alt_pilot_container');
    const handle = document.getElementById('kws_alt_pilot_header');
    if (!element || !handle) return;

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
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      // Convert client coords to page coords (accounts for scroll/zoom)
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      let newX = scrollX + clientX - offsetX;
      let newY = scrollY + clientY - offsetY;

      // Keep within page bounds
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      element.style.left = newX + 'px';
      element.style.top = newY + 'px';
    };

    const onEnd = () => {
      isDragging = false;
      element.style.transition = '';
    };

    handle.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    handle.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  },

  bindAlternativePilotButtons() {
    const self = this;

    // Close button
    $('#klawiszspacja').click(() => self.destroyAlternativePilot());

    // Direction buttons
    $('#klawiszw').click(() => GAME.map_move(2));
    $('#klawiszq').click(() => GAME.map_move(6));
    $('#klawisze').click(() => GAME.map_move(5));
    $('#klawiszs').click(() => GAME.map_move(1));
    $('#klawisza').click(() => GAME.map_move(8));
    $('#klawiszd').click(() => GAME.map_move(7));
    $('#klawiszz').click(() => GAME.map_move(4));
    $('#klawiszc').click(() => GAME.map_move(3));

    // Action buttons
    $('#klawiszx').click(() => {
      self.questProceed();
      kom_clear();
      GAME.executeIx();
    });
    $('#klawiszr').click(() => GAME.emitOrder({ a: 13, mob_num: GAME.field_mob_id, fo: GAME.map_options.ma }));
    $('#klawiszy').click(() => GAME.emitOrder({ a: 444, max: GAME.spawner[0], ignore: GAME.spawner[1] }));
    $('#klawiszv').click(() => GAME.emitOrder({ a: 7, order: 2, quick: 1, fo: GAME.map_options.ma }));

    // Number buttons
    $('#klawisz1').click(() => {
      var keyEvent = jQuery.Event('keydown');
      keyEvent.which = 49;
      $(document).trigger(keyEvent);
    });
    $('#klawisz2').click(() => GAME.socket.emit('ga', { a: 15, type: 13 }));
    $('#klawisz3').click(() => GAME.socket.emit('ga', { a: 39, type: 32 }));
    $('#klawisz4').click(() => self.bless());
    $('#klawisz5').click(() => {
      setTimeout(() => GAME.socket.emit('ga', { a: 54, type: 0 }), 300);
      setTimeout(() => self.vip(), 600);
      GAME.socket.emit('ga', { a: 15, type: 7 });
    });
    $('#klawisz6').click(() => GAME.socket.emit('ga', { a: 39, type: 46, rent: 3 }));
    $('#klawisz7').click(() => GAME.socket.emit('ga', { a: 10, type: 2, ct: 0 }));
    $('#klawisz8').click(() => {
      let set = $("#ekw_sets").find(".option.ek_sets_all:not(.current)").attr("data-set");
      if (set != undefined) {
        GAME.socket.emit('ga', { a: 64, type: 2, set: set });
      }
    });
    $('#klawisz9').click(() => {
      var keyEvent = jQuery.Event('keydown');
      keyEvent.which = 57;
      $(document).trigger(keyEvent);
    });

    // x5 multiplier buttons
    const moveMultiple = (direction, times = 5, delay = 130) => {
      for (let i = 0; i < times; i++) {
        setTimeout(() => GAME.map_move(direction), i * delay);
      }
    };

    $('#klawiszqx3').click(() => moveMultiple(6));
    $('#klawiszwx3').click(() => moveMultiple(2));
    $('#klawiszex3').click(() => moveMultiple(5));
    $('#klawiszax3').click(() => moveMultiple(8));
    $('#klawiszsx3').click(() => moveMultiple(1));
    $('#klawiszdx3').click(() => moveMultiple(7));
    $('#klawiszzx3').click(() => moveMultiple(4));
    $('#klawiszcx3').click(() => moveMultiple(3));
    $('#klawiszvx3').click(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => GAME.emitOrder({ a: 7, order: 2, quick: 1, fo: GAME.map_options.ma }), i * 130);
      }
    });

    // Combat buttons
    $('#klawiszb5').click(() => self.pvpKill());
    $('#klawiszn').click(() => {
      self.useCompressor();
      kom_clear();
    });
  }
};

// Export mixin
window.PilotMixin = PilotMixin;
console.log('[Pilot] Module loaded');


// ========== remote/core/handlers/settings.js ==========
/**
 * ============================================================================
 * GIENIOBOT - Settings Module
 * ============================================================================
 * 
 * User settings: minimap, map size, pilot visibility, website background
 * These methods are mixed into the Gieniobot class.
 * 
 * ============================================================================
 */

const SettingsMixin = {

  // ============================================
  // MINIMAP SETTINGS
  // ============================================

  createMinimapSettings() {
    this.manageMinimapSettings("load");
    this.manageMapSize("load");
    this.managePilot();
    $("#field_sett #field_options").append(`<br style='clear:both;'><div id="kws_minimap_settings"> <b class='orange'>Ukryj pilota kontroli postaci: </b><div class="select_input"><select id="kws_hidePilot"><option value="1" ${this.hidePilot == 1 ? "selected" : ""}>tak</option><option value="0" ${this.hidePilot == 0 ? "selected" : ""}>Nie</option></select></div> <b class='orange'>Minimapa wyświetlana ze strony: </b><div class="select_input"><select id="minimap_side"><option value="0" ${this.minimap.side == 0 ? "selected" : ""}>Prawej</option><option value="1" ${this.minimap.side == 1 ? "selected" : ""}>Lewej</option><option value="2" ${this.minimap.side == 2 ? "selected" : ""}>L - Poza</option></select></div> <b class='orange'>Przeźroczystość minimapy: </b><input id="minimap_range" type="range" value="${this.minimap.opacity}" min="10" max="100" step="1"> <b class='orange'>Dodatkowe informacje o lokacji: </b><div class="select_input"><select id="kws_sh_locInfo"><option value="1" ${this.minimap.loc_info == 1 ? "selected" : ""}>Pokaż</option><option value="0" ${this.minimap.loc_info == 0 ? "selected" : ""}>Ukryj</option></select></div> <b class='orange'>Rozmiar mapy: </b>X: <input name="kws_map_width" class="smin_input" style="width:30px;" type="text" value="${this.mapsize.x}" placeholder="13"> Y: <input name="kws_map_height" class="smin_input" style="width:30px;" type="text" value="${this.mapsize.y}" placeholder="13"><button class="smin_butt kws_mapsize_change" style="margin-left:5px;">Zmień</button><button class="smin_butt kws_mapsize_reset" style="margin-left:5px;">Reset</button> </div>`);
  },

  manageMinimapSettings(act) {
    if (act == "load") {
      this.minimap = JSON.parse(localStorage.getItem('kws_minimap'));
      if (this.minimap == undefined) {
        this.minimap = {
          side: 0,
          opacity: 100,
          loc_info: 0
        };
        localStorage.setItem('kws_minimap', JSON.stringify(this.minimap));
      }
    } else if (act == "save") {
      localStorage.setItem('kws_minimap', JSON.stringify(this.minimap));
    }
  },

  /**
   * Preset backgrounds list - easy to add/remove
   * Format: { name: "Display Name", device: "📱💻" or "📱" or "💻", url: "image url" }
   */
  BACKGROUND_PRESETS: [
    { name: "Goku & Broly", device: "📱💻", url: "https://i.imgur.com/UUrVU0D.png" },
    { name: "Gogeta", device: "📱💻", url: "https://i.imgur.com/QLVhKjP.png" },
    { name: "Gogeta", device: "📱", url: "https://i.imgur.com/b7JHw4m.png" },
    { name: "Gogeta Blue & Broly", device: "💻", url: "https://i.imgur.com/J4Rva2Z.png" },
    { name: "Goku SSJ4", device: "📱💻", url: "https://i.imgur.com/CkfXXff.jpeg" },
    { name: "Goku SSJ4", device: "📱💻", url: "https://i.imgur.com/TPLgg9C.png" },
    { name: "Goku SSJ4", device: "📱", url: "https://i.imgur.com/hgufEgp.jpeg" },
    { name: "Goku UI", device: "📱", url: "https://i.imgur.com/SWyXYKu.png" },
    { name: "Goku UI", device: "💻", url: "https://i.imgur.com/Ldq7GLI.jpeg" },
    { name: "Gogeta & Janemba", device: "📱", url: "https://i.imgur.com/uJRiOtZ.jpeg" },
    { name: "Buu", device: "📱💻", url: "https://i.imgur.com/Ch0SqnI.gif" },
  ],

  /**
   * Generate HTML for background preset select dropdown
   */
  getBackgroundPresetsSelectHTML() {
    let options = '<option value="">-- Wybierz tło --</option>';
    this.BACKGROUND_PRESETS.forEach((preset, idx) => {
      options += `<option value="${idx}">${preset.name} (${preset.device})</option>`;
    });
    return options;
  },

  // ============================================
  // WEBSITE BACKGROUND
  // ============================================

  setWebsiteBackground() {
    if (localStorage.getItem('kws_wbg')) {
      this._applyBackgroundStyles(localStorage.getItem('kws_wbg'));
      $("#new_website_bg").val(localStorage.getItem('kws_wbg'));
      $("footer").addClass("hide_before");
    }
  },

  /**
   * Apply background styles with mobile-friendly settings
   * @param {string} url - Background image URL
   * @param {boolean} isDefault - Whether this is the default game background
   */
  _applyBackgroundStyles(url, isDefault = false) {
    // Detect mobile device
    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // On mobile, use scroll instead of fixed (iOS has issues with fixed backgrounds)
    // Also use different background-size on mobile for better visibility
    const bgStyles = {
      "background-color": "#02070D",
      "background-image": `url(${url})`,
      "background-repeat": "no-repeat",
      "background-position": "center top",
      "background-size": "cover",
      "background-attachment": "fixed"
    };

    $("body").css(bgStyles);

    // Inject mobile-specific CSS if not already present
    if (!document.getElementById('kws-bg-mobile-css')) {
      const style = document.createElement('style');
      style.id = 'kws-bg-mobile-css';
      style.textContent = `
        @media (max-width: 768px) {
          body {
            background-position: center top !important;
            background-attachment: scroll !important;
            min-height: 100vh;
          }
        }
        @media (max-width: 480px) {
          body {
            background-size: auto 100vh !important;
            background-position: center top !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  },

  manageWebsiteBackground(act, url) {
    if (act == "set") {
      if (url.length > 5) {
        localStorage.setItem('kws_wbg', url);
        this._applyBackgroundStyles(url);
        $("footer").addClass("hide_before");
      }
    } else if (act == "reset") {
      localStorage.removeItem("kws_wbg");
      $("#new_website_bg").val("");
      this._applyBackgroundStyles('/gfx/layout/bg.jpg', true);
      $("footer").removeClass("hide_before");
    }
  },

  // ============================================
  // MAP SIZE
  // ============================================

  changeMapSize(rx = 13, ry = 13) {
    rx = Math.floor(rx);
    ry = Math.floor(ry);
    GAME.map.cX = rx * 40;
    GAME.map.cY = ry * 40;
    GAME.map.rX = rx;
    GAME.map.rY = ry;
    if (GAME.map.initiated) {
      GAME.loadMapJson(function () {
        GAME.socket.emit('ga', {
          a: 3,
          vo: GAME.map_options.vo
        }, 1);
      });
    }
    if (rx > 13) {
      let pgm_w = 963 + (rx - 13) * 40;
      $("#page_game_map").css("width", pgm_w);
    } else {
      $("#page_game_map").css("width", "963px");
    }
    $("#map_canvas_container").css({
      "width": `${GAME.map.cX + 14}px`,
      "height": `${GAME.map.cY + 14}px`
    });
  },

  manageMapSize(act, size = [13, 13]) {
    if (act == "load") {
      this.mapsize = JSON.parse(localStorage.getItem('kws_mapsize'));
      if (this.mapsize == undefined) {
        this.mapsize = {
          x: 13,
          y: 13
        };
        localStorage.setItem('kws_mapsize', JSON.stringify(this.mapsize));
      } else if (this.mapsize.x != 13 || this.mapsize.y != 13) {
        this.changeMapSize(this.mapsize.x, this.mapsize.y);
      }
    } else if (act == "change") {
      this.changeMapSize(size[0], size[1]);
      this.mapsize.x = size[0];
      this.mapsize.y = size[1];
      localStorage.setItem('kws_mapsize', JSON.stringify(this.mapsize));
    } else {
      this.changeMapSize();
      this.mapsize.x = 13;
      this.mapsize.y = 13;
      $(`input[name="kws_map_width"]`).val(13);
      $(`input[name="kws_map_height"]`).val(13);
      localStorage.setItem('kws_mapsize', JSON.stringify(this.mapsize));
    }
  },

  // ============================================
  // PILOT VISIBILITY
  // ============================================

  managePilot(act = false, val = 0) {
    if (act == "set") {
      localStorage.setItem('kws_pilot', val);
      this.hidePilot = val;
      this.managePilot();
    } else {
      this.hidePilot = localStorage.getItem('kws_pilot');
      if (this.hidePilot == undefined) {
        localStorage.setItem('kws_pilot', 0);
        this.hidePilot = 0;
      }
      if (this.hidePilot == 1) {
        $("#map_pilot").hide();
      } else {
        $("#map_pilot").show();
      }
    }
  }
};

// Export mixin
window.SettingsMixin = SettingsMixin;
console.log('[Settings] Module loaded');


// ========== remote/core/handlers/combat.js ==========
/**
 * ============================================================================
 * GIENIOBOT - Combat Module
 * ============================================================================
 * 
 * Combat and quest actions: VIP rewards, bless, quest proceed, PVP, compressor
 * These methods are mixed into the Gieniobot class.
 * 
 * ============================================================================
 */

const CombatMixin = {

  // ============================================
  // VIP REWARDS
  // ============================================

  vip() {
    var month = $("#monthly_vip_rewards").find(".vip_cat.option" + ":not(.disabled)" + ":not(.received)");
    var general = $("#general_vip_rewards").find(".vip_cat.option" + ":not(.disabled)" + ":not(.received)");
    if (month.length) {
      var id = parseInt(month.attr("data-vip"));
      var lvl = parseInt(month.attr("data-level"));
      GAME.socket.emit('ga', {
        a: 54,
        type: 1,
        vip: id,
        level: lvl
      });
      setTimeout(() => {
        this.vip();
      }, 500);
    } else if (general.length) {
      var id = parseInt(general.attr("data-vip"));
      var lvl = parseInt(general.attr("data-level"));
      GAME.socket.emit('ga', {
        a: 54,
        type: 1,
        vip: id,
        level: lvl
      });
      setTimeout(() => {
        this.vip();
      }, 500);
    } else {
      GAME.komunikat("Odebrano wszystkie możliwe nagrody z Vipa!!!");
    }
  },

  // ============================================
  // BLESS
  // ============================================

  bless() {
    GAME.socket.emit('ga', {
      a: 14,
      type: 3
    });
    setTimeout(() => {
      var arr = $.map($('.use_buff:checked'), function (e, i) {
        return +e.value;
      });
      var btype = $('input[name="bless_type"]:checked').val();
      GAME.socket.emit('ga', {
        a: 14,
        type: 5,
        buffs: arr,
        players: $('#bless_players').val(),
        btype: btype
      });
    }, 500);
  },

  // ============================================
  // QUEST PROCEED
  // ============================================

  questProceed() {
    if (JQS.qcc.is(":visible")) {
      if ($("button[data-option=finish_quest]").length === 1) {
        let qb_id = $("button[data-option=finish_quest]").attr("data-qb_id");
        GAME.socket.emit('ga', {
          a: 22,
          type: 2,
          button: 1,
          id: qb_id
        });
      } else if ($("button[data-option=quest_riddle]").is(":visible")) {
        let qb_id = $("button[data-option=quest_riddle]").attr("data-qid");
        GAME.socket.emit('ga', {
          a: 22,
          type: 7,
          id: qb_id,
          ans: $('#quest_riddle').val()
        });
      } else if ($("button[data-option=quest_duel]").is(":visible")) {
        let fb_id = $("button[data-option=quest_duel]").attr("data-qid");
        GAME.socket.emit('ga', {
          a: 22,
          type: 6,
          id: fb_id
        });
      } else if ($(".quest_win .sekcja").text().toLowerCase() === "nuda" && $("button[data-option=finish_quest]").length === 3) {
        let qb_id = $("button[data-option=finish_quest]").attr("data-qb_id");
        GAME.socket.emit('ga', {
          a: 22,
          type: 2,
          button: 2,
          id: qb_id
        });
      } else if ($(".quest_win .sekcja").text().toLowerCase().startsWith("zadanie substancji") && $("button[data-option=finish_quest]").length === 3) {
        let qb_id = $("button[data-option=finish_quest]").attr("data-qb_id");
        GAME.socket.emit('ga', {
          a: 22,
          type: 2,
          button: 3,
          id: qb_id
        });
      } else if ($("button[data-option=finish_quest]").length === 2 && $("button[data-option=finish_quest]").eq(1).html() === "Mam dość tej studni") {
        let qb_id = $("button[data-option=finish_quest]").eq(1).attr("data-qb_id");
        GAME.socket.emit('ga', {
          a: 22,
          type: 2,
          button: 2,
          id: qb_id
        });
      } else if ($("#field_opts_con .sekcja").html() == "Zasoby") {
        let qb_id = $("#field_opts_con .field_option").find("[data-option=start_mine]").attr("data-mid");
        GAME.socket.emit('ga', {
          a: 22,
          type: 8,
          mid: qb_id
        });
      } else if ($(".quest_action").is(":visible")) {
        GAME.questAction()
      }
      setTimeout(() => {
        $('#fight_view').fadeOut();
      }, 500);
      kom_clear();
    } else if ($("button[data-option=start_mine]").length >= 1) {
      let mineID = parseInt($("button[data-option=start_mine]").attr("data-mid"));
      GAME.socket.emit('ga', {
        a: 22,
        type: 8,
        mid: mineID
      });
    }
  },

  // ============================================
  // PVP KILL
  // ============================================

  pvpKill() {
    if (!JQS.chm.is(":focus")) {
      let opponents = $("#player_list_con").find(".player button" + "[data-quick=1]" + ":not(.initial_hide_forced)");
      if ($("button[data-option='load_more_players']").is(":visible")) {
        $("button[data-option='load_more_players']").click();
        setTimeout(() => {
          this.pvpKill();
        }, 110);
      } else if (opponents.length > 0) {
        opponents.eq(0).click();
        setTimeout(() => {
          this.pvpKill();
        }, 110);
      }
    }
  },

  // ============================================
  // USE COMPRESSOR
  // ============================================

  useCompressor() {
    if (JQS.qcc.is(":visible")) {
      let compressors_button = $("#quest_con button[data-option=compress_items]");
      let quest_id = compressors_button.attr("data-qb_id");
      if (compressors_button.length === 1 && GAME.compress_items[0].stack > 0) {
        GAME.socket.emit('ga', {
          a: 22,
          type: 10,
          item_id: GAME.compress_items[0].id,
          qb_id: quest_id
        });
      }
    }
  }
};

// Export mixin
window.CombatMixin = CombatMixin;
console.log('[Combat] Module loaded');


// ========== remote/core/handlers/game-overrides.js ==========
/**
 * ============================================================================
 * GIENIOBOT - GAME Object Overrides
 * ============================================================================
 * 
 * This module contains overrides for native GAME.* methods.
 * These are applied after the kws instance is created.
 * 
 * Overrides:
 * - GAME.komunikat2
 * - GAME.cached_data
 * - GAME.parseQuickOpts
 * - GAME.parseTracker
 * - GAME.getEmpDetails
 * - GAME.abbreviateNumber
 * - GAME.questAction
 * - GAME.parseQuest
 * - GAME.endQuest
 * - GAME.moveQuest
 * - GAME.parseLocBons
 * - GAME.emit
 * - GAME.emitOrder
 * - GAME.initiate
 * 
 * ============================================================================
 */

function setupGameOverrides() {
  // ============================================
  // KOMUNIKAT2 - Custom message display
  // ============================================
  GAME.komunikat2 = function (kom) {
    if (this.koms.indexOf(kom) == -1) {
      if (this.komc > 50) this.komc = 40;
      var ind = this.koms.push(kom) - 1;
      JQS.kcc.append(`<div class="kom" style="top:130px; width:480px;"><div class="close_kom" data-ind="${ind}"><b>X</b></div><div class="content">${kom}</div></div>`);
      this.komc++;
      kom_close_bind();
    }
  };

  // ============================================
  // CACHED_DATA - Initial data handling
  // ============================================
  GAME.cached_data = function () {
    var pos = $('#char_buffs').offset();
    pos.left -= 75;
    pos.top -= 75;
    this.char_buffs_pos = pos;
    if (GAME.char_id != 0 && GAME.quick_opts.online_reward) {
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 26, type: 1 });
        setTimeout(() => {
          $('#daily_reward').fadeOut();
          kom_clear();
        }, 400);
      }, 1800);
    }
    // Soul card set dropdown is always visible (no need to show/hide)
    setTimeout(() => {
      if (GAME.emp_wars.length < 3 && GAME.quick_opts.empire) {
        setTimeout(() => { kws.wojny2(); }, 300);
      }
    }, 1500);
    GAME.startLevel = GAME.char_data.level;
    GAME.startTime = Date.now();
    setTimeout(() => {
      if (GAME.char_data.planetary == 0) {
        setTimeout(() => {
          GAME.socket.emit('ga', { a: 39, type: 34 });
        }, 300);
      }
    }, 1200);
    const emitCalls = [{ a: 33, type: 0 }, { a: 49, type: 0 }, { a: 29, type: 0 }];
    let cd = [300, 600, 900];
    emitCalls.forEach((data, i) => {
      setTimeout(() => { GAME.socket.emit('ga', data); }, cd[i]);
    });
    $('#train_uptime').html(GAME.showTimer(GAME.char_data.train_ucd - GAME.getTime()));
    setTimeout(() => {
      if (kws.check_act()) {
        $("#secondary_char_stats .activities").click();
      }
    }, 1200);
    GAME.parseQuickOpts(1);
    // Inject tournament wins row into char_stats_container when it appears
    new MutationObserver((_, obs) => {
      const container = document.getElementById('char_stats_container');
      if (!container) return;
      if (container.querySelector('.afo-tourn-wins')) { obs.disconnect(); return; }
      const rows = container.querySelectorAll('tr');
      for (const row of rows) {
        if (row.firstElementChild && row.firstElementChild.textContent.trim() === 'Wykonane zadania codzienne') {
          const tr = document.createElement('tr');
          tr.classList.add('afo-tourn-wins');
          tr.innerHTML = `<td>Wygrane turnieje</td><td></td><td>${GAME.dots(GAME.char_data.tourn_wins)}</td>`;
          row.after(tr);
          obs.disconnect();
          break;
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
    kws.workers_info = [false, false];
    arena_count = 0;
    pvp_count = 0;
    // Card set names are now handled by AFO_SOUL_CARD_SETS module
    setTimeout(() => {
      if (GAME.pid != 59314 && (GAME.char_data.reborn == 4 || GAME.char_data.reborn == 5 || GAME.char_data.reborn == 6) && GAME.char_data.alt_transform_expiry < GAME.getTime()) {
        GAME.socket.emit('ga', { a: 18, type: 8, tech_id: 134 });
      }
    }, 5300);
  };

  // ============================================
  // PARSE QUICK OPTS - Quick bar options
  // ============================================
  GAME.parseQuickOpts = function (newq_bar = false) {
    var opts = '';
    if (this.quick_opts.tutorial) {
      this.tutorials = this.quick_opts.tutorial;
      opts += `<img id="open_tuts" src="/gfx/layout/helper.png" class="qlink2 option" data-option="open_tuts" data-toggle="tooltip" data-original-title="<div class=tt>${LNG.lab358}</div>" />`;
      $.getJSON('/json/tutorial.json', function (json) {
        GAME.tutorial_data = json.tuts;
        GAME.checkTutorial();
      });
    }
    if (this.quick_opts.private_planet) opts += `<div class="option qlink priv" data-option="private_teleport" data-toggle="tooltip" data-original-title="<div class=tt>${LNG.lab138}</div>"></div>`;
    if (this.quick_opts.teleport) opts += `<div class="option qlink tele" data-option="use_teleport" data-toggle="tooltip" data-original-title="<div class=tt>${LNG.lab140}</div>"></div>`;
    if (this.quick_opts.travel) opts += `<div class="option qlink trav" data-option="use_travel" data-toggle="tooltip" data-original-title="<div class=tt>${LNG.lab141}</div>"></div>`;
    if (this.quick_opts.ssj) {
      opts += `<div class="option qlink ssj${this.quick_opts.ssj[0] == "116" ? "_uio" : this.quick_opts.ssj[1]} show_qat" data-option="use_transform" data-tech="${this.quick_opts.ssj[0]}"data-toggle="tooltip" data-original-title="<div class=tt>${LNG.lab139}</div>"></div>`;
      opts += `<div id="quick_allTransformations"></div>`;
    }
    if (this.quick_opts.online_reward) opts += `<div class="option qlink dail" data-option="daily_reward" data-toggle="tooltip" data-original-title="<div class=tt>${LNG.lab176}</div>"></div>`;
    if (this.quick_opts.bless) opts += `<div class="select_page qlink bles" data-page="game_buffs" data-toggle="tooltip" data-original-title="<div class=tt>${LNG.lab188}</div>"></div>`;
    if (this.quick_opts.sub && this.quick_opts.sub.length) opts += `<div class="option qlink subs" data-option="quick_use_subs" data-toggle="tooltip" data-original-title="<div class=tt>${LNG.lab189}</div>"></div>`;
    if (this.quick_opts.senzus && this.quick_opts.senzus.length) {
      opts += `<div class="option qlink senz" data-option="quick_use_senzu" data-toggle="tooltip" data-original-title="<div class=tt>${LNG.lab190}</div>"></div>`;
    }
    if (this.quick_opts.empire) {
      opts += `<div class="select_page qlink emp${this.quick_opts.empire} empPos" data-page="game_empire" data-toggle="tooltip" data-original-title="<div class=tt>${LNG['empire' + this.quick_opts.empire]}</div>"></div>`;
      opts += `<div class="go_to_emp_con"> <div class="qlink go_to_emp emp1" style="filter:hue-rotate(168deg);" emp="1" data-toggle="tooltip" data-original-title="<div class=tt>Wejdź na siedzibę</div>"></div> <div class="qlink go_to_emp emp2" style="filter:hue-rotate(168deg);" emp="2" data-toggle="tooltip" data-original-title="<div class=tt>Wejdź na siedzibę</div>"></div> <div class="qlink go_to_emp emp3" style="filter:hue-rotate(168deg);" emp="3" data-toggle="tooltip" data-original-title="<div class=tt>Wejdź na siedzibę</div>"></div> <div class="qlink go_to_emp emp4" style="filter:hue-rotate(168deg);" emp="4" data-toggle="tooltip" data-original-title="<div class=tt>Wejdź na siedzibę</div>"></div> </div>`;
    }
    if (newq_bar || GAME.char_id) {
      opts += '<br>';
      if (GAME.clan_laws) {
        opts += `<div class="option qlink priv" style="filter:hue-rotate(168deg);" data-option="clan_planet_travel" data-toggle="tooltip" data-original-title="<div class=tt>Planeta klanowa</div>"></div>`;
      }
      if (GAME.char_data.klan_rent == 0) {
        opts += `<div class="qlink get_titles_list" style="background-image: url('https://i.imgur.com/k88insr.png');" data-toggle="tooltip" data-original-title="<div class=tt>Zmień tytuł</div>"></div>`;
      }
      opts += `<div class="qlink load_afo" style="background-image: url('https://i.imgur.com/pOti3b8.png');" data-toggle="tooltip" data-original-title="<div class=tt>Załaduj Gieniobota</div>"></div>`;
      // Dynamic positioning for side icons - no gaps when some are hidden
      let sideIconIndex = 0;
      const getSideIconTop = () => -136 + (sideIconIndex++ * 32);

      opts += `<div class="qlink sideIcons manage_auto_abyss${kws.auto_abyss ? ' kws_active_icon' : ''}" style="background-repeat: no-repeat; background-position: center; background-image: url('https://i.imgur.com/j5eQv2B.png');display:block;top:${getSideIconTop()}px;position:absolute;" data-toggle="tooltip" data-original-title="<div class=tt>[Włącz / Wyłącz] Atakowanie Otchłani</div>"></div>`;
      const arenaTop = getSideIconTop();
      opts += `<div class="qlink sideIcons manage_auto_arena${kws.auto_arena ? ' kws_active_icon' : ''}" style="background-repeat: no-repeat; background-position: center; background-image: url('https://i.imgur.com/XQz5nRu.png');display:block;top:${arenaTop}px;position:absolute;" data-toggle="tooltip" data-original-title="<div class=tt>[Włącz / Wyłącz] Atakowanie na Arenie</div>"></div>`;
      opts += ` <div class="autoArenaBuff" style="top:${arenaTop}px;"> <div style="padding-left:8px;"> <label for="aePvpBuff" style="cursor:pointer;">PVP BUFF</label> <div class="newCheckbox"><input type="checkbox" id="aePvpBuff" name="aePvpBuff" ${kws.settings.aePvpBuff ? "checked" : ""} /><label for="aePvpBuff"></label></div> </div> </div>`;
      const expeTop = getSideIconTop();
      opts += `<div class="qlink sideIcons manage_autoExpeditions${kws.autoExpeditions ? ' kws_active_icon' : ''}" style="background-repeat: no-repeat; background-position: center; background-image: url('https://i.imgur.com/v1M3iIS.png');display:block;top:${expeTop}px;position:absolute;" data-toggle="tooltip" data-original-title="<div class=tt>[Włącz / Wyłącz] Automatyczne Wyprawy</div>"></div>`;
      opts += ` <div class="autoExpeCodes" style="top:${expeTop}px;"> <div style="padding-left:8px;"> <label for="aeCodes" style="cursor:pointer;">KODY</label> <div class="newCheckbox"><input type="checkbox" id="aeCodes" name="aeCodes" ${kws.settings.aeCodes ? "checked" : ""} /><label for="aeCodes"></label></div> </div> </div>`;
      // Clan Assist toggle - only visible when klan_id != 0 and reborn >= 1
      const canShowClanAssist = GAME.char_data && GAME.char_data.klan_id && GAME.char_data.klan_id !== 0 && GAME.char_data.reborn >= 1;
      const clanAssistEnabled = typeof CLAN_ASSIST !== 'undefined' && CLAN_ASSIST.enabled !== false;
      if (canShowClanAssist) {
        opts += `<div class="qlink sideIcons manage_auto_clanAssist${clanAssistEnabled ? ' kws_active_icon' : ''}" style="background-repeat: no-repeat; background-position: center; background-image: url('https://i.imgur.com/DbP8Snj.png');display:block;top:${getSideIconTop()}px;position:absolute;" data-toggle="tooltip" data-original-title="<div class=tt>[Włącz / Wyłącz] Automatyczne Asysty</div>"></div>`;
      }
      // Kukla Guardian toggle (Strażnik Kukli)
      const kuklaGuardianEnabled = typeof KUKLA_GUARDIAN !== 'undefined' && KUKLA_GUARDIAN.enabled === true;
      opts += `<div class="qlink sideIcons manage_kukla_guardian${kuklaGuardianEnabled ? ' kws_active_icon' : ''}" style="background-repeat: no-repeat; background-position: center; background-image: url('https://i.imgur.com/5mP0N9b.png');display:block;top:${getSideIconTop()}px;position:absolute;" data-toggle="tooltip" data-original-title="<div class=tt>[Włącz / Wyłącz] Strażnik Kukli</div>"></div>`;
    }
    $('#quick_bar').html(opts);
    if (GAME.char_id && GAME.char_data.klan_rent === 0) {
      kws.listQts();
      if ("empire" in GAME.quick_opts) {
        kws.goEmpPos();
      }
    }
    option_bind();
    tooltip_bind();
    page_bind();
  };

  // ============================================
  // PARSE TRACKER - Quest tracker
  // ============================================
  GAME.parseTracker = function (track) {
    GAME.socket.emit('ga', { a: 22, type: 3 });
    track.sort((a, b) => a.want.type - b.want.type);
    var con = '';
    let zwykle_html_dsa = '';
    let codzienne_html_dsa = '';
    let main_quest = ``;
    var any = false;
    if (track && track.length) {
      var len = track.length;
      for (var i = 0; i < len; i++) {
        any = true;
        var qn = track[i].header;
        if (qn.length > 15) qn = qn.slice(0, 15) + '...';
        let attroqq = $(`#page_game_qb #qb_list #quest_log_tr${track[i].qb_id}`).find(`.qb_right:contains("[ Codzienne ]")`).length;
        if (track[i].m == 1) {
          main_quest += `<div id="track_quest_${track[i].qb_id}" class="qtrack option" data-option="go_teleport" data-loc="${track[i].loc}"><div class="sep3"></div><b style="color:orange;">${qn}</b> ${this.quest_want(track[i].want, track[i].qb_id)}</div>`;
        } else if (attroqq == 1) {
          codzienne_html_dsa += `<div id="track_quest_${track[i].qb_id}" class="qtrack option" data-option="go_teleport" data-loc="${track[i].loc}"><div class="sep2"></div><b style="color:#63aaff;" >${qn}</b> ${this.quest_want(track[i].want, track[i].qb_id)}</div>`;
        } else {
          zwykle_html_dsa += `<div id="track_quest_${track[i].qb_id}" class="qtrack option" data-option="go_teleport" data-loc="${track[i].loc}"><div class="sep2"></div><b>${qn}</b> ${this.quest_want(track[i].want, track[i].qb_id)}</div>`;
        }
      }
    }
    if (any) {
      con += codzienne_html_dsa;
      con += zwykle_html_dsa;
      $('#drag_con').html(`${main_quest}${con}`);
      $('#drag_con').removeClass('scroll');
      $('#quest_track_con').show();
      if (!kws.settings.hide_tracker) {
        $('#drag_con').show();
      } else {
        $('#drag_con').hide();
      }
    } else {
      $('#quest_track_con').hide();
    }
    kws.markDaily();
  };

  // ============================================
  // GET EMP DETAILS - Employee details
  // ============================================
  GAME.getEmpDetails = function (petd) {
    kws.findWorker(petd, (el) => {
      let emp_local = parseInt(el.attr("data-emp_local"));
      el.after(`<button class="newBtn do_all_instances" data-emp="${petd.id}" data-emp_local="${emp_local}">Wykonaj wszystkie instancje</button>`);
    });
    var res = '<div class=ptt>';
    var nextp = this.employe_exp(petd.level + 1);
    res += '<img src=/gfx/employee/' + petd.type + '.png width=100 align=left /><b>' + petd.name + '</b><br /><b>' + LNG['emptyp' + petd.type] + '</b> - <b class=item' + petd.class + '>' + LNG['item_class' + petd.class] + '</b><br />' + LNG.lab1 + ': <b>' + this.dots(petd.level) + '</b><br />EXP: <b>' + this.dots(petd.exp) + ' / ' + this.dots(nextp) + '</b><br /><br /><b class=orange>' + LNG.lab286 + '</b><br />';
    res += LNG.lab313 + ': <b>' + petd.energy + '</b> / <b>' + petd.maxenergy + '</b><br />';
    if (petd.qualified) res += '<b class=green>' + LNG.lab314 + '</b><br />';
    res += '</div>';
    return res;
  };

  // ============================================
  // ABBREVIATE NUMBER - Number formatting
  // ============================================
  GAME.abbreviateNumber = function (number, decPlaces = 2) {
    decPlaces = Math.pow(10, decPlaces);
    var abbrev = ["K", "M", "Mld", "B", "Bld", "T", "Quad", "Quin", "Sext", "Sep", "Oct", "Non", "Dec", "Und", "Duo", "Tre", "Quat", "Quind", "Sexd", "Sept", "Octo", "Nove", "Vigi"];
    for (var i = abbrev.length - 1; i >= 0; i--) {
      var size = Math.pow(10, (i + 1) * 3);
      if (size <= number) {
        number = Math.floor(number * decPlaces / size) / decPlaces;
        if ((number == 1000) && (i < abbrev.length - 1)) {
          number = 1;
          i++;
        }
        number += ' ' + abbrev[i];
        break;
      }
    }
    return number;
  };

  // ============================================
  // QUEST ACTION - Quest action handler
  // ============================================
  GAME.questAction = () => {
    if (GAME.quest_action && GAME.quest_action_count < GAME.quest_action_max) {
      GAME.socket.emit('ga', {
        a: 22,
        type: 7,
        id: GAME.quest_action_qid,
        cnt: GAME.quest_action_max
      });
    }
    setTimeout(() => { kws.markDaily(); }, 100);
  };

  // ============================================
  // PARSE QUEST - Quest display
  // ============================================
  GAME.parseQuest = function (res) {
    var quest = res.q_step;
    var con = '<div class="quest_win diff' + quest.difficulty + '"><div class="sekcja">' + quest.header + '</div><div class="option closeicon" data-option="close_quest"></div><div class="quest_desc scroll"><span class="qtitle">&raquo; ' + quest.title + '</span><hr />' + this.parseContent(quest.content).replaceAll('&player', '<b class="orange">' + this.char_data.name + '</b>').replaceAll('&Player', '<b class="orange">' + this.char_data.name + '</b>') + '</div>';
    var qrdy = true;
    var conf = '';
    if (quest.want) {
      var extr = '';
      var extr1 = '';
      var extr2 = '';
      var extr3 = '';
      if (quest.difficulty > 0) {
        var ratio = this.getDiffQuestRatio(1, quest.difficulty);
        if (ratio < 1) extr = '<span class="green"> - ' + (100 - ratio * 100) + '% </span>';
        else extr = '<span class="red"> + ' + (ratio * 100 - 100) + '% </span>';
      }
      if (quest.can_roll) {
        extr += '<div class="quest_roll option" data-option="quest_roll" data-qb_id="' + quest.qb_id + '" data-toggle="tooltip" data-original-title="<div class=tt>Losuj inną trudność zadania<br />Koszt: 1 Kostka do Gry</div>"></div>';
        extr1 += '<div class="quest_roll1 option" data-option="quest_roll1" data-qb_id="' + quest.qb_id + '" data-toggle="tooltip" data-original-title="<div class=tt>Losuj -50%<br />Koszt: 1 Kostka do Gry</div>"></div>';
        extr2 += '<div class="quest_roll2 option" data-option="quest_roll2" data-qb_id="' + quest.qb_id + '" data-toggle="tooltip" data-original-title="<div class=tt>Losuj 150% lub 200%<br />Koszt: 1 Kostka do Gry</div>"></div>';
        extr3 += '<div class="quest_roll3 option" data-option="quest_roll3" data-qb_id="' + quest.qb_id + '" data-toggle="tooltip" data-original-title="<div class=tt>Losuj 200%<br />Koszt: 1 Kostka do Gry</div>"></div>';
      }
      con += '<div class="quest_desc">';
      qrdy = quest.want.is_met;
      con += '<div><b>' + LNG.lab18 + '</b>:<br />' + this.quest_want(quest.want, quest.qb_id, 1, quest.difficulty) + ' ' + extr + ' ' + extr1 + ' ' + extr2 + ' ' + extr3 + '</div>';
      if (quest.time_limit) {
        con += '<div>' + LNG.lab145 + ': ' + this.showTimer(quest.want.tl - this.getTime()) + '<button class="newBtn option" data-option="quest_try_again" data-qb_id="' + quest.qb_id + '">' + LNG.lab146 + '</button></div>';
      }
      con += '</div>';
    }
    if (quest.prize) {
      var extr = '';
      if (quest.difficulty > 0) {
        con += '<div class="quest_desc disabled"><b>' + LNG.lab452 + '</b>:<br />' + this.quest_prize(quest.prize) + '</div>';
        var ratio = this.getDiffQuestRatio(0, quest.difficulty);
        if (ratio < 1) extr = '<span class="red"> - ' + (100 - ratio * 100) + '% </span>';
        else extr = '<span class="green"> + ' + (ratio * 100 - 100) + '% </span>';
        var ratio2 = this.getDiffQuestRatio(2, quest.difficulty);
        if (ratio2 > 0) extr += '<span class="orange"> ' + ratio2 + '% szansy na Magiczną Rudę</span>';
        if (quest.prize.type == 7 || quest.prize.type == 52 || quest.prize.type == 57) quest.prize.amount = parseInt(quest.prize.amount * ratio);
        else quest.prize.id = parseInt(quest.prize.id * ratio);
        if (quest.prize.hasOwnProperty("exp")) quest.prize.exp = parseInt(quest.prize.exp * ratio);
        if (quest.prize.hasOwnProperty("add")) quest.prize.add = parseInt(quest.prize.add * ratio);
        con += '<div class="quest_desc"><b>' + LNG.lab21 + '</b>:<br />' + this.quest_prize(quest.prize) + ' ' + extr + '</div>';
      } else {
        con += `<div class="quest_desc"><b>${LNG.lab21}</b>:<br />${this.quest_prize(quest.prize)} ${quest.prize.type === 40 ? kws.calcLVL(quest.prize.exp) : ""}</div>`;
      }
      if (quest.prize.type >= 99) conf = 'data-confirm="1"';
    }
    if (qrdy) {
      con += '<button class="option ans" data-option="finish_quest" ' + conf + ' data-button="1" data-qb_id="' + quest.qb_id + '">' + quest.buttton1 + '</button>';
      if (quest.buttton2) con += '<button class="option ans" data-option="finish_quest" data-button="2" data-qb_id="' + quest.qb_id + '">' + quest.buttton2 + '</button>';
      if (quest.buttton3) con += '<button class="option ans" data-option="finish_quest" data-button="3" data-qb_id="' + quest.qb_id + '">' + quest.buttton3 + '</button>';
    }
    con += '</div>';
    JQS.qcc.html(con).show();
    option_bind();
    qaction_bind();
    main_ekw_item_bind();
    tooltip_bind();
    if (res.q_step.want.riddle) {
      kws.solveRiddle(res.q_step.want.riddle);
    }
    setTimeout(() => {
      if (quest.difficulty != 6 && quest.difficulty != 5 && questRollActive2 && JQS.qcc.is(":visible")) {
        GAME.socket.emit('ga', { a: 22, type: 12, id: quest.qb_id });
      } else {
        questRollActive2 = false;
      }
    }, 300);
    setTimeout(() => {
      if (quest.difficulty != 6 && questRollActive3 && JQS.qcc.is(":visible")) {
        GAME.socket.emit('ga', { a: 22, type: 12, id: quest.qb_id });
      } else {
        questRollActive3 = false;
      }
    }, 300);
    setTimeout(() => {
      if (quest.difficulty != 1 && questRollActive1 && JQS.qcc.is(":visible")) {
        GAME.socket.emit('ga', { a: 22, type: 12, id: quest.qb_id });
      } else {
        questRollActive1 = false;
      }
    }, 300);
  };

  // ============================================
  // END QUEST - Quest completion
  // ============================================
  GAME.endQuest = function (quest_end) {
    JQS.qcc.hide();
    $('#field_q_' + quest_end).fadeOut();
    for (var ind in this.map_quests) {
      if (this.map_quests.hasOwnProperty(ind)) {
        var len = this.map_quests[ind].length;
        for (var i = 0; i < len; i++) {
          if (this.map_quests[ind][i].qb_id == quest_end) {
            this.map_quests[ind][i].end = 1;
          }
        }
      }
    }
    if (GAME.map_quests) {
      kws.parseMapInfo(GAME.map_quests, "GAME.endQuest");
    }
  };

  // ============================================
  // MOVE QUEST - Quest location change
  // ============================================
  GAME.moveQuest = function (quest_move) {
    if (this.char_data.loc == quest_move.loc) {
      JQS.qcc.hide();
      $('#field_q_' + quest_move.qb_id).fadeOut();
      for (var ind in this.map_quests) {
        if (this.map_quests.hasOwnProperty(ind)) {
          var len = this.map_quests[ind].length;
          for (var i = 0; i < len; i++) {
            if (this.map_quests[ind][i].qb_id == quest_move.qb_id) {
              this.map_quests[ind][i].move = {
                new_x: quest_move.x,
                new_y: quest_move.y,
                start: this.getmTime(),
                duration: 300
              };
            }
          }
        }
      }
      if (GAME.map_quests) {
        kws.parseMapInfo(GAME.map_quests, "GAME.moveQuest");
      }
    } else this.endQuest(quest_move.qb_id);
  };

  // ============================================
  // PARSE LOC BONS - Location bonuses
  // ============================================
  GAME.parseLocBons_o = GAME.parseLocBons;
  GAME.parseLocBons = function (loc_data) {
    kws.parseMapInfo(GAME.map_quests, "GAME.parseLocBons");
    return GAME.parseLocBons_o(loc_data);
  };

  // ============================================
  // EMIT - Socket emit wrapper
  // ============================================
  GAME.emit = function (order, data, force) {
    if (!this.is_loading || force) {
      this.load_start();
      this.socket.emit(order, data);
    } else {
      console.log('[GAME.emit] BLOCKED emit - is_loading is true:', order, data);
      if (this.debug) console.log('failed order', order, data);
    }
  };

  // ============================================
  // EMIT ORDER - Simplified emit
  // ============================================
  GAME.emitOrder = function (data, force = false) {
    this.emit('ga', data, force);
  };

  // ============================================
  // INITIATE - Game initialization
  // ============================================
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

  console.log('[GameOverrides] All GAME.* overrides applied');
}

// Export function
window.setupGameOverrides = setupGameOverrides;
console.log('[GameOverrides] Module loaded');


// ========== remote/core/handlers/empire.js ==========
/**
 * ============================================================================
 * GIENIOBOT - Empire Module
 * ============================================================================
 * 
 * Empire wars and related functionality.
 * These methods are mixed into the Gieniobot class.
 * 
 * ============================================================================
 */

const EmpireMixin = {

  // ============================================
  // EMPIRE WARS
  // ============================================

  wojny2() {
    var aimp = $("#e_admiral_player").find("[data-option=show_player]").attr("data-char_id");
    var imp = $("#leader_player").find("[data-option=show_player]").attr("data-char_id");
    if (!empireDataLoaded) {
      setTimeout(() => {
        GAME.socket.emit('ga', {
          a: 50,
          type: 0,
          empire: GAME.char_data.empire
        });
      }, 100);
      empireDataLoaded = true;
      setTimeout(() => {
        this.wojny2();
      }, 300);
    } else if (!GAME.emp_enemies.includes(1) && ![GAME.char_data.empire].includes(1) && (kws.check_imp().includes(GAME.char_id) || kws.check_imp2().includes(GAME.char_id) || imp == GAME.char_id || aimp == GAME.char_id)) {
      GAME.socket.emit('ga', { a: 50, type: 7, target: 1 });
      setTimeout(() => { this.wojny2(); }, 300);
    } else if (!GAME.emp_enemies.includes(2) && ![GAME.char_data.empire].includes(2) && (kws.check_imp().includes(GAME.char_id) || kws.check_imp2().includes(GAME.char_id) || imp == GAME.char_id || aimp == GAME.char_id)) {
      GAME.socket.emit('ga', { a: 50, type: 7, target: 2 });
      setTimeout(() => { this.wojny2(); }, 300);
    } else if (!GAME.emp_enemies.includes(3) && ![GAME.char_data.empire].includes(3) && (kws.check_imp().includes(GAME.char_id) || kws.check_imp2().includes(GAME.char_id) || imp == GAME.char_id || aimp == GAME.char_id)) {
      GAME.socket.emit('ga', { a: 50, type: 7, target: 3 });
      setTimeout(() => { this.wojny2(); }, 300);
    } else if (!GAME.emp_enemies.includes(4) && ![GAME.char_data.empire].includes(4) && (kws.check_imp().includes(GAME.char_id) || kws.check_imp2().includes(GAME.char_id) || imp == GAME.char_id || aimp == GAME.char_id)) {
      GAME.socket.emit('ga', { a: 50, type: 7, target: 4 });
      setTimeout(() => { this.wojny2(); }, 300);
    }
  },

  check_imp() {
    var tab = [];
    for (var i = 0; i < 3; i++) {
      tab[i] = parseInt($("#empire_heroes .activity").eq(i).find("[data-option=show_player]").attr("data-char_id"));
    }
    return tab;
  },

  check_imp2() {
    var tab = [];
    for (var i = 0; i < 3; i++) {
      tab[i] = parseInt($("#empire_efrags .activity").eq(i).find("[data-option=show_player]").attr("data-char_id"));
    }
    return tab;
  }
};

// Export mixin
window.EmpireMixin = EmpireMixin;
console.log('[Empire] Module loaded');


// ========== remote/core/handlers/tournaments.js ==========
/**
 * ============================================================================
 * GIENIOBOT - Tournaments Module
 * ============================================================================
 * 
 * Tournament signing and management functionality.
 * These methods are mixed into the Gieniobot class.
 * 
 * ============================================================================
 */

const TournamentsMixin = {

  findTournamentCategory() {
    for (var type = 2; type <= 2; type++) {
      for (var cat = 1; cat <= 69; cat++) {
        if (GAME.isYourTourCat(type, cat, GAME.char_data.reborn, GAME.char_data.level)) {
          this.tournamentCategory = cat;
        }
      }
    }
  },

  checkTournamentsSigning() {
    if (this.isCheckingTournaments) { return; }
    this.isCheckingTournaments = true;
    var currentServerTime = new Date(GAME.getTime() * 1000);
    var currentServerHour = currentServerTime.getHours();
    var currentServerMinute = currentServerTime.getMinutes();

    if (currentServerHour > 20 || currentServerHour < 18) {
      this.tourSigned = false;
      this.tournamentCategory = undefined;
      this.newTournamentID = undefined;
      this.isCheckingTournaments = false;
    } else if (!this.tourSigned) {
      if ((currentServerHour == 18 && currentServerMinute > 9) || (currentServerHour > 18 && currentServerHour < 21)) {
        this.tourSigned = true;
        this.findTournamentCategory();
        setTimeout(() => {
          if (this.tournamentCategory <= 54) {
            GAME.emitOrder({ a: 57, type: 0, type2: 0, page: 1 });
          } else {
            GAME.emitOrder({ a: 57, type: 0, type2: 0, page: 2 });
          }
        }, 500);
        setTimeout(() => { GAME.emitOrder({ a: 57, type: 1, tid: this.newTournamentID }); }, 1000);
        setTimeout(() => { GAME.emitOrder({ a: 57, type: 4 }); }, 1500);
        setTimeout(() => { kom_clear(); }, 2000);
        setTimeout(() => { this.setTimerForTournamentsReset(); }, 5000);
      } else {
        this.isCheckingTournaments = false;
      }
    }
  },

  setTimerForTournamentsReset() {
    this.isCheckingTournaments = false;
  }
};

// Export mixin
window.TournamentsMixin = TournamentsMixin;
console.log('[Tournaments] Module loaded');


// ========== remote/features/soulCardSets.js ==========
/**
 * ============================================================================
 * SOUL CARD SETS - Predefined Card Set Manager
 * ============================================================================
 * 
 * Moduł do zarządzania predefiniowanymi zestawami kart dusz.
 * Automatycznie zakłada karty na podstawie wybranego zestawu.
 * 
 * USAGE:
 * - Wybierz zestaw z dropdowna w topbarze
 * - Moduł automatycznie wyczyści sloty i założy odpowiednie karty
 * 
 * CONFIGURATION:
 * - Ustaw karty w sekcji SETS poniżej
 * - Każdy zestaw to tablica ID typów kart (numer z /gfx/cards/XX.png)
 * - Kolejność = priorytet (pierwsze karty będą zakładane pierwsze)
 * 
 * ============================================================================
 */

const AFO_SOUL_CARD_SETS = {
  // ============================================
  // CONFIGURATION
  // ============================================

  // Delay między akcjami (ms) - zwiększ jeśli serwer laguje
  DELAY_BETWEEN_ACTIONS: 200,

  // Delay po przełączeniu na stronę kart (ms)
  DELAY_PAGE_SWITCH: 700,

  // Max retry dla weryfikacji założenia karty
  MAX_EQUIP_RETRIES: 3,

  // ============================================
  // ZESTAWY KART - EDYTUJ TUTAJ
  // ============================================
  // Format: 'Nazwa zestawu': [cardTypeId1, cardTypeId2, ...]
  // cardTypeId = numer z /gfx/cards/XX.png (np. 42 dla Puar)
  // Kolejność = priorytet (pierwsze karty zakładane pierwsze)

  sets: {
    'Biedak': [], // Specjalny zestaw - zdejmuje wszystkie karty
    'Kody': [
      24, // Vegito
      16, // Black
      19, // Gotenks
      2, // Vegeta
      10, // Bulma
      33, // Dyspo
      45, // Vados
      44, // Whis
      46 // Kapłan
    ],
    'Trening': [
      2, // Vegeta
      16, // Black
      32, // Jiren
      17, // Brolly DBS
      18, // Paragus
      20, // Cheelai
      21, // Beerus
      40, // Champa
      45 // Vados
    ],
    'Senzu': [
      40, // Champa
      35, // MajinBuu
      21, // Beerus
      25, // Freezer
      15, // Mr Satan
      14, // Videl
      7, // Gohan
      8, // Pan
      44 // Whis
    ],
    'Kryształy': [
      41, // Yamcha
      24, // Vegito
      17, // Brolly DBS
      20, // Cheelai
      9, // Trunks
      45 // Vados
    ],
    'Exp': [
      31, // Toppo
      3, // Brolly
      2, // Vegeta
      10, // Bulma
      13, // Goten
      12, // Roshi
      44, // Whis
      45, // Vados
      46 // Kapłan
    ],
    'Moc': [
      32, // Jiren
      1, // Goku
      6, // Krillin
      12, // Roshi
      19, // Gotenks
      22, // Hit
      44, // Whis
      45, // Vados
      46 // Kapłan
    ],
    'PvP': [
      1, // Goku
      20, // Cheelai
      42, // Puar
      21, // Beerus
      15, // Mr Satan
      44, // Whis
      45, // Vados
      46, // Kapłan
      24, // Vegito
    ],
    'Zbierajki': [
      10, // Bulma
      42, // Puar
      5, // C17
      31, // Toppo
      33, // Dyspo
      24, // Vegito
    ],
    'Ulepszanie': [
      37, // Doctor Gero
      13, // Goten
      7, // Gohan
      8, // Pan
      25, // Freezer
      14, // Videl
      15, // Mr Satan
      10, // Bulma
      44, // Whis
    ],
    'Smocze kule': [
      26, // Dende
      10, // Bulma
      1, // Goku
      2, // Vegeta
      6, // Krillin
      7, // Gohan
      41, // Yamcha
      25, // Freezer
      23, // Teen Gohan
    ]
  },

  // ============================================
  // STATE
  // ============================================
  isSwitching: false,

  // ============================================
  // METHODS
  // ============================================

  /**
   * Przełącza na wybrany zestaw kart
   * @param {string} setName - Nazwa zestawu
   * @returns {Promise<boolean>} - Czy operacja się powiodła
   */
  async switchToSet(setName) {
    if (this.isSwitching) {
      GAME.komunikat('Zmiana zestawu już w toku...');
      return false;
    }

    // Specjalny przypadek: 'Bez kart' - tylko czyścimy sloty
    if (setName === 'Biedak') {
      this.isSwitching = true;
      try {
        await this.ensureCardsPageLoaded();
        const availableSlots = this.getAvailableSlots();
        await this.clearAllSlots(availableSlots);
        this.saveCurrentSet(setName);
        GAME.komunikat('Biedny frajerze nawet kart nie masz');
        return true;
      } catch (error) {
        console.error('[SoulCardSets] Error clearing cards:', error);
        return false;
      } finally {
        this.isSwitching = false;
      }
    }

    const cardTypeIds = this.sets[setName];
    if (!cardTypeIds || cardTypeIds.length === 0) {
      GAME.komunikat(`Zestaw "${setName}" jest pusty lub nie istnieje!`);
      return false;
    }

    this.isSwitching = true;
    console.log(`[SoulCardSets] Switching to set: ${setName}`, cardTypeIds);

    try {
      // 1. Upewnij się że strona kart jest załadowana
      await this.ensureCardsPageLoaded();

      // 2. Pobierz liczbę dostępnych slotów
      const availableSlots = this.getAvailableSlots();
      console.log(`[SoulCardSets] Available slots: ${availableSlots}`);

      // 3. Wyczyść wszystkie sloty
      await this.clearAllSlots(availableSlots);

      // 4. Załóż karty z zestawu
      const equippedCount = await this.equipCards(cardTypeIds, availableSlots);

      // 5. Zapisz aktualny zestaw
      this.saveCurrentSet(setName);

      GAME.komunikat(`Zestaw "${setName}" - założono ${equippedCount} kart`);
      return true;

    } catch (error) {
      console.error('[SoulCardSets] Error switching set:', error);
      GAME.komunikat(`Błąd przy zmianie zestawu: ${error.message}`);
      return false;

    } finally {
      this.isSwitching = false;
    }
  },

  /**
   * Upewnia się że strona kart jest załadowana
   */
  async ensureCardsPageLoaded() {
    const slotsContainer = $('#sc_slots');

    // Sprawdź czy mamy klasę z liczbą slotów (np. slots2, slots9)
    const hasSlotClass = slotsContainer.attr('class')?.match(/slots\d+/);

    if (!hasSlotClass) {
      console.log('[SoulCardSets] Cards page not loaded, fetching data...');
      GAME.emitOrder({a: 58, type: 0});
      await this.delay(this.DELAY_PAGE_SWITCH);
    }
  },

  /**
   * Pobiera liczbę dostępnych slotów z klasy #sc_slots
   * @returns {number}
   */
  getAvailableSlots() {
    const slotsContainer = $('#sc_slots');
    const classMatch = slotsContainer.attr('class')?.match(/slots(\d+)/);

    if (classMatch) {
      return parseInt(classMatch[1], 10);
    }

    // Fallback - policz sloty w DOM
    return $('#sc_slots .card_slot').length || 6;
  },

  /**
   * Czyści wszystkie sloty
   * @param {number} slotCount - Liczba slotów do wyczyszczenia
   */
  async clearAllSlots(slotCount) {
    console.log(`[SoulCardSets] Clearing ${slotCount} slots...`);

    for (let slot = 1; slot <= slotCount; slot++) {
      const slotElement = $(`#card_slot${slot}`);

      // Sprawdź czy slot ma założoną kartę
      if (slotElement.find('.small_card').length > 0) {
        GAME.emitOrder({ a: 58, type: 2, slot: slot });
        await this.delay(this.DELAY_BETWEEN_ACTIONS);
      }
    }

    // Poczekaj chwilę na synchronizację
    await this.delay(this.DELAY_BETWEEN_ACTIONS);
  },

  /**
   * Zakłada karty z zestawu
   * @param {number[]} cardTypeIds - Tablica ID typów kart
   * @param {number} maxSlots - Maksymalna liczba slotów
   * @returns {Promise<number>} - Liczba założonych kart
   */
  async equipCards(cardTypeIds, maxSlots) {
    let equippedCount = 0;

    for (const cardTypeId of cardTypeIds) {
      if (equippedCount >= maxSlots) {
        console.log('[SoulCardSets] All slots filled, stopping.');
        break;
      }

      // Znajdź najlepszą kartę tego typu (najwyższy tier)
      const card = this.findBestCard(cardTypeId);

      if (!card) {
        console.log(`[SoulCardSets] Card type ${cardTypeId} not available, skipping.`);
        continue;
      }

      console.log(`[SoulCardSets] Equipping card ${card.id} (type ${cardTypeId}, tier ${card.tier})`);

      // Załóż kartę
      const success = await this.equipCardWithVerification(card.id, equippedCount + 1);

      if (success) {
        equippedCount++;
      }
    }

    return equippedCount;
  },

  /**
   * Zakłada kartę i weryfikuje czy została założona
   * @param {number} cardId - ID karty do założenia
   * @param {number} expectedSlot - Oczekiwany numer slotu
   * @returns {Promise<boolean>}
   */
  async equipCardWithVerification(cardId, expectedSlot) {
    for (let attempt = 1; attempt <= this.MAX_EQUIP_RETRIES; attempt++) {
      GAME.emitOrder({ a: 58, type: 1, card: cardId });
      await this.delay(this.DELAY_BETWEEN_ACTIONS);

      // Weryfikuj czy karta została założona
      const slotElement = $(`#card_slot${expectedSlot}`);
      if (slotElement.find('.small_card').length > 0) {
        return true;
      }

      console.log(`[SoulCardSets] Equip attempt ${attempt} failed, retrying...`);
      await this.delay(this.DELAY_BETWEEN_ACTIONS);
    }

    console.warn(`[SoulCardSets] Failed to equip card ${cardId} after ${this.MAX_EQUIP_RETRIES} attempts`);
    return false;
  },

  /**
   * Znajduje najlepszą kartę danego typu (najwyższy tier)
   * @param {number} cardTypeId - ID typu karty (z /gfx/cards/XX.png)
   * @returns {{id: number, tier: number}|null}
   */
  findBestCard(cardTypeId) {
    const cards = $(`#sc_upgrades .small_card`);
    let bestCard = null;
    let bestTier = -1;

    cards.each((_, cardEl) => {
      const $card = $(cardEl);
      const imgSrc = $card.find('img').attr('src');

      // Pobierz ID typu z src (np. "/gfx/cards/42.png" -> 42)
      const typeMatch = imgSrc?.match(/\/gfx\/cards\/(\d+)\.png/);
      if (!typeMatch) return;

      const type = parseInt(typeMatch[1], 10);
      if (type !== cardTypeId) return;

      // Pobierz tier (wartość w <span>)
      const tier = parseInt($card.find('span').first().text(), 10) || 1;

      if (tier > bestTier) {
        bestTier = tier;
        bestCard = {
          id: parseInt($card.attr('data-card_id'), 10),
          tier: tier
        };
      }
    });

    return bestCard;
  },

  /**
   * Helper do czekania
   * @param {number} ms - Czas w milisekundach
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Zwraca listę dostępnych zestawów
   * @returns {string[]}
   */
  getSetNames() {
    return Object.keys(this.sets);
  },

  /**
   * Zwraca klucz localStorage dla aktualnego serwera i postaci
   * @returns {string}
   */
  getStorageKey() {
    const server = GAME.server || 0;
    const charId = GAME.char_data?.id || 0;
    return `sc_set_${server}_${charId}`;
  },

  /**
   * Zapisuje aktualny zestaw do localStorage
   * @param {string} setName
   */
  saveCurrentSet(setName) {
    try {
      localStorage.setItem(this.getStorageKey(), setName);
      console.log(`[SoulCardSets] Saved current set: ${setName}`);
    } catch (e) {
      console.warn('[SoulCardSets] Failed to save current set:', e);
    }
  },

  /**
   * Ładuje ostatnio używany zestaw z localStorage
   * @returns {string|null}
   */
  loadCurrentSet() {
    try {
      return localStorage.getItem(this.getStorageKey());
    } catch (e) {
      console.warn('[SoulCardSets] Failed to load current set:', e);
      return null;
    }
  }
};

// Export
window.AFO_SOUL_CARD_SETS = AFO_SOUL_CARD_SETS;
console.log('[SoulCardSets] Module loaded');


// ========== remote/core/gieniobot.js ==========
/**
 * ============================================================================
 * GIENIOBOT MASTER - Main Bot Logic
 * ============================================================================
 * 
 * Version: 2.3.1
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
 * Lines 2762-2770: ballManager & ekwipunek initialization
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
  var version = '2.3.1';

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
        this.addToCSS(`.kws_top_bar{float:left !important; position: absolute; z-index: -1;} .kws_top_bar_section{color:white;padding:3px 5px 3px 5px;border-radius:5px;margin-right:8px;user-select:none;}`);
        this.addToCSS(`.go_to_emp_con{ position:absolute; top:33px; z-index:1; background:rgb(0 0 0 / 59%); display:none; flex-direction: column-reverse; padding:5px 5px 0px 5px; border-radius:5px; box-shadow:0px 0px 5px 0px rgb(32 96 185);} .empPos:hover + .go_to_emp_con, .go_to_emp_con:hover { display:flex; } .go_to_emp_con .qlink { display:block; margin:0px 0px 5px 0px; }`);
        this.addToCSS(`#ekw_sets_buy button, div[data-option="change_ekw_set"]{height:20px !important; line-height:19px !important; margin-top:9px !important;}`);
        this.addToCSS(`#page_game_camp .ekw_slot.smaller img{ width: 64px; } #page_game_camp div[data-item_id="1923"].smaller img { width: 32px; position: absolute; margin-top: -64px; margin-left: 34px; }`);
        this.addToCSS(`#kws_spawn{ background: rgba(0,0,0,0.9); position: fixed; top: 120px;left: 5px; z-index: 9999; width: 200px; padding: 1px; border-radius: 5px; border-style: solid; border-width: 7px 8px 7px 7px; display:block; user-select: none; color: #333333; } #kws_spawn .sekcja { position: absolute; top: -27px; left: -7px; background: rgba(0,0,0,0.9); filter: hue-rotate(150deg); background-size: 100% 100%; width: 200px; cursor: all-scroll; } #kws_spawn .spawn_row{border-bottom:solid gray 1px; color: white; font-size: 13px; display: flex; padding:4px;}`);
        $("#map_canvas_container").append(`<div id="kws_spawn"> <div class="sekcja"><img src="/gfx/layout/war.png" class="spawn_switch">USTAWIENIA SPAWNU</div><div id="kws_spawn2" style="">${this.spawnList()}</div>`);
        this.addToCSS(`#sc_set_select{background:#040e13;color:#fff;font-family:'Play',sans-serif;font-size:13px;padding:3px 8px;border:1px solid white;border-radius:5px;margin:3px 5px 0 0;cursor:pointer;height:24px;float:right;} #sc_set_select:hover{border-color:orange;} #sc_set_select option{background:#040e13;color:#fff;}`);
        this.addToCSS(`#kws_bg_preset_select{background:#040e13;color:#fff;font-family:'Play',sans-serif;font-size:13px;padding:3px 8px;border:1px solid #305779;border-radius:5px;cursor:pointer;} #kws_bg_preset_select:hover{border-color:orange;} #kws_bg_preset_select option{background:#040e13;color:#fff;}`);
        this.addToCSS(`#sc_sets .sc_sets_all { min-width: 40px; width: auto; padding: 0 5px; } .cards_set_name_input { background: #040e13; height: 31px; width: 180px; border: solid #ffffff4d 1px; display: inline-block; text-align: center; font-size: 13px; color: #305779; font-family: 'Play', sans-serif; vertical-align: middle; border-radius: 5px; margin-right: 5px; } .cards_set_name_button { margin-top: 2px; }`);
        this.addToCSS(`.spawn_switch{cursor:pointer;}`);
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
        this.addToCSS(`.kws_additional_top_bar{float:left !important; position: absolute; z-index: -1; display: none} .kws_additional_top_bar_section{color:white;padding:3px 5px 3px 5px;border-radius:5px;margin-right:8px;user-select:none;}`);
        $("#top_bar").append(`<div class="kws_top_bar"></div>`);
        $("#top_bar").append(`<div class="kws_additional_top_bar"></div>`);
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

    // ballManager and ekwipunek initialized after all scripts loaded
    let kulka = null;
    let ekwipunekObj = null;

    // Wait for ballManager to be available
    let ballWait = setInterval(() => {
      if (typeof ballManager !== 'undefined' && typeof ekwipunekMenager !== 'undefined') {
        clearInterval(ballWait);
        kulka = new ballManager();
        ekwipunekObj = new ekwipunekMenager();
        console.log('[Gieniobot] ballManager and ekwipunek initialized');
      }
    }, 100);
  }
  )
}

// ========== remote/features/ball/ballExp.js ==========
class ballExp {
  constructor() {
      this.expText = 'Exp do NEXT';
      this.expNonStopText = 'Exp no stop';
      this.stopText = 'STOP';
      this.synergy = parseInt($("#ss_synergy_lvl").html());
      this.hasStarted = false;
      this.nonStopExp = false;
      $("body").on("click", `button[data-option="ss_page"][data-page="upgrade"]`, () => {
          this.showExpButtons();
      });
      $("body").on("click", `button[data-option="ss_page"][data-page="reset"], #soulstone_interface .closeicon`, () => {
          if(this.hasStarted) {
              this.stopUpgrading();
          }
          this.hideExpButtons();
      });
      $("body").on("click", `button[data-option="ss_lvlup_next"]`, () => {
          this.controller();
      });
      $("body").on("click", `button[data-option="ss_lvlup_nonstop"]`, () => {
          this.nonStopExp = true;
          this.controller();
      });
  }

  controller() {
      if (this.hasStarted) {
          this.hasStarted = false;
          this.nonStopExp = false;
          this.stopUpgrading();
      } else {
          this.hasStarted = true;
          this.startUpgrading()
      }
      this.switchButtonText();
  }

  startUpgrading() {
      GAME.completeProgress = () => {
          var res = GAME.progress;
          switch (res.a) {
              case 45:
                  if (res.ball) {
                      GAME.parseData(55, res);
                      if (this.hasStarted) {
                          this.upgrade();
                      }
                  }
                  break;
          }
          delete GAME.progress;
      }

      this.upgrade();
  }

  stopUpgrading() {
      GAME.completeProgress = () => {
          var res = GAME.progress;
          switch (res.a) {
              case 45:
                  if (res.ball) {
                      GAME.parseData(55, res);
                  }
                  break;
          }
          delete GAME.progress;
      }

      if (this.hasStarted) {
          this.controller()
      }
  }

  upgrade() {
      var expKuli = $('#ss_exp').text();
      var expKuliBezSpacji = expKuli.replace(/\s/g, '');
      var expKuliPodzielony = expKuliBezSpacji.split('/');
      var expKuli = parseInt(expKuliPodzielony[0]);
      var expKuliPotrzebny = parseInt(expKuliPodzielony[1]);
      
      if (expKuli < expKuliPotrzebny || this.nonStopExp) {
          GAME.emitOrder({ a: 45, type: 3, bid: GAME.ball_id });
      } else {
          this.stopUpgrading();
      }
  }

  showExpButtons() {
      $("#soulstone_interface > div.pull-left.ball_stats > div > div.main_bar").after('<button id="ss_lvlup_next" class="btn_small_gold option" data-option="ss_lvlup_next">Exp do NEXT</button>');
      $("#soulstone_interface > div.pull-left.ball_stats > div > div.main_bar").after('<button id="ss_lvlup_nonstop" class="btn_small_gold option" data-option="ss_lvlup_nonstop">Exp no stop</button>');
  }

  switchButtonText() {
      $("#ss_lvlup_next").html(this.hasStarted ? this.stopText : this.expText);
      $("#ss_lvlup_nonstop").html(this.hasStarted ? this.stopText : this.expNonStopText);
  }

  hideExpButtons() {
      $("#ss_lvlup_next").remove();
      $("#ss_lvlup_nonstop").remove();
  }
}

// ========== remote/features/ball/ballUpgrade.js ==========
class ballUpgrade {
  constructor() {
      this.upgradeAllText = 'Ulepszaj wszystkie';
      this.stopText = 'STOP';
      this.waitingForResponse = false;
      this.bonuses = [];
      this.synergy = parseInt($("#ss_synergy_lvl").html());
      this.hasStarted = false;
      $("body").on("click", `button[data-option="ss_page"][data-page="upgrade"]`, () => {
          this.showCheckboxes();
          this.showUpgradeAllButton();
      });
      $("body").on("click", `button[data-option="ss_page"][data-page="reset"], #soulstone_interface .closeicon`, () => {
          if (this.hasStarted) {
              this.stopUpgrading();
          }
          this.hideCheckboxes();
          this.hideUpgradeAllButton();
      });
      $("body").on("click", `button[data-option="ss_upgrade_all"]`, () => {
          this.controller();
      });
  }

  controller() {
      if (this.hasStarted) {
          this.hasStarted = false;
          this.stopUpgrading();
      } else {
          this.hasStarted = true;
          this.startUpgrading();
      }
      this.switchCheckboxesState();
      this.switchButtonText();
  }

  startUpgrading() {
      if (this.hasStarted) {
          GAME.completeProgress = () => {
              var res = GAME.progress;
              switch (res.a) {
                  case 45:
                      if (res.ball) {
                          GAME.parseData(55, res);
                          if (this.hasStarted) {
                              if(this.waitingForResponse) {
                                  this.waitingForResponse = false;
                              }
                              this.upgrade();
                          }
                      }
                      break;
              }
              delete GAME.progress;
          }
          this.bonuses = [];
          this.upgrade();
      }
  }

  stopUpgrading() {
      GAME.completeProgress = () => {
          var res = GAME.progress;
          switch (res.a) {
              case 45:
                  if (res.ball) {
                      GAME.parseData(55, res);
                  }
                  break;
          }
          delete GAME.progress;
      }

      this.waitingForResponse = false;

      if (this.hasStarted) {
          this.controller()
      }
  }

  upgrade() {
      if(this.waitingForResponse) {
          return;
      }

      this.rateUpgrade();
  }

  sendUpgrade() {
      GAME.emitOrder({ a: 45, type: 3, bid: GAME.ball_id });
      this.waitingForResponse = true;
  }

  rateUpgrade() {
      var shouldAcceptUpgrade = false;
      this.markBonuses();
      shouldAcceptUpgrade = this.evaluateBonuses();
      if (shouldAcceptUpgrade) {
          GAME.emitOrder({ a: 45, type: 5, bid: GAME.ball_id });
      }

      setTimeout(this.sendUpgrade, shouldAcceptUpgrade ? 300 : 0);
  }

  markBonuses() {
      this.bonuses = [];
      $('.ball_stats.stat_page tr[id]:not([style*="display: none"])').each((value, index, array) => {
          this.bonuses.push($(`#bon${value + 1}_upgrade`)[0].checked);
      }, this);

      let allUnchecked = this.bonuses.every((value, index, array) => {
          value == false;
      }, this);

      if(allUnchecked) {
          this.stopUpgrading
      }
  }

  evaluateBonuses() {
      var sum = 0;
      this.bonuses.forEach((shouldInclude, index, array) => {
          if(shouldInclude) {
              sum += parseFloat($(`#ss_change_${index+1}`).text());
          }
      }, this);

      return sum >= 0;
  }

  showCheckboxes() {
      $('.ball_stats.stat_page tr[id]:not([style*="display: none"])').each(function (index) {
          $(`#stat${index + 1}_bon`).after(`<input type="checkbox" id="bon${index + 1}_upgrade" value=${index + 1}>`);
      });
  }

  switchCheckboxesState() {
      $(".ball_stats.stat_page input[type=checkbox]").each((index) => {
          $(`#bon${index + 1}_upgrade`).prop('disabled', this.hasStarted);
      });
  }

  hideCheckboxes() {
      $(".ball_stats.stat_page input[type=checkbox]").each((index) => {
          $(`#bon${index + 1}_upgrade`).remove();
      });
  }

  showUpgradeAllButton() {
      $("#ss_page_upgrade > button").after('<button class="newBtn option" data-option="ss_upgrade_all">Ulepszaj wszystkie</button>');
  }

  switchButtonText() {
      $('#ss_page_upgrade button[data-option="ss_upgrade_all"]').html(`${this.hasStarted ? this.stopText : this.upgradeAllText}`);
  }

  hideUpgradeAllButton() {
      $('#ss_page_upgrade button[data-option="ss_upgrade_all"]').remove();
  }
}

// ========== remote/features/ball/ballReset.js ==========
class ballReset {
  constructor() {
      this.synergy = 6;
      this.hasStarted = false;
      this.bonsCombinations = [];
      this.css = ` #ballResetPanel { position: absolute; top: 35px; right: 10px; z-index: 9999999; width: 445px; padding: 5px; background: #303131bd; border: solid #ffffff7a 1px; border-radius: 5px; display: none; user-select: none; } #ballResetPanel .controller { display: flex; flex-direction: column; align-items: stretch; margin-bottom: 2px; } #ballResetPanel .controller button { font-weight: bolder; border:solid black 1px; cursor: pointer; } #ballResetPanel .controller button.green { background: lime; color: black !important; } #ballResetPanel .controller button.red { background: red; color: black !important; } #ballResetPanel .controller button:first-child { border-bottom:none; background: #afd4f5; } #ballResetPanel .controller button:disabled { opacity: 1; background: gray; cursor: not-allowed; } #ballResetPanel .ballCombination { background: #dfdfdc5c; padding: 5px; margin-bottom: 2px; } #ballResetPanel .ballCombination .combinationID { text-align: center; background: black; color: white; font-weight: bolder; font-size: 16px; padding: 1px; margin-bottom: 2px; } #ballResetPanel .ballCombination select { margin-bottom: 2px; background: #ffffff99; border: solid #6f6f6f 1px; border-radius: 5px; color: black; } #ballResetPanel .ballCombination select:last-child { margin-bottom: 0px; } `;
      this.innerHTML = ` <div id="ballResetPanel"> <div class="controller"> <button class="addCombination">DODAJ NOWĄ KOMBINACJE</button> <button class="startSearching green">SZUKAJ</button> </div> <div class="combinations">${this.bonsCombination(1)}</div> </div> `;

      $("body").append(`<style>${this.css}</style>${this.innerHTML}`);
      $("body").on("click", "#ballResetPanel .addCombination", () => {
          let lastID = parseInt($(".ballCombination:last").attr("combination"));
          lastID++;
          $(".combinations").append(this.bonsCombination(lastID));
      });
      $("body").on("click", "#ballResetPanel .startSearching", () => {
          this.controller();
      });
      $("body").on("click", `button[data-option="ss_page"][data-page="reset"]`, () => {
          GAME.completeProgress = () => {
              var res = GAME.progress;
              switch (res.a) {
                  case 45:
                      if (res.ball) {
                          GAME.parseData(55, res);
                          if (this.hasStarted) {
                              this.search(res);
                          }
                      }
                      break;
              }
              delete GAME.progress;
          }
          if (document.querySelector("#ss_name") && document.querySelector("#ss_name").textContent.trim() != "Anielska Kula Energii") {
              $("#ballResetPanel").show();
          }
      });
      $("body").on("click", `button[data-option="ss_page"][data-page="upgrade"], #soulstone_interface .closeicon`, () => {
          if (this.hasStarted) {
              $("#ballResetPanel .startSearching").click();
          }
          $('.ss_stats tr').css("background", "transparent");
          $("#ballResetPanel").hide();
          $("#ss_page_reset").hide();
      });
  }
  controller() {
      if (this.hasStarted) {
          this.hasStarted = false;
          $(".startSearching").removeClass("red").addClass("green").html("SZUKAJ");
          $(".ballCombination select").prop("disabled", false);
          $(".addCombination").prop("disabled", false);
      } else {
          this.hasStarted = true;
          this.search();
          $(".startSearching").removeClass("green").addClass("red").html("STOP");
          $(".ballCombination select").prop("disabled", true);
          $(".addCombination").prop("disabled", true);
      }
  }
  search(res = false) {
      if (this.hasStarted) {
          this.bonsCombinations = this.prepareCombinations();
          if (res) {
              this.ballActualBons = this.prepareBallBons(res);
          } else {
              this.ballActualBons = [0]
          }
          if (!this.compare(this.ballActualBons, this.bonsCombinations)) {
              GAME.socket.emit('ga', {
                  a: 45,
                  type: 1,
                  bid: GAME.ball_id
              });
          } else {
              $(".startSearching").click();
          }
      }
  }
  compare(pattern, others) {
      const patternCounts = this.countOccurrences(pattern);
      for (let i = 0; i < others.length; i++) {
          const other = others[i];
          const otherCounts = this.countOccurrences(other);
          let isValid = true;
          for (const [num, count] of Object.entries(otherCounts)) {
              if (!patternCounts[num] || patternCounts[num] < count) {
                  isValid = false;
                  break;
              }
          }
          if (isValid) {
              return true;
          }
      }
      return false;
  }
  countOccurrences(array) {
      const counts = {};
      for (const num of array) {
          counts[num] = (counts[num] || 0) + 1;
      }
      return counts;
  }
  prepareBallBons(res) {
      let ball = res.ball;
      let bons = [];
      $('.ss_stats tr').css("background", "transparent");
      for (var s = 1; s <= 9; s++) {
          if (ball['stat' + s] && this.bonsCombinations.some(array => array.includes(ball['stat' + s]))) {
              bons.push(ball['stat' + s]);
              $('#stat' + s + '_bon').parent().css("background", "#80008075");
          }
      }
      return bons;
  }
  prepareCombinations() {
      let combinations = [];
      $(".ballCombination").each((index, element) => {
          let combination = [];
          $(element).find("select").each((idx, sel) => {
              const value = parseInt($(sel).val());
              if (value > 0) {
                  combination.push(value);
              }
          });
          if (combination.length > 0) {
              combinations.push(combination);
          }
      });
      return combinations;
  }
  bonsCombination(c) {
      let innerHTML = `<div class="ballCombination" combination="${c}"><div class="combinationID">Kombinacja #${c}</div>`;
      for (let i = 0; i < this.synergy; i++) {
          innerHTML += `${this.listOfBons(c)}`;
      }
      innerHTML += "</div>";
      return innerHTML;
  }
  listOfBons() {
      let innerHTML = ` <select> <option value="0">Brak</option> `;
      this.allBons().forEach((obiekt) => {
          innerHTML += `<option value="${obiekt.id}">${obiekt.bonus}</option>`;
      });
      innerHTML += `</select>`;
      return innerHTML;
  }
  allBons() {
      return [{
          id: 13,
          bonus: '% do obrażeń'
      }, {
          id: 14,
          bonus: '% do redukcji obrażeń'
      }, {
          id: 15,
          bonus: '% do efektywności treningu'
      }, {
          id: 16,
          bonus: '% do doświadczenia'
      }, {
          id: 17,
          bonus: '% do szansy na trafienie krytyczne'
      }, {
          id: 18,
          bonus: '% do redukcji szansy na otrzymanie trafienia krytycznego'
      }, {
          id: 51,
          bonus: '% do obrażeń od technik'
      }, {
          id: 52,
          bonus: '% redukcji obrażeń od technik'
      }, {
          id: 53,
          bonus: '% do szansy na moc z walk PvM'
      }, {
          id: 54,
          bonus: '% do ilości mocy z walk PvM'
      }, {
          id: 55,
          bonus: '% do szansy na zdobycie przedmiotu z walk PvM'
      }, {
          id: 56,
          bonus: 'minut(a) krótsze wyprawy'
      }, {
          id: 57,
          bonus: '% do szansy powodzenia wypraw'
      }, {
          id: 58,
          bonus: '% do szansy na ulepszenie przedmiotów'
      }, {
          id: 59,
          bonus: '% do szansy na połączenie przedmiotów'
      }, {
          id: 60,
          bonus: '% do obrażeń od trafień krytycznych'
      }, {
          id: 61,
          bonus: '% redukcji obrażeń od trafień krytycznych'
      }, {
          id: 62,
          bonus: '% do mocy za wygrane walki wojenne'
      }, {
          id: 63,
          bonus: '% do skuteczności podpaleń'
      }, {
          id: 64,
          bonus: '% do skuteczności krwawień'
      }, {
          id: 65,
          bonus: '% do odporności na podpalenia'
      }, {
          id: 66,
          bonus: '% do odporności na krwawienia'
      }, {
          id: 67,
          bonus: '% do szansy na zdobycie PSK'
      }, {
          id: 68,
          bonus: '% do punktów PvP za wygrane walki'
      }, {
          id: 69,
          bonus: '% do szansy na 3x więcej punktów PvP za wygrane walki'
      }, {
          id: 70,
          bonus: '% do szansy na 3x więcej doświadczenia za wygrane walki PvM'
      }, {
          id: 71,
          bonus: '% do mocy za skompletowanie SK'
      }, {
          id: 72,
          bonus: '% do mocy za skompletowanie PSK'
      }, {
          id: 73,
          bonus: 'minut(y) do czasu trwania błogosławieństw'
      }, {
          id: 74,
          bonus: '% do szansy na spotkanie legendarnych potworów'
      }, {
          id: 75,
          bonus: 'minut(y) krótszy cooldown między walkami PvP'
      }, {
          id: 76,
          bonus: '% zwiększenie własnej szybkości'
      }, {
          id: 77,
          bonus: '% obniżenie szybkości przeciwnika'
      }, {
          id: 78,
          bonus: '% do szansy na zdobycie Niebieskiego Senzu'
      }, {
          id: 79,
          bonus: '% mniejsze obrażenia od podpaleń'
      }, {
          id: 80,
          bonus: '% mniejsze obrażenia od krwawień'
      }, {
          id: 81,
          bonus: '% do szansy na zdobycie Scoutera'
      }, {
          id: 91,
          bonus: '% do wtajemniczenia'
      }, {
          id: 99,
          bonus: '% większy limit dzienny Niebieskich Senzu'
      }, {
          id: 139,
          bonus: '% do ilości zdobywanych kryształów instancji'
      }, {
          id: 140,
          bonus: '% do przyrostu Punktów Akcji'
      }, {
          id: 154,
          bonus: '% do sławy za walki w wojnach imperiów'
      }, {
          id: 160,
          bonus: '% do boskiego atrybutu przewodniego'
      }, {
          id: 163,
          bonus: '% więcej Boskiej Ki za CSK'
      }, {
          id: 171,
          bonus: '% do max Punktów Akcji'
      }];
  }
}

class pet_bonch {
  constructor() {
      this.petCSS = `
          #bonusMenu {display: none; position: absolute; top: 80px; right: 5px; padding: 10px; background: rgba(48, 49, 49, 0.8); border: solid #ffffff7a 1px; border-radius: 5px; z-index: 10;}
          #bonusMenu div {color: #ffffff; font-size: 16px; font-weight: bold; margin-bottom: 10px; text-align: center; }
          #bonusMenu select {margin: 5px 0; background: #ffffff99; border: solid #6f6f6f 1px; border-radius: 5px; color: black; display: block; width: 100%;}
          .startButton {display: block; margin: 8px auto;}
          .stopButton {display: block; margin: 8px auto; margin-bottom: 1ch;}`;
      this.petHTML = `
          <div id="bonusMenu">
              <div><b>Wybierz bonusy:</b></div>
              ${this.generateBonusSelects(4)}
              <div><b>Wybierz ID Peta:</b></div>
              <select id="petIdSelect">${this.generatePetOptions()}</select>
              <button class="newBtn startButton">Start</button>
              <button class="newBtn stopButton">CLOSE</button>
          </div>`;
      this.isPetBonchActive = false;
      this.petInterval = null;

      this.initialize();
  }

  initialize() {
      this.attachButtonEvent();
      this.attachStartEvent();
      this.attachStopEvent();
  }

  generateBonusSelects(count) {
      let options = `
          <option value="0">Brak</option>
          <option value="1">% do siły</option>
          <option value="2">% do szybkości</option>
          <option value="3">% do wytrzymałości</option>
          <option value="4">% do siły woli</option>
          <option value="5">% do energii ki</option>
          <option value="6">% do wszystkich statystyk</option>
          <option value="7">% do efektywności treningu</option>
          <option value="8">% do rezultatu treningu</option>
          <option value="9">% do szansy na podwójnie efektywny bonus za ulepszenie treningu</option>
          <option value="10">% do max Punktów Akcji</option>
          <option value="11"> do przyrostu Punktów Akcji</option>
          <option value="12">% do przyrostu Punktów Akcji</option>
          <option value="13">% do doświadczenia</option>
          <option value="14">% do szansy na zdobycie przedmiotu z walk PvM</option>
          <option value="15">% do ilości mocy z walk PvM</option>
          <option value="16">% do szansy na moc z walk PvM</option>
          <option value="17">% do mocy za skompletowanie SK</option>
          <option value="18">% do mocy za skompletowanie PSK</option>
          <option value="19">% do mocy za wygrane walki wojenne</option>
          <option value="20">% do obrażeń</option>
          <option value="21">% do obrażeń od technik</option>
          <option value="22">% do obrażeń od trafień krytycznych</option>
          <option value="23">% do redukcji obrażeń</option>
          <option value="24">% redukcji obrażeń od technik</option>
          <option value="25">% do redukcji szansy na otrzymanie trafienia krytycznego</option>
          <option value="26">% redukcji obrażeń od trafień krytycznych</option>
          <option value="27">% do szansy na trafienie krytyczne</option>
          <option value="28">% do odporności na krwawienia</option>
          <option value="29">% do skuteczności krwawień</option>
          <option value="30">% do odporności na podpalenia</option>
          <option value="31">% do skuteczności podpaleń</option>
      `;
      let selects = "";
      for (let i = 0; i < count; i++) {
          selects += `<select>${options}</select>`;
      }
      return selects;
  }

  generatePetOptions() {
      let options = '';
      for (let i = 1; i <= 100; i++) {
          options += `<option value="${i}">Pet ${i}</option>`;
      }
      return options;
  }

  attachButtonEvent() {
      $("body").on("click", 'button[data-option="pet_bonch"]', () => {
          if (!$("#bonusMenu").length) {
              $("body").append(`<style>${this.petCSS}</style>${this.petHTML}`);
          }

          setTimeout(() => {
              if ($(".pet-number").length === 0) {
                  const petItems = document.querySelectorAll('.petItem');
                  petItems.forEach((petItem, index) => {
                      const numberLabel = document.createElement('div');
                      numberLabel.classList.add('pet-number');
                      numberLabel.textContent = `Pet #${index + 1}`;
                      numberLabel.style.fontWeight = 'bold';
                      numberLabel.style.marginBottom = '5px';
                      petItem.prepend(numberLabel);
                  });
              }
              this.isPetBonchActive = false;
              $("#bonusMenu").toggle();
          }, 333);
      });
  }

  attachStartEvent() {
      $("body").on("click", '.startButton', () => {
          this.isPetBonchActive = true;
          const selectedOptions = Array.from($('#bonusMenu select').not('#petIdSelect'))
              .map(select => {
                  const value = select.value;
                  const optionText = select.options[select.selectedIndex].text;
                  return value !== "0" ? optionText : null;
              })
              .filter(option => option !== null);

          const checkAndSendData = () => {
              const container = document.querySelector("#kom_con > div > div.content > div");
              const greenTextValues = Array.from(container.querySelectorAll("b.green")).map(el => {
                  return el.nextSibling ? el.nextSibling.textContent.trim() : "";
              });

              const allMatch = selectedOptions.every(option => greenTextValues.includes(option));
              const iloscKarmy = parseInt($("#ilosc_karm").text(), 10);

              if (iloscKarmy === 0) {
                  this.isPetBonchActive = false;
                  console.log("Brak Karmy.");
              }

              if (this.isPetBonchActive) {
                  if (allMatch) {
                      console.log("Wszystkie wybrane wartości pasują:", selectedOptions);
                      clearInterval(this.petInterval);
                      this.isPetBonchActive = false;
                  } else {
                      // console.log("Brak pełnego dopasowania, ponawiam próbę...");
                      const petId = $('#petIdSelect').val();
                      const button = document.querySelector(`#pet_list > div:nth-child(${petId}) > div.rightSide > div > button:nth-child(2)`);
                      const petId2 = button.getAttribute("data-pet");
                      GAME.socket.emit('ga', { a: 43, type: 7, pet: petId2 });
                      kom_clear();
                  }
              } else {
                  clearInterval(this.petInterval);
              }
          };

          this.petInterval = setInterval(checkAndSendData, 700);
      });
  }

  attachStopEvent() {
      $("body").on("click", '.stopButton', () => {
          $("#bonusMenu").hide();
          this.isPetBonchActive = false;
      });
  }
}

class anielskaReset {
  constructor() {
      this.anielskaCSS = `
                  #AnielskaMenu {display: none; position: absolute; top: 80px; right: 5px; padding: 10px; background: rgba(48, 49, 49, 0.8); border: solid #ffffff7a 1px; border-radius: 5px; z-index: 10;}
                  #AnielskaMenu div {color: #ffffff; font-size: 16px; font-weight: bold; margin-bottom: 10px; text-align: center; }
                  #AnielskaMenu select {margin: 5px 0; margin-bottom: 2ch; background: #ffffff99; border: solid #6f6f6f 1px; border-radius: 5px; color: black; display: block; width: 100%;}
                  .startAnielska {display: block; margin: 8px auto;}
                  .stopAnielska {display: block; margin: 8px auto; margin-bottom: 1ch;}`;
      this.anielskaHTML = `
                  <div id="AnielskaMenu">
                      <div><b>Wybierz ustawienia Anielskiej Kuli:</b></div>
                      ${this.generateAnielskaSelects(5)}
                      <button class="newBtn startAnielska">Start</button>
                      <button class="newBtn stopAnielska">CLOSE</button>
                  </div>`;
      this.isAnielskaActive = false;
      this.anielskaInterval = null;

      this.initialize();
  }

  initialize() {
      this.attachResetEvent();
      this.attachStartEvent();
      this.attachStopEvent();
  }

  generateAnielskaSelects(count) {
      let options = `<option value="0">Brak</option>
               <option value="1">10% do boskiego atrybutu przewodniego</option>
               <option value="2">15% do boskiego atrybutu przewodniego</option>
               <option value="3">150% do doświadczenia</option>
               <option value="4">200% do doświadczenia</option>
               <option value="5">150% do efektywności treningu</option>
               <option value="6">200% do efektywności treningu</option>
               <option value="7">75% do ilości mocy z walk PvM</option>
               <option value="8">100% do ilości mocy z walk PvM</option>
               <option value="9">75% do ilości zdobywanych kryształów instancji</option>
               <option value="10">100% do ilości zdobywanych kryształów instancji</option>
               <option value="11">30% do max Punktów Akcji</option>
               <option value="12">35% do max Punktów Akcji</option>
               <option value="13">40% do obrażeń</option>
               <option value="14">45% do obrażeń</option>
               <option value="15">40% do obrażeń od technik</option>
               <option value="16">45% do obrażeń od technik</option>
               <option value="17">30% do przyrostu Punktów Akcji</option>
               <option value="18">35% do przyrostu Punktów Akcji</option>
               <option value="19">40% do redukcji obrażeń</option>
               <option value="20">45% do redukcji obrażeń</option>
               <option value="21">40% do sławy za walki w wojnach imperiów</option>
               <option value="22">45% do sławy za walki w wojnach imperiów</option>
               <option value="23">15% do szansy na 3x więcej doświadczenia za wygrane walki PvM</option>
               <option value="24">20% do szansy na 3x więcej doświadczenia za wygrane walki PvM</option>
               <option value="25">9% do szansy na połączenie przedmiotów</option>
               <option value="26">12% do szansy na połączenie przedmiotów</option>
               <option value="27">9% do szansy na spotkanie legendarnych potworów</option>
               <option value="28">12% do szansy na spotkanie legendarnych potworów</option>
               <option value="29">9% do szansy na ulepszenie przedmiotów</option>
               <option value="30">12% do szansy na ulepszenie przedmiotów</option>
               <option value="31">9% do szansy na zdobycie przedmiotu z walk PvM</option>
               <option value="32">12% do szansy na zdobycie przedmiotu z walk PvM</option>
               <option value="33">9% do szansy na zdobycie PSK</option>
               <option value="34">12% do szansy na zdobycie PSK</option>
               <option value="35">3% do szansy na zdobycie CSK</option>
               <option value="36">5% do szansy na zdobycie CSK</option>
               <option value="37">15% do wtajemniczenia</option>
               <option value="38">20% do wtajemniczenia</option>
               <option value="39">40% redukcji obrażeń od technik</option>
               <option value="40">45% redukcji obrażeń od technik</option>
               <option value="41">9% do szansy na moc z walk PvM</option>
               <option value="42">12% do szansy na moc z walk PvM</option>
               <option value="43">10% większy limit dzienny Niebieskich Senzu</option>
               <option value="44">15% większy limit dzienny Niebieskich Senzu</option>
               <option value="45">4% większy mnożnik SSJ</option>
               <option value="46">6% większy mnożnik SSJ</option>
               <option value="47">10% redukcja obrażeń od efektów czasowych</option>
               <option value="48">12% redukcja obrażeń od efektów czasowych</option>
               <option value="49">75 minut(y) do czasu trwania Błogosławieństw</option>
               <option value="50">100 minut(y) do czasu trwania Błogosławieństw</option>
               <option value="51">12 minut(y) krótszy cooldown między walkami PvP</option>
               <option value="52">15 minut(y) krótszy cooldown między walkami PvP</option>
               <option value="53">50% większa ilość boskiego atrybutu przewodniego z walk PvM</option>
               <option value="54">60% większa ilość boskiego atrybutu przewodniego z walk PvM</option>
               <option value="55">2% do szansy na ulepszenie przedmiotów M-borna</option>
               <option value="56">4% do szansy na ulepszenie przedmiotów M-borna</option>
               <option value="57">5% do rezultatu treningu</option>
               <option value="58">10% do rezultatu treningu</option>
               <option value="59">2% do szansy na podwójnie efektywny bonus za ulepszenie treningu</option>
               <option value="60">3% do szansy na podwójnie efektywny bonus za ulepszenie treningu</option>
               <option value="61">3% większa szansa na boski atrybut przewodni podczas walk PvM</option>
               <option value="62">5% większa szansa na boski atrybut przewodni podczas walk PvM</option>
               <option value="63">5% do wszystkich statystyk</option>
               <option value="64">10% % do wszystkich statystyk</option>
               <option value="65">4% większa szansa na pomyślne zebranie zasobu</option>
               <option value="66">6% większa szansa na pomyślne zebranie zasobu</option>
               `;
      let selects = '';
      for (let i = 0; i < count; i++) {
          selects += `<select>${options}</select>`;
      }
      return selects;
  }

  attachResetEvent() {
      $("body").on("click", 'button[data-option="ss_page"][data-page="reset"]', () => {
          if (document.querySelector("#ss_name") && document.querySelector("#ss_name").textContent.trim() === "Anielska Kula Energii") {
              if ($("#ballResetPanel").length) {
                  setTimeout(() => {
                      document.querySelector("#ballResetPanel").style.display = "none";
                  }, 500);
              }
              if (!$("#AnielskaMenu").length) {
                  $("body").append(`<style>${this.anielskaCSS}</style>${this.anielskaHTML}`);
                  console.log("#AnielskaMenu Wczytano.");
              }
              setTimeout(() => {
                  this.isAnielskaActive = false;
                  $("#AnielskaMenu").toggle();
              }, 333);
          }
      });
  }

  attachStartEvent() {
      $("body").on("click", '.startAnielska', () => {
          this.isAnielskaActive = true;
          const selectedOptions2 = Array.from($('#AnielskaMenu select'))
              .map(select => {
                  const value = select.value;
                  const optionText = select.options[select.selectedIndex].text;
                  if (value !== "0" && parseInt(value, 10) % 2 !== 0) {
                      const nextEvenValue = parseInt(value, 10) + 1;
                      const nextEvenText = select.options[select.selectedIndex + 1]?.text;
                      return [optionText, nextEvenText].filter(Boolean);
                  }
                  return value !== "0" ? [optionText] : null;
              })
              .filter(option => option !== null);

          const checkAndSendData2 = () => {
              const table = document.querySelector("table.ss_stats");
              const statBonValues = Array.from(table.querySelectorAll("td[id^='stat'][id$='_bon']"))
                  .map(td => td.textContent.trim())
                  .filter(value => value !== "");

              const statValValues = Array.from(table.querySelectorAll("b[id^='stat'][id$='_val']"))
                  .map(b => b.textContent.trim())
                  .filter(value => value !== "");

              const combinedValues = statValValues.map((val, index) => `${val}${statBonValues[index]}`);
              // console.log(combinedValues);
              // console.log(selectedOptions2);

              const toCheck = selectedOptions2.filter(options => {
                  return !options.some(option => combinedValues.includes(option));
              });

              if (toCheck.length === 0) {
                  if (this.isAnielskaActive) {
                      console.log("Wszystkie wybrane wartości pasują:", selectedOptions2);
                      clearInterval(this.anielskaInterval);
                  } else {
                      clearInterval(this.anielskaInterval);
                  }
              } else {
                  // console.log("Brak pełnego dopasowania, ponawiam próbę...");
                  GAME.socket.emit('ga', { a: 45, type: 1, bid: GAME.ball_id });
              }
          };

          this.anielskaInterval = setInterval(checkAndSendData2, 700);
      });
  }

  attachStopEvent() {
      $("body").on("click", '.stopAnielska', () => {
          $("#AnielskaMenu").hide();
          this.isAnielskaActive = false;
          clearInterval(this.anielskaInterval);
      });
  }
}

// ========== remote/features/ball/ballManager.js ==========
class ballManager {
  constructor() {
      const kulkaReset = new ballReset();
      const kulkaExp = new ballExp();
      const kulkaUpgrade = new ballUpgrade();
      const petReset = new pet_bonch();
      const anielskaKulka = new anielskaReset();
  }
}

// ========== remote/features/equipment/ekwipunek.js ==========
class ekwipunekMenager {
  constructor() {
    const mapWrapper = new locationWrapper();
    const questFilter = new filterQuest();
    this.setupCalculatePA();
    const lvl12all = new lv12all();
    lvl12all.initialize();
  }

  setupCalculatePA() {
    const ekwipunekButton = document.querySelector('button.select_page[data-page="game_ekw"]');

    if (ekwipunekButton) {
      ekwipunekButton.addEventListener('click', () => {
        this.createOrUpdatePADisplay();
      });
    } else {
      console.error("Nie znaleziono przycisku Ekwipunek!");
    }
  }

  createOrUpdatePADisplay() {
    const titleDiv = document.querySelector("#page_game_ekw > div.title");
    if (!titleDiv) return;

    let paDiv = document.getElementById("pa_display");

    if (!paDiv) {
      paDiv = document.createElement("div");
      paDiv.id = "pa_display";
      paDiv.innerText = `POSIADANE PA: OBLICZ`;
      paDiv.style.display = "inline-block";
      paDiv.style.color = "lightblue";
      paDiv.style.fontSize = "16px";
      paDiv.style.fontWeight = "bold";
      paDiv.style.cursor = "pointer";
      paDiv.style.position = "relative";
      paDiv.style.left = "40%";
      titleDiv.appendChild(paDiv);
      paDiv.addEventListener("click", () => {
        new calculatePA();
      });
    }
  }
}

class lv12all {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentCardType = null;
    this.targetLevel = 12;
    this.targetCount = 1;
    this.upgradesCompleted = 0;
    this.totalUpgradesNeeded = 0;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getAllCardsByType(cardType) {
    const sc_upgrades = document.getElementById("sc_upgrades");
    if (!sc_upgrades) return [];

    const cardsSameType = Array.from(sc_upgrades.querySelectorAll('div.small_card')).filter(function (div) {
      const img = div.querySelector('img');
      return img && img.src.includes(cardType);
    });

    return cardsSameType.map(function (div) {
      const level = div.querySelector('span') ? div.querySelector('span').textContent : null;
      const stack = div.querySelector('i') ? div.querySelector('i').textContent : null;
      const cardId = div.getAttribute('data-card_id');

      return {
        level: parseInt(level),
        stack: parseInt(stack),
        cardId: cardId
      };
    });
  }

  /**
   * Calculate how many level 1 cards are needed to create X cards of target level
   * @param {number} targetLevel - target level (1-20)
   * @param {number} targetCount - how many cards of that level we want
   * @returns {number} - number of level 1 cards required
   */
  calculateRequiredCards(targetLevel, targetCount) {
    if (targetLevel <= 1) return targetCount;

    // For levels 1-12: each upgrade consumes 1 card (so level N needs N cards total)
    // For levels 13-20: each upgrade needs 2 cards of previous level

    if (targetLevel <= 12) {
      // To get 1 card of level N (where N <= 12), we need N level-1 cards
      return targetCount * targetLevel;
    } else {
      // For levels > 12, we need 2 cards of previous level
      // Level 13 = 2x level 12 = 2 * 12 = 24 level-1 cards
      // Level 14 = 2x level 13 = 2 * 24 = 48 level-1 cards
      // etc.
      let cardsNeeded = 12; // base for level 12
      for (let lvl = 13; lvl <= targetLevel; lvl++) {
        cardsNeeded *= 2;
      }
      return targetCount * cardsNeeded;
    }
  }

  /**
   * Calculate how many cards we can make given current inventory
   * @param {Array} cards - array of card objects with level and stack
   * @param {number} targetLevel - target level
   * @returns {object} - { possible: number, deficit: number, message: string }
   */
  calculatePossibleUpgrades(cards, targetLevel) {
    // Sum up all cards as "level 1 equivalent"
    let totalLevel1Equivalent = 0;

    for (const card of cards) {
      if (card.level <= 12) {
        // Each card of level N is worth N level-1 cards
        totalLevel1Equivalent += card.stack * card.level;
      } else {
        // For levels > 12, calculate the equivalent
        let multiplier = 12;
        for (let lvl = 13; lvl <= card.level; lvl++) {
          multiplier *= 2;
        }
        totalLevel1Equivalent += card.stack * multiplier;
      }
    }

    const requiredPerCard = this.calculateRequiredCards(targetLevel, 1);
    const possibleCount = Math.floor(totalLevel1Equivalent / requiredPerCard);

    return {
      possible: possibleCount,
      totalEquivalent: totalLevel1Equivalent,
      requiredPerCard: requiredPerCard
    };
  }

  /**
   * Wait for upgrade confirmation from server
   * @returns {Promise<boolean>} - true if confirmed, false if timeout
   */
  waitForUpgradeConfirmation(timeout = 10000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        const komCon = document.querySelector('#kom_con .kom .content');
        if (komCon && komCon.textContent.includes('Karta wzmocniona')) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  }

  createModalStyles() {
    if (document.getElementById('sc_upgrade_modal_styles')) return;

    const styles = document.createElement('style');
    styles.id = 'sc_upgrade_modal_styles';
    styles.textContent = `
          #sc_upgrade_modal_overlay {
              display: none;
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.7);
              z-index: 9998;
          }
          #sc_upgrade_modal {
              display: none;
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              border: 2px solid #0f4c75;
              border-radius: 12px;
              padding: 20px;
              z-index: 9999;
              min-width: 320px;
              box-shadow: 0 0 30px rgba(15, 76, 117, 0.5);
          }
          #sc_upgrade_modal .modal-title {
              color: #3fc1c9;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 15px;
              text-transform: uppercase;
          }
          #sc_upgrade_modal .modal-close, #sc_upgrade_modal .modal-minimize {
              position: absolute;
              top: 10px;
              font-size: 20px;
              cursor: pointer;
              font-weight: bold;
          }
          #sc_upgrade_modal .modal-close {
              right: 15px;
              color: #ff6b6b;
          }
          #sc_upgrade_modal .modal-minimize {
              right: 45px;
              color: #f9ca24;
          }
          #sc_upgrade_modal .modal-close:hover { color: #ff4757; }
          #sc_upgrade_modal .modal-minimize:hover { color: #f0932b; }
          #sc_upgrade_modal .form-group {
              margin-bottom: 12px;
          }
          #sc_upgrade_modal label {
              display: block;
              color: #b8b8b8;
              margin-bottom: 5px;
              font-size: 13px;
          }
          #sc_upgrade_modal input[type="number"] {
              width: 100%;
              padding: 8px 12px;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid #0f4c75;
              border-radius: 6px;
              color: #fff;
              font-size: 14px;
              box-sizing: border-box;
          }
          #sc_upgrade_modal input[type="number"]:focus {
              outline: none;
              border-color: #3fc1c9;
          }
          #sc_upgrade_modal .calc-result {
              background: rgba(0, 0, 0, 0.3);
              color: #888;
              border-radius: 8px;
              padding: 12px;
              margin: 15px 0;
              font-size: 13px;
              min-height: 60px;
          }
          #sc_upgrade_modal .calc-result.success {
              border-left: 3px solid #2ed573;
          }
          #sc_upgrade_modal .calc-result.error {
              border-left: 3px solid #ff4757;
          }
          #sc_upgrade_modal .calc-result .stat {
              color: #3fc1c9;
              font-weight: bold;
          }
          #sc_upgrade_modal .calc-result .inventory {
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px solid rgba(255,255,255,0.1);
              font-size: 12px;
              color: #888;
          }
          #sc_upgrade_modal .btn-row {
              display: flex;
              gap: 8px;
              margin-top: 10px;
          }
          #sc_upgrade_modal .modal-btn {
              flex: 1;
              padding: 10px 15px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: bold;
              font-size: 13px;
              text-transform: uppercase;
              transition: all 0.2s;
          }
          #sc_upgrade_modal .btn-calculate {
              background: linear-gradient(135deg, #0f4c75 0%, #1b6ca8 100%);
              color: #fff;
          }
          #sc_upgrade_modal .btn-calculate:hover {
              background: linear-gradient(135deg, #1b6ca8 0%, #2196f3 100%);
          }
          #sc_upgrade_modal .btn-start {
              background: linear-gradient(135deg, #10ac84 0%, #1dd1a1 100%);
              color: #fff;
          }
          #sc_upgrade_modal .btn-start:hover {
              background: linear-gradient(135deg, #1dd1a1 0%, #55efc4 100%);
          }
          #sc_upgrade_modal .btn-start:disabled {
              background: #555;
              cursor: not-allowed;
          }
          #sc_upgrade_modal .btn-pause {
              background: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
              color: #1a1a2e;
          }
          #sc_upgrade_modal .btn-stop {
              background: linear-gradient(135deg, #ee5a24 0%, #ff4757 100%);
              color: #fff;
          }
          #sc_upgrade_modal .progress-section {
              display: none;
              margin-top: 15px;
          }
          #sc_upgrade_modal .progress-bar-container {
              background: rgba(0, 0, 0, 0.4);
              border-radius: 10px;
              overflow: hidden;
              height: 20px;
              margin-bottom: 10px;
          }
          #sc_upgrade_modal .progress-bar {
              height: 100%;
              background: linear-gradient(90deg, #10ac84, #1dd1a1);
              transition: width 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: bold;
              color: #fff;
          }
          #sc_upgrade_modal .progress-text {
              color: #b8b8b8;
              font-size: 12px;
              text-align: center;
          }
          /* Mini Widget */
          #sc_mini_widget {
              display: none;
              position: fixed;
              bottom: 20px;
              right: 20px;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              border: 2px solid #0f4c75;
              border-radius: 10px;
              padding: 10px 15px;
              z-index: 9999;
              cursor: move;
              box-shadow: 0 0 20px rgba(15, 76, 117, 0.5);
              min-width: 180px;
              touch-action: none;
          }
          #sc_mini_widget .mini-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
          }
          #sc_mini_widget .mini-title {
              color: #3fc1c9;
              font-size: 12px;
              font-weight: bold;
          }
          #sc_mini_widget .mini-expand {
              color: #3fc1c9;
              cursor: pointer;
              font-size: 16px;
          }
          #sc_mini_widget .mini-expand:hover {
              color: #55efc4;
          }
          #sc_mini_widget .mini-progress {
              background: rgba(0, 0, 0, 0.4);
              border-radius: 6px;
              overflow: hidden;
              height: 14px;
              margin-bottom: 6px;
          }
          #sc_mini_widget .mini-progress-bar {
              height: 100%;
              background: linear-gradient(90deg, #10ac84, #1dd1a1);
              transition: width 0.3s ease;
          }
          #sc_mini_widget .mini-status {
              color: #b8b8b8;
              font-size: 11px;
              text-align: center;
          }
      `;
    document.head.appendChild(styles);
  }

  createModal() {
    if (document.getElementById('sc_upgrade_modal')) return;

    this.createModalStyles();

    const overlay = document.createElement('div');
    overlay.id = 'sc_upgrade_modal_overlay';

    const modal = document.createElement('div');
    modal.id = 'sc_upgrade_modal';
    modal.innerHTML = `
          <span class="modal-minimize" title="Minimalizuj">_</span>
          <span class="modal-close">&times;</span>
          <div class="modal-title">⚔️ ULEPSZ DO...</div>
          
          <div class="form-group">
              <label>Docelowy poziom karty (1-20):</label>
              <input type="number" id="sc_target_level" min="1" max="20" value="12">
          </div>
          
          <div class="form-group">
              <label>Docelowa ilość kart:</label>
              <input type="number" id="sc_target_count" min="1" value="1">
          </div>
          
          <div class="btn-row">
              <button class="modal-btn btn-calculate" id="sc_btn_calculate">📊 PRZELICZ</button>
          </div>
          
          <div class="calc-result" id="sc_calc_result">
              <span style="color: #888;">Kliknij "PRZELICZ" aby zobaczyć wymagania...</span>
          </div>
          
          <div class="btn-row" id="sc_main_controls">
              <button class="modal-btn btn-start" id="sc_btn_start" disabled>▶️ START</button>
          </div>
          
          <div class="progress-section" id="sc_progress_section">
              <div class="progress-bar-container">
                  <div class="progress-bar" id="sc_progress_bar" style="width: 0%">0%</div>
              </div>
              <div class="progress-text" id="sc_progress_text">Przygotowanie...</div>
              <div class="btn-row">
                  <button class="modal-btn btn-pause" id="sc_btn_pause">⏸️ PAUZA</button>
                  <button class="modal-btn btn-stop" id="sc_btn_stop">⏹️ STOP</button>
              </div>
          </div>
      `;

    // Create mini widget
    const miniWidget = document.createElement('div');
    miniWidget.id = 'sc_mini_widget';
    miniWidget.innerHTML = `
        <div class="mini-header">
            <span class="mini-title">⚔️ Ulepszanie</span>
            <span class="mini-expand" title="Rozwiń">⬆</span>
        </div>
        <div class="mini-progress">
            <div class="mini-progress-bar" id="sc_mini_progress_bar" style="width: 0%"></div>
        </div>
        <div class="mini-status" id="sc_mini_status">Wstrzymano</div>
    `;
    document.body.appendChild(miniWidget);

    // Make mini widget draggable (touch + mouse)
    this.makeDraggable(miniWidget);

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // Event listeners
    overlay.addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-minimize').addEventListener('click', () => this.minimizeModal());
    document.getElementById('sc_mini_widget').querySelector('.mini-expand').addEventListener('click', () => this.expandModal());

    document.getElementById('sc_btn_calculate').addEventListener('click', () => this.onCalculate());
    document.getElementById('sc_btn_start').addEventListener('click', () => this.onStart());
    document.getElementById('sc_btn_pause').addEventListener('click', () => this.onPauseResume());
    document.getElementById('sc_btn_stop').addEventListener('click', () => this.onStop());
  }

  showModal() {
    this.createModal();

    // Get current selected card type
    const selected_card = document.querySelector(`div[data-card_id="${GAME.selected_card}"]`);
    if (!selected_card) {
      GAME.komunikat2('Najpierw wybierz kartę!');
      return;
    }

    const img = selected_card.querySelector('img');
    if (!img) return;

    this.currentCardType = img.src.match(/\/gfx\/cards\/(\d+)\.png/)?.[0] || img.src;

    document.getElementById('sc_upgrade_modal_overlay').style.display = 'block';
    document.getElementById('sc_upgrade_modal').style.display = 'block';

    // Reset state
    document.getElementById('sc_main_controls').style.display = 'flex';
    document.getElementById('sc_progress_section').style.display = 'none';
    document.getElementById('sc_btn_start').disabled = true;
    document.getElementById('sc_calc_result').className = 'calc-result';
    document.getElementById('sc_calc_result').innerHTML = '<span style="color: #888;">Kliknij "PRZELICZ" aby zobaczyć wymagania...</span>';
  }

  hideModal() {
    if (this.isRunning) {
      this.onStop();
    }
    document.getElementById('sc_upgrade_modal_overlay').style.display = 'none';
    document.getElementById('sc_upgrade_modal').style.display = 'none';
  }

  onCalculate() {
    const targetLevel = parseInt(document.getElementById('sc_target_level').value) || 12;
    const targetCount = parseInt(document.getElementById('sc_target_count').value) || 1;

    if (targetLevel < 1 || targetLevel > 20) {
      document.getElementById('sc_calc_result').className = 'calc-result error';
      document.getElementById('sc_calc_result').innerHTML = '❌ Poziom musi być między 1 a 20!';
      document.getElementById('sc_btn_start').disabled = true;
      return;
    }

    const cards = this.getAllCardsByType(this.currentCardType);
    if (cards.length === 0) {
      document.getElementById('sc_calc_result').className = 'calc-result error';
      document.getElementById('sc_calc_result').innerHTML = '❌ Nie znaleziono kart tego typu!';
      document.getElementById('sc_btn_start').disabled = true;
      return;
    }

    const result = this.calculatePossibleUpgrades(cards, targetLevel);
    const requiredFromZero = this.calculateRequiredCards(targetLevel, targetCount);

    this.targetLevel = targetLevel;
    this.targetCount = targetCount;

    const resultDiv = document.getElementById('sc_calc_result');
    const startBtn = document.getElementById('sc_btn_start');

    // Check how many we already have at target level or higher
    const existingAtTarget = cards.filter(c => c.level === targetLevel).reduce((sum, c) => sum + c.stack, 0);
    const existingAboveTarget = cards.filter(c => c.level > targetLevel).reduce((sum, c) => sum + c.stack, 0);

    // Build inventory breakdown
    const inventoryBreakdown = cards
      .filter(c => c.stack > 0)
      .sort((a, b) => b.level - a.level)
      .map(c => `lv${c.level}: ${c.stack}x`)
      .join(', ');

    // Calculate ACTUAL COST - how many lv1 cards will be consumed
    // Actual cost = requiredFromZero - value of NON-lv1 cards that will be used
    // Example: need lv13 (24 ekw), have lv12(1)+lv5(1)+lv1(971)
    // We'll use: lv12(12ekw) + lv5(5ekw) + lv1(7) = 24 total
    // So actual lv1 consumed = 24 - 12 - 5 = 7

    let valueFromHigherCards = 0;
    for (const card of cards.filter(c => c.level > 1)) {
      valueFromHigherCards += card.stack * this.calculateRequiredCards(card.level, 1);
    }

    // Actual lv1 cards consumed = max(0, requiredFromZero - valueFromHigherCards)
    // But capped at the lv1 cards we actually have
    const lv1Cards = cards.filter(c => c.level === 1).reduce((s, c) => s + c.stack, 0);
    const actualLv1Consumed = Math.max(0, Math.min(lv1Cards, requiredFromZero - valueFromHigherCards));

    // Also show total cards that will be used (higher + lv1)
    const higherCardsUsedValue = Math.min(valueFromHigherCards, requiredFromZero);

    const inventoryHtml = inventoryBreakdown
      ? `<div class="inventory">🏷️ Posiadane: ${inventoryBreakdown}</div>`
      : '';

    if (result.totalEquivalent >= requiredFromZero) {
      // Calculate remaining after upgrade
      const remaining = result.totalEquivalent - requiredFromZero;

      resultDiv.className = 'calc-result success';
      resultDiv.innerHTML = `
              ✅ <b>Możliwe do wykonania!</b><br>
              🎯 Cel: <span class="stat">${targetCount}x</span> karta lv<span class="stat">${targetLevel}</span><br>
              📦 Od zera potrzeba: <span class="stat">${requiredFromZero}</span> ekw. lv1<br>
              💰 <b>Zużyjesz: <span class="stat" style="color:#f9ca24">${actualLv1Consumed}</span> kart lv1</b> (+ karty wyższego lvl)<br>
              📊 Już posiadasz: <span class="stat">${existingAtTarget}</span>x lv${targetLevel}${existingAboveTarget > 0 ? ` (+${existingAboveTarget} wyższych)` : ''}<br>
              ✨ Zostanie: <span class="stat">${remaining}</span> ekw. lv1
              ${inventoryHtml}
          `;
      startBtn.disabled = false;
    } else {
      resultDiv.className = 'calc-result error';
      resultDiv.innerHTML = `
              ❌ <b>Zbyt mało kart!</b><br>
              🎯 Cel: <span class="stat">${targetCount}x</span> karta lv<span class="stat">${targetLevel}</span><br>
              📦 Od zera potrzeba: <span class="stat">${requiredFromZero}</span> ekw. lv1<br>
              ✨ Masz: <span class="stat">${result.totalEquivalent}</span> ekw. lv1<br>
              ⚠️ Brakuje: <span class="stat">${requiredFromZero - result.totalEquivalent}</span> ekw. lv1<br>
              ⚡ Max możesz stworzyć: <span class="stat">${result.possible}</span>x lv${targetLevel}
              ${inventoryHtml}
          `;
      // Allow starting even with deficit - will upgrade as much as possible
      startBtn.disabled = result.possible === 0;
    }
  }

  async onStart() {
    this.isRunning = true;
    this.isPaused = false;
    this.upgradesCompleted = 0;

    // Switch UI
    document.getElementById('sc_main_controls').style.display = 'none';
    document.getElementById('sc_progress_section').style.display = 'block';
    document.getElementById('sc_btn_pause').textContent = '⏸️ PAUZA';

    await this.runUpgradeProcess();
  }

  onPauseResume() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('sc_btn_pause');
    if (this.isPaused) {
      btn.textContent = '▶️ WZNÓW';
      this.updateProgressText('⏸️ Wstrzymano...');
    } else {
      btn.textContent = '⏸️ PAUZA';
    }
  }

  onStop() {
    this.isRunning = false;
    this.isPaused = false;

    document.getElementById('sc_main_controls').style.display = 'flex';
    document.getElementById('sc_progress_section').style.display = 'none';

    this.onCalculate(); // Refresh calculation
  }

  updateProgress(completed, total) {
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const bar = document.getElementById('sc_progress_bar');
    bar.style.width = `${percent}%`;
    bar.textContent = `${percent}%`;

    // Sync mini widget
    const miniBar = document.getElementById('sc_mini_progress_bar');
    if (miniBar) {
      miniBar.style.width = `${percent}%`;
    }
  }

  updateProgressText(text) {
    document.getElementById('sc_progress_text').textContent = text;

    // Sync mini widget
    const miniStatus = document.getElementById('sc_mini_status');
    if (miniStatus) {
      // Shorter version for mini widget
      miniStatus.textContent = text.length > 30 ? text.substring(0, 27) + '...' : text;
    }
  }

  /**
   * Find the best card to upgrade based on target level strategy
   */
  findCardToUpgrade(cards, targetLevel) {
    // For levels <= 12: upgrade highest level card that's below target
    // For levels > 12: need to build up pairs

    if (targetLevel <= 12) {
      // Find highest level card below target with stack > 1 (need 2 to combine)
      // OR find any card below target if there are level 1 cards available

      const cardsBelow = cards
        .filter(c => c.level < targetLevel && c.stack >= 1)
        .sort((a, b) => b.level - a.level);

      for (const card of cardsBelow) {
        if (card.stack >= 2 || (card.level === 1 && card.stack >= 2)) {
          return card;
        }
        // Check if there's a level 1 card to feed
        const level1 = cards.find(c => c.level === 1 && c.stack >= 1);
        if (level1 && card.level > 1) {
          return card; // This card can be upgraded with a lv1
        }
        if (card.level === 1 && card.stack >= 2) {
          return card;
        }
      }

      // If we have level 1 cards with stack >= 2, upgrade those
      const level1 = cards.find(c => c.level === 1 && c.stack >= 2);
      if (level1) return level1;

    } else {
      // For levels > 12, we need matching pairs
      // First, make sure we have enough level 12 cards
      // Then combine them up

      for (let lvl = targetLevel - 1; lvl >= 12; lvl--) {
        const cardsAtLevel = cards.find(c => c.level === lvl && c.stack >= 2);
        if (cardsAtLevel) {
          return cardsAtLevel;
        }
      }

      // If no pairs at high level, upgrade lower cards first
      const cardsBelow12 = cards
        .filter(c => c.level < 12 && c.stack >= 1)
        .sort((a, b) => b.level - a.level);

      for (const card of cardsBelow12) {
        if (card.stack >= 2) return card;
        const level1 = cards.find(c => c.level === 1 && c.stack >= 1);
        if (level1) return card;
      }
    }

    return null;
  }

  async runUpgradeProcess() {
    const targetLevel = this.targetLevel;
    const targetCount = this.targetCount;

    while (this.isRunning) {
      // Check pause
      while (this.isPaused && this.isRunning) {
        await this.delay(200);
      }

      if (!this.isRunning) break;

      // Refresh card data
      const cards = this.getAllCardsByType(this.currentCardType);

      // Check if we've reached the goal
      const atTarget = cards.filter(c => c.level === targetLevel).reduce((sum, c) => sum + c.stack, 0);

      if (atTarget >= targetCount) {
        this.updateProgress(100, 100);
        this.updateProgressText(`✅ Gotowe! Masz ${atTarget}x kart na poziomie ${targetLevel}`);
        await this.delay(2000);
        this.onStop();
        return;
      }

      // Find card to upgrade
      const cardToUpgrade = this.findCardToUpgrade(cards, targetLevel);

      if (!cardToUpgrade) {
        this.updateProgressText('⚠️ Brak kart do ulepszenia!');
        await this.delay(2000);
        this.onStop();
        return;
      }

      // Upgrade the card
      this.updateProgressText(`Ulepszam kartę lv${cardToUpgrade.level}...`);

      GAME.socket.emit('ga', { a: 58, type: 3, card: cardToUpgrade.cardId });

      // Wait for confirmation
      const confirmed = await this.waitForUpgradeConfirmation(10000);

      if (!confirmed) {
        this.updateProgressText('⚠️ Timeout - brak odpowiedzi serwera');
        await this.delay(2000);
        continue;
      }

      this.upgradesCompleted++;

      // Calculate progress estimate
      const result = this.calculatePossibleUpgrades(cards, targetLevel);
      const progress = Math.min(100, Math.round((atTarget / targetCount) * 100));
      this.updateProgress(progress, 100);
      this.updateProgressText(`Ulepszono: ${this.upgradesCompleted} | Cel: ${atTarget}/${targetCount} kart lv${targetLevel}`);

      // Small delay before next iteration
      await this.delay(300);
    }
  }

  // Minimize/Expand modal methods
  minimizeModal() {
    document.getElementById('sc_upgrade_modal_overlay').style.display = 'none';
    document.getElementById('sc_upgrade_modal').style.display = 'none';
    document.getElementById('sc_mini_widget').style.display = 'block';
  }

  expandModal() {
    document.getElementById('sc_mini_widget').style.display = 'none';
    document.getElementById('sc_upgrade_modal_overlay').style.display = 'block';
    document.getElementById('sc_upgrade_modal').style.display = 'block';
  }

  // Make element draggable (mouse + touch)
  makeDraggable(element) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    const onStart = (e) => {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = element.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
      element.style.transition = 'none';
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      let newX = clientX - offsetX;
      let newY = clientY - offsetY;

      // Constrain to viewport
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
    element.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    // Touch events
    element.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  createButton() {
    const button = document.createElement('button');
    button.className = 'option btn_small_gold';
    button.setAttribute('data-option', 'map_cards');
    button.textContent = 'ULEPSZ DO...';
    button.addEventListener("click", () => {
      this.showModal();
    });

    document.getElementById("soulcard_menu").appendChild(button);
  }

  initialize() {
    if (!document.getElementById("soulcard_menu").querySelector('button[data-option="map_cards"]')) {
      this.createButton();
    }
  }
}

class calculatePA {
  constructor() {
    this.calculateFinalNumber().catch(error => {
      console.error("Błąd podczas obliczania PA:", error);
    });
  }

  async calculateFinalNumber() {
    const initialPA = parseInt(document.querySelector("#char_pa_max").innerText.replace(/\s+/g, ''), 10);
    let finalNumber = initialPA;

    const itemStacks = await this.getItemStacks([1244, 1242, 1259, 1473, 1260, 1472, 1243, 1471, 1494, 1493, 1492, 1489, 1485, 1484, 1483]);

    finalNumber += itemStacks[1244] * 100;
    finalNumber += itemStacks[1242] * 2000;
    finalNumber += itemStacks[1259] * 5000 + (initialPA * 0.03);
    finalNumber += itemStacks[1473] * 5000 + (initialPA * 0.03);
    finalNumber += itemStacks[1260] * 10000 + (initialPA * 0.15);
    finalNumber += itemStacks[1472] * 10000 + (initialPA * 0.15);
    finalNumber += itemStacks[1243] * initialPA;
    finalNumber += itemStacks[1471] * initialPA;
    finalNumber += (itemStacks[1489] * 5000 + (initialPA * 0.03)) * 20;
    finalNumber += (itemStacks[1489] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1494] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1493] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1492] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1485] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1483] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1484] * 10000 + (initialPA * 0.15)) * 3;
    finalNumber += (itemStacks[1484] * initialPA) * 4;

    this.updatePA(GAME.dots(finalNumber));
    //console.log("MAX PA:" + initialPA + " Łączna ilość:" + finalNumber);
  }

  async getItemStacks(itemIds) {
    const stacks = {};
    itemIds.forEach(id => stacks[id] = 0);
    const pages = [
      { page: 0, page2: 0 },
      { page: 0, page2: 1 },
      { page: 0, page2: 2 }
    ];
    for (let page of pages) {
      await GAME.socket.emit('ga', { a: 12, page: page.page, page2: page.page2, used: 1 });
      await new Promise(resolve => setTimeout(resolve, 1500));
      itemIds.forEach(itemId => {
        const itemElement = document.querySelector(`#ekw_page_items [data-base_item_id="${itemId}"]`);
        if (itemElement) {
          const stack = parseInt(itemElement.getAttribute('data-stack'), 10) || 0;
          stacks[itemId] += stack;
        }
      });
    }
    // console.log(stacks);
    return stacks;
  }

  updatePA(finalNumber) {
    const paDiv = document.getElementById("pa_display");
    if (paDiv) {
      paDiv.innerText = `POSIADANE PA: ${finalNumber}`;
    }
  }
}

class locationWrapper {
  constructor() {
    this.locationsGathered = false;
    $("body").on("click", '#map_link_btn', () => {
      if ($("#changeLocationWrapper").length === 0) {
        let locationWrapperCSS = `
              #changeLocationWrapper {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 15px;
                  margin-top: -50px;
                  position: relative; /* Pozycjonowanie względne */
                  z-index: 10; /* Wyższy z-index, aby kontener był nad innymi elementami */
              }
              #changeLocationWrapper .arrow {
                  width: 50px;
                  height: 50px;
                  background: linear-gradient(135deg, rgb(36 210 210 / 80%), rgb(46 215 215 / 10%));
                  color: white;
                  font-size: 20px;
                  font-weight: bold;
                  border: none;
                  border-radius: 50%;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
                  cursor: pointer;
                  transition: transform 0.2s, box-shadow 0.2s;
                  position: relative; /* Pozycjonowanie względne */
                  z-index: 20; /* Zwiększamy z-index, aby strzałki były na wierzchu */
              }
              #changeLocationWrapper .arrow:hover {
                  transform: scale(1.1);
                  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.3);
              }
              #changeLocationText {
                  font-size: 18px;
                  color: rgb(36 210 210 / 80%);
                  font-weight: bold;
                  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
                  white-space: nowrap; /* Zapobiega zawijaniu tekstu */
              }
              #loc_bons {
                  z-index: 20; /* Najwyższy możliwy z-index */
              }`;
        let locationWrapperHTML = `
              <div id="changeLocationWrapper">
                  <button id="leftArrow" class="arrow">← </button>
                  <span id="changeLocationText" class="green"> ZMIEŃ LOKACJĘ </span>
                  <button id="rightArrow" class="arrow"> →</button>
              </div>`;

        $('#map_y').after(`<style>${locationWrapperCSS}</style>${locationWrapperHTML}`);
      }
      if (!this.locationsGathered) {
        this.locationsGathered = true;
        setTimeout(() => {
          GAME.emitOrder({ a: 19, type: 1 });
          setTimeout(() => { document.querySelector("#map_link_btn").click(); }, 1000);
          setTimeout(() => {
            const dataLocArray = [];
            const list = document.querySelector('#tp_list');
            if (list) {
              const items = list.querySelectorAll("[data-loc]");
              items.forEach(item => {
                const dataLocValue = item.getAttribute("data-loc");
                if (dataLocValue && /^\d{1,4}$/.test(dataLocValue)) {
                  dataLocArray.push(dataLocValue);
                }
              });
              // console.log("Zebrane lokalizacje:", dataLocArray);
            } else {
              console.error("Element o ID #tp_list nie został znaleziony.");
            }
            $('#rightArrow').on('click', function () {
              const currentLoc = String(GAME.char_data.loc);
              const currentIndex = dataLocArray.indexOf(currentLoc);
              if (currentIndex === -1) {
                console.error("BRAK");
              } else if (currentIndex > 0) {
                const previousLoc = dataLocArray[currentIndex - 1];
                GAME.emitOrder({ a: 12, type: 18, loc: previousLoc });
              }
            });
            $('#leftArrow').on('click', function () {
              const currentLoc = String(GAME.char_data.loc);
              const currentIndex = dataLocArray.indexOf(currentLoc);
              if (currentIndex === -1) {
                console.error("BRAK");
              } else if (currentIndex < dataLocArray.length - 1) {
                const nextLoc = dataLocArray[currentIndex + 1];
                GAME.emitOrder({ a: 12, type: 18, loc: nextLoc });
              }
            });
          }, 1000);
        }, 2000);
      }
    });
  }
}

class filterQuest {
  constructor() {
    $("body").on("click", '#map_link_btn', () => {
      if ($("#quest-filter-input").length === 0) {
        let questFilterHTML = `<input type="text" id="quest-filter-input" placeholder="Wpisz coś..." autocomplete="off"/>`;
        let questFilterCSS = {
          position: 'absolute',
          top: '45px',
          right: '120px',
          backgroundSize: '100% 100%',
          border: '1px solid rgb(42 173 173 / 44%)',
          color: 'white',
          width: '200px',
          height: '30px',
          background: 'rgb(249 249 249 / 10%)',
          textAlign: 'center',
          lineHeight: '40px',
          textTransform: 'uppercase',
        };
        $('#rightArrow').after(questFilterHTML);
        $("#quest-filter-input").css(questFilterCSS);
        $("#quest-filter-input").on("input", this.filterQuests);
      }
      this.filterQuests();
    });
    const questContainer = document.querySelector('#drag_con');
    const observer = new MutationObserver(this.filterQuests.bind(this));
    observer.observe(questContainer, { childList: true, subtree: true });
  }
  filterQuests() {
    const inputField = $("#quest-filter-input")[0];
    if (!inputField) return;
    const searchText = inputField.value.toLowerCase();
    const questContainer = document.querySelector('#drag_con');
    const quests = questContainer.querySelectorAll('.qtrack');
    quests.forEach(quest => {
      const questText = quest.textContent.toLowerCase();
      if (questText.includes(searchText)) {
        quest.style.display = '';
      } else {
        quest.style.display = 'none';
      }
    });
  }
}

class chestOpener {
  static CHEST_IDS = [1486, 1264, 1263, 1262];
  static LOOT_ITEMS = {
    45: { name: 'Amulet', img: '/gfx/items/10/3/45.png' },
    789: { name: 'Strój treningowy', img: '/gfx/items/10/9/789.png' },
    790: { name: 'Strój walki', img: '/gfx/items/10/16/790.png' },
    1228: { name: 'Scouter', img: '/gfx/items/10/23/1228.png' },
    837: { name: 'Pancerz', img: '/gfx/items/10/17/837.png' },
    848: { name: 'Opaska', img: '/gfx/items/10/19/848.png' },
    1238: { name: 'Pas', img: '/gfx/items/10/24/1238.png' },
    838: { name: 'Akcesorium', img: '/gfx/items/10/18/838.png' },
    1218: { name: 'Rękawice', img: '/gfx/items/10/22/1218.png' },
    1058: { name: 'Buty', img: '/gfx/items/10/21/1058.png' },
    362: { name: 'Chi', img: '/gfx/items/10/11/362.png' }
  };

  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.openCount = 0;
    this.targetOpenCount = 100;
    this.currentItemId = null;
    this.useTargetMode = false;
    this.lootTargets = JSON.parse(JSON.stringify(chestOpener.LOOT_ITEMS));

    this.injectStyles();
    this.createModal();
    this.attachMenuListener();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  injectStyles() {
    if (document.getElementById('chest_opener_styles')) return;

    const styles = document.createElement('style');
    styles.id = 'chest_opener_styles';
    styles.textContent = `
      #chest_opener_modal_overlay {
        display: none;
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9998;
      }
      #chest_opener_modal {
        display: none;
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #e17055;
        border-radius: 12px;
        padding: 20px;
        z-index: 9999;
        min-width: 340px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 0 30px rgba(225, 112, 85, 0.4);
      }
      #chest_opener_modal .modal-title {
        color: #e17055;
        font-size: 18px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 15px;
        text-transform: uppercase;
      }
      #chest_opener_modal .modal-close, #chest_opener_modal .modal-minimize {
        position: absolute;
        top: 10px;
        font-size: 20px;
        cursor: pointer;
        font-weight: bold;
      }
      #chest_opener_modal .modal-close { right: 15px; color: #ff6b6b; }
      #chest_opener_modal .modal-minimize { right: 45px; color: #f9ca24; }
      #chest_opener_modal .modal-close:hover { color: #ff4757; }
      #chest_opener_modal .modal-minimize:hover { color: #f0932b; }
      #chest_opener_modal .form-group { margin-bottom: 12px; }
      #chest_opener_modal label {
        display: block;
        color: #b8b8b8;
        margin-bottom: 5px;
        font-size: 13px;
      }
      #chest_opener_modal input[type="number"] {
        width: 100%;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #e17055;
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        box-sizing: border-box;
      }
      #chest_opener_modal input[type="number"]:focus {
        outline: none;
        border-color: #fab1a0;
      }
      #chest_opener_modal .mode-toggle {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }
      #chest_opener_modal .mode-btn {
        flex: 1;
        padding: 10px;
        border: 2px solid #e17055;
        background: transparent;
        color: #e17055;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
      }
      #chest_opener_modal .mode-btn.active {
        background: #e17055;
        color: #1a1a2e;
      }
      #chest_opener_modal .targets-container {
        display: none;
        max-height: 250px;
        overflow-y: auto;
        background: rgba(0,0,0,0.2);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 15px;
      }
      #chest_opener_modal .target-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
        font-size: 13px;
      }
      #chest_opener_modal .target-row label {
        flex: 1;
        margin: 0;
        color: #ddd;
      }
      #chest_opener_modal .target-row input {
        width: 60px;
        padding: 5px;
        text-align: center;
      }
      #chest_opener_modal .target-row .collected {
        color: #55efc4;
        min-width: 50px;
        text-align: right;
      }
      #chest_opener_modal .btn-row {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }
      #chest_opener_modal .modal-btn {
        flex: 1;
        padding: 10px 15px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 13px;
        text-transform: uppercase;
        transition: all 0.2s;
      }
      #chest_opener_modal .btn-start {
        background: linear-gradient(135deg, #e17055 0%, #d63031 100%);
        color: #fff;
      }
      #chest_opener_modal .btn-start:hover {
        background: linear-gradient(135deg, #fab1a0 0%, #e17055 100%);
      }
      #chest_opener_modal .btn-pause {
        background: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
        color: #1a1a2e;
      }
      #chest_opener_modal .btn-stop {
        background: linear-gradient(135deg, #636e72 0%, #2d3436 100%);
        color: #fff;
      }
      #chest_opener_modal .progress-section {
        display: none;
        margin-top: 15px;
      }
      #chest_opener_modal .progress-bar-container {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 10px;
        overflow: hidden;
        height: 20px;
        margin-bottom: 10px;
      }
      #chest_opener_modal .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #e17055, #d63031);
        transition: width 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        color: #fff;
      }
      #chest_opener_modal .progress-text {
        color: #b8b8b8;
        font-size: 12px;
        text-align: center;
      }
      /* Mini Widget */
      #chest_mini_widget {
        display: none;
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #e17055;
        border-radius: 10px;
        padding: 10px 15px;
        z-index: 9999;
        cursor: move;
        box-shadow: 0 0 20px rgba(225, 112, 85, 0.4);
        min-width: 180px;
        touch-action: none;
      }
      #chest_mini_widget .mini-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      #chest_mini_widget .mini-title {
        color: #e17055;
        font-size: 12px;
        font-weight: bold;
      }
      #chest_mini_widget .mini-expand {
        color: #e17055;
        cursor: pointer;
        font-size: 16px;
      }
      #chest_mini_widget .mini-progress {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 6px;
        overflow: hidden;
        height: 14px;
        margin-bottom: 6px;
      }
      #chest_mini_widget .mini-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #e17055, #d63031);
        transition: width 0.3s ease;
      }
      #chest_mini_widget .mini-status {
        color: #b8b8b8;
        font-size: 11px;
        text-align: center;
      }
    `;
    document.head.appendChild(styles);
  }

  createModal() {
    if (document.getElementById('chest_opener_modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'chest_opener_modal_overlay';

    const modal = document.createElement('div');
    modal.id = 'chest_opener_modal';

    // Build target rows HTML
    let targetRowsHtml = '';
    for (const [itemId, item] of Object.entries(chestOpener.LOOT_ITEMS)) {
      targetRowsHtml += `
        <div class="target-row">
          <img src="${item.img}" style="width: 24px; height: 24px; margin-right: 6px;">
          <label>${item.name}</label>
          <input type="number" min="0" value="0" data-item-id="${itemId}" class="target-input">
          <span class="collected" data-collected-id="${itemId}">0</span>
        </div>
      `;
    }

    modal.innerHTML = `
      <span class="modal-minimize" title="Minimalizuj">_</span>
      <span class="modal-close">&times;</span>
      <div class="modal-title">📦 Otwieracz</div>
      
      <div class="mode-toggle">
        <button class="mode-btn active" data-mode="count">Ilość</button>
        <button class="mode-btn" data-mode="targets">Do zebrania</button>
      </div>
      
      <div class="form-group" id="chest_count_mode">
        <label>Ile skrzyń otworzyć:</label>
        <input type="number" id="chest_open_count" min="1" value="100">
      </div>
      
      <div class="targets-container" id="chest_targets_mode">
        <label style="margin-bottom: 10px; display: block;">Otwieraj do zebrania:</label>
        ${targetRowsHtml}
      </div>
      
      <div class="btn-row" id="chest_main_controls">
        <button class="modal-btn btn-start" id="chest_btn_start">▶️ START</button>
      </div>
      
      <div class="progress-section" id="chest_progress_section">
        <div class="progress-bar-container">
          <div class="progress-bar" id="chest_progress_bar" style="width: 0%">0%</div>
        </div>
        <div class="progress-text" id="chest_progress_text">Przygotowanie...</div>
        <div class="btn-row">
          <button class="modal-btn btn-pause" id="chest_btn_pause">⏸️ PAUZA</button>
          <button class="modal-btn btn-stop" id="chest_btn_stop">⏹️ STOP</button>
        </div>
      </div>
    `;

    // Mini widget
    const miniWidget = document.createElement('div');
    miniWidget.id = 'chest_mini_widget';
    miniWidget.innerHTML = `
      <div class="mini-header">
        <span class="mini-title">📦 Skrzynie</span>
        <span class="mini-expand" title="Rozwiń">⬆</span>
      </div>
      <div class="mini-progress">
        <div class="mini-progress-bar" id="chest_mini_progress_bar" style="width: 0%"></div>
      </div>
      <div class="mini-status" id="chest_mini_status">Wstrzymano</div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    document.body.appendChild(miniWidget);

    // Make mini widget draggable
    this.makeDraggable(miniWidget);

    // Event listeners
    overlay.addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-minimize').addEventListener('click', () => this.minimizeModal());
    miniWidget.querySelector('.mini-expand').addEventListener('click', () => this.expandModal());

    // Mode toggle
    modal.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
    });

    document.getElementById('chest_btn_start').addEventListener('click', () => this.onStart());
    document.getElementById('chest_btn_pause').addEventListener('click', () => this.onPauseResume());
    document.getElementById('chest_btn_stop').addEventListener('click', () => this.onStop());
  }

  attachMenuListener() {
    // Add button to item menu when chest is selected
    $(document).on('click', '.player_ekw_item', (e) => {
      const item = $(e.currentTarget);
      const baseItemId = parseInt(item.attr('data-base_item_id'));

      setTimeout(() => {
        const menu = document.getElementById('ekw_item_menu');
        if (!menu || menu.style.display === 'none') return;

        // Remove old button if exists
        const oldBtn = menu.querySelector('#ekw_menu_mass_open');
        if (oldBtn) oldBtn.remove();

        if (chestOpener.CHEST_IDS.includes(baseItemId)) {
          const btn = document.createElement('button');
          btn.id = 'ekw_menu_mass_open';
          btn.className = 'ekw_menu_btn option btn_small_gold';
          btn.textContent = 'Otwieracz';
          btn.style.display = '';
          btn.addEventListener('click', () => {
            this.currentItemId = parseInt(item.attr('data-item_id'));
            this.showModal();
          });
          menu.appendChild(btn);
        }
      }, 50);
    });
  }

  switchMode(mode) {
    const countMode = document.getElementById('chest_count_mode');
    const targetsMode = document.getElementById('chest_targets_mode');
    const btns = document.querySelectorAll('#chest_opener_modal .mode-btn');

    btns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    if (mode === 'count') {
      countMode.style.display = 'block';
      targetsMode.style.display = 'none';
      this.useTargetMode = false;
    } else {
      countMode.style.display = 'none';
      targetsMode.style.display = 'block';
      this.useTargetMode = true;
    }
  }

  showModal() {
    // Reset collected counts
    for (const key of Object.keys(this.lootTargets)) {
      this.lootTargets[key].collected = 0;
      const el = document.querySelector(`[data-collected-id="${key}"]`);
      if (el) el.textContent = '0';
    }

    document.getElementById('chest_opener_modal_overlay').style.display = 'block';
    document.getElementById('chest_opener_modal').style.display = 'block';
    document.getElementById('chest_main_controls').style.display = 'flex';
    document.getElementById('chest_progress_section').style.display = 'none';
  }

  hideModal() {
    if (this.isRunning) this.onStop();
    document.getElementById('chest_opener_modal_overlay').style.display = 'none';
    document.getElementById('chest_opener_modal').style.display = 'none';
  }

  minimizeModal() {
    document.getElementById('chest_opener_modal_overlay').style.display = 'none';
    document.getElementById('chest_opener_modal').style.display = 'none';
    document.getElementById('chest_mini_widget').style.display = 'block';
  }

  expandModal() {
    document.getElementById('chest_mini_widget').style.display = 'none';
    document.getElementById('chest_opener_modal_overlay').style.display = 'block';
    document.getElementById('chest_opener_modal').style.display = 'block';
  }

  makeDraggable(element) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    const onStart = (e) => {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = element.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
      element.style.transition = 'none';
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      let newX = Math.max(0, Math.min(clientX - offsetX, window.innerWidth - element.offsetWidth));
      let newY = Math.max(0, Math.min(clientY - offsetY, window.innerHeight - element.offsetHeight));
      element.style.left = newX + 'px';
      element.style.top = newY + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    };

    const onEnd = () => { isDragging = false; element.style.transition = ''; };

    element.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    element.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  async onStart() {
    this.isRunning = true;
    this.isPaused = false;
    this.openCount = 0;

    // Read targets if in target mode
    if (this.useTargetMode) {
      document.querySelectorAll('.target-input').forEach(input => {
        const itemId = input.dataset.itemId;
        this.lootTargets[itemId].target = parseInt(input.value) || 0;
        this.lootTargets[itemId].collected = 0;
      });
    } else {
      this.targetOpenCount = parseInt(document.getElementById('chest_open_count').value) || 100;
    }

    document.getElementById('chest_main_controls').style.display = 'none';
    document.getElementById('chest_progress_section').style.display = 'block';
    document.getElementById('chest_btn_pause').textContent = '⏸️ PAUZA';

    await this.runOpenProcess();
  }

  onPauseResume() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('chest_btn_pause');
    if (this.isPaused) {
      btn.textContent = '▶️ WZNÓW';
      this.updateProgressText('⏸️ Wstrzymano...');
    } else {
      btn.textContent = '⏸️ PAUZA';
    }
  }

  onStop() {
    this.isRunning = false;
    this.isPaused = false;
    document.getElementById('chest_main_controls').style.display = 'flex';
    document.getElementById('chest_progress_section').style.display = 'none';
  }

  updateProgress(percent) {
    const bar = document.getElementById('chest_progress_bar');
    bar.style.width = `${percent}%`;
    bar.textContent = `${percent}%`;
    const miniBar = document.getElementById('chest_mini_progress_bar');
    if (miniBar) miniBar.style.width = `${percent}%`;
  }

  updateProgressText(text) {
    document.getElementById('chest_progress_text').textContent = text;
    const miniStatus = document.getElementById('chest_mini_status');
    if (miniStatus) miniStatus.textContent = text.length > 25 ? text.substring(0, 22) + '...' : text;
  }

  parseDrops(komContent) {
    // Parse items from kom_con response
    // data-item_id in HTML -> dataset.item_id in JS (underscore preserved)
    const items = komContent.querySelectorAll('.ekw_slot');
    items.forEach(item => {
      const itemId = item.getAttribute('data-item_id'); // Use getAttribute for safety
      const countDiv = item.querySelector('div');
      const count = countDiv ? parseInt(countDiv.textContent) || 1 : 1;

      if (itemId && this.lootTargets[itemId]) {
        this.lootTargets[itemId].collected += count;
        const el = document.querySelector(`[data-collected-id="${itemId}"]`);
        if (el) el.textContent = this.lootTargets[itemId].collected;
      }
    });
  }

  checkTargetsReached() {
    if (!this.useTargetMode) return false;

    for (const [itemId, item] of Object.entries(this.lootTargets)) {
      if (item.target > 0 && item.collected < item.target) {
        return false;
      }
    }
    return true;
  }

  async runOpenProcess() {
    while (this.isRunning) {
      // Check pause
      while (this.isPaused && this.isRunning) {
        await this.delay(200);
      }
      if (!this.isRunning) break;

      // Check count limit in count mode
      if (!this.useTargetMode && this.openCount >= this.targetOpenCount) {
        this.updateProgressText(`✅ Gotowe! Otwarto ${this.openCount} skrzyń`);
        this.updateProgress(100);
        await this.delay(2000);
        this.onStop();
        return;
      }

      // Check targets in target mode
      if (this.useTargetMode && this.checkTargetsReached()) {
        this.updateProgressText(`✅ Cele osiągnięte! Otwarto ${this.openCount}`);
        this.updateProgress(100);
        await this.delay(2000);
        this.onStop();
        return;
      }

      // Check if item still exists
      const itemEl = document.querySelector(`[data-item_id="${this.currentItemId}"]`);
      if (!itemEl) {
        this.updateProgressText('⚠️ Skrzynie się skończyły!');
        await this.delay(2000);
        this.onStop();
        return;
      }

      const stack = parseInt(itemEl.dataset.stack) || 0;
      if (stack <= 0) {
        this.updateProgressText('⚠️ Skrzynie się skończyły!');
        await this.delay(2000);
        this.onStop();
        return;
      }

      // Calculate how many to open (max 100)
      let toOpen = 100;
      if (!this.useTargetMode) {
        toOpen = Math.min(100, this.targetOpenCount - this.openCount, stack);
      } else {
        toOpen = Math.min(100, stack);
      }

      this.updateProgressText(`Otwieram ${toOpen} skrzyń...`);

      // Emit open command
      GAME.emitOrder({ a: 12, type: 14, iid: this.currentItemId, page: GAME.ekw_page, page2: GAME.ekw_page2, am: toOpen });

      // Wait for kom_con to appear with drops (poll until it appears or timeout)
      let komContent = null;
      for (let i = 0; i < 30; i++) { // max 3 seconds wait
        await this.delay(100);
        komContent = document.querySelector('#kom_con .limited_kom');
        if (komContent && komContent.querySelectorAll('.ekw_slot').length > 0) {
          break;
        }
      }

      // Parse drops before closing
      if (komContent) {
        this.parseDrops(komContent);
      }

      // Close kom after parsing
      kom_clear();

      this.openCount += toOpen;

      // Update progress
      if (!this.useTargetMode) {
        const percent = Math.round((this.openCount / this.targetOpenCount) * 100);
        this.updateProgress(percent);
      }
      this.updateProgressText(`Otwarto: ${this.openCount} skrzyń`);

      // Wait remaining time to make 1s total between batches
      await this.delay(700);
    }
  }
}

// Initialize chest opener
new chestOpener();

class itemUpgrader {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentItemId = null;
    this.currentItemStack = 0;
    this.currentLevel = 0;
    this.targetLevel = 5;
    this.minToKeep = 10;
    this.successCount = 0;
    this.burnedCount = 0;
    this.totalAttempts = 0;

    this.injectStyles();
    this.createModal();
    this.attachMenuListener();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  injectStyles() {
    if (document.getElementById('item_upgrader_styles')) return;

    const styles = document.createElement('style');
    styles.id = 'item_upgrader_styles';
    styles.textContent = `
      #item_upgrader_modal_overlay {
        display: none;
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9998;
      }
      #item_upgrader_modal {
        display: none;
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #a29bfe;
        border-radius: 12px;
        padding: 20px;
        z-index: 9999;
        min-width: 340px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 0 30px rgba(162, 155, 254, 0.4);
      }
      #item_upgrader_modal .modal-title {
        color: #a29bfe;
        font-size: 18px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 15px;
        text-transform: uppercase;
      }
      #item_upgrader_modal .modal-close, #item_upgrader_modal .modal-minimize {
        position: absolute;
        top: 10px;
        font-size: 20px;
        cursor: pointer;
        font-weight: bold;
      }
      #item_upgrader_modal .modal-close { right: 15px; color: #ff6b6b; }
      #item_upgrader_modal .modal-minimize { right: 45px; color: #f9ca24; }
      #item_upgrader_modal .modal-close:hover { color: #ff4757; }
      #item_upgrader_modal .modal-minimize:hover { color: #f0932b; }
      #item_upgrader_modal .form-group { margin-bottom: 12px; }
      #item_upgrader_modal label {
        display: block;
        color: #b8b8b8;
        margin-bottom: 5px;
        font-size: 13px;
      }
      #item_upgrader_modal input[type="number"] {
        width: 100%;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #a29bfe;
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        box-sizing: border-box;
      }
      #item_upgrader_modal input[type="number"]:focus {
        outline: none;
        border-color: #6c5ce7;
      }
      #item_upgrader_modal .info-box {
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
        padding: 12px;
        margin: 15px 0;
        font-size: 13px;
        color: #ddd;
      }
      #item_upgrader_modal .info-box .highlight {
        color: #a29bfe;
        font-weight: bold;
      }
      #item_upgrader_modal .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin: 15px 0;
      }
      #item_upgrader_modal .stat-box {
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
        padding: 10px;
        text-align: center;
      }
      #item_upgrader_modal .stat-box .stat-label {
        font-size: 11px;
        color: #888;
        text-transform: uppercase;
      }
      #item_upgrader_modal .stat-box .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #a29bfe;
      }
      #item_upgrader_modal .stat-box.success .stat-value { color: #55efc4; }
      #item_upgrader_modal .stat-box.burned .stat-value { color: #ff6b6b; }
      #item_upgrader_modal .btn-row {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }
      #item_upgrader_modal .modal-btn {
        flex: 1;
        padding: 10px 15px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 13px;
        text-transform: uppercase;
        transition: all 0.2s;
      }
      #item_upgrader_modal .btn-start {
        background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
        color: #fff;
      }
      #item_upgrader_modal .btn-start:hover {
        background: linear-gradient(135deg, #6c5ce7 0%, #5f27cd 100%);
      }
      #item_upgrader_modal .btn-pause {
        background: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
        color: #1a1a2e;
      }
      #item_upgrader_modal .btn-stop {
        background: linear-gradient(135deg, #636e72 0%, #2d3436 100%);
        color: #fff;
      }
      #item_upgrader_modal .progress-section {
        display: none;
        margin-top: 15px;
      }
      #item_upgrader_modal .progress-bar-container {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 10px;
        overflow: hidden;
        height: 20px;
        margin-bottom: 10px;
      }
      #item_upgrader_modal .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #a29bfe, #6c5ce7);
        transition: width 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        color: #fff;
      }
      #item_upgrader_modal .progress-text {
        color: #b8b8b8;
        font-size: 12px;
        text-align: center;
      }
      /* Mini Widget */
      #upgrader_mini_widget {
        display: none;
        position: fixed;
        bottom: 140px;
        right: 20px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #a29bfe;
        border-radius: 10px;
        padding: 10px 15px;
        z-index: 9999;
        cursor: move;
        box-shadow: 0 0 20px rgba(162, 155, 254, 0.4);
        min-width: 180px;
        touch-action: none;
      }
      #upgrader_mini_widget .mini-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      #upgrader_mini_widget .mini-title {
        color: #a29bfe;
        font-size: 12px;
        font-weight: bold;
      }
      #upgrader_mini_widget .mini-expand {
        color: #a29bfe;
        cursor: pointer;
        font-size: 16px;
      }
      #upgrader_mini_widget .mini-progress {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 6px;
        overflow: hidden;
        height: 14px;
        margin-bottom: 6px;
      }
      #upgrader_mini_widget .mini-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #a29bfe, #6c5ce7);
        transition: width 0.3s ease;
      }
      #upgrader_mini_widget .mini-status {
        color: #b8b8b8;
        font-size: 11px;
        text-align: center;
      }
    `;
    document.head.appendChild(styles);
  }

  createModal() {
    if (document.getElementById('item_upgrader_modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'item_upgrader_modal_overlay';

    const modal = document.createElement('div');
    modal.id = 'item_upgrader_modal';

    modal.innerHTML = `
      <span class="modal-minimize" title="Minimalizuj">_</span>
      <span class="modal-close">&times;</span>
      <div class="modal-title">⚡ Ulepszacz</div>
      
      <div class="info-box" id="upg_item_info">
        Wybierz przedmiot z opcją "Ulepsz"
      </div>
      
      <div class="form-group">
        <label>Ile przedmiotów ulepszać:</label>
        <div style="display: flex; gap: 8px;">
          <input type="number" id="upg_start_count" min="1" placeholder="Ilość" style="flex: 1;">
          <button class="modal-btn" id="upg_max_btn" style="flex: 0; padding: 8px 15px; background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);">MAX</button>
        </div>
      </div>
      
      <div class="form-group">
        <label>Docelowy plus:</label>
        <input type="number" id="upg_target_level" min="1" max="99" placeholder="np. 10">
      </div>
      
      <div class="form-group">
        <label>Ile przedmiotów ma zostać:</label>
        <input type="number" id="upg_min_keep" min="0" placeholder="0 = do osiągnięcia plusa lub spalenia wszystkiego">
      </div>
      
      <div class="info-box" style="font-size: 12px; color: #888;">
        💡 <b>Jak to działa:</b><br>
        • Ulepszam wszystkie przedmioty poziom po poziomie<br>
        • Gdy pozostanie ≤ minimum → STOP<br>
        • Wynik: minimum przedmiotów na najwyższym osiągniętym +
      </div>
      
      <div class="btn-row" id="upg_main_controls">
        <button class="modal-btn btn-start" id="upg_btn_start">▶️ START</button>
      </div>
      
      <div class="progress-section" id="upg_progress_section">
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Poziom</div>
            <div class="stat-value" id="upg_current_level">+0</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Pozostało</div>
            <div class="stat-value" id="upg_remaining">0</div>
          </div>
          <div class="stat-box success">
            <div class="stat-label">Udane</div>
            <div class="stat-value" id="upg_success">0</div>
          </div>
          <div class="stat-box burned">
            <div class="stat-label">Spalone</div>
            <div class="stat-value" id="upg_burned">0</div>
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" id="upg_progress_bar" style="width: 0%">0%</div>
        </div>
        <div class="progress-text" id="upg_progress_text">Przygotowanie...</div>
        <div class="btn-row">
          <button class="modal-btn btn-pause" id="upg_btn_pause">⏸️ PAUZA</button>
          <button class="modal-btn btn-stop" id="upg_btn_stop">⏹️ STOP</button>
        </div>
      </div>
    `;

    // Mini widget
    const miniWidget = document.createElement('div');
    miniWidget.id = 'upgrader_mini_widget';
    miniWidget.innerHTML = `
      <div class="mini-header">
        <span class="mini-title">⚡ Ulepszacz</span>
        <span class="mini-expand" title="Rozwiń">⬆</span>
      </div>
      <div class="mini-progress">
        <div class="mini-progress-bar" id="upg_mini_progress_bar" style="width: 0%"></div>
      </div>
      <div class="mini-status" id="upg_mini_status">Wstrzymano</div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    document.body.appendChild(miniWidget);

    this.makeDraggable(miniWidget);

    // Event listeners
    overlay.addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-minimize').addEventListener('click', () => this.minimizeModal());
    miniWidget.querySelector('.mini-expand').addEventListener('click', () => this.expandModal());

    document.getElementById('upg_btn_start').addEventListener('click', () => this.onStart());
    document.getElementById('upg_btn_pause').addEventListener('click', () => this.onPauseResume());
    document.getElementById('upg_btn_stop').addEventListener('click', () => this.onStop());
    document.getElementById('upg_max_btn').addEventListener('click', () => {
      document.getElementById('upg_start_count').value = this.currentItemStack;
    });
  }

  attachMenuListener() {
    // Add button when item menu shows "Ulepsz" option
    $(document).on('click', '.player_ekw_item', (e) => {
      const item = $(e.currentTarget);

      setTimeout(() => {
        const menu = document.getElementById('ekw_item_menu');
        if (!menu || menu.style.display === 'none') return;

        const upgBtn = menu.querySelector('#ekw_menu_upg');
        if (!upgBtn || upgBtn.style.display === 'none') return;

        // Remove old button if exists
        const oldBtn = menu.querySelector('#ekw_menu_upgrader');
        if (oldBtn) oldBtn.remove();

        const btn = document.createElement('button');
        btn.id = 'ekw_menu_upgrader';
        btn.className = 'ekw_menu_btn option btn_small_gold';
        btn.textContent = 'Ulepszacz';
        btn.style.display = '';
        btn.addEventListener('click', () => {
          this.currentItemId = parseInt(item.attr('data-item_id'));
          this.baseItemId = parseInt(item.attr('data-base_item_id')); // Store base ID for finding after upgrade
          this.currentItemStack = parseInt(item.attr('data-stack')) || 1;
          this.currentLevel = parseInt(item.attr('data-upgrade')) || 0;
          const itemName = item.find('img').attr('src');
          this.showModal(itemName, this.currentItemStack, this.currentLevel);
        });
        upgBtn.after(btn);
      }, 50);
    });
  }

  showModal(itemImg, stack, level) {
    document.getElementById('upg_item_info').innerHTML = `
      <img src="${itemImg}" style="width: 32px; height: 32px; vertical-align: middle; margin-right: 10px;">
      Posiadasz: <span class="highlight">${stack}</span> szt. na poziomie <span class="highlight">+${level}</span>
    `;

    document.getElementById('item_upgrader_modal_overlay').style.display = 'block';
    document.getElementById('item_upgrader_modal').style.display = 'block';
    document.getElementById('upg_main_controls').style.display = 'flex';
    document.getElementById('upg_progress_section').style.display = 'none';
  }

  hideModal() {
    if (this.isRunning) this.onStop();
    document.getElementById('item_upgrader_modal_overlay').style.display = 'none';
    document.getElementById('item_upgrader_modal').style.display = 'none';
  }

  minimizeModal() {
    document.getElementById('item_upgrader_modal_overlay').style.display = 'none';
    document.getElementById('item_upgrader_modal').style.display = 'none';
    document.getElementById('upgrader_mini_widget').style.display = 'block';
  }

  expandModal() {
    document.getElementById('upgrader_mini_widget').style.display = 'none';
    document.getElementById('item_upgrader_modal_overlay').style.display = 'block';
    document.getElementById('item_upgrader_modal').style.display = 'block';
  }

  makeDraggable(element) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    const onStart = (e) => {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = element.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
      element.style.transition = 'none';
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      let newX = Math.max(0, Math.min(clientX - offsetX, window.innerWidth - element.offsetWidth));
      let newY = Math.max(0, Math.min(clientY - offsetY, window.innerHeight - element.offsetHeight));
      element.style.left = newX + 'px';
      element.style.top = newY + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    };

    const onEnd = () => { isDragging = false; element.style.transition = ''; };

    element.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    element.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  async onStart() {
    this.isRunning = true;
    this.isPaused = false;
    this.startCount = parseInt(document.getElementById('upg_start_count').value) || 100;
    this.targetLevel = parseInt(document.getElementById('upg_target_level').value) || 10;
    this.minToKeep = parseInt(document.getElementById('upg_min_keep').value) || 10;
    this.successCount = 0;
    this.burnedCount = 0;

    // Validate: can't use more than we have
    if (this.startCount > this.currentItemStack) {
      this.startCount = this.currentItemStack;
    }

    document.getElementById('upg_main_controls').style.display = 'none';
    document.getElementById('upg_progress_section').style.display = 'block';
    document.getElementById('upg_btn_pause').textContent = '⏸️ PAUZA';

    await this.runUpgradeProcess();
  }

  onPauseResume() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('upg_btn_pause');
    if (this.isPaused) {
      btn.textContent = '▶️ WZNÓW';
      this.updateProgressText('⏸️ Wstrzymano...');
    } else {
      btn.textContent = '⏸️ PAUZA';
    }
  }

  onStop(hideSummary = true) {
    this.isRunning = false;
    this.isPaused = false;
    document.getElementById('upg_main_controls').style.display = 'flex';
    if (hideSummary) {
      document.getElementById('upg_progress_section').style.display = 'none';
    }
  }

  updateStats(level, remaining, success, burned) {
    document.getElementById('upg_current_level').textContent = `+${level}`;
    document.getElementById('upg_remaining').textContent = remaining;
    document.getElementById('upg_success').textContent = success;
    document.getElementById('upg_burned').textContent = burned;
  }

  updateProgress(percent) {
    const bar = document.getElementById('upg_progress_bar');
    bar.style.width = `${percent}%`;
    bar.textContent = `${percent}%`;
    const miniBar = document.getElementById('upg_mini_progress_bar');
    if (miniBar) miniBar.style.width = `${percent}%`;
  }

  updateProgressText(text) {
    document.getElementById('upg_progress_text').textContent = text;
    const miniStatus = document.getElementById('upg_mini_status');
    if (miniStatus) miniStatus.textContent = text.length > 25 ? text.substring(0, 22) + '...' : text;
  }

  async waitForResult(timeout = 8000) {
    // Wait for kom_con with result
    for (let i = 0; i < timeout / 100; i++) {
      await this.delay(100);
      const kom = document.querySelector('#kom_con .kom .content');
      if (kom && kom.textContent.includes('Operacja zakończona')) {
        // Parse result: "Powiodło się: X" and "Próby nieudane: Y"
        // Numbers may have spaces as thousand separators (e.g. "2 137")
        const successMatch = kom.innerHTML.match(/Powiodło się:\s*<b[^>]*>([\d\s]+)</);
        const failMatch = kom.innerHTML.match(/Próby nieudane:\s*<b[^>]*>([\d\s]+)</);

        // Remove spaces from numbers before parsing
        const success = successMatch ? parseInt(successMatch[1].replace(/\s/g, '')) : 0;
        const failed = failMatch ? parseInt(failMatch[1].replace(/\s/g, '')) : 0;

        kom_clear();
        return { success, failed };
      }
    }
    kom_clear();
    return { success: 0, failed: 0 };
  }

  async runUpgradeProcess() {
    let remaining = this.startCount;
    let level = this.currentLevel;
    let currentItemId = this.currentItemId;

    this.updateStats(level, remaining, 0, 0);
    this.updateProgressText(`Start: ${remaining} przedmiotów na +${level}`);

    await this.delay(500);

    while (this.isRunning && level < this.targetLevel) {
      // Check pause
      while (this.isPaused && this.isRunning) {
        await this.delay(200);
      }
      if (!this.isRunning) break;

      // SMART STOP: if minToKeep > 0 and we're at or below it, we're done!
      if (this.minToKeep > 0 && remaining <= this.minToKeep) {
        this.updateProgressText(`🎯 Cel osiągnięty! ${remaining} szt. na +${level}`);
        this.updateProgress(100);
        await this.delay(3000);
        this.onStop(false);
        return;
      }

      // Check if we have items
      if (remaining <= 0) {
        this.updateProgressText('❌ Wszystko spalone!');
        await this.delay(2000);
        this.onStop();
        return;
      }

      const nextLevel = level + 1;
      this.updateProgressText(`⚡ +${level} → +${nextLevel} (${remaining} szt.)...`);

      // Try to find item - first check if GAME.dragged_item is set and valid
      if (GAME.dragged_item && GAME.dragged_item.id) {
        currentItemId = GAME.dragged_item.id;
      } else {
        // Fallback: find by base_item_id and upgrade level with retries
        let itemEl = null;
        for (let retry = 0; retry < 15; retry++) {
          itemEl = document.querySelector(`[data-base_item_id="${this.baseItemId}"][data-upgrade="${level}"]`);
          if (itemEl) {
            currentItemId = parseInt(itemEl.getAttribute('data-item_id'));
            break;
          }
          await this.delay(300);
        }

        if (!itemEl) {
          this.updateProgressText(`⚠️ Nie znaleziono +${level}! Sprawdź ekwipunek.`);
          await this.delay(3000);
          this.onStop();
          return;
        }
      }

      console.log(`[Ulepszacz] Upgrading item ${currentItemId}, amount: ${remaining}, from +${level} to +${nextLevel}`);

      // Emit upgrade command
      GAME.emitOrder({ a: 12, type: 10, iid: currentItemId, page: GAME.ekw_page, page2: GAME.ekw_page2, am: remaining });

      // Wait for result
      const result = await this.waitForResult(8000);


      if (result.success === 0 && result.failed === 0) {
        this.updateProgressText(`⚠️ Brak odpowiedzi serwera!`);
        await this.delay(2000);
        this.onStop();
        return;
      }

      this.successCount += result.success;
      this.burnedCount += result.failed;

      // Update state
      level = nextLevel;
      remaining = result.success;

      this.updateStats(level, remaining, this.successCount, this.burnedCount);

      // Progress
      const progress = Math.min(99, Math.round((level / this.targetLevel) * 100));
      this.updateProgress(progress);

      // Wait for DOM to update
      await this.delay(1000);

      // Clear GAME.dragged_item to force re-lookup next iteration
      GAME.dragged_item = null;
    }

    // Final message
    if (this.isRunning) {
      if (level >= this.targetLevel && remaining > 0) {
        this.updateProgressText(`🏆 Osiągnięto +${level}! Pozostało: ${remaining}`);
      } else {
        this.updateProgressText(`✅ Zakończono: ${remaining} szt. na +${level}`);
      }
      this.updateProgress(100);
      await this.delay(3000);
      this.onStop(false);
    }
  }
}

// Initialize item upgrader
new itemUpgrader();

class cardPackOpener {
  static CARD_PACK_IDS = [1784, 2235, 2083];

  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentItemId = null;
    this.currentItemStack = 0;
    this.useLeaveMode = true; // true = "leave X", false = "open X"
    this.targetCount = 0;
    this.openedCount = 0;
    this.collectedCards = {}; // { cardImg: { level, count } }

    this.injectStyles();
    this.createModal();
    this.attachMenuListener();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  injectStyles() {
    if (document.getElementById('card_opener_styles')) return;

    const styles = document.createElement('style');
    styles.id = 'card_opener_styles';
    styles.textContent = `
      #card_opener_modal_overlay {
        display: none;
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9998;
      }
      #card_opener_modal {
        display: none;
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #fd79a8;
        border-radius: 12px;
        padding: 20px;
        z-index: 9999;
        min-width: 360px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 0 30px rgba(253, 121, 168, 0.4);
      }
      #card_opener_modal .modal-title {
        color: #fd79a8;
        font-size: 18px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 15px;
        text-transform: uppercase;
      }
      #card_opener_modal .modal-close, #card_opener_modal .modal-minimize {
        position: absolute;
        top: 10px;
        font-size: 20px;
        cursor: pointer;
        font-weight: bold;
      }
      #card_opener_modal .modal-close { right: 15px; color: #ff6b6b; }
      #card_opener_modal .modal-minimize { right: 45px; color: #f9ca24; }
      #card_opener_modal .form-group { margin-bottom: 12px; }
      #card_opener_modal label {
        display: block;
        color: #b8b8b8;
        margin-bottom: 5px;
        font-size: 13px;
      }
      #card_opener_modal input[type="number"] {
        width: 100%;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #fd79a8;
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        box-sizing: border-box;
      }
      #card_opener_modal .info-box {
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
        padding: 12px;
        margin: 15px 0;
        font-size: 13px;
        color: #ddd;
      }
      #card_opener_modal .info-box .highlight {
        color: #fd79a8;
        font-weight: bold;
      }
      #card_opener_modal .mode-toggle {
        display: flex;
        gap: 5px;
        margin-bottom: 15px;
      }
      #card_opener_modal .mode-btn {
        flex: 1;
        padding: 10px;
        border: 2px solid #fd79a8;
        background: transparent;
        color: #fd79a8;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
      }
      #card_opener_modal .mode-btn.active {
        background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%);
        color: #fff;
      }
      #card_opener_modal .btn-row {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }
      #card_opener_modal .modal-btn {
        flex: 1;
        padding: 10px 15px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 13px;
        text-transform: uppercase;
        transition: all 0.2s;
      }
      #card_opener_modal .btn-start {
        background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%);
        color: #fff;
      }
      #card_opener_modal .btn-pause {
        background: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
        color: #1a1a2e;
      }
      #card_opener_modal .btn-stop {
        background: linear-gradient(135deg, #636e72 0%, #2d3436 100%);
        color: #fff;
      }
      #card_opener_modal .progress-section {
        display: none;
        margin-top: 15px;
      }
      #card_opener_modal .progress-bar-container {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 10px;
        overflow: hidden;
        height: 20px;
        margin-bottom: 10px;
      }
      #card_opener_modal .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #fd79a8, #e84393);
        transition: width 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        color: #fff;
      }
      #card_opener_modal .progress-text {
        color: #b8b8b8;
        font-size: 12px;
        text-align: center;
        margin-bottom: 10px;
      }
      #card_opener_modal .cards-summary {
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
        padding: 10px;
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 10px;
      }
      #card_opener_modal .cards-summary-title {
        color: #fd79a8;
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 8px;
      }
      #card_opener_modal .card-row {
        display: flex;
        align-items: center;
        padding: 3px 0;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      #card_opener_modal .card-row img {
        width: 24px;
        height: 24px;
        margin-right: 8px;
      }
      #card_opener_modal .card-row .card-info {
        flex: 1;
        color: #ddd;
        font-size: 12px;
      }
      #card_opener_modal .card-row .card-count {
        color: #55efc4;
        font-weight: bold;
        font-size: 13px;
      }
      /* Mini Widget */
      #card_mini_widget {
        display: none;
        position: fixed;
        bottom: 200px;
        right: 20px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #fd79a8;
        border-radius: 10px;
        padding: 10px 15px;
        z-index: 9999;
        cursor: move;
        box-shadow: 0 0 20px rgba(253, 121, 168, 0.4);
        min-width: 180px;
        touch-action: none;
      }
      #card_mini_widget .mini-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      #card_mini_widget .mini-title {
        color: #fd79a8;
        font-size: 12px;
        font-weight: bold;
      }
      #card_mini_widget .mini-expand {
        color: #fd79a8;
        cursor: pointer;
        font-size: 16px;
      }
      #card_mini_widget .mini-progress {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 6px;
        overflow: hidden;
        height: 14px;
        margin-bottom: 6px;
      }
      #card_mini_widget .mini-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #fd79a8, #e84393);
        transition: width 0.3s ease;
      }
      #card_mini_widget .mini-status {
        color: #b8b8b8;
        font-size: 11px;
        text-align: center;
      }
    `;
    document.head.appendChild(styles);
  }

  createModal() {
    if (document.getElementById('card_opener_modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'card_opener_modal_overlay';

    const modal = document.createElement('div');
    modal.id = 'card_opener_modal';

    modal.innerHTML = `
      <span class="modal-minimize" title="Minimalizuj">_</span>
      <span class="modal-close">&times;</span>
      <div class="modal-title">🃏 Rozpakowywacz</div>
      
      <div class="info-box" id="card_item_info">
        Wybierz paczkę kart
      </div>
      
      <div class="mode-toggle">
        <button class="mode-btn active" id="card_mode_leave">Zostaw X</button>
        <button class="mode-btn" id="card_mode_open">Otwórz X</button>
      </div>
      
      <div class="form-group">
        <label id="card_count_label">Ile paczek zostawić:</label>
        <input type="number" id="card_target_count" min="0" placeholder="0 = otwórz wszystkie">
      </div>
      
      <div class="btn-row" id="card_main_controls">
        <button class="modal-btn btn-start" id="card_btn_start">▶️ START</button>
      </div>
      
      <div class="progress-section" id="card_progress_section">
        <div class="progress-bar-container">
          <div class="progress-bar" id="card_progress_bar" style="width: 0%">0%</div>
        </div>
        <div class="progress-text" id="card_progress_text">Przygotowanie...</div>
        <div class="cards-summary" id="card_summary">
          <div class="cards-summary-title">📋 Zdobyte karty:</div>
          <div id="card_summary_list"></div>
        </div>
        <div class="btn-row">
          <button class="modal-btn btn-pause" id="card_btn_pause">⏸️ PAUZA</button>
          <button class="modal-btn btn-stop" id="card_btn_stop">⏹️ STOP</button>
        </div>
      </div>
    `;

    // Mini widget
    const miniWidget = document.createElement('div');
    miniWidget.id = 'card_mini_widget';
    miniWidget.innerHTML = `
      <div class="mini-header">
        <span class="mini-title">🃏 Karty</span>
        <span class="mini-expand" title="Rozwiń">⬆</span>
      </div>
      <div class="mini-progress">
        <div class="mini-progress-bar" id="card_mini_progress_bar" style="width: 0%"></div>
      </div>
      <div class="mini-status" id="card_mini_status">Wstrzymano</div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    document.body.appendChild(miniWidget);

    this.makeDraggable(miniWidget);

    // Event listeners
    overlay.addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-minimize').addEventListener('click', () => this.minimizeModal());
    miniWidget.querySelector('.mini-expand').addEventListener('click', () => this.expandModal());

    document.getElementById('card_mode_leave').addEventListener('click', () => this.setMode(true));
    document.getElementById('card_mode_open').addEventListener('click', () => this.setMode(false));
    document.getElementById('card_btn_start').addEventListener('click', () => this.onStart());
    document.getElementById('card_btn_pause').addEventListener('click', () => this.onPauseResume());
    document.getElementById('card_btn_stop').addEventListener('click', () => this.onStop());
  }

  setMode(leaveMode) {
    this.useLeaveMode = leaveMode;
    const leaveBtn = document.getElementById('card_mode_leave');
    const openBtn = document.getElementById('card_mode_open');
    const label = document.getElementById('card_count_label');

    if (leaveMode) {
      leaveBtn.classList.add('active');
      openBtn.classList.remove('active');
      label.textContent = 'Ile paczek zostawić:';
    } else {
      leaveBtn.classList.remove('active');
      openBtn.classList.add('active');
      label.textContent = 'Ile paczek otworzyć:';
    }
  }

  attachMenuListener() {
    // Add button when item is a card pack
    $(document).on('click', '.player_ekw_item', (e) => {
      const item = $(e.currentTarget);
      const baseItemId = parseInt(item.attr('data-base_item_id'));

      setTimeout(() => {
        const menu = document.getElementById('ekw_item_menu');
        if (!menu || menu.style.display === 'none') return;

        // Remove old button if exists
        const oldBtn = menu.querySelector('#ekw_menu_card_opener');
        if (oldBtn) oldBtn.remove();

        // Only show for specific card pack IDs
        if (cardPackOpener.CARD_PACK_IDS.includes(baseItemId)) {
          const btn = document.createElement('button');
          btn.id = 'ekw_menu_card_opener';
          btn.className = 'ekw_menu_btn option btn_small_gold';
          btn.textContent = 'Otwieracz';
          btn.style.display = '';
          btn.addEventListener('click', () => {
            this.currentItemId = parseInt(item.attr('data-item_id'));
            this.currentItemStack = parseInt(item.attr('data-stack')) || 1;
            const itemImg = item.find('img').attr('src');
            this.showModal(itemImg, this.currentItemStack);
          });
          menu.appendChild(btn);
        }
      }, 50);
    });
  }

  showModal(itemImg, stack) {
    document.getElementById('card_item_info').innerHTML = `
      <img src="${itemImg}" style="width: 32px; height: 32px; vertical-align: middle; margin-right: 10px;">
      Posiadasz: <span class="highlight">${stack}</span> paczek
    `;

    document.getElementById('card_opener_modal_overlay').style.display = 'block';
    document.getElementById('card_opener_modal').style.display = 'block';
    document.getElementById('card_main_controls').style.display = 'flex';
    document.getElementById('card_progress_section').style.display = 'none';
  }

  hideModal() {
    if (this.isRunning) this.onStop(true);
    document.getElementById('card_opener_modal_overlay').style.display = 'none';
    document.getElementById('card_opener_modal').style.display = 'none';
  }

  minimizeModal() {
    document.getElementById('card_opener_modal_overlay').style.display = 'none';
    document.getElementById('card_opener_modal').style.display = 'none';
    document.getElementById('card_mini_widget').style.display = 'block';
  }

  expandModal() {
    document.getElementById('card_mini_widget').style.display = 'none';
    document.getElementById('card_opener_modal_overlay').style.display = 'block';
    document.getElementById('card_opener_modal').style.display = 'block';
  }

  makeDraggable(element) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    const onStart = (e) => {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = element.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
      element.style.transition = 'none';
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      let newX = Math.max(0, Math.min(clientX - offsetX, window.innerWidth - element.offsetWidth));
      let newY = Math.max(0, Math.min(clientY - offsetY, window.innerHeight - element.offsetHeight));
      element.style.left = newX + 'px';
      element.style.top = newY + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    };

    const onEnd = () => { isDragging = false; element.style.transition = ''; };

    element.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    element.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  async onStart() {
    this.isRunning = true;
    this.isPaused = false;
    this.targetCount = parseInt(document.getElementById('card_target_count').value) || 0;
    this.openedCount = 0;
    this.collectedCards = {};

    // Calculate how many to open
    let toOpen;
    if (this.useLeaveMode) {
      toOpen = Math.max(0, this.currentItemStack - this.targetCount);
    } else {
      toOpen = Math.min(this.currentItemStack, this.targetCount || this.currentItemStack);
    }

    if (toOpen <= 0) {
      this.updateProgressText('❌ Nie ma czego otwierać!');
      return;
    }

    this.totalToOpen = toOpen;

    document.getElementById('card_main_controls').style.display = 'none';
    document.getElementById('card_progress_section').style.display = 'block';
    document.getElementById('card_btn_pause').textContent = '⏸️ PAUZA';
    document.getElementById('card_summary_list').innerHTML = '';

    await this.runOpenProcess();
  }

  onPauseResume() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('card_btn_pause');
    if (this.isPaused) {
      btn.textContent = '▶️ WZNÓW';
      this.updateProgressText('⏸️ Wstrzymano...');
    } else {
      btn.textContent = '⏸️ PAUZA';
    }
  }

  onStop(hideProgress = true) {
    this.isRunning = false;
    this.isPaused = false;
    document.getElementById('card_main_controls').style.display = 'flex';
    if (hideProgress) {
      document.getElementById('card_progress_section').style.display = 'none';
    }
  }

  updateProgress(percent) {
    const bar = document.getElementById('card_progress_bar');
    bar.style.width = `${percent}%`;
    bar.textContent = `${percent}%`;
    const miniBar = document.getElementById('card_mini_progress_bar');
    if (miniBar) miniBar.style.width = `${percent}%`;
  }

  updateProgressText(text) {
    document.getElementById('card_progress_text').textContent = text;
    const miniStatus = document.getElementById('card_mini_status');
    if (miniStatus) miniStatus.textContent = text.length > 25 ? text.substring(0, 22) + '...' : text;
  }

  updateCardSummary() {
    const list = document.getElementById('card_summary_list');
    let html = '';

    // Sort by count ascending (rarest first)
    const sorted = Object.entries(this.collectedCards).sort((a, b) => a[1].count - b[1].count);

    for (const [img, data] of sorted) {
      html += `
        <div class="card-row">
          <img src="${img}">
          <span class="card-info">Lv ${data.level}</span>
          <span class="card-count">x${data.count}</span>
        </div>
      `;
    }

    list.innerHTML = html || '<div style="color:#888;text-align:center;">Brak kart</div>';
  }

  parseCards() {
    const container = document.querySelector('#kom_con .limited_kom');
    if (!container) return;

    const cards = container.querySelectorAll('.small_card');
    cards.forEach(card => {
      const img = card.querySelector('img');
      const levelSpan = card.querySelector('span');
      const countI = card.querySelector('i');

      if (img && levelSpan && countI) {
        const imgSrc = img.getAttribute('src');
        const level = parseInt(levelSpan.textContent) || 1;
        const count = parseInt(countI.textContent) || 1;

        if (!this.collectedCards[imgSrc]) {
          this.collectedCards[imgSrc] = { level, count: 0 };
        }
        this.collectedCards[imgSrc].count += count;
      }
    });

    this.updateCardSummary();
  }

  async waitForCardsResult(timeout = 5000) {
    for (let i = 0; i < timeout / 100; i++) {
      await this.delay(100);
      const kom = document.querySelector('#kom_con .kom .content');
      if (kom && kom.textContent.includes('Użyto przedmiotu')) {
        // Wait a bit for cards to render
        await this.delay(200);
        this.parseCards();
        kom_clear();
        return true;
      }
    }
    kom_clear();
    return false;
  }

  async runOpenProcess() {
    let remaining = this.totalToOpen;

    this.updateProgressText(`Otwieranie ${remaining} paczek...`);

    while (this.isRunning && remaining > 0) {
      // Check pause
      while (this.isPaused && this.isRunning) {
        await this.delay(200);
      }
      if (!this.isRunning) break;

      // Open in batches of max 100
      const batchSize = Math.min(100, remaining);

      this.updateProgressText(`📦 Otwieranie ${batchSize} paczek...`);

      // Emit open command
      GAME.emitOrder({ a: 12, type: 14, iid: this.currentItemId, page: GAME.ekw_page, page2: GAME.ekw_page2, am: batchSize });

      // Wait for result
      const success = await this.waitForCardsResult(8000);

      if (success) {
        this.openedCount += batchSize;
        remaining -= batchSize;

        // Update progress
        const percent = Math.round(((this.totalToOpen - remaining) / this.totalToOpen) * 100);
        this.updateProgress(percent);
        this.updateProgressText(`✅ Otwarto ${this.openedCount}/${this.totalToOpen}`);
      } else {
        this.updateProgressText('⚠️ Brak odpowiedzi!');
        await this.delay(2000);
        this.onStop(false);
        return;
      }

      // Delay between batches
      await this.delay(800);
    }

    // Final message
    if (this.isRunning) {
      const totalCards = Object.values(this.collectedCards).reduce((sum, c) => sum + c.count, 0);
      this.updateProgressText(`🎉 Gotowe! ${totalCards} kart z ${this.openedCount} paczek`);
      this.updateProgress(100);
      await this.delay(2000);
      this.onStop(false);
    }
  }
}

// Initialize card pack opener
new cardPackOpener();

// ========== remote/features/activities/activitiesExecutor.js ==========
/**
 * ============================================================================
 * Activities Auto-Executor Module (Standalone - loaded via gieniobot)
 * ============================================================================
 * 
 * Automatyczne wykonywanie codziennych aktywności.
 * Wstrzykuje checkboxy i przycisk "Wykonaj" do strony #page_game_activities.
 * 
 * ============================================================================
 */

(function () {
  'use strict';

  // Czekaj na GAME
  const waitForGame = setInterval(() => {
    if (typeof GAME !== 'undefined' && GAME.char_data && GAME.char_id) {
      clearInterval(waitForGame);
      initActivitiesModule();
    }
  }, 100);

  function initActivitiesModule() {

    // ============================================
    // STATE
    // ============================================
    window.ACTIVITIES = window.ACTIVITIES || {
      stop: true,
      paused: false,
      running: false,
      selectedActivities: [],
      completedActivities: [],
      currentActivity: null,
      earnedPoints: 0,  // Punkty zdobyte w tej sesji
      status: 'idle',
      substanceType: 'x20'  // x3, x4, x20, OST
    };

    // ============================================
    // CONFIGURATION
    // ============================================

    // Punkty za każdą aktywność
    const ACTIVITY_POINTS = {
      'Odbierz nagrodę za codzienne logowanie': 5,
      'Ulepsz Kulę Energii': 10,
      'Ulepsz lub połącz dowolny przedmiot': 5,
      'Użyj dowolną fasolkę Senzu lub wyciąg': 10,
      'Przekaż przedmioty na PU klanu': 10,
      'Użyj Substancję Przyspieszającą': 10,
      'Udaj się na wyprawę': 5,
      'Walcz na Arenie PvP': 10,
      'Walcz w Otchłani Dusz': 5,
      'Asystuj w treningu klanowym': 5,
      'Pobłogosław innego gracza': 10,
      'Odbierz nagrodę VIP': 10,
      'Wykonaj zadanie na Prywatnej Planecie': 10,
      'Wykonaj zadanie na Planecie Klanowej': 10,
      'Wykonaj zadanie w siedzibie imperium': 10,
      'Odbierz nagrodę za List Gończy PvM': 10,
      'Ukończ trening': 5,
      'Ulepsz trening': 10,
      'Wykonaj dowolną instancję': 10,
      'Pokonaj wroga imperialnego': 10,
      'Pokonaj wroga klanowego': 10
    };

    function getActivityPoints(activityName) {
      for (const [key, points] of Object.entries(ACTIVITY_POINTS)) {
        if (activityName.includes(key)) {
          return points;
        }
      }
      return 1;  // Default 1 punkt
    }

    // Lista aktywności z warunkami disabled
    const activityRules = {
      'Wykonaj dowolną instancję': () => true,
      'Odbierz nagrodę za List Gończy PvM': () => {
        const reborn = GAME.char_data?.reborn || 0;
        return reborn < 2;
      },
      'Przekaż przedmioty na PU klanu': () => GAME.char_data?.klan_id === 0,
      'Wykonaj zadanie na Planecie Klanowej': () => GAME.char_data?.klan_id === 0,
      'Wykonaj zadanie w siedzibie imperium': () => GAME.char_data?.empire === 0,
      'Wykonaj zadanie na Prywatnej Planecie': () => GAME.quick_opts && !GAME.quick_opts.private_planet,
      'Pokonaj wroga imperialnego': () => GAME.char_data?.empire === 0,
      'Pokonaj wroga klanowego': () => GAME.char_data?.klan_id === 0,
      'Asystuj w treningu klanowym': () => GAME.char_data?.klan_id === 0 || GAME.char_data?.reborn < 1,
      'Pobłogosław innego gracza': () => GAME.char_data?.reborn < 2,
      'Odbierz nagrodę VIP': () => {
        const reborn = GAME.char_data?.reborn || 0;
        const gvip = GAME.char_data?.gvip_level || 0;
        const vip = GAME.char_data?.vip_level || 0;
        return reborn < 3 && gvip === 0 && vip === 0;
      }
    };

    // Aktywności domyślnie odznaczone (ale nie disabled)
    const defaultUnchecked = ['Wykonaj dowolną instancję', 'Udaj się na wyprawę', 'Pokonaj wroga imperialnego', 'Pokonaj wroga klanowego'];

    // ============================================
    // CSS INJECTION
    // ============================================

    function injectCSS() {
      if (document.getElementById('afo_activities_css')) return;

      const css = `
        /* Activities Execute Button */
        #afo_activities_execute_btn {
          margin: 10px 0;
          padding: 0px 20px;
          font-size: 14px;
          cursor: pointer;
        }

        /* Progress modal */
        #afo_activities_modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.95);
          border: 2px solid #ffd700;
          border-radius: 8px;
          padding: 20px;
          z-index: 99999;
          min-width: 300px;
          color: white;
          display: none;
        }
        #afo_activities_modal .modal-title {
          font-size: 16px;
          font-weight: bold;
          color: #ffd700;
          margin-bottom: 15px;
          text-align: center;
        }
        #afo_activities_modal .modal-status {
          font-size: 13px;
          margin-bottom: 10px;
          min-height: 20px;
        }
        #afo_activities_modal .modal-points {
          font-size: 12px;
          color: #aaa;
          margin-bottom: 15px;
        }
        #afo_activities_modal .modal-points b {
          color: #ffd700;
        }
        #afo_activities_modal .modal-controls {
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        #afo_activities_modal .modal-controls button {
          min-width: 80px;
          padding: 0px 12px;
          cursor: pointer;
        }
      `;

      const style = document.createElement('style');
      style.id = 'afo_activities_css';
      style.textContent = css;
      document.head.appendChild(style);
    }

    // ============================================
    // MAIN INJECTION FUNCTION
    // ============================================

    let _injecting = false;  // Prevent multiple simultaneous injections

    function injectActivitiesUI() {
      // Prevent multiple calls
      if (_injecting) return;
      _injecting = true;

      const container = document.getElementById('char_activieties');
      if (!container) {
        console.log('[Activities] Container #char_activieties not found');
        _injecting = false;
        return;
      }

      const activities = container.querySelectorAll('.activity');
      if (activities.length === 0) {
        console.log('[Activities] No .activity elements found');
        _injecting = false;
        return;
      }

      // Check if already fully injected (all activities have checkboxes)
      const existingCheckboxes = container.querySelectorAll('.afo-cb');
      if (existingCheckboxes.length >= activities.length) {
        console.log('[Activities] Already injected, skipping');
        _injecting = false;
        return;
      }

      console.log('[Activities] Injecting checkboxes into', activities.length, 'activities...');

      // Inject checkboxes
      let injectedCount = 0;
      activities.forEach(activityDiv => {
        // Skip if already has checkbox
        if (activityDiv.querySelector('.afo-cb')) return;

        // Get activity text
        const fullText = activityDiv.textContent || '';
        const activityText = fullText.replace(/\d+p\s*$/, '').trim();

        // Check if done
        const isDone = activityDiv.querySelector('img[src*="done.png"]') !== null;

        // Check disabled conditions
        let isDisabled = false;
        for (const [name, checkFn] of Object.entries(activityRules)) {
          if (activityText.includes(name)) {
            isDisabled = checkFn();
            break;
          }
        }

        // Check if default unchecked
        const isDefaultUnchecked = defaultUnchecked.some(name => activityText.includes(name));

        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'afo-cb';
        checkbox.dataset.activity = activityText;
        checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';

        if (isDone) {
          checkbox.checked = false;
          checkbox.disabled = true;
          checkbox.title = 'Już ukończone';
        } else if (isDisabled) {
          checkbox.checked = false;
          checkbox.disabled = true;
          checkbox.title = 'Nie spełniasz wymagań';
        } else {
          checkbox.checked = !isDefaultUnchecked;
        }

        // Insert at beginning
        activityDiv.insertBefore(checkbox, activityDiv.firstChild);
        injectedCount++;

        // Special: Add substance toggle for "Użyj Substancję" activity
        if (activityText.includes('Użyj Substancję Przyspieszającą') && !activityDiv.querySelector('.afo-substance-toggle')) {
          const toggle = document.createElement('span');
          toggle.className = 'afo-substance-toggle';
          toggle.dataset.value = ACTIVITIES.substanceType || 'x20';
          toggle.textContent = ACTIVITIES.substanceType || 'x20';
          toggle.style.cssText = 'background: #555; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-left: 5px; cursor: pointer; color: #ffd700;';
          toggle.title = 'Kliknij aby zmienić typ substancji';

          // Toggle cycle: x3 -> x4 -> x20 -> OST -> x3
          toggle.onclick = (e) => {
            e.stopPropagation();
            const values = ['x3', 'x4', 'x20', 'OST'];
            const current = toggle.dataset.value;
            const idx = values.indexOf(current);
            const next = values[(idx + 1) % values.length];
            toggle.dataset.value = next;
            toggle.textContent = next;
            ACTIVITIES.substanceType = next;
            console.log('[Activities] Substance type changed to:', next);
          };

          // Insert before the points span
          const pointsSpan = activityDiv.querySelector('.pull-right');
          if (pointsSpan) {
            activityDiv.insertBefore(toggle, pointsSpan);
          } else {
            activityDiv.appendChild(toggle);
          }
        }
      });

      // Inject execute button
      if (!document.getElementById('afo_activities_execute_btn')) {
        const page = document.getElementById('page_game_activities');
        if (page) {
          const btn = document.createElement('button');
          btn.id = 'afo_activities_execute_btn';
          btn.className = 'newBtn';
          btn.textContent = 'WYKONAJ ZAZNACZONE';
          btn.onclick = startExecution;

          // Find "Aktywności:" label
          const labels = page.querySelectorAll('p.orange');
          let targetLabel = null;
          labels.forEach(p => {
            if (p.textContent.includes('Aktywności')) {
              targetLabel = p;
            }
          });

          if (targetLabel) {
            targetLabel.parentNode.insertBefore(btn, targetLabel.nextSibling);
          } else {
            container.parentNode.insertBefore(btn, container);
          }
        }
      }

      // Inject modal
      injectModal();

      console.log('[Activities] Injected', injectedCount, 'checkboxes');
      _injecting = false;
    }

    function injectModal() {
      if (document.getElementById('afo_activities_modal')) return;

      const overlay = document.createElement('div');
      overlay.id = 'afo_activities_modal_overlay';

      const modal = document.createElement('div');
      modal.id = 'afo_activities_modal';
      modal.innerHTML = `
        <div class="modal-title">Wykonywanie Aktywności</div>
        <div class="modal-status" id="afo_act_status">Przygotowanie...</div>
        <div class="modal-points">Punkty: <b id="afo_act_points">0</b></div>
        <div class="modal-controls">
          <button class="newBtn" id="afo_act_pause">PAUZA</button>
          <button class="newBtn" id="afo_act_stop">PRZERWIJ</button>
        </div>
      `;

      document.body.appendChild(overlay);
      document.body.appendChild(modal);

      document.getElementById('afo_act_pause').onclick = togglePause;
      document.getElementById('afo_act_stop').onclick = stopExecution;
    }

    // ============================================
    // HOOK INTO GAME.page_switch
    // ============================================

    function hookPageSwitch() {
      if (!GAME.page_switch) {
        console.log('[Activities] GAME.page_switch not found, using fallback');
        return false;
      }

      // Save original
      const originalPageSwitch = GAME.page_switch.bind(GAME);

      // Override
      GAME.page_switch = function (page, arg) {
        // Call original first (pass all arguments)
        originalPageSwitch(page, arg);

        // Check if switching to activities page
        if (page === 'game_activities') {
          console.log('[Activities] Detected switch to game_activities');

          // First attempt after 100ms
          setTimeout(() => {
            injectActivitiesUI();
          }, 100);

          // Retry after 500ms - force inject if checkboxes missing
          setTimeout(() => {
            verifyAndInject();
          }, 500);

          // Final retry after 1s
          setTimeout(() => {
            verifyAndInject();
          }, 1000);
        }
      };

      console.log('[Activities] Hooked into GAME.page_switch');
      return true;
    }

    // Verify checkboxes exist and inject if missing
    function verifyAndInject() {
      const container = document.getElementById('char_activieties');
      if (!container) return;

      const activities = container.querySelectorAll('.activity');
      const checkboxes = container.querySelectorAll('.afo-cb');

      // If we have activities but no/few checkboxes, force reinject
      if (activities.length > 0 && checkboxes.length < activities.length) {
        console.log('[Activities] Checkboxes missing (' + checkboxes.length + '/' + activities.length + '), forcing inject...');
        _injecting = false;  // Reset lock
        injectActivitiesUI();
      }
    }

    // ============================================
    // MODAL CONTROL
    // ============================================

    function showModal() {
      const overlay = document.getElementById('afo_activities_modal_overlay');
      const modal = document.getElementById('afo_activities_modal');
      if (overlay) overlay.style.display = 'block';
      if (modal) modal.style.display = 'block';
    }

    function hideModal() {
      const overlay = document.getElementById('afo_activities_modal_overlay');
      const modal = document.getElementById('afo_activities_modal');
      if (overlay) overlay.style.display = 'none';
      if (modal) modal.style.display = 'none';
    }

    function updateStatus(text) {
      const el = document.getElementById('afo_act_status');
      if (el) el.textContent = text;
    }

    function updatePoints() {
      const el = document.getElementById('afo_act_points');
      if (el) {
        // Pobierz aktualną wartość z gry
        const currentActivity = parseInt($('#char_activity').text()) || 0;
        // Dodaj punkty zdobyte w tej sesji
        const total = currentActivity + ACTIVITIES.earnedPoints;
        el.textContent = `${total}/150`;
      }

      // Also update progress bar if exists
      const progressEl = document.getElementById('afo_act_progress');
      if (progressEl) {
        const total = ACTIVITIES.selectedActivities.length;
        const done = ACTIVITIES.completedActivities.length;
        progressEl.textContent = `${done}/${total}`;
      }
    }

    // ============================================
    // EXECUTION CONTROL
    // ============================================

    function startExecution() {
      // Check if AFO is loaded
      if (typeof AFO_DAILY === 'undefined' || typeof AFO_LPVM === 'undefined') {
        if (typeof GAME !== 'undefined' && GAME.komunikat) {
          GAME.komunikat('⚠️ Najpierw uruchom AFO! Kliknij ikonę AFO w panelu.');
        } else {
          alert('⚠️ Najpierw uruchom AFO! Kliknij ikonę AFO w panelu.');
        }
        return;
      }

      const checkboxes = document.querySelectorAll('.afo-cb:checked:not(:disabled)');
      if (checkboxes.length === 0) {
        if (typeof GAME !== 'undefined' && GAME.komunikat) {
          GAME.komunikat('Nie zaznaczono żadnych aktywności!');
        } else {
          alert('Nie zaznaczono żadnych aktywności!');
        }
        return;
      }

      const selected = [];
      checkboxes.forEach(cb => selected.push(cb.dataset.activity));

      ACTIVITIES.stop = false;
      ACTIVITIES.paused = false;
      ACTIVITIES.running = true;
      ACTIVITIES.selectedActivities = selected;
      ACTIVITIES.completedActivities = [];
      ACTIVITIES.currentActivity = null;
      ACTIVITIES.earnedPoints = 0;  // Reset punktów
      ACTIVITIES.status = 'running';

      console.log('[Activities] Starting with', selected.length, 'activities');

      showModal();
      updateStatus('Rozpoczynanie...');
      updatePoints();
      document.getElementById('afo_act_pause').textContent = 'PAUZA';

      setTimeout(processNextActivity, 500);
    }

    function togglePause() {
      if (!ACTIVITIES.running) return;

      if (ACTIVITIES.paused) {
        ACTIVITIES.paused = false;
        ACTIVITIES.status = 'running';
        document.getElementById('afo_act_pause').textContent = 'PAUZA';
        updateStatus('Wznowiono...');
        processNextActivity();
      } else {
        ACTIVITIES.paused = true;
        ACTIVITIES.status = 'paused';
        document.getElementById('afo_act_pause').textContent = 'WZNÓW';
        updateStatus('⏸ Wstrzymano');
      }
    }

    function stopExecution() {
      ACTIVITIES.stop = true;
      ACTIVITIES.paused = false;
      ACTIVITIES.running = false;
      ACTIVITIES.status = 'stopped';
      ACTIVITIES.currentActivity = null;

      updateStatus('Przerwano');
      console.log('[Activities] Stopped');

      setTimeout(hideModal, 1500);
    }

    function completeExecution() {
      ACTIVITIES.stop = true;
      ACTIVITIES.running = false;
      ACTIVITIES.status = 'completed';

      updateStatus('Ukończono! Zbieram nagrody...');
      updatePoints();
      console.log('[Activities] Completed');

      // Collect activity rewards
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 49, type: 0 });
        setTimeout(() => {
          // Zbierz nagrody
          const received = $("#act_prizes").find("div.act_prize.disabled").length;
          const activity = parseInt($('#char_activity').text());
          const thresholds = [25, 50, 75, 100, 150];

          for (let i = 0; i <= 5; i++) {
            if (received < 5 && activity >= thresholds[i]) {
              const actPrize = $(`#act_prizes button[data-ind=${i}]`).closest(".act_prize");
              if (!actPrize.hasClass("disabled")) {
                GAME.socket.emit('ga', { a: 49, type: 1, ind: i });
              }
            }
          }

          updateStatus('✓ Gotowe!');
          console.log('[Activities] Rewards collected');
        }, 1000);
      }, 500);

      setTimeout(hideModal, 3000);
    }

    // ============================================
    // ACTIVITY PROCESSING
    // ============================================

    // Delay helper
    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============================================
    // ITEM ID MAPPINGS (base_item_id)
    // ============================================
    const ITEM_IDS = {
      // Kule Energii (wszystkie warianty mają ten sam base_item_id)
      'kula_energii': ['1252'],

      // Senzu
      'niebieskie_senzu': ['1244'],

      // Substancje przyspieszające
      'substancja_x3': ['87'],
      'substancja_x4': ['88'],
      'substancja_x20': ['1429'],
      'ostateczna_substancja': ['1578'],

      // Symbole (bez +X) - Normal
      'symbol_sily': ['59'],
      'symbol_szybkosci': ['60'],
      'symbol_wytrzymalosci': ['61'],
      'symbol_sily_woli': ['62'],
      'symbol_ki': ['63'],

      // Odłamek mocy
      'odlamek_mocy': ['1475'],
    };

    // Find item by base_item_id
    function findItemByBaseId(baseItemIds) {
      const container = document.getElementById('ekw_page_items');
      if (!container) {
        console.log('[Activities] Container #ekw_page_items not found');
        return null;
      }

      const items = container.querySelectorAll('.ekw_slot.player_ekw_item');
      console.log('[Activities] Searching for base_item_id in', baseItemIds, 'among', items.length, 'items');

      if (items.length === 0) return null;

      // Debug first 3 items
      console.log('[Activities] Sample base_item_ids:',
        Array.from(items).slice(0, 5).map(i => i.getAttribute('data-base_item_id')).join(', ')
      );

      for (const item of items) {
        const baseId = item.getAttribute('data-base_item_id');
        if (baseItemIds.includes(baseId)) {
          console.log('mom itema')
          const itemId = item.getAttribute('data-item_id');
          const upgrade = item.getAttribute('data-upgrade');
          console.log('[Activities] ✓ FOUND base_item_id=' + baseId + ' item_id=' + itemId + ' upgrade=' + upgrade);
          return {
            element: item,
            itemId: itemId,
            baseItemId: baseId,
            upgrade: upgrade,
            slot: item.getAttribute('data-slot')
          };
        }
      }
      console.log('[Activities] ✗ Not found');
      return null;
    }

    // Find Symbol Normal (bez +X - upgrade=0)
    function findSymbolNormal() {
      const symbolIds = ['59', '60', '61', '62', '63'];  // Siła, Szybkość, Wytrzymałość, Sila Woli, Ki
      const container = document.getElementById('ekw_page_items');
      if (!container) return null;

      const items = container.querySelectorAll('.ekw_slot.player_ekw_item');
      console.log('[Activities] Searching for Symbol Normal (upgrade=0) among', items.length, 'items');

      for (const item of items) {
        const baseId = item.getAttribute('data-base_item_id');
        const upgrade = item.getAttribute('data-upgrade');

        if (symbolIds.includes(baseId) && upgrade === '0') {
          const itemId = item.getAttribute('data-item_id');
          console.log('[Activities] ✓ FOUND Symbol Normal base_id=' + baseId + ' item_id=' + itemId);
          return {
            element: item,
            itemId: itemId,
            baseItemId: baseId,
            upgrade: upgrade
          };
        }
      }
      console.log('[Activities] ✗ Symbol Normal not found');
      return null;
    }

    // Wait for items to load (just wait for any items to appear)
    async function waitForItems(maxWait = 1500) {
      const start = Date.now();
      while (Date.now() - start < maxWait) {
        const container = document.getElementById('ekw_page_items');
        if (container) {
          const items = container.querySelectorAll('.ekw_slot.player_ekw_item');
          if (items.length > 0) {
            console.log('[Activities] Items loaded:', items.length);
            return items.length;
          }
        }
        await delay(100);
      }
      console.log('[Activities] Timeout waiting for items');
      return 0;
    }

    // Navigate to equipment page (no page switch - just fetch data in background)
    async function navigateToEkwPage(page, page2) {
      console.log('[Activities] Fetching ekw page', page, '/', page2, '(no page switch)');
      GAME.emitOrder({ a: 12, page: page, page2: page2 });
      await delay(1000);  // Wait 1s for items to load
    }

    // Find item with pagination (returns when found or gives up)
    async function findWithPagination(findFn, page, maxPage2 = 5) {
      for (let page2 = 0; page2 <= maxPage2; page2++) {
        console.log('[Activities] Checking page', page, '/', page2);
        GAME.emitOrder({ a: 12, page: page, page2: page2 });
        await delay(1000);  // Wait 1s for items to load

        const container = document.getElementById('ekw_page_items');
        const items = container ? container.querySelectorAll('.ekw_slot.player_ekw_item') : [];
        console.log('[Activities] Found', items.length, 'items on this page');

        if (items.length === 0) {
          console.log('[Activities] No items on page, stopping pagination');
          break;
        }

        const result = findFn();
        if (result) {
          return { item: result, page2: page2 };
        }

        // Wait 1s before checking next page
        await delay(1000);
      }
      return null;
    }

    // Activity executor mapping
    const activityExecutors = {
      // a) Ulepsz Kulę Energii
      'Ulepsz Kulę Energii': async () => {
        console.log('[Activities] Executing: Ulepsz Kulę Energii');

        // 1. Navigate to ekw page 3 (Kule Energii)
        await navigateToEkwPage(3, 0);

        // 2. Find Kula Energii by base_item_id
        const item = findItemByBaseId(ITEM_IDS.kula_energii);
        if (!item) {
          console.log('[Activities] Kula Energii not found');
          return false;
        }

        console.log('[Activities] Found Kula Energii:', item.itemId);

        // 3. Execute upgrade emits
        GAME.emitOrder({ a: 45, type: 0, bid: parseInt(item.itemId) });
        await delay(1000);

        GAME.emitOrder({ a: 45, type: 3, bid: GAME.ball_id || parseInt(item.itemId) });
        await delay(1000);

        // 4. Hide soulstone interface
        const soulstoneInterface = document.getElementById('soulstone_interface');
        if (soulstoneInterface) {
          soulstoneInterface.style.display = 'none';
        }

        return true;
      },

      // b) Ulepsz lub połącz dowolny przedmiot
      'Ulepsz lub połącz dowolny przedmiot': async () => {
        console.log('[Activities] Executing: Ulepsz lub połącz przedmiot');

        // 1. Navigate to ekw page 7 (Symbole)
        await navigateToEkwPage(7, 0);

        // 2. Find Symbol Normal (upgrade=0) with pagination
        const result = await findWithPagination(findSymbolNormal, 7, 1);

        if (!result) {
          console.log('[Activities] Symbol Normal not found');
          return false;
        }

        console.log('[Activities] Found Symbol Normal:', result.item.itemId);

        // 3. Execute upgrade emit
        GAME.emitOrder({
          a: 12,
          type: 10,
          iid: parseInt(result.item.itemId),
          page: 7,
          page2: result.page2,
          am: 1
        });
        await delay(1000);

        return true;
      },

      // c) Użyj dowolną fasolkę Senzu lub wyciąg
      'Użyj dowolną fasolkę Senzu lub wyciąg': async () => {
        console.log('[Activities] Executing: Użyj Senzu');

        // 1. Navigate to ekw page 0
        await navigateToEkwPage(0, 0);

        // 2. Find niebieskie senzu with pagination
        const result = await findWithPagination(
          () => findItemByBaseId(ITEM_IDS.niebieskie_senzu),
          0, 5
        );

        if (!result) {
          console.log('[Activities] Niebieskie Senzu not found');
          return false;
        }

        console.log('[Activities] Found Senzu:', result.item.itemId);

        // 3. Use item
        GAME.emitOrder({
          a: 12,
          type: 14,
          iid: parseInt(result.item.itemId),
          page: 0,
          page2: result.page2,
          am: 1
        });
        await delay(1000);

        return true;
      },

      // d) Przekaż przedmioty na PU klanu
      'Przekaż przedmioty na PU klanu': async () => {
        console.log('[Activities] Executing: Przekaż na PU klanu');

        // 1. Navigate to ekw page 0
        await navigateToEkwPage(0, 0);

        // 2. Find odłamek mocy (Czarna Smocza Kula) with pagination
        const result = await findWithPagination(
          () => findItemByBaseId(ITEM_IDS.odlamek_mocy),
          0, 5
        );

        if (!result) {
          console.log('[Activities] Odłamek mocy not found');
          return false;
        }

        console.log('[Activities] Found Odłamek:', result.item.itemId);

        // 3. Transfer to clan
        GAME.emitOrder({
          a: 12,
          type: 21,
          iid: parseInt(result.item.itemId),
          page: 0,
          page2: result.page2,
          am: 1
        });
        await delay(1000);

        return true;
      },

      // e) Użyj Substancję Przyspieszającą
      'Użyj Substancję Przyspieszającą': async () => {
        console.log('[Activities] Executing: Użyj Substancję');

        // Get selected substance type from toggle
        const substanceType = ACTIVITIES.substanceType || 'x20';

        const substanceIds = {
          'x3': ITEM_IDS.substancja_x3,
          'x4': ITEM_IDS.substancja_x4,
          'x20': ITEM_IDS.substancja_x20,
          'OST': ITEM_IDS.ostateczna_substancja
        };

        const targetIds = substanceIds[substanceType];
        console.log('[Activities] Looking for substance type:', substanceType, 'ids:', targetIds);

        // 1. Navigate to ekw page 0
        await navigateToEkwPage(0, 0);

        // 2. Find substance with pagination
        const result = await findWithPagination(
          () => findItemByBaseId(targetIds),
          0, 5
        );

        if (!result) {
          console.log('[Activities] Substancja not found');
          return false;
        }

        console.log('[Activities] Found Substancja:', result.item.itemId);

        // 3. Use substance
        GAME.emitOrder({
          a: 12,
          type: 14,
          iid: parseInt(result.item.itemId),
          page: 0,
          page2: result.page2,
          am: 1
        });
        await delay(1000);

        return true;
      },

      // f) Odbierz nagrodę za codzienne logowanie
      'Odbierz nagrodę za codzienne logowanie': async () => {
        console.log('[Activities] Executing: Odbierz nagrodę logowania');

        if (!GAME.quick_opts.online_reward) {
          console.log('[Activities] Nagroda logowania już odebrana');
          return true;  // Already collected
        }

        GAME.socket.emit('ga', { a: 26, type: 1 });
        await delay(1000);

        const dailyReward = document.getElementById('daily_reward');
        if (dailyReward) {
          dailyReward.style.display = 'none';
        }

        return true;
      },

      // g) Udaj się na wyprawę
      'Udaj się na wyprawę': async () => {
        console.log('[Activities] Executing: Udaj się na wyprawę');

        // Check if expedition already in progress
        if (GAME.char_tables.timed_actions && GAME.char_tables.timed_actions[0] !== undefined) {
          console.log('[Activities] Wyprawa już trwa, czekam...');
        } else {
          // Start expedition
          GAME.socket.emit('ga', { a: 10, type: 2, ct: 0 });
          console.log('[Activities] Wysłano wyprawę');
          await delay(2000);
        }

        // Wait for expedition to complete (check every 5s, max 10 minutes)
        const maxWait = 10 * 60 * 1000;  // 10 minutes
        const start = Date.now();

        while (Date.now() - start < maxWait) {
          if (ACTIVITIES.stop || ACTIVITIES.paused) return false;

          GAME.parseTimed();
          await delay(500);

          if (GAME.char_tables.timed_actions[0] === undefined) {
            console.log('[Activities] Wyprawa zakończona!');
            return true;
          }

          console.log('[Activities] Wyprawa trwa, czekam 5s...');
          await delay(5000);
        }

        console.log('[Activities] Timeout - wyprawa trwa zbyt długo');
        return false;
      },

      // h) Walcz na Arenie PvP
      'Walcz na Arenie PvP': async () => {
        console.log('[Activities] Executing: Walcz na Arenie PvP');

        // Open arena
        GAME.socket.emit('ga', { a: 46, type: 0 });
        await delay(1000);

        // Find opponent
        const opponents = document.querySelectorAll('#arena_players .player button[data-option="arena_attack"][data-quick="1"]:not(.initial_hide_forced)');
        if (opponents.length === 0) {
          console.log('[Activities] Brak przeciwników na arenie');
          return false;
        }

        const opponent = opponents[0];
        const index = parseInt(opponent.getAttribute('data-index'));

        if (isNaN(index)) {
          console.log('[Activities] Nie można odczytać indeksu przeciwnika');
          return false;
        }

        // Attack
        GAME.socket.emit('ga', { a: 46, type: 1, index: index, quick: 1 });
        console.log('[Activities] Atakuję przeciwnika:', index);
        await delay(2000);

        return true;
      },

      // i) Walcz w Otchłani Dusz
      'Walcz w Otchłani Dusz': async () => {
        console.log('[Activities] Executing: Walcz w Otchłani Dusz');

        // Open abyss first
        GAME.socket.emit('ga', { a: 59, type: 0 });
        await delay(1000);

        // Fight
        GAME.emitOrder({ a: 59, type: 1 });
        await delay(2000);

        // Hide fight view
        const fightView = document.getElementById('fight_view');
        if (fightView) {
          fightView.style.display = 'none';
        }

        return true;
      },

      // j) Asystuj w treningu klanowym
      'Asystuj w treningu klanowym': async () => {
        console.log('[Activities] Executing: Asystuj w treningu');

        // Open clan training page
        GAME.emitOrder({ a: 39, type: 54 });
        await delay(1000);

        // Find assist button
        const assistBtn = document.querySelector('button[data-option="clan_assist"]');
        if (!assistBtn) {
          console.log('[Activities] Przycisk asysty nie znaleziony');
          return false;
        }

        const tid = assistBtn.getAttribute('data-tid');
        const target = assistBtn.getAttribute('data-target');

        if (!tid) {
          console.log('[Activities] Brak tid w przycisku');
          return false;
        }

        GAME.emitOrder({ a: 39, type: 55, tid: parseInt(tid), target: parseInt(target || tid) });
        console.log('[Activities] Wysłano asystę tid:', tid);
        await delay(1000);

        return true;
      },

      // k) Pobłogosław innego gracza  
      'Pobłogosław innego gracza': async () => {
        console.log('[Activities] Executing: Pobłogosław gracza');

        // Send bless with all buffs to random target (btype:3 = random)
        GAME.socket.emit('ga', {
          a: 14,
          type: 5,
          buffs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          players: '',  // Empty = random
          btype: 3
        });
        await delay(1000);

        return true;
      },

      // l) Odbierz nagrodę VIP
      'Odbierz nagrodę VIP': async () => {
        console.log('[Activities] Executing: Odbierz nagrodę VIP');

        // Fetch VIP data (no page switch)
        GAME.socket.emit('ga', { a: 54, type: 0 });
        await delay(1000);

        // Collect rewards recursively
        let collected = 0;
        const maxIterations = 20;

        for (let i = 0; i < maxIterations; i++) {
          // Find uncollected monthly reward
          const monthlyReward = document.querySelector('#monthly_vip_rewards .vip_cat.option:not(.disabled):not(.received)');
          if (monthlyReward) {
            const vip = parseInt(monthlyReward.getAttribute('data-vip'));
            const level = parseInt(monthlyReward.getAttribute('data-level'));
            GAME.socket.emit('ga', { a: 54, type: 1, vip: vip, level: level });
            collected++;
            await delay(500);
            continue;
          }

          // Find uncollected general reward
          const generalReward = document.querySelector('#general_vip_rewards .vip_cat.option:not(.disabled):not(.received)');
          if (generalReward) {
            const vip = parseInt(generalReward.getAttribute('data-vip'));
            const level = parseInt(generalReward.getAttribute('data-level'));
            GAME.socket.emit('ga', { a: 54, type: 1, vip: vip, level: level });
            collected++;
            await delay(500);
            continue;
          }

          // No more rewards
          break;
        }

        console.log('[Activities] Odebrano', collected, 'nagród VIP');
        return true;
      },

      // m) Wykonaj zadanie na Prywatnej Planecie
      'Wykonaj zadanie na Prywatnej Planecie': async () => {
        return await runDailyQuestsForLocation('private_planet', 'PP');
      },

      // n) Wykonaj zadanie na Planecie Klanowej
      'Wykonaj zadanie na Planecie Klanowej': async () => {
        return await runDailyQuestsForLocation('clan_planet', 'PK');
      },

      // o) Wykonaj zadanie w siedzibie imperium
      'Wykonaj zadanie w siedzibie imperium': async () => {
        return await runDailyQuestsForLocation('empire_hq', 'Imperium');
      }
    };

    // Helper: Run daily quests for specific location type
    async function runDailyQuestsForLocation(locationType, displayName) {
      console.log('[Activities] Executing: Zadanie na', displayName);

      // Check if AFO_DAILY module is available
      if (typeof AFO_DAILY === 'undefined') {
        console.log('[Activities] AFO_DAILY not available');
        return false;
      }

      // Load quest data if not loaded
      if (!AFO_DAILY.dataLoaded) {
        await AFO_DAILY.loadQuestData();
        await delay(1000);
      }

      // Filter quests by locationType
      const currentBorn = GAME.char_data.reborn;
      const locationQuests = DAILY.questData
        .filter(q => q.born.includes(currentBorn))
        .filter(q => q.locationType === locationType)
        .filter(q => AFO_DAILY.isQuestAvailable(q))
        .filter(q => !DAILY.completedQuests.includes(q.name));

      if (locationQuests.length === 0) {
        console.log('[Activities] Brak zadań dla', displayName);
        return true;  // No quests = success (nothing to do)
      }

      console.log('[Activities] Znaleziono', locationQuests.length, 'zadań dla', displayName);

      // Build queue with only these quests
      DAILY.questQueue = AFO_DAILY.groupPortalQuests(locationQuests);

      // Start daily quest system (override skipped/enabled temporarily)
      DAILY.stop = false;
      DAILY.paused = false;
      DAILY.currentQuestIdx = 0;
      DAILY.currentStageIdx = 0;
      DAILY.ownEmpire = GAME.char_data.empire;
      DAILY.isNavigating = false;
      DAILY.isTeleporting = false;
      DAILY.isInCombat = false;
      DAILY.inPortal = false;
      DAILY.portalGroup = [];
      DAILY.portalGroupIdx = 0;
      DAILY._dialogAttempts = 0;
      DAILY._currentQuest = null;

      // Update UI
      AFO_DAILY.updateStatus(`[Activities] ${displayName}...`);

      // Start processing
      setTimeout(() => AFO_DAILY.processNextQuest(), 500);

      // Wait for completion (check every 2s, max 5 minutes)
      const maxWait = 5 * 60 * 1000;  // 5 minutes
      const start = Date.now();

      while (Date.now() - start < maxWait) {
        if (ACTIVITIES.stop) {
          // Stop daily quests too
          AFO_DAILY.stop('Activities stopped');
          return false;
        }

        if (ACTIVITIES.paused) {
          // Pause daily quests too
          DAILY.paused = true;
          await delay(1000);
          continue;
        } else if (DAILY.paused) {
          // Resume daily quests when activities resume
          DAILY.paused = false;
        }

        // Check if daily quests finished
        if (DAILY.stop) {
          console.log('[Activities] Daily quests finished for', displayName);
          return true;
        }

        await delay(2000);
      }

      console.log('[Activities] Timeout - daily quests took too long for', displayName);
      AFO_DAILY.stop('Timeout');
      return false;
    }

    // Helper: Run LPVM with limit 1 for current born
    async function runLPVMOnce() {
      console.log('[Activities] Executing: List Gończy PvM');

      if (typeof AFO_LPVM === 'undefined') {
        console.log('[Activities] AFO_LPVM not available');
        return false;
      }

      // Set up LPVM for current born, limit 1
      const bornMap = { 0: 2, 1: 2, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
      LPVM.Born = bornMap[GAME.char_data.reborn] || 2;
      LPVM.limit = true;
      LPVM.limit2 = 1;
      LPVM.pvm_killed = 0;
      LPVM.Stop = false;

      // Start LPVM
      AFO_LPVM.Start();
      console.log('[Activities] Started LPVM, born:', LPVM.Born);

      // Wait for completion (check every 2s, max 3 minutes)
      const maxWait = 3 * 60 * 1000;
      const start = Date.now();

      while (Date.now() - start < maxWait) {
        if (ACTIVITIES.stop) {
          LPVM.Stop = true;
          return false;
        }

        if (ACTIVITIES.paused) {
          await delay(1000);
          continue;
        }

        // Check if LPVM finished (killed 1)
        if (LPVM.Stop || LPVM.pvm_killed >= 1) {
          console.log('[Activities] LPVM finished, killed:', LPVM.pvm_killed);
          LPVM.Stop = true;
          return true;
        }

        await delay(2000);
      }

      console.log('[Activities] LPVM timeout');
      LPVM.Stop = true;
      return false;
    }

    // Activity executor additions
    activityExecutors['Odbierz nagrodę za List Gończy PvM'] = async () => {
      return await runLPVMOnce();
    };

    activityExecutors['Ukończ trening'] = async () => {
      console.log('[Activities] Executing: Ukończ trening');

      // Check if already training
      if (GAME.is_training || document.querySelector('#train_uptime .timer')) {
        console.log('[Activities] Trening już trwa');
        return true;
      }

      // Start training (stat: 1, duration: 1 = shortest)
      GAME.socket.emit('ga', { a: 8, type: 2, stat: 1, duration: 1 });
      console.log('[Activities] Rozpoczęto trening');
      await delay(1000);

      return true;
    };

    activityExecutors['Ulepsz trening'] = async () => {
      console.log('[Activities] Executing: Ulepsz trening');

      // First check if we need to start training
      if (!GAME.is_training && !document.querySelector('#train_uptime .timer')) {
        // Start training first
        GAME.socket.emit('ga', { a: 8, type: 2, stat: 1, duration: 1 });
        console.log('[Activities] Rozpoczęto trening dla ulepszenia');
        await delay(1500);
      }

      // Upgrade training
      GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' });
      console.log('[Activities] Ulepszono trening');
      await delay(1000);

      // Check if we should cancel (only if Ukończ trening is NOT selected)
      const hasUkonczTrening = ACTIVITIES.selectedActivities.some(a => a.includes('Ukończ trening'));
      if (!hasUkonczTrening) {
        // Cancel training
        GAME.socket.emit('ga', { a: 8, type: 3 });
        console.log('[Activities] Przerwano trening (tylko ulepszenie)');
        await delay(500);
      }

      return true;
    };

    // Activity priority ordering (lower = earlier)
    const ACTIVITY_PRIORITY = {
      // Normal activities (default priority)
      'Odbierz nagrodę za codzienne logowanie': 1,
      'Odbierz nagrodę VIP': 2,
      'Pobłogosław innego gracza': 3,
      'Walcz w Otchłani Dusz': 4,
      'Walcz na Arenie PvP': 5,
      'Asystuj w treningu klanowym': 6,

      // Equipment activities
      'Ulepsz Kulę Energii': 10,
      'Ulepsz lub połącz dowolny przedmiot': 11,
      'Użyj dowolną fasolkę Senzu lub wyciąg': 12,
      'Przekaż przedmioty na PU klanu': 13,
      'Użyj Substancję Przyspieszającą': 14,

      // Quest activities
      'Odbierz nagrodę za List Gończy PvM': 20,
      'Wykonaj zadanie na Prywatnej Planecie': 21,
      'Wykonaj zadanie na Planecie Klanowej': 22,
      'Wykonaj zadanie w siedzibie imperium': 23,

      // Last activities
      'Udaj się na wyprawę': 90,  // Second to last
      'Ukończ trening': 98,        // Last (but before Ulepsz)
      'Ulepsz trening': 99,        // Last
    };

    function getActivityPriority(activityName) {
      // Find matching priority key
      for (const [key, priority] of Object.entries(ACTIVITY_PRIORITY)) {
        if (activityName.includes(key)) {
          return priority;
        }
      }
      return 50;  // Default middle priority
    }

    // Main activity processor
    async function processNextActivity() {
      if (ACTIVITIES.stop || ACTIVITIES.paused) return;

      // Sort remaining activities by priority
      const remaining = ACTIVITIES.selectedActivities
        .filter(name => !ACTIVITIES.completedActivities.includes(name))
        .sort((a, b) => getActivityPriority(a) - getActivityPriority(b));

      if (remaining.length === 0) {
        completeExecution();
        return;
      }

      const next = remaining[0];
      ACTIVITIES.currentActivity = next;
      updateStatus(next);
      updatePoints();

      console.log('[Activities] Processing:', next);

      // Find executor for this activity
      let executed = false;
      for (const [activityKey, executor] of Object.entries(activityExecutors)) {
        if (next.includes(activityKey)) {
          try {
            executed = await executor();
          } catch (e) {
            console.error('[Activities] Error executing:', activityKey, e);
            executed = false;
          }
          break;
        }
      }

      if (ACTIVITIES.stop || ACTIVITIES.paused) return;

      // Mark as completed (even if failed - we move on)
      ACTIVITIES.completedActivities.push(next);

      // Add points only if successfully executed
      if (executed) {
        const points = getActivityPoints(next);
        ACTIVITIES.earnedPoints += points;
        console.log('[Activities] +' + points + ' punktów (total: ' + ACTIVITIES.earnedPoints + ')');
      }

      updatePoints();  // Update progress display

      if (!executed) {
        console.log('[Activities] Activity failed or not implemented:', next);
      }

      // Wait 1s then process next
      await delay(1000);
      processNextActivity();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    injectCSS();

    // Hook page_switch
    hookPageSwitch();

    // Also check if we're already on activities page
    const currentPage = document.getElementById('page_game_activities');
    if (currentPage && currentPage.style.display === 'block') {
      console.log('[Activities] Already on activities page, injecting now');
      setTimeout(injectActivitiesUI, 200);
    }

    console.log('[Activities] Module initialized');
  }
})();


// ========== remote/reconnect/storage.js ==========
/**
 * ============================================================================
 * AFO - Storage Bridge
 * ============================================================================
 * 
 * Provides chrome.storage.local access from page context via custom events.
 * Content script (content_script.js) handles the actual storage operations.
 * 
 * ============================================================================
 */

const AFO_STORAGE = {
  // Request ID counter for matching responses
  _requestId: 0,

  // Pending requests waiting for response
  _pending: new Map(),

  // Initialize listener for responses
  _initialized: false,

  /**
   * Initialize the response listener
   */
  init() {
    if (this._initialized) return;

    window.addEventListener('__GIENIOBOT_STORAGE_RESULT__', (event) => {
      const { requestId, success, data, error } = event.detail;
      const pending = this._pending.get(requestId);

      if (pending) {
        this._pending.delete(requestId);
        if (success) {
          pending.resolve(data);
        } else {
          pending.reject(new Error(error || 'Storage operation failed'));
        }
      }
    });

    this._initialized = true;
    console.log('[AFO_STORAGE] Bridge initialized');
  },

  /**
   * Generate unique request ID
   */
  _nextRequestId() {
    return `req_${++this._requestId}_${Date.now()}`;
  },

  /**
   * Send request and wait for response
   */
  _request(eventName, detail, timeout = 5000) {
    this.init(); // Ensure initialized

    const requestId = this._nextRequestId();

    return new Promise((resolve, reject) => {
      // Set timeout
      const timer = setTimeout(() => {
        this._pending.delete(requestId);
        reject(new Error('Storage request timeout'));
      }, timeout);

      // Store pending request
      this._pending.set(requestId, {
        resolve: (data) => {
          clearTimeout(timer);
          resolve(data);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        }
      });

      // Dispatch request event
      window.dispatchEvent(new CustomEvent(eventName, {
        detail: { requestId, ...detail }
      }));
    });
  },

  // ============================================
  // PUBLIC API (mirrors chrome.storage.local)
  // ============================================

  /**
   * Get data from storage
   * @param {string|string[]|null} keys - Keys to get, or null for all
   * @returns {Promise<Object>} - Storage data
   */
  async get(keys) {
    const result = await this._request('__GIENIOBOT_STORAGE_GET__', { keys });
    return result || {};
  },

  /**
   * Set data in storage
   * @param {Object} data - Key-value pairs to set
   * @returns {Promise<void>}
   */
  async set(data) {
    await this._request('__GIENIOBOT_STORAGE_SET__', { data });
  },

  /**
   * Remove keys from storage
   * @param {string|string[]} keys - Keys to remove
   * @returns {Promise<void>}
   */
  async remove(keys) {
    await this._request('__GIENIOBOT_STORAGE_REMOVE__', { keys });
  }
};

// Auto-initialize
AFO_STORAGE.init();

// Export
window.AFO_STORAGE = AFO_STORAGE;
console.log('[AFO] Storage bridge module loaded');


// ========== remote/reconnect/credentials.js ==========
/**
 * ============================================================================
 * AFO - Credentials Manager
 * ============================================================================
 *
 * Manages user login credentials with simple base64 obfuscation.
 * Credentials are global (one per account) - stored via AFO_STORAGE bridge.
 *
 * ============================================================================
 */

const AFO_CREDENTIALS = {
  // Storage key - single global key for the account
  STORAGE_KEY: 'gieniobot_creds',

  // Legacy prefix for cleanup
  LEGACY_PREFIX: 'gieniobot_creds_',

  // ============================================
  // ENCODING/DECODING (base64 + reverse)
  // ============================================

  /**
   * Simple obfuscation: reverse string + base64
   */
  encode(str) {
    if (!str) return '';
    try {
      // Reverse the string and encode to base64
      const reversed = str.split('').reverse().join('');
      return btoa(unescape(encodeURIComponent(reversed)));
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Encode error:', e);
      return '';
    }
  },

  /**
   * Decode: base64 decode + reverse
   */
  decode(str) {
    if (!str) return '';
    try {
      // Decode from base64 and reverse
      const decoded = decodeURIComponent(escape(atob(str)));
      return decoded.split('').reverse().join('');
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Decode error:', e);
      return '';
    }
  },

  // ============================================
  // SAVE / LOAD / DELETE
  // ============================================

  /**
   * Save credentials (global, one per account)
   */
  async save(login, password) {
    const data = {
      login: this.encode(login),
      password: this.encode(password),
      savedAt: Date.now()
    };

    try {
      await AFO_STORAGE.set({ [this.STORAGE_KEY]: data });
      console.log('[AFO_CREDENTIALS] Saved credentials');
      return true;
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Save error:', e);
      return false;
    }
  },

  /**
   * Get saved credentials
   */
  async get() {
    try {
      const result = await AFO_STORAGE.get(this.STORAGE_KEY);
      if (result[this.STORAGE_KEY]) {
        return {
          login: this.decode(result[this.STORAGE_KEY].login),
          password: this.decode(result[this.STORAGE_KEY].password),
          savedAt: result[this.STORAGE_KEY].savedAt
        };
      }

      // Try legacy format migration
      return await this._tryLegacyMigration();
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Get error:', e);
      return null;
    }
  },

  /**
   * Check if credentials exist
   */
  async exists() {
    const creds = await this.get();
    return creds !== null && creds.login && creds.password;
  },

  /**
   * Clear credentials
   */
  async clear() {
    try {
      await AFO_STORAGE.remove(this.STORAGE_KEY);
      console.log('[AFO_CREDENTIALS] Cleared credentials');
      return true;
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Clear error:', e);
      return false;
    }
  },

  /**
   * Migrate from legacy per-server+char format if exists
   */
  async _tryLegacyMigration() {
    try {
      const result = await AFO_STORAGE.get(null);
      for (const key in result) {
        if (key.startsWith(this.LEGACY_PREFIX) && result[key].login) {
          console.log('[AFO_CREDENTIALS] Migrating legacy credentials from', key);
          const login = this.decode(result[key].login);
          const password = this.decode(result[key].password);
          if (login && password) {
            await this.save(login, password);
            // Clean up legacy key
            await AFO_STORAGE.remove(key);
            return { login, password, savedAt: result[key].savedAt };
          }
        }
      }
    } catch (e) {
      console.error('[AFO_CREDENTIALS] Legacy migration error:', e);
    }
    return null;
  }
};

// Export
window.AFO_CREDENTIALS = AFO_CREDENTIALS;
console.log('[AFO] Credentials module loaded');


// ========== remote/reconnect/stateManager.js ==========
/**
 * ============================================================================
 * AFO - State Manager
 * ============================================================================
 * 
 * Manages serialization and deserialization of all AFO module states.
 * Saves/loads state per server + character via AFO_STORAGE bridge.
 * 
 * ============================================================================
 */

const AFO_STATE_MANAGER = {
  // Storage key prefix
  KEY_PREFIX: 'gieniobot_state_',

  // ============================================
  // MODULE DEFINITIONS
  // ============================================

  /**
   * Defines which properties to save for each module.
   * Only non-transient, user-configurable properties.
   */
  MODULES: {
    // PVM (Respawn)
    RESP: [
      'stop', 'wait', 'loc', 'code', 'kontoTP', 'codeTP',
      'bless', 'checkSSJ', 'checkOST', 'jaka', 'zmiana', 'multifight',
      'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10',
      'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18',
      'buff_imp', 'buff_clan', 'CONF_SENZU'
    ],

    // PVP
    PVP: [
      'stop', 'wait', 'wait2', 'loc', 'x', 'y', 'startX', 'startY',
      'code', 'autoWars', 'autoClanWars', 'g', 'speed', 'speedMultiplier',
      'higherRebornAvoid', 'dogory', 'tele', 'kontoTP', 'codeTP',
      'buff_imp', 'buff_clan'
    ],

    // LPVM (Listy gończe)
    LPVM: [
      'Stop', 'Born', 'limit', 'limit2', 'wait', 'Map', 'pvm_killed'
    ],

    // GLEBIA (Głębia)
    GLEBIA: [
      'stop', 'code', 'kontoTP', 'speed'
    ],

    // CODE (Kody/Trening)
    CODE: [
      'stop', 'what_to_train', 'what_to_traintime', 'acc', 'zast',
      'b1', 'b2', 'checkSSJ'
    ],

    // DAILY (Daily quests)
    DAILY: [
      'stop', 'enabledQuests', 'combatLoc', 'substance', 'useCompressor'
    ],

    // RES (Resources/Mining) - optional
    RES: [
      'stop', 'loc', 'speed'
    ]
  },

  // ============================================
  // STORAGE KEY
  // ============================================

  /**
   * Generate storage key for server (one state per server)
   * charId parameter kept for backward compatibility but ignored in key
   */
  getKey(server, charId) {
    return `${this.KEY_PREFIX}s${server}`;
  },

  // ============================================
  // SERIALIZE / DESERIALIZE
  // ============================================

  /**
   * Serialize current state of all modules
   * Returns object with all module states
   */
  serialize() {
    const state = {
      savedAt: Date.now(),
      server: typeof GAME !== 'undefined' ? GAME.server : null,
      charId: typeof GAME !== 'undefined' ? GAME.char_id : null,
      modules: {},
      extra: {}
    };

    // Serialize each module
    for (const [moduleName, properties] of Object.entries(this.MODULES)) {
      const moduleObj = window[moduleName];
      if (moduleObj) {
        state.modules[moduleName] = {};
        for (const prop of properties) {
          if (prop in moduleObj) {
            // Deep clone arrays and objects
            const value = moduleObj[prop];
            if (Array.isArray(value)) {
              state.modules[moduleName][prop] = [...value];
            } else if (typeof value === 'object' && value !== null) {
              state.modules[moduleName][prop] = JSON.parse(JSON.stringify(value));
            } else {
              state.modules[moduleName][prop] = value;
            }
          }
        }
      }
    }

    // Save extra GAME data
    if (typeof GAME !== 'undefined') {
      // spawnerIgnore - important for PVM
      if (GAME.spawner && GAME.spawner[1]) {
        state.extra.spawnerIgnore = [...GAME.spawner[1]];
      }
      // usePaToSpawn - PA limit for spawner
      if (GAME.spawner && GAME.spawner[0] !== undefined) {
        state.extra.usePaToSpawn = GAME.spawner[0];
      } else {
        // Fallback: try reading from input
        const paInput = $('#kws_spawn input[name=usePaToSpawn]').val();
        if (paInput) {
          state.extra.usePaToSpawn = parseInt(paInput, 10) || 1000;
        }
      }
    }

    // Save kws automation states (arena, expeditions, abyss)
    if (typeof kws !== 'undefined') {
      state.kws = {
        auto_arena: kws.auto_arena || false,
        autoExpeditions: kws.autoExpeditions || false,
        auto_abyss: kws.auto_abyss || false,
        // Settings for expeditions
        aeCodes: kws.settings?.aeCodes || false
      };
    }

    // Save Kukla Guardian state (Strażnik Kukli)
    if (typeof KUKLA_GUARDIAN !== 'undefined') {
      state.kuklaGuardian = {
        enabled: KUKLA_GUARDIAN.enabled || false
      };
    }

    // Save Clan Assist state (Automatyczne Asysty)
    if (typeof CLAN_ASSIST !== 'undefined') {
      state.clanAssist = {
        enabled: CLAN_ASSIST.enabled !== false
      };
    }

    // Save activities state if available
    if (window.AFO_ACTIVITIES_STATE) {
      state.activities = {
        enabled: window.AFO_ACTIVITIES_STATE.enabled || false,
        selectedActivities: window.AFO_ACTIVITIES_STATE.selectedActivities || [],
        substance: window.AFO_ACTIVITIES_STATE.substance || 'x3'
      };
    }

    return state;
  },

  /**
   * Deserialize and apply state to modules
   * @param {Object} state - State object from serialize()
   * @param {boolean} startModules - Whether to start active modules after restore
   */
  deserialize(state, startModules = false) {
    if (!state || !state.modules) {
      console.warn('[AFO_STATE_MANAGER] Invalid state object');
      return false;
    }

    console.log('[AFO_STATE_MANAGER] Deserialize called, startModules:', startModules);

    // If starting modules, we need to defer the actual restore until AFO is loaded
    // because AFO creates fresh module objects that would overwrite our restored values
    if (startModules) {
      console.log('[AFO_STATE_MANAGER] Deferring restore until AFO is loaded...');
      this._pendingState = state;
      this.startActiveModules(state);
      return true;
    }

    // Otherwise restore immediately (for manual restore when AFO is already loaded)
    return this._doRestore(state);
  },

  /**
   * Internal: Actually restore state to module objects
   * Called after AFO is loaded
   */
  _doRestore(state) {
    console.log('[AFO_STATE_MANAGER] Restoring state from', new Date(state.savedAt).toLocaleTimeString());

    // Log what we're restoring for debugging
    if (state.modules.PVP) {
      console.log('[AFO_STATE_MANAGER] PVP state to restore:', {
        stop: state.modules.PVP.stop,
        code: state.modules.PVP.code,
        kontoTP: state.modules.PVP.kontoTP,
        speed: state.modules.PVP.speed,
        speedMultiplier: state.modules.PVP.speedMultiplier
      });
    }

    // Restore each module
    for (const [moduleName, moduleState] of Object.entries(state.modules)) {
      const moduleObj = window[moduleName];
      if (moduleObj && this.MODULES[moduleName]) {
        console.log(`[AFO_STATE_MANAGER] Restoring ${moduleName}...`);

        for (const [prop, value] of Object.entries(moduleState)) {
          // Only restore properties we know about
          if (this.MODULES[moduleName].includes(prop)) {
            // Deep clone arrays and objects
            if (Array.isArray(value)) {
              moduleObj[prop] = [...value];
            } else if (typeof value === 'object' && value !== null) {
              moduleObj[prop] = JSON.parse(JSON.stringify(value));
            } else {
              moduleObj[prop] = value;
            }
          }
        }
      }
    }

    // Restore extra GAME data
    if (state.extra && typeof GAME !== 'undefined') {
      if (state.extra.spawnerIgnore && GAME.spawner) {
        GAME.spawner[1] = [...state.extra.spawnerIgnore];
      }
      // Restore usePaToSpawn
      if (state.extra.usePaToSpawn !== undefined) {
        if (GAME.spawner) {
          GAME.spawner[0] = state.extra.usePaToSpawn;
        }
        $('#kws_spawn input[name=usePaToSpawn]').val(state.extra.usePaToSpawn);
        console.log('[AFO_STATE_MANAGER] usePaToSpawn restored:', state.extra.usePaToSpawn);
      }
    }

    // Restore activities state
    if (state.activities && window.AFO_ACTIVITIES_STATE) {
      window.AFO_ACTIVITIES_STATE.enabled = state.activities.enabled;
      window.AFO_ACTIVITIES_STATE.selectedActivities = state.activities.selectedActivities || [];
      window.AFO_ACTIVITIES_STATE.substance = state.activities.substance || 'x3';
    }

    return true;
  },

  /**
   * Sync UI elements with restored state
   * Updates checkboxes, status labels, inputs etc.
   */
  syncUI(state) {
    if (!state || !state.modules) return;

    console.log('[AFO_STATE_MANAGER] Syncing UI with restored state...');

    // Helper: set status span to On/Off with correct class
    const setStatus = (selector, isOn) => {
      const el = $(selector);
      if (el.length) {
        el.removeClass('red green').addClass(isOn ? 'green' : 'red').html(isOn ? 'On' : 'Off');
      }
    };

    // Helper: set status span to custom text with green class
    const setStatusText = (selector, text) => {
      const el = $(selector);
      if (el.length) {
        el.removeClass('red').addClass('green').html(text);
      }
    };

    // ========================
    // RESP (PVM) UI
    // Selectors from: remote/afo/respawn.js:384-550
    // ========================
    if (state.modules.RESP) {
      const resp = state.modules.RESP;

      // Toggle statuses
      setStatus('.resp_bless .resp_status', resp.bless);
      setStatus('.resp_code .resp_status', resp.code);
      setStatus('.resp_konto .resp_status', resp.kontoTP);
      setStatus('.resp_multi .resp_status', resp.multifight);
      setStatus('.resp_buff_imp .resp_status', resp.buff_imp);
      setStatus('.resp_buff_clan .resp_status', resp.buff_clan);

      // .resp_sub controls checkOST (NOT checkSSJ!)
      // See respawn.js:461-471
      setStatus('.resp_sub .resp_status', resp.checkOST);

      // .resp_ssj controls checkSSJ (separate toggle)
      // See respawn.js:491-494
      setStatus('.resp_ssj .resp_status', resp.checkSSJ);

      // Bless buffs b1-b18: show/hide based on bless state
      if (resp.bless) {
        for (let i = 1; i <= 18; i++) $(`#resp_Panel .resp_bh${i}`).show();
        $('#resp_Panel .resp_on, #resp_Panel .resp_off').show();
      } else {
        for (let i = 1; i <= 18; i++) $(`#resp_Panel .resp_bh${i}`).hide();
        $('#resp_Panel .resp_on, #resp_Panel .resp_off').hide();
      }

      // Buff statuses b1-b18 (set regardless of visibility)
      for (let i = 1; i <= 18; i++) {
        if (resp[`b${i}`] !== undefined) {
          setStatus(`.resp_bh${i} .resp_status`, resp[`b${i}`]);
        }
      }

      // Code -> konto visibility
      if (resp.code) {
        $('#resp_Panel .resp_konto').show();
      } else {
        $('#resp_Panel .resp_konto').hide();
      }

      // checkOST -> .resp_ost visibility; OST/x20 text (not On/Off!)
      // See respawn.js:474-481 - uses .html("Ost") / .html("x20")
      if (resp.checkOST) {
        $('#resp_Panel .resp_ost').show();
        const jakaText = resp.jaka === 0 ? 'Ost' : 'x20';
        setStatusText('.resp_ost .resp_status', jakaText);
      } else {
        $('#resp_Panel .resp_ost').hide();
      }

      // Senzu: CONF_SENZU = false (off) or string like 'SENZU_RED'
      // See respawn.js:496-511
      const senzuTypes = ['red', 'blue', 'green', 'purple', 'yellow', 'magic'];
      if (resp.CONF_SENZU && resp.CONF_SENZU !== false) {
        const activeType = resp.CONF_SENZU.replace('SENZU_', '').toLowerCase();
        senzuTypes.forEach(t => {
          if (t === activeType) {
            $(`#resp_Panel .resp_${t}`).show();
            setStatus(`.resp_${t} .resp_status`, true);
          } else {
            $(`#resp_Panel .resp_${t}`).hide();
          }
        });
      } else {
        senzuTypes.forEach(t => {
          $(`#resp_Panel .resp_${t}`).show();
          setStatus(`.resp_${t} .resp_status`, false);
        });
      }
    }

    // ========================
    // PVP UI
    // Selectors from: remote/afo/pvp.js:486-581
    // ========================
    if (state.modules.PVP) {
      const pvp = state.modules.PVP;

      setStatus('.pvp_Code .pvp_status', pvp.code);
      setStatus('.pvpCODE_konto .pvp_status', pvp.kontoTP);
      setStatus('.pvp_WI .pvp_status', pvp.autoWars);
      setStatus('.pvp_WK .pvp_status', pvp.autoClanWars);
      setStatus('.pvp_rb_avoid .pvp_status', pvp.higherRebornAvoid);
      setStatus('.pvp_buff_imp .pvp_status', pvp.buff_imp);
      setStatus('.pvp_buff_clan .pvp_status', pvp.buff_clan);

      // Code -> konto visibility
      if (pvp.code) {
        $('#pvp_Panel .pvpCODE_konto').show();
      } else {
        $('#pvp_Panel .pvpCODE_konto').hide();
      }

      // Speed input
      if (pvp.speed !== undefined) {
        $('#pvp_Panel input[name=speed_capt]').val(pvp.speed);
      }
    }

    // ========================
    // CODE UI
    // Selectors from: remote/afo/codes.js:165-218
    // Note: bless toggles are .code_bh1, .code_bh2 (NOT .code_b1, .code_b2!)
    // ========================
    if (state.modules.CODE) {
      const code = state.modules.CODE;

      setStatus('.code_acc .code_status', code.acc);
      setStatus('.code_zast .code_status', code.zast);
      setStatus('.code_ssj .code_status', code.checkSSJ);
      setStatus('.code_bh1 .code_status', code.b1);
      setStatus('.code_bh2 .code_status', code.b2);

      // Training selects
      if (code.what_to_train !== undefined) {
        $('#bot_what_to_train').val(code.what_to_train);
      }
      if (code.what_to_traintime !== undefined) {
        $('#bot_what_to_traintime').val(code.what_to_traintime);
      }
    }

    // ========================
    // LPVM UI
    // Selectors from: remote/afo/pvm.js:237-292
    // ========================
    if (state.modules.LPVM) {
      const lpvm = state.modules.LPVM;

      // Born level buttons: show only selected, hide others
      // Born values: g=2, u=3, s=4, h=5, m=6
      const bornMap = { 2: 'g', 3: 'u', 4: 's', 5: 'h', 6: 'm' };
      const allBornKeys = ['g', 'u', 's', 'h', 'm'];

      if (lpvm.Born !== undefined && bornMap[lpvm.Born]) {
        const activeKey = bornMap[lpvm.Born];
        allBornKeys.forEach(k => {
          if (k === activeKey) {
            $(`#lpvm_Panel .lpvm_${k}`).show();
            setStatus(`.lpvm_${k} .lpvm_status`, true);
          } else {
            $(`#lpvm_Panel .lpvm_${k}`).hide();
          }
        });
      }

      // Limit toggle
      if (lpvm.limit !== undefined) {
        setStatus('.lpvm_limit .lpvm_status', lpvm.limit);
      }

      // Limit2 value input
      if (lpvm.limit2 !== undefined) {
        $('#lpvm_Panel input[name=lpvm_capt]').val(lpvm.limit2);
      }

      // pvm_killed counter
      if (lpvm.pvm_killed !== undefined) {
        $('#lpvm_Panel .pvm_killed b').text(lpvm.pvm_killed);
        if (typeof LPVM !== 'undefined') {
          LPVM.pvm_killed = lpvm.pvm_killed;
        }
      }
    }

    // ========================
    // GLEBIA UI
    // Selectors from: remote/afo/glebia.js:60-132
    // Note: main toggle is .glebia_toggle (NOT .glebia_glebia!)
    // ========================
    if (state.modules.GLEBIA) {
      const glebia = state.modules.GLEBIA;

      setStatus('.glebia_code .glebia_status', glebia.code);
      setStatus('.glebia_konto .glebia_status', glebia.kontoTP);

      // Code -> konto visibility
      if (glebia.code) {
        $('#glebia_Panel .glebia_konto').show();
      } else {
        $('#glebia_Panel .glebia_konto').hide();
      }

      // Speed input
      if (glebia.speed !== undefined) {
        $('#glebia_Panel input[name=glebia_speed]').val(glebia.speed);
      }
    }

    // ========================
    // RES (Zbierajka) UI
    // Selectors from: remote/afo/resources.js:284-300
    // No UI inputs to sync - speed/loc are set programmatically
    // ========================

    // ========================
    // Spawner checkboxes (GAME.spawner[1])
    // ========================
    if (state.extra && state.extra.spawnerIgnore) {
      const ignore = state.extra.spawnerIgnore;
      $('#kws_spawn input[name="ignoreMobs"]').each((index, el) => {
        $(el).prop('checked', ignore[index] === 1);
      });
    }

    console.log('[AFO_STATE_MANAGER] UI sync complete');
  },

  /**
   * Start modules that were active when state was saved
   */
  startActiveModules(state) {
    if (!state || !state.modules) return;

    // First, make sure AFO is loaded
    this.ensureAFOLoaded(state);
  },

  /**
   * Load AFO if not loaded, then start modules
   */
  ensureAFOLoaded(state) {
    console.log('[AFO_STATE_MANAGER] ensureAFOLoaded called');

    // Check if AFO is already loaded
    if (typeof AFO !== 'undefined' && AFO.loaded) {
      console.log('[AFO_STATE_MANAGER] AFO already loaded and initialized');
      this._prepareAndStart(state);
      return;
    }

    // Check if AFO exists but not yet fully loaded
    if (typeof AFO !== 'undefined') {
      console.log('[AFO_STATE_MANAGER] AFO exists, waiting for .loaded flag...');
      this._waitForAFOLoaded(state);
      return;
    }

    // Check if kws (Gieniobot) has afo_is_loaded flag - means loading is in progress
    if (typeof kws !== 'undefined' && kws.afo_is_loaded) {
      console.log('[AFO_STATE_MANAGER] AFO loading in progress (kws.afo_is_loaded), waiting...');
      this._waitForAFO(state);
      return;
    }

    // Need to load AFO first
    console.log('[AFO_STATE_MANAGER] Loading AFO...');
    const loadAfoButton = document.querySelector('.qlink.load_afo');
    if (loadAfoButton) {
      loadAfoButton.click();
      this._waitForAFO(state);
    } else {
      console.warn('[AFO_STATE_MANAGER] AFO load button not found!');
      // Try waiting anyway in case AFO loads differently
      this._waitForAFO(state);
    }
  },

  /**
   * Wait for AFO object to exist
   */
  _waitForAFO(state) {
    console.log('[AFO_STATE_MANAGER] Waiting for AFO object...');
    let resolved = false;
    const startTime = Date.now();

    const waitInterval = setInterval(() => {
      if (resolved) return;

      if (typeof AFO !== 'undefined') {
        console.log('[AFO_STATE_MANAGER] AFO object found!');
        resolved = true;
        clearInterval(waitInterval);
        this._waitForAFOLoaded(state);
      } else if (Date.now() - startTime > 30000) {
        console.warn('[AFO_STATE_MANAGER] Timeout waiting for AFO object (30s)');
        resolved = true;
        clearInterval(waitInterval);
      }
    }, 500);
  },

  /**
   * Wait for AFO.loaded flag (full initialization)
   */
  _waitForAFOLoaded(state) {
    console.log('[AFO_STATE_MANAGER] Waiting for AFO.loaded flag...');
    let resolved = false;
    const startTime = Date.now();

    const waitInterval = setInterval(() => {
      if (resolved) return;

      if (typeof AFO !== 'undefined' && AFO.loaded) {
        console.log('[AFO_STATE_MANAGER] AFO fully loaded!');
        resolved = true;
        clearInterval(waitInterval);
        // Give a moment for all handlers to bind
        setTimeout(() => {
          this._prepareAndStart(state);
        }, 500);
      } else if (Date.now() - startTime > 30000) {
        console.warn('[AFO_STATE_MANAGER] Timeout waiting for AFO.loaded (30s)');
        resolved = true;
        clearInterval(waitInterval);
        // Try anyway
        this._prepareAndStart(state);
      }
    }, 500);
  },

  /**
   * Prepare game state and start modules
   */
  _prepareAndStart(state) {
    console.log('[AFO_STATE_MANAGER] Preparing game state...');

    // Switch to map page first (user request)
    if (typeof GAME !== 'undefined' && GAME.page_switch) {
      console.log('[AFO_STATE_MANAGER] Switching to game_map...');
      GAME.page_switch('game_map');
    }

    // Wait 1s then start modules
    setTimeout(() => {
      this.doStartModules(state);
    }, 1000);
  },

  /**
   * Actually start the modules
   */
  doStartModules(state) {
    console.log('[AFO_STATE_MANAGER] ========== doStartModules ==========');
    console.log('[AFO_STATE_MANAGER] State to restore:', state);

    // Check if panels exist
    console.log('[AFO_STATE_MANAGER] Checking panels:');
    console.log('  - #resp_Panel exists:', $('#resp_Panel').length > 0);
    console.log('  - #pvp_Panel exists:', $('#pvp_Panel').length > 0);
    console.log('  - #lpvm_Panel exists:', $('#lpvm_Panel').length > 0);
    console.log('  - #glebia_Panel exists:', $('#glebia_Panel').length > 0);
    console.log('  - #code_Panel exists:', $('#code_Panel').length > 0);

    // NOW restore state - AFO has created the module objects
    console.log('[AFO_STATE_MANAGER] Calling _doRestore...');
    this._doRestore(state);

    // Verify restoration
    console.log('[AFO_STATE_MANAGER] After restore, checking global objects:');
    console.log('  - PVP.stop:', typeof PVP !== 'undefined' ? PVP.stop : 'PVP undefined');
    console.log('  - PVP.code:', typeof PVP !== 'undefined' ? PVP.code : 'PVP undefined');
    console.log('  - RESP.stop:', typeof RESP !== 'undefined' ? RESP.stop : 'RESP undefined');

    // Sync UI now that both AFO panels exist AND state is restored
    console.log('[AFO_STATE_MANAGER] Calling syncUI...');
    this.syncUI(state);

    // Use setTimeout to ensure UI is ready
    console.log('[AFO_STATE_MANAGER] Scheduling module starts in 500ms...');
    setTimeout(() => {
      console.log('[AFO_STATE_MANAGER] Starting module activation...');

      // PVM/RESP - need to set stop=true BEFORE click so handler can turn it ON
      if (state.modules.RESP && !state.modules.RESP.stop) {
        console.log('[AFO_STATE_MANAGER] Starting RESP...');
        if (typeof RESP !== 'undefined') {
          RESP.stop = true; // Handler checks if(stop) to turn ON
        }
        $('#resp_Panel .resp_resp').click();
        // Show the panel and update the main panel button
        $('#resp_Panel').show();
        $('.gh_resp .gh_status').removeClass('red').addClass('green').html('On');
        console.log('[AFO_STATE_MANAGER] RESP started and panel shown');
      } else {
        console.log('[AFO_STATE_MANAGER] RESP not started (stop:', state.modules.RESP?.stop, ')');
      }

      // PVP - need to set stop=true BEFORE click so handler can turn it ON
      if (state.modules.PVP && !state.modules.PVP.stop) {
        console.log('[AFO_STATE_MANAGER] Starting PVP...');
        if (typeof PVP !== 'undefined') {
          console.log('[AFO_STATE_MANAGER] Setting PVP.stop = true before click');
          PVP.stop = true; // Handler checks if(stop) to turn ON
        }
        $('#pvp_Panel .pvp_pvp').click();
        // Show the panel and update the main panel button
        $('#pvp_Panel').show();
        $('.gh_pvp .gh_status').removeClass('red').addClass('green').html('On');
        console.log('[AFO_STATE_MANAGER] PVP started and panel shown');
      } else {
        console.log('[AFO_STATE_MANAGER] PVP not started (stop:', state.modules.PVP?.stop, ')');
      }

      // LPVM - need to set Stop=true BEFORE click
      if (state.modules.LPVM && !state.modules.LPVM.Stop) {
        console.log('[AFO_STATE_MANAGER] Starting LPVM...');
        if (typeof LPVM !== 'undefined') {
          LPVM.Stop = true;
        }
        $('#lpvm_Panel .lpvm_lpvm').click();
        // Show the panel and update the main panel button
        $('#lpvm_Panel').show();
        $('.gh_lpvm .gh_status').removeClass('red').addClass('green').html('On');
        console.log('[AFO_STATE_MANAGER] LPVM started and panel shown');
      } else {
        console.log('[AFO_STATE_MANAGER] LPVM not started (Stop:', state.modules.LPVM?.Stop, ')');
      }

      // GLEBIA - need to set stop=true BEFORE click
      if (state.modules.GLEBIA && !state.modules.GLEBIA.stop) {
        console.log('[AFO_STATE_MANAGER] Starting GLEBIA...');
        if (typeof GLEBIA !== 'undefined') {
          GLEBIA.stop = true;
        }
        $('#glebia_Panel .glebia_toggle').click();
        // Show the panel and update the main panel button
        $('#glebia_Panel').show();
        $('.gh_glebia .gh_status').removeClass('red').addClass('green').html('On');
        console.log('[AFO_STATE_MANAGER] GLEBIA started and panel shown');
      }

      // CODE - need to set stop=true BEFORE click
      if (state.modules.CODE && !state.modules.CODE.stop) {
        console.log('[AFO_STATE_MANAGER] Starting CODE...');
        if (typeof CODE !== 'undefined') {
          CODE.stop = true;
        }
        $('#code_Panel .code_code').click();
        // Show the panel and update the main panel button
        $('#code_Panel').show();
        $('.gh_code .gh_status').removeClass('red').addClass('green').html('On');
        console.log('[AFO_STATE_MANAGER] CODE started and panel shown');
      }

      // RES (Zbierajka) - need to set stop=true BEFORE click
      if (state.modules.RES && !state.modules.RES.stop) {
        console.log('[AFO_STATE_MANAGER] Starting RES...');
        if (typeof RES !== 'undefined') {
          RES.stop = true;
        }
        $('#res_Panel .res_res').click();
        $('#res_Panel').show();
        $('.gh_res .gh_status').removeClass('red').addClass('green').html('On');
        console.log('[AFO_STATE_MANAGER] RES started and panel shown');
      }

      // Activities (arena, expeditions, etc.)
      if (state.activities && state.activities.enabled) {
        console.log('[AFO_STATE_MANAGER] Starting Activities...');
        if (window.AFO_ACTIVITIES_STATE) {
          window.AFO_ACTIVITIES_STATE.shouldAutoStart = true;
        }
      }

      // kws automations (arena, expeditions, abyss) - click buttons to start
      if (state.kws && typeof kws !== 'undefined') {
        // Restore settings first
        if (state.kws.aeCodes && kws.settings) {
          kws.settings.aeCodes = state.kws.aeCodes;
          $('#aeCodes').prop('checked', state.kws.aeCodes);
        }

        // Auto Arena
        if (state.kws.auto_arena) {
          console.log('[AFO_STATE_MANAGER] Starting Auto Arena...');
          setTimeout(() => {
            if (!kws.auto_arena) {
              kws.auto_arena = true;
              kws.manageAutoArena();
              $('.qlink.manage_auto_arena').addClass('kws_active_icon');
            }
          }, 2000);
        }

        // Auto Expeditions
        if (state.kws.autoExpeditions) {
          console.log('[AFO_STATE_MANAGER] Starting Auto Expeditions...');
          setTimeout(() => {
            if (!kws.autoExpeditions) {
              kws.manageAutoExpeditions();
            }
          }, 3000);
        }

        // Auto Abyss - just set the flag, it triggers on button click
        if (state.kws.auto_abyss) {
          console.log('[AFO_STATE_MANAGER] Starting Auto Abyss...');
          setTimeout(() => {
            kws.auto_abyss = true;
            kws.manageAutoAbyss();
            $('.qlink.manage_auto_abyss').addClass('kws_active_icon');
          }, 4000);
        }
      }

      // Kukla Guardian (Strażnik Kukli)
      if (state.kuklaGuardian && state.kuklaGuardian.enabled && typeof KUKLA_GUARDIAN !== 'undefined') {
        console.log('[AFO_STATE_MANAGER] Starting Kukla Guardian...');
        // Set enabled immediately so parseQuickOpts renders with active class
        KUKLA_GUARDIAN.enabled = true;
        KUKLA_GUARDIAN._stateRestored = true;
        setTimeout(() => {
          if (!KUKLA_GUARDIAN.running) {
            KUKLA_GUARDIAN.start();
          }
          // Ensure icon has active class after any re-render
          $('.qlink.manage_kukla_guardian').addClass('kws_active_icon');
        }, 4500);
      }

      // Clan Assist (Automatyczne Asysty)
      if (state.clanAssist && state.clanAssist.enabled && typeof CLAN_ASSIST !== 'undefined') {
        console.log('[AFO_STATE_MANAGER] Starting Clan Assist...');
        // Set enabled immediately so parseQuickOpts renders with active class
        CLAN_ASSIST.enabled = true;
        setTimeout(() => {
          if (!CLAN_ASSIST.running) {
            CLAN_ASSIST.start();
          }
          // Ensure icon has active class after any re-render
          $('.qlink.manage_auto_clanAssist').addClass('kws_active_icon');
        }, 5000);
      }

      // Show toast after all modules have been started (longest delay is 5s for clan assist)
      setTimeout(() => {
        console.log('[AFO_STATE_MANAGER] ✅ All modules started, restore complete!');
        if (typeof AFO_RECONNECT_UI !== 'undefined') {
          AFO_RECONNECT_UI.showToast('Stan przywrócony!', 'success');
          AFO_RECONNECT_UI.updateStatusFromStorage();
        }
      }, 5500);
    }, 1000);
  },

  // ============================================
  // SAVE / LOAD TO STORAGE
  // ============================================

  /**
   * Save current state to chrome.storage.local
   */
  async save() {
    if (typeof GAME === 'undefined' || !GAME.server || !GAME.char_id) {
      console.warn('[AFO_STATE_MANAGER] GAME not available, cannot save state');
      return false;
    }

    const key = this.getKey(GAME.server, GAME.char_id);
    const state = this.serialize();

    try {
      await AFO_STORAGE.set({ [key]: state });
      console.log(`[AFO_STATE_MANAGER] Saved state for server ${GAME.server}, char ${GAME.char_id}`);
      return true;
    } catch (e) {
      console.error('[AFO_STATE_MANAGER] Save error:', e);
      return false;
    }
  },

  /**
   * Load state from chrome.storage.local
   */
  async load(server, charId) {
    const key = this.getKey(server, charId);

    try {
      const result = await AFO_STORAGE.get(key);
      if (result[key]) {
        return result[key];
      }
      return null;
    } catch (e) {
      console.error('[AFO_STATE_MANAGER] Load error:', e);
      return null;
    }
  },

  /**
   * Load and apply state for current character
   * @param {boolean} startModules - Whether to start active modules
   */
  async loadCurrent(startModules = false) {
    if (typeof GAME === 'undefined' || !GAME.server || !GAME.char_id) {
      console.warn('[AFO_STATE_MANAGER] GAME not available, cannot load state');
      return false;
    }

    const state = await this.load(GAME.server, GAME.char_id);
    if (state) {
      return this.deserialize(state, startModules);
    }
    return false;
  },

  /**
   * Check if state exists for server + character
   */
  async exists(server, charId) {
    const state = await this.load(server, charId);
    return state !== null;
  },

  /**
   * Clear state for specific server + character
   */
  async clear(server, charId) {
    const key = this.getKey(server, charId);

    try {
      await AFO_STORAGE.remove(key);
      console.log(`[AFO_STATE_MANAGER] Cleared state for server ${server}, char ${charId}`);
      return true;
    } catch (e) {
      console.error('[AFO_STATE_MANAGER] Clear error:', e);
      return false;
    }
  },

  /**
   * Clear state for current character
   */
  async clearCurrent() {
    if (typeof GAME === 'undefined' || !GAME.server || !GAME.char_id) {
      return false;
    }
    return await this.clear(GAME.server, GAME.char_id);
  },

  /**
   * Clear all saved states (all servers)
   */
  async clearAll() {
    try {
      const result = await AFO_STORAGE.get(null);
      const keysToRemove = [];

      for (const key in result) {
        if (key.startsWith(this.KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        await AFO_STORAGE.remove(key);
      }

      console.log(`[AFO_STATE_MANAGER] Cleared all states (${keysToRemove.length} keys)`);
      return true;
    } catch (e) {
      console.error('[AFO_STATE_MANAGER] ClearAll error:', e);
      return false;
    }
  },

  /**
   * Get all saved states (for listing)
   */
  async getAll() {
    try {
      const result = await AFO_STORAGE.get(null);
      const states = [];

      for (const key in result) {
        if (key.startsWith(this.KEY_PREFIX)) {
          const state = result[key];
          states.push({
            key: key,
            server: state.server,
            charId: state.charId,
            savedAt: state.savedAt,
            activeModules: this.getActiveModulesList(state)
          });
        }
      }

      return states;
    } catch (e) {
      console.error('[AFO_STATE_MANAGER] GetAll error:', e);
      return [];
    }
  },

  /**
   * Get list of active modules from state
   */
  getActiveModulesList(state) {
    const active = [];
    if (!state || !state.modules) return active;

    if (state.modules.RESP && !state.modules.RESP.stop) active.push('PVM');
    if (state.modules.PVP && !state.modules.PVP.stop) active.push('PVP');
    if (state.modules.LPVM && !state.modules.LPVM.Stop) active.push('LPVM');
    if (state.modules.GLEBIA && !state.modules.GLEBIA.stop) active.push('GŁĘBIA');
    if (state.modules.CODE && !state.modules.CODE.stop) active.push('KODY');
    if (state.modules.RES && !state.modules.RES.stop) active.push('ZBIERAJKA');
    if (state.activities && state.activities.enabled) active.push('Activities');

    // kws automations
    if (state.kws) {
      if (state.kws.auto_arena) active.push('Arena');
      if (state.kws.autoExpeditions) active.push('Expeditions');
      if (state.kws.auto_abyss) active.push('Otchłań');
    }

    return active;
  },

  // ============================================
  // UTILITY
  // ============================================

  /**
   * Get human-readable summary of current state
   */
  getSummary() {
    const state = this.serialize();
    const active = this.getActiveModulesList(state);

    return {
      server: state.server,
      charId: state.charId,
      activeModules: active,
      hasAnyActive: active.length > 0
    };
  }
};

// Export
window.AFO_STATE_MANAGER = AFO_STATE_MANAGER;
console.log('[AFO] State Manager module loaded');


// ========== remote/reconnect/ui.js ==========
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
  isHistoryOpen: false,
  currentStatus: 'neutral', // 'neutral', 'saved', 'error', 'unsaved'
  lastSaveTime: null,
  reconnectHistory: [],

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    this.injectCSS();
    this.injectIcon();
    this.injectMenu();
    this.bindEvents();
    this.setupDraggable();
    this.loadHistory();
    this.updateStatusFromStorage();
    this.startStatusMonitor();
    console.log('[AFO_RECONNECT_UI] Initialized');
  },

  /**
   * Periodically update icon border color based on current state
   * Green = saved state matches current char, credentials exist
   * Orange = unsaved / state for different char / no state
   * Red = error or no credentials
   */
  startStatusMonitor() {
    this._lastCharId = null;

    this.statusMonitorInterval = setInterval(async () => {
      if (typeof GAME === 'undefined' || !GAME.server) return;

      // Detect char change
      const currentCharId = GAME.char_id;
      if (currentCharId !== this._lastCharId) {
        this._lastCharId = currentCharId;
        await this.updateStatusFromStorage();
      }
    }, 2000);
  },

  // ============================================
  // HISTORY
  // ============================================

  loadHistory() {
    if (typeof GAME === 'undefined' || !GAME.server || !GAME.char_id) return;
    try {
      const key = `afo_reconnect_history_s${GAME.server}_c${GAME.char_id}`;
      const data = localStorage.getItem(key);
      if (data) {
        this.reconnectHistory = JSON.parse(data);
      }
    } catch (e) {
      console.warn('[AFO_RECONNECT_UI] Failed to load history:', e);
    }
  },

  saveHistory() {
    if (typeof GAME === 'undefined' || !GAME.server || !GAME.char_id) return;
    try {
      const key = `afo_reconnect_history_s${GAME.server}_c${GAME.char_id}`;
      localStorage.setItem(key, JSON.stringify(this.reconnectHistory));
    } catch (e) {
      console.warn('[AFO_RECONNECT_UI] Failed to save history:', e);
    }
  },

  addReconnectTimestamp(timestamp = Date.now()) {
    // Add to beginning
    this.reconnectHistory.unshift(timestamp);
    // Keep max 5
    if (this.reconnectHistory.length > 5) {
      this.reconnectHistory = this.reconnectHistory.slice(0, 5);
    }
    this.saveHistory();
    this.renderHistory();
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
        border: 3px solid transparent;
      }

      #afo-reconnect-icon:hover {
        transform: scale(1.1);
        background: rgba(0, 0, 0, 0.9);
      }

      /* Prevent hover transform when dragging */
      #afo-reconnect-icon.dragging {
        transform: none !important;
        transition: none !important;
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

      /* History List */
      .afo-history-toggle {
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: color 0.2s;
      }
      .afo-history-toggle:hover {
        color: #fff;
      }
      .afo-history-arrow {
        display: inline-block;
        font-size: 10px;
        transition: transform 0.2s;
      }
      .afo-history-arrow.open {
        transform: rotate(90deg);
      }
      #afo-history-list {
        display: none;
        margin-top: 5px;
        padding-left: 10px;
        border-left: 2px solid #0f3460;
      }
      #afo-history-list.open {
        display: block;
      }
      .afo-history-item {
        font-size: 12px;
        color: #aaa;
        padding: 2px 0;
      }


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
          <div class="afo-status-row">
            <span class="afo-status-label">Ostatni reconnect:</span>
            <span class="afo-status-value">
              <span id="afo-last-reconnect" class="afo-history-toggle">-</span>
              <div id="afo-history-list"></div>
            </span>
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
            👤 Ustawienia
          </button>
          <button class="afo-btn afo-btn-danger" id="afo-btn-clear">
            🗑️ Wyczyść stan (serwer)
          </button>
          <button class="afo-btn afo-btn-danger" id="afo-btn-clear-all">
            🗑️ Wyczyść stan (wszystkie)
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

    // History toggle
    document.getElementById('afo-last-reconnect').addEventListener('click', () => {
      this.toggleHistory();
    });

    // Clear button (server)
    document.getElementById('afo-btn-clear').addEventListener('click', async () => {
      await this.clearState();
    });

    // Clear button (global)
    document.getElementById('afo-btn-clear-all').addEventListener('click', async () => {
      await this.clearAllStates();
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
    this.loadHistory();
    this.renderHistory();
    await this.updateStatusFromStorage();
  },

  async updateStatusFromStorage() {
    if (typeof GAME === 'undefined' || !GAME.server || !GAME.char_id) {
      this.setStatus('neutral', 'Oczekiwanie na grę');
      return;
    }

    try {
      // Check credentials
      const hasCreds = typeof AFO_CREDENTIALS !== 'undefined' && await AFO_CREDENTIALS.exists();

      const state = await AFO_STATE_MANAGER.load(GAME.server, GAME.char_id);

      if (!hasCreds) {
        this.setStatus('error', 'Brak credentials');
        this.updateLastSaveTime(state ? state.savedAt : null);
        this.updateModulesList(state);
        return;
      }

      if (state) {
        this.lastSaveTime = state.savedAt;
        // Check if saved state matches current character
        if (state.charId && state.charId != GAME.char_id) {
          const savedCharName = state.charId;
          this.setStatus('unsaved', `Stan innej postaci (${savedCharName})`);
        } else {
          this.setStatus('saved', 'Zsynchronizowane');
        }
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

  renderHistory() {
    const label = document.getElementById('afo-last-reconnect');
    const list = document.getElementById('afo-history-list');
    if (!label || !list) return;

    if (this.reconnectHistory.length === 0) {
      label.textContent = '-';
      label.classList.remove('afo-history-toggle');
      list.innerHTML = '';
      return;
    }

    const latest = new Date(this.reconnectHistory[0]);
    const arrow = this.reconnectHistory.length > 1
      ? `<span class="afo-history-arrow ${this.isHistoryOpen ? 'open' : ''}">▶</span>`
      : '';

    label.innerHTML = `${latest.toLocaleString('pl-PL')} ${arrow}`;

    if (this.reconnectHistory.length > 1) {
      label.classList.add('afo-history-toggle');
      // Render other items (skip first)
      const others = this.reconnectHistory.slice(1);
      list.innerHTML = others.map(ts => {
        const d = new Date(ts);
        return `<div class="afo-history-item">${d.toLocaleString('pl-PL')}</div>`;
      }).join('');

      if (this.isHistoryOpen) {
        list.classList.add('open');
      } else {
        list.classList.remove('open');
      }
    } else {
      label.classList.remove('afo-history-toggle');
      list.classList.remove('open');
      list.innerHTML = '';
    }
  },

  toggleHistory() {
    if (this.reconnectHistory.length <= 1) return;
    this.isHistoryOpen = !this.isHistoryOpen;
    this.renderHistory();
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
      { key: 'PVP', name: 'PVP', icon: '🗡️', stopKey: 'stop' },
      { key: 'LPVM', name: 'LPVM', icon: '📜', stopKey: 'Stop' },
      { key: 'GLEBIA', name: 'GŁĘBIA', icon: '🔪', stopKey: 'stop' },
      { key: 'CODE', name: 'KODY', icon: '🔑', stopKey: 'stop' },
      { key: 'RES', name: 'ZBIERAJKA', icon: '💎', stopKey: 'stop' },
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
            Wyprawy
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

    // Kukla Guardian (Obserwator)
    if (state.kuklaGuardian && state.kuklaGuardian.enabled) {
      html += `
        <div class="afo-module-item active">
          <span class="icon">🛡️</span>
          Obserwator
        </div>
      `;
    }

    // Clan Assist (Automatyczne Asysty)
    if (state.clanAssist && state.clanAssist.enabled) {
      html += `
        <div class="afo-module-item active">
          <span class="icon">🤝</span>
          Asysty
        </div>
      `;
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

  async clearAllStates() {
    if (!confirm('Czy na pewno chcesz wyczyścić zapisany stan ze WSZYSTKICH serwerów?')) {
      return;
    }

    try {
      const success = await AFO_STATE_MANAGER.clearAll();

      if (success) {
        this.showToast('Wyczyszczono stany ze wszystkich serwerów', 'success');
        await this.updateStatusFromStorage();
      } else {
        this.showToast('Nie udało się wyczyścić stanów', 'error');
      }
    } catch (e) {
      console.error('[AFO_RECONNECT_UI] Clear all error:', e);
      this.showToast('Błąd: ' + e.message, 'error');
    }
  },

  async loadExistingCredentials() {
    try {
      const creds = await AFO_CREDENTIALS.get();

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
      const success = await AFO_CREDENTIALS.save(login, password);

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
  // DRAGGABLE ICON
  // ============================================

  setupDraggable() {
    const icon = document.getElementById('afo-reconnect-icon');
    if (!icon) return;

    let isDragging = false;
    let hasMoved = false;
    let startX, startY, startLeft, startTop;

    // Load saved position or use default
    this.loadIconPosition(icon);

    const getPos = (e) => {
      if (e.touches && e.touches.length) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    };

    const onStart = (e) => {
      const pos = getPos(e);
      startX = pos.x;
      startY = pos.y;

      const rect = icon.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      isDragging = true;
      hasMoved = false;
    };

    const onMove = (e) => {
      if (!isDragging) return;

      const pos = getPos(e);
      const dx = pos.x - startX;
      const dy = pos.y - startY;

      // Only start dragging after 5px threshold
      if (!hasMoved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

      hasMoved = true;
      icon.classList.add('dragging');
      e.preventDefault();

      // Clamp within viewport
      const maxX = window.innerWidth - icon.offsetWidth;
      const maxY = window.innerHeight - icon.offsetHeight;
      const newLeft = Math.max(0, Math.min(maxX, startLeft + dx));
      const newTop = Math.max(0, Math.min(maxY, startTop + dy));

      icon.style.left = newLeft + 'px';
      icon.style.top = newTop + 'px';
      icon.style.right = 'auto';
    };

    const onEnd = () => {
      isDragging = false;
      icon.classList.remove('dragging');

      // If we moved, save position and suppress the click (menu open)
      if (hasMoved) {
        this.saveIconPosition(icon);
        const suppress = (e) => { e.stopImmediatePropagation(); };
        icon.addEventListener('click', suppress, { once: true, capture: true });
      }
    };

    // Mouse events
    icon.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    // Touch events
    icon.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);

    // Clamp position on window resize
    window.addEventListener('resize', () => {
      this.clampIconToViewport(icon);
    });
  },

  /**
   * Load saved icon position from localStorage
   */
  loadIconPosition(icon) {
    try {
      const saved = localStorage.getItem('afo_reconnect_icon_pos');
      if (saved) {
        const pos = JSON.parse(saved);
        icon.style.left = pos.left + 'px';
        icon.style.top = pos.top + 'px';
        icon.style.right = 'auto';
        // Clamp to ensure it's visible
        this.clampIconToViewport(icon);
      }
    } catch (e) {
      console.warn('[AFO_RECONNECT_UI] Failed to load icon position:', e);
    }
  },

  /**
   * Save icon position to localStorage
   */
  saveIconPosition(icon) {
    try {
      const rect = icon.getBoundingClientRect();
      localStorage.setItem('afo_reconnect_icon_pos', JSON.stringify({
        left: rect.left,
        top: rect.top
      }));
    } catch (e) {
      console.warn('[AFO_RECONNECT_UI] Failed to save icon position:', e);
    }
  },

  /**
   * Clamp icon to viewport (prevent going off-screen)
   */
  clampIconToViewport(icon) {
    const rect = icon.getBoundingClientRect();
    const maxX = window.innerWidth - icon.offsetWidth;
    const maxY = window.innerHeight - icon.offsetHeight;

    let newLeft = rect.left;
    let newTop = rect.top;
    let changed = false;

    if (newLeft < 0) {
      newLeft = 0;
      changed = true;
    } else if (newLeft > maxX) {
      newLeft = maxX;
      changed = true;
    }

    if (newTop < 0) {
      newTop = 0;
      changed = true;
    } else if (newTop > maxY) {
      newTop = maxY;
      changed = true;
    }

    if (changed) {
      icon.style.left = newLeft + 'px';
      icon.style.top = newTop + 'px';
      icon.style.right = 'auto';
      this.saveIconPosition(icon);
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


// ========== remote/reconnect/reconnect.js ==========
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

    // Show cancellable progress bar (10 seconds)
    console.log('[AFO_RECONNECT] Showing cancel bar for 10s...');
    const cancelled = await this.showRestoreCountdown(10);

    if (cancelled) {
      console.log('[AFO_RECONNECT] ❌ State restore cancelled by user');
      if (typeof AFO_RECONNECT_UI !== 'undefined') {
        AFO_RECONNECT_UI.showToast('Przywracanie stanu anulowane', 'warning');
      }
      this.savedStateToRestore = null;
      return;
    }

    console.log('[AFO_RECONNECT] Restoring saved state...');

    const success = AFO_STATE_MANAGER.deserialize(this.savedStateToRestore, true);

    if (success) {
      console.log('[AFO_RECONNECT] ✅ State restore initiated (toast will appear after completion)');

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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Export
window.AFO_RECONNECT = AFO_RECONNECT;
console.log('[AFO] Reconnect module loaded');


// ========== remote/reconnect/index.js ==========
/**
 * ============================================================================
 * AFO - Reconnect Module Index
 * ============================================================================
 * 
 * Entry point for the reconnect subsystem.
 * Initializes immediately - doesn't wait for GAME (needed on main page).
 * 
 * ============================================================================
 */

const AFO_RECONNECT_INIT = {
  initialized: false,

  /**
   * Initialize all reconnect components
   * Called immediately on any kosmiczni.pl page
   */
  init() {
    if (this.initialized) return;

    console.log('[AFO_RECONNECT_INIT] Initializing reconnect system...');

    // Initialize reconnect FIRST (handles login on main page)
    if (typeof AFO_RECONNECT !== 'undefined') {
      AFO_RECONNECT.init();
    } else {
      console.warn('[AFO_RECONNECT_INIT] Reconnect module not loaded');
    }

    // Initialize UI only if on server page (where GAME will be available)
    // UI needs GAME to show character info, so we defer it
    this.initUIWhenReady();

    this.initialized = true;
    console.log('[AFO_RECONNECT_INIT] Reconnect system initialized');
  },

  /**
   * Initialize UI when GAME becomes available
   */
  initUIWhenReady() {
    const checkGame = () => {
      if (typeof GAME !== 'undefined' && GAME.char_id && GAME.char_data) {
        // GAME is ready, init UI
        if (typeof AFO_RECONNECT_UI !== 'undefined') {
          setTimeout(() => {
            AFO_RECONNECT_UI.init();
          }, 1000);
        }
      } else {
        // Keep checking
        setTimeout(checkGame, 1000);
      }
    };

    // Start checking
    checkGame();

    // Stop after 2 minutes
    setTimeout(() => { }, 120000);
  }
};

// Initialize IMMEDIATELY when script loads
// We need to start on main page too, not just when GAME is ready
(function () {
  console.log('[AFO_RECONNECT_INIT] Script loaded, initializing in 1s...');

  // Small delay to ensure other reconnect scripts are loaded
  setTimeout(() => {
    AFO_RECONNECT_INIT.init();
  }, 1000);
})();

// Export
window.AFO_RECONNECT_INIT = AFO_RECONNECT_INIT;
console.log('[AFO] Reconnect index module loaded');


// ========== remote/features/clanAssist.js ==========
/**
 * ============================================================================
 * CLAN ASSIST - Automatic Clan Training Assists
 * ============================================================================
 * 
 * This module automatically assists clan members in training.
 * Runs every 30 seconds, independently of AFO.
 * 
 * Requirements to run:
 * - GAME.char_data must be defined
 * - GAME.char_data.klan_id != 0 (player must be in a clan)
 * - GAME.char_data.reborn >= 1 (player must have at least 1 reborn)
 * 
 * ============================================================================
 */

(function () {
  'use strict';

  // Wait for GAME to be available
  if (typeof GAME === 'undefined') {
    console.log('[ClanAssist] GAME is undefined, skipping initialization');
    return;
  }

  // Global state
  const CLAN_ASSIST = {
    enabled: false,          // Toggle state for auto-assist (off by default, like other modules)
    running: false,          // Currently processing assists
    lastRun: 0,              // Timestamp of last run
    checkInterval: 30000,    // 30 seconds between checks
    assistCooldown: 3000,    // 3 seconds between assists
    waitAfterOpen: 1000,     // 1 second wait after opening training page
    intervalId: null,        // Interval reference
    assistCount: 0           // Total assists done this session
  };

  // Make it globally accessible for debugging
  window.CLAN_ASSIST = CLAN_ASSIST;

  /**
   * Check if auto-assist should run
   * @returns {boolean}
   */
  function canRun() {
    // Must have GAME.char_data
    if (!GAME.char_data) {
      return false;
    }

    // Must be in a clan
    if (!GAME.char_data.klan_id || GAME.char_data.klan_id === 0) {
      return false;
    }

    // Must have at least 1 reborn
    if (GAME.char_data.reborn === undefined || GAME.char_data.reborn < 1) {
      return false;
    }

    return true;
  }

  /**
   * Delay helper
   * @param {number} ms 
   * @returns {Promise}
   */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process all available assists
   */
  async function processAssists() {
    if (CLAN_ASSIST.running) {
      console.log('[ClanAssist] Already running, skipping');
      return;
    }

    // Check if disabled via toggle
    if (CLAN_ASSIST.enabled === false) {
      console.log('[ClanAssist] Disabled via toggle, skipping');
      return;
    }

    // Check if we can run
    if (!canRun()) {
      console.log('[ClanAssist] Requirements not met, skipping');
      return;
    }

    CLAN_ASSIST.running = true;
    CLAN_ASSIST.lastRun = Date.now();

    try {
      console.log('[ClanAssist] Starting assist cycle...');

      // Step 1: Open clan training page
      GAME.emitOrder({ a: 39, type: 54 });

      // Step 2: Wait 1 second for page to load
      await delay(CLAN_ASSIST.waitAfterOpen);

      // Step 3: Collect ALL available assist buttons and extract their data
      const assistButtons = document.querySelectorAll('button[data-option="clan_assist"]');

      if (!assistButtons || assistButtons.length === 0) {
        console.log('[ClanAssist] No assists available');
        CLAN_ASSIST.running = false;
        return;
      }

      // Extract all tid/target data UPFRONT before executing any assists
      const assistsData = [];
      for (const btn of assistButtons) {
        const tid = btn.getAttribute('data-tid');
        const target = btn.getAttribute('data-target');

        if (tid) {
          assistsData.push({
            tid: parseInt(tid),
            target: parseInt(target || tid)
          });
        }
      }

      console.log('[ClanAssist] Found', assistsData.length, 'assists to process');

      // Step 4: Process each assist with cooldown
      let assistsDone = 0;

      for (const assist of assistsData) {
        // Check if disabled mid-cycle
        if (CLAN_ASSIST.enabled === false) {
          console.log('[ClanAssist] Disabled mid-cycle, stopping assists');
          break;
        }

        // Execute assist
        GAME.emitOrder({
          a: 39,
          type: 55,
          tid: assist.tid,
          target: assist.target
        });

        assistsDone++;
        CLAN_ASSIST.assistCount++;
        console.log('[ClanAssist] Assisted tid:', assist.tid, 'target:', assist.target, '(total:', CLAN_ASSIST.assistCount, ')');

        // Hide the confirmation popup
        await delay(300);
        kom_clear();

        // Wait cooldown between assists (skip delay after last one)
        if (assistsDone < assistsData.length) {
          await delay(CLAN_ASSIST.assistCooldown - 300);
        }
      }

      console.log('[ClanAssist] Cycle complete, assisted:', assistsDone);

    } catch (error) {
      console.error('[ClanAssist] Error:', error);
    } finally {
      CLAN_ASSIST.running = false;
    }
  }

  /**
   * Start the auto-assist system
   */
  function startAutoAssist() {
    if (CLAN_ASSIST.intervalId) {
      console.log('[ClanAssist] Already started');
      return;
    }

    console.log('[ClanAssist] Starting auto-assist system (every', CLAN_ASSIST.checkInterval / 1000, 'seconds)');

    // Run immediately on start
    processAssists();

    // Then run every 30 seconds
    CLAN_ASSIST.intervalId = setInterval(() => {
      // Double-check we're not already running (prevents overlap if assist takes longer)
      if (!CLAN_ASSIST.running) {
        processAssists();
      }
    }, CLAN_ASSIST.checkInterval);
  }

  /**
   * Stop the auto-assist system
   */
  function stopAutoAssist() {
    if (CLAN_ASSIST.intervalId) {
      clearInterval(CLAN_ASSIST.intervalId);
      CLAN_ASSIST.intervalId = null;
      console.log('[ClanAssist] Stopped auto-assist system');
    }
  }

  // Expose control functions
  CLAN_ASSIST.start = startAutoAssist;
  CLAN_ASSIST.stop = stopAutoAssist;
  CLAN_ASSIST.process = processAssists;

  // ============================================
  // AUTO-INITIALIZATION
  // ============================================

  // Wait for game to be fully loaded (char_data available)
  let initAttempts = 0;
  const maxInitAttempts = 60; // 30 seconds max wait (60 * 500ms)

  const initCheck = setInterval(() => {
    initAttempts++;

    if (initAttempts > maxInitAttempts) {
      clearInterval(initCheck);
      console.log('[ClanAssist] Timeout waiting for game data, initialization cancelled');
      return;
    }

    // Check if char_data is available
    if (GAME.char_data) {
      clearInterval(initCheck);

      // Check requirements AND enabled flag
      if (canRun() && CLAN_ASSIST.enabled !== false) {
        console.log('[ClanAssist] Requirements met and enabled, starting auto-assist');
        console.log('[ClanAssist] - Clan ID:', GAME.char_data.klan_id);
        console.log('[ClanAssist] - Reborn:', GAME.char_data.reborn);
        startAutoAssist();
      } else if (!canRun()) {
        console.log('[ClanAssist] Requirements not met:');
        console.log('[ClanAssist] - Clan ID:', GAME.char_data?.klan_id || 'none');
        console.log('[ClanAssist] - Reborn:', GAME.char_data?.reborn ?? 'unknown');
      } else {
        console.log('[ClanAssist] Disabled by toggle, auto-assist not started');
      }
    }
  }, 500);

  console.log('[ClanAssist] Module loaded, waiting for game data...');

})();


// ========== remote/features/kuklaGuardian.js ==========
/**
 * ============================================================================
 * KUKLA GUARDIAN - Strażnik Kukli (Dragon Ball Auto-Fighter)
 * ============================================================================
 *
 * This module automatically fights dragon balls (kukle) every 30 seconds.
 * Goes to game_balls page and triggers fights for all available balls.
 *
 * Default state:
 * - ON for GAME.server == 20 && GAME.char_data.id == 2860
 * - OFF for everyone else
 *
 * ============================================================================
 */

(function () {
  'use strict';

  // Wait for GAME to be available
  if (typeof GAME === 'undefined') {
    console.log('[KuklaGuardian] GAME is undefined, skipping initialization');
    return;
  }

  /**
   * Delay helper
   * @param {number} ms
   * @returns {Promise}
   */
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Global state
  const KUKLA_GUARDIAN = {
    enabled: false,          // Toggle state (set dynamically based on server/char)
    running: false,          // Currently processing fights
    timer: null,             // Timeout reference
    loopInterval: 30000,     // 30 seconds between loops
    fightDelay: 2000,        // 2 seconds between fights
    pageLoadDelay: 1000,     // 1 second wait after page switch
    fightCount: 0,           // Total fights this session
    // Pause/resume combat modules during fights
    pauseDelay: 2000,        // 2s wait after pausing before fights
    _pausedModules: null,    // Snapshot of paused modules (null = not paused)
    _safetyTimer: null       // Safety timer to force resume after 120s
  };

  // Make it globally accessible
  window.KUKLA_GUARDIAN = KUKLA_GUARDIAN;

  /**
   * Check if this is the special user (default ON)
   * @returns {boolean}
   */
  function isSpecialUser() {
    // return GAME.server === 20 && GAME.char_data && GAME.char_data.id === 2860;
    false
  }

  /**
   * Get default enabled state based on server/char
   * @returns {boolean}
   */
  function getDefaultEnabled() {
    return isSpecialUser();
  }

  /**
   * Snapshot which combat modules (PVP, RESP) are active and pause them.
   * @returns {Object|null} snapshot or null if no combat modules are active
   */
  function snapshotAndPauseCombatModules() {
    const snapshot = {
      PVP: typeof PVP !== 'undefined' && PVP.stop === false,
      RESP: typeof RESP !== 'undefined' && RESP.stop === false
    };

    if (!snapshot.PVP && !snapshot.RESP) return null;

    if (snapshot.PVP) PVP.stop = true;
    if (snapshot.RESP) RESP.stop = true;

    console.log('[KuklaGuardian] Paused combat modules:', JSON.stringify(snapshot));
    return snapshot;
  }

  /**
   * Resume combat modules that were active before the pause.
   * @param {Object} snapshot - from snapshotAndPauseCombatModules()
   */
  function resumeCombatModules(snapshot) {
    if (!snapshot) return;

    if (snapshot.PVP && typeof PVP !== 'undefined' && typeof AFO_PVP !== 'undefined') {
      PVP.stop = false;
      PVP.caseNumber = 0;  // Reset to start of PVP cycle

      // Use setTimeout to guarantee loop restart even if race condition occurs
      // This gives GAME.is_loading time to synchronize and avoids immediate execution in undefined state
      window.setTimeout(() => {
        AFO_PVP.start();
      }, 100);

      console.log('[KuklaGuardian] Resumed PVP (with delayed start)');
    }

    if (snapshot.RESP && typeof RESP !== 'undefined' && typeof AFO_RESP !== 'undefined') {
      RESP.stop = false;
      RESP.loc = GAME.char_data.loc;  // Remember location for spawn calculations
      AFO_RESP.action();
      if (!RESP.reloadint) {
        RESP.reloadint = setInterval(() => AFO_RESP.reload_map(), 60000);
      }
      console.log('[KuklaGuardian] Resumed RESP');
    }
  }

  /**
   * Run one cycle of ball fighting
   */
  async function runOnce() {
    if (!KUKLA_GUARDIAN.running) return;

    try {
      console.log('[KuklaGuardian] Loading balls data (no page switch)');
      GAME.emitOrder({a: 33, type: 0});

      await delay(KUKLA_GUARDIAN.pageLoadDelay);

      const buttons = [...document.querySelectorAll('button.option[data-option="ball_fight"]')];

      console.log(`[KuklaGuardian] Found ${buttons.length} balls to fight`);

      if (buttons.length > 0) {
        // Pause PVP/RESP if active
        const snapshot = snapshotAndPauseCombatModules();
        KUKLA_GUARDIAN._pausedModules = snapshot;

        if (snapshot) {
          // Safety timer: auto-resume after 120s in case of total hang
          KUKLA_GUARDIAN._safetyTimer = setTimeout(() => {
            console.warn('[KuklaGuardian] Safety timer triggered! Force-resuming modules.');
            if (KUKLA_GUARDIAN._pausedModules) {
              resumeCombatModules(KUKLA_GUARDIAN._pausedModules);
              KUKLA_GUARDIAN._pausedModules = null;
            }
          }, 120000);

          // Wait for current actions to finish
          console.log(`[KuklaGuardian] Waiting ${KUKLA_GUARDIAN.pauseDelay}ms for modules to settle...`);
          await delay(KUKLA_GUARDIAN.pauseDelay);
        }

        // Fight all balls
        for (const btn of buttons) {
          if (!KUKLA_GUARDIAN.running) break;

          const ballId = btn.dataset.ball_id;
          const charId = btn.dataset.char_id;

          console.log(`[KuklaGuardian] emitOrder → ball=${ballId}, char=${charId}`);

          try {
            GAME.emitOrder({
              a: 33,
              type: 6,
              char_id: Number(charId),
              ball: Number(ballId)
            });
            KUKLA_GUARDIAN.fightCount++;
          } catch (e) {
            console.warn('[KuklaGuardian] emitOrder error:', e);
          }

          await delay(KUKLA_GUARDIAN.fightDelay);
        }

        // Resume paused modules
        if (KUKLA_GUARDIAN._pausedModules) {
          console.log('[KuklaGuardian] Fights complete, resuming modules...');
          resumeCombatModules(KUKLA_GUARDIAN._pausedModules);
          KUKLA_GUARDIAN._pausedModules = null;
        }
        if (KUKLA_GUARDIAN._safetyTimer) {
          clearTimeout(KUKLA_GUARDIAN._safetyTimer);
          KUKLA_GUARDIAN._safetyTimer = null;
        }
      }
    } catch (e) {
      console.error('[KuklaGuardian] runOnce error:', e);
    } finally {
      // Safety: resume modules even on error
      if (KUKLA_GUARDIAN._pausedModules) {
        console.log('[KuklaGuardian] Finally: resuming modules after error/stop');
        resumeCombatModules(KUKLA_GUARDIAN._pausedModules);
        KUKLA_GUARDIAN._pausedModules = null;
      }
      if (KUKLA_GUARDIAN._safetyTimer) {
        clearTimeout(KUKLA_GUARDIAN._safetyTimer);
        KUKLA_GUARDIAN._safetyTimer = null;
      }

      if (KUKLA_GUARDIAN.running) {
        KUKLA_GUARDIAN.timer = setTimeout(() => runOnce(), KUKLA_GUARDIAN.loopInterval);
      }
    }
  }

  /**
   * Start the guardian
   */
  function start() {
    if (KUKLA_GUARDIAN.running) {
      console.log('[KuklaGuardian] Already running');
      return;
    }

    KUKLA_GUARDIAN.running = true;
    KUKLA_GUARDIAN.enabled = true;
    console.log('[KuklaGuardian] START');
    runOnce();
  }

  /**
   * Stop the guardian
   */
  function stop() {
    KUKLA_GUARDIAN.running = false;
    KUKLA_GUARDIAN.enabled = false;
    if (KUKLA_GUARDIAN.timer) {
      clearTimeout(KUKLA_GUARDIAN.timer);
      KUKLA_GUARDIAN.timer = null;
    }

    // Resume any paused modules
    if (KUKLA_GUARDIAN._pausedModules) {
      console.log('[KuklaGuardian] Stop called while modules paused, resuming...');
      resumeCombatModules(KUKLA_GUARDIAN._pausedModules);
      KUKLA_GUARDIAN._pausedModules = null;
    }
    if (KUKLA_GUARDIAN._safetyTimer) {
      clearTimeout(KUKLA_GUARDIAN._safetyTimer);
      KUKLA_GUARDIAN._safetyTimer = null;
    }

    console.log('[KuklaGuardian] STOP');
  }

  // Expose start/stop methods
  KUKLA_GUARDIAN.start = start;
  KUKLA_GUARDIAN.stop = stop;

  /**
   * Initialize - wait for char_data and auto-start if enabled
   */
  async function init() {
    // Wait up to 30 seconds for char_data
    const maxWait = 30000;
    const checkInterval = 500;
    let waited = 0;

    while (!GAME.char_data && waited < maxWait) {
      await delay(checkInterval);
      waited += checkInterval;
    }

    if (!GAME.char_data) {
      console.log('[KuklaGuardian] char_data not available after 30s, skipping init');
      return;
    }

    // Set default enabled state based on server/char
    // Note: This may be overridden by state restore from stateManager
    const defaultEnabled = getDefaultEnabled();

    // Only auto-start if enabled is explicitly true (not restored yet)
    // The state manager will handle restore if needed
    if (KUKLA_GUARDIAN.enabled === false && defaultEnabled) {
      // Check if state was already restored (stateManager sets this)
      if (!KUKLA_GUARDIAN._stateRestored) {
        KUKLA_GUARDIAN.enabled = true;
        console.log(`[KuklaGuardian] Auto-enabled for special user (server=${GAME.server}, char=${GAME.char_data.id})`);
        start();
      }
    } else if (KUKLA_GUARDIAN.enabled === true) {
      // Already enabled (possibly by state restore), start if not running
      if (!KUKLA_GUARDIAN.running) {
        console.log('[KuklaGuardian] Starting (enabled=true)');
        start();
      }
    }

    console.log(`[KuklaGuardian] Initialized - enabled=${KUKLA_GUARDIAN.enabled}, isSpecialUser=${isSpecialUser()}`);
  }

  // Start initialization
  init();

})();


// ========== remote/features/exchangeHighlight.js ==========
/**
 * ============================================================================
 * EXCHANGE HIGHLIGHT - Podświetlanie posiadanych upominków w oknie wymian
 * ============================================================================
 *
 * When the exchange window (parseData case 18) opens, highlights items
 * that the player already owns as event gifts.
 *
 * Data source: game_events page (a:51) → parseData(62) → res.gift[]
 * Matching: data-sel on exchange button === res.gift[i].id
 *
 * ============================================================================
 */

(function () {
  'use strict';

  const EXCHANGE_HIGHLIGHT = {
    ownedGiftIds: new Set(),
    pendingHighlight: false,

    init() {
      this.injectCSS();
      this.hookParseData();
      console.log('[ExchangeHighlight] Initialized');
    },

    injectCSS() {
      const style = document.createElement('style');
      style.id = 'exchange-highlight-css';
      style.textContent = `
        .exchange_item.owned-item {
          background: rgba(76, 175, 80, 0.3) !important;
        }
      `;
      document.head.appendChild(style);
    },

    hookParseData() {
      if (!GAME.parseData) {
        console.warn('[ExchangeHighlight] GAME.parseData not found, retrying...');
        setTimeout(() => this.hookParseData(), 500);
        return;
      }

      const origPD = GAME.parseData.bind(GAME);
      const self = this;

      GAME.parseData = function (type, res) {
        origPD(type, res);

        // Cache owned event gifts from game_events page
        if (type === 62 && res.gift) {
          self.ownedGiftIds.clear();
          res.gift.forEach(g => self.ownedGiftIds.add(g.id));
          console.log('[ExchangeHighlight] Cached', self.ownedGiftIds.size, 'owned gifts');

          if (self.pendingHighlight) {
            self.pendingHighlight = false;
            self.highlightExchangeItems();
          }
        }

        // Exchange window opened → highlight owned items
        if (type === 18) {
          setTimeout(() => {
            self.highlightExchangeItems();
            // Request fresh event gifts data
            self.pendingHighlight = true;
            GAME.socket.emit('ga', { a: 51, type: 0 });
          }, 50);
        }
      };

      console.log('[ExchangeHighlight] Hooked into GAME.parseData');
    },

    highlightExchangeItems() {
      if (this.ownedGiftIds.size === 0) return;

      let count = 0;
      document.querySelectorAll('.exchange_item.main_ekw_item').forEach(el => {
        const btn = el.querySelector('button[data-sel]');
        if (!btn) return;
        const sel = parseInt(btn.getAttribute('data-sel'));
        if (this.ownedGiftIds.has(sel)) {
          el.classList.add('owned-item');
          count++;
        }
      });

      if (count > 0) {
        console.log('[ExchangeHighlight] Highlighted', count, 'owned items');
      }
    }
  };

  window.EXCHANGE_HIGHLIGHT = EXCHANGE_HIGHLIGHT;

  // Init when GAME is ready
  const check = setInterval(() => {
    if (typeof GAME !== 'undefined' && GAME.parseData && GAME.socket) {
      clearInterval(check);
      EXCHANGE_HIGHLIGHT.init();
    }
  }, 500);
})();


// ========== remote/features/traderAutoBuy.js ==========
/**
 * ============================================================================
 * TRADER AUTO-BUY - Auto Handlarz
 * ============================================================================
 *
 * Automatically buys items from Kosmiczny Handlarz (Space Trader).
 * Injects config UI into the trader section of game_events page.
 * Polls server aggressively (500ms) and buys via parseData(62) hook
 * for maximum speed advantage over manual clicking.
 *
 * Runs independently of AFO (always-on feature).
 *
 * ============================================================================
 */

(function () {
  'use strict';

  if (typeof GAME === 'undefined') {
    console.log('[TraderAuto] GAME is undefined, skipping initialization');
    return;
  }

  // ============================================
  // ITEMS DATABASE
  // ============================================

  const ITEMS_ZENI = [
    { id: 1784, name: 'Karta Dusz', gfx: '/gfx/items/0/226/1784.png' },
    { id: 1243, name: 'Senzu', gfx: '/gfx/items/0/35/1243.png' },
    { id: 1941, name: '30 KK', gfx: '/gfx/items/0/284/1941.png' },
    { id: 1934, name: 'Przyrost 100', gfx: '/gfx/items/5/282/1934.png' },
    { id: 1933, name: 'Przyrost 80', gfx: '/gfx/items/4/282/1933.png' },
    { id: 1932, name: 'Przyrost 60', gfx: '/gfx/items/3/282/1932.png' },
    { id: 1931, name: 'Przyrost 40', gfx: '/gfx/items/2/282/1931.png' },
    { id: 1930, name: 'Przyrost 20', gfx: '/gfx/items/1/282/1930.png' },
    { id: 1929, name: 'Max 5000', gfx: '/gfx/items/5/281/1929.png' },
    { id: 1928, name: 'Max 4000', gfx: '/gfx/items/4/281/1928.png' },
    { id: 1927, name: 'Max 3000', gfx: '/gfx/items/3/281/1927.png' },
    { id: 1926, name: 'Max 2000', gfx: '/gfx/items/2/281/1926.png' },
    { id: 1925, name: 'Max 1000', gfx: '/gfx/items/1/281/1925.png' },
    // { id: 1938, name: 'Sfera', gfx: '/gfx/items/0/000/1938.png' },
    // { id: 1937, name: 'Sfera', gfx: '/gfx/items/0/000/1937.png' },
    // { id: 1936, name: 'Sfera', gfx: '/gfx/items/0/000/1936.png' },
    { id: 1251, name: 'Kula Energii', gfx: '/gfx/items/0/55/1251.png' },
    { id: 1935, name: 'Tytuł', gfx: '/gfx/items/0/83/1935.png' },
  ];

  const ITEMS_TOKENS = [
    { id: 1790, name: '200% exp', gfx: '/gfx/items/0/230/1790.png' },
    { id: 1792, name: '5% PSK', gfx: '/gfx/items/0/232/1792.png' },
    { id: 1794, name: '5% Moc', gfx: '/gfx/items/0/234/1794.png' },
    { id: 1795, name: 'Limit Senzu', gfx: '/gfx/items/0/235/1795.png' },
    { id: 1796, name: '150k mPA', gfx: '/gfx/items/0/236/1796.png' },
  ];

  // ============================================
  // GLOBAL STATE
  // ============================================

  const TRADER_AUTO = {
    active: false,
    buying: false,
    configZeni: ITEMS_ZENI.map((item, i) => ({ id: item.id, enabled: false, priority: i })),
    configTokens: ITEMS_TOKENS.map((item, i) => ({ id: item.id, enabled: false, priority: i })),
    pollTimer: null,
    cooldownTimer: null,
    buyTimeout: null,
    pollInterval: 500,
    buyCooldown: 10500,
    traderActive: false,
    currentTokens: 0,
    currentZeni: 0,
    lastBuyItemId: null,
    lastBuyShop: null,
    lastGoods: null,
    lastGoods2: null,
    log: [],
  };

  window.TRADER_AUTO = TRADER_AUTO;

  // ============================================
  // HELPERS
  // ============================================

  function getItemName(id) {
    const zeni = ITEMS_ZENI.find(i => i.id === id);
    if (zeni) return zeni.name;
    const token = ITEMS_TOKENS.find(i => i.id === id);
    if (token) return token.name;
    return 'Item #' + id;
  }

  function addLog(msg) {
    const now = new Date();
    const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    TRADER_AUTO.log.push({ time, msg });
    if (TRADER_AUTO.log.length > 30) TRADER_AUTO.log.shift();
    updateLogUI();
    console.log('[TraderAuto] ' + msg);
  }

  function updateLogUI() {
    const logEl = document.getElementById('afo-trader-log');
    if (!logEl) return;
    const last5 = TRADER_AUTO.log.slice(-5);
    logEl.innerHTML = last5.map(l => '<div><span class="grey">' + l.time + '</span> ' + l.msg + '</div>').join('');
    logEl.scrollTop = logEl.scrollHeight;
  }

  // ============================================
  // CSS INJECTION
  // ============================================

  function injectCSS() {
    if (document.getElementById('afo-trader-css')) return;
    const style = document.createElement('style');
    style.id = 'afo-trader-css';
    style.textContent = `
      #afo-trader-panel {
        margin: 8px 0;
        padding: 8px;
        border: 1px solid #335;
        border-radius: 4px;
        background: rgba(0,0,0,0.3);
      }
      #afo-trader-panel .afo-trader-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      #afo-trader-panel .afo-trader-header b {
        color: #f90;
        font-size: 13px;
      }
      #afo-trader-toggle {
        padding: 4px 14px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-weight: bold;
        font-size: 12px;
        color: #fff;
        background: #2a7a2a;
      }
      #afo-trader-toggle.active {
        background: #a22;
      }
      .afo-trader-section-label {
        color: #aaa;
        font-size: 11px;
        margin: 4px 0 2px;
        border-bottom: 1px solid #333;
        padding-bottom: 2px;
      }
      .afo-trader-item {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 0;
        font-size: 12px;
      }
      .afo-trader-item img {
        width: 24px;
        height: 24px;
        vertical-align: middle;
      }
      .afo-trader-item input[type="checkbox"] {
        margin: 0;
        cursor: pointer;
      }
      .afo-trader-item .afo-trader-name {
        flex: 1;
        color: #ddd;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .afo-trader-item .afo-trader-arrows {
        display: flex;
        gap: 2px;
      }
      .afo-trader-item .afo-trader-arrows button {
        background: #444;
        border: 1px solid #555;
        color: #ccc;
        cursor: pointer;
        padding: 0 4px;
        font-size: 11px;
        line-height: 16px;
        border-radius: 2px;
        min-width: 20px;
      }
      .afo-trader-item .afo-trader-arrows button:hover {
        background: #555;
      }
      .afo-trader-item .afo-trader-arrows button:active {
        background: #666;
      }
      .afo-trader-item.disabled {
        opacity: 0.7 !important;
      }
      .afo-trader-item.disabled .afo-trader-name {
        color: #888;
        text-decoration: line-through;
      }
      #afo-trader-log {
        margin-top: 6px;
        padding: 4px;
        background: rgba(0,0,0,0.3);
        border-radius: 3px;
        font-size: 11px;
        max-height: 80px;
        overflow-y: auto;
        color: #bbb;
      }
      #afo-trader-log div {
        padding: 1px 0;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // UI INJECTION
  // ============================================

  function buildItemRow(itemDef, config, shopType) {
    const cfg = config.find(c => c.id === itemDef.id);
    const enabled = cfg ? cfg.enabled : false;
    const disabledClass = enabled ? '' : ' disabled';

    return '<div class="afo-trader-item' + disabledClass + '" data-id="' + itemDef.id + '" data-shop="' + shopType + '">' +
      '<input type="checkbox"' + (enabled ? ' checked' : '') + ' data-action="toggle" data-id="' + itemDef.id + '" data-shop="' + shopType + '" />' +
      '<img src="' + (itemDef.gfx || '/gfx/items/4/282/' + itemDef.id + '.png') + '" />' +
      '<span class="afo-trader-name">' + itemDef.name + '</span>' +
      '<span class="afo-trader-arrows">' +
      '<button data-action="up" data-id="' + itemDef.id + '" data-shop="' + shopType + '">&#9650;</button>' +
      '<button data-action="down" data-id="' + itemDef.id + '" data-shop="' + shopType + '">&#9660;</button>' +
      '</span>' +
      '</div>';
  }

  function getOrderedItems(itemsDb, config) {
    const sorted = [...config].sort((a, b) => a.priority - b.priority);
    return sorted.map(cfg => {
      const def = itemsDb.find(i => i.id === cfg.id);
      return def || { id: cfg.id, name: 'Item #' + cfg.id };
    });
  }

  function injectTraderUI() {
    if (document.getElementById('afo-trader-panel')) return;

    const eventsPage = document.getElementById('page_game_events');
    if (!eventsPage) return;

    const content = eventsPage.querySelector('.content');
    if (!content) return;

    // Find the trader blueBg section (last one, or the one containing "Kosmiczny Handlarz")
    const blueBgs = content.querySelectorAll('.blueBg');
    let traderBg = null;
    for (let i = 0; i < blueBgs.length; i++) {
      const h3 = blueBgs[i].querySelector('h3');
      if (h3 && h3.textContent.includes('Handlarz')) {
        traderBg = blueBgs[i];
        break;
      }
    }
    if (!traderBg) return;

    const h3 = traderBg.querySelector('h3');
    if (!h3) return;

    // Build zeni items list
    const orderedZeni = getOrderedItems(ITEMS_ZENI, TRADER_AUTO.configZeni);
    let zeniHtml = orderedZeni.map(item => buildItemRow(item, TRADER_AUTO.configZeni, 'zeni')).join('');

    // Build token items list
    const orderedTokens = getOrderedItems(ITEMS_TOKENS, TRADER_AUTO.configTokens);
    let tokensHtml = orderedTokens.map(item => buildItemRow(item, TRADER_AUTO.configTokens, 'tokens')).join('');

    const btnText = TRADER_AUTO.active ? '&#9632; Stop' : '&#9654; Start';
    const btnClass = TRADER_AUTO.active ? ' active' : '';

    const panel = document.createElement('div');
    panel.id = 'afo-trader-panel';
    panel.innerHTML =
      '<div class="afo-trader-header">' +
      '<b>Auto Handlarz</b>' +
      '<button id="afo-trader-toggle" class="' + btnClass + '">' + btnText + '</button>' +
      '</div>' +
      '<div class="afo-trader-section-label">Za Zeni:</div>' +
      '<div id="afo-trader-list-zeni">' + zeniHtml + '</div>' +
      '<div class="afo-trader-section-label">Za Tokeny:</div>' +
      '<div id="afo-trader-list-tokens">' + tokensHtml + '</div>' +
      '<div id="afo-trader-log"></div>';

    h3.insertAdjacentElement('afterend', panel);

    // Bind events
    bindPanelEvents();
    updateLogUI();
  }

  function bindPanelEvents() {
    const panel = document.getElementById('afo-trader-panel');
    if (!panel) return;

    // Start/Stop button
    const toggleBtn = document.getElementById('afo-trader-toggle');
    if (toggleBtn) {
      toggleBtn.onclick = function () {
        if (TRADER_AUTO.active) {
          stopAutoBuy();
        } else {
          startAutoBuy();
        }
      };
    }

    // Delegate click events on panel
    panel.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action]');
      if (btn) {
        const action = btn.getAttribute('data-action');
        const id = parseInt(btn.getAttribute('data-id'));
        const shop = btn.getAttribute('data-shop');
        if (action === 'up') moveItem(id, shop, -1);
        if (action === 'down') moveItem(id, shop, 1);
        return;
      }

      const cb = e.target.closest('input[data-action="toggle"]');
      if (cb) {
        const id = parseInt(cb.getAttribute('data-id'));
        const shop = cb.getAttribute('data-shop');
        toggleItem(id, shop, cb.checked);
      }
    });
  }

  function toggleItem(id, shop, enabled) {
    const config = shop === 'zeni' ? TRADER_AUTO.configZeni : TRADER_AUTO.configTokens;
    const item = config.find(c => c.id === id);
    if (item) item.enabled = enabled;

    // Update visual
    const row = document.querySelector('.afo-trader-item[data-id="' + id + '"][data-shop="' + shop + '"]');
    if (row) {
      row.classList.toggle('disabled', !enabled);
    }
  }

  function moveItem(id, shop, direction) {
    const config = shop === 'zeni' ? TRADER_AUTO.configZeni : TRADER_AUTO.configTokens;
    const itemsDb = shop === 'zeni' ? ITEMS_ZENI : ITEMS_TOKENS;
    const sorted = [...config].sort((a, b) => a.priority - b.priority);
    const idx = sorted.findIndex(c => c.id === id);
    if (idx < 0) return;

    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    // Swap priorities
    const tmpPriority = sorted[idx].priority;
    sorted[idx].priority = sorted[targetIdx].priority;
    sorted[targetIdx].priority = tmpPriority;

    // Re-render the list
    const listId = shop === 'zeni' ? 'afo-trader-list-zeni' : 'afo-trader-list-tokens';
    const listEl = document.getElementById(listId);
    if (!listEl) return;

    const ordered = getOrderedItems(itemsDb, config);
    listEl.innerHTML = ordered.map(item => buildItemRow(item, config, shop)).join('');
  }

  function updateToggleButton() {
    const btn = document.getElementById('afo-trader-toggle');
    if (!btn) return;
    if (TRADER_AUTO.active) {
      btn.innerHTML = '&#9632; Stop';
      btn.classList.add('active');
    } else {
      btn.innerHTML = '&#9654; Start';
      btn.classList.remove('active');
    }
  }

  // ============================================
  // POLLING
  // ============================================

  function startAutoBuy() {
    if (TRADER_AUTO.active) return;
    TRADER_AUTO.active = true;
    TRADER_AUTO.buying = false;
    TRADER_AUTO.lastBuyItemId = null;
    TRADER_AUTO.lastBuyShop = null;
    updateToggleButton();
    addLog('Uruchomiono - polling co ' + TRADER_AUTO.pollInterval + 'ms');
    poll();
    TRADER_AUTO.pollTimer = setInterval(poll, TRADER_AUTO.pollInterval);
  }

  function stopAutoBuy() {
    TRADER_AUTO.active = false;
    TRADER_AUTO.buying = false;
    if (TRADER_AUTO.pollTimer) {
      clearInterval(TRADER_AUTO.pollTimer);
      TRADER_AUTO.pollTimer = null;
    }
    if (TRADER_AUTO.cooldownTimer) {
      clearTimeout(TRADER_AUTO.cooldownTimer);
      TRADER_AUTO.cooldownTimer = null;
    }
    if (TRADER_AUTO.buyTimeout) {
      clearTimeout(TRADER_AUTO.buyTimeout);
      TRADER_AUTO.buyTimeout = null;
    }
    TRADER_AUTO.lastBuyItemId = null;
    TRADER_AUTO.lastBuyShop = null;
    updateToggleButton();
    addLog('Zatrzymano');
  }

  function poll() {
    if (!TRADER_AUTO.active) return;
    if (TRADER_AUTO.buying) return;
    GAME.socket.emit('ga', { a: 51, type: 0 });
  }

  // ============================================
  // TRADER DATA HANDLER (parseData(62) hook)
  // ============================================

  function onTraderData(res) {
    if (!TRADER_AUTO.active) return;

    // Update currencies
    if (res.hasOwnProperty('tokens')) TRADER_AUTO.currentTokens = res.tokens;
    if (res.hasOwnProperty('zeni')) TRADER_AUTO.currentZeni = res.zeni;

    // Update trader status
    if (res.hasOwnProperty('trader')) {
      TRADER_AUTO.traderActive = !!res.trader.status;
      if (res.trader.goods) TRADER_AUTO.lastGoods = res.trader.goods;
      if (res.trader.goods2) TRADER_AUTO.lastGoods2 = res.trader.goods2;
    }

    if (!TRADER_AUTO.traderActive) return;

    // Check if we just attempted a buy
    if (TRADER_AUTO.lastBuyItemId !== null) {
      handleBuyResponse(res);
      return;
    }

    // Not in buy flow - try to buy next
    if (!TRADER_AUTO.buying) {
      tryBuyNext();
    }
  }

  function handleBuyResponse(res) {
    const buyId = TRADER_AUTO.lastBuyItemId;
    const buyShop = TRADER_AUTO.lastBuyShop;
    TRADER_AUTO.lastBuyItemId = null;
    TRADER_AUTO.lastBuyShop = null;
    if (TRADER_AUTO.buyTimeout) {
      clearTimeout(TRADER_AUTO.buyTimeout);
      TRADER_AUTO.buyTimeout = null;
    }

    const goods = buyShop === 'zeni' ? TRADER_AUTO.lastGoods2 : TRADER_AUTO.lastGoods;
    if (!goods) {
      // No goods data - assume success
      addLog('<span class="green">Kupiono: ' + getItemName(buyId) + '!</span>');
      startCooldown();
      return;
    }

    // Find the item we tried to buy
    const boughtItem = goods.find(g => g.item === buyId);

    if (!boughtItem) {
      // Item gone from list - likely bought successfully
      addLog('<span class="green">Kupiono: ' + getItemName(buyId) + '!</span>');
      startCooldown();
      return;
    }

    if (boughtItem.bought_by) {
      // Someone bought it - check if it was us
      const myNick = GAME.char_data ? GAME.char_data.login : '';
      if (boughtItem.bought_by === myNick) {
        addLog('<span class="green">Kupiono: ' + getItemName(buyId) + '!</span>');
        startCooldown();
      } else {
        addLog('<span class="orange">' + getItemName(buyId) + ' - kupione przez ' + boughtItem.bought_by + '!</span>');
        // No cooldown - try next immediately
        tryBuyNext();
      }
      return;
    }

    // Item still available and not bought - maybe buy failed (cooldown?), retry after short delay
    addLog('Ponawiam próbę zakupu: ' + getItemName(buyId));
    setTimeout(() => {
      if (TRADER_AUTO.active && !TRADER_AUTO.buying) {
        tryBuyNext();
      }
    }, 1000);
  }

  function startCooldown() {
    TRADER_AUTO.buying = true;
    // Pause polling during cooldown
    if (TRADER_AUTO.pollTimer) {
      clearInterval(TRADER_AUTO.pollTimer);
      TRADER_AUTO.pollTimer = null;
    }

    let remaining = Math.ceil(TRADER_AUTO.buyCooldown / 1000);
    addLog('Cooldown ' + remaining + 's...');

    TRADER_AUTO.cooldownTimer = setTimeout(() => {
      TRADER_AUTO.buying = false;
      TRADER_AUTO.cooldownTimer = null;
      if (TRADER_AUTO.active) {
        addLog('Cooldown zakończony, wznawiam');
        poll();
        TRADER_AUTO.pollTimer = setInterval(poll, TRADER_AUTO.pollInterval);
      }
    }, TRADER_AUTO.buyCooldown);
  }

  // ============================================
  // BUY LOGIC
  // ============================================

  function tryBuyNext() {
    if (!TRADER_AUTO.active || TRADER_AUTO.buying) return;

    const candidates = collectAvailableItems();
    if (candidates.length === 0) {
      addLog('Brak przedmiotów do kupienia');
      stopAutoBuy();
      return;
    }

    const best = candidates[0];
    buyItem(best);
  }

  function collectAvailableItems() {
    const results = [];
    const reborn = GAME.char_data ? (GAME.char_data.reborn || 0) : 0;

    // Collect from goods2 (Zeni)
    if (reborn >= 5 && TRADER_AUTO.lastGoods2) {
      for (const good of TRADER_AUTO.lastGoods2) {
        if (good.bought_by) continue;
        const cfg = TRADER_AUTO.configZeni.find(c => c.id === good.item);
        if (!cfg || !cfg.enabled) continue;
        if (TRADER_AUTO.currentZeni < good.ze) continue;
        results.push({
          shop: 'zeni',
          type: 3,
          index: TRADER_AUTO.lastGoods2.indexOf(good),
          id: good.item,
          amount: good.amount,
          cost: good.ze,
          priority: cfg.priority,
          shopOrder: 0, // zeni first
        });
      }
    }

    // Collect from goods (Tokens)
    if (TRADER_AUTO.lastGoods) {
      for (const good of TRADER_AUTO.lastGoods) {
        if (good.bought_by) continue;
        const cfg = TRADER_AUTO.configTokens.find(c => c.id === good.item);
        if (!cfg || !cfg.enabled) continue;
        if (TRADER_AUTO.currentTokens < good.dt) continue;
        results.push({
          shop: 'tokens',
          type: 2,
          index: TRADER_AUTO.lastGoods.indexOf(good),
          id: good.item,
          amount: good.amount,
          cost: good.dt,
          priority: cfg.priority,
          shopOrder: reborn >= 5 ? 1 : 0, // tokens second if reborn>=5
        });
      }
    }

    // Sort: shopOrder first, then priority, then highest amount first (same item, bigger stack = better)
    results.sort((a, b) => {
      if (a.shopOrder !== b.shopOrder) return a.shopOrder - b.shopOrder;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.amount - a.amount;
    });

    return results;
  }

  function buyItem(item) {
    // Pause polling while waiting for buy response
    if (TRADER_AUTO.pollTimer) {
      clearInterval(TRADER_AUTO.pollTimer);
      TRADER_AUTO.pollTimer = null;
    }

    TRADER_AUTO.lastBuyItemId = item.id;
    TRADER_AUTO.lastBuyShop = item.shop;

    addLog('Kupuję: <span class="green">' + getItemName(item.id) + '</span>...');

    GAME.socket.emit('ga', {
      a: 51,
      type: item.type,
      item: item.index,
      iid: item.id,
      am: item.amount,
    });

    // Safety timeout - if no parseData(62) response within 5s, resume polling
    TRADER_AUTO.buyTimeout = setTimeout(() => {
      if (TRADER_AUTO.lastBuyItemId !== null) {
        addLog('<span class="orange">Brak odpowiedzi serwera, wznawiam polling</span>');
        TRADER_AUTO.lastBuyItemId = null;
        TRADER_AUTO.lastBuyShop = null;
        if (TRADER_AUTO.active && !TRADER_AUTO.buying) {
          poll();
          TRADER_AUTO.pollTimer = setInterval(poll, TRADER_AUTO.pollInterval);
        }
      }
    }, 5000);
  }

  // ============================================
  // HOOKS
  // ============================================

  function hookParseData() {
    if (!GAME.parseData) {
      console.log('[TraderAuto] GAME.parseData not found, retrying...');
      return false;
    }

    const originalParseData = GAME.parseData.bind(GAME);
    GAME.parseData = function (type, res) {
      originalParseData(type, res);
      if (type === 62) {
        onTraderData(res);
      }
    };

    console.log('[TraderAuto] Hooked into GAME.parseData');
    return true;
  }

  function hookPageSwitch() {
    if (!GAME.page_switch) {
      console.log('[TraderAuto] GAME.page_switch not found');
      return false;
    }

    const origPageSwitch = GAME.page_switch.bind(GAME);
    GAME.page_switch = function (page, arg) {
      origPageSwitch(page, arg);
      if (page === 'game_events') {
        setTimeout(injectTraderUI, 200);
        setTimeout(injectTraderUI, 600);
      }
    };

    console.log('[TraderAuto] Hooked into GAME.page_switch');
    return true;
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    injectCSS();
    hookPageSwitch();
    hookParseData();

    // If already on events page, inject now
    const eventsPage = document.getElementById('page_game_events');
    if (eventsPage && eventsPage.offsetParent !== null) {
      setTimeout(injectTraderUI, 300);
    }

    console.log('[TraderAuto] Initialized');
  }

  // Wait for GAME.char_data
  let initAttempts = 0;
  const maxAttempts = 120; // 60 seconds

  const initCheck = setInterval(() => {
    initAttempts++;
    if (initAttempts > maxAttempts) {
      clearInterval(initCheck);
      console.log('[TraderAuto] Timeout waiting for GAME.char_data');
      return;
    }
    if (GAME.char_data && GAME.socket) {
      clearInterval(initCheck);
      init();
    }
  }, 500);
})();


// ========== remote/features/trainBlessings.js ==========
/**
 * ============================================================================
 * Train Blessings Quick-Use Module (Standalone)
 * ============================================================================
 *
 * Wstrzykuje sekcję "Blessy" z przyciskami na stronę treningu (#page_game_train).
 * Każdy przycisk używa błogosławieństwa i wyświetla timer aktywnego buffa.
 * Działa standalone, bez zależności od AFO.
 *
 * Flow użycia blessa wzorowany na respawn.js:check_bless (linie 267-284).
 *
 * ============================================================================
 */

(function () {
  'use strict';

  const waitForGame = setInterval(() => {
    if (typeof GAME !== 'undefined' && GAME.char_data && GAME.char_id) {
      clearInterval(waitForGame);
      initTrainBlessings();
    }
  }, 100);

  function initTrainBlessings() {

    // ============================================
    // CONFIG
    // ============================================

    const BLESSINGS = [
      { label: '250% Tren', baseItemId: 1629, buffId: 54, page: 10 },
      { label: '5% Kod', baseItemId: 1751, buffId: 80, page: 10 },
      { label: '5% Rezultat', baseItemId: 2231, buffId: 110, page: 10 },
      { label: 'x3 Rate', baseItemId: 1707, buffId: 201, page: 1 }
    ];

    // x3 Rate fallback pages — if not found on page 1, try these emit combos
    const RATE_FALLBACKS = [
      { page: 10, page2: 1 },
      { page: 10, page2: 1, page3: 2 }
    ];

    // ============================================
    // CSS
    // ============================================

    function injectCSS() {
      if (document.getElementById('afo_train_bless_css')) return;

      const style = document.createElement('style');
      style.id = 'afo_train_bless_css';
      style.textContent = `
        #afo_train_bless_section {
          margin-bottom: 10px;
        }
        #afo_train_bless_section h1 {
          margin-bottom: 6px;
        }
        .afo-bless-btns {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .afo-bless-btn {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          min-width: 90px;
          padding: 5px 10px;
          cursor: pointer;
          text-align: center;
          line-height: 1.3;
          height: 35px;
        }
        .afo-bless-btn .bless-label {
          font-weight: bold;
        }
        .afo-bless-btn .bless-timer {
          font-size: 0.85em;
          color: #888;
        }
        .afo-bless-btn .bless-timer.active {
          color: #5c5;
        }
        .afo-bless-btn.bless-no-item {
          opacity: 0.5;
        }
      `;
      document.head.appendChild(style);
    }

    // ============================================
    // UI INJECTION
    // ============================================

    function injectUI() {
      const trainUpgrade = document.getElementById('train_upgrade');
      if (!trainUpgrade) return;
      if (document.getElementById('afo_train_bless_section')) return;

      const section = document.createElement('div');
      section.id = 'afo_train_bless_section';

      const heading = document.createElement('h1');
      heading.textContent = 'Blessy';
      section.appendChild(heading);

      const btnsContainer = document.createElement('div');
      btnsContainer.className = 'afo-bless-btns';

      for (const bless of BLESSINGS) {
        const btn = document.createElement('button');
        btn.className = 'big_button option afo-bless-btn';
        btn.dataset.baseItemId = bless.baseItemId;
        btn.dataset.buffId = bless.buffId;

        const labelSpan = document.createElement('span');
        labelSpan.className = 'bless-label';
        labelSpan.textContent = bless.label;

        const timerSpan = document.createElement('span');
        timerSpan.className = 'bless-timer';
        timerSpan.textContent = 'Nieaktywny';

        btn.appendChild(labelSpan);
        btn.appendChild(timerSpan);

        btn.addEventListener('click', () => {
          useBless(bless.baseItemId, bless.buffId, btn);
        });

        btnsContainer.appendChild(btn);
      }

      section.appendChild(btnsContainer);
      trainUpgrade.parentNode.insertBefore(section, trainUpgrade);
    }

    // ============================================
    // REFRESH TIMERS
    // ============================================

    function refreshTimers() {
      const btns = document.querySelectorAll('.afo-bless-btn');
      for (const btn of btns) {
        const buffId = btn.dataset.buffId;
        const timerSpan = btn.querySelector('.bless-timer');
        if (!timerSpan) continue;

        const buffEl = $(`#char_buffs`).find(`[data-buff=${buffId}]`);
        if (buffEl.length === 1) {
          const timerText = buffEl.find('.timer').text();
          timerSpan.textContent = timerText || 'Aktywny';
          timerSpan.classList.add('active');
        } else {
          timerSpan.textContent = 'Nieaktywny';
          timerSpan.classList.remove('active');
        }
      }
    }

    // ============================================
    // USE BLESSING (wzorzec z respawn.js:check_bless)
    // ============================================

    function useBless(baseItemId, buffId, btnElement, fallbackIdx) {
      // Find blessing config
      const bless = BLESSINGS.find(b => b.baseItemId === baseItemId);
      const targetPage = bless ? bless.page : 10;
      fallbackIdx = fallbackIdx || 0;

      // Krok 1: Upewnij się że ekw jest na właściwej stronie (respawn.js:267-270)
      if (GAME.ekw_page != targetPage) {
        GAME.ekw_page = targetPage;
        GAME.socket.emit('ga', { a: 12, page: targetPage, used: 1 });
        setTimeout(() => useBless(baseItemId, buffId, btnElement, fallbackIdx), 600);
        return;
      }

      // Krok 2: Znajdź item po base_item_id (respawn.js:276)
      let itemId = $(`#ekw_page_items`).find(`div[data-base_item_id=${baseItemId}]`).attr('data-item_id');

      // x3 Rate fallback — try alternate page combos if item not found
      if (!itemId && bless && bless.page === 1 && fallbackIdx < RATE_FALLBACKS.length) {
        const fb = RATE_FALLBACKS[fallbackIdx];
        GAME.ekw_page = fb.page;
        GAME.socket.emit('ga', { a: 12, page: fb.page, used: 1, page2: fb.page2, ...(fb.page3 !== undefined && { page3: fb.page3 }) });
        setTimeout(() => useBless(baseItemId, buffId, btnElement, fallbackIdx + 1), 600);
        return;
      }

      if (!itemId) {
        // Brak itema w ekwipunku
        const label = btnElement.querySelector('.bless-label');
        const origText = label.textContent;
        label.textContent = 'Brak!';
        btnElement.classList.add('bless-no-item');
        setTimeout(() => {
          label.textContent = origText;
          btnElement.classList.remove('bless-no-item');
        }, 1500);
        return;
      }

      // Krok 3: Użyj blessa (respawn.js:283)
      GAME.socket.emit('ga', { a: 12, type: 14, iid: parseInt(itemId), page: GAME.ekw_page });

      // Odśwież timery po chwili (daj czas na response serwera)
      setTimeout(() => refreshTimers(), 1000);
    }

    // ============================================
    // HOOK page_switch (wzorzec z activitiesExecutor.js / traderAutoBuy.js)
    // ============================================

    function hookPageSwitch() {
      if (!GAME.page_switch) {
        console.log('[TrainBless] GAME.page_switch not found');
        return false;
      }

      const origPageSwitch = GAME.page_switch.bind(GAME);

      GAME.page_switch = function (page, arg) {
        origPageSwitch(page, arg);

        if (page === 'game_train') {
          setTimeout(() => {
            injectUI();
            refreshTimers();
          }, 150);
        }
      };

      console.log('[TrainBless] Hooked into GAME.page_switch');
      return true;
    }

    // ============================================
    // INIT
    // ============================================

    injectCSS();
    hookPageSwitch();

    // If already on train page, inject immediately
    if ($('#page_game_train').is(':visible')) {
      setTimeout(() => {
        injectUI();
        refreshTimers();
      }, 150);
    }

    console.log('[TrainBless] Module initialized');
  }
})();


// ========== remote/afo/campStats.js ==========
/**
 * ============================================================================
 * AFO - Camp Stats (Statystyki Wypraw) - Self-Initializing Version
 * ============================================================================
 *
 * Tracks expedition results: value per icon type, items found.
 * Shows session stats and total stats below camp history.
 * Uses MutationObserver on #own_camps to detect new expedition results.
 * Watches for character switches and reloads data accordingly.
 *
 * Features:
 * - Self-initializing (no dependency on AFO.init())
 * - Async storage via AFO_STORAGE (works with Chrome extension & Tauri client)
 * - Silent migration from localStorage (old data preserved as backup)
 * - Export/Import with 3 modes: Replace, Add, Add Difference
 *
 * ============================================================================
 */

(function () {
  'use strict';

  if (typeof GAME === 'undefined') {
    console.log('[CampStats] GAME is undefined, skipping initialization');
    return;
  }

  // ============================================
  // STATE
  // ============================================

  const CAMP_STATS = {
    // Stats structure: { expeditions, values: { "a9": total }, items: { id: {count, src} } }
    session: { expeditions: 0, values: {}, items: {} },
    total: { expeditions: 0, values: {}, items: {} },

    observer: null,
    lastFirstChild: null,
    storageKey: null,
    uiInjected: false,
    retryCount: 0,
    currentCharId: null,
    charWatchInterval: null,
    initialized: false, // true after first #own_camps population is seen

    EXPORT_VERSION: 1
  };

  // Global references
  window.CAMP_STATS = CAMP_STATS;
  window.AFO_CAMP_STATS = CAMP_STATS; // Alias for compatibility

  // ============================================
  // STORAGE KEY
  // ============================================

  function buildStorageKey() {
    const server = GAME.server || 0;
    const charId = GAME.char_id || 0;
    CAMP_STATS.storageKey = `camp_stats_s${server}_c${charId}`;
  }

  // ============================================
  // PERSISTENCE (Async AFO_STORAGE)
  // ============================================

  function applyData(data) {
    CAMP_STATS.total.expeditions = data.expeditions || 0;
    CAMP_STATS.total.values = data.values || {};
    CAMP_STATS.total.items = data.items || {};
  }

  async function loadTotal() {
    try {
      // 1. Try AFO_STORAGE first (new format)
      const stored = await AFO_STORAGE.get(CAMP_STATS.storageKey);
      if (stored && stored[CAMP_STATS.storageKey]) {
        applyData(stored[CAMP_STATS.storageKey]);
        console.log('[CampStats] Loaded from AFO_STORAGE');
        return;
      }

      // 2. Fallback: check localStorage (old data)
      const oldKey = `afo_camp_stats_s${GAME.server}_c${GAME.char_id}`;
      const old = localStorage.getItem(oldKey);
      if (old) {
        const data = JSON.parse(old);
        applyData(data);
        // Migrate to AFO_STORAGE
        await saveTotal();
        console.log('[CampStats] Migrated data from localStorage to AFO_STORAGE');
        // NOTE: We do NOT remove localStorage - it stays as backup
      }
    } catch (e) {
      console.warn('[CampStats] Failed to load stats:', e);
    }
  }

  async function saveTotal() {
    try {
      await AFO_STORAGE.set({
        [CAMP_STATS.storageKey]: {
          expeditions: CAMP_STATS.total.expeditions,
          values: CAMP_STATS.total.values,
          items: CAMP_STATS.total.items
        }
      });
    } catch (e) {
      console.warn('[CampStats] Failed to save stats:', e);
    }
  }

  // ============================================
  // CHARACTER SWITCH DETECTION
  // ============================================

  function watchCharSwitch() {
    if (CAMP_STATS.charWatchInterval) clearInterval(CAMP_STATS.charWatchInterval);
    CAMP_STATS.charWatchInterval = setInterval(() => {
      if (GAME.char_id && GAME.char_id !== CAMP_STATS.currentCharId) {
        console.log('[CampStats] Character changed:', CAMP_STATS.currentCharId, '->', GAME.char_id);
        onCharSwitch();
      }
    }, 5000);
  }

  async function onCharSwitch() {
    CAMP_STATS.currentCharId = GAME.char_id;
    buildStorageKey();
    CAMP_STATS.session = { expeditions: 0, values: {}, items: {} };
    CAMP_STATS.total = { expeditions: 0, values: {}, items: {} };
    await loadTotal();
    CAMP_STATS.lastFirstChild = null;
    CAMP_STATS.initialized = false;
    render();
  }

  // ============================================
  // PARSING
  // ============================================

  function parseCampEntry(el) {
    if (!el || !el.classList || !el.classList.contains('single_camp')) return null;

    const result = { value: 0, icoClass: '', items: [] };

    // Extract value + icon class
    const div = el.querySelector('div');
    if (div) {
      const icoEl = div.querySelector('i.ico');
      if (icoEl) {
        const classes = Array.from(icoEl.classList).filter(c => c !== 'ico');
        result.icoClass = classes[0] || 'unknown';

        if (icoEl.previousSibling && icoEl.previousSibling.nodeType === 3) {
          const raw = icoEl.previousSibling.textContent.replace(/\s/g, '');
          const num = parseInt(raw, 10);
          if (!isNaN(num)) result.value = num;
        }
      }
    }

    // Extract items
    const slots = el.querySelectorAll('.ekw_slot.main_ekw_item');
    slots.forEach(slot => {
      const itemId = slot.getAttribute('data-item_id');
      const img = slot.querySelector('img');
      if (itemId && img) {
        result.items.push({
          id: itemId,
          src: img.getAttribute('src')
        });
      }
    });

    return result;
  }

  // ============================================
  // TRACKING
  // ============================================

  function addToStats(stats, data) {
    stats.expeditions++;
    if (data.icoClass && data.value) {
      stats.values[data.icoClass] = (stats.values[data.icoClass] || 0) + data.value;
    }
    data.items.forEach(item => {
      if (!stats.items[item.id]) {
        stats.items[item.id] = { count: 0, src: item.src };
      }
      stats.items[item.id].count++;
    });
  }

  function recordExpedition(data) {
    if (!data) return;
    addToStats(CAMP_STATS.session, data);
    addToStats(CAMP_STATS.total, data);
    saveTotal(); // Fire-and-forget async save
    render();
  }

  // ============================================
  // OBSERVER
  // ============================================

  function startObserver() {
    const ownCamps = document.getElementById('own_camps');
    if (!ownCamps) {
      setTimeout(startObserver, 3000);
      return;
    }

    // Snapshot current state
    if (ownCamps.firstElementChild) {
      CAMP_STATS.lastFirstChild = ownCamps.firstElementChild.innerHTML;
      CAMP_STATS.initialized = true;
    }

    CAMP_STATS.observer = new MutationObserver(() => {
      if (!CAMP_STATS.uiInjected) tryInjectUI();

      const first = ownCamps.firstElementChild;
      if (!first) return;

      if (!CAMP_STATS.initialized) {
        CAMP_STATS.lastFirstChild = first.innerHTML;
        CAMP_STATS.initialized = true;
        console.log('[CampStats] Initial population snapshot taken');
        return;
      }

      if (first.innerHTML !== CAMP_STATS.lastFirstChild) {
        CAMP_STATS.lastFirstChild = first.innerHTML;
        const data = parseCampEntry(first);
        if (data) {
          console.log('[CampStats] New expedition:', data);
          recordExpedition(data);
        }
      }
    });

    CAMP_STATS.observer.observe(ownCamps, { childList: true, subtree: true });
    console.log('[CampStats] Observer started');
  }

  // ============================================
  // EXPORT / IMPORT
  // ============================================

  function exportStats() {
    const exportData = {
      version: CAMP_STATS.EXPORT_VERSION,
      server: GAME.server,
      charId: GAME.char_id,
      charName: GAME.char_data?.name || 'unknown',
      timestamp: Date.now(),
      data: {
        expeditions: CAMP_STATS.total.expeditions,
        values: { ...CAMP_STATS.total.values },
        items: { ...CAMP_STATS.total.items }
      }
    };

    const json = JSON.stringify(exportData, null, 2);
    const filename = `camp_stats_s${GAME.server}_${GAME.char_data?.name || GAME.char_id}_${Date.now()}.json`;

    // Always show modal with download/copy options
    showExportModal(json, filename);
  }

  function showExportModal(json, filename) {
    // Remove existing modal
    const existing = document.getElementById('afo_cs_export_modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'afo_cs_export_modal';
    modal.className = 'afo_modal_overlay';
    modal.innerHTML = `
      <div class="afo_modal">
        <div class="afo_modal_header">
          <b>Eksport statystyk</b>
          <span class="afo_modal_close" id="afo_cs_export_close">&times;</span>
        </div>
        <div class="afo_modal_body">
          <div class="afo_cs_import_info">
            Zapisz lub skopiuj poniższy JSON:<br>
            <code style="color:#4a9; font-size:11px;">${filename}</code>
          </div>
          <textarea id="afo_cs_export_text" readonly rows="12" style="width:100%; box-sizing:border-box; background:#0a1520; color:#ccc; border:1px solid #305779; border-radius:4px; padding:6px; font-family:monospace; font-size:10px; resize:vertical;"></textarea>
        </div>
        <div class="afo_modal_footer">
          <button id="afo_cs_export_download" class="afo_btn_green">Pobierz plik</button>
          <button id="afo_cs_export_copy" class="afo_btn_green">Kopiuj</button>
          <button id="afo_cs_export_cancel" class="afo_btn_gray">Zamknij</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Set raw JSON value
    document.getElementById('afo_cs_export_text').value = json;

    // Close handlers
    const closeModal = () => modal.remove();
    document.getElementById('afo_cs_export_close').addEventListener('click', closeModal);
    document.getElementById('afo_cs_export_cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Download handler
    document.getElementById('afo_cs_export_download').addEventListener('click', () => {
      try {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('[CampStats] Download triggered from modal');
      } catch (e) {
        alert('Pobieranie nie działa w tej przeglądarce. Użyj przycisku Kopiuj.');
      }
    });

    // Copy handler
    document.getElementById('afo_cs_export_copy').addEventListener('click', () => {
      const textarea = document.getElementById('afo_cs_export_text');
      textarea.select();
      textarea.setSelectionRange(0, 99999); // For mobile
      navigator.clipboard.writeText(json).then(() => {
        alert('Skopiowano do schowka!');
      }).catch(() => {
        alert('Nie udało się skopiować. Zaznacz tekst ręcznie i skopiuj.');
      });
    });

    console.log('[CampStats] Showing export modal');
  }

  function validateImportData(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Nieprawidłowy format JSON' };
    }

    if (!data.version || data.version > CAMP_STATS.EXPORT_VERSION) {
      return { valid: false, error: `Nieobsługiwana wersja: ${data.version}` };
    }

    if (!data.data || typeof data.data !== 'object') {
      return { valid: false, error: 'Brak danych statystyk' };
    }

    const d = data.data;
    if (typeof d.expeditions !== 'number' || d.expeditions < 0) {
      return { valid: false, error: 'Nieprawidłowa liczba wypraw' };
    }

    if (d.values && typeof d.values !== 'object') {
      return { valid: false, error: 'Nieprawidłowy format values' };
    }

    if (d.items && typeof d.items !== 'object') {
      return { valid: false, error: 'Nieprawidłowy format items' };
    }

    return { valid: true };
  }

  async function importStats(jsonString, mode) {
    // mode: 'replace' | 'add' | 'add_diff'

    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      alert('Błąd parsowania JSON: ' + e.message);
      return false;
    }

    const validation = validateImportData(data);
    if (!validation.valid) {
      alert('Błąd walidacji: ' + validation.error);
      return false;
    }

    const imported = data.data;

    switch (mode) {
      case 'replace':
        CAMP_STATS.total.expeditions = imported.expeditions || 0;
        CAMP_STATS.total.values = { ...(imported.values || {}) };
        CAMP_STATS.total.items = {};
        for (const [id, info] of Object.entries(imported.items || {})) {
          CAMP_STATS.total.items[id] = { count: info.count || 0, src: info.src || '' };
        }
        break;

      case 'add':
        CAMP_STATS.total.expeditions += imported.expeditions || 0;
        for (const [key, val] of Object.entries(imported.values || {})) {
          CAMP_STATS.total.values[key] = (CAMP_STATS.total.values[key] || 0) + val;
        }
        for (const [id, info] of Object.entries(imported.items || {})) {
          if (!CAMP_STATS.total.items[id]) {
            CAMP_STATS.total.items[id] = { count: 0, src: info.src || '' };
          }
          CAMP_STATS.total.items[id].count += info.count || 0;
        }
        break;

      case 'add_diff':
        // Add only positive difference (imported - current)
        const expDiff = Math.max(0, (imported.expeditions || 0) - CAMP_STATS.total.expeditions);
        CAMP_STATS.total.expeditions += expDiff;

        for (const [key, val] of Object.entries(imported.values || {})) {
          const current = CAMP_STATS.total.values[key] || 0;
          const diff = Math.max(0, val - current);
          CAMP_STATS.total.values[key] = current + diff;
        }

        for (const [id, info] of Object.entries(imported.items || {})) {
          const currentCount = CAMP_STATS.total.items[id]?.count || 0;
          const diff = Math.max(0, (info.count || 0) - currentCount);
          if (!CAMP_STATS.total.items[id]) {
            CAMP_STATS.total.items[id] = { count: 0, src: info.src || '' };
          }
          CAMP_STATS.total.items[id].count += diff;
        }
        break;

      default:
        alert('Nieznany tryb importu: ' + mode);
        return false;
    }

    await saveTotal();
    render();
    console.log(`[CampStats] Imported stats (mode: ${mode})`);
    return true;
  }

  function showImportModal() {
    // Remove existing modal
    const existing = document.getElementById('afo_cs_import_modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'afo_cs_import_modal';
    modal.className = 'afo_modal_overlay';
    modal.innerHTML = `
      <div class="afo_modal">
        <div class="afo_modal_header">
          <b>Importuj statystyki</b>
          <span class="afo_modal_close" id="afo_cs_modal_close">&times;</span>
        </div>
        <div class="afo_modal_body">
          <div class="afo_cs_import_info">
            Wybierz plik JSON z wyeksportowanymi statystykami lub wklej zawartość:
          </div>
          <input type="file" id="afo_cs_import_file" accept=".json" style="margin: 8px 0; width: 100%;">
          <textarea id="afo_cs_import_text" placeholder="lub wklej JSON tutaj..." rows="5" style="width:100%; box-sizing:border-box; background:#0a1520; color:#ccc; border:1px solid #305779; border-radius:4px; padding:6px;"></textarea>
          <div class="afo_cs_import_mode">
            <label style="color:#f5a623; margin-bottom:4px; display:block;"><b>Tryb importu:</b></label>
            <label><input type="radio" name="import_mode" value="replace"> Zastąp (nadpisz wszystko)</label>
            <label><input type="radio" name="import_mode" value="add" checked> Dodaj (sumuj wartości)</label>
            <label><input type="radio" name="import_mode" value="add_diff"> Dodaj różnicę (tylko większe wartości)</label>
          </div>
        </div>
        <div class="afo_modal_footer">
          <button id="afo_cs_import_confirm" class="afo_btn_green">Importuj</button>
          <button id="afo_cs_import_cancel" class="afo_btn_gray">Anuluj</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // File input handler
    document.getElementById('afo_cs_import_file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('afo_cs_import_text').value = ev.target.result;
        };
        reader.readAsText(file);
      }
    });

    // Close handlers
    const closeModal = () => modal.remove();
    document.getElementById('afo_cs_modal_close').addEventListener('click', closeModal);
    document.getElementById('afo_cs_import_cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Confirm handler
    document.getElementById('afo_cs_import_confirm').addEventListener('click', async () => {
      const text = document.getElementById('afo_cs_import_text').value.trim();
      if (!text) {
        alert('Wprowadź dane do importu');
        return;
      }

      const modeRadio = document.querySelector('input[name="import_mode"]:checked');
      const mode = modeRadio ? modeRadio.value : 'add';

      const success = await importStats(text, mode);
      if (success) {
        modal.remove();
        alert('Import zakończony pomyślnie!');
      }
    });
  }

  // ============================================
  // UI - CSS
  // ============================================

  function injectCSS() {
    if (document.getElementById('camp-stats-css')) return;

    const style = document.createElement('style');
    style.id = 'camp-stats-css';
    style.textContent = `
      #afo_camp_stats_con {
        margin-top: 8px;
        display: flex;
        gap: 10px;
        clear: both;
      }
      .afo_camp_stat_box {
        flex: 1;
        background: rgba(0,0,0,0.3);
        border: 1px solid #305779;
        border-radius: 5px;
        padding: 6px 8px;
        font-size: 12px;
      }
      .afo_camp_stat_box b {
        display: block;
        margin-bottom: 4px;
        color: #f5a623;
        font-size: 13px;
      }
      .afo_camp_stat_box .afo_cs_row {
        margin-bottom: 2px;
      }
      .afo_camp_stat_box .afo_cs_items {
        display: flex;
        flex-wrap: wrap;
        gap: 2px;
        margin-top: 4px;
      }
      .afo_camp_stat_box .afo_cs_item {
        position: relative;
        width: 28px;
        height: 28px;
      }
      .afo_camp_stat_box .afo_cs_item img {
        width: 28px;
        height: 28px;
      }
      .afo_camp_stat_box .afo_cs_item .afo_cs_count {
        position: absolute;
        bottom: -2px;
        right: -2px;
        background: rgba(0,0,0,0.8);
        color: #fff;
        font-size: 9px;
        padding: 0 3px;
        border-radius: 3px;
        line-height: 14px;
        font-weight: bold;
      }
      .afo_camp_stat_box .afo_cs_reset {
        margin-left: 30px;
        float: right;
        cursor: pointer;
        color: #666;
        font-size: 10px;
      }
      .afo_camp_stat_box .afo_cs_reset:hover {
        color: #f55;
      }
      .afo_camp_stat_box .afo_cs_btn {
        float: right;
        cursor: pointer;
        color: #4a9;
        font-size: 10px;
        margin-left: 8px;
      }
      .afo_camp_stat_box .afo_cs_btn:hover {
        color: #6cb;
      }

      /* Modal */
      .afo_modal_overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .afo_modal {
        background: #1a2a3a;
        border: 1px solid #305779;
        border-radius: 8px;
        min-width: 350px;
        max-width: 500px;
      }
      .afo_modal_header {
        padding: 10px 12px;
        border-bottom: 1px solid #305779;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .afo_modal_header b {
        color: #f5a623;
      }
      .afo_modal_close {
        cursor: pointer;
        color: #888;
        font-size: 20px;
        line-height: 1;
      }
      .afo_modal_close:hover {
        color: #f55;
      }
      .afo_modal_body {
        padding: 12px;
      }
      .afo_modal_footer {
        padding: 10px 12px;
        border-top: 1px solid #305779;
        text-align: right;
      }
      .afo_modal_footer button {
        padding: 6px 14px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 8px;
      }
      .afo_btn_green { background: #2a7a2a; color: #fff; }
      .afo_btn_green:hover { background: #3a9a3a; }
      .afo_btn_gray { background: #444; color: #fff; }
      .afo_btn_gray:hover { background: #555; }

      .afo_cs_import_mode {
        margin-top: 10px;
      }
      .afo_cs_import_mode label {
        display: block;
        margin: 4px 0;
        color: #ccc;
      }
      .afo_cs_import_info {
        color: #aaa;
        font-size: 12px;
        margin-bottom: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // UI - INJECTION
  // ============================================

  function tryInjectUI() {
    if (CAMP_STATS.uiInjected) return;
    if (document.getElementById('afo_camp_stats_con')) {
      CAMP_STATS.uiInjected = true;
      render();
      return;
    }

    const allCamps = document.getElementById('all_camps');
    if (!allCamps) {
      if (CAMP_STATS.retryCount < 15) {
        CAMP_STATS.retryCount++;
        setTimeout(tryInjectUI, 2000);
      }
      return;
    }

    const con = document.createElement('div');
    con.id = 'afo_camp_stats_con';
    con.innerHTML = `
      <div class="afo_camp_stat_box" id="afo_cs_session"></div>
      <div class="afo_camp_stat_box" id="afo_cs_total"></div>
    `;
    allCamps.parentNode.insertBefore(con, allCamps.nextSibling);
    CAMP_STATS.uiInjected = true;
    console.log('[CampStats] UI injected');
    render();
  }

  // ============================================
  // UI - RENDERING
  // ============================================

  function renderBox(elId, title, stats, options = {}) {
    const el = document.getElementById(elId);
    if (!el) return;

    const { resetFn, showExportImport } = options;

    // Values per icon type
    const valuesHtml = Object.entries(stats.values)
      .map(([icoClass, total]) => {
        const avg = stats.expeditions > 0 ? Math.round(total / stats.expeditions).toLocaleString('pl-PL') : 0;
        return `<div class="afo_cs_row"><i class="ico ${icoClass}"></i> <span class="orange">${total.toLocaleString('pl-PL')}</span>${stats.expeditions > 0 ? ` (śr. ${avg})` : ''}</div>`;
      })
      .join('');

    // Items sorted by count
    const itemsHtml = Object.entries(stats.items)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, info]) => {
        return `<div class="afo_cs_item" data-item_id="${id}">
          <img src="${info.src}">
          <span class="afo_cs_count">${info.count}</span>
        </div>`;
      })
      .join('');

    // Extra buttons for total box
    const exportImportHtml = showExportImport ? `
      <span class="afo_cs_btn" id="afo_cs_export" title="Eksportuj statystyki do pliku">[Pobierz]</span>
      <span class="afo_cs_btn" id="afo_cs_import" title="Importuj statystyki z pliku">[Importuj]</span>
    ` : '';

    el.innerHTML = `
      <b>${title}
        ${resetFn ? `<span class="afo_cs_reset" id="${resetFn}">[Zeruj]</span>` : ''}
        ${exportImportHtml}
      </b>
      <div class="afo_cs_row">Wypraw: <span class="orange">${stats.expeditions}</span></div>
      ${valuesHtml}
      <div class="afo_cs_items">${itemsHtml || '<span style="color:#666">brak przedmiotów</span>'}</div>
    `;

    // Bind reset button
    if (resetFn) {
      const btn = document.getElementById(resetFn);
      if (btn) {
        btn.addEventListener('click', async () => {
          if (!confirm('Czy na pewno chcesz wyzerować statystyki?')) return;
          if (resetFn === 'afo_cs_reset_session') {
            CAMP_STATS.session = { expeditions: 0, values: {}, items: {} };
          } else {
            CAMP_STATS.total = { expeditions: 0, values: {}, items: {} };
            await saveTotal();
          }
          render();
        });
      }
    }

    // Bind export/import buttons
    if (showExportImport) {
      const exportBtn = document.getElementById('afo_cs_export');
      if (exportBtn) {
        exportBtn.addEventListener('click', exportStats);
      }

      const importBtn = document.getElementById('afo_cs_import');
      if (importBtn) {
        importBtn.addEventListener('click', showImportModal);
      }
    }
  }

  function render() {
    if (!CAMP_STATS.uiInjected) return;
    renderBox('afo_cs_session', 'Obecna sesja', CAMP_STATS.session, { resetFn: 'afo_cs_reset_session' });
    renderBox('afo_cs_total', 'Łącznie', CAMP_STATS.total, { resetFn: 'afo_cs_reset_total', showExportImport: true });
  }

  // ============================================
  // INITIALIZATION (Polled Readiness)
  // ============================================

  async function init() {
    CAMP_STATS.currentCharId = GAME.char_id || 0;
    buildStorageKey();
    await loadTotal();
    injectCSS();
    tryInjectUI();
    startObserver();
    watchCharSwitch();
    console.log('[CampStats] Initialized, key:', CAMP_STATS.storageKey);
  }

  // Wait for GAME.char_data and AFO_STORAGE
  let initAttempts = 0;
  const maxAttempts = 120; // 60 seconds

  const initCheck = setInterval(() => {
    initAttempts++;
    if (initAttempts > maxAttempts) {
      clearInterval(initCheck);
      console.log('[CampStats] Timeout waiting for dependencies');
      return;
    }
    if (GAME.char_data && GAME.socket && typeof AFO_STORAGE !== 'undefined') {
      clearInterval(initCheck);
      init();
    }
  }, 500);

})();

console.log('[AFO] Camp Stats module loaded (self-initializing)');

