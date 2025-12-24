/**
 * Gieniobot Master - Popup Controller
 * Refactored version with DRY principle
 */

(function () {
  'use strict';

  // Script configuration - maps button IDs to script files
  const SCRIPT_CONFIG = [
    { id: 'skrypt1', file: 'scripts/skrypt11.js' },
    { id: 'skrypt2', file: 'scripts/skrypt21.js' },
    { id: 'skrypt3', file: 'scripts/skrypt31.js' },
    { id: 'skrypt4', file: 'scripts/skrypt41.js' },
    { id: 'skrypt5', file: 'scripts/skrypt51.js' },
    { id: 'skrypt6', file: 'scripts/skrypt61.js' },
    { id: 'skrypt7', file: 'scripts/skrypt71.js' },
    { id: 'skrypt8', file: 'scripts/skrypt81.js' },
    { id: 'skrypt9', file: 'scripts/skrypt91.js' },
    { id: 'skrypt10', file: 'scripts/skrypt101.js' },
  ];

  /**
   * Execute script in active tab
   * @param {string} scriptFile - Path to script file
   */
  async function executeScript(scriptFile) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        console.error('No active tab found');
        return;
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [scriptFile],
      });

      console.log(`Executed: ${scriptFile}`);
    } catch (error) {
      console.error(`Failed to execute ${scriptFile}:`, error);
    }
  }

  /**
   * Initialize popup handlers
   */
  function init() {
    SCRIPT_CONFIG.forEach(({ id, file }) => {
      const element = document.getElementById(id);

      if (element) {
        element.addEventListener('click', () => executeScript(file));
      } else {
        console.warn(`Element not found: ${id}`);
      }
    });

    console.log('Popup initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();