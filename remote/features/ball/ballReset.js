// Ball reset system: normal ball + angel ball + pet bonus reset.
// Contains 3 IIFEs: BALL_RESET, BALL_ANGEL_RESET, PET_BONUS_RESET.

// ============================================================
// 1. BALL_RESET - Normal ball stat reset
//    Find desired stat combinations via response-driven loop.
//    Supports presets: save/load/delete combination configs.
// ============================================================
(function () {
  'use strict';

  const PRESETS_KEY = 'ball_reset_presets';

  // All available bonus IDs and labels for normal ball
  const ALL_BONUSES = [
    { id: 13, bonus: '% do obrażeń' },
    { id: 14, bonus: '% do redukcji obrażeń' },
    { id: 15, bonus: '% do efektywności treningu' },
    { id: 16, bonus: '% do doświadczenia' },
    { id: 17, bonus: '% do szansy na trafienie krytyczne' },
    { id: 18, bonus: '% do redukcji szansy na otrzymanie trafienia krytycznego' },
    { id: 51, bonus: '% do obrażeń od technik' },
    { id: 52, bonus: '% redukcji obrażeń od technik' },
    { id: 53, bonus: '% do szansy na moc z walk PvM' },
    { id: 54, bonus: '% do ilości mocy z walk PvM' },
    { id: 55, bonus: '% do szansy na zdobycie przedmiotu z walk PvM' },
    { id: 56, bonus: 'minut(a) krótsze wyprawy' },
    { id: 57, bonus: '% do szansy powodzenia wypraw' },
    { id: 58, bonus: '% do szansy na ulepszenie przedmiotów' },
    { id: 59, bonus: '% do szansy na połączenie przedmiotów' },
    { id: 60, bonus: '% do obrażeń od trafień krytycznych' },
    { id: 61, bonus: '% redukcji obrażeń od trafień krytycznych' },
    { id: 62, bonus: '% do mocy za wygrane walki wojenne' },
    { id: 63, bonus: '% do skuteczności podpaleń' },
    { id: 64, bonus: '% do skuteczności krwawień' },
    { id: 65, bonus: '% do odporności na podpalenia' },
    { id: 66, bonus: '% do odporności na krwawienia' },
    { id: 67, bonus: '% do szansy na zdobycie PSK' },
    { id: 68, bonus: '% do punktów PvP za wygrane walki' },
    { id: 69, bonus: '% do szansy na 3x więcej punktów PvP za wygrane walki' },
    { id: 70, bonus: '% do szansy na 3x więcej doświadczenia za wygrane walki PvM' },
    { id: 71, bonus: '% do mocy za skompletowanie SK' },
    { id: 72, bonus: '% do mocy za skompletowanie PSK' },
    { id: 73, bonus: 'minut(y) do czasu trwania błogosławieństw' },
    { id: 74, bonus: '% do szansy na spotkanie legendarnych potworów' },
    { id: 75, bonus: 'minut(y) krótszy cooldown między walkami PvP' },
    { id: 76, bonus: '% zwiększenie własnej szybkości' },
    { id: 77, bonus: '% obniżenie szybkości przeciwnika' },
    { id: 78, bonus: '% do szansy na zdobycie Niebieskiego Senzu' },
    { id: 79, bonus: '% mniejsze obrażenia od podpaleń' },
    { id: 80, bonus: '% mniejsze obrażenia od krwawień' },
    { id: 81, bonus: '% do szansy na zdobycie Scoutera' },
    { id: 91, bonus: '% do wtajemniczenia' },
    { id: 99, bonus: '% większy limit dzienny Niebieskich Senzu' },
    { id: 139, bonus: '% do ilości zdobywanych kryształów instancji' },
    { id: 140, bonus: '% do przyrostu Punktów Akcji' },
    { id: 154, bonus: '% do sławy za walki w wojnach imperiów' },
    { id: 160, bonus: '% do boskiego atrybutu przewodniego' },
    { id: 163, bonus: '% więcej Boskiej Ki za CSK' },
    { id: 171, bonus: '% do max Punktów Akcji' }
  ];

  const CSS = `
        #ballResetPanel {
            position: absolute; top: 35px; right: 10px; z-index: 9999999;
            width: 445px; max-width: 95vw; padding: 5px;
            background: #303131bd; border: solid #ffffff7a 1px; border-radius: 5px;
            display: none; user-select: none;
            max-height: 80vh; overflow-y: auto;
        }
        #ballResetPanel .close-panel {
            position: absolute; top: 5px; right: 5px; cursor: pointer;
            font-size: 20px; font-weight: bold; color: #fff;
            width: 24px; height: 24px; text-align: center; line-height: 22px;
            background: #8b0000; border-radius: 3px;
        }
        #ballResetPanel .close-panel:hover { background: #b00000; }
        #ballResetPanel .preset-bar {
            display: flex; gap: 4px; margin-bottom: 4px; flex-wrap: wrap;
        }
        #ballResetPanel .preset-bar select {
            flex: 1; min-width: 120px; background: #040e13; color: #fff;
            border: 1px solid #6f6f6f; border-radius: 3px; padding: 4px; font-size: 13px;
        }
        #ballResetPanel .preset-bar input {
            flex: 1; min-width: 100px; background: #040e13; color: #fff;
            border: 1px solid #6f6f6f; border-radius: 3px; padding: 4px; font-size: 13px;
        }
        #ballResetPanel .preset-bar button {
            background: #305779; color: #fff; border: 1px solid #6f6f6f;
            border-radius: 3px; cursor: pointer; font-size: 12px; padding: 4px 8px;
            white-space: nowrap;
        }
        #ballResetPanel .preset-bar button:hover { background: #4a7aa5; }
        #ballResetPanel .preset-bar button.delete { background: #8b0000; }
        #ballResetPanel .preset-bar button.delete:hover { background: #b00000; }
        #ballResetPanel .controller {
            display: flex; flex-direction: column; align-items: stretch; margin-bottom: 2px;
        }
        #ballResetPanel .controller button {
            font-weight: bolder; border: solid black 1px; cursor: pointer; min-height: 44px;
        }
        #ballResetPanel .controller button.green { background: lime; color: black !important; }
        #ballResetPanel .controller button.red { background: red; color: black !important; }
        #ballResetPanel .controller button:first-child { border-bottom: none; background: #afd4f5; color: black !important; }
        #ballResetPanel .controller button:disabled { opacity: 1; background: gray; cursor: not-allowed; }
        #ballResetPanel .ballCombination {
            background: #dfdfdc5c; padding: 5px; margin-bottom: 2px;
        }
        #ballResetPanel .ballCombination .combinationID {
            text-align: center; background: black; color: white;
            font-weight: bolder; font-size: 16px; padding: 1px; margin-bottom: 2px;
        }
        #ballResetPanel .ballCombination select {
            margin-bottom: 2px; background: #ffffff99; border: solid #6f6f6f 1px;
            border-radius: 5px; color: black; width: 100%; font-size: 14px; padding: 4px;
        }
        @media (max-width: 600px) {
            #ballResetPanel { width: 95vw; right: 2.5vw; top: 10px; }
            #ballResetPanel select { font-size: 16px; padding: 8px; }
            #ballResetPanel button { min-height: 48px; font-size: 16px; }
        }
    `;

  const BALL_RESET = {
    isRunning: false,
    combinations: [],
    synergy: 6,
    presets: {},

    // --- PRESETS ---
    _loadPresets() {
      try {
        const raw = localStorage.getItem(PRESETS_KEY);
        this.presets = raw ? JSON.parse(raw) : {};
      } catch (e) {
        this.presets = {};
      }
    },

    _savePresets() {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(this.presets));
    },

    _populatePresetSelect() {
      const $select = $('#ballResetPanel .preset-select');
      if (!$select.length) return;
      $select.find('option:not(:first)').remove();
      Object.keys(this.presets).sort().forEach(name => {
        $select.append(`<option value="${name}">${name}</option>`);
      });
    },

    savePreset(name) {
      if (!name) return;
      const combinations = this._prepareCombinations();
      if (combinations.length === 0) {
        GAME.komunikat('[Kula] Najpierw skonfiguruj kombinacje!');
        return;
      }
      this.presets[name] = combinations;
      this._savePresets();
      this._populatePresetSelect();
      GAME.komunikat(`[Kula] Zapisano preset: ${name}`);
    },

    loadPreset(name) {
      if (!name || !this.presets[name]) return;
      const combinations = this.presets[name];

      // Clear current combinations
      $('#ballResetPanel .combinations').empty();

      // Rebuild UI with saved combinations
      combinations.forEach((combo, ci) => {
        $('#ballResetPanel .combinations').append(this._buildCombinationHTML(ci + 1));
        const $lastCombo = $('#ballResetPanel .ballCombination').last();
        const $selects = $lastCombo.find('select');
        combo.forEach((statId, si) => {
          if ($selects[si]) {
            $($selects[si]).val(statId);
          }
        });
      });

      GAME.komunikat(`[Kula] Wczytano preset: ${name}`);
    },

    deletePreset(name) {
      if (!name || !this.presets[name]) return;
      delete this.presets[name];
      this._savePresets();
      this._populatePresetSelect();
      GAME.komunikat(`[Kula] Usunięto preset: ${name}`);
    },

    // --- MAIN LOGIC ---
    async run() {
      if (!BALL_MANAGER.acquire('reset')) return;
      this.isRunning = true;
      this._updateUI();
      this.combinations = this._prepareCombinations();

      if (this.combinations.length === 0) {
        GAME.komunikat('[Kula] Wybierz przynajmniej jedną kombinację!');
        this.isRunning = false;
        BALL_MANAGER.release('reset');
        this._updateUI();
        return;
      }

      try {
        while (this.isRunning) {
          GAME.socket.emit('ga', { a: 45, type: 1, bid: GAME.ball_id });
          const res = await BALL_RESPONSE.waitForResponse(10000);
          if (!res || !this.isRunning) break;

          const stats = this._extractStats(res);
          this._highlightMatches(res, stats);

          if (this._matchesCombination(stats)) {
            GAME.komunikat('[Kula] Znaleziono pasującą kombinację!');
            break;
          }
        }
      } catch (e) {
        console.warn('[BallReset] Error:', e.message);
      }

      this.isRunning = false;
      BALL_MANAGER.release('reset');
      this._updateUI();
    },

    stop() {
      this.isRunning = false;
      this._updateUI();
    },

    _extractStats(res) {
      const ball = res.ball;
      const stats = [];
      for (let s = 1; s <= 9; s++) {
        if (ball['stat' + s]) {
          stats.push(ball['stat' + s]);
        }
      }
      return stats;
    },

    _highlightMatches(res, stats) {
      const ball = res.ball;
      $('.ss_stats tr').css('background', 'transparent');
      const allWanted = new Set();
      this.combinations.forEach(combo => combo.forEach(id => allWanted.add(id)));

      for (let s = 1; s <= 9; s++) {
        if (ball['stat' + s] && allWanted.has(ball['stat' + s])) {
          $('#stat' + s + '_bon').parent().css('background', '#80008075');
        }
      }
    },

    _matchesCombination(stats) {
      const patternCounts = this._countOccurrences(stats);
      for (const combo of this.combinations) {
        const comboCounts = this._countOccurrences(combo);
        let isValid = true;
        for (const [num, count] of Object.entries(comboCounts)) {
          if (!patternCounts[num] || patternCounts[num] < count) {
            isValid = false;
            break;
          }
        }
        if (isValid) return true;
      }
      return false;
    },

    _countOccurrences(arr) {
      const counts = {};
      for (const num of arr) {
        counts[num] = (counts[num] || 0) + 1;
      }
      return counts;
    },

    _prepareCombinations() {
      const combinations = [];
      $('#ballResetPanel .ballCombination').each((index, element) => {
        const combo = [];
        $(element).find('select').each((idx, sel) => {
          const value = parseInt($(sel).val());
          if (value > 0) combo.push(value);
        });
        if (combo.length > 0) combinations.push(combo);
      });
      return combinations;
    },

    _updateUI() {
      if (this.isRunning) {
        $('.startSearching').removeClass('green').addClass('red').html('STOP');
        $('#ballResetPanel .ballCombination select').prop('disabled', true);
        $('#ballResetPanel .addCombination').prop('disabled', true);
        $('#ballResetPanel .preset-bar').find('select, input, button').prop('disabled', true);
      } else {
        $('.startSearching').removeClass('red').addClass('green').html('SZUKAJ');
        $('#ballResetPanel .ballCombination select').prop('disabled', false);
        $('#ballResetPanel .addCombination').prop('disabled', false);
        $('#ballResetPanel .preset-bar').find('select, input, button').prop('disabled', false);
      }
    },

    _buildSelectHTML() {
      let html = '<select><option value="0">Brak</option>';
      ALL_BONUSES.forEach(b => {
        html += `<option value="${b.id}">${b.bonus}</option>`;
      });
      html += '</select>';
      return html;
    },

    _buildCombinationHTML(num) {
      let html = `<div class="ballCombination" combination="${num}">`;
      html += `<div class="combinationID">Kombinacja #${num}</div>`;
      for (let i = 0; i < this.synergy; i++) {
        html += this._buildSelectHTML();
      }
      html += '</div>';
      return html;
    }
  };

  window.BALL_RESET = BALL_RESET;

  // Load presets on init
  BALL_RESET._loadPresets();

  // Inject panel HTML + CSS
  const panelHTML = `
        <div id="ballResetPanel">
            <div class="close-panel">✕</div>
            <div class="preset-bar">
                <select class="preset-select"><option value="">-- Preset --</option></select>
                <button class="preset-load">Wczytaj</button>
                <input type="text" class="preset-name" placeholder="Nazwa presetu...">
                <button class="preset-save">Zapisz</button>
                <button class="preset-delete delete">Usuń</button>
            </div>
            <div class="controller">
                <button class="addCombination">DODAJ NOWĄ KOMBINACJĘ</button>
                <button class="startSearching green">SZUKAJ</button>
            </div>
            <div class="combinations">${BALL_RESET._buildCombinationHTML(1)}</div>
        </div>`;
  $('body').append(`<style>${CSS}</style>${panelHTML}`);

  // Populate preset select after DOM ready
  BALL_RESET._populatePresetSelect();

  // Preset handlers
  $('body').on('click', '#ballResetPanel .preset-save', () => {
    const name = $('#ballResetPanel .preset-name').val().trim();
    if (!name) {
      GAME.komunikat('[Kula] Wpisz nazwę presetu!');
      return;
    }
    BALL_RESET.savePreset(name);
    $('#ballResetPanel .preset-select').val(name);
  });

  $('body').on('click', '#ballResetPanel .preset-load', () => {
    const name = $('#ballResetPanel .preset-select').val();
    if (!name) {
      GAME.komunikat('[Kula] Wybierz preset z listy!');
      return;
    }
    BALL_RESET.loadPreset(name);
    $('#ballResetPanel .preset-name').val(name);
  });

  $('body').on('click', '#ballResetPanel .preset-delete', () => {
    const name = $('#ballResetPanel .preset-select').val();
    if (!name) {
      GAME.komunikat('[Kula] Wybierz preset do usunięcia!');
      return;
    }
    BALL_RESET.deletePreset(name);
    $('#ballResetPanel .preset-select').val('');
    $('#ballResetPanel .preset-name').val('');
  });

  // Add combination
  $('body').on('click', '#ballResetPanel .addCombination', () => {
    const lastID = parseInt($('#ballResetPanel .ballCombination:last').attr('combination')) || 0;
    $('#ballResetPanel .combinations').append(BALL_RESET._buildCombinationHTML(lastID + 1));
  });

  // Start/Stop
  $('body').on('click', '#ballResetPanel .startSearching', () => {
    if (BALL_RESET.isRunning) {
      BALL_RESET.stop();
    } else {
      BALL_RESET.run();
    }
  });

  // Show panel on reset tab click (only for normal ball) - reset to clean state
  $('body').on('click', 'button[data-option="ss_page"][data-page="reset"]', () => {
    const nameEl = document.querySelector('#ss_name');
    if (nameEl && nameEl.textContent.trim() !== 'Anielska Kula Energii') {
      // Clear and reset to single empty combination
      $('#ballResetPanel .combinations').empty().append(BALL_RESET._buildCombinationHTML(1));
      $('#ballResetPanel .preset-select').val('');
      $('#ballResetPanel .preset-name').val('');
      $('#ballResetPanel').show();
    }
  });

  // Close panel X button
  $('body').on('click', '#ballResetPanel .close-panel', () => {
    if (BALL_RESET.isRunning) BALL_RESET.stop();
    $('.ss_stats tr').css('background', 'transparent');
    $('#ballResetPanel').hide();
  });

  // Hide panel on upgrade tab or close
  $('body').on('click', 'button[data-option="ss_page"][data-page="upgrade"], #soulstone_interface .closeicon', () => {
    if (BALL_RESET.isRunning) BALL_RESET.stop();
    $('.ss_stats tr').css('background', 'transparent');
    $('#ballResetPanel').hide();
  });
})();

