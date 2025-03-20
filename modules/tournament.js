import { Season } from "./season.js";

class Tournament {
  static cache = new Map([[-1, new Tournament(-1, "Empty tournament", new Season(-1, "Empty season", "Empty division"))]]);

  constructor(tournamentId, name, season, division) {
    this.id = tournamentId;
    this.name = name;
    this.season = season;
    this.division = division;
  }

  containsGame(game) {
    return game.tournamentId = this.id
  }

  getFormattedName() {
    return `${this.season.getFormattedName()} ${this.name.replace(/\[.*\]/, '').trim()}`;
  }

  static async #delay(milliseconds){
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
  }

  static async getTournamentById(tournamentId) {
    if (!tournamentId)
      throw new Error("Invalid argument to get tournament : tournamentId=", tournamentId)
    while (this.cache.has("wait-for-"+tournamentId))
      await this.#delay(250)
    if (!this.cache.has(tournamentId)) {
      this.cache.set("wait-for-"+tournamentId, "wait")
      const tournamentData = await fetchTournament(tournamentId);
      const season = await Season.getSeasonById(tournamentData["seasonId"]);
      this.cache.delete("wait-for-"+tournamentId)
      this.cache.set(tournamentId, new Tournament(tournamentId, tournamentData["name"], season, tournamentData["division"]));
    }
    return this.cache.get(tournamentId);
  }
}

async function fetchTournament(tournamentId) {
  const url = "https://www.floorballbelgium.be/api/public_tournament_get.php";
  const payload = { id: tournamentId, command: "get" };
  try {
    const response = await fetch (url, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status} for tournamentId= ${tournamentId}`);
    }
    const json = await response.json();
    return [response.status, json];
  } catch (error) {
    console.error(`Error fetching tournament data: ${error.message}`);
    return [500, null];
  }
}

export { Tournament };