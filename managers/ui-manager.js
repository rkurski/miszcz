/**
 * Gieniobot Master - UI Manager
 * Centralized DOM manipulation and UI updates
 */

class UIManager {
  constructor(settings, socketService) {
    this.settings = settings;
    this.socket = socketService;

    // State
    this.additionalTopBarVisible = false;
    this.baselinePower = undefined;
    this.baselineLevel = undefined;

    // Counters
    this.arenaCount = 0;
    this.pvpCount = 0;

    // Version
    this.version = VERSION || '2.0.0';
  }

  /**
   * Initialize UI components
   */
  init() {
    console.log('[UIManager] Starting init...');
    console.log('[UIManager] top_bar exists:', !!document.getElementById('top_bar'));
    console.log('[UIManager] changeProfile exists:', !!document.getElementById('changeProfile'));
    console.log('[UIManager] map_canvas_container exists:', !!document.getElementById('map_canvas_container'));
    console.log('[UIManager] mob_spawner_go exists:', !!document.querySelector('.MoveIcon[data-option="mob_spawner_go"]'));

    this._createStylesheet();
    this._createTopBar();
    this._createSecondaryStats();
    this._createCardSets();
    this._createSpawnSettings();
    this._createLocationInfo();
    this._setupUIElements();
    this._startUpdateLoop();

    console.log('[UIManager] Init complete. kws_top_bar created:', !!document.querySelector('.kws_top_bar'));
  }

  /**
   * Create main stylesheet element
   * @private
   */
  _createStylesheet() {
    if (!document.getElementById('kwsCSS')) {
      const style = document.createElement('style');
      style.id = 'kwsCSS';
      document.head.appendChild(style);
    }
  }

  /**
   * Create top bar elements
   * @private
   */
  _createTopBar() {
    const topBar = document.getElementById('top_bar');
    if (!topBar) return;

    // Remove ads
    const adv = topBar.querySelector('.adv');
    if (adv) adv.remove();

    // Add custom top bars
    if (!document.querySelector('.kws_top_bar')) {
      topBar.insertAdjacentHTML('beforeend', '<div class="kws_top_bar"></div>');
      topBar.insertAdjacentHTML('beforeend', '<div class="kws_additional_top_bar"></div>');
    }
  }

  /**
   * Create secondary stats display
   * @private
   */
  _createSecondaryStats() {
    const secondaryStats = document.getElementById('secondary_char_stats');
    if (!secondaryStats || secondaryStats.querySelector('.instance')) return;

    secondaryStats.insertAdjacentHTML('beforeend', `
            <div class="instance" data-toggle="tooltip" 
                 data-original-title="<div class=tt>Instancje<br /><span class=&quot;red&quot;><b>Kliknij by wykonać instancje</b></span></div>">
                <i class="ico a11"></i>
                <span><ul></ul></span>
            </div>
            <div class="activities" data-toggle="tooltip" 
                 data-original-title="<div class=tt>Aktywności<br /><span class=&quot;red&quot;><b>Kliknij by odebrać aktywności</b></span></div>">
                <i class="ico a12"></i>
                <span><ul></ul></span>
            </div>
        `);
  }

  /**
   * Create card sets UI
   * @private
   */
  _createCardSets() {
    const topBar = document.getElementById('top_bar');
    if (!topBar || document.getElementById('sc_setss')) return;

    topBar.insertAdjacentHTML('beforeend', `
            <div id="sc_setss">
                <div id="sc_sett0" class="option sc_setss_all current" data-option="change_sc_set" data-set="0">I</div>
                <div id="sc_sett1" class="option sc_setss_all" data-option="change_sc_set" data-set="1">II</div>
                <div id="sc_sett2" class="option sc_setss_all" data-option="change_sc_set" data-set="2">III</div>
                <div id="sc_sett3" class="option sc_setss_all" data-option="change_sc_set" data-set="3">IV</div>
                <div id="sc_sett4" class="option sc_setss_all" data-option="change_sc_set" data-set="4">V</div>
            </div>
        `);

    // Hide initially until char loaded
    document.getElementById('sc_setss').style.display = 'none';
  }

