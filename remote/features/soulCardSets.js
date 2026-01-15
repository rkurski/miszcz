/**
 * ============================================================================
 * SOUL CARD SETS - Predefined Card Set Manager
 * ============================================================================
 * 
 * Moduł do zarządzania predefiniowanymi zestawami kart dusz.
 * Automatycznie zakłada karty na podstawie wybranego zestawu.
 * 
 * USAGE:
 * - Wybierz zestaw z dropdowna w topbarze
 * - Moduł automatycznie wyczyści sloty i założy odpowiednie karty
 * 
 * CONFIGURATION:
 * - Ustaw karty w sekcji SETS poniżej
 * - Każdy zestaw to tablica ID typów kart (numer z /gfx/cards/XX.png)
 * - Kolejność = priorytet (pierwsze karty będą zakładane pierwsze)
 * 
 * ============================================================================
 */

const AFO_SOUL_CARD_SETS = {
  // ============================================
  // CONFIGURATION
  // ============================================

  // Delay między akcjami (ms) - zwiększ jeśli serwer laguje
  DELAY_BETWEEN_ACTIONS: 200,

  // Delay po przełączeniu na stronę kart (ms)
  DELAY_PAGE_SWITCH: 700,

  // Max retry dla weryfikacji założenia karty
  MAX_EQUIP_RETRIES: 3,

  // ============================================
  // ZESTAWY KART - EDYTUJ TUTAJ
  // ============================================
  // Format: 'Nazwa zestawu': [cardTypeId1, cardTypeId2, ...]
  // cardTypeId = numer z /gfx/cards/XX.png (np. 42 dla Puar)
  // Kolejność = priorytet (pierwsze karty zakładane pierwsze)

  sets: {
    'Biedak': [], // Specjalny zestaw - zdejmuje wszystkie karty
    'Kody': [
      24, // Vegito
      16, // Black
      19, // Gotenks
      2, // Vegeta
      10, // Bulma
      33, // Dyspo
      45, // Vados
      44, // Whis
      46 // Kapłan
    ],
    'Trening': [
      2, // Vegeta
      16, // Black
      32, // Jiren
      17, // Brolly DBS
      18, // Paragus
      20, // Cheelai
      21, // Beerus
      40, // Champa
      45 // Vados
    ],
    'Senzu': [
      40, // Champa
      35, // MajinBuu
      21, // Beerus
      25, // Freezer
      15, // Mr Satan
      14, // Videl
      7, // Gohan
      8, // Pan
      44 // Whis
    ],
    'Kryształy': [
      41, // Yamcha
      24, // Vegito
      17, // Brolly DBS
      20, // Cheelai
      9, // Trunks
      45 // Vados
    ],
    'Exp': [
      31, // Toppo
      3, // Brolly
      2, // Vegeta
      10, // Bulma
      13, // Goten
      12, // Roshi
      44, // Whis
      45, // Vados
      46 // Kapłan
    ],
    'Moc': [
      32, // Jiren
      1, // Goku
      6, // Krillin
      12, // Roshi
      19, // Gotenks
      22, // Hit
      44, // Whis
      45, // Vados
      46 // Kapłan
    ],
    'PvP': [
      1, // Goku
      20, // Cheelai
      42, // Puar
      21, // Beerus
      15, // Mr Satan
    ],
    'Zbierajki': [
      10, // Bulma
      42, // Puar
      5, // C17
      31, // Toppo
      33, // Dyspo
      24, // Vegito
    ]
  },

  // ============================================
  // STATE
  // ============================================
  isSwitching: false,

  // ============================================
  // METHODS
  // ============================================

  /**
   * Przełącza na wybrany zestaw kart
   * @param {string} setName - Nazwa zestawu
   * @returns {Promise<boolean>} - Czy operacja się powiodła
   */
  async switchToSet(setName) {
    if (this.isSwitching) {
      GAME.komunikat('Zmiana zestawu już w toku...');
      return false;
    }

    // Specjalny przypadek: 'Bez kart' - tylko czyścimy sloty
    if (setName === 'Biedak') {
      this.isSwitching = true;
      try {
        await this.ensureCardsPageLoaded();
        const availableSlots = this.getAvailableSlots();
        await this.clearAllSlots(availableSlots);
        this.saveCurrentSet(setName);
        GAME.komunikat('Biedny frajerze nawet kart nie masz');
        return true;
      } catch (error) {
        console.error('[SoulCardSets] Error clearing cards:', error);
        return false;
      } finally {
        this.isSwitching = false;
      }
    }

    const cardTypeIds = this.sets[setName];
    if (!cardTypeIds || cardTypeIds.length === 0) {
      GAME.komunikat(`Zestaw "${setName}" jest pusty lub nie istnieje!`);
      return false;
    }

    this.isSwitching = true;
    console.log(`[SoulCardSets] Switching to set: ${setName}`, cardTypeIds);

    try {
      // 1. Upewnij się że strona kart jest załadowana
      await this.ensureCardsPageLoaded();

      // 2. Pobierz liczbę dostępnych slotów
      const availableSlots = this.getAvailableSlots();
      console.log(`[SoulCardSets] Available slots: ${availableSlots}`);

      // 3. Wyczyść wszystkie sloty
      await this.clearAllSlots(availableSlots);

      // 4. Załóż karty z zestawu
      const equippedCount = await this.equipCards(cardTypeIds, availableSlots);

      // 5. Zapisz aktualny zestaw
      this.saveCurrentSet(setName);

      GAME.komunikat(`Zestaw "${setName}" - założono ${equippedCount} kart`);
      return true;

    } catch (error) {
      console.error('[SoulCardSets] Error switching set:', error);
      GAME.komunikat(`Błąd przy zmianie zestawu: ${error.message}`);
      return false;

    } finally {
      this.isSwitching = false;
    }
  },

  /**
   * Upewnia się że strona kart jest załadowana
   */
  async ensureCardsPageLoaded() {
    const slotsContainer = $('#sc_slots');

    // Sprawdź czy mamy klasę z liczbą slotów (np. slots2, slots9)
    const hasSlotClass = slotsContainer.attr('class')?.match(/slots\d+/);

    if (!hasSlotClass) {
      console.log('[SoulCardSets] Cards page not loaded, switching...');
      GAME.page_switch('game_cards');
      await this.delay(this.DELAY_PAGE_SWITCH);
    }
  },

  /**
   * Pobiera liczbę dostępnych slotów z klasy #sc_slots
   * @returns {number}
   */
  getAvailableSlots() {
    const slotsContainer = $('#sc_slots');
    const classMatch = slotsContainer.attr('class')?.match(/slots(\d+)/);

    if (classMatch) {
      return parseInt(classMatch[1], 10);
    }

    // Fallback - policz sloty w DOM
    return $('#sc_slots .card_slot').length || 6;
  },

  /**
   * Czyści wszystkie sloty
   * @param {number} slotCount - Liczba slotów do wyczyszczenia
   */
  async clearAllSlots(slotCount) {
    console.log(`[SoulCardSets] Clearing ${slotCount} slots...`);

    for (let slot = 1; slot <= slotCount; slot++) {
      const slotElement = $(`#card_slot${slot}`);

      // Sprawdź czy slot ma założoną kartę
      if (slotElement.find('.small_card').length > 0) {
        GAME.emitOrder({ a: 58, type: 2, slot: slot });
        await this.delay(this.DELAY_BETWEEN_ACTIONS);
      }
    }

    // Poczekaj chwilę na synchronizację
    await this.delay(this.DELAY_BETWEEN_ACTIONS);
  },

  /**
   * Zakłada karty z zestawu
   * @param {number[]} cardTypeIds - Tablica ID typów kart
   * @param {number} maxSlots - Maksymalna liczba slotów
   * @returns {Promise<number>} - Liczba założonych kart
   */
  async equipCards(cardTypeIds, maxSlots) {
    let equippedCount = 0;

    for (const cardTypeId of cardTypeIds) {
      if (equippedCount >= maxSlots) {
        console.log('[SoulCardSets] All slots filled, stopping.');
        break;
      }

      // Znajdź najlepszą kartę tego typu (najwyższy tier)
      const card = this.findBestCard(cardTypeId);

      if (!card) {
        console.log(`[SoulCardSets] Card type ${cardTypeId} not available, skipping.`);
        continue;
      }

      console.log(`[SoulCardSets] Equipping card ${card.id} (type ${cardTypeId}, tier ${card.tier})`);

      // Załóż kartę
      const success = await this.equipCardWithVerification(card.id, equippedCount + 1);

      if (success) {
        equippedCount++;
      }
    }

    return equippedCount;
  },

  /**
   * Zakłada kartę i weryfikuje czy została założona
   * @param {number} cardId - ID karty do założenia
   * @param {number} expectedSlot - Oczekiwany numer slotu
   * @returns {Promise<boolean>}
   */
  async equipCardWithVerification(cardId, expectedSlot) {
    for (let attempt = 1; attempt <= this.MAX_EQUIP_RETRIES; attempt++) {
      GAME.emitOrder({ a: 58, type: 1, card: cardId });
      await this.delay(this.DELAY_BETWEEN_ACTIONS);

      // Weryfikuj czy karta została założona
      const slotElement = $(`#card_slot${expectedSlot}`);
      if (slotElement.find('.small_card').length > 0) {
        return true;
      }

      console.log(`[SoulCardSets] Equip attempt ${attempt} failed, retrying...`);
      await this.delay(this.DELAY_BETWEEN_ACTIONS);
    }

    console.warn(`[SoulCardSets] Failed to equip card ${cardId} after ${this.MAX_EQUIP_RETRIES} attempts`);
    return false;
  },

  /**
   * Znajduje najlepszą kartę danego typu (najwyższy tier)
   * @param {number} cardTypeId - ID typu karty (z /gfx/cards/XX.png)
   * @returns {{id: number, tier: number}|null}
   */
  findBestCard(cardTypeId) {
    const cards = $(`#sc_upgrades .small_card`);
    let bestCard = null;
    let bestTier = -1;

    cards.each((_, cardEl) => {
      const $card = $(cardEl);
      const imgSrc = $card.find('img').attr('src');

      // Pobierz ID typu z src (np. "/gfx/cards/42.png" -> 42)
      const typeMatch = imgSrc?.match(/\/gfx\/cards\/(\d+)\.png/);
      if (!typeMatch) return;

      const type = parseInt(typeMatch[1], 10);
      if (type !== cardTypeId) return;

      // Pobierz tier (wartość w <span>)
      const tier = parseInt($card.find('span').first().text(), 10) || 1;

      if (tier > bestTier) {
        bestTier = tier;
        bestCard = {
          id: parseInt($card.attr('data-card_id'), 10),
          tier: tier
        };
      }
    });

    return bestCard;
  },

  /**
   * Helper do czekania
   * @param {number} ms - Czas w milisekundach
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Zwraca listę dostępnych zestawów
   * @returns {string[]}
   */
  getSetNames() {
    return Object.keys(this.sets);
  },

  /**
   * Zwraca klucz localStorage dla aktualnego serwera i postaci
   * @returns {string}
   */
  getStorageKey() {
    const server = GAME.server || 0;
    const charId = GAME.char_data?.id || 0;
    return `sc_set_${server}_${charId}`;
  },

  /**
   * Zapisuje aktualny zestaw do localStorage
   * @param {string} setName
   */
  saveCurrentSet(setName) {
    try {
      localStorage.setItem(this.getStorageKey(), setName);
      console.log(`[SoulCardSets] Saved current set: ${setName}`);
    } catch (e) {
      console.warn('[SoulCardSets] Failed to save current set:', e);
    }
  },

  /**
   * Ładuje ostatnio używany zestaw z localStorage
   * @returns {string|null}
   */
  loadCurrentSet() {
    try {
      return localStorage.getItem(this.getStorageKey());
    } catch (e) {
      console.warn('[SoulCardSets] Failed to load current set:', e);
      return null;
    }
  }
};

// Export
window.AFO_SOUL_CARD_SETS = AFO_SOUL_CARD_SETS;
console.log('[SoulCardSets] Module loaded');
