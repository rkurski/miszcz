/**
 * ============================================================================
 * TRADER AUTO-BUY - Auto Handlarz
 * ============================================================================
 *
 * Automatically buys items from Kosmiczny Handlarz (Space Trader).
 * Injects config UI into the trader section of game_events page.
 * Polls server aggressively (500ms) and buys via parseData(62) hook
 * for maximum speed advantage over manual clicking.
 *
 * Runs independently of AFO (always-on feature).
 *
 * ============================================================================
 */

(function () {
  'use strict';

  if (typeof GAME === 'undefined') {
    console.log('[TraderAuto] GAME is undefined, skipping initialization');
    return;
  }

  // ============================================
  // ITEMS DATABASE
  // ============================================

  const ITEMS_ZENI = [
    { id: 1784, name: 'Karta Dusz', gfx: '/gfx/items/0/226/1784.png' },
    { id: 1243, name: 'Senzu', gfx: '/gfx/items/0/35/1243.png' },
    { id: 1941, name: '30 KK', gfx: '/gfx/items/0/284/1941.png' },
    { id: 1934, name: 'Przyrost 100', gfx: '/gfx/items/5/282/1934.png' },
    { id: 1933, name: 'Przyrost 80', gfx: '/gfx/items/4/282/1933.png' },
    { id: 1932, name: 'Przyrost 60', gfx: '/gfx/items/3/282/1932.png' },
    { id: 1931, name: 'Przyrost 40', gfx: '/gfx/items/2/282/1931.png' },
    { id: 1930, name: 'Przyrost 20', gfx: '/gfx/items/1/282/1930.png' },
    { id: 1929, name: 'Max 5000', gfx: '/gfx/items/5/281/1929.png' },
    { id: 1928, name: 'Max 4000', gfx: '/gfx/items/4/281/1928.png' },
    { id: 1927, name: 'Max 3000', gfx: '/gfx/items/3/281/1927.png' },
    { id: 1926, name: 'Max 2000', gfx: '/gfx/items/2/281/1926.png' },
    { id: 1925, name: 'Max 1000', gfx: '/gfx/items/1/281/1925.png' },
    // { id: 1938, name: 'Sfera', gfx: '/gfx/items/0/000/1938.png' },
    // { id: 1937, name: 'Sfera', gfx: '/gfx/items/0/000/1937.png' },
    // { id: 1936, name: 'Sfera', gfx: '/gfx/items/0/000/1936.png' },
    { id: 1251, name: 'Kula Energii', gfx: '/gfx/items/0/55/1251.png' },
    { id: 1935, name: 'Tytuł', gfx: '/gfx/items/0/83/1935.png' },
  ];

  const ITEMS_TOKENS = [
    { id: 1790, name: '200% exp', gfx: '/gfx/items/0/230/1790.png' },
    { id: 1792, name: '5% PSK', gfx: '/gfx/items/0/232/1792.png' },
    { id: 1794, name: '5% Moc', gfx: '/gfx/items/0/234/1794.png' },
    { id: 1795, name: 'Limit Senzu', gfx: '/gfx/items/0/235/1795.png' },
    { id: 1796, name: '150k mPA', gfx: '/gfx/items/0/236/1796.png' },
  ];

  // ============================================
  // GLOBAL STATE
  // ============================================

  const TRADER_AUTO = {
    active: false,
    buying: false,
    configZeni: ITEMS_ZENI.map((item, i) => ({ id: item.id, enabled: false, priority: i })),
    configTokens: ITEMS_TOKENS.map((item, i) => ({ id: item.id, enabled: false, priority: i })),
    pollTimer: null,
    cooldownTimer: null,
    buyTimeout: null,
    pollInterval: 500,
    buyCooldown: 10500,
    traderActive: false,
    currentTokens: 0,
    currentZeni: 0,
    lastBuyItemId: null,
    lastBuyShop: null,
    lastGoods: null,
    lastGoods2: null,
    log: [],
  };

  window.TRADER_AUTO = TRADER_AUTO;

  // ============================================
  // HELPERS
  // ============================================

  function getItemName(id) {
    const zeni = ITEMS_ZENI.find(i => i.id === id);
    if (zeni) return zeni.name;
    const token = ITEMS_TOKENS.find(i => i.id === id);
    if (token) return token.name;
    return 'Item #' + id;
  }

  function addLog(msg) {
    const now = new Date();
    const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    TRADER_AUTO.log.push({ time, msg });
    if (TRADER_AUTO.log.length > 30) TRADER_AUTO.log.shift();
    updateLogUI();
    console.log('[TraderAuto] ' + msg);
  }

  function updateLogUI() {
    const logEl = document.getElementById('afo-trader-log');
    if (!logEl) return;
    const last5 = TRADER_AUTO.log.slice(-5);
    logEl.innerHTML = last5.map(l => '<div><span class="grey">' + l.time + '</span> ' + l.msg + '</div>').join('');
    logEl.scrollTop = logEl.scrollHeight;
  }

  // ============================================
  // CSS INJECTION
  // ============================================

  function injectCSS() {
    if (document.getElementById('afo-trader-css')) return;
    const style = document.createElement('style');
    style.id = 'afo-trader-css';
    style.textContent = `
      #afo-trader-panel {
        margin: 8px 0;
        padding: 8px;
        border: 1px solid #335;
        border-radius: 4px;
        background: rgba(0,0,0,0.3);
      }
      #afo-trader-panel .afo-trader-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      #afo-trader-panel .afo-trader-header b {
        color: #f90;
        font-size: 13px;
      }
      #afo-trader-toggle {
        padding: 4px 14px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-weight: bold;
        font-size: 12px;
        color: #fff;
        background: #2a7a2a;
      }
      #afo-trader-toggle.active {
        background: #a22;
      }
      .afo-trader-section-label {
        color: #aaa;
        font-size: 11px;
        margin: 4px 0 2px;
        border-bottom: 1px solid #333;
        padding-bottom: 2px;
      }
      .afo-trader-item {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 0;
        font-size: 12px;
      }
      .afo-trader-item img {
        width: 24px;
        height: 24px;
        vertical-align: middle;
      }
      .afo-trader-item input[type="checkbox"] {
        margin: 0;
        cursor: pointer;
      }
      .afo-trader-item .afo-trader-name {
        flex: 1;
        color: #ddd;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .afo-trader-item .afo-trader-arrows {
        display: flex;
        gap: 2px;
      }
      .afo-trader-item .afo-trader-arrows button {
        background: #444;
        border: 1px solid #555;
        color: #ccc;
        cursor: pointer;
        padding: 0 4px;
        font-size: 11px;
        line-height: 16px;
        border-radius: 2px;
        min-width: 20px;
      }
      .afo-trader-item .afo-trader-arrows button:hover {
        background: #555;
      }
      .afo-trader-item .afo-trader-arrows button:active {
        background: #666;
      }
      .afo-trader-item.disabled {
        opacity: 0.7 !important;
      }
      .afo-trader-item.disabled .afo-trader-name {
        color: #888;
        text-decoration: line-through;
      }
      #afo-trader-log {
        margin-top: 6px;
        padding: 4px;
        background: rgba(0,0,0,0.3);
        border-radius: 3px;
        font-size: 11px;
        max-height: 80px;
        overflow-y: auto;
        color: #bbb;
      }
      #afo-trader-log div {
        padding: 1px 0;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // UI INJECTION
  // ============================================

  function buildItemRow(itemDef, config, shopType) {
    const cfg = config.find(c => c.id === itemDef.id);
    const enabled = cfg ? cfg.enabled : false;
    const disabledClass = enabled ? '' : ' disabled';

    return '<div class="afo-trader-item' + disabledClass + '" data-id="' + itemDef.id + '" data-shop="' + shopType + '">' +
      '<input type="checkbox"' + (enabled ? ' checked' : '') + ' data-action="toggle" data-id="' + itemDef.id + '" data-shop="' + shopType + '" />' +
      '<img src="' + (itemDef.gfx || '/gfx/items/4/282/' + itemDef.id + '.png') + '" />' +
      '<span class="afo-trader-name">' + itemDef.name + '</span>' +
      '<span class="afo-trader-arrows">' +
      '<button data-action="up" data-id="' + itemDef.id + '" data-shop="' + shopType + '">&#9650;</button>' +
      '<button data-action="down" data-id="' + itemDef.id + '" data-shop="' + shopType + '">&#9660;</button>' +
      '</span>' +
      '</div>';
  }

  function getOrderedItems(itemsDb, config) {
    const sorted = [...config].sort((a, b) => a.priority - b.priority);
    return sorted.map(cfg => {
      const def = itemsDb.find(i => i.id === cfg.id);
      return def || { id: cfg.id, name: 'Item #' + cfg.id };
    });
  }

  function injectTraderUI() {
    if (document.getElementById('afo-trader-panel')) return;

    const eventsPage = document.getElementById('page_game_events');
    if (!eventsPage) return;

    const content = eventsPage.querySelector('.content');
    if (!content) return;

    // Find the trader blueBg section (last one, or the one containing "Kosmiczny Handlarz")
    const blueBgs = content.querySelectorAll('.blueBg');
    let traderBg = null;
    for (let i = 0; i < blueBgs.length; i++) {
      const h3 = blueBgs[i].querySelector('h3');
      if (h3 && h3.textContent.includes('Handlarz')) {
        traderBg = blueBgs[i];
        break;
      }
    }
    if (!traderBg) return;

    const h3 = traderBg.querySelector('h3');
    if (!h3) return;

    // Build zeni items list
    const orderedZeni = getOrderedItems(ITEMS_ZENI, TRADER_AUTO.configZeni);
    let zeniHtml = orderedZeni.map(item => buildItemRow(item, TRADER_AUTO.configZeni, 'zeni')).join('');

    // Build token items list
    const orderedTokens = getOrderedItems(ITEMS_TOKENS, TRADER_AUTO.configTokens);
    let tokensHtml = orderedTokens.map(item => buildItemRow(item, TRADER_AUTO.configTokens, 'tokens')).join('');

    const btnText = TRADER_AUTO.active ? '&#9632; Stop' : '&#9654; Start';
    const btnClass = TRADER_AUTO.active ? ' active' : '';

    const panel = document.createElement('div');
    panel.id = 'afo-trader-panel';
    panel.innerHTML =
      '<div class="afo-trader-header">' +
      '<b>Auto Handlarz</b>' +
      '<button id="afo-trader-toggle" class="' + btnClass + '">' + btnText + '</button>' +
      '</div>' +
      '<div class="afo-trader-section-label">Za Zeni:</div>' +
      '<div id="afo-trader-list-zeni">' + zeniHtml + '</div>' +
      '<div class="afo-trader-section-label">Za Tokeny:</div>' +
      '<div id="afo-trader-list-tokens">' + tokensHtml + '</div>' +
      '<div id="afo-trader-log"></div>';

    h3.insertAdjacentElement('afterend', panel);

    // Bind events
    bindPanelEvents();
    updateLogUI();
  }

  function bindPanelEvents() {
    const panel = document.getElementById('afo-trader-panel');
    if (!panel) return;

    // Start/Stop button
    const toggleBtn = document.getElementById('afo-trader-toggle');
    if (toggleBtn) {
      toggleBtn.onclick = function () {
        if (TRADER_AUTO.active) {
          stopAutoBuy();
        } else {
          startAutoBuy();
        }
      };
    }

    // Delegate click events on panel
    panel.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action]');
      if (btn) {
        const action = btn.getAttribute('data-action');
        const id = parseInt(btn.getAttribute('data-id'));
        const shop = btn.getAttribute('data-shop');
        if (action === 'up') moveItem(id, shop, -1);
        if (action === 'down') moveItem(id, shop, 1);
        return;
      }

      const cb = e.target.closest('input[data-action="toggle"]');
      if (cb) {
        const id = parseInt(cb.getAttribute('data-id'));
        const shop = cb.getAttribute('data-shop');
        toggleItem(id, shop, cb.checked);
      }
    });
  }

  function toggleItem(id, shop, enabled) {
    const config = shop === 'zeni' ? TRADER_AUTO.configZeni : TRADER_AUTO.configTokens;
    const item = config.find(c => c.id === id);
    if (item) item.enabled = enabled;

    // Update visual
    const row = document.querySelector('.afo-trader-item[data-id="' + id + '"][data-shop="' + shop + '"]');
    if (row) {
      row.classList.toggle('disabled', !enabled);
    }
  }

  function moveItem(id, shop, direction) {
    const config = shop === 'zeni' ? TRADER_AUTO.configZeni : TRADER_AUTO.configTokens;
    const itemsDb = shop === 'zeni' ? ITEMS_ZENI : ITEMS_TOKENS;
    const sorted = [...config].sort((a, b) => a.priority - b.priority);
    const idx = sorted.findIndex(c => c.id === id);
    if (idx < 0) return;

    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    // Swap priorities
    const tmpPriority = sorted[idx].priority;
    sorted[idx].priority = sorted[targetIdx].priority;
    sorted[targetIdx].priority = tmpPriority;

    // Re-render the list
    const listId = shop === 'zeni' ? 'afo-trader-list-zeni' : 'afo-trader-list-tokens';
    const listEl = document.getElementById(listId);
    if (!listEl) return;

    const ordered = getOrderedItems(itemsDb, config);
    listEl.innerHTML = ordered.map(item => buildItemRow(item, config, shop)).join('');
  }

  function updateToggleButton() {
    const btn = document.getElementById('afo-trader-toggle');
    if (!btn) return;
    if (TRADER_AUTO.active) {
      btn.innerHTML = '&#9632; Stop';
      btn.classList.add('active');
    } else {
      btn.innerHTML = '&#9654; Start';
      btn.classList.remove('active');
    }
  }

  // ============================================
  // POLLING
  // ============================================

  function startAutoBuy() {
    if (TRADER_AUTO.active) return;
    TRADER_AUTO.active = true;
    TRADER_AUTO.buying = false;
    TRADER_AUTO.lastBuyItemId = null;
    TRADER_AUTO.lastBuyShop = null;
    updateToggleButton();
    addLog('Uruchomiono - polling co ' + TRADER_AUTO.pollInterval + 'ms');
    poll();
    TRADER_AUTO.pollTimer = setInterval(poll, TRADER_AUTO.pollInterval);
  }

  function stopAutoBuy() {
    TRADER_AUTO.active = false;
    TRADER_AUTO.buying = false;
    if (TRADER_AUTO.pollTimer) {
      clearInterval(TRADER_AUTO.pollTimer);
      TRADER_AUTO.pollTimer = null;
    }
    if (TRADER_AUTO.cooldownTimer) {
      clearTimeout(TRADER_AUTO.cooldownTimer);
      TRADER_AUTO.cooldownTimer = null;
    }
    if (TRADER_AUTO.buyTimeout) {
      clearTimeout(TRADER_AUTO.buyTimeout);
      TRADER_AUTO.buyTimeout = null;
    }
    TRADER_AUTO.lastBuyItemId = null;
    TRADER_AUTO.lastBuyShop = null;
    updateToggleButton();
    addLog('Zatrzymano');
  }

  function poll() {
    if (!TRADER_AUTO.active) return;
    if (TRADER_AUTO.buying) return;
    GAME.socket.emit('ga', { a: 51, type: 0 });
  }

  // ============================================
  // TRADER DATA HANDLER (parseData(62) hook)
  // ============================================

  function onTraderData(res) {
    if (!TRADER_AUTO.active) return;

    // Update currencies
    if (res.hasOwnProperty('tokens')) TRADER_AUTO.currentTokens = res.tokens;
    if (res.hasOwnProperty('zeni')) TRADER_AUTO.currentZeni = res.zeni;

    // Update trader status
    if (res.hasOwnProperty('trader')) {
      TRADER_AUTO.traderActive = !!res.trader.status;
      if (res.trader.goods) TRADER_AUTO.lastGoods = res.trader.goods;
      if (res.trader.goods2) TRADER_AUTO.lastGoods2 = res.trader.goods2;
    }

    if (!TRADER_AUTO.traderActive) return;

    // Check if we just attempted a buy
    if (TRADER_AUTO.lastBuyItemId !== null) {
      handleBuyResponse(res);
      return;
    }

    // Not in buy flow - try to buy next
    if (!TRADER_AUTO.buying) {
      tryBuyNext();
    }
  }

  function handleBuyResponse(res) {
    const buyId = TRADER_AUTO.lastBuyItemId;
    const buyShop = TRADER_AUTO.lastBuyShop;
    TRADER_AUTO.lastBuyItemId = null;
    TRADER_AUTO.lastBuyShop = null;
    if (TRADER_AUTO.buyTimeout) {
      clearTimeout(TRADER_AUTO.buyTimeout);
      TRADER_AUTO.buyTimeout = null;
    }

    const goods = buyShop === 'zeni' ? TRADER_AUTO.lastGoods2 : TRADER_AUTO.lastGoods;
    if (!goods) {
      // No goods data - assume success
      addLog('<span class="green">Kupiono: ' + getItemName(buyId) + '!</span>');
      startCooldown();
      return;
    }

    // Find the item we tried to buy
    const boughtItem = goods.find(g => g.item === buyId);

    if (!boughtItem) {
      // Item gone from list - likely bought successfully
      addLog('<span class="green">Kupiono: ' + getItemName(buyId) + '!</span>');
      startCooldown();
      return;
    }

    if (boughtItem.bought_by) {
      // Someone bought it - check if it was us
      const myNick = GAME.char_data ? GAME.char_data.login : '';
      if (boughtItem.bought_by === myNick) {
        addLog('<span class="green">Kupiono: ' + getItemName(buyId) + '!</span>');
        startCooldown();
      } else {
        addLog('<span class="orange">' + getItemName(buyId) + ' - kupione przez ' + boughtItem.bought_by + '!</span>');
        // No cooldown - try next immediately
        tryBuyNext();
      }
      return;
    }

    // Item still available and not bought - maybe buy failed (cooldown?), retry after short delay
    addLog('Ponawiam próbę zakupu: ' + getItemName(buyId));
    setTimeout(() => {
      if (TRADER_AUTO.active && !TRADER_AUTO.buying) {
        tryBuyNext();
      }
    }, 1000);
  }

  function startCooldown() {
    TRADER_AUTO.buying = true;
    // Pause polling during cooldown
    if (TRADER_AUTO.pollTimer) {
      clearInterval(TRADER_AUTO.pollTimer);
      TRADER_AUTO.pollTimer = null;
    }

    let remaining = Math.ceil(TRADER_AUTO.buyCooldown / 1000);
    addLog('Cooldown ' + remaining + 's...');

    TRADER_AUTO.cooldownTimer = setTimeout(() => {
      TRADER_AUTO.buying = false;
      TRADER_AUTO.cooldownTimer = null;
      if (TRADER_AUTO.active) {
        addLog('Cooldown zakończony, wznawiam');
        poll();
        TRADER_AUTO.pollTimer = setInterval(poll, TRADER_AUTO.pollInterval);
      }
    }, TRADER_AUTO.buyCooldown);
  }

  // ============================================
  // BUY LOGIC
  // ============================================

  function tryBuyNext() {
    if (!TRADER_AUTO.active || TRADER_AUTO.buying) return;

    const candidates = collectAvailableItems();
    if (candidates.length === 0) {
      addLog('Brak przedmiotów do kupienia');
      stopAutoBuy();
      return;
    }

    const best = candidates[0];
    buyItem(best);
  }

  function collectAvailableItems() {
    const results = [];
    const reborn = GAME.char_data ? (GAME.char_data.reborn || 0) : 0;

    // Collect from goods2 (Zeni)
    if (reborn >= 5 && TRADER_AUTO.lastGoods2) {
      for (const good of TRADER_AUTO.lastGoods2) {
        if (good.bought_by) continue;
        const cfg = TRADER_AUTO.configZeni.find(c => c.id === good.item);
        if (!cfg || !cfg.enabled) continue;
        if (TRADER_AUTO.currentZeni < good.ze) continue;
        results.push({
          shop: 'zeni',
          type: 3,
          index: TRADER_AUTO.lastGoods2.indexOf(good),
          id: good.item,
          amount: good.amount,
          cost: good.ze,
          priority: cfg.priority,
          shopOrder: 0, // zeni first
        });
      }
    }

    // Collect from goods (Tokens)
    if (TRADER_AUTO.lastGoods) {
      for (const good of TRADER_AUTO.lastGoods) {
        if (good.bought_by) continue;
        const cfg = TRADER_AUTO.configTokens.find(c => c.id === good.item);
        if (!cfg || !cfg.enabled) continue;
        if (TRADER_AUTO.currentTokens < good.dt) continue;
        results.push({
          shop: 'tokens',
          type: 2,
          index: TRADER_AUTO.lastGoods.indexOf(good),
          id: good.item,
          amount: good.amount,
          cost: good.dt,
          priority: cfg.priority,
          shopOrder: reborn >= 5 ? 1 : 0, // tokens second if reborn>=5
        });
      }
    }

    // Sort: shopOrder first, then priority, then highest amount first (same item, bigger stack = better)
    results.sort((a, b) => {
      if (a.shopOrder !== b.shopOrder) return a.shopOrder - b.shopOrder;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.amount - a.amount;
    });

    return results;
  }

  function buyItem(item) {
    // Pause polling while waiting for buy response
    if (TRADER_AUTO.pollTimer) {
      clearInterval(TRADER_AUTO.pollTimer);
      TRADER_AUTO.pollTimer = null;
    }

    TRADER_AUTO.lastBuyItemId = item.id;
    TRADER_AUTO.lastBuyShop = item.shop;

    addLog('Kupuję: <span class="green">' + getItemName(item.id) + '</span>...');

    GAME.socket.emit('ga', {
      a: 51,
      type: item.type,
      item: item.index,
      iid: item.id,
      am: item.amount,
    });

    // Safety timeout - if no parseData(62) response within 5s, resume polling
    TRADER_AUTO.buyTimeout = setTimeout(() => {
      if (TRADER_AUTO.lastBuyItemId !== null) {
        addLog('<span class="orange">Brak odpowiedzi serwera, wznawiam polling</span>');
        TRADER_AUTO.lastBuyItemId = null;
        TRADER_AUTO.lastBuyShop = null;
        if (TRADER_AUTO.active && !TRADER_AUTO.buying) {
          poll();
          TRADER_AUTO.pollTimer = setInterval(poll, TRADER_AUTO.pollInterval);
        }
      }
    }, 5000);
  }

  // ============================================
  // HOOKS
  // ============================================

  function hookParseData() {
    if (!GAME.parseData) {
      console.log('[TraderAuto] GAME.parseData not found, retrying...');
      return false;
    }

    const originalParseData = GAME.parseData.bind(GAME);
    GAME.parseData = function (type, res) {
      originalParseData(type, res);
      if (type === 62) {
        onTraderData(res);
      }
    };

    console.log('[TraderAuto] Hooked into GAME.parseData');
    return true;
  }

  function hookPageSwitch() {
    if (!GAME.page_switch) {
      console.log('[TraderAuto] GAME.page_switch not found');
      return false;
    }

    const origPageSwitch = GAME.page_switch.bind(GAME);
    GAME.page_switch = function (page, arg) {
      origPageSwitch(page, arg);
      if (page === 'game_events') {
        setTimeout(injectTraderUI, 200);
        setTimeout(injectTraderUI, 600);
      }
    };

    console.log('[TraderAuto] Hooked into GAME.page_switch');
    return true;
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    injectCSS();
    hookPageSwitch();
    hookParseData();

    // If already on events page, inject now
    const eventsPage = document.getElementById('page_game_events');
    if (eventsPage && eventsPage.offsetParent !== null) {
      setTimeout(injectTraderUI, 300);
    }

    console.log('[TraderAuto] Initialized');
  }

  // Wait for GAME.char_data
  let initAttempts = 0;
  const maxAttempts = 120; // 60 seconds

  const initCheck = setInterval(() => {
    initAttempts++;
    if (initAttempts > maxAttempts) {
      clearInterval(initCheck);
      console.log('[TraderAuto] Timeout waiting for GAME.char_data');
      return;
    }
    if (GAME.char_data && GAME.socket) {
      clearInterval(initCheck);
      init();
    }
  }, 500);
})();
