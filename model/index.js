"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jornada = exports.Match = exports.Player = exports.Team = exports.League = void 0;
const League_1 = __importDefault(require("./League"));
exports.League = League_1.default;
const Team_1 = __importDefault(require("./Team"));
exports.Team = Team_1.default;
const Player_1 = __importDefault(require("./Player"));
exports.Player = Player_1.default;
const Match_1 = __importDefault(require("./Match"));
exports.Match = Match_1.default;
const Jornada_1 = __importDefault(require("./Jornada"));
exports.Jornada = Jornada_1.default;
console.log("Asociaciones de Match:", Match_1.default.associations);
// Configuración de relaciones
League_1.default.hasMany(Team_1.default, { foreignKey: "leagueId" });
League_1.default.hasMany(Player_1.default, { foreignKey: "leagueId" });
League_1.default.hasMany(Match_1.default, { foreignKey: "leagueId" });
League_1.default.hasMany(Jornada_1.default, { foreignKey: "leagueId", as: "jornadas" });
Jornada_1.default.hasMany(Match_1.default, { foreignKey: "jornadaId", as: "matches" });
Team_1.default.hasMany(Player_1.default, { foreignKey: "teamId" });
Team_1.default.hasMany(Match_1.default, { foreignKey: "homeTeamId", as: "homeMatches", onDelete: "CASCADE" }); // Relación para partidos como local
Team_1.default.hasMany(Match_1.default, { foreignKey: "awayTeamId", as: "awayMatches", onDelete: "CASCADE" }); // Relación para partidos como visitante