// ============================================================
// 2. BALL_ANGEL_RESET - Angel ball reset with variant selection
//    Multiple combinations, each with 5 slots + variant checkboxes.
//    Supports presets: save/load/delete combination configs.
// ============================================================
(function () {
  'use strict';

  const PRESETS_KEY = 'ball_angel_reset_presets';

  // Angel ball stat groups - each group has 2 variants (lower/higher %)
  const ANGEL_STAT_GROUPS = [
    { group: 'boski_atrybut', label: '% do boskiego atrybutu przewodniego', variants: ['10% do boskiego atrybutu przewodniego', '15% do boskiego atrybutu przewodniego'] },
    { group: 'doswiadczenie', label: '% do doświadczenia', variants: ['150% do doświadczenia', '200% do doświadczenia'] },
    { group: 'efektywnosc', label: '% do efektywności treningu', variants: ['150% do efektywności treningu', '200% do efektywności treningu'] },
    { group: 'moc_pvm', label: '% do ilości mocy z walk PvM', variants: ['75% do ilości mocy z walk PvM', '100% do ilości mocy z walk PvM'] },
    { group: 'krysztaly', label: '% do ilości zdobywanych kryształów instancji', variants: ['75% do ilości zdobywanych kryształów instancji', '100% do ilości zdobywanych kryształów instancji'] },
    { group: 'max_pa', label: '% do max Punktów Akcji', variants: ['30% do max Punktów Akcji', '35% do max Punktów Akcji'] },
    { group: 'obrazenia', label: '% do obrażeń', variants: ['40% do obrażeń', '45% do obrażeń'] },
    { group: 'obrazenia_tech', label: '% do obrażeń od technik', variants: ['40% do obrażeń od technik', '45% do obrażeń od technik'] },
    { group: 'przyrost_pa', label: '% do przyrostu Punktów Akcji', variants: ['30% do przyrostu Punktów Akcji', '35% do przyrostu Punktów Akcji'] },
    { group: 'redukcja', label: '% do redukcji obrażeń', variants: ['40% do redukcji obrażeń', '45% do redukcji obrażeń'] },
    { group: 'slawa', label: '% do sławy za walki w wojnach imperiów', variants: ['40% do sławy za walki w wojnach imperiów', '45% do sławy za walki w wojnach imperiów'] },
    { group: '3x_exp', label: '% do szansy na 3x więcej doświadczenia za wygrane walki PvM', variants: ['15% do szansy na 3x więcej doświadczenia za wygrane walki PvM', '20% do szansy na 3x więcej doświadczenia za wygrane walki PvM'] },
    { group: 'polaczenie', label: '% do szansy na połączenie przedmiotów', variants: ['9% do szansy na połączenie przedmiotów', '12% do szansy na połączenie przedmiotów'] },
    { group: 'legendarne', label: '% do szansy na spotkanie legendarnych potworów', variants: ['9% do szansy na spotkanie legendarnych potworów', '12% do szansy na spotkanie legendarnych potworów'] },
    { group: 'ulepszenie', label: '% do szansy na ulepszenie przedmiotów', variants: ['9% do szansy na ulepszenie przedmiotów', '12% do szansy na ulepszenie przedmiotów'] },
    { group: 'przedmiot_pvm', label: '% do szansy na zdobycie przedmiotu z walk PvM', variants: ['9% do szansy na zdobycie przedmiotu z walk PvM', '12% do szansy na zdobycie przedmiotu z walk PvM'] },
    { group: 'psk', label: '% do szansy na zdobycie PSK', variants: ['9% do szansy na zdobycie PSK', '12% do szansy na zdobycie PSK'] },
    { group: 'csk', label: '% do szansy na zdobycie CSK z potworów legendarnych', variants: ['3% do szansy na zdobycie CSK z potworów legendarnych', '5% do szansy na zdobycie CSK z potworów legendarnych'] },
    { group: 'wtajemniczenie', label: '% do wtajemniczenia', variants: ['15% do wtajemniczenia', '20% do wtajemniczenia'] },
    { group: 'redukcja_tech', label: '% redukcji obrażeń od technik', variants: ['40% redukcji obrażeń od technik', '45% redukcji obrażeń od technik'] },
    { group: 'moc_szansa', label: '% do szansy na moc z walk PvM', variants: ['9% do szansy na moc z walk PvM', '12% do szansy na moc z walk PvM'] },
    { group: 'senzu_limit', label: '% większy limit dzienny Niebieskich Senzu', variants: ['10% większy limit dzienny Niebieskich Senzu', '15% większy limit dzienny Niebieskich Senzu'] },
    { group: 'ssj', label: '% większy mnożnik SSJ', variants: ['4% większy mnożnik SSJ', '6% większy mnożnik SSJ'] },
    { group: 'redukcja_efekty', label: '% redukcja obrażeń od efektów czasowych', variants: ['10% redukcja obrażeń od efektów czasowych', '12% redukcja obrażeń od efektów czasowych'] },
    { group: 'blogoslawienstwa', label: 'minut(y) do czasu trwania błogosławieństw', variants: ['75 minut(y) do czasu trwania błogosławieństw', '100 minut(y) do czasu trwania błogosławieństw'] },
    { group: 'pvp_cooldown', label: 'minut(y) krótszy cooldown między walkami PvP', variants: ['12 minut(y) krótszy cooldown między walkami PvP', '15 minut(y) krótszy cooldown między walkami PvP'] },
    { group: 'boski_pvm', label: '% większa ilość boskiego atrybutu przewodniego z walk PvM', variants: ['50% większa ilość boskiego atrybutu przewodniego z walk PvM', '60% większa ilość boskiego atrybutu przewodniego z walk PvM'] },
    { group: 'mborn', label: '% do szansy na ulepszenie przedmiotów klasy Mega', variants: ['2% do szansy na ulepszenie przedmiotów klasy Mega', '4% do szansy na ulepszenie przedmiotów klasy Mega'] },
    { group: 'rezultat', label: '% do rezultatu treningu', variants: ['5% do rezultatu treningu', '10% do rezultatu treningu'] },
    { group: 'podwojny_bonus', label: '% do szansy na podwójnie efektywny bonus za ulepszenie treningu', variants: ['2% do szansy na podwójnie efektywny bonus za ulepszenie treningu', '3% do szansy na podwójnie efektywny bonus za ulepszenie treningu'] },
    { group: 'boski_szansa', label: '% większa szansa na boski atrybut przewodni podczas walk PvM', variants: ['3% większa szansa na boski atrybut przewodni podczas walk PvM', '5% większa szansa na boski atrybut przewodni podczas walk PvM'] },
    { group: 'statystyki', label: '% do wszystkich statystyk', variants: ['5% do wszystkich statystyk', '10% do wszystkich statystyk'] },
    { group: 'zasoby', label: '% większa szansa na pomyślne zebranie zasobu', variants: ['4% większa szansa na pomyślne zebranie zasobu', '6% większa szansa na pomyślne zebranie zasobu'] }
  ];

  const SLOTS_COUNT = 5;

  const CSS = `
        #angelResetPanel {
            position: absolute; top: 35px; right: 10px; z-index: 9999999;
            width: 460px; max-width: 95vw; padding: 8px;
            background: #303131e6; border: solid #ffd700 1px; border-radius: 5px;
            display: none; user-select: none;
            max-height: 80vh; overflow-y: auto;
            color: #fff;
        }
        #angelResetPanel .close-panel {
            position: absolute; top: 5px; right: 5px; cursor: pointer;
            font-size: 20px; font-weight: bold; color: #fff;
            width: 24px; height: 24px; text-align: center; line-height: 22px;
            background: #8b0000; border-radius: 3px;
        }
        #angelResetPanel .close-panel:hover { background: #b00000; }
        #angelResetPanel .angel-title {
            text-align: center; font-weight: bold; font-size: 15px;
            color: #ffd700; margin-bottom: 6px;
        }
        #angelResetPanel .preset-bar {
            display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap;
        }
        #angelResetPanel .preset-bar select {
            flex: 1; min-width: 100px; background: #040e13; color: #fff;
            border: 1px solid #ffd700; border-radius: 3px; padding: 4px; font-size: 13px;
        }
        #angelResetPanel .preset-bar input {
            flex: 1; min-width: 80px; background: #040e13; color: #fff;
            border: 1px solid #ffd700; border-radius: 3px; padding: 4px; font-size: 13px;
        }
        #angelResetPanel .preset-bar button {
            background: #305779; color: #fff; border: 1px solid #6f6f6f;
            border-radius: 3px; cursor: pointer; font-size: 12px; padding: 4px 8px;
            white-space: nowrap;
        }
        #angelResetPanel .preset-bar button:hover { background: #4a7aa5; }
        #angelResetPanel .preset-bar button.delete { background: #8b0000; }
        #angelResetPanel .preset-bar button.delete:hover { background: #b00000; }
        #angelResetPanel .angel-controls {
            display: flex; gap: 4px; margin-bottom: 6px;
        }
        #angelResetPanel .angel-controls button {
            flex: 1; font-weight: bold; border: solid black 1px; cursor: pointer;
            min-height: 44px; font-size: 14px; border-radius: 3px;
        }
        #angelResetPanel .angel-btn-add { background: #afd4f5; color: black !important; }
        #angelResetPanel .angel-btn-start { background: lime; color: black !important; }
        #angelResetPanel .angel-btn-stop { background: red; color: black !important; display: none; }
        #angelResetPanel .angel-combination {
            background: #dfdfdc1a; padding: 6px; margin-bottom: 4px; border-radius: 3px;
            border: 1px solid #ffffff30;
        }
        #angelResetPanel .angel-combo-header {
            text-align: center; background: black; color: #ffd700;
            font-weight: bold; font-size: 14px; padding: 2px; margin-bottom: 4px;
        }
        #angelResetPanel .angel-slot {
            margin-bottom: 3px;
        }
        #angelResetPanel .angel-slot-label {
            font-size: 12px; color: #aaa; margin-bottom: 2px;
        }
        #angelResetPanel .angel-slot select {
            width: 100%; background: #ffffff99; border: solid #6f6f6f 1px;
            border-radius: 5px; color: black; font-size: 13px; padding: 4px;
            margin-bottom: 3px;
        }
        #angelResetPanel .angel-variants {
            display: none; padding: 3px 8px; background: #ffffff10; border-radius: 3px;
        }
        #angelResetPanel .angel-variants label {
            display: flex; align-items: center; gap: 6px; padding: 2px 0;
            font-size: 12px; color: #ddd; cursor: pointer;
        }
        #angelResetPanel .angel-variants input[type="checkbox"] {
            width: 18px; height: 18px; cursor: pointer; accent-color: #ffd700;
        }
        #angelResetPanel .angel-status {
            text-align: center; font-size: 13px; color: #aaa; margin-top: 4px;
        }
        @media (max-width: 600px) {
            #angelResetPanel { width: 95vw; right: 2.5vw; top: 10px; }
            #angelResetPanel select { font-size: 16px; padding: 8px; }
            #angelResetPanel button { min-height: 48px; font-size: 16px; }
            #angelResetPanel .angel-variants input[type="checkbox"] { width: 24px; height: 24px; }
            #angelResetPanel .angel-variants label { font-size: 15px; padding: 5px 0; }
        }
    `;

  const BALL_ANGEL_RESET = {
    isRunning: false,
    combinations: [],
    resetCount: 0,
    presets: {},

    // --- PRESETS ---
    _loadPresets() {
      try {
        const raw = localStorage.getItem(PRESETS_KEY);
        this.presets = raw ? JSON.parse(raw) : {};
      } catch (e) {
        this.presets = {};
      }
    },

    _savePresets() {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(this.presets));
    },

    _populatePresetSelect() {
      const $select = $('#angelResetPanel .preset-select');
      if (!$select.length) return;
      $select.find('option:not(:first)').remove();
      Object.keys(this.presets).sort().forEach(name => {
        $select.append(`<option value="${name}">${name}</option>`);
      });
    },

    // Save current config: { combinations: [{ slots: [{ groupIdx, variants: [bool, bool] }, ...] }, ...] }
    savePreset(name) {
      if (!name) return;
      const config = this._readConfigForSave();
      if (config.length === 0) {
        GAME.komunikat('[Anielska] Najpierw skonfiguruj kombinacje!');
        return;
      }
      this.presets[name] = config;
      this._savePresets();
      this._populatePresetSelect();
      GAME.komunikat(`[Anielska] Zapisano preset: ${name}`);
    },

    // Read config in a saveable format
    _readConfigForSave() {
      const config = [];
      $('.angel-combination').each((ci, combEl) => {
        const combo = { slots: [] };
        for (let i = 0; i < SLOTS_COUNT; i++) {
          const select = combEl.querySelector(`.angel-slot-select[data-combo="${ci + 1}"][data-slot="${i}"]`);
          if (!select || select.value === '') continue;
          const groupIdx = parseInt(select.value);
          const variants = [];
          for (let vi = 0; vi < 2; vi++) {
            const cb = combEl.querySelector(`.angel-variant-cb[data-combo="${ci + 1}"][data-slot="${i}"][data-var="${vi}"]`);
            variants.push(cb ? cb.checked : true);
          }
          combo.slots.push({ groupIdx, variants });
        }
        if (combo.slots.length > 0) {
          config.push(combo);
        }
      });
      return config;
    },

    loadPreset(name) {
      if (!name || !this.presets[name]) return;
      const config = this.presets[name];

      // Clear current combinations
      $('.angel-combinations').empty();

      // Rebuild UI
      config.forEach((combo, ci) => {
        $('.angel-combinations').append(this._buildCombinationHTML(ci + 1));
        const $combEl = $('.angel-combination').last();

        combo.slots.forEach((slot, si) => {
          const $select = $combEl.find(`.angel-slot-select[data-slot="${si}"]`);
          if ($select.length) {
            $select.val(slot.groupIdx);
            // Build variants
            buildVariants(ci + 1, si, slot.groupIdx);
            // Set variant checkboxes after small delay
            setTimeout(() => {
              slot.variants.forEach((checked, vi) => {
                const cb = document.querySelector(`.angel-variant-cb[data-combo="${ci + 1}"][data-slot="${si}"][data-var="${vi}"]`);
                if (cb) cb.checked = checked;
              });
            }, 50);
          }
        });
      });

      GAME.komunikat(`[Anielska] Wczytano preset: ${name}`);
    },

    deletePreset(name) {
      if (!name || !this.presets[name]) return;
      delete this.presets[name];
      this._savePresets();
      this._populatePresetSelect();
      GAME.komunikat(`[Anielska] Usunięto preset: ${name}`);
    },

    // --- MAIN LOGIC ---
    async run() {
      if (!BALL_MANAGER.acquire('angelReset')) return;

      this.combinations = this._readConfig();
      if (this.combinations.length === 0) {
        GAME.komunikat('[Anielska] Wybierz przynajmniej jedną kombinację!');
        BALL_MANAGER.release('angelReset');
        return;
      }

      this.isRunning = true;
      this.resetCount = 0;
      this._updateUI();
      this._disableInputs(true);

      try {
        while (this.isRunning) {
          GAME.socket.emit('ga', { a: 45, type: 1, bid: GAME.ball_id });
          const res = await BALL_RESPONSE.waitForResponse(10000);
          if (!res || !this.isRunning) break;

          this.resetCount++;
          this._updateStatus();

          const currentStats = this._extractStats();
          this._highlightMatches(currentStats);

          if (this._anyCombinationMatched(currentStats)) {
            GAME.komunikat('[Anielska] Znaleziono pasujące staty!');
            break;
          }
        }
      } catch (e) {
        console.warn('[AngelReset] Error:', e.message);
      }

      this.isRunning = false;
      BALL_MANAGER.release('angelReset');
      this._disableInputs(false);
      this._updateUI();
    },

    stop() {
      this.isRunning = false;
      this._disableInputs(false);
      this._updateUI();
    },

    _extractStats() {
      const stats = [];
      const table = document.querySelector('table.ss_stats');
      if (!table) return stats;

      const vals = table.querySelectorAll("b[id^='stat'][id$='_val']");
      const bons = table.querySelectorAll("td[id^='stat'][id$='_bon']");

      for (let i = 0; i < vals.length; i++) {
        const val = vals[i]?.textContent?.trim() || '';
        const bon = bons[i]?.textContent?.trim() || '';
        if (val && bon) {
          stats.push(val + bon);
        }
      }
      return stats;
    },

    _anyCombinationMatched(currentStats) {
      return this.combinations.some(combo => {
        return combo.slots.every(slot => {
          return slot.acceptedTexts.some(text => currentStats.includes(text));
        });
      });
    },

    _highlightMatches(currentStats) {
      $('.ss_stats tr').css('background', 'transparent');

      const allAccepted = new Set();
      this.combinations.forEach(combo => {
        combo.slots.forEach(slot => {
          slot.acceptedTexts.forEach(t => allAccepted.add(t));
        });
      });

      const table = document.querySelector('table.ss_stats');
      if (!table) return;
      const vals = table.querySelectorAll("b[id^='stat'][id$='_val']");
      const bons = table.querySelectorAll("td[id^='stat'][id$='_bon']");

      for (let i = 0; i < vals.length; i++) {
        const val = vals[i]?.textContent?.trim() || '';
        const bon = bons[i]?.textContent?.trim() || '';
        const combined = val + bon;
        if (combined && allAccepted.has(combined)) {
          $(vals[i]).closest('tr').css('background', '#80008075');
        }
      }
    },

    _readConfig() {
      const combinations = [];
      $('.angel-combination').each((ci, combEl) => {
        const combo = { slots: [] };
        for (let i = 0; i < SLOTS_COUNT; i++) {
          const select = combEl.querySelector(`.angel-slot-select[data-combo="${ci + 1}"][data-slot="${i}"]`);
          if (!select || select.value === '') continue;
          const groupIdx = parseInt(select.value);
          const group = ANGEL_STAT_GROUPS[groupIdx];
          if (!group) continue;

          const acceptedTexts = [];
          group.variants.forEach((variant, vi) => {
            const cb = combEl.querySelector(`.angel-variant-cb[data-combo="${ci + 1}"][data-slot="${i}"][data-var="${vi}"]`);
            if (cb && cb.checked) {
              acceptedTexts.push(variant);
            }
          });

          if (acceptedTexts.length > 0) {
            combo.slots.push({ acceptedTexts });
          }
        }
        if (combo.slots.length > 0) {
          combinations.push(combo);
        }
      });
      return combinations;
    },

    _updateUI() {
      if (this.isRunning) {
        $('.angel-btn-add').hide();
        $('.angel-btn-start').hide();
        $('.angel-btn-stop').show();
      } else {
        $('.angel-btn-add').show();
        $('.angel-btn-start').show();
        $('.angel-btn-stop').hide();
      }
      this._updateStatus();
    },

    _updateStatus() {
      const statusEl = document.querySelector('.angel-status');
      if (!statusEl) return;
      if (this.isRunning) {
        statusEl.textContent = `Resetowanie... (${this.resetCount} resetów)`;
      } else if (this.resetCount > 0) {
        statusEl.textContent = `Zakończono po ${this.resetCount} resetach`;
      } else {
        statusEl.textContent = '';
      }
    },

    _disableInputs(disabled) {
      $('#angelResetPanel select').prop('disabled', disabled);
      $('#angelResetPanel .angel-variants input').prop('disabled', disabled);
      $('#angelResetPanel .angel-btn-add').prop('disabled', disabled);
      $('#angelResetPanel .preset-bar').find('select, input, button').prop('disabled', disabled);
    },

    _buildCombinationHTML(comboIdx) {
      let html = `<div class="angel-combination" data-combo="${comboIdx}">`;
      html += `<div class="angel-combo-header">Kombinacja #${comboIdx}</div>`;
      for (let i = 0; i < SLOTS_COUNT; i++) {
        html += `<div class="angel-slot">`;
        html += `<div class="angel-slot-label">Slot ${i + 1}</div>`;
        html += `<select class="angel-slot-select" data-combo="${comboIdx}" data-slot="${i}">`;
        html += `<option value="">-- Wybierz bonus --</option>`;
        ANGEL_STAT_GROUPS.forEach((g, gi) => {
          html += `<option value="${gi}">${g.label}</option>`;
        });
        html += `</select>`;
        html += `<div class="angel-variants" data-combo="${comboIdx}" data-slot="${i}"></div>`;
        html += `</div>`;
      }
      html += `</div>`;
      return html;
    }
  };

  window.BALL_ANGEL_RESET = BALL_ANGEL_RESET;

  // Load presets on init
  BALL_ANGEL_RESET._loadPresets();

  // Build variant checkboxes when group is selected
  function buildVariants(comboIdx, slotIdx, groupIdx) {
    const container = document.querySelector(`.angel-variants[data-combo="${comboIdx}"][data-slot="${slotIdx}"]`);
    if (!container) return;

    if (groupIdx === '' || groupIdx === undefined) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    const group = ANGEL_STAT_GROUPS[parseInt(groupIdx)];
    if (!group) return;

    let html = '';
    group.variants.forEach((variant, vi) => {
      html += `
                <label>
                    <input type="checkbox" class="angel-variant-cb"
                           data-combo="${comboIdx}" data-slot="${slotIdx}" data-var="${vi}" checked>
                    ${variant}
                </label>`;
    });

    container.innerHTML = html;
    container.style.display = 'block';
  }

  // Build initial panel with 1 combination
  const panelHTML = `
        <div id="angelResetPanel">
            <div class="close-panel">✕</div>
            <div class="angel-title">Reset Anielskiej Kuli</div>
            <div class="preset-bar">
                <select class="preset-select"><option value="">-- Preset --</option></select>
                <button class="preset-load">Wczytaj</button>
                <input type="text" class="preset-name" placeholder="Nazwa...">
                <button class="preset-save">Zapisz</button>
                <button class="preset-delete delete">Usuń</button>
            </div>
            <div class="angel-controls">
                <button class="angel-btn-add">DODAJ KOMBINACJĘ</button>
                <button class="angel-btn-start">START</button>
                <button class="angel-btn-stop">STOP</button>
            </div>
            <div class="angel-combinations">${BALL_ANGEL_RESET._buildCombinationHTML(1)}</div>
            <div class="angel-status"></div>
        </div>`;

  $('body').append(`<style>${CSS}</style>${panelHTML}`);

  // Populate preset select after DOM ready
  BALL_ANGEL_RESET._populatePresetSelect();

  // Preset handlers
  $('body').on('click', '#angelResetPanel .preset-save', () => {
    const name = $('#angelResetPanel .preset-name').val().trim();
    if (!name) {
      GAME.komunikat('[Anielska] Wpisz nazwę presetu!');
      return;
    }
    BALL_ANGEL_RESET.savePreset(name);
    $('#angelResetPanel .preset-select').val(name);
  });

  $('body').on('click', '#angelResetPanel .preset-load', () => {
    const name = $('#angelResetPanel .preset-select').val();
    if (!name) {
      GAME.komunikat('[Anielska] Wybierz preset z listy!');
      return;
    }
    BALL_ANGEL_RESET.loadPreset(name);
    $('#angelResetPanel .preset-name').val(name);
  });

  $('body').on('click', '#angelResetPanel .preset-delete', () => {
    const name = $('#angelResetPanel .preset-select').val();
    if (!name) {
      GAME.komunikat('[Anielska] Wybierz preset do usunięcia!');
      return;
    }
    BALL_ANGEL_RESET.deletePreset(name);
    $('#angelResetPanel .preset-select').val('');
    $('#angelResetPanel .preset-name').val('');
  });

  // Group selection change → show variant checkboxes
  $('body').on('change', '.angel-slot-select', function () {
    const comboIdx = parseInt($(this).data('combo'));
    const slotIdx = parseInt($(this).data('slot'));
    buildVariants(comboIdx, slotIdx, this.value);
  });

  // Add combination
  $('body').on('click', '.angel-btn-add', () => {
    const lastCombo = $('.angel-combination').last();
    const lastIdx = lastCombo.length ? parseInt(lastCombo.data('combo')) : 0;
    $('.angel-combinations').append(BALL_ANGEL_RESET._buildCombinationHTML(lastIdx + 1));
  });

  // Start
  $('body').on('click', '.angel-btn-start', () => {
    BALL_ANGEL_RESET.run();
  });

  // Stop
  $('body').on('click', '.angel-btn-stop', () => {
    BALL_ANGEL_RESET.stop();
  });

  // Close X
  $('body').on('click', '#angelResetPanel .close-panel', () => {
    if (BALL_ANGEL_RESET.isRunning) BALL_ANGEL_RESET.stop();
    $('.ss_stats tr').css('background', 'transparent');
    $('#angelResetPanel').hide();
  });

  // Show panel on reset tab (angel ball only) - reset to clean state
  $('body').on('click', 'button[data-option="ss_page"][data-page="reset"]', () => {
    const nameEl = document.querySelector('#ss_name');
    if (nameEl && nameEl.textContent.trim() === 'Anielska Kula Energii') {
      // Clear and reset to single empty combination
      $('.angel-combinations').empty().append(BALL_ANGEL_RESET._buildCombinationHTML(1));
      $('#angelResetPanel .preset-select').val('');
      $('#angelResetPanel .preset-name').val('');
      $('#ballResetPanel').hide();
      $('#angelResetPanel').show();
    } else {
      $('#angelResetPanel').hide();
    }
  });

  // Hide panel on upgrade tab or close
  $('body').on('click', 'button[data-option="ss_page"][data-page="upgrade"], #soulstone_interface .closeicon', () => {
    if (BALL_ANGEL_RESET.isRunning) BALL_ANGEL_RESET.stop();
    $('.ss_stats tr').css('background', 'transparent');
    $('#angelResetPanel').hide();
  });
})();

