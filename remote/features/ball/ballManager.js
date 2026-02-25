// Ball system: response handler + naming system + orchestrator.
// Contains 3 IIFEs: BALL_RESPONSE, BALL_NAMES, BALL_MANAGER.
// Loaded AFTER all other ball modules (ballExp, ballUpgrade, ballReset).

// ============================================================
// 1. BALL_RESPONSE - Central ball response handler
//    Hooks GAME.completeProgress once, provides Promise-based API.
// ============================================================
(function () {
  'use strict';

  const BALL_RESPONSE = {
    _resolveCallback: null,
    _initialized: false,

    init() {
      if (this._initialized) return;
      this._initialized = true;

      const origComplete = GAME.completeProgress
        ? GAME.completeProgress.bind(GAME)
        : null;

      GAME.completeProgress = () => {
        const res = GAME.progress;

        if (res && res.a === 45 && res.ball) {
          GAME.parseData(55, res);

          if (this._resolveCallback) {
            const resolve = this._resolveCallback;
            this._resolveCallback = null;
            resolve(res);
          }
        } else if (origComplete) {
          origComplete();
          return; // original handles cleanup
        }

        delete GAME.progress;
      };
    },

    /**
     * Wait for next ball response (a:45 with ball data).
     * Only one consumer at a time - enforced by BALL_MANAGER.acquire().
     * @param {number} timeout - ms before rejection (default 10s)
     * @returns {Promise<object>} server response with res.ball, res.bd etc.
     */
    waitForResponse(timeout = 10000) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          if (this._resolveCallback) {
            this._resolveCallback = null;
            reject(new Error('Ball response timeout'));
          }
        }, timeout);

        this._resolveCallback = (res) => {
          clearTimeout(timer);
          resolve(res);
        };
      });
    },

    /** Cancel pending wait (used by stop/cleanup). */
    cancel() {
      if (this._resolveCallback) {
        const resolve = this._resolveCallback;
        this._resolveCallback = null;
        // Resolve with null so await doesn't hang forever
        resolve(null);
      }
    }
  };

  window.BALL_RESPONSE = BALL_RESPONSE;
})();