  /**
   * Create spawn settings panel
   * @private
   */
  _createSpawnSettings() {
    const mapContainer = document.getElementById('map_canvas_container');
    if (!mapContainer || document.getElementById('kws_spawn')) return;

    const spawnHTML = this._generateSpawnList();
    mapContainer.insertAdjacentHTML('beforeend', `
            <div id="kws_spawn">
                <div class="sekcja">
                    <img src="/gfx/layout/war.png" class="spawn_switch">
                    USTAWIENIA SPAWNU
                </div>
                <div id="kws_spawn2">${spawnHTML}</div>
            </div>
        `);
  }

  /**
   * Generate spawn settings list HTML
   * @private
   */
  _generateSpawnList() {
    let html = '';
    for (let i = 0; i < 6; i++) {
      const checked = GAME.spawner && GAME.spawner[1] && GAME.spawner[1][i] ? 'checked' : '';
      html += `
                <div class="spawn_row">
                    <div class="newCheckbox">
                        <input id="kws_spawner_ignore_${i}" type="checkbox" 
                               class="kws_spawner_check" name="ignoreMobs" 
                               value="${i}" ${checked} />
                        <label for="kws_spawner_ignore_${i}"></label>
                    </div>
                    ${typeof LNG !== 'undefined' ? LNG.lab457 : 'Ignoruj'}&nbsp;
                    <b>${typeof LNG !== 'undefined' ? LNG['mob_rank' + i] : 'Rang ' + i}</b>
                </div>
            `;
    }
    html += `
            <div class="spawn_row" style="flex-direction: column; align-items: center;">
                <div>Użyte PA na spawn</div>
                <div class="game_input small">
                    <input id="kws_pa_max" name="usePaToSpawn" type="text" value="1000">
                </div>
            </div>
        `;
    return html;
  }

  /**
   * Create location info panel
   * @private
   */
  _createLocationInfo() {
    const minimapCon = document.getElementById('minimap_con');
    if (!minimapCon || document.getElementById('kws_locInfo')) return;

    const minimapSettings = this.settings.getMinimap();
    const display = minimapSettings.loc_info === 0 ? 'none' : 'block';

    minimapCon.insertAdjacentHTML('beforeend', `
            <div id="kws_locInfo" style="display: ${display}">
                <div class="sekcja">INFORMACJE O LOKACJI</div>
                <div class="content"></div>
            </div>
        `);
  }

  /**
   * Setup additional UI elements
   * @private
   */
  _setupUIElements() {
    // Profile navigation buttons
    this._addProfileNavButtons();

    // Map action buttons
    this._addMapActionButtons();

    // Clan buttons
    this._addClanButtons();

    // Quick bar icons (AFO, Arena, Abyss)
    this._setupQuickBarOverride();

    // Select default bless type
    const blessType2 = document.getElementById('bless_type_2');
    if (blessType2) blessType2.click();

    // Enhance chat loading button
    const chatLoadBtn = document.querySelector('.channel_opts .option.chat_icon.load');
    if (chatLoadBtn) {
      chatLoadBtn.classList.add('better_chat_loading');
      chatLoadBtn.removeAttribute('id');
      chatLoadBtn.removeAttribute('data-option');
    }
  }

