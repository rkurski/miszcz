/**
 * ============================================================================
 * GIENIOBOT - Click Handlers Module
 * ============================================================================
 * 
 * All jQuery click event bindings and keyboard shortcuts.
 * This mixin is applied to the kwsv3 class.
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
          if (GAME.char_tables.timed_actions[0] == undefined || GAME.char_tables.timed_actions[1] == undefined && GAME.char_data.bonus16 > GAME.getTime()) {
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
          if (GAME.char_tables.timed_actions[0] == undefined || GAME.char_tables.timed_actions[1] == undefined && GAME.char_data.bonus16 > GAME.getTime()) {
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

    // --- CARD SET HANDLERS ---
    $("body").on("click", `#sc_set0 , #sc_sett0`, () => { $('.sc_setss_all').removeClass('current'); $('#sc_sett0').addClass('current'); });
    $("body").on("click", `#sc_set1 , #sc_sett1`, () => { $('.sc_setss_all').removeClass('current'); $('#sc_sett1').addClass('current'); });
    $("body").on("click", `#sc_set2 , #sc_sett2`, () => { $('.sc_setss_all').removeClass('current'); $('#sc_sett2').addClass('current'); });
    $("body").on("click", `#sc_set3 , #sc_sett3`, () => { $('.sc_setss_all').removeClass('current'); $('#sc_sett3').addClass('current'); });
    $("body").on("click", `#sc_set4 , #sc_sett4`, () => { $('.sc_setss_all').removeClass('current'); $('#sc_sett4').addClass('current'); });

    $("body").on("contextmenu", "#sc_sets .sc_sets_all", function (event) {
      event.preventDefault();
      const set = parseInt($(this).attr("data-set"));
      GAME.komunikat(`<h5>ZMIEŃ NAZWĘ SETU NR. ${set + 1}</h5><input class="cards_set_name_input" type="text" value="${$(this).html()}" maxlength="10" /><br><button class="cards_set_name_button btn_small_gold" set-id="${set}">ZAPISZ</button>`);
    });
    $("body").on("click", ".cards_set_name_button", (el) => {
      const setID = parseInt($(el.target).attr("set-id"));
      this.updateCardSetsNames(setID);
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
    });
    $("body").on("click", `.kws_reset_website_bg`, () => {
      this.manageWebsiteBackground("reset");
    });

    // --- COMBAT HANDLERS ---
    $("body").on("click", `[data-option="map_multi_pvp"]`, () => { this.pvpKill(); });
    $("body").on("click", `[data-option="map_quest_skip"]`, () => { this.questProceed(); kom_clear(); });
    $("body").on("click", `[data-option="map_quest_skip_time"]`, () => { this.useCompressor(); });
    $("body").on("click", `[data-option="map_alternative_pilot"]`, () => { this.createAlternativePilot(); });

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
        else if (event.key === "=") { this.createAlternativePilot(); }
        else if (event.key === ",") { this.goToPreviousChar(); }
        else if (event.key === ".") { this.goToNextChar(); }
      }
    });

    // --- AFO LOADER ---
    $("body").on("click", ".qlink.load_afo", () => {
      if (typeof this.afo_is_loaded == 'undefined') {
        this.afo_is_loaded = true;
        $.get(getGieniobotUrl('uncodedeeee.js'), (data) => {
          $("body").append(`<script>${data}<\/script>`);
        }).fail(() => {
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

    // --- QUEST ROLL HANDLERS ---
    $("body").on("click", `.quest_roll1.option`, () => {
      var id = parseInt($(".quest_roll.option").attr("data-qb_id"));
      if (roll1) { roll1 = false; }
      else { roll1 = true; GAME.socket.emit('ga', { a: 22, type: 1, id: id }); }
    });
    $("body").on("click", `.quest_roll2.option`, () => {
      var id = parseInt($(".quest_roll.option").attr("data-qb_id"));
      if (roll2) { roll2 = false; }
      else { roll2 = true; GAME.socket.emit('ga', { a: 22, type: 1, id: id }); }
    });
    $("body").on("click", `.quest_roll3.option`, () => {
      var id = parseInt($(".quest_roll.option").attr("data-qb_id"));
      if (roll3) { roll3 = false; }
      else { roll3 = true; GAME.socket.emit('ga', { a: 22, type: 1, id: id }); }
    });
  }
};

// Export mixin
window.ClickHandlersMixin = ClickHandlersMixin;
console.log('[ClickHandlers] Module loaded');
