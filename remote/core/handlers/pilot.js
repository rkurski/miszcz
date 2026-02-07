/**
 * ============================================================================
 * GIENIOBOT - Alternative Pilot Module
 * ============================================================================
 *
 * Virtual keyboard overlay for mobile/touch control.
 * Creates on-screen buttons that simulate keyboard input for map navigation.
 * Toggle on/off with "=" key or alt pilot button. Draggable with touch support.
 *
 * ============================================================================
 */

const PilotMixin = {

  _altPilotActive: false,

  toggleAlternativePilot() {
    if (this._altPilotActive) {
      this.destroyAlternativePilot();
    } else {
      this.createAlternativePilot();
    }
  },

  createAlternativePilot() {
    if (this._altPilotActive) return;

    // Hide original pilot
    this._hideOriginalPilot();

    // Inject styles (with ID for easy removal)
    if (!$('#kws_alt_pilot_styles').length) {
      $('head').append(`<style id="kws_alt_pilot_styles">
        #kws_alt_pilot_container {
          position: absolute;
          z-index: 9998;
          background: url(/gfx/layout/tloPilot.png);
          background-size: cover;
          border-image: url(/gfx/layout/mapborder.png) 7 8 7 7 fill;
          border-style: solid;
          border-width: 7px 8px 7px 7px;
          padding: 8px;
        }
        #kws_alt_pilot_header {
          background: url("https://i.imgur.com/Mi3kUpg.png");
          background-size: 100% 100%;
          padding: 5px 10px;
          cursor: move;
          text-align: center;
          color: #fff;
          font-family: 'Play', sans-serif;
          font-weight: bold;
          font-size: 14px;
          user-select: none;
          margin-bottom: 6px;
          border-radius: 3px;
        }
        #kws_alt_pilot_content {
          display: grid;
          grid-template-columns: auto auto;
          gap: 6px;
        }
        .kws_alt_col {}
        .kws_alt_group_label {
          color: #305779;
          font-family: 'Play', sans-serif;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 3px;
          padding-left: 2px;
        }
        .kws_alt_btn_group {
          display: grid;
          gap: 4px;
          margin-bottom: 6px;
        }
        .kws_alt_btn_group.g3 { grid-template-columns: repeat(3, 1fr); }
        .kws_alt_separator {
          border: none;
          border-top: 1px solid #305779;
          margin: 4px 0;
        }
        .kws_alt_btn {
          min-width: 60px;
          min-height: 60px;
          border-radius: 5px;
          border: 2px solid #305779;
          padding: 4px;
          background: rgba(4, 14, 19, 0.85);
          color: #fff;
          cursor: pointer;
          font-size: 22px;
          font-family: 'Play', sans-serif;
          font-weight: bold;
          text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
          transition: border-color 0.15s, box-shadow 0.15s;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .kws_alt_btn:hover { border-color: #3fc1c9; box-shadow: 0 0 8px 2px #3fc1c9; }
        .kws_alt_btn:active { background: rgba(63, 193, 201, 0.25); border-color: #f9ca24; }
        .kws_alt_btn.small {
          min-width: 52px;
          min-height: 52px;
          font-size: 14px;
        }
        .kws_alt_btn.close_btn {
          border-color: #993333;
          color: #ff6b6b;
          min-height: 28px;
          min-width: unset;
          font-size: 11px;
          padding: 3px 8px;
          opacity: 0.7;
        }
        .kws_alt_btn.close_btn:hover { border-color: #ff4444; box-shadow: 0 0 8px 2px #ff4444; opacity: 1; }
        .kws_alt_btn.txt_btn { font-size: 11px; line-height: 1.1; }
        .kws_alt_btn.ico_btn.clock { background-image: url('https://i.imgur.com/9YCvJKe.png'); background-size: contain; }
      </style>`);
    }

    // Build HTML - two columns: left = directions+actions, right = x5+combat
    const html = `
      <div id="kws_alt_pilot_container">
        <div id="kws_alt_pilot_header">PILOT</div>

        <div id="kws_alt_pilot_content">
          <div class="kws_alt_col">
            <div class="kws_alt_group_label">Kierunki</div>
            <div class="kws_alt_btn_group g3">
              <button id="klawiszq" class="kws_alt_btn">Q</button>
              <button id="klawiszw" class="kws_alt_btn">&#8593;</button>
              <button id="klawisze" class="kws_alt_btn">E</button>
              <button id="klawisza" class="kws_alt_btn">&#8592;</button>
              <button id="klawiszs" class="kws_alt_btn">&#8595;</button>
              <button id="klawiszd" class="kws_alt_btn">&#8594;</button>
              <button id="klawiszz" class="kws_alt_btn">Z</button>
              <button id="klawiszx" class="kws_alt_btn">X</button>
              <button id="klawiszc" class="kws_alt_btn">C</button>
            </div>
            <div class="kws_alt_group_label">Akcje</div>
            <div class="kws_alt_btn_group g3">
              <button id="klawiszy" class="kws_alt_btn">Y</button>
              <button id="klawiszr" class="kws_alt_btn">R</button>
              <button id="klawiszv" class="kws_alt_btn">V</button>
            </div>
          </div>

          <div class="kws_alt_col">
            <div class="kws_alt_group_label">Ruch x5</div>
            <div class="kws_alt_btn_group g3">
              <button id="klawiszqx3" class="kws_alt_btn small">Qx5</button>
              <button id="klawiszwx3" class="kws_alt_btn small">&#8593;x5</button>
              <button id="klawiszex3" class="kws_alt_btn small">Ex5</button>
              <button id="klawiszax3" class="kws_alt_btn small">&#8592;x5</button>
              <button id="klawiszsx3" class="kws_alt_btn small">&#8595;x5</button>
              <button id="klawiszdx3" class="kws_alt_btn small">&#8594;x5</button>
              <button id="klawiszzx3" class="kws_alt_btn small">Zx5</button>
              <button id="klawiszb5" class="kws_alt_btn small">B</button>
              <button id="klawiszcx3" class="kws_alt_btn small">Cx5</button>
              <button id="klawiszvx3" class="kws_alt_btn small">Vx5</button>
              <button id="klawiszn" class="kws_alt_btn small ico_btn clock" title="Zegarek (N)"></button>
            </div>
          </div>
        </div>

        <div style="margin-top:6px;">
          <div class="kws_alt_group_label">Skróty</div>
          <div class="kws_alt_btn_group" style="grid-template-columns: repeat(6, 1fr); margin-bottom:6px;">
            <!-- <button id="klawisz1" class="kws_alt_btn small">1</button> // native game key -->
            <button id="klawisz2" class="kws_alt_btn small txt_btn" title="Prywatna Planeta">PP</button>
            <button id="klawisz3" class="kws_alt_btn small txt_btn" title="Klanowa Planeta">PK</button>
            <button id="klawisz4" class="kws_alt_btn small txt_btn" title="Błogosławieństwo">BLESS</button>
            <button id="klawisz5" class="kws_alt_btn small txt_btn" title="VIP + Ekspedycja">VIP</button>
            <!-- <button id="klawisz6" class="kws_alt_btn small txt_btn" title="Postać klanowa">KLAN</button> -->
            <button id="klawisz7" class="kws_alt_btn small txt_btn" title="Ustaw wyprawę">WYP</button>
            <button id="klawisz8" class="kws_alt_btn small txt_btn" title="Zmień zestaw">SET</button>
            <!-- <button id="klawisz9" class="kws_alt_btn small">9</button> // native game key -->
          </div>
          <button id="klawiszspacja" class="kws_alt_btn close_btn" style="width:100%;">ZAMKNIJ</button>
        </div>
      </div>`;

    $('body').append(html);

    // Position at center of current viewport (works with mobile zoom)
    this._positionAltPilotInViewport();

    // Make draggable
    this._makeAltPilotDraggable();

    // Bind button handlers
    this.bindAlternativePilotButtons();

    this._altPilotActive = true;
  },

  destroyAlternativePilot() {
    $('#kws_alt_pilot_container').remove();
    $('#kws_alt_pilot_styles').remove();

    // Show original pilot
    this._showOriginalPilot();

    this._altPilotActive = false;
  },

  _positionAltPilotInViewport() {
    const el = document.getElementById('kws_alt_pilot_container');
    if (!el) return;

    // Calculate center of the current visible viewport
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    // Temporarily show to measure
    const elW = el.offsetWidth;
    const elH = el.offsetHeight;

    // Center horizontally, position near top third vertically
    let posX = scrollX + Math.max(0, (vpW - elW) / 2);
    let posY = scrollY + Math.max(10, (vpH - elH) / 3);

    el.style.left = posX + 'px';
    el.style.top = posY + 'px';
  },

  _hideOriginalPilot() {
    var kwsHidePilotElement = document.getElementById('kws_hidePilot');
    var mapPilotElement = document.getElementById('map_pilot');
    if (kwsHidePilotElement) {
      kwsHidePilotElement.value = '1';
      var changeEvent = new Event('change');
      kwsHidePilotElement.dispatchEvent(changeEvent);
      if (kwsHidePilotElement.value === '1' && mapPilotElement) {
        mapPilotElement.style.display = 'none';
      }
      var clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
      kwsHidePilotElement.dispatchEvent(clickEvent);
    }
  },

  _showOriginalPilot() {
    var kwsHidePilotElement = document.getElementById('kws_hidePilot');
    var mapPilotElement = document.getElementById('map_pilot');
    if (kwsHidePilotElement) {
      kwsHidePilotElement.value = '0';
      var changeEvent = new Event('change');
      kwsHidePilotElement.dispatchEvent(changeEvent);
      if (kwsHidePilotElement.value === '0' && mapPilotElement) {
        mapPilotElement.style.display = 'block';
      }
      var clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
      kwsHidePilotElement.dispatchEvent(clickEvent);
    }
  },

  _makeAltPilotDraggable() {
    const element = document.getElementById('kws_alt_pilot_container');
    const handle = document.getElementById('kws_alt_pilot_header');
    if (!element || !handle) return;

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
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      // Convert client coords to page coords (accounts for scroll/zoom)
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      let newX = scrollX + clientX - offsetX;
      let newY = scrollY + clientY - offsetY;

      // Keep within page bounds
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      element.style.left = newX + 'px';
      element.style.top = newY + 'px';
    };

    const onEnd = () => {
      isDragging = false;
      element.style.transition = '';
    };

    handle.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    handle.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  },

  bindAlternativePilotButtons() {
    const self = this;

    // Close button
    $('#klawiszspacja').click(() => self.destroyAlternativePilot());

    // Direction buttons
    $('#klawiszw').click(() => GAME.map_move(2));
    $('#klawiszq').click(() => GAME.map_move(6));
    $('#klawisze').click(() => GAME.map_move(5));
    $('#klawiszs').click(() => GAME.map_move(1));
    $('#klawisza').click(() => GAME.map_move(8));
    $('#klawiszd').click(() => GAME.map_move(7));
    $('#klawiszz').click(() => GAME.map_move(4));
    $('#klawiszc').click(() => GAME.map_move(3));

    // Action buttons
    $('#klawiszx').click(() => {
      self.questProceed();
      kom_clear();
      GAME.executeIx();
    });
    $('#klawiszr').click(() => GAME.emitOrder({ a: 13, mob_num: GAME.field_mob_id, fo: GAME.map_options.ma }));
    $('#klawiszy').click(() => GAME.emitOrder({ a: 444, max: GAME.spawner[0], ignore: GAME.spawner[1] }));
    $('#klawiszv').click(() => GAME.emitOrder({ a: 7, order: 2, quick: 1, fo: GAME.map_options.ma }));

    // Number buttons
    $('#klawisz1').click(() => {
      var keyEvent = jQuery.Event('keydown');
      keyEvent.which = 49;
      $(document).trigger(keyEvent);
    });
    $('#klawisz2').click(() => GAME.socket.emit('ga', { a: 15, type: 13 }));
    $('#klawisz3').click(() => GAME.socket.emit('ga', { a: 39, type: 32 }));
    $('#klawisz4').click(() => self.bless());
    $('#klawisz5').click(() => {
      setTimeout(() => GAME.socket.emit('ga', { a: 54, type: 0 }), 300);
      setTimeout(() => self.vip(), 600);
      GAME.socket.emit('ga', { a: 15, type: 7 });
    });
    $('#klawisz6').click(() => GAME.socket.emit('ga', { a: 39, type: 46, rent: 3 }));
    $('#klawisz7').click(() => GAME.socket.emit('ga', { a: 10, type: 2, ct: 0 }));
    $('#klawisz8').click(() => {
      let set = $("#ekw_sets").find(".option.ek_sets_all:not(.current)").attr("data-set");
      if (set != undefined) {
        GAME.socket.emit('ga', { a: 64, type: 2, set: set });
      }
    });
    $('#klawisz9').click(() => {
      var keyEvent = jQuery.Event('keydown');
      keyEvent.which = 57;
      $(document).trigger(keyEvent);
    });

    // x5 multiplier buttons
    const moveMultiple = (direction, times = 5, delay = 130) => {
      for (let i = 0; i < times; i++) {
        setTimeout(() => GAME.map_move(direction), i * delay);
      }
    };

    $('#klawiszqx3').click(() => moveMultiple(6));
    $('#klawiszwx3').click(() => moveMultiple(2));
    $('#klawiszex3').click(() => moveMultiple(5));
    $('#klawiszax3').click(() => moveMultiple(8));
    $('#klawiszsx3').click(() => moveMultiple(1));
    $('#klawiszdx3').click(() => moveMultiple(7));
    $('#klawiszzx3').click(() => moveMultiple(4));
    $('#klawiszcx3').click(() => moveMultiple(3));
    $('#klawiszvx3').click(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => GAME.emitOrder({ a: 7, order: 2, quick: 1, fo: GAME.map_options.ma }), i * 130);
      }
    });

    // Combat buttons
    $('#klawiszb5').click(() => self.pvpKill());
    $('#klawiszn').click(() => {
      self.useCompressor();
      kom_clear();
    });
  }
};

// Export mixin
window.PilotMixin = PilotMixin;
console.log('[Pilot] Module loaded');