  /**
   * Override GAME.parseQuickBar to add custom icons
   * @private
   */
  _setupQuickBarOverride() {
    if (typeof GAME === 'undefined' || !GAME.parseQuickBar) return;

    const originalParseQuickBar = GAME.parseQuickBar.bind(GAME);
    const self = this;

    GAME.parseQuickBar = function (newq_bar) {
      // Call original function
      originalParseQuickBar(newq_bar);

      // Add our custom icons to quick_bar
      const quickBar = document.getElementById('quick_bar');
      if (!quickBar) return;

      // Check if we already added our icons
      if (quickBar.querySelector('.manage_autoExpeditions')) return;

      // Add AFO icon
      const afoIcon = `<div class="qlink load_afo" style="filter:hue-rotate(168deg);background-image: url('https://i.imgur.com/P8sJgQz.png');" data-toggle="tooltip" data-original-title="<div class=tt>Załaduj AFO</div>"></div>`;

      // Add Abyss icon
      const abyssIcon = `<div class="qlink sideIcons manage_auto_abyss" style="filter:hue-rotate(168deg);background-image: url('https://i.imgur.com/j5eQv2B.png');display:block;top:-136px;position:absolute;" data-toggle="tooltip" data-original-title="<div class=tt>[Włącz / Wyłącz] Atakowanie Otchłani</div>"></div>`;

      // Add Arena icon
      const arenaIcon = `<div class="qlink sideIcons manage_auto_arena" style="filter:hue-rotate(168deg);background-image: url('https://i.imgur.com/rAroNzD.png');display:block;top:-104px;position:absolute;" data-toggle="tooltip" data-original-title="<div class=tt>[Włącz / Wyłącz] Atakowanie na Arenie</div>"></div>`;

      // Add Expeditions icon
      const expeditionsIcon = `<div class="qlink sideIcons manage_autoExpeditions" style="filter:hue-rotate(168deg);background-image: url('https://i.imgur.com/uSMzLBb.png');display:block;top:-72px;position:absolute;" data-toggle="tooltip" data-original-title="<div class=tt>[Włącz / Wyłącz] Automatyczne Wyprawy</div>"></div>`;

      // Add codes checkbox
      const codesHtml = `<div class="autoExpeCodes"><div style="padding-left:8px;"><label for="aeCodes" style="cursor:pointer;">KODY</label><div class="newCheckbox"><input type="checkbox" id="aeCodes" name="aeCodes" /><label for="aeCodes"></label></div></div></div>`;

      quickBar.insertAdjacentHTML('beforeend', afoIcon + abyssIcon + arenaIcon + expeditionsIcon + codesHtml);

      // Rebind tooltips if available
      if (typeof tooltip_bind === 'function') tooltip_bind();
    };

    // Trigger initial parse if char loaded
    if (GAME.char_id) {
      GAME.parseQuickBar(true);
    }
  }

  /**
   * Add profile navigation buttons
   * @private
   */
  _addProfileNavButtons() {
    const changeProfile = document.getElementById('changeProfile');
    if (!changeProfile || document.getElementById('changeProfilePrev')) return;

    changeProfile.insertAdjacentHTML('beforebegin',
      '<button id="changeProfilePrev" class="btn_small_gold" data-option="prevChar">Prev</button>'
    );
    changeProfile.insertAdjacentHTML('afterend',
      '<button id="changeProfileNext" class="btn_small_gold" data-option="nextChar">Next</button>'
    );
  }

  /**
   * Add map action buttons
   * @private
   */
  _addMapActionButtons() {
    const mobSpawner = document.querySelector('.MoveIcon[data-option="mob_spawner_go"]');
    if (!mobSpawner) return;

    // Multi PvP button
    if (!document.querySelector('[data-option="map_multi_pvp"]')) {
      mobSpawner.insertAdjacentHTML('afterend', `
                <div class="MoveIcon bigg option" data-option="map_multi_pvp" 
                     data-toggle="tooltip" 
                     data-original-title="<div class=tt>Multiwalka PvP<br />Klawisz skrótu:<b class=orange>B</b></div>">
                    <img src="https://i.imgur.com/QPQBcFp.png">
                </div>
            `);
    }

    // Quest skip button
    const multiPvp = document.querySelector('[data-option="map_multi_pvp"]');
    if (multiPvp && !document.querySelector('[data-option="map_quest_skip"]')) {
      multiPvp.insertAdjacentHTML('afterend', `
                <div class="MoveIcon bigg option" data-option="map_quest_skip" 
                     data-toggle="tooltip" 
                     data-original-title="<div class=tt>Opcja Dalej w otwartym zadaniu<br />Klawisz skrótu:<b class=orange>X</b></div>">
                    <img src="https://i.imgur.com/wuK91VF.png">
                </div>
            `);
    }

    // Time skip button
    const questSkip = document.querySelector('[data-option="map_quest_skip"]');
    if (questSkip && !document.querySelector('[data-option="map_quest_skip_time"]')) {
      questSkip.insertAdjacentHTML('afterend', `
                <div class="MoveIcon bigg option" data-option="map_quest_skip_time" 
                     data-toggle="tooltip" 
                     data-original-title="<div class=tt>Używanie zegarków w zadaniach<br />Klawisz skrótu:<b class=orange>N</b></div>">
                    <img src="https://i.imgur.com/9YCvJKe.png">
                </div>
            `);
    }

    // Alternative pilot button
    const timeSkip = document.querySelector('[data-option="map_quest_skip_time"]');
    if (timeSkip && !document.querySelector('[data-option="map_alternative_pilot"]')) {
      timeSkip.insertAdjacentHTML('afterend', `
                <div class="MoveIcon bigg option" data-option="map_alternative_pilot" 
                     data-toggle="tooltip" 
                     data-original-title="<div class=tt>Ukryje pilota, pokazuje inną klawiaturę<br />Klawisz skrótu:<b class=orange>=</b></div>">
                    <img src="https://up.be3.ovh/upload/1709400449.png">
                </div>
            `);
    }
  }

