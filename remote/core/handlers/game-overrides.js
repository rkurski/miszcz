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
      if (container.querySelector('.afo-tourn-wins')) return;
      const rows = container.querySelectorAll('tr');
      for (const row of rows) {
        if (row.firstElementChild && row.firstElementChild.textContent.trim() === 'Wykonane zadania codzienne') {
          const tr = document.createElement('tr');
          tr.classList.add('afo-tourn-wins');
          tr.innerHTML = `<td>Wygrane turnieje</td><td></td><td>${GAME.dots(GAME.char_data.tourn_wins)}</td>`;
          row.after(tr);
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
      opts += `<div class="qlink sideIcons manage_auto_abyss${kws.auto_abyss ? ' kws_active_icon' : ''}" style="background-repeat: no-repeat; background-position: center; background-image: url('https://i.imgur.com/j5eQv2B.png');display:block;top:-136px;position:absolute;" data-toggle="tooltip" data-original-title="<div class=tt>[Włącz / Wyłącz] Atakowanie Otchłani</div>"></div>`;
      opts += `<div class="qlink sideIcons manage_auto_arena${kws.auto_arena ? ' kws_active_icon' : ''}" style="background-repeat: no-repeat; background-position: center; background-image: url('https://i.imgur.com/XQz5nRu.png');display:block;top:-104px;position:absolute;" data-toggle="tooltip" data-original-title="<div class=tt>[Włącz / Wyłącz] Atakowanie na Arenie</div>"></div>`;
      opts += ` <div class="autoArenaBuff"> <div style="padding-left:8px;"> <label for="aePvpBuff" style="cursor:pointer;">PVP BUFF</label> <div class="newCheckbox"><input type="checkbox" id="aePvpBuff" name="aePvpBuff" ${kws.settings.aePvpBuff ? "checked" : ""} /><label for="aePvpBuff"></label></div> </div> </div>`;
      opts += `<div class="qlink sideIcons manage_autoExpeditions${kws.autoExpeditions ? ' kws_active_icon' : ''}" style="background-repeat: no-repeat; background-position: center; background-image: url('https://i.imgur.com/v1M3iIS.png');display:block;top:-72px;position:absolute;" data-toggle="tooltip" data-original-title="<div class=tt>[Włącz / Wyłącz] Automatyczne Wyprawy</div>"></div>`;
      opts += ` <div class="autoExpeCodes"> <div style="padding-left:8px;"> <label for="aeCodes" style="cursor:pointer;">KODY</label> <div class="newCheckbox"><input type="checkbox" id="aeCodes" name="aeCodes" ${kws.settings.aeCodes ? "checked" : ""} /><label for="aeCodes"></label></div> </div> </div>`;
      // Clan Assist toggle - only visible when klan_id != 0 and reborn >= 1
      const canShowClanAssist = GAME.char_data && GAME.char_data.klan_id && GAME.char_data.klan_id !== 0 && GAME.char_data.reborn >= 1;
      const clanAssistEnabled = typeof CLAN_ASSIST !== 'undefined' && CLAN_ASSIST.enabled !== false;
      if (canShowClanAssist) {
        opts += `<div class="qlink sideIcons manage_auto_clanAssist${clanAssistEnabled ? ' kws_active_icon' : ''}" style="background-repeat: no-repeat; background-position: center; background-image: url('https://i.imgur.com/DbP8Snj.png');display:block;top:-40px;position:absolute;" data-toggle="tooltip" data-original-title="<div class=tt>[Włącz / Wyłącz] Automatyczne Asysty</div>"></div>`;
      }
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
