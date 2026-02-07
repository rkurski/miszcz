/**
 * ============================================================================
 * EXCHANGE HIGHLIGHT - Podświetlanie posiadanych upominków w oknie wymian
 * ============================================================================
 *
 * When the exchange window (parseData case 18) opens, highlights items
 * that the player already owns as event gifts.
 *
 * Data source: game_events page (a:51) → parseData(62) → res.gift[]
 * Matching: data-sel on exchange button === res.gift[i].id
 *
 * ============================================================================
 */

(function () {
  'use strict';

  const EXCHANGE_HIGHLIGHT = {
    ownedGiftIds: new Set(),
    pendingHighlight: false,

    init() {
      this.injectCSS();
      this.hookParseData();
      console.log('[ExchangeHighlight] Initialized');
    },

    injectCSS() {
      const style = document.createElement('style');
      style.id = 'exchange-highlight-css';
      style.textContent = `
        .exchange_item.owned-item {
          background: rgba(76, 175, 80, 0.3) !important;
        }
      `;
      document.head.appendChild(style);
    },

    hookParseData() {
      if (!GAME.parseData) {
        console.warn('[ExchangeHighlight] GAME.parseData not found, retrying...');
        setTimeout(() => this.hookParseData(), 500);
        return;
      }

      const origPD = GAME.parseData.bind(GAME);
      const self = this;

      GAME.parseData = function (type, res) {
        origPD(type, res);

        // Cache owned event gifts from game_events page
        if (type === 62 && res.gift) {
          self.ownedGiftIds.clear();
          res.gift.forEach(g => self.ownedGiftIds.add(g.id));
          console.log('[ExchangeHighlight] Cached', self.ownedGiftIds.size, 'owned gifts');

          if (self.pendingHighlight) {
            self.pendingHighlight = false;
            self.highlightExchangeItems();
          }
        }

        // Exchange window opened → highlight owned items
        if (type === 18) {
          setTimeout(() => {
            self.highlightExchangeItems();
            // Request fresh event gifts data
            self.pendingHighlight = true;
            GAME.socket.emit('ga', { a: 51, type: 0 });
          }, 50);
        }
      };

      console.log('[ExchangeHighlight] Hooked into GAME.parseData');
    },

    highlightExchangeItems() {
      if (this.ownedGiftIds.size === 0) return;

      let count = 0;
      document.querySelectorAll('.exchange_item.main_ekw_item').forEach(el => {
        const btn = el.querySelector('button[data-sel]');
        if (!btn) return;
        const sel = parseInt(btn.getAttribute('data-sel'));
        if (this.ownedGiftIds.has(sel)) {
          el.classList.add('owned-item');
          count++;
        }
      });

      if (count > 0) {
        console.log('[ExchangeHighlight] Highlighted', count, 'owned items');
      }
    }
  };

  window.EXCHANGE_HIGHLIGHT = EXCHANGE_HIGHLIGHT;

  // Init when GAME is ready
  const check = setInterval(() => {
    if (typeof GAME !== 'undefined' && GAME.parseData && GAME.socket) {
      clearInterval(check);
      EXCHANGE_HIGHLIGHT.init();
    }
  }, 500);
})();