  /**
   * Add clan utility buttons
   * @private
   */
  _addClanButtons() {
    // Free assist button
    const assistAllBtn = document.querySelector('button[data-option="clan_assist_all"]');
    if (assistAllBtn && !document.querySelector('.free_assist_for_all')) {
      assistAllBtn.insertAdjacentHTML('beforebegin',
        '<button class="newBtn free_assist_for_all" style="margin-right:5px;">Asystuj wszystkim za darmo</button>'
      );
    }

    // Auto bless button
    const grantBuffBtn = document.querySelector('button[data-option="grant_buff"]');
    if (grantBuffBtn && !document.querySelector('.auto_bless')) {
      grantBuffBtn.insertAdjacentHTML('beforebegin',
        '<button class="gold_button auto_bless">AUTOMAT</button>'
      );
    }

    // Auto knowledge button
    const showKnowBtn = document.querySelector('button[data-option="show_know2"]');
    if (showKnowBtn && !document.querySelector('.auto_know')) {
      showKnowBtn.insertAdjacentHTML('beforebegin',
        '<button class="gold_button auto_know">AUTOMATY</button>'
      );
    }

    // Activate all clan buffs button
    const clanWarsHeader = document.querySelector('#clan_inner_wars h3');
    if (clanWarsHeader && !document.querySelector('.activate_all_clan_buffs')) {
      clanWarsHeader.insertAdjacentHTML('beforeend',
        ' <button class="newBtn activate_all_clan_buffs">Aktywuj wszystkie buffy</button>'
      );
    }

    // Show teleport room button
    const clanPlanetsHeader = document.querySelector('#clan_inner_planets h3');
    if (clanPlanetsHeader && !document.getElementById('poka_telep')) {
      clanPlanetsHeader.insertAdjacentHTML('beforeend',
        '<button id="poka_telep" style="margin-left:5px;" class="newBtn">pokaż / ukryj salę telep</button>'
      );
    }
  }

  /**
   * Start the update loop for dynamic content
   * @private
   */
  _startUpdateLoop() {
    setInterval(() => {
      if (typeof GAME !== 'undefined' && GAME.char_data) {
        this.updateTopBar();
      }
    }, 1000);
  }

  /**
   * Update top bar content
   */
  updateTopBar() {
    if (!GAME.char_data) return;

    const topBar = document.querySelector('.kws_top_bar');
    if (!topBar) return;

    // Calculate stats
    const skStatus = this._getSkStatus();
    const trainUprg = this._getTrainUpgradeStatus();
    const lvlPerHour = this._calculateLevelsPerHour();
    const latencyInfo = this._getLatencyInfo();

    // Instance count
    const instances = this._getInstanceCount();

    // Activity info
    const activity = document.getElementById('char_activity')?.textContent || '0';
    const activityReceived = document.querySelectorAll('#act_prizes div.act_prize.disabled').length;

    // Trader info (Saturday only)
    const isTraderDay = new Date().getDay() === 6;
    const traderHtml = isTraderDay ?
      `<span class='kws_top_bar_section trader_info' style='cursor:pointer;'>HANDLARZ</span> ` : '';

    // Build HTML
    const html = `
            <span class='kws_top_bar_section sk_info' style='cursor:pointer;'>
                SK: <span style="color:${skStatus === 'AKTYWNE' ? 'lime' : 'white'};">${skStatus}</span>
            </span>
            <span class='kws_top_bar_section train_upgr_info' style='cursor:pointer;'>
                KODY: <span style="color:${trainUprg === 'AKTYWNE' ? 'lime' : 'white'};">${trainUprg}</span>
            </span>
            <span class='kws_top_bar_section lvl' style='cursor:pointer;'>
                LVL: <span>${lvlPerHour}/H</span>
            </span>
            <span class='kws_top_bar_section pvp' style='cursor:pointer;'>
                PVP: <span>${this.pvpCount}</span>
            </span>
            <span class='kws_top_bar_section arena' style='cursor:pointer;'>
                ARENA: <span>${this.arenaCount}</span>
            </span>
            ${traderHtml}
            <span class='kws_top_bar_section additional_stats' style='cursor:pointer;color:${this.additionalTopBarVisible ? 'orange' : 'white'}'>
                STATY
            </span>
            <span class='kws_top_bar_section version' style='cursor:pointer;'>
                v<span>${this.version}</span>
            </span>
            ${latencyInfo}
        `;

    topBar.innerHTML = html;

    // Update secondary stats
    this._updateSecondaryStats(instances, activity, activityReceived);

    // Update additional top bar if visible
    if (this.additionalTopBarVisible) {
      this._updateAdditionalTopBar();
    }
  }

