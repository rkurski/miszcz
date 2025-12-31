/**
 * ============================================================================
 * GIENIOBOT - Settings Module
 * ============================================================================
 * 
 * User settings: minimap, map size, pilot visibility, website background
 * These methods are mixed into the kwsv3 class.
 * 
 * ============================================================================
 */

const SettingsMixin = {

  // ============================================
  // MINIMAP SETTINGS
  // ============================================

  createMinimapSettings() {
    this.manageMinimapSettings("load");
    this.manageMapSize("load");
    this.managePilot();
    $("#field_sett #field_options").append(`<br style='clear:both;'><div id="kws_minimap_settings"> <b class='orange'>Ukryj pilota kontroli postaci: </b><div class="select_input"><select id="kws_hidePilot"><option value="1" ${this.hidePilot == 1 ? "selected" : ""}>tak</option><option value="0" ${this.hidePilot == 0 ? "selected" : ""}>Nie</option></select></div> <b class='orange'>Minimapa wyświetlana ze strony: </b><div class="select_input"><select id="minimap_side"><option value="0" ${this.minimap.side == 0 ? "selected" : ""}>Prawej</option><option value="1" ${this.minimap.side == 1 ? "selected" : ""}>Lewej</option><option value="2" ${this.minimap.side == 2 ? "selected" : ""}>L - Poza</option></select></div> <b class='orange'>Przeźroczystość minimapy: </b><input id="minimap_range" type="range" value="${this.minimap.opacity}" min="10" max="100" step="1"> <b class='orange'>Dodatkowe informacje o lokacji: </b><div class="select_input"><select id="kws_sh_locInfo"><option value="1" ${this.minimap.loc_info == 1 ? "selected" : ""}>Pokaż</option><option value="0" ${this.minimap.loc_info == 0 ? "selected" : ""}>Ukryj</option></select></div> <b class='orange'>Rozmiar mapy: </b>X: <input name="kws_map_width" class="smin_input" style="width:30px;" type="text" value="${this.mapsize.x}" placeholder="13"> Y: <input name="kws_map_height" class="smin_input" style="width:30px;" type="text" value="${this.mapsize.y}" placeholder="13"><button class="smin_butt kws_mapsize_change" style="margin-left:5px;">Zmień</button><button class="smin_butt kws_mapsize_reset" style="margin-left:5px;">Reset</button> </div>`);
  },

  manageMinimapSettings(act) {
    if (act == "load") {
      this.minimap = JSON.parse(localStorage.getItem('kws_minimap'));
      if (this.minimap == undefined) {
        this.minimap = {
          side: 0,
          opacity: 100,
          loc_info: 0
        };
        localStorage.setItem('kws_minimap', JSON.stringify(this.minimap));
      }
    } else if (act == "save") {
      localStorage.setItem('kws_minimap', JSON.stringify(this.minimap));
    }
  },

  // ============================================
  // WEBSITE BACKGROUND
  // ============================================

  setWebsiteBackground() {
    if (localStorage.getItem('kws_wbg')) {
      $("body").css({
        "background": "#02070D",
        "background-image": `url(${localStorage.getItem('kws_wbg')})`,
        "background-size": "cover",
        "background-attachment": "fixed"
      });
      $("#new_website_bg").val(localStorage.getItem('kws_wbg'));
      $("footer").addClass("hide_before");
    }
  },

  manageWebsiteBackground(act, url) {
    if (act == "set") {
      if (url.length > 5) {
        localStorage.setItem('kws_wbg', url);
        $("body").css({
          "background": "#02070D",
          "background-image": `url(${url})`,
          "background-size": "cover",
          "background-attachment": "fixed"
        });
        $("footer").addClass("hide_before");
      }
    } else if (act == "reset") {
      localStorage.removeItem("kws_wbg");
      $("#new_website_bg").val("");
      $("body").css({
        "background": "#02070D",
        "background-image": `url(/gfx/layout/bg.jpg)`,
        "background-size": "cover",
        "background-attachment": "fixed"
      });
      $("footer").removeClass("hide_before");
    }
  },

  // ============================================
  // MAP SIZE
  // ============================================

  changeMapSize(rx = 13, ry = 13) {
    rx = Math.floor(rx);
    ry = Math.floor(ry);
    GAME.map.cX = rx * 40;
    GAME.map.cY = ry * 40;
    GAME.map.rX = rx;
    GAME.map.rY = ry;
    if (GAME.map.initiated) {
      GAME.loadMapJson(function () {
        GAME.socket.emit('ga', {
          a: 3,
          vo: GAME.map_options.vo
        }, 1);
      });
    }
    if (rx > 13) {
      let pgm_w = 963 + (rx - 13) * 40;
      $("#page_game_map").css("width", pgm_w);
    } else {
      $("#page_game_map").css("width", "963px");
    }
    $("#map_canvas_container").css({
      "width": `${GAME.map.cX + 14}px`,
      "height": `${GAME.map.cY + 14}px`
    });
  },

  manageMapSize(act, size = [13, 13]) {
    if (act == "load") {
      this.mapsize = JSON.parse(localStorage.getItem('kws_mapsize'));
      if (this.mapsize == undefined) {
        this.mapsize = {
          x: 13,
          y: 13
        };
        localStorage.setItem('kws_mapsize', JSON.stringify(this.mapsize));
      } else if (this.mapsize.x != 13 || this.mapsize.y != 13) {
        this.changeMapSize(this.mapsize.x, this.mapsize.y);
      }
    } else if (act == "change") {
      this.changeMapSize(size[0], size[1]);
      this.mapsize.x = size[0];
      this.mapsize.y = size[1];
      localStorage.setItem('kws_mapsize', JSON.stringify(this.mapsize));
    } else {
      this.changeMapSize();
      this.mapsize.x = 13;
      this.mapsize.y = 13;
      $(`input[name="kws_map_width"]`).val(13);
      $(`input[name="kws_map_height"]`).val(13);
      localStorage.setItem('kws_mapsize', JSON.stringify(this.mapsize));
    }
  },

  // ============================================
  // PILOT VISIBILITY
  // ============================================

  managePilot(act = false, val = 0) {
    if (act == "set") {
      localStorage.setItem('kws_pilot', val);
      this.hidePilot = val;
      this.managePilot();
    } else {
      this.hidePilot = localStorage.getItem('kws_pilot');
      if (this.hidePilot == undefined) {
        localStorage.setItem('kws_pilot', 0);
        this.hidePilot = 0;
      }
      if (this.hidePilot == 1) {
        $("#map_pilot").hide();
      } else {
        $("#map_pilot").show();
      }
    }
  }
};

// Export mixin
window.SettingsMixin = SettingsMixin;
console.log('[Settings] Module loaded');
