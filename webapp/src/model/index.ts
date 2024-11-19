import League from "./League";
import Team from "./Team";
import Player from "./Player";
import Match from "./Match";
import Jornada from "./Jornada";

console.log("Asociaciones de Match:", Match.associations);


// Configuración de relaciones
League.hasMany(Team, { foreignKey: "leagueId" });
League.hasMany(Player, { foreignKey: "leagueId" });
League.hasMany(Match, { foreignKey: "leagueId" });
League.hasMany(Jornada, { foreignKey: "leagueId", as: "jornadas" });

Jornada.hasMany(Match, { foreignKey: "jornadaId", as: "matches" });


Team.hasMany(Player, { foreignKey: "teamId" });


Team.hasMany(Match, { foreignKey: "homeTeamId", as: "homeMatches" }); // Relación para partidos como local
Team.hasMany(Match, { foreignKey: "awayTeamId", as: "awayMatches" }); // Relación para partidos como visitante




export { League, Team, Player, Match, Jornada };