  /**
   * Get SK (ball) status
   * @private
   */
  _getSkStatus() {
    const skTimer = document.querySelector(`#mdbp_${GAME.char_data.reborn} .timer`);
    return skTimer ? skTimer.textContent : 'AKTYWNE';
  }

  /**
   * Get training upgrade status
   * @private
   */
  _getTrainUpgradeStatus() {
    const trainTimer = document.querySelector('#train_uptime .timer');
    const timerText = trainTimer?.textContent || '';
    return (!timerText || timerText === '00:00:00') ? 'AKTYWNE' : timerText;
  }

  /**
   * Calculate levels gained per hour
   * @private
   */
  _calculateLevelsPerHour() {
    const currentLevel = GAME.char_data.level;
    const startLevel = GAME.startLevel || currentLevel;
    const startTime = GAME.startTime || Date.now();

    const levelsGained = currentLevel - startLevel;
    const hoursElapsed = (Date.now() - startTime) / 1000 / 60 / 60;

    return hoursElapsed > 0 ? (levelsGained / hoursElapsed).toFixed(2) : '0.00';
  }

  /**
   * Get latency display info
   * @private
   */
  _getLatencyInfo() {
    const latency = this.socket?.getLatency() || -1;
    const color = this.socket?.getLatencyColor() || 'white';
    return `<span class='kws_top_bar_section latencyElement' style='cursor:pointer;color:${color}'>⇅${latency}</span>`;
  }

  /**
   * Get instance count
   * @private
   */
  _getInstanceCount() {
    const cd = GAME.char_data;
    return [cd.icd_1, cd.icd_2, cd.icd_3, cd.icd_4, cd.icd_5, cd.icd_6]
      .reduce((a, b) => a + b, 0);
  }

  /**
   * Update secondary stats display
   * @private
   */
  _updateSecondaryStats(instances, activity, received) {
    const instanceEl = document.querySelector('#secondary_char_stats .instance ul');
    const activityEl = document.querySelector('#secondary_char_stats .activities ul');

    if (instanceEl) instanceEl.textContent = `${instances}/12`;
    if (activityEl) activityEl.textContent = `${activity}/185 (${received}/5)`;
  }

  /**
   * Update additional top bar content
   * @private
   */
  _updateAdditionalTopBar() {
    const additionalBar = document.querySelector('.kws_additional_top_bar');
    if (!additionalBar) return;

    // Initialize baseline values
    if (this.baselinePower === undefined) {
      this.baselinePower = GAME.char_data.moc;
    }
    if (this.baselineLevel === undefined) {
      this.baselineLevel = GAME.char_data.level;
    }

    const powerGained = GAME.dots(GAME.char_data.moc - this.baselinePower);
    const levelsGained = GAME.dots(GAME.char_data.level - this.baselineLevel);
    const futureStats = this._prepareFutureStatsData();
    const psk = GAME.dots(GAME.char_data.minor_ball);

    additionalBar.innerHTML = `
            <span class='kws_additional_top_bar_section pvm_power' style='cursor:pointer;'>
                ZDOBYTA MOC: <span style="color:lime;">${powerGained}</span>
            </span>
            <span class='kws_additional_top_bar_section future_stats' style='cursor:pointer;'>
                ${futureStats}
            </span>
            <span class='kws_additional_top_bar_section lvlsGained' style='cursor:pointer;'>
                ZDOBYTE LVL: <span>${levelsGained}</span>
            </span>
            <span class='kws_additional_top_bar_section psk' style='cursor:pointer;'>
                PSK: ${psk}
            </span>
            <span class='kws_additional_top_bar_section additional_stats_reset' style='cursor:pointer;color:white'>
                RESET
            </span>
        `;
  }

