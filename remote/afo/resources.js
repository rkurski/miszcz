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
    // Throttled diagnostic logs — only first 5 calls per ON, set in bindHandlers.
    if (RES._startCallCount === undefined) RES._startCallCount = 0;
    RES._startCallCount++;
    if (RES._startCallCount <= 5) {
      console.log('[AFO_RES:Start]', {
        call: RES._startCallCount,
        stop: RES.stop,
        loc: GAME.char_data?.loc,
        is_loading: GAME.is_loading,
        has_mines: !!(GAME.map_mines && GAME.map_mines.mine_data),
        socket_connected: GAME.socket?.connected
      });
    }
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
    if (RES.stop) return;
    if (!RES.processing) {
      // Activate gathering buffs if enabled and missing. Yield while server
      // processes the bless use; loop re-enters Action via setTimeout.
      if (this.checkResBuffs()) {
        setTimeout(() => this.Action(), 1200);
        return;
      }
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
    let mdt = Object.entries(GAME.map_mines.mine_data);
    if (mdt.length == 0) {
      $("#res_Panel ul").html("Brak zasobów");
      return;
    }
    // If nothing selected, or the previously selected id isn't on this map,
    // default to the first available mine.
    const availableIds = mdt.map(e => e[1].id);
    if (RES.mined_id.length === 0 || !availableIds.includes(RES.mined_id[0])) {
      RES.mined_id = [mdt[0][1].id];
    }
    this.renderMines();
  },

  // Render mine checkboxes — single-select. If one is selected, others are disabled.
  renderMines() {
    let mdt = Object.entries(GAME.map_mines.mine_data);
    let html = "";
    const selectedId = RES.mined_id[0];
    for (let i = 0; i < mdt.length; i++) {
      const id = mdt[i][1].id;
      const checked = selectedId === id ? "checked" : "";
      // Disable everything except the selected one when something is selected.
      const disabled = (selectedId !== undefined && selectedId !== id) ? "disabled" : "";
      html += `<div style='margin-bottom:5px; border-bottom:solid gray 1px; padding:3px;'>
        <input class='select_mine' type='checkbox' value='${id}' ${checked} ${disabled}> ${mdt[i][1].name}</div>`;
    }
    $("#res_Panel ul").html(html);
  },

  // ============================================
  // RESOURCE BUFFS (15% speed / 15% chance)
  // ============================================
  // Matches RESP's check_bless pattern. base item IDs:
  //   1747 (buff 76) — szybsze zbieranie zasobów  (stat 148)
  //   1746 (buff 75) — szansa na zebranie zasobu  (stat 149)
  // Returns true if a buff request was emitted (caller should yield and retry).

  RES_BUFFS: [
    { flag: 'buff_speed',  base: 1747, buff: 76 },
    { flag: 'buff_chance', base: 1746, buff: 75 }
  ],

  checkResBuffs() {
    const needed = this.RES_BUFFS.filter(b => RES[b.flag]);
    if (!needed.length) return false;

    // Only check on ekw page 10 (consumables/blessings).
    if (GAME.ekw_page != 10) {
      GAME.ekw_page = 10;
      GAME.socket.emit('ga', { a: 12, page: 10, used: 1 });
      return true;
    }

    for (const item of needed) {
      const $buff = $(`#char_buffs`).find(`[data-buff=${item.buff}]`);
      const hasBuff = $buff.length === 1;
      const expiring = hasBuff && $buff.find(".timer").text() <= '00:00:04';
      if (hasBuff && !expiring) continue;

      const itemId = $(`#ekw_page_items`).find(`div[data-base_item_id=${item.base}]`).attr("data-item_id");
      if (!itemId) continue;

      GAME.socket.emit('ga', { a: 12, type: 14, iid: parseInt(itemId), page: 10 });
      return true;
    }
    return false;
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
      const hasMines = !!(GAME.map_mines && GAME.map_mines.mine_data && Object.entries(GAME.map_mines.mine_data).length > 0);
      console.log('[AFO_RES:click]', { stop: RES.stop, hasMines });
      if (RES.stop && hasMines) {
        $(".res_res .res_status").removeClass("red").addClass("green").html("On");
        RES.stop = false;
        RES.loc = GAME.char_data.loc;
        RES._startCallCount = 0; // reset diagnostic counter for new ON cycle
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

    // Mine checkbox selection — single-select. Only one mine type active at a time.
    $(document).on('change', '.select_mine', (e) => {
      const val = parseInt($(e.target).val());
      if ($(e.target).is(':checked')) {
        RES.mined_id = [val];
      } else {
        RES.mined_id = [];
      }
      RES.refresh_mines = true;
      this.renderMines();
    });

    // Buff toggles
    $('#res_Panel .res_buff_speed').click(() => {
      RES.buff_speed = !RES.buff_speed;
      $(".res_buff_speed .res_status").toggleClass("green red").html(RES.buff_speed ? "On" : "Off");
    });
    $('#res_Panel .res_buff_chance').click(() => {
      RES.buff_chance = !RES.buff_chance;
      $(".res_buff_chance .res_status").toggleClass("green red").html(RES.buff_chance ? "On" : "Off");
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
