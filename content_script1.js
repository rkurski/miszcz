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
  const DEV_MODE = true;

  const GITHUB_URL = 'https://raw.githubusercontent.com/rkurski/miszcz/develop/';

  // Extension URL - will be received from content script
  let EXTENSION_URL = '';

  // Scripts to load in order (dependencies first)
  const SCRIPTS = [
    // Core modules
    'charactersManager.js',

    // Handlers & Mixins (loaded before main script)
    'handlers/click-handlers.js',
    'handlers/automation.js',
    'handlers/ui.js',
    'handlers/clan.js',
    'handlers/map.js',

    // Main bot logic
    'script1-2.js',

    // Ball modules
    'ballExp.js',
    'ballUpgrade.js',
    'ballReset.js',
    'ballManager.js',

    // Equipment
    'ekwipunek.js',
  ];

  // CSS files to load (empty - script1-2.js handles CSS internally)
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
   * Load all scripts sequentially
   */
  async function loadAllScripts() {
    // First, try to get extension URL for DEV_MODE
    if (DEV_MODE) {
      await getExtensionUrl();
    }

    console.log(`[Gieniobot] Starting script load... (DEV_MODE: ${DEV_MODE}, LOCAL: ${EXTENSION_URL ? 'yes' : 'no'})`);

    // Load CSS first (parallel)
    if (STYLES.length > 0) {
      await Promise.all(STYLES.map(loadStyle));
    }

    // Load scripts sequentially (dependencies matter)
    for (const script of SCRIPTS) {
      try {
        await loadScript(script);
      } catch (error) {
        console.error(`[Gieniobot] Failed to load ${script}, continuing...`);
      }
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