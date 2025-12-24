/**
 * Gieniobot Master - Utility Functions
 * Common helper functions used across the extension
 */

const Utils = {
  /**
   * Format number with spaces as thousand separators
   * @param {number} n - Number to format
   * @returns {string} Formatted number
   */
  formatNumber(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  },

  /**
   * Parse integer safely with fallback
   * @param {string|number} value - Value to parse
   * @param {number} fallback - Fallback value if parsing fails
   * @returns {number} Parsed integer or fallback
   */
  safeParseInt(value, fallback = 0) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  },

  /**
   * Debounce function execution
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Throttle function execution
   * @param {Function} fn - Function to throttle
   * @param {number} limit - Limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(fn, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Wait for condition to be true
   * @param {Function} condition - Condition function
   * @param {number} interval - Check interval in ms
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise} Resolves when condition is true
   */
  waitFor(condition, interval = 100, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, interval);
        }
      };
      check();
    });
  },

  /**
   * Wait for GAME object to be available with player ID
   * @returns {Promise} Resolves when GAME.pid is available
   */
  waitForGame() {
    return this.waitFor(() => typeof GAME !== 'undefined' && GAME.pid);
  },

  /**
   * Create element with attributes and content
   * @param {string} tag - HTML tag name
   * @param {Object} attrs - Attributes object
   * @param {string|Node} content - Inner content
   * @returns {HTMLElement} Created element
   */
  createElement(tag, attrs = {}, content = '') {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          el.dataset[dataKey] = dataValue;
        });
      } else if (key.startsWith('on')) {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    });
    if (typeof content === 'string') {
      el.innerHTML = content;
    } else if (content instanceof Node) {
      el.appendChild(content);
    }
    return el;
  },

  /**
   * Add CSS to document head
   * @param {string} css - CSS string
   * @param {string} id - Optional ID for the style element
   */
  addCSS(css, id = null) {
    const style = document.createElement('style');
    if (id) style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  },

  /**
   * Append CSS to existing style element or create new one
   * @param {string} css - CSS to append
   * @param {string} id - Style element ID
   */
  appendCSS(css, id = 'kwsCSS') {
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent += css;
  },

  /**
   * Log with prefix for debugging
   * @param {string} module - Module name
   * @param  {...any} args - Log arguments
   */
  log(module, ...args) {
    console.log(`[Gieniobot/${module}]`, ...args);
  },

  /**
   * Check if element is in viewport
   * @param {HTMLElement} el - Element to check
   * @returns {boolean} True if in viewport
   */
  isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  uniqueId() {
    return `kws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Deep clone object
   * @param {Object} obj - Object to clone
   * @returns {Object} Cloned object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Merge objects deeply
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  },

  /**
   * Check if value is plain object
   * @param {*} item - Value to check
   * @returns {boolean} True if plain object
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  },

  /**
   * Execute function after delay
   * @param {Function} fn - Function to execute
   * @param {number} delay - Delay in ms
   * @returns {Promise} Resolves after execution
   */
  delay(fn, delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        const result = fn();
        resolve(result);
      }, delay);
    });
  },

  /**
   * Simple sleep function
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
