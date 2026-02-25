// Ball stat upgrader - auto-upgrade with checkbox-based stat selection.
// Accepts upgrades when sum of selected stat changes >= 0.
(function () {
    'use strict';

    const BALL_UPGRADE = {
        isRunning: false,
        bonuses: [],

        async run() {
            if (!BALL_MANAGER.acquire('upgrade')) return;
            this.isRunning = true;
            this._updateUI();
            this._disableCheckboxes(true);

            try {
                while (this.isRunning) {
                    // Read which stats user wants to track
                    this._markBonuses();
                    if (this.bonuses.length === 0 || this.bonuses.every(v => v === false)) {
                        GAME.komunikat('[Kula] Zaznacz przynajmniej jeden stat!');
                        break;
                    }

                    // Evaluate current upgrade offer
                    const shouldAccept = this._evaluateBonuses();
                    if (shouldAccept) {
                        GAME.emitOrder({ a: 45, type: 5, bid: GAME.ball_id });
                        await this._delay(300);
                    }

                    // Request next upgrade
                    GAME.emitOrder({ a: 45, type: 3, bid: GAME.ball_id });
                    const res = await BALL_RESPONSE.waitForResponse(10000);
                    if (!res || !this.isRunning) break;
                }
            } catch (e) {
                console.warn('[BallUpgrade] Error:', e.message);
            }

            this.isRunning = false;
            BALL_MANAGER.release('upgrade');
            this._disableCheckboxes(false);
            this._updateUI();
        },

        stop() {
            this.isRunning = false;
            this._disableCheckboxes(false);
            this._updateUI();
        },

        _markBonuses() {
            this.bonuses = [];
            $('.ball_stats.stat_page tr[id]:not([style*="display: none"])').each((index) => {
                const cb = $(`#bon${index + 1}_upgrade`)[0];
                this.bonuses.push(cb ? cb.checked : false);
            });
        },

        _evaluateBonuses() {
            let sum = 0;
            this.bonuses.forEach((shouldInclude, index) => {
                if (shouldInclude) {
                    sum += parseFloat($(`#ss_change_${index + 1}`).text()) || 0;
                }
            });
            return sum >= 0;
        },

        _disableCheckboxes(disabled) {
            $('.ball_stats.stat_page input[type=checkbox]').prop('disabled', disabled);
        },

        _updateUI() {
            const btn = $('button[data-option="ss_upgrade_all"]');
            btn.html(this.isRunning ? 'STOP' : 'Ulepszaj wszystkie');
        },

        _showCheckboxes() {
            $('.ball_stats.stat_page tr[id]:not([style*="display: none"])').each(function (index) {
                if (!$(`#bon${index + 1}_upgrade`).length) {
                    $(`#stat${index + 1}_bon`).after(
                        `<input type="checkbox" id="bon${index + 1}_upgrade" value="${index + 1}">`
                    );
                }
            });
        },

        _hideCheckboxes() {
            $('.ball_stats.stat_page input[type=checkbox]').remove();
        },

        _showButton() {
            if (!$('button[data-option="ss_upgrade_all"]').length) {
                $('#ss_page_upgrade > button').after(
                    '<button class="newBtn option" data-option="ss_upgrade_all">Ulepszaj wszystkie</button>'
                );
            }
        },

        _hideButton() {
            $('button[data-option="ss_upgrade_all"]').remove();
        },

        _delay(ms) {
            return new Promise(r => setTimeout(r, ms));
        }
    };

    window.BALL_UPGRADE = BALL_UPGRADE;

    // UI event handlers
    $('body').on('click', 'button[data-option="ss_page"][data-page="upgrade"]', () => {
        BALL_UPGRADE._showCheckboxes();
        BALL_UPGRADE._showButton();
    });
    $('body').on('click', 'button[data-option="ss_page"][data-page="reset"], #soulstone_interface .closeicon', () => {
        if (BALL_UPGRADE.isRunning) BALL_UPGRADE.stop();
        BALL_UPGRADE._hideCheckboxes();
        BALL_UPGRADE._hideButton();
    });
    $('body').on('click', 'button[data-option="ss_upgrade_all"]', () => {
        if (BALL_UPGRADE.isRunning) {
            BALL_UPGRADE.stop();
        } else {
            BALL_UPGRADE.run();
        }
    });
})();
