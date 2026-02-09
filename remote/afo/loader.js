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

      const devMode = typeof GIENIOBOT_DEV_MODE !== 'undefined' && GIENIOBOT_DEV_MODE;
      const githubUrl = 'https://raw.githubusercontent.com/rkurski/miszcz/main/';

      // Initialize AFO after modules are loaded
      const initAFO = () => {
        setTimeout(() => {
          if (typeof AFO !== 'undefined') {
            AFO.init();
          } else {
            console.error('[AFO Loader] AFO not defined after loading all modules');
          }
        }, 100);
      };

      // PRODUCTION: load single bundle
      if (!devMode) {
        fetch(githubUrl + 'remote/bundle-afo.js')
          .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
          })
          .then(code => {
            const script = document.createElement('script');
            script.textContent = code;
            script.dataset.source = 'bundle-afo.js';
            document.body.appendChild(script);
            console.log('[AFO Loader] Bundle loaded!');
            initAFO();
          })
          .catch(error => {
            console.warn('[AFO Loader] Bundle failed, falling back to individual files...', error);
            loadModulesIndividually();
          });
      } else {
        // DEV_MODE: load individual modules
        loadModulesIndividually();
      }

      function loadModulesIndividually() {
        // Get base URL for AFO modules
        const getAFOUrl = (path) => {
          const configEl = document.getElementById('__gieniobot_config__');
          const localUrl = configEl ? configEl.dataset.extensionUrl : '';

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
          // Note: campStats.js moved to content_script1.js (self-initializing, independent of AFO)
          'dailyQuests.js',
          'index.js'
        ];

        let loadedCount = 0;

        const loadScript = (url, moduleName) => {
          return fetch(url)
            .then(response => {
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              return response.text();
            })
            .then(code => {
              const script = document.createElement('script');
              script.textContent = code;
              script.dataset.source = moduleName;
              document.body.appendChild(script);
              console.log(`[AFO Loader] Loaded: ${moduleName}`);
            });
        };

        const loadNext = () => {
          if (loadedCount >= modules.length) {
            initAFO();
            return;
          }

          const module = modules[loadedCount];
          loadScript(getAFOUrl(module), module)
            .then(() => {
              loadedCount++;
              loadNext();
            })
            .catch((error) => {
              console.warn(`[AFO Loader] Failed to load ${module}:`, error);
              loadedCount++;
              loadNext();
            });
        };

        loadNext();
      }
    }
  }, 50);
}
