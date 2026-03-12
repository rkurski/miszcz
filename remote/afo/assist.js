/**
 * ============================================================================
 * AFO - Clan Training Assistant Module
 * ============================================================================
 *
 * Automates clan training and assists:
 * - TRENUJ: Start training, cancel when selected player assists, loop
 * - ASYSTUJ: Monitor selected player's trainings and assist ASAP
 *
 * ============================================================================
 */

const AFO_ASSIST = {

  // ============================================
  // MAIN LOOPS
  // ============================================

  /**
   * TRENUJ Loop (lag-resistant):
   * 1. Start training (1h strength)
   * 2. Wait for server confirmation (GAME.is_training)
   * 3. Wait for assist OR 5s watchdog
   * 4. Cancel training
   * 5. Wait for server confirmation (!GAME.is_training)
   * 6. Cooldown and repeat
   */
  startTraining() {
    if (ASSIST.trainStop) return;

    ASSIST.trainState = 1;
    ASSIST.assistReceived = false;

    // Start 1h strength training
    GAME.socket.emit('ga', {
      a: 8,
      type: 2,
      stat: 1,      // Siła
      duration: 1   // 1 godzina
    });

    console.log('[AFO_ASSIST] Training request sent');

    // Wait for server to confirm training started
    this._waitForTrainingStart();
  },

  /**
   * Wait for GAME.is_training to become true (server confirmation).
   * Safety valve: proceed after 3s even if not confirmed.
   */
  _waitForTrainingStart() {
    const startTime = Date.now();
    const check = () => {
      if (ASSIST.trainStop) { ASSIST.trainState = 0; return; }
      if (GAME.is_training) {
        console.log('[AFO_ASSIST] Training confirmed by server (' + (Date.now() - startTime) + 'ms)');
        ASSIST.trainState = 2;
        this.checkTrainProgress();
        return;
      }
      if (Date.now() - startTime > 3000) {
        console.log('[AFO_ASSIST] Training start safety valve (3s), proceeding anyway');
        ASSIST.trainState = 2;
        this.checkTrainProgress();
        return;
      }
      setTimeout(check, 200);
    };
    setTimeout(check, ASSIST.wait);
  },

  /**
   * Wait for assist with 5s watchdog.
   * If assist not received within 5s, force-cancel.
   */
  checkTrainProgress() {
    if (ASSIST.trainStop) {
      ASSIST.trainState = 0;
      return;
    }

    const startTime = Date.now();
    const check = () => {
      if (ASSIST.trainStop) { ASSIST.trainState = 0; return; }
      if (ASSIST.assistReceived) {
        console.log('[AFO_ASSIST] Assist received, canceling training');
        this.cancelTraining();
        return;
      }
      if (Date.now() - startTime > 5000) {
        console.log('[AFO_ASSIST] Watchdog: 5s no assist, force cancel');
        this.cancelTraining();
        return;
      }
      setTimeout(check, 500);
    };
    check();
  },

  cancelTraining() {
    ASSIST.trainState = 3;

    // Cancel current training
    GAME.socket.emit('ga', {a: 8, type: 3});

    console.log('[AFO_ASSIST] Cancel request sent');

    // Wait for server to confirm training ended
    this._waitForTrainingEnd();
  },

  /**
   * Wait for GAME.is_training to become false (server confirmed cancel).
   * Safety valve: proceed after 3s even if not confirmed.
   */
  _waitForTrainingEnd() {
    const startTime = Date.now();
    const check = () => {
      if (ASSIST.trainStop) { ASSIST.trainState = 0; return; }
      if (!GAME.is_training) {
        console.log('[AFO_ASSIST] Cancel confirmed by server (' + (Date.now() - startTime) + 'ms)');
        ASSIST.trainState = 0;
        ASSIST.assistReceived = false;
        this.startTraining(); // Loop
        return;
      }
      if (Date.now() - startTime > 3000) {
        console.log('[AFO_ASSIST] Cancel safety valve (3s), restarting anyway');
        ASSIST.trainState = 0;
        ASSIST.assistReceived = false;
        this.startTraining(); // Loop
        return;
      }
      setTimeout(check, 200);
    };
    setTimeout(check, ASSIST.wait);
  },

  /**
   * ASYSTUJ Loop:
   * 1. Fetch clan trainings list
   * 2. Find selected player's training
   * 3. Assist if found and not already assisting
   * 4. Cooldown and repeat
   */
  startAssisting() {
    if (ASSIST.assistStop || ASSIST.selectedPlayerId === 0) return;

    ASSIST.assistState = 1;
    this.fetchTrains();
  },

  fetchTrains() {
    if (ASSIST.assistStop) {
      ASSIST.assistState = 0;
      return;
    }

    // Request clan trainings
    GAME.socket.emit('ga', {a: 39, type: 54});

    console.log('[AFO_ASSIST] Fetching trainings');

    // Wait for parseClanData(17) to populate ASSIST.clanTrains
    setTimeout(() => this.findPlayerTrain(), ASSIST.wait);
  },

  findPlayerTrain() {
    if (ASSIST.assistStop) {
      ASSIST.assistState = 0;
      return;
    }

    ASSIST.assistState = 3;

    const trains = ASSIST.clanTrains;
    if (!trains || trains.length === 0) {
      // No trainings, retry
      setTimeout(() => this.fetchTrains(), 2000);
      return;
    }

    // Find selected player's training where we haven't assisted yet
    const playerTrain = trains.find(t =>
      t.char_id === ASSIST.selectedPlayerId &&
      (!t.helpers || !t.helpers.chars || t.helpers.chars.indexOf(GAME.char_id) === -1)
    );

    if (playerTrain) {
      console.log('[AFO_ASSIST] Found training for', ASSIST.selectedPlayer);
      this.doAssist(playerTrain.id, playerTrain.char_id);
    } else {
      // No training found, retry
      setTimeout(() => this.fetchTrains(), 2000);
    }
  },

  doAssist(tid, target) {
    ASSIST.assistState = 4;

    GAME.socket.emit('ga', {
      a: 39,
      type: 55,
      tid: tid,
      target: target
    });

    console.log('[AFO_ASSIST] Assist sent to', ASSIST.selectedPlayer);

    // Cooldown and restart loop
    setTimeout(() => {
      ASSIST.assistState = 0;
      this.startAssisting();
    }, ASSIST.wait);
  },

  // ============================================
  // CLAN DATA HANDLER (called from hook)
  // ============================================

  handleClanData(res, type) {
    switch(type) {
      case 4:  // Lista członków
        ASSIST.clanMembers = res.players || [];
        this.updateMemberSelect();
        console.log('[AFO_ASSIST] Clan members updated:', ASSIST.clanMembers.length);
        break;

      case 17: // Lista treningów
        ASSIST.clanTrains = res.trains || [];
        console.log('[AFO_ASSIST] Clan trainings updated:', ASSIST.clanTrains.length);
        break;

      case 18: // Aktualizacja treningu (nowa asysta)
        if (res.assistant && res.assistant[0] == ASSIST.selectedPlayerId) {
          ASSIST.assistReceived = true;
          console.log('[AFO_ASSIST] Assist detected from', ASSIST.selectedPlayer);
        }
        break;
    }
  },

  // ============================================
  // UI UPDATES
  // ============================================

  updateMemberSelect() {
    const select = $('#assist_player_select');
    if (select.length === 0) return;

    select.empty();
    select.append('<option value="0">-</option>');

    // Sort alphabetically, exclude self
    const sorted = ASSIST.clanMembers
      .filter(p => p.id !== GAME.char_id)
      .sort((a, b) => a.name.localeCompare(b.name));

    sorted.forEach(player => {
      const selected = player.id == ASSIST.selectedPlayerId ? 'selected' : '';
      select.append(`<option value="${player.id}" ${selected}>${player.name}</option>`);
    });
  },

  // ============================================
  // PANEL HANDLERS
  // ============================================

  bindHandlers() {
    // TRENUJ toggle
    $('#assist_Panel .assist_train').click(() => {
      if (ASSIST.trainStop) {
        ASSIST.trainStop = false;
        ASSIST.trainState = 0;
        ASSIST.assistReceived = false;
        $('.assist_train .assist_status').removeClass('red').addClass('green').html('On');
        this.startTraining();
      } else {
        ASSIST.trainStop = true;
        ASSIST.trainState = 0;
        $('.assist_train .assist_status').removeClass('green').addClass('red').html('Off');
      }
    });

    // ASYSTUJ toggle
    $('#assist_Panel .assist_assist').click(() => {
      if (ASSIST.assistStop) {
        if (ASSIST.selectedPlayerId === 0) {
          GAME.komunikat('Wybierz gracza z listy!');
          return;
        }
        ASSIST.assistStop = false;
        ASSIST.assistState = 0;
        $('.assist_assist .assist_status').removeClass('red').addClass('green').html('On');
        this.startAssisting();
      } else {
        ASSIST.assistStop = true;
        ASSIST.assistState = 0;
        $('.assist_assist .assist_status').removeClass('green').addClass('red').html('Off');
      }
    });

    // Player select change
    $('#assist_player_select').on('change', function() {
      const playerId = parseInt($(this).val());
      const playerName = $(this).find('option:selected').text();

      ASSIST.selectedPlayerId = playerId;
      ASSIST.selectedPlayer = playerName;

      console.log('[AFO_ASSIST] Selected player:', playerName, '(ID:', playerId, ')');
    });

    console.log('[AFO_ASSIST] Handlers bound');
  },

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    // Fetch initial clan members list
    if (GAME.char_data && GAME.char_data.klan_id > 0) {
      setTimeout(() => {
        GAME.socket.emit('ga', {a: 39, type: 15});
        console.log('[AFO_ASSIST] Fetching initial clan members');
      }, 1200);
    }
  }
};

// Export
window.AFO_ASSIST = AFO_ASSIST;
console.log('[AFO] Assist module loaded');
