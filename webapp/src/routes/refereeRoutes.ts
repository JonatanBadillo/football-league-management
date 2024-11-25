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

    // Recuperar el partido actual
    const match = await Match.findByPk(id);

    if (!match) {
      return res.status(404).json({ error: "Partido no encontrado." });
    }

    for (const update of playerUpdates) {
      const { playerId, goals, teamType } = update;

      // Recuperar al jugador con type assertion
      const player = await Player.findByPk(playerId) as Player & { goals: number };

      if (player) {
        // Actualizar los goles del jugador
        await player.update({
          goals: (player.goals || 0) + goals,
        });

        // Actualizar el marcador del equipo local o visitante
        if (teamType === "home") {
          homeScore += goals;
        } else if (teamType === "away") {
          awayScore += goals;
        }
      }
    }

    // Actualizar el marcador del partido
    await match.update({
      scoreHome: homeScore,
      scoreAway: awayScore,
    });

    res.status(200).json({ message: "Partido actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar el partido:", error);
    res.status(500).json({ error: "Error al actualizar el partido." });
  }
});



export default router;
