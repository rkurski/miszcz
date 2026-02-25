// Ball EXP grinder - auto-upgrade to fill exp bar.
// Two modes: "Exp do NEXT" (stop at level) and "Exp non-stop".
(function () {
    'use strict';

    const BALL_EXP = {
        isRunning: false,
        nonStop: false,

        async run() {
            if (!BALL_MANAGER.acquire('exp')) return;
            this.isRunning = true;
            this._updateUI();

            try {
                while (this.isRunning) {
                    GAME.emitOrder({ a: 45, type: 3, bid: GAME.ball_id });
                    const res = await BALL_RESPONSE.waitForResponse(10000);
                    if (!res || !this.isRunning) break;

                    if (!this.nonStop && res.bd) {
                        const exp = parseInt(res.bd.exp) || 0;
                        const needed = parseInt(res.bd.next_lvl) || 0;
                        if (needed > 0 && exp >= needed) break;
                    }
                }
            } catch (e) {
                console.warn('[BallExp] Error:', e.message);
            }

            this.isRunning = false;
            this.nonStop = false;
            BALL_MANAGER.release('exp');
            this._updateUI();
        },

        stop() {
            this.isRunning = false;
            this.nonStop = false;
            this._updateUI();
        },

        _updateUI() {
            if (this.isRunning) {
                $('#ss_lvlup_next').html('STOP');
                $('#ss_lvlup_nonstop').html('STOP');
            } else {
                $('#ss_lvlup_next').html('Exp do NEXT');
                $('#ss_lvlup_nonstop').html('Exp no stop');
            }
        },

        _showButtons() {
            const anchor = $('#soulstone_interface > div.pull-left.ball_stats > div > div.main_bar');
            if (!$('#ss_lvlup_next').length) {
                anchor.after('<button id="ss_lvlup_nonstop" class="btn_small_gold option" data-option="ss_lvlup_nonstop">Exp no stop</button>');
                anchor.after('<button id="ss_lvlup_next" class="btn_small_gold option" data-option="ss_lvlup_next">Exp do NEXT</button>');
            }
        },

        _hideButtons() {
            $('#ss_lvlup_next').remove();
            $('#ss_lvlup_nonstop').remove();
        }
    };

    window.BALL_EXP = BALL_EXP;

    // UI event handlers
    $('body').on('click', 'button[data-option="ss_page"][data-page="upgrade"]', () => {
        BALL_EXP._showButtons();
    });
    $('body').on('click', 'button[data-option="ss_page"][data-page="reset"], #soulstone_interface .closeicon', () => {
        if (BALL_EXP.isRunning) BALL_EXP.stop();
        BALL_EXP._hideButtons();
    });
    $('body').on('click', '#ss_lvlup_next', () => {
        if (BALL_EXP.isRunning) {
            BALL_EXP.stop();
        } else {
            BALL_EXP.nonStop = false;
            BALL_EXP.run();
        }
    });
    $('body').on('click', '#ss_lvlup_nonstop', () => {
        if (BALL_EXP.isRunning) {
            BALL_EXP.stop();
        } else {
            BALL_EXP.nonStop = true;
            BALL_EXP.run();
        }
    });
})();
