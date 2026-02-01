/**
 * ============================================================================
 * GIENIOBOT - Settings Module
 * ============================================================================
 * 
 * User settings: minimap, map size, pilot visibility, website background
 * These methods are mixed into the Gieniobot class.
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

  /**
   * Preset backgrounds list - easy to add/remove
   * Format: { name: "Display Name", device: "📱💻" or "📱" or "💻", url: "image url" }
   */
  BACKGROUND_PRESETS: [
    { name: "Goku & Broly", device: "📱💻", url: "https://i.imgur.com/UUrVU0D.png" },
    { name: "Gogeta", device: "📱💻", url: "https://i.imgur.com/QLVhKjP.png" },
    { name: "Gogeta", device: "📱", url: "https://i.imgur.com/b7JHw4m.png" },
    { name: "Gogeta Blue & Broly", device: "💻", url: "https://i.imgur.com/J4Rva2Z.png" },
    { name: "Goku SSJ4", device: "📱💻", url: "https://i.imgur.com/CkfXXff.jpeg" },
    { name: "Goku SSJ4", device: "📱💻", url: "https://i.imgur.com/TPLgg9C.png" },
    { name: "Goku SSJ4", device: "📱", url: "https://i.imgur.com/hgufEgp.jpeg" },
    { name: "Goku UI", device: "📱", url: "https://i.imgur.com/SWyXYKu.png" },
    { name: "Goku UI", device: "💻", url: "https://i.imgur.com/Ldq7GLI.jpeg" },
    { name: "Gogeta & Janemba", device: "📱", url: "https://i.imgur.com/uJRiOtZ.jpeg" },
    { name: "Buu", device: "📱💻", url: "https://i.imgur.com/Ch0SqnI.gif" },
  ],

  /**
   * Generate HTML for background preset select dropdown
   */
  getBackgroundPresetsSelectHTML() {
    let options = '<option value="">-- Wybierz tło --</option>';
    this.BACKGROUND_PRESETS.forEach((preset, idx) => {
      options += `<option value="${idx}">${preset.name} (${preset.device})</option>`;
    });
    return options;
  },

  // ============================================
  // WEBSITE BACKGROUND
  // ============================================

  setWebsiteBackground() {
    if (localStorage.getItem('kws_wbg')) {
      this._applyBackgroundStyles(localStorage.getItem('kws_wbg'));
      $("#new_website_bg").val(localStorage.getItem('kws_wbg'));
      $("footer").addClass("hide_before");
    }
  },

  /**
   * Apply background styles with mobile-friendly settings
   * @param {string} url - Background image URL
   * @param {boolean} isDefault - Whether this is the default game background
   */
  _applyBackgroundStyles(url, isDefault = false) {
    // Detect mobile device
    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // On mobile, use scroll instead of fixed (iOS has issues with fixed backgrounds)
    // Also use different background-size on mobile for better visibility
    const bgStyles = {
      "background-color": "#02070D",
      "background-image": `url(${url})`,
      "background-repeat": "no-repeat",
      "background-position": "center top",
      "background-size": "cover",
      "background-attachment": "fixed"
    };

    $("body").css(bgStyles);

    // Inject mobile-specific CSS if not already present
    if (!document.getElementById('kws-bg-mobile-css')) {
      const style = document.createElement('style');
      style.id = 'kws-bg-mobile-css';
      style.textContent = `
        @media (max-width: 768px) {
          body {
            background-position: center top !important;
            background-attachment: scroll !important;
            min-height: 100vh;
          }
        }
        @media (max-width: 480px) {
          body {
            background-size: auto 100vh !important;
            background-position: center top !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  },

  manageWebsiteBackground(act, url) {
    if (act == "set") {
      if (url.length > 5) {
        localStorage.setItem('kws_wbg', url);
        this._applyBackgroundStyles(url);
        $("footer").addClass("hide_before");
      }
    } else if (act == "reset") {
      localStorage.removeItem("kws_wbg");
      $("#new_website_bg").val("");
      this._applyBackgroundStyles('/gfx/layout/bg.jpg', true);
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