// ============================================================
// 2. BALL_NAMES - Ball naming system + topbar selector
//    Save custom names for balls, equip via topbar dropdown.
// ============================================================
(function () {
  'use strict';

  const STORAGE_KEY_PREFIX = 'ball_names_';
  const CSS = `
        #ball_select {
            background: #040e13; color: #fff; font-family: 'Play', sans-serif;
            font-size: 13px; padding: 3px 8px; border: 1px solid #ffd700;
            border-radius: 5px; margin: 3px 10px 0 0; cursor: pointer;
            height: 24px; float: right;
        }
        #ball_select:hover { border-color: orange; }
        #ball_select option { background: #040e13; color: #fff; }
        #ball_select option.angel-option { color: #ffd700; }

        .ball-name-bar {
            display: flex; gap: 6px; margin: 8px 0; align-items: center;
            padding: 6px; background: #f0f0f010; border-radius: 3px;
        }
        .ball-name-bar label {
            font-size: 13px; color: #ffd700; font-weight: bold; white-space: nowrap;
        }
        .ball-name-bar input {
            flex: 1; background: #040e13; color: #fff; border: 1px solid #6f6f6f;
            border-radius: 3px; padding: 4px 8px; font-size: 13px;
            font-family: 'Play', sans-serif; min-height: 28px;
        }
        .ball-name-bar button {
            background: #305779; color: #fff; border: 1px solid #6f6f6f;
            border-radius: 3px; cursor: pointer; font-size: 12px;
            padding: 4px 12px; min-height: 28px; white-space: nowrap;
            font-weight: bold;
        }
        .ball-name-bar button:hover { background: #4a7aa5; }
        .ball-name-bar button.delete-ball { background: #8b0000; }
        .ball-name-bar button.delete-ball:hover { background: #b00000; }
    `;

  const BALL_NAMES = {
    balls: {}, // { ballId: { name, isAngel, lastSeen } }

    _storageKey() {
      const server = GAME.server || 0;
      const charId = GAME.char_data?.id || 0;
      return STORAGE_KEY_PREFIX + server + '_' + charId;
    },

    load() {
      try {
        const raw = localStorage.getItem(this._storageKey());
        this.balls = raw ? JSON.parse(raw) : {};
      } catch (e) {
        this.balls = {};
      }
    },

    save() {
      localStorage.setItem(this._storageKey(), JSON.stringify(this.balls));
    },

    /** Save current ball with custom name. */
    saveBall(ballId, name, isAngel) {
      if (!ballId || !name) return;
      this.balls[ballId] = {
        name,
        isAngel: !!isAngel,
        lastSeen: Date.now()
      };
      this.save();
      this._populateSelect();
      GAME.komunikat(`[Kula] Zapisano: ${name}`);
    },

    deleteBall(ballId) {
      delete this.balls[ballId];
      this.save();
      this._populateSelect();
    },

    /** Equip ball by ID (from topbar selector). */
    equipBall(ballId) {
      if (!ballId) return;
      // a:12 type:5 = wea_item (equip), iid = item ID, page/page2 can be 0
      GAME.socket.emit('ga', { a: 12, type: 5, iid: parseInt(ballId), page: 0, page2: 0 });
      GAME.komunikat(`[Kula] Zakładam: ${this.balls[ballId]?.name || 'Kula #' + ballId}`);
    },

    _populateSelect() {
      const $select = $('#ball_select');
      if (!$select.length) return;

      const currentVal = $select.val();
      $select.find('option:not(:first)').remove();

      // Sort by lastSeen (most recent first)
      const sortedBalls = Object.entries(this.balls).sort((a, b) => {
        return (b[1].lastSeen || 0) - (a[1].lastSeen || 0);
      });

      sortedBalls.forEach(([ballId, data]) => {
        const displayName = data.isAngel ? `ANIELSKA: ${data.name}` : data.name;
        const option = $(`<option value="${ballId}">${displayName}</option>`);
        if (data.isAngel) option.addClass('angel-option');
        $select.append(option);
      });

      if (currentVal && this.balls[currentVal]) {
        $select.val(currentVal);
      }
    },

    /** Update lastSeen when ball is opened. */
    updateLastSeen(ballId) {
      if (this.balls[ballId]) {
        this.balls[ballId].lastSeen = Date.now();
        this.save();
      }
    },

    /** Build naming bar HTML for injection into #soulstone_interface. */
    buildNamingBarHTML() {
      const currentBallId = GAME.ball_id || '';
      const currentBall = this.balls[currentBallId];
      const currentName = currentBall ? currentBall.name : '';

      return `
                <div class="ball-name-bar">
                    <label>Nazwa kuli:</label>
                    <input type="text" id="ball-name-input" placeholder="np. Trening" value="${currentName}">
                    <button id="ball-name-save">Zapisz</button>
                    <button id="ball-name-delete" class="delete-ball">Usuń</button>
                </div>`;
    },

    /** Inject naming bar below #ss_name if not already present. */
    injectNamingBar() {
      if ($('.ball-name-bar').length) {
        // Update existing
        const currentBallId = GAME.ball_id || '';
        const currentBall = this.balls[currentBallId];
        const currentName = currentBall ? currentBall.name : '';
        $('#ball-name-input').val(currentName);
        return;
      }

      // Inject below #ss_name
      const $anchor = $('#ss_name');
      if ($anchor.length) {
        $anchor.after(this.buildNamingBarHTML());
      }
    }
  };

  window.BALL_NAMES = BALL_NAMES;

  // Inject CSS
  $('body').append(`<style>${CSS}</style>`);

  // Wait for GAME + topbar, then inject selector
  const initCheck = setInterval(() => {
    if (typeof GAME === 'undefined' || !GAME.char_data?.id || !$('#top_bar').length) return;
    clearInterval(initCheck);

    BALL_NAMES.load();

    // Add topbar selector
    $('#top_bar').append('<select id="ball_select"><option value="">-- Kukla --</option></select>');
    BALL_NAMES._populateSelect();
  }, 500);

  // Topbar select change → equip ball
  $('body').on('change', '#ball_select', function () {
    const ballId = $(this).val();
    if (ballId) {
      BALL_NAMES.equipBall(ballId);
    }
  });

  // Save button
  $('body').on('click', '#ball-name-save', () => {
    const ballId = GAME.ball_id;
    if (!ballId) {
      GAME.komunikat('[Kula] Najpierw otwórz kuklę!');
      return;
    }

    const name = $('#ball-name-input').val().trim();
    if (!name) {
      GAME.komunikat('[Kula] Wpisz nazwę!');
      return;
    }

    // Detect if angel ball
    const nameEl = document.querySelector('#ss_name');
    const isAngel = nameEl && nameEl.textContent.trim() === 'Anielska Kula Energii';

    BALL_NAMES.saveBall(ballId, name, isAngel);
  });

  // Delete button
  $('body').on('click', '#ball-name-delete', () => {
    const ballId = GAME.ball_id;
    if (ballId && BALL_NAMES.balls[ballId]) {
      BALL_NAMES.deleteBall(ballId);
      GAME.komunikat('[Kula] Usunięto z listy');
      $('#ball-name-input').val('');
    }
  });

  // Inject naming bar when ball opens (parseData 55)
  const origPD = GAME.parseData ? GAME.parseData.bind(GAME) : null;
  if (origPD) {
    GAME.parseData = function (type, res) {
      origPD(type, res);
      if (type === 55 && res && res.ball) {
        setTimeout(() => {
          BALL_NAMES.injectNamingBar();
          BALL_NAMES.updateLastSeen(GAME.ball_id);
        }, 100);
      }
    };
  }
})();

