/**
 * Gieniobot Master - Script Loader
 * Dynamically loads extension scripts
 * 
 * DEV_MODE = true  -> loads from local extension files (requires reload extension)
 * DEV_MODE = false -> loads from GitHub (for production)
 */

(function () {
  'use strict';

  // ============================================
  // DEVELOPMENT MODE - zmień na false przed pushem
  // ============================================
  const DEV_MODE = false;

  const GITHUB_URL = 'https://raw.githubusercontent.com/rkurski/miszcz/main/';

  // Extension URL - will be received from content script
  let EXTENSION_URL = '';

  // Scripts to load in order (dependencies first)
  // All paths relative to base URL - these are loaded from remote/
  const SCRIPTS = [
    // Core modules
    'remote/features/characters/charactersManager.js',

    // Handlers & Mixins (loaded before main script)
    'remote/core/handlers/click-handlers.js',
    'remote/core/handlers/automation.js',
    'remote/core/handlers/ui.js',
    'remote/core/handlers/clan.js',
    'remote/core/handlers/map.js',
    'remote/core/handlers/pilot.js',
    'remote/core/handlers/settings.js',
    'remote/core/handlers/combat.js',
    'remote/core/handlers/game-overrides.js',
    'remote/core/handlers/empire.js',
    'remote/core/handlers/tournaments.js',

    // Soul Card Sets (before main bot for early availability)
    'remote/features/soulCardSets.js',

    // Main bot logic
    'remote/core/gieniobot.js',

    // Ball modules
    'remote/features/ball/ballExp.js',
    'remote/features/ball/ballUpgrade.js',
    'remote/features/ball/ballReset.js',
    'remote/features/ball/ballManager.js',

    // Equipment
    'remote/features/equipment/ekwipunek.js',

    // Activities auto-executor
    'remote/features/activities/activitiesExecutor.js',

    // Auto-Reconnect system (storage → credentials → stateManager → ui → reconnect → index)
    'remote/reconnect/storage.js',
    'remote/reconnect/credentials.js',
    'remote/reconnect/stateManager.js',
    'remote/reconnect/ui.js',
    'remote/reconnect/reconnect.js',
    'remote/reconnect/index.js',

    // Auto clan training assists (runs independently after login)
    'remote/features/clanAssist.js',
    // Kukla Guardian - Strażnik Kukli (auto dragon ball fights)
    'remote/features/kuklaGuardian.js',
    // Train Blessings - Quick-use blessy na stronie treningu
    'remote/features/trainBlessings.js',
    // Trader Auto-Buy - Auto Handlarz (auto trader purchasing)
    'remote/features/traderAutoBuy.js',
    // Exchange Highlight - podświetlanie posiadanych upominków w wymianie
    'remote/features/exchangeHighlight.js',
    // Camp Stats - statystyki wypraw (self-initializing)
    'remote/afo/campStats.js',
  ];

  // CSS files to load (empty - gieniobot.js handles CSS internally)
  const STYLES = [];

  /**
   * Get extension URL from content script via custom event
   */
  function getExtensionUrl() {
    return new Promise((resolve) => {
      const handler = (event) => {
        EXTENSION_URL = event.detail;
        window.removeEventListener('__GIENIOBOT_EXTENSION_URL__', handler);
        resolve(EXTENSION_URL);
      };
      window.addEventListener('__GIENIOBOT_EXTENSION_URL__', handler);
      window.dispatchEvent(new CustomEvent('__GIENIOBOT_REQUEST_URL__'));

      // Timeout after 100ms - fallback to GitHub
      setTimeout(() => {
        if (!EXTENSION_URL) {
          window.removeEventListener('__GIENIOBOT_EXTENSION_URL__', handler);
          resolve('');
        }
      }, 100);
    });
  }

  /**
   * Get the base URL based on mode
   */
  function getBaseUrl() {
    if (DEV_MODE && EXTENSION_URL) {
      return EXTENSION_URL;
    }
    return GITHUB_URL;
  }

  /**
   * Load a script file
   * Always use fetch + textContent injection for consistent behavior
   */
  function loadScript(path) {
    return new Promise((resolve, reject) => {
      const url = getBaseUrl() + path;
      const isLocal = DEV_MODE && EXTENSION_URL;

      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load ${path}: ${response.status}`);
          }
          return response.text();
        })
        .then(code => {
          const script = document.createElement('script');
          script.textContent = code;
          script.dataset.source = path;
          document.body.appendChild(script);
          console.log(`[Gieniobot] Loaded (${isLocal ? 'local' : 'remote'}): ${path}`);
          resolve();
        })
        .catch(error => {
          console.error(`[Gieniobot] Error loading ${path}:`, error);
          reject(error);
        });
    });
  }

  /**
   * Load a CSS file
   */
  function loadStyle(path) {
    return new Promise((resolve, reject) => {
      const url = getBaseUrl() + path;

      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load ${path}: ${response.status}`);
          }
          return response.text();
        })
        .then(css => {
          const style = document.createElement('style');
          style.textContent = css;
          style.dataset.source = path;
          document.head.appendChild(style);
          console.log(`[Gieniobot] Loaded CSS: ${path}`);
          resolve();
        })
        .catch(error => {
          console.error(`[Gieniobot] Error loading CSS ${path}:`, error);
          reject(error);
        });
    });
  }

  /**
   * Load all scripts from a single bundle file (production)
   */
  async function loadBundle() {
    const url = GITHUB_URL + 'remote/bundle-core.js';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const code = await response.text();
    const script = document.createElement('script');
    script.textContent = code;
    script.dataset.source = 'bundle-core.js';
    document.body.appendChild(script);
    console.log('[Gieniobot] Bundle loaded!');
  }

  /**
   * Load all scripts sequentially (dev mode / fallback)
   */
  async function loadScriptsIndividually() {
    for (const script of SCRIPTS) {
      try {
        await loadScript(script);
      } catch (error) {
        console.error(`[Gieniobot] Failed to load ${script}, continuing...`);
      }
    }
  }

  /**
   * Load all scripts
   */
  async function loadAllScripts() {
    // DEV_MODE: load individual files for development
    if (DEV_MODE) {
      await getExtensionUrl();
      console.log(`[Gieniobot] Starting script load... (DEV_MODE: ${DEV_MODE}, LOCAL: ${EXTENSION_URL ? 'yes' : 'no'})`);

      if (STYLES.length > 0) {
        await Promise.all(STYLES.map(loadStyle));
      }

      await loadScriptsIndividually();
      console.log('[Gieniobot] All scripts loaded!');
      return;
    }

    // PRODUCTION: load single bundle
    console.log('[Gieniobot] Loading bundle...');
    try {
      await loadBundle();
    } catch (error) {
      console.warn('[Gieniobot] Bundle failed, falling back to individual files...', error);
      await loadScriptsIndividually();
    }
    console.log('[Gieniobot] All scripts loaded!');
  }

  // Start loading when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllScripts);
  } else {
    loadAllScripts();
  }
})();