// ============================================================
// 3. PET_BONUS_RESET - Pet bonus auto-reset
//    Independent from ball system (uses a:43 socket, not a:45).
// ============================================================
(function () {
  'use strict';

  const PET_CSS = `
        #bonusMenu {
            display: none; position: absolute; top: 80px; right: 5px;
            padding: 10px; background: rgba(48, 49, 49, 0.8);
            border: solid #ffffff7a 1px; border-radius: 5px; z-index: 10;
            max-width: 95vw;
        }
        #bonusMenu div { color: #ffffff; font-size: 16px; font-weight: bold; margin-bottom: 10px; text-align: center; }
        #bonusMenu select {
            margin: 5px 0; background: #ffffff99; border: solid #6f6f6f 1px;
            border-radius: 5px; color: black; display: block; width: 100%;
            font-size: 14px; padding: 4px;
        }
        #bonusMenu .pet-start-btn { display: block; margin: 8px auto; min-height: 44px; }
        #bonusMenu .pet-stop-btn { display: block; margin: 8px auto; margin-bottom: 1ch; min-height: 44px; }
        @media (max-width: 600px) {
            #bonusMenu select { font-size: 16px; padding: 8px; }
            #bonusMenu button { font-size: 16px; }
        }
    `;

  const BONUS_OPTIONS = `
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

  function generateSelects(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `<select class="pet-bonus-select">${BONUS_OPTIONS}</select>`;
    }
    return html;
  }

  function generatePetOptions() {
    let html = '';
    for (let i = 1; i <= 100; i++) {
      html += `<option value="${i}">Pet ${i}</option>`;
    }
    return html;
  }

  const PET_HTML = `
        <div id="bonusMenu">
            <div><b>Wybierz bonusy:</b></div>
            ${generateSelects(4)}
            <div><b>Wybierz ID Peta:</b></div>
            <select id="petIdSelect">${generatePetOptions()}</select>
            <button class="newBtn pet-start-btn">Start</button>
            <button class="newBtn pet-stop-btn">CLOSE</button>
        </div>`;

  let isPetActive = false;
  let petInterval = null;

  function stopPet() {
    isPetActive = false;
    if (petInterval) {
      clearInterval(petInterval);
      petInterval = null;
    }
  }

  // Toggle menu button
  $('body').on('click', 'button[data-option="pet_bonch"]', () => {
    if (!$('#bonusMenu').length) {
      $('body').append(`<style>${PET_CSS}</style>${PET_HTML}`);
    }

    setTimeout(() => {
      if ($('.pet-number').length === 0) {
        document.querySelectorAll('.petItem').forEach((petItem, index) => {
          const label = document.createElement('div');
          label.classList.add('pet-number');
          label.textContent = `Pet #${index + 1}`;
          label.style.fontWeight = 'bold';
          label.style.marginBottom = '5px';
          petItem.prepend(label);
        });
      }
      stopPet();
      $('#bonusMenu').toggle();
    }, 333);
  });

  // Start
  $('body').on('click', '.pet-start-btn', () => {
    isPetActive = true;
    const selectedOptions = Array.from($('#bonusMenu select.pet-bonus-select'))
      .map(select => {
        const value = select.value;
        const text = select.options[select.selectedIndex].text;
        return value !== '0' ? text : null;
      })
      .filter(Boolean);

    if (selectedOptions.length === 0) {
      GAME.komunikat('[Pet] Wybierz przynajmniej jeden bonus!');
      isPetActive = false;
      return;
    }

    petInterval = setInterval(() => {
      const container = document.querySelector('#kom_con > div > div.content > div');
      if (!container) return;

      const greenTextValues = Array.from(container.querySelectorAll('b.green'))
        .map(el => el.nextSibling ? el.nextSibling.textContent.trim() : '');

      const allMatch = selectedOptions.every(option => greenTextValues.includes(option));
      const foodCount = parseInt($('#ilosc_karm').text(), 10) || 0;

      if (foodCount === 0) {
        GAME.komunikat('[Pet] Brak karmy!');
        stopPet();
        return;
      }

      if (!isPetActive) {
        stopPet();
        return;
      }

      if (allMatch) {
        GAME.komunikat('[Pet] Znaleziono pasujące bonusy!');
        stopPet();
      } else {
        const petId = $('#petIdSelect').val();
        const button = document.querySelector(
          `#pet_list > div:nth-child(${petId}) > div.rightSide > div > button:nth-child(2)`
        );
        if (button) {
          const petId2 = button.getAttribute('data-pet');
          GAME.socket.emit('ga', { a: 43, type: 7, pet: petId2 });
          kom_clear();
        }
      }
    }, 700);
  });

  // Close
  $('body').on('click', '.pet-stop-btn', () => {
    $('#bonusMenu').hide();
    stopPet();
  });
})();