// ============================================================
// 3. BALL_MANAGER - Orchestrator with mutual exclusion
//    Initializes BALL_RESPONSE, provides acquire/release/stopAll.
// ============================================================
(function () {
  'use strict';

  const BALL_MANAGER = {
    activeModule: null, // 'upgrade' | 'reset' | 'angelReset' | 'exp' | null

    init() {
      BALL_RESPONSE.init();

      // Cleanup on soulstone close or page navigation
      $('body').on('click', '#soulstone_interface .closeicon', () => this.stopAll());
    },

    /**
     * Acquire lock for a module. Returns false if another is active.
     * @param {string} name
     * @returns {boolean}
     */
    acquire(name) {
      if (this.activeModule && this.activeModule !== name) {
        GAME.komunikat(`[Kula] Nie można uruchomić - ${this._label(this.activeModule)} jest aktywny!`);
        return false;
      }
      this.activeModule = name;
      return true;
    },

    /** Release lock for a module. */
    release(name) {
      if (this.activeModule === name) {
        this.activeModule = null;
        BALL_RESPONSE.cancel();
      }
    },

    /** Force-stop whatever is running. */
    stopAll() {
      if (!this.activeModule) return;
      const mod = this.activeModule;
      switch (mod) {
        case 'upgrade': BALL_UPGRADE.stop(); break;
        case 'reset': BALL_RESET.stop(); break;
        case 'angelReset': BALL_ANGEL_RESET.stop(); break;
        case 'exp': BALL_EXP.stop(); break;
      }
      this.activeModule = null;
      BALL_RESPONSE.cancel();
    },

    _label(name) {
      const labels = { upgrade: 'Ulepszanie', reset: 'Reset', angelReset: 'Reset anielskiej', exp: 'Exp' };
      return labels[name] || name;
    }
  };

  window.BALL_MANAGER = BALL_MANAGER;

  // Init guard - wait for GAME
  const check = setInterval(() => {
    if (typeof GAME !== 'undefined' && GAME.completeProgress && GAME.socket) {
      clearInterval(check);
      BALL_MANAGER.init();
    }
  }, 500);
})();
