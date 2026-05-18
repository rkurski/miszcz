/**
 * ============================================================================
 * AFO - Panel Templates
 * ============================================================================
 * 
 * CSS styles and HTML templates for all AFO panels.
 * Separated from logic for cleaner code organization.
 * 
 * Modern design with glassmorphism, gradients, and responsive layout.
 * Touch-friendly with viewport containment.
 * 
 * ============================================================================
 */

const AFO_Templates = {

  // ============================================
  // CSS STYLES - Modern Design System
  // ============================================

  css: {
    // Base/shared styles for all panels
    base: `
      /* ========================================
         AFO Design System - Base Variables
         ======================================== */
      :root {
        --afo-bg-primary: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        --afo-bg-header: linear-gradient(90deg, #0f4c75, #1b6ca8);
        --afo-bg-button: rgba(255, 255, 255, 0.05);
        --afo-bg-button-hover: rgba(63, 193, 201, 0.15);
        --afo-accent: #3fc1c9;
        --afo-accent-hover: #55efc4;
        --afo-danger: #ff6b6b;
        --afo-success: #2ed573;
        --afo-warning: #f9ca24;
        --afo-border: #0f4c75;
        --afo-text: #ffffff;
        --afo-text-muted: #b8b8b8;
        --afo-shadow: 0 0 25px rgba(63, 193, 201, 0.25);
        --afo-radius: 12px;
        --afo-radius-sm: 6px;
      }

      /* Status badge styles */
      .gh_status, .pvp_status, .resp_status, .code_status, 
      .lpvm_status, .glebia_status, .res_status {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .red { 
        background: rgba(255, 107, 107, 0.2); 
        color: #ff6b6b; 
      }
      .green { 
        background: rgba(46, 213, 115, 0.2); 
        color: #2ed573; 
      }

      /* Shared panel base */
      .afo-panel {
        background: var(--afo-bg-primary);
        position: fixed;
        z-index: 9999;
        padding: 0;
        border-radius: var(--afo-radius);
        border: 2px solid var(--afo-border);
        box-shadow: var(--afo-shadow);
        user-select: none;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        overflow: hidden;
        touch-action: none;
      }

      /* Panel header - using .afo-header to avoid conflict with game .sekcja */
      .afo-panel .afo-header {
        background: var(--afo-bg-header);
        padding: 10px 14px;
        color: var(--afo-accent);
        font-weight: bold;
        text-align: center;
        cursor: move;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: auto !important;
        height: auto !important;
        line-height: normal !important;
        margin: 0 !important;
        text-shadow: none !important;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .afo-panel .panel-content {
        padding: 8px;
      }

      .afo-panel .afo-button {
        cursor: pointer;
        text-align: left;
        padding: 10px 12px;
        color: white;
        border-radius: var(--afo-radius-sm);
        margin-bottom: 4px;
        background: var(--afo-bg-button);
        transition: all 0.2s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        border: none;
        width: 100%;
        box-sizing: border-box;
      }

      .afo-panel .afo-button:hover {
        background: var(--afo-bg-button-hover);
        transform: translateX(2px);
      }

      .afo-panel .afo-button:active {
        transform: scale(0.98);
      }

      .afo-panel .afo-input {
        width: 100%;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--afo-border);
        border-radius: var(--afo-radius-sm);
        color: white;
        font-size: 12px;
        text-align: center;
        margin-top: 4px;
        box-sizing: border-box;
      }

      .afo-panel .afo-input:focus {
        outline: none;
        border-color: var(--afo-accent);
        box-shadow: 0 0 0 2px rgba(63, 193, 201, 0.2);
      }

      .afo-panel .afo-input::placeholder {
        color: #666;
      }

      .afo-panel .afo-select {
        width: 100%;
        padding: 8px 10px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--afo-border);
        border-radius: var(--afo-radius-sm);
        color: white;
        font-size: 11px;
        margin-top: 4px;
        cursor: pointer;
      }

      .afo-panel .afo-select:focus {
        outline: none;
        border-color: var(--afo-accent);
      }

      .afo-panel .afo-select option {
        background: #1a1a2e;
        color: white;
      }

      /* Fix for newBtn text centering */
      .afo-panel button.newBtn,
      #daily_Panel button.newBtn,
      #ball_searcher_popup button.newBtn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        line-height: 1 !important;
      }

      /* Responsive styles */
      @media (max-width: 768px) {
        .afo-panel {
          max-width: 90vw !important;
        }
        
        .afo-panel .afo-header {
          padding: 8px 10px;
          font-size: 10px;
        }
        
        .afo-panel .afo-button {
          padding: 8px 10px;
          font-size: 11px;
        }
        
        .afo-panel .panel-content {
          padding: 6px;
        }
      }

      @media (max-width: 480px) {
        .afo-panel {
          max-width: 85vw !important;
          min-width: 140px !important;
        }
        
        .afo-panel .afo-button {
          padding: 6px 8px;
          font-size: 10px;
        }
      }
    `,

    main: `
      /* Main panel - special styling to distinguish from sub-panels */
      #main_Panel {
        top: 200px;
        right: 20px;
        width: 170px;
        min-width: 150px;
        border: 2px solid #1b6ca8;
        box-shadow: 0 0 30px rgba(63, 193, 201, 0.35), inset 0 0 20px rgba(63, 193, 201, 0.05);
      }

      #main_Panel .afo-header {
        background: linear-gradient(90deg, #1b6ca8, #3fc1c9);
        color: #ffffff;
        font-size: 12px;
        padding: 12px 14px;
      }
    `,

    pvp: `
      #pvp_Panel {
        top: 400px;
        right: 200px;
        width: 180px;
        min-width: 160px;
      }
    `,

    resp: `
      #resp_Panel {
        top: 400px;
        right: 200px;
        width: 180px;
        min-width: 160px;
        max-height: 80vh;
        overflow-y: auto;
      }

      #resp_Panel::-webkit-scrollbar {
        width: 6px;
      }

      #resp_Panel::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }

      #resp_Panel::-webkit-scrollbar-thumb {
        background: var(--afo-border);
        border-radius: 3px;
      }

      #resp_Panel::-webkit-scrollbar-thumb:hover {
        background: var(--afo-accent);
      }
    `,

    code: `
      #code_Panel {
        top: 400px;
        right: 200px;
        width: 200px;
        min-width: 180px;
      }

      #code_Panel .select-group {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      #code_Panel .select-label {
        color: var(--afo-text-muted);
        font-size: 10px;
        margin-bottom: 4px;
        display: block;
      }
    `,

    res: `
      #res_Panel {
        top: 400px;
        right: 400px;
        width: 170px;
        min-width: 150px;
      }

      #res_Panel .res-info {
        text-align: center;
        color: var(--afo-text-muted);
        font-size: 11px;
        padding: 8px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: var(--afo-radius-sm);
        margin-top: 8px;
      }

      #res_Panel ul {
        margin: 8px 0;
        padding: 0;
        list-style: none;
        color: white;
        text-align: center;
        font-size: 11px;
      }

      #res_Panel ul li {
        padding: 4px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
    `,

    lpvm: `
      #lpvm_Panel {
        top: 500px;
        right: 20px;
        width: 180px;
        min-width: 160px;
      }

      #lpvm_Panel .kill-counter {
        text-align: center;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: var(--afo-radius-sm);
        margin-bottom: 8px;
        color: var(--afo-accent);
        font-size: 12px;
      }

      #lpvm_Panel .kill-counter b {
        font-size: 16px;
        color: var(--afo-success);
      }
    `,

    glebia: `
      #glebia_Panel {
        top: 400px;
        right: 200px;
        width: 180px;
        min-width: 160px;
      }
    `,

    assist: `
      #assist_Panel {
        top: 400px;
        right: 200px;
        width: 200px;
        min-width: 180px;
      }

      #assist_Panel .select-group {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      #assist_Panel .select-label {
        color: var(--afo-text-muted);
        font-size: 10px;
        margin-bottom: 4px;
        display: block;
      }
    `
  },

  // ============================================
  // HTML TEMPLATES - Modern Structure
  // ============================================

  html: {
    main: `
      <div id="main_Panel" class="afo-panel">
        <div class="afo-header panel_dragg">🎮 GIENIOBOT</div>
        <div class="panel-content">
          <div class='afo-button gh_button gh_resp'>
            <span>⚔️ PVM</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_pvp'>
            <span>🗡️ PVP</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_lpvm'>
            <span>📜 Listy</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_res'>
            <span>💎 Zbierajka</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_code'>
            <span>🔑 Kody</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_low_lvls'>
            <span>👁️ Ukryj low</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_glebia'>
            <span>🔪 Głębia</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_daily'>
            <span>📅 Dzienne</span>
            <b class='gh_status red'>Off</b>
          </div>
          <div class='afo-button gh_button gh_assist'>
            <span>🤝 Asystent</span>
            <b class='gh_status red'>Off</b>
          </div>
        </div>
      </div>
    `,

    pvp: `
      <div id="pvp_Panel" class="afo-panel">
        <div class="afo-header pvp_dragg">🗡️ PVP</div>
        <div class="panel-content">
          <div class='afo-button pvp_button pvp_pvp'>
            <span>⚔️ PVP</span>
            <b class='pvp_status red'>Off</b>
          </div>
          <div class='afo-button pvp_button pvp_Code'>
            <span>🔑 Kody</span>
            <b class='pvp_status green'>On</b>
          </div>
          <div class="afo-button pvp_button pvpCODE_konto">
            <span>👤 Konto</span>
            <b class="pvp_status red">Off</b>
          </div>
          <div class='afo-button pvp_button pvp_rb_avoid'>
            <span>🛡️ Unikaj borny</span>
            <b class='pvp_status red'>Off</b>
          </div>
          <div class='afo-button pvp_button pvp_WI'>
            <span>🏰 Wojny Imp</span>
            <b class='pvp_status green'>On</b>
          </div>
          <div class='afo-button pvp_button pvp_WK'>
            <span>⚔️ Wojny Klan</span>
            <b class='pvp_status green'>On</b>
          </div>
          <div class='afo-button pvp_button pvp_buff_imp'>
            <span>💪 Bufy IMP</span>
            <b class='pvp_status red'>Off</b>
          </div>
          <div class='afo-button pvp_button pvp_buff_clan'>
            <span>💪 Bufy KLAN</span>
            <b class='pvp_status red'>Off</b>
          </div>
          <input class='afo-input' type='text' placeholder="Lista wojen" name='pvp_capt' value='' />
          <input class='afo-input' type='text' placeholder="Szybkość 10-100" name='speed_capt' value='50' />
        </div>
      </div>
    `,

    resp: `
      <div id="resp_Panel" class="afo-panel">
        <div class="afo-header resp_dragg">⚔️ PVM - SPAWN</div>
        <div class="panel-content">
          <div class="afo-button resp_button resp_resp">
            <span>▶️ RESP</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_code">
            <span>🔑 Kody</span>
            <b class="resp_status green">On</b>
          </div>
          <div class="afo-button resp_button resp_konto">
            <span>👤 Konto</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_sub">
            <span>🧪 Subka</span>
            <b class="resp_status green">On</b>
          </div>
          <div class="afo-button resp_button resp_ost">
            <span>💊 Jaka</span>
            <b class="resp_status green">Ost</b>
          </div>
          <div class="afo-button resp_button resp_multi">
            <span>👥 Multiwalka</span>
            <b class="resp_status green">On</b>
          </div>
          <div class="afo-button resp_button resp_ssj">
            <span>⚡ SSJ</span>
            <b class="resp_status green">On</b>
          </div>
          <div class="afo-button resp_button resp_buff_imp">
            <span>🏰 Bufki IMP</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_buff_clan">
            <span>⚔️ Bufki KLAN</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_blue">
            <span>🔵 BLUE</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_green">
            <span>🟢 GREEN</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_purple">
            <span>🟣 PURPLE</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_yellow">
            <span>🟡 YELLOW</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_red">
            <span>🔴 RED</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_dark">
            <span>⚫ DARK</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_magic">
            <span>✨ Wyciąg</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bless">
            <span>🙏 BŁOGO</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh1">
            <span>🐉 SMOK</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh2">
            <span>📈 5% EXP</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh3">
            <span>💪 5% MOC</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh4">
            <span>📊 150K MAX</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh5">
            <span>💪 5% MOC</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh6">
            <span>🎯 5% PSK</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh7">
            <span>🚀 200% EXP</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh8">
            <span>📈 500 LVL</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh9">
            <span>🌟 500% EXP</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh10">
            <span>💥 25% MOC</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh11">
            <span>📊 100% Limit</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh14">
            <span>📊 100% Limit</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh12">
            <span>📈 200% Przyrost</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh13">
            <span>🔥 300% Przyrost</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh15">
            <span>🔑 5% kod</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh16">
            <span>⏱️ 5 Min cd pvp</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh17">
            <span>⚡ 15% szybciej</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_bh18">
            <span>🍀 15% szansa</span>
            <b class="resp_status red">Off</b>
          </div>
          <div class="afo-button resp_button resp_on">
            <span>✅ Włącz All</span>
            <b class="resp_status green">On</b>
          </div>
          <div class="afo-button resp_button resp_off">
            <span>❌ Wyłącz All</span>
            <b class="resp_status red">Off</b>
          </div>
        </div>
      </div>
    `,

    code: `
      <div id="code_Panel" class="afo-panel">
        <div class="afo-header code_dragg">🔑 KODY</div>
        <div class="panel-content">
          <div class="afo-button code_button code_code">
            <span>▶️ KODY</span>
            <b class="code_status red">Off</b>
          </div>
          <div class="afo-button code_button code_acc">
            <span>👤 Konto</span>
            <b class="code_status red">Off</b>
          </div>
          <div class="afo-button code_button code_zast">
            <span>👥 Zastępstwa</span>
            <b class="code_status red">Off</b>
          </div>
          <div class="afo-button code_button code_bh1">
            <span>🎓 Błogo 250% tren</span>
            <b class="code_status red">Off</b>
          </div>
          <div class="afo-button code_button code_bh2">
            <span>🔑 Błogo 5% kod</span>
            <b class="code_status red">Off</b>
          </div>
          <div class="select-group">
            <label class='select-label'>Statystyka:</label>
            <select id='bot_what_to_train' class='afo-select'>
              <option value='1'>💪 Siła</option>
              <option value='2'>⚡ Szybkość</option>
              <option value='3'>🛡️ Wytrzymałość</option>
              <option value='4'>🧠 Siła Woli</option>
              <option value='5'>✨ Energia Ki</option>
              <option value='6'>🔮 Wtajemniczenie</option>
            </select>
          </div>
          <div class="select-group">
            <label class='select-label'>Czas treningu:</label>
            <select id='bot_what_to_traintime' class='afo-select'>
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
          </div>
        </div>
      </div>
    `,

    res: `
      <div id="res_Panel" class="afo-panel">
        <div class="afo-header res_dragg">💎 SUROWCE</div>
        <div class="panel-content">
          <div class="afo-button res_button res_res">
            <span>⛏️ ZBIERAJ</span>
            <b class="res_status red">Off</b>
          </div>
          <div class="res-info bt_cool"></div>
          <ul></ul>
        </div>
      </div>
    `,

    lpvm: `
      <div id="lpvm_Panel" class="afo-panel">
        <div class="afo-header lpvm_dragg">📜 LISTY GOŃCZE</div>
        <div class="panel-content">
          <div class='kill-counter pvm_killed'>Wykonane listy: <b>0</b></div>
          <div class="afo-button lpvm_button lpvm_lpvm">
            <span>▶️ START</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <div class="afo-button lpvm_button lpvm_g">
            <span>🔴 G-Born</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <div class="afo-button lpvm_button lpvm_u">
            <span>🔵 U-Born</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <div class="afo-button lpvm_button lpvm_s">
            <span>🟢 S-Born</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <div class="afo-button lpvm_button lpvm_h">
            <span>🟣 H-Born</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <div class="afo-button lpvm_button lpvm_m">
            <span>🟠 M-Born</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <div class="afo-button lpvm_button lpvm_limit">
            <span>📊 Limit</span>
            <b class="lpvm_status red">Off</b>
          </div>
          <input class='afo-input' type='text' placeholder="Ilość list" name='lpvm_capt' value='60' />
        </div>
      </div>
    `,

    glebia: `
      <div id="glebia_Panel" class="afo-panel">
        <div class="afo-header glebia_dragg">🔪 GŁĘBIA</div>
        <div class="panel-content">
          <div class='afo-button glebia_button glebia_toggle'>
            <span>▶️ Start</span>
            <b class='glebia_status red'>Off</b>
          </div>
          <div class='afo-button glebia_button glebia_code'>
            <span>🔑 Kody</span>
            <b class='glebia_status red'>Off</b>
          </div>
          <div class='afo-button glebia_button glebia_konto'>
            <span>👤 Konto</span>
            <b class='glebia_status red'>Off</b>
          </div>
          <div class='afo-button glebia_button glebia_sala'>
            <span>🏛️ Rajska Sala</span>
            <b class='glebia_status green'>On</b>
          </div>
          <div class='afo-button glebia_button glebia_rb_avoid'>
            <span>🛡️ Unikaj borny</span>
            <b class='glebia_status red'>Off</b>
          </div>
          <input class='afo-input' type='text' placeholder="Szybkość 10-100" name='glebia_speed' value='50' />
        </div>
      </div>
    `,

    assist: `
      <div id="assist_Panel" class="afo-panel">
        <div class="afo-header assist_dragg">🤝 ASYSTENT</div>
        <div class="panel-content">
          <div class='afo-button assist_button assist_train'>
            <span>🏋️ Trenuj</span>
            <b class='assist_status red'>Off</b>
          </div>
          <div class='afo-button assist_button assist_assist'>
            <span>🤝 Asystuj</span>
            <b class='assist_status red'>Off</b>
          </div>
          <div class="select-group">
            <label class='select-label'>Wybierz gracza:</label>
            <select id='assist_player_select' class='afo-select'>
              <option value="0">-</option>
            </select>
          </div>
        </div>
      </div>
    `
  },

  // ============================================
  // HELPER METHODS
  // ============================================

  getAllCSS() {
    return Object.values(this.css).join('\n');
  },

  /**
   * Make an element draggable with touch support and viewport containment
   * @param {HTMLElement} element - The element to make draggable
   * @param {HTMLElement} handle - The drag handle element
   */
  makeDraggable(element, handle) {
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

      // Bring to front
      document.querySelectorAll('.afo-panel').forEach(p => p.style.zIndex = '9999');
      element.style.zIndex = '10000';
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      let newX = clientX - offsetX;
      let newY = clientY - offsetY;

      // Viewport containment
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
    handle.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    // Touch events
    handle.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  },

  /**
   * Constrain all panels to viewport on window resize
   */
  setupViewportContainment() {
    const constrainPanel = (panel) => {
      if (!panel || panel.style.display === 'none') return;

      const rect = panel.getBoundingClientRect();
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;

      let needsUpdate = false;
      let newX = rect.left;
      let newY = rect.top;

      if (rect.left < 0) { newX = 0; needsUpdate = true; }
      if (rect.top < 0) { newY = 0; needsUpdate = true; }
      if (rect.left > maxX) { newX = Math.max(0, maxX); needsUpdate = true; }
      if (rect.top > maxY) { newY = Math.max(0, maxY); needsUpdate = true; }

      if (needsUpdate) {
        panel.style.left = newX + 'px';
        panel.style.top = newY + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
      }
    };

    window.addEventListener('resize', () => {
      document.querySelectorAll('.afo-panel').forEach(constrainPanel);
    });
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
    $("body").append(this.html.assist);

    // Hide sub-panels initially
    $("#pvp_Panel").hide();
    $("#resp_Panel").hide();
    $("#code_Panel").hide();
    $("#res_Panel").hide();
    $("#lpvm_Panel").hide();
    $("#glebia_Panel").hide();
    $("#assist_Panel").hide();

    // Setup custom draggable with touch support and viewport containment
    this.makeDraggable(document.getElementById('main_Panel'), document.querySelector('.panel_dragg'));
    this.makeDraggable(document.getElementById('pvp_Panel'), document.querySelector('.pvp_dragg'));
    this.makeDraggable(document.getElementById('resp_Panel'), document.querySelector('.resp_dragg'));
    this.makeDraggable(document.getElementById('res_Panel'), document.querySelector('.res_dragg'));
    this.makeDraggable(document.getElementById('lpvm_Panel'), document.querySelector('.lpvm_dragg'));
    this.makeDraggable(document.getElementById('code_Panel'), document.querySelector('.code_dragg'));
    this.makeDraggable(document.getElementById('glebia_Panel'), document.querySelector('.glebia_dragg'));
    this.makeDraggable(document.getElementById('assist_Panel'), document.querySelector('.assist_dragg'));

    // Setup viewport containment on resize
    this.setupViewportContainment();

    console.log('[AFO_Templates] All panels injected with modern UI');
  }
};

// Export
window.AFO_Templates = AFO_Templates;
console.log('[AFO] Templates module loaded');
