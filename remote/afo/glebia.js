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

  // Options
  code: false
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
      } else {
        $(".glebia_code .glebia_status").removeClass("red").addClass("green").html("On");
        GLEBIA.code = true;
      }
    });

    console.log('[AFO_GLEBIA] Handlers bound');
  },

  // ============================================
  // MAIN LOOP
  // ============================================

  start() {
    if (GLEBIA.stop) return;

    if (!GAME.is_loading) {
      this.action();
    } else {
      setTimeout(() => this.start(), GLEBIA.wait);
    }
  },

  action() {
    // Check codes if enabled
    if (GLEBIA.code && this.checkCode()) {
      setTimeout(() => this.start(), 1800);
      return;
    }

    const functions = [
      this.check_position_x.bind(this),
      this.check_position_y.bind(this),
      this.check_players.bind(this),
      this.check_players2.bind(this),
      this.kill_players.bind(this),
      this.check_glebia_location.bind(this),
      this.go.bind(this)
    ];

    functions[GLEBIA.caseNumber]();
    GLEBIA.caseNumber = (GLEBIA.caseNumber + 1) % functions.length;
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
    setTimeout(() => this.start(), GLEBIA.wait);
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
    const playerList = document.getElementById("player_list_con");
    if (!playerList || playerList.childElementCount === 0) {
      return setTimeout(() => this.start(), GLEBIA.waitPvp);
    }

    if (typeof LOWLVL !== 'undefined' && LOWLVL.stop === true) {
      if (playerList.children[0] && playerList.children[0].children[1] &&
        playerList.children[0].children[1].children[0]) {
        const tabb = playerList.children[0].children[1].children[0].textContent.split(":");
        if (parseInt(tabb[2]) <= 30 && parseInt(tabb[1]) <= 0) {
          return setTimeout(() => this.check_players2(), 150);
        }
      }
    }
    setTimeout(() => this.start(), GLEBIA.waitPvp);
  },

  // ============================================
  // ATTACK LOGIC
  // ============================================

  isEnemyAttackable(player) {
    const cdElem = player.querySelector('.timer');
    if (!cdElem) {
      return true; // No timer = player ready
    }
    const parts = cdElem.textContent.split(':');
    if (parts.length === 3) {
      const seconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
      return seconds <= 5;
    }
    return true;
  },

  getAttackablePlayers(players) {
    return players.filter(player => {
      const attackButton = player.querySelector('button[data-quick="1"]');
      const targetId = attackButton?.getAttribute('data-char_id');
      return targetId && this.isEnemyAttackable(player);
    });
  },

  attackNext(players, index, callback) {
    if (index >= players.length) {
      callback();
      return;
    }

    const player = players[index];
    const attackButton = player.querySelector('button[data-quick="1"]');
    const targetId = attackButton?.getAttribute('data-char_id');

    if (targetId && this.isEnemyAttackable(player)) {
      GAME.emitOrder({ a: 24, char_id: targetId, quick: 1 });
    }

    setTimeout(() => this.attackNext(players, index + 1, callback), GLEBIA.attackDelay);
  },

  loadAllPlayers(callback) {
    const playerList = document.getElementById('player_list_con');
    if (!playerList || playerList.children.length === 0) {
      return setTimeout(callback, 0);
    }

    const loadMore = playerList.querySelector('[data-option="load_more_players"]');
    if (loadMore) {
      loadMore.click();
      setTimeout(() => this.loadAllPlayers(callback), 800);
    } else {
      setTimeout(callback, 0);
    }
  },

  kill_players() {
    this.loadAllPlayers(() => {
      const list = document.getElementById('player_list_con');
      if (!list) {
        return setTimeout(() => this.start(), GLEBIA.wait);
      }

      setTimeout(() => {
        // Remove players with timers > 5 seconds or without attack button
        Array.from(list.children).forEach(player => {
          const cdElem = player.querySelector('.timer');
          const attackButton = player.querySelector('button[data-quick="1"]');
          let remove = false;
          if (cdElem) {
            const parts = cdElem.textContent.split(':');
            if (parts.length === 3) {
              const seconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
              if (seconds > 5) remove = true;
            }
          }
          if (!attackButton) remove = true;
          if (remove) player.remove();
        });

        const attackablePlayers = this.getAttackablePlayers(Array.from(list.children));

        if (attackablePlayers.length === 0) {
          GLEBIA.attackChecks++;
          if (GLEBIA.attackChecks >= 3) {
            GLEBIA.attackChecks = 0;
            setTimeout(() => this.start(), GLEBIA.wait);
          } else {
            this.loadAllPlayers(() => {
              setTimeout(() => this.kill_players(), GLEBIA.waitPvp);
            });
          }
          return;
        }

        this.attackNext(attackablePlayers, 0, () => {
          GLEBIA.attackChecks++;
          this.loadAllPlayers(() => {
            setTimeout(() => {
              Array.from(list.children).forEach(player => {
                const cdElem = player.querySelector('.timer');
                const attackButton = player.querySelector('button[data-quick="1"]');
                let remove = false;
                if (cdElem) {
                  const parts = cdElem.textContent.split(':');
                  if (parts.length === 3) {
                    const seconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
                    if (seconds > 5) remove = true;
                  }
                }
                if (!attackButton) remove = true;
                if (remove) player.remove();
              });

              const stillAttackable = this.getAttackablePlayers(Array.from(list.children)).length > 0;
              if (stillAttackable && GLEBIA.attackChecks < 3) {
                setTimeout(() => this.kill_players(), GLEBIA.waitPvp);
              } else {
                GLEBIA.attackChecks = 0;
                setTimeout(() => this.start(), GLEBIA.wait);
              }
            }, GLEBIA.waitPvp);
          });
        });
      }, GLEBIA.wait);
    });
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
      setTimeout(() => {
        GAME.socket.emit('ga', { a: 8, type: 5, apud: 'vzaaa' });
      }, 1600);
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
