/**
 * ============================================================================
 * AFO - Panel Templates
 * ============================================================================
 * 
 * CSS styles and HTML templates for all AFO panels.
 * Separated from logic for cleaner code organization.
 * 
 * ============================================================================
 */

const AFO_Templates = {

  // ============================================
  // CSS STYLES
  // ============================================

  css: {
    main: `
      #main_Panel {
        background: rgba(0,0,0,0.9);
        position: fixed;
        top: 250px;
        left: 80%;
        z-index: 9999;
        width: 150px;
        padding: 1px;
        border-radius: 5px;
        border-style: solid;
        border-width: 7px 8px 7px 7px;
        display: block;
        user-select: none;
        color: #333333;
      }
      #main_Panel .sekcja {
        position: absolute;
        top: -27px;
        left: -7px;
        background: rgba(0,0,0,0.9);
        filter: hue-rotate(196deg);
        background-size: 100% 100%;
        width: 150px;
        cursor: all-scroll;
      }
      #main_Panel .gh_button {
        cursor: pointer;
        text-align: center;
        border-bottom: solid gray 1px;
        color: white;
      }
    `,

    pvp: `
      #pvp_Panel {
        background: rgba(0,0,0,0.9);
        position: fixed;
        top: 450px;
        left: 80%;
        z-index: 9999;
        width: 150px;
        padding: 1px;
        border-radius: 5px;
        border-style: solid;
        border-width: 7px 8px 7px 7px;
        display: block;
        user-select: none;
        color: #333333;
      }
      #pvp_Panel .sekcja {
        position: absolute;
        top: -27px;
        left: -7px;
        background: rgba(0,0,0,0.9);
        filter: hue-rotate(196deg);
        background-size: 100% 100%;
        width: 150px;
        cursor: all-scroll;
      }
      #pvp_Panel .pvp_button {
        cursor: pointer;
        text-align: center;
        border-bottom: solid gray 1px;
        color: white;
      }
      #pvp_Panel .gamee_input {
        text-align: center;
        border-bottom: solid gray 1px;
        color: white;
      }
      #pvp_Panel .gamee_input input::placeholder { color: #4b4b4b; }
      #pvp_Panel .gameee_input {
        text-align: center;
        border-bottom: solid gray 1px;
        color: white;
      }
      #pvp_Panel .gameee_input input::placeholder { color: #4b4b4b; }
    `,

    resp: `
      #resp_Panel {
        background: rgba(0,0,0,0.9);
        position: fixed;
        top: 450px;
        left: 80%;
        z-index: 9999;
        width: 150px;
        padding: 1px;
        border-radius: 5px;
        border-style: solid;
        border-width: 7px 8px 7px 7px;
        display: block;
        user-select: none;
        color: #333333;
      }
      #resp_Panel .sekcja {
        position: absolute;
        top: -27px;
        left: -7px;
        background: rgba(0,0,0,0.9);
        filter: hue-rotate(196deg);
        background-size: 100% 100%;
        width: 150px;
        cursor: all-scroll;
      }
      #resp_Panel .resp_button {
        cursor: pointer;
        text-align: center;
        border-bottom: solid gray 1px;
        color: white;
      }
    `,

    code: `
      #code_Panel {
        background: rgba(0,0,0,0.9);
        position: fixed;
        top: 450px;
        left: 80%;
        z-index: 9999;
        width: 180px;
        padding: 1px;
        border-radius: 5px;
        border-style: solid;
        border-width: 7px 8px 7px 7px;
        display: block;
        user-select: none;
        color: #333333;
      }
      #code_Panel .sekcja {
        position: absolute;
        top: -27px;
        left: -7px;
        background: rgba(0,0,0,0.9);
        filter: hue-rotate(196deg);
        background-size: 100% 100%;
        width: 180px;
        cursor: all-scroll;
      }
      #code_Panel .code_button {
        cursor: pointer;
        text-align: center;
        border-bottom: solid gray 1px;
        color: white;
      }
    `,

    res: `
      #res_Panel {
        background: rgba(0,0,0,0.9);
        position: fixed;
        top: 450px;
        left: 65%;
        z-index: 9999;
        width: 150px;
        padding: 1px;
        border-radius: 5px;
        border-style: solid;
        border-width: 7px 8px 7px 7px;
        display: block;
        user-select: none;
        color: #333333;
      }
      #res_Panel .sekcja {
        position: absolute;
        top: -27px;
        left: -7px;
        background: rgba(0,0,0,0.9);
        filter: hue-rotate(196deg);
        background-size: 100% 100%;
        width: 150px;
        cursor: all-scroll;
      }
      #res_Panel .res_button {
        cursor: pointer;
        text-align: center;
        border-bottom: solid gray 1px;
        color: white;
      }
      #res_Panel ul {
        margin-left: -30px;
        color: white;
        margin: 7px 0px 5px 0px;
        padding: 0px;
        text-align: center;
      }
    `,

    lpvm: `
      #lpvm_Panel {
        background: rgba(0,0,0,0.9);
        position: fixed;
        top: 650px;
        left: 80%;
        z-index: 9999;
        width: 150px;
        padding: 1px;
        border-radius: 5px;
        border-style: solid;
        border-width: 7px 8px 7px 7px;
        display: block;
        user-select: none;
        color: #333333;
      }
      #lpvm_Panel .sekcja {
        position: absolute;
        top: -27px;
        left: -7px;
        background: rgba(0,0,0,0.9);
        filter: hue-rotate(196deg);
        background-size: 100% 100%;
        width: 150px;
        cursor: all-scroll;
      }
      #lpvm_Panel .lpvm_button {
        cursor: pointer;
        text-align: center;
        border-bottom: solid gray 1px;
        color: white;
      }
      #lpvm_Panel .pvm_killed {
        cursor: pointer;
        text-align: center;
        border-bottom: solid gray 1px;
        color: white;
      }
      #lpvm_Panel .gamee_input {
        text-align: center;
        border-bottom: solid gray 1px;
        color: white;
      }
    `,

    glebia: `
      #glebia_Panel {
        background: rgba(0,0,0,0.9);
        position: fixed;
        top: 450px;
        left: 80%;
        z-index: 9999;
        width: 150px;
        padding: 1px;
        border-radius: 5px;
        border-style: solid;
        border-width: 7px 8px 7px 7px;
        display: block;
        user-select: none;
        color: #333333;
      }
      #glebia_Panel .sekcja {
        position: absolute;
        top: -27px;
        left: -7px;
        background: rgba(0,0,0,0.9);
        filter: hue-rotate(196deg);
        background-size: 100% 100%;
        width: 150px;
        cursor: all-scroll;
      }
      #glebia_Panel .glebia_button {
        cursor: pointer;
        text-align: center;
        border-bottom: solid gray 1px;
        color: white;
      }
    `
  },

  // ============================================
  // HTML TEMPLATES
  // ============================================

  html: {
    main: `
      <div id="main_Panel">
        <div class="sekcja panel_dragg">ALL FOR ONE</div>
        <div class='gh_button gh_resp'>PVM<b class='gh_status red'>Off</b></div>
        <div class='gh_button gh_pvp'>PVP<b class='gh_status red'>Off</b></div>
        <div class='gh_button gh_lpvm'>Listy<b class='gh_status red'>Off</b></div>
        <div class='gh_button gh_res'>Zbierajka<b class='gh_status red'>Off</b></div>
        <div class='gh_button gh_code'>Kody<b class='gh_status red'>Off</b></div>
        <div class='gh_button gh_low_lvls'>Ukryj niskie lvle<b class='gh_status red'>Off</b></div>
        <div class='gh_button gh_glebia'>Głębia<b class='gh_status red'>Off</b></div>
      </div>
    `,

    pvp: `
      <div id="pvp_Panel">
        <div class="sekcja pvp_dragg">PVP</div>
        <div class='pvp_button pvp_pvp'>PVP<b class='pvp_status red'>Off</b></div>
        <div class='pvp_button pvp_Code'>Kody<b class='pvp_status green'>On</b></div>
        <div class="pvp_button pvpCODE_konto">Konto<b class="pvp_status red">Off</b></div>
        <div class='pvp_button pvp_rb_avoid'>Unikaj borny<b class='pvp_status red'>Off</b></div>
        <div class='pvp_button pvp_WI'>Wojny Imp<b class='pvp_status green'>On</b></div>
        <div class='pvp_button pvp_WK'>Wojny Klanowe<b class='pvp_status green'>On</b></div>
        <div class='pvp_button pvp_buff_imp'>Bufy IMP<b class='pvp_status red'>Off</b></div>
        <div class='pvp_button pvp_buff_clan'>Bufy KLAN<b class='pvp_status red'>Off</b></div>
        <div class='gamee_input'><input style='width:120px; margin-left:-2px; background:grey;text-align:center;font-size:16;' type='text' placeholder="Lista wojen" name='pvp_capt' value='' /></div>
        <div class='gameee_input'><input style='width:120px; margin-left:-2px; background:grey;text-align:center;font-size:16;' type='text' placeholder="Szybkość 10-100" name='speed_capt' value='50' /></div>
      </div>
    `,

    resp: `
      <div id="resp_Panel">
        <div class="sekcja resp_dragg">SPAWN MOBKóW</div>
        <div class="resp_button resp_resp">RESP<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_code">Kody<b class="resp_status green">On</b></div>
        <div class="resp_button resp_konto">Konto<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_sub">Subka<b class="resp_status green">On</b></div>
        <div class="resp_button resp_ost">Jaka<b class="resp_status green">Ost</b></div>
        <div class="resp_button resp_multi">Multiwalka<b class="resp_status green">On</b></div>
        <div class="resp_button resp_ssj">SSJ<b class="resp_status green">On</b></div>
        <div class="resp_button resp_buff_imp">Bufki IMP<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_buff_clan">Bufki KLAN<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_blue">BLUE<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_green">GREEN<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_purple">PURPLE<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_yellow">YELLOW<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_red">RED<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_magic">Wyciąg<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bless">BŁOGO<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh1">SMOK<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh2">5% EXP<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh3">5% MOC<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh4">150K MAX<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh5">5% MOC<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh6">5% PSK<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh7">200% EXP<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh8">500 LVL<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh9">500% EXP<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh10">25% MOC<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_on">Włącz All<b class="resp_status green">On</b></div>
        <div class="resp_button resp_off">Wyłącz All<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh11">100% Limit<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh14">100% Limit<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh12">200% Przyrost<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh13">300% Przyrost<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh15">5% kod<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh16">5 Min cd pvp <b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh17">15% szybsze zbieranie<b class="resp_status red">Off</b></div>
        <div class="resp_button resp_bh18">15% więcej szansy na zebranie<b class="resp_status red">Off</b></div>
      </div>
    `,

    code: `
      <div id="code_Panel">
        <div class="sekcja code_dragg">Kody</div>
        <div class="code_button code_code">KODY<b class="code_status red">Off</b></div>
        <div class="code_button code_acc">Konto<b class="code_status red">Off</b></div>
        <div class="code_button code_zast">Zastępstwa<b class="code_status red">Off</b></div>
        <div class="code_button code_bh1">Błogo 250% tren<b class="code_status red">Off</b></div>
        <div class="code_button code_bh2">Błogo 5% kod<b class="code_status red">Off</b></div>
        <label class='select_input'>
          <select id='bot_what_to_train'>
            <option value='1'>Siła</option>
            <option value='2'>Szybkość</option>
            <option value='3'>Wytrzymałość</option>
            <option value='4'>Siła Woli</option>
            <option value='5'>Energia Ki</option>
            <option value='6'>Wtajemniczenie</option>
          </select>
        </label>
        <label class='select_input'>
          <select id='bot_what_to_traintime'>
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
        </label>
      </div>
    `,

    res: `
      <div id="res_Panel">
        <div class="sekcja res_dragg">SUROWCE</div>
        <div class="res_button res_res">ZBIERAJ<b class="res_status red">Off</b></div>
        <div class="bt_cool" style="text-align:center; color:white;"></div>
        <ul></ul>
      </div>
    `,

    lpvm: `
      <div id="lpvm_Panel">
        <div class="sekcja lpvm_dragg">LISTY GOŃCZE</div>
        <div class='pvm_killed'>Wykonane listy: <b>0</b></div>
        <div class="lpvm_button lpvm_lpvm">START<b class="lpvm_status red">Off</b></div>
        <div class="lpvm_button lpvm_g">G-Born<b class="lpvm_status red">Off</b></div>
        <div class="lpvm_button lpvm_u">U-Born<b class="lpvm_status red">Off</b></div>
        <div class="lpvm_button lpvm_s">S-Born<b class="lpvm_status red">Off</b></div>
        <div class="lpvm_button lpvm_h">H-Born<b class="lpvm_status red">Off</b></div>
        <div class="lpvm_button lpvm_m">M-Born<b class="lpvm_status red">Off</b></div>
        <div class="lpvm_button lpvm_limit">Limit<b class="lpvm_status red">Off</b></div>
        <div class='gamee_input'><input style='width:120px; margin-left:-2px; background:grey;text-align:center;font-size:16;' type='text' placeholder="Enter text" name='lpvm_capt' value='60' /></div>
      </div>
    `,

    glebia: `
      <div id="glebia_Panel">
        <div class="sekcja glebia_dragg">GŁĘBIA</div>
        <div class='glebia_button glebia_toggle'>Start<b class='glebia_status red'>Off</b></div>
        <div class='glebia_button glebia_code'>Kody<b class='glebia_status red'>Off</b></div>
      </div>
    `
  },

  // ============================================
  // HELPER METHODS
  // ============================================

  getAllCSS() {
    return Object.values(this.css).join('\n');
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

    // Hide sub-panels initially
    $("#pvp_Panel").hide();
    $("#resp_Panel").hide();
    $("#code_Panel").hide();
    $("#res_Panel").hide();
    $("#lpvm_Panel").hide();
    $("#glebia_Panel").hide();

    // Make panels draggable
    $("#main_Panel").draggable({ handle: ".panel_dragg" });
    $("#pvp_Panel").draggable({ handle: ".pvp_dragg" });
    $("#resp_Panel").draggable({ handle: ".resp_dragg" });
    $("#res_Panel").draggable({ handle: ".res_dragg" });
    $("#lpvm_Panel").draggable({ handle: ".lpvm_dragg" });
    $("#code_Panel").draggable({ handle: ".code_dragg" });
    $("#glebia_Panel").draggable({ handle: ".glebia_dragg" });

    console.log('[AFO_Templates] All panels injected');
  }
};

// Export
window.AFO_Templates = AFO_Templates;
console.log('[AFO] Templates module loaded');
