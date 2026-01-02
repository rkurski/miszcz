/**
 * ============================================================================
 * AFO - Loader
 * ============================================================================
 * 
 * This script loads all AFO modules in correct order and initializes the system.
 * It replaces the monolithic uncodedeeee.js with modular architecture.
 * 
 * ============================================================================
 */

if (typeof GAME === 'undefined') {
  console.log('[AFO] GAME is undefined, skipping AFO initialization');
} else {
  // Wait for game to be ready
  let afoInit = setInterval(() => {
    if (GAME.pid) {
      clearInterval(afoInit);

      console.log('[AFO Loader] Starting module load...');

      // Get base URL for AFO modules
      const getAFOUrl = (path) => {
        const configEl = document.getElementById('__gieniobot_config__');
        const devMode = typeof GIENIOBOT_DEV_MODE !== 'undefined' && GIENIOBOT_DEV_MODE;
        const localUrl = configEl ? configEl.dataset.extensionUrl : '';
        const githubUrl = 'https://raw.githubusercontent.com/rkurski/miszcz/develop/';

        if (devMode && localUrl) {
          return localUrl + 'remote/afo/' + path;
        }
        return githubUrl + 'remote/afo/' + path;
      };

      // Module load order
      const modules = [
        'state.js',
        'templates.js',
        'pvp.js',
        'respawn.js',
        'pvm.js',
        'resources.js',
        'codes.js',
        'glebia.js',
        'ballSearcher.js',
        'index.js'
      ];

      let loadedCount = 0;

      // Simple sequential loader
      const loadNext = () => {
        if (loadedCount >= modules.length) {
          // All modules loaded, initialize AFO
          setTimeout(() => {
            if (typeof AFO !== 'undefined') {
              AFO.init();
            } else {
              console.error('[AFO Loader] AFO not defined after loading all modules');
            }
          }, 100);
          return;
        }

        const module = modules[loadedCount];
        $.getScript(getAFOUrl(module))
          .done(() => {
            console.log(`[AFO Loader] Loaded: ${module}`);
            loadedCount++;
            loadNext();
          })
          .fail((jqxhr, settings, exception) => {
            // Try to continue even if a module fails
            console.warn(`[AFO Loader] Failed to load ${module}:`, exception);
            loadedCount++;
            loadNext();
          });
      };

      // Start loading
      loadNext();
    }
  }, 50);
}
