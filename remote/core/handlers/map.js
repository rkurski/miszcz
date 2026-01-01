/**
 * ============================================================================
 * GIENIOBOT - Map Module
 * ============================================================================
 * 
 * Map-related features: quest parsing, location info
 * These methods are mixed into the Gieniobot class.
 * 
 * TODO: SK Finder needs to be rewritten from scratch
 * 
 * ============================================================================
 */

const MapMixin = {

  // ============================================
  // MAP INFO
  // ============================================

  parseMapInfo(quests, where) {
    let mapInfo = Object.values(quests).filter(this.filterQuests);
    let questsCoords = this.findQuests(mapInfo, GAME.map_quests);
    // SK finder disabled - needs rewrite
    let mapSK = Object.keys(GAME.map_balls) ? Object.keys(GAME.map_balls).length : 0;
    $(`#kws_locInfo .content`).html(`Zadania: ${mapInfo.length} ${questsCoords}SK: ${mapSK}`);
  },

  filterQuests(quest) {
    let steps = quest.length;
    if (steps > 0 && quest[steps - 1] && quest[steps - 1].end != 1) {
      return quest;
    }
  },

  // ============================================
  // QUEST FINDER
  // ============================================

  findQuests(mapInfo, quests) {
    let content = "<ul style='padding-inline-start: 15px;'>";

    mapInfo.forEach(infoArray => {
      if (infoArray[0] !== false) {
        let questData = infoArray[0];
        let qb_id = questData.qb_id.toString();
        let coord = '';

        for (let key in quests) {
          if (quests[key][0] && quests[key][0].qb_id === parseInt(qb_id)) {
            coord = key;
            break;
          }
        }

        if (coord) {
          let coordParts = coord.split('_').map(part => parseInt(part));
          let formattedKey = coordParts.join(' | ');
          content += `<li>${formattedKey}: ${questData.name}</li>`;
        }
      }
    });

    content += "</ul>";
    return content;
  }

  // TODO: findSK() - needs complete rewrite
};

// Export mixin
window.MapMixin = MapMixin;
console.log('[Map] Module loaded');
