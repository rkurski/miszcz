/**
 * Gieniobot Master - Socket Service
 * Wrapper for GAME.socket with event handling
 */

class SocketService {
  constructor(socket) {
    this.socket = socket;
    this.listeners = new Map();
    this.latency = -1;

    // Only setup if socket exists
    if (this.socket && typeof this.socket.on === 'function') {
      this._setupLatencyMonitor();
    }
  }

  /**
   * Setup latency monitoring
   * @private
   */
  _setupLatencyMonitor() {
    if (!this.socket || typeof this.socket.on !== 'function') return;

    this.socket.on('pong', (ms) => {
      this.latency = ms;
    });

    // Set ping interval for latency updates
    if (this.socket.io && this.socket.io.engine) {
      this.socket.io.engine.pingInterval = 1000;
    }
  }

  /**
   * Get current latency
   * @returns {number} Latency in ms
   */
  getLatency() {
    return this.latency;
  }

  /**
   * Get latency color for display
   * @returns {string} Color name
   */
  getLatencyColor() {
    if (this.latency < 51) return 'lime';
    if (this.latency < 100) return 'yellow';
    if (this.latency < 140) return 'orange';
    return 'red';
  }

  /**
   * Emit game action
   * @param {number} action - Action code
   * @param {Object} data - Additional data
   */
  emit(action, data = {}) {
    this.socket.emit('ga', { a: action, ...data });
  }

  /**
   * Emit raw data (for backwards compatibility)
   * @param {Object} data - Full data object with 'a' property
   */
  emitRaw(data) {
    this.socket.emit('ga', data);
  }

  /**
   * Emit order (alias for GAME.emitOrder compatibility)
   * @param {Object} data - Order data
   */
  emitOrder(data) {
    this.socket.emit('ga', data);
  }

  /**
   * Listen for socket event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    this.socket.on(event, callback);

    // Track listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove listener for socket event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    this.socket.off(event, callback);

    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Listen for game response ('gr' event)
   * @param {Function} callback - Callback receiving response data
   */
  onResponse(callback) {
    this.on('gr', callback);
  }

  // =============== COMMON ACTIONS ===============

  /**
   * Send training action
   * @param {number} type - Training type
   * @param {Object} options - Training options
   */
  train(type, options = {}) {
    this.emit(8, { type, ...options });
  }

  /**
   * Start expedition
   * @param {number} type - Expedition type (default: 2 for starting, 3 for collecting)
   * @param {number} ct - Character type
   */
  expedition(type = 2, ct = 0) {
    this.emit(10, { type, ct });
  }

  /**
   * Transform character
   * @param {number} techId - Transformation technique ID
   */
  transform(techId) {
    this.emit(18, { type: 5, tech_id: techId });
  }

  /**
   * Detransform character
   */
  detransform() {
    this.emit(18, { type: 6 });
  }

  /**
   * Send chat message
   * @param {string} channel - Chat channel
   * @param {string} message - Message content
   */
  chat(channel, message) {
    this.emit(600, { channel, msg: message });
  }

  /**
   * Attack mob on map
   * @param {number} mobNum - Mob number
   * @param {boolean} quick - Quick attack mode
   */
  attackMob(mobNum, quick = true) {
    this.emit(13, { mob_num: mobNum, fo: GAME.map_options?.ma });
  }

  /**
   * Attack player (PvP)
   * @param {number} charId - Target character ID
   * @param {boolean} quick - Quick attack mode
   */
  attackPlayer(charId, quick = true) {
    this.emit(24, { char_id: charId, quick: quick ? 1 : 0 });
  }

  /**
   * Move on map
   * @param {number} direction - Movement direction
   */
  move(direction) {
    this.emitRaw({ a: 4, dir: direction, vo: GAME.map_options?.vo });
  }

  /**
   * Teleport to location
   * @param {number} locationId - Target location ID
   */
  teleport(locationId) {
    this.emit(12, { type: 18, loc: locationId });
  }

  /**
   * Complete/progress quest
   * @param {number} type - Quest action type
   * @param {number} questId - Quest ID
   * @param {Object} options - Additional options
   */
  quest(type, questId, options = {}) {
    this.emit(22, { type, id: questId, ...options });
  }

  /**
   * Clan action
   * @param {number} type - Clan action type
   * @param {Object} options - Additional options
   */
  clan(type, options = {}) {
    this.emit(39, { type, ...options });
  }

  /**
   * Arena action
   * @param {number} type - Arena action type (0=load, 1=attack)
   * @param {Object} options - Additional options
   */
  arena(type, options = {}) {
    this.emit(46, { type, ...options });
  }

  /**
   * Ball/soulstone action
   * @param {number} type - Ball action type
   * @param {number} ballId - Ball ID
   */
  ball(type, ballId) {
    this.emit(45, { type, bid: ballId });
  }

  /**
   * Instance action
   * @param {number} type - Instance action type
   * @param {Object} options - Additional options
   */
  instance(type, options = {}) {
    this.emit(44, { type, ...options });
  }

  /**
   * Select character
   * @param {number} charId - Character ID
   */
  selectChar(charId) {
    this.emitRaw({ a: 2, char_id: charId });
  }

  /**
   * Send senzu (use item)
   */
  useSenzu() {
    this.emit(15, { type: 13 });
  }

  /**
   * Collect daily reward
   */
  collectDailyReward() {
    this.emit(26, { type: 1 });
  }

  /**
   * Grant bless
   * @param {number[]} buffs - Array of buff IDs
   * @param {string} players - Player selection
   * @param {number} btype - Bless type
   */
  bless(buffs, players, btype) {
    this.emit(14, { type: 5, buffs, players, btype });
  }

  // =============== UTILITY ===============

  /**
   * Execute multiple actions with delay between them
   * @param {Array} actions - Array of {action, data, delay} objects
   */
  async emitSequence(actions) {
    for (const { action, data = {}, delay = 0 } of actions) {
      this.emit(action, data);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
