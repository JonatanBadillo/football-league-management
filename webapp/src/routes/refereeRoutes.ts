import express from "express";
import { isAuthenticated, hasRole } from "../middlewares/authMiddleware";
import Jornada from "../model/Jornada";
import Match from "../model/Match";
import Team from "../model/Team";
import Player from "../model/Player";
import { League } from "../model";

const router = express.Router();

// Proteger rutas de árbitro
router.use(isAuthenticated);
router.use(hasRole("referee"));

// Ver partidos de la liga seleccionada
router.get("/partidos", async (req, res) => {
  try {
    const leagues = await League.findAll();
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

    const jornadas = await Jornada.findAll({
      where: { leagueId: selectedLeagueId },
      include: {
        model: Match,
        as: "matches",
        include: [
          {
            model: Team,
            as: "homeTeam",
            include: [{ model: Player, as: "players" }],
          },
          {
            model: Team,
            as: "awayTeam",
            include: [{ model: Player, as: "players" }],
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
  } catch (error) {
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
    const match = await Match.findByPk(id, {
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

      const player = await Player.findByPk(playerId, {
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
        } else if (teamType === "away") {
          awayScore += goals;
        }
      }
    }

    // Actualizar el marcador del partido
    await Match.update(
      { scoreHome: homeScore, scoreAway: awayScore },
      { where: { id } }
    );

    console.log(`Partido ${id} actualizado: HomeScore=${homeScore}, AwayScore=${awayScore}`);

    // Recuperar equipos
    const homeTeam = await Team.findByPk(homeTeamId);
    const awayTeam = await Team.findByPk(awayTeamId);

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
  } catch (error) {
    console.error("Error al actualizar el partido y equipos:", error);
    res.status(500).json({ error: "Error al actualizar el partido y equipos." });
  }
});





export default router;
