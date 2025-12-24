/**
 * Gieniobot Master - Script Loader
 * Dynamically loads extension scripts from GitHub
 * 
 * This file is injected by content_script.js
 */

(function () {
  'use strict';

  const BASE_URL = 'https://raw.githubusercontent.com/rkurski/miszcz/develop/';

  // Scripts to load in order (dependencies first)
  const SCRIPTS = [
    // Core modules
    'core/constants.js',
    'core/utils.js',
    'core/settings.js',
    'core/socket-service.js',

    // Managers
    'managers/characters-manager.js',
    'managers/ui-manager.js',

    // Feature modules
    'features/combat/combat-manager.js',
    'features/automation/automation-manager.js',
    'features/clan/clan-manager.js',
    'features/ui/keyboard-shortcuts.js',

    // Ball modules (keeping original for now)
    'ballExp.js',
    'ballUpgrade.js',
    'ballReset.js',
    'ballManager.js',

    // Equipment module (keeping original for now)
    'ekwipunek.js',

    // Main application (loads last)
    'app.js',
  ];

  // CSS files to load
  const STYLES = [
    'styles/main.css',
    'styles/minimap.css',
  ];

  /**
   * Load a remote script
   * @param {string} path - Relative path from BASE_URL
   * @returns {Promise} Resolves when script is loaded
   */
  function loadScript(path) {
    return new Promise((resolve, reject) => {
      const url = BASE_URL + path;

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
          console.log(`[Gieniobot] Loaded: ${path}`);
          resolve();
        })
        .catch(error => {
          console.error(`[Gieniobot] Error loading ${path}:`, error);
          reject(error);
        });
    });
  }

  /**
   * Load a remote CSS file
   * @param {string} path - Relative path from BASE_URL
   * @returns {Promise} Resolves when CSS is loaded
   */
  function loadStyle(path) {
    return new Promise((resolve, reject) => {
      const url = BASE_URL + path;

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
    console.log('[Gieniobot] Starting script load...');

    // Load CSS first (parallel)
    await Promise.all(STYLES.map(loadStyle));

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