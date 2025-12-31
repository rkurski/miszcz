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
