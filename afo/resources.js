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