  /**
   * Prepare future stats data based on reborn level
   * @private
   */
  _prepareFutureStatsData() {
    const s = GAME.char_data;
    const L = typeof LNG !== 'undefined' ? LNG : {};

    switch (s.reborn) {
      case 0: {
        const moc = s.sila + s.szyb + s.wytrz + s.swoli + s.ki;
        const fb = Math.round(moc / 10000000, 3);
        return `${L.lab166 || 'FB'}: <span class="orange">${GAME.dots(fb)}</span>`;
      }
      case 1: {
        const expm = Math.round(s.exp / 5000);
        const mocm = Math.round(s.moc / 10);
        const fb = expm + mocm;
        return `${L.lab167 || 'FB'}: <span class="orange">${GAME.dots(fb)}</span>`;
      }
      case 2: {
        const moc = s.sila + s.szyb + s.wytrz + s.swoli + s.ki;
        const mocm = Math.min(Math.round(moc / 100000000000), 1000);
        const wsplm = Math.min(Math.round(s.reborn_bonus / 100), 1000);
        const ps = mocm + wsplm;
        const fb = Math.round(s.god / 10000);
        return `${L.lab168 || 'BKI'}: <span class="orange">${GAME.dots(fb)}</span> PS: <span class="orange">${GAME.dots(ps)}</span>`;
      }
      case 3: {
        let gki = 1000;
        const wtam = Math.floor(s.wta / 100000000000);
        const moc = s.sila + s.szyb + s.wytrz + s.swoli + s.ki;
        const mocm1 = Math.round(moc / 10000000000000);
        gki = Math.min(gki + wtam + mocm1, 1000000);
        return `${L.lab169 || 'GKI'}: <span class="orange">${GAME.dots(gki)}</span>`;
      }
      case 4: {
        let ins = 10;
        const wtam = Math.floor(s.wta / 1000000000000);
        const gkid = s.gki / 1000;
        ins = Math.min(ins + wtam + gkid, 100000);
        return `${L.lab434 || 'INS'}: <span class="orange">${GAME.dots(ins)}</span>`;
      }
      default:
        return '';
    }
  }

  // =============== PUBLIC METHODS ===============

  /**
   * Toggle additional top bar visibility
   */
  toggleAdditionalTopBar() {
    this.additionalTopBarVisible = !this.additionalTopBarVisible;

    const gameWin = document.getElementById('game_win');
    const topBar = document.getElementById('top_bar');
    const additionalBar = document.querySelector('.kws_additional_top_bar');

    if (this.additionalTopBarVisible) {
      if (gameWin) gameWin.style.marginTop = '30px';
      if (topBar) topBar.style.height = '60px';
      if (additionalBar) {
        additionalBar.style.marginTop = '30px';
        additionalBar.style.display = 'block';
      }
      this._updateAdditionalTopBar();
    } else {
      if (additionalBar) additionalBar.style.display = 'none';
      if (topBar) topBar.style.height = '30px';
      if (gameWin) gameWin.style.marginTop = '0px';
    }
  }

  /**
   * Reset calculated power baseline
   */
  resetCalculatedPower() {
    this.baselinePower = undefined;
    this.baselineLevel = undefined;
  }

  /**
   * Increment arena counter
   */
  incrementArenaCount() {
    this.arenaCount++;
  }

  /**
   * Increment PvP counter
   */
  incrementPvpCount() {
    this.pvpCount++;
  }

  /**
   * Update card set names in UI
   * @param {number} charId - Character ID
   */
  updateCardSetNames(charId) {
    const names = this.settings.getCardSetNames(charId);
    names.forEach((name, i) => {
      const scSet = document.querySelector(`#sc_sets div[data-set="${i}"]`);
      const scSett = document.querySelector(`#sc_setss div[data-set="${i}"]`);
      if (scSet) scSet.textContent = name;
      if (scSett) scSett.textContent = name;
    });
  }

  /**
   * Show card sets UI
   */
  showCardSets() {
    const scSetss = document.getElementById('sc_setss');
    if (scSetss) scSetss.style.display = '';
  }

  /**
   * Set active card set in UI
   * @param {number} setIndex - Set index (0-4)
   */
  setActiveCardSet(setIndex) {
    document.querySelectorAll('.sc_setss_all').forEach(el => el.classList.remove('current'));
    const activeSet = document.getElementById(`sc_sett${setIndex}`);
    if (activeSet) activeSet.classList.add('current');
  }
}
