/**
 * ============================================================================
 * GIENIOBOT - Tournaments Module
 * ============================================================================
 * 
 * Tournament signing and management functionality.
 * These methods are mixed into the Gieniobot class.
 * 
 * ============================================================================
 */

const TournamentsMixin = {

  findTournamentCategory() {
    for (var type = 2; type <= 2; type++) {
      for (var cat = 1; cat <= 69; cat++) {
        if (GAME.isYourTourCat(type, cat, GAME.char_data.reborn, GAME.char_data.level)) {
          this.tournamentCategory = cat;
        }
      }
    }
  },

  checkTournamentsSigning() {
    if (this.isCheckingTournaments) { return; }
    this.isCheckingTournaments = true;
    var currentServerTime = new Date(GAME.getTime() * 1000);
    var currentServerHour = currentServerTime.getHours();
    var currentServerMinute = currentServerTime.getMinutes();

    if (currentServerHour > 20 || currentServerHour < 18) {
      this.tourSigned = false;
      this.tournamentCategory = undefined;
      this.newTournamentID = undefined;
      this.isCheckingTournaments = false;
    } else if (!this.tourSigned) {
      if ((currentServerHour == 18 && currentServerMinute > 9) || (currentServerHour > 18 && currentServerHour < 21)) {
        this.tourSigned = true;
        this.findTournamentCategory();
        setTimeout(() => {
          if (this.tournamentCategory <= 54) {
            GAME.emitOrder({ a: 57, type: 0, type2: 0, page: 1 });
          } else {
            GAME.emitOrder({ a: 57, type: 0, type2: 0, page: 2 });
          }
        }, 500);
        setTimeout(() => { GAME.emitOrder({ a: 57, type: 1, tid: this.newTournamentID }); }, 1000);
        setTimeout(() => { GAME.emitOrder({ a: 57, type: 4 }); }, 1500);
        setTimeout(() => { kom_clear(); }, 2000);
        setTimeout(() => { this.setTimerForTournamentsReset(); }, 5000);
      } else {
        this.isCheckingTournaments = false;
      }
    }
  },

  setTimerForTournamentsReset() {
    this.isCheckingTournaments = false;
  }
};

// Export mixin
window.TournamentsMixin = TournamentsMixin;
console.log('[Tournaments] Module loaded');
