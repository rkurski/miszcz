/**
 * Gieniobot Master - Content Script Injector
 * Injects the main loader script with extension URL
 */

var nullthrows = (v) => {
  if (v == null) throw new Error("it's a null");
  return v;
}

// Get the extension base URL (only available in content script context)
const EXTENSION_BASE_URL = chrome.runtime.getURL('/');

function injectCode(src) {
  const script = document.createElement('script');
  script.src = src;
  script.onload = function () {
    this.remove();
  };
  nullthrows(document.head || document.documentElement).appendChild(script);
}

// Pass extension URL via data attribute on a DOM element (CSP-safe method)
const urlHolder = document.createElement('div');
urlHolder.id = '__gieniobot_config__';
urlHolder.dataset.extensionUrl = EXTENSION_BASE_URL;
urlHolder.style.display = 'none';
nullthrows(document.head || document.documentElement).appendChild(urlHolder);

// Also set on window via event for backup
window.addEventListener('__GIENIOBOT_REQUEST_URL__', function () {
  window.dispatchEvent(new CustomEvent('__GIENIOBOT_EXTENSION_URL__', {
    detail: EXTENSION_BASE_URL
  }));
});

// Inject the main loader
injectCode(chrome.runtime.getURL('/content_script1.js'));