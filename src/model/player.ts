import { fetchPlayerData } from "./fetch_player_data.js"

class Player {
  private static cache: Map<number, Player> = new Map();

  readonly birthdate: Date;

  constructor(readonly id: number, readonly name: string, birthdate: Date, public sex: string, public teamId: number, public clubName: string) {
    this.birthdate = new Date(birthdate);
  }

  getAge() {
    const currentDate = new Date(Date.now())
    return currentDate.getFullYear() - this.birthdate.getFullYear() + (new Date(1970, currentDate.getMonth(), currentDate.getDay()) < new Date(1970, this.birthdate.getMonth(), this.birthdate.getDay()) ? -1 : 0)
  }

  getNameFormatted() {
    return this.name;
  }

  static registerPlayer(playerData: any) {
    const playerId = playerData.id;
    if (!this.cache.has(playerId))
      this.cache.set(
        playerId,
        new Player(
          playerId,
          playerData["name"],
          playerData["birthdate"],
          playerData["sex"],
          playerData["team_id"],
          playerData["clubname"]
        )
      );
    return this.cache.get(playerId);
  }

  static async getPlayerById(playerId: number) {
    if (!this.cache.has(playerId)) {
      const [, playerData] = await fetchPlayerData(playerId, "get");
      this.registerPlayer(playerData);
    }
    return this.cache.get(playerId);
  }
}

export { Player };
