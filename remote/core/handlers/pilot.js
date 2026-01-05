/**
 * ============================================================================
 * GIENIOBOT - Alternative Pilot Module
 * ============================================================================
 * 
 * Virtual keyboard overlay for mobile/touch control.
 * Creates on-screen buttons that simulate keyboard input for map navigation.
 * 
 * ============================================================================
 */

const PilotMixin = {

  createAlternativePilot() {
    document.getElementById('map_pilot').style.width = '512px';
    var customStyles = document.createElement('style');
    customStyles.type = 'text/css';
    customStyles.innerHTML = `
      .qtrack {
        width: 410px !important;
        font-size: 12px !important;
      }
      .qtrack strong {
        font-size: 12px !important;
      }
      .adv {
        display: none !important;
      }
      .kom {
        background: url(/gfx/layout/tloPilot.png) !important;
        background-size: cover !important;
        border-image: url(/gfx/layout/mapborder.png) 7 8 7 7 fill !important;
        border-style: solid !important;
        border-width: 7px 8px 7px 7px !important;
        box-shadow: none !important;
      }
      .kom .close_kom b {
        background: url(/gfx/layout/tloPilot.png) !important;
      }
      #war_container {
        position: absolute !important;
        left: 10px !important;
        top: 565px !important;
      }
      #quest_con {
        margin-top: -295px !important;
        left: -510px !important;
      }
    `;
    $("head").append(customStyles);
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
    } else {
      console.error('Element o ID "kws_hidePilot" nie został znaleziony.');
    }
    var minimap = document.querySelector('#minimap_canvas');
    var gridCanvas = document.querySelector('#minimap_grid_canvas');
    var minimapLay = document.querySelector('.minimap_lay');
    var kwsLocInfo = document.querySelector('#kws_locInfo');

    if (minimap) {
      minimap.style.left = '-15px';
      minimap.style.top = '813px';
    }

    if (gridCanvas) {
      gridCanvas.style.left = '-15px';
      gridCanvas.style.top = '813px';
    }

    if (minimapLay) {
      minimapLay.style.left = '-30px';
      minimapLay.style.top = '802px';
    }

    if (kwsLocInfo) {
      kwsLocInfo.style.left = '-35px';
      kwsLocInfo.style.top = '1030px';
    }

    // Create button container
    $('.clearfix').append('<div id="map_canvas_container" style="position:absolute; top:731px; left:59px; "></div>');

    // Direction buttons (WASD + diagonals)
    this._createPilotButton('#map_canvas_container', 'klawiszw', '530px', '144px', '70px', '70px', '&#8593;', '50px');
    this._createPilotButton('#map_canvas_container', 'klawiszq', '530px', '65px', '70px', '70px', 'Q', '50px');
    this._createPilotButton('#map_canvas_container', 'klawisze', '530px', '225px', '70px', '70px', 'E', '50px');
    this._createPilotButton('#map_canvas_container', 'klawiszs', '607px', '144px', '70px', '70px', '&#8595;', '50px');
    this._createPilotButton('#map_canvas_container', 'klawisza', '607px', '65px', '70px', '70px', '&#8592;', '50px');
    this._createPilotButton('#map_canvas_container', 'klawiszd', '607px', '225px', '70px', '70px', '&#8594;', '50px');
    this._createPilotButton('#map_canvas_container', 'klawiszx', '684px', '145px', '70px', '70px', 'x', '50px');
    this._createPilotButton('#map_canvas_container', 'klawiszz', '684px', '65px', '70px', '70px', 'Z', '50px');
    this._createPilotButton('#map_canvas_container', 'klawiszc', '684px', '225px', '70px', '70px', 'C', '50px');
    this._createPilotButton('#map_canvas_container', 'klawiszr', '761px', '100px', '70px', '70px', 'R', '50px');
    this._createPilotButton('#map_canvas_container', 'klawiszy', '761px', '11px', '70px', '70px', 'Y', '50px');
    this._createPilotButton('#map_canvas_container', 'klawiszv', '761px', '189px', '70px', '70px', 'V', '50px');

    // x5 multiplier buttons
    this._createPilotButton('#map_canvas_container', 'klawiszqx3', '530px', '310px', '60px', '60px', 'Qx5', '16px');
    this._createPilotButton('#map_canvas_container', 'klawiszwx3', '530px', '373px', '60px', '60px', '&#8593;x5', '16px');
    this._createPilotButton('#map_canvas_container', 'klawiszex3', '530px', '436px', '60px', '60px', 'Ex5', '16px');
    this._createPilotButton('#map_canvas_container', 'klawiszax3', '595px', '310px', '60px', '60px', '&#8592;x5', '16px');
    this._createPilotButton('#map_canvas_container', 'klawiszsx3', '595px', '373px', '60px', '60px', 'x5&#8595;', '16px');
    this._createPilotButton('#map_canvas_container', 'klawiszdx3', '595px', '436px', '60px', '60px', '&#8594;x5', '16px');
    this._createPilotButton('#map_canvas_container', 'klawiszzx3', '660px', '310px', '60px', '60px', 'Zx5', '16px');
    this._createPilotButton('#map_canvas_container', 'klawiszcx3', '660px', '436px', '60px', '60px', 'Cx5', '16px');
    this._createPilotButton('#map_canvas_container', 'klawiszvx3', '730px', '373px', '60px', '60px', 'Vx5', '16px');
    this._createPilotButton('#map_canvas_container', 'klawiszb5', '730px', '310px', '60px', '60px', 'B', '16px');
    this._createPilotButton('#map_canvas_container', 'klawiszn', '730px', '436px', '60px', '60px', 'N', '16px');

    // Number buttons
    this._createPilotButton('#map_canvas_container', 'klawisz1', '851px', '89px', '50px', '50px', '1', '20px');
    this._createPilotButton('#map_canvas_container', 'klawisz2', '851px', '149px', '50px', '50px', '2', '20px');
    this._createPilotButton('#map_canvas_container', 'klawisz3', '851px', '209px', '50px', '50px', '3', '20px');
    this._createPilotButton('#map_canvas_container', 'klawisz4', '911px', '89px', '50px', '50px', '4', '20px');
    this._createPilotButton('#map_canvas_container', 'klawisz5', '911px', '149px', '50px', '50px', '5', '20px');
    this._createPilotButton('#map_canvas_container', 'klawisz6', '911px', '209px', '50px', '50px', '6', '20px');
    this._createPilotButton('#map_canvas_container', 'klawisz7', '971px', '89px', '50px', '50px', '7', '20px');
    this._createPilotButton('#map_canvas_container', 'klawisz8', '971px', '149px', '50px', '50px', '8', '20px');
    this._createPilotButton('#map_canvas_container', 'klawisz9', '971px', '209px', '50px', '50px', '9', '20px');

    // Close button
    $('#map_canvas_container').append("<div style='position:absolute; top:1031px; left:89px; z-index:999;'><button id='klawiszspacja' style='width: 150px; height: 50px; border-radius: 5px; border: 2px solid white; padding: 5px; background-color: black; color: white; cursor: pointer; font-size: 20px;'>----------------</button></div>");

    this.bindAlternativePilotButtons();
  },

  _createPilotButton(container, id, top, left, width, height, label, fontSize) {
    $(container).append(`<div style='position:absolute; top:${top}; left:${left}; z-index:999;'><button id='${id}' style='width: ${width}; height: ${height}; border-radius: 5px; border: 2px solid white; padding: 5px; background-color: black; color: white; cursor: pointer; font-size: ${fontSize};'>${label}</button></div>`);
  },

  bindAlternativePilotButtons() {
    const self = this;

    // Close button - removes all pilot buttons
    $('#klawiszspacja').click(() => {
      $('#klawiszw, #klawiszy, #klawisz1, #klawisz2, #klawisz3, #klawisz4, #klawisz5, #klawisz6, #klawisz7, #klawisz8, #klawisz9, #klawiszq, #klawisze, #klawiszs, #klawisza, #klawiszd, #klawiszx, #klawiszz, #klawiszc, #klawiszr, #klawiszy, #klawiszv, #klawiszqx3, #klawiszwx3, #klawiszex3, #klawiszax3, #klawiszsx3, #klawiszdx3, #klawiszzx3, #klawiszcx3, #klawiszvx3, #klawiszb5, #klawiszspacja, #klawiszn').remove();

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
    });

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
      let set = $("#ekw_sets").find(".option.ek_sets_all" + ":not(.current)").attr("data-set");
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
