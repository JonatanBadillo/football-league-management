"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const Jornada_1 = __importDefault(require("../model/Jornada"));
const Match_1 = __importDefault(require("../model/Match"));
const Team_1 = __importDefault(require("../model/Team"));
const Player_1 = __importDefault(require("../model/Player"));
const model_1 = require("../model");
const router = express_1.default.Router();
// Proteger rutas de árbitro
router.use(authMiddleware_1.isAuthenticated);
router.use((0, authMiddleware_1.hasRole)("referee"));
// Ver partidos de la liga seleccionada
router.get("/partidos", async (req, res) => {
    try {
        const leagues = await model_1.League.findAll();
        const leagueId = req.query.leagueId || (leagues.length ? leagues[0].id : null);
        if (!leagueId) {
            return res.render("referee", {
                title: "Gestión de Partidos",
                section: "partidos",
                leagues: [],
                jornadas: [],
                selectedLeagueId: null,
                layout: false,
            });
        }
        const selectedLeagueId = parseInt(leagueId.toString(), 10);
        const jornadas = await Jornada_1.default.findAll({
            where: { leagueId: selectedLeagueId },
            include: {
                model: Match_1.default,
                as: "matches",
                include: [
                    {
                        model: Team_1.default,
                        as: "homeTeam",
                        include: [{ model: Player_1.default, as: "players" }],
                    },
                    {
                        model: Team_1.default,
                        as: "awayTeam",
                        include: [{ model: Player_1.default, as: "players" }],
                    },
                ],
            },
            order: [["date", "ASC"]],
        });
        res.render("referee", {
            title: "Gestión de Partidos",
            section: "partidos",
            leagues,
            jornadas,
            selectedLeagueId,
            layout: false,
        });
    }
    catch (error) {
        console.error("Error al cargar partidos:", error);
        res.status(500).send("Error al cargar los partidos.");
    }
});
// Editar un partido existente
router.post("/partidos/:id", async (req, res) => {
    const { id } = req.params;
    const { playerUpdates } = req.body;
    try {
        let homeScore = 0;
        let awayScore = 0;
        // Recuperar el partido actual para obtener los IDs de los equipos
        const match = await Match_1.default.findByPk(id, {
            attributes: ["homeTeamId", "awayTeamId"],
        });
        if (!match) {
            return res.status(404).json({ error: "Partido no encontrado." });
        }
        const homeTeamId = match.getDataValue("homeTeamId");
        const awayTeamId = match.getDataValue("awayTeamId");
        // Procesar actualizaciones de jugadores
        for (const update of playerUpdates) {
            const { playerId, goals, yellowCards, redCards, matchesPlayed, teamType } = update;
            const player = await Player_1.default.findByPk(playerId, {
                attributes: ["id", "goals", "yellowCards", "redCards", "matchesPlayed"],
            });
            if (player) {
                await player.update({
                    goals: (player.getDataValue("goals") || 0) + goals,
                    yellowCards: (player.getDataValue("yellowCards") || 0) + yellowCards,
                    redCards: (player.getDataValue("redCards") || 0) + redCards,
                    matchesPlayed: matchesPlayed ? (player.getDataValue("matchesPlayed") || 0) + 1 : player.getDataValue("matchesPlayed"),
                });
                // Sumar goles al marcador del equipo correspondiente
                if (teamType === "home") {
                    homeScore += goals;
                }
                else if (teamType === "away") {
                    awayScore += goals;
                }
            }
        }
        // Actualizar el marcador del partido
        await Match_1.default.update({ scoreHome: homeScore, scoreAway: awayScore }, { where: { id } });
        console.log(`Partido ${id} actualizado: HomeScore=${homeScore}, AwayScore=${awayScore}`);
        // Recuperar equipos
        const homeTeam = await Team_1.default.findByPk(homeTeamId);
        const awayTeam = await Team_1.default.findByPk(awayTeamId);
        if (!homeTeam || !awayTeam) {
            return res.status(404).json({ error: "Equipos no encontrados." });
        }
        // Calcular estadísticas del equipo local
        await homeTeam.update({
            goalsFor: homeTeam.getDataValue("goalsFor") + homeScore,
            goalsAgainst: homeTeam.getDataValue("goalsAgainst") + awayScore,
            victories: homeScore > awayScore ? homeTeam.getDataValue("victories") + 1 : homeTeam.getDataValue("victories"),
            defeats: homeScore < awayScore ? homeTeam.getDataValue("defeats") + 1 : homeTeam.getDataValue("defeats"),
            draws: homeScore === awayScore ? homeTeam.getDataValue("draws") + 1 : homeTeam.getDataValue("draws"),
            points: homeTeam.getDataValue("points") + (homeScore > awayScore ? 3 : homeScore === awayScore ? 1 : 0),
            matchesPlayed: homeTeam.getDataValue("matchesPlayed") + 1,
        });
        // Calcular estadísticas del equipo visitante
        await awayTeam.update({
            goalsFor: awayTeam.getDataValue("goalsFor") + awayScore,
            goalsAgainst: awayTeam.getDataValue("goalsAgainst") + homeScore,
            victories: awayScore > homeScore ? awayTeam.getDataValue("victories") + 1 : awayTeam.getDataValue("victories"),
            defeats: awayScore < homeScore ? awayTeam.getDataValue("defeats") + 1 : awayTeam.getDataValue("defeats"),
            draws: awayScore === homeScore ? awayTeam.getDataValue("draws") + 1 : awayTeam.getDataValue("draws"),
            points: awayTeam.getDataValue("points") + (awayScore > homeScore ? 3 : awayScore === homeScore ? 1 : 0),
            matchesPlayed: awayTeam.getDataValue("matchesPlayed") + 1,
        });
        res.status(200).json({ message: "Partido y estadísticas de equipos actualizados correctamente." });
    }
    catch (error) {
        console.error("Error al actualizar el partido y equipos:", error);
        res.status(500).json({ error: "Error al actualizar el partido y equipos." });
    }
});
exports.default = router;
