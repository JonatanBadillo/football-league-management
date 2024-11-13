// src/routes/adminRoutes.ts
import express from "express";
import League from "../model/League";
import Team from "../model/Team";
import Player from "../model/Player";
import User from "../model/User";
import Match from "../model/Match";
import Jornada from "../model/Jornada";

const router = express.Router();

///////////////////////////  POST  ///////////////////////////
// Crear una liga
router.post("/league", async (req, res) => {
  const { name } = req.body;
  try {
    const league = await League.create({ name, totalGoalsFor: 0, matchesPlayed: 0 });
    res.status(201).json(league);
  } catch (error) {
    console.error("Error al crear la liga:", error);
    res.status(500).json({ error: "Error al crear la liga", details: (error as Error).message });
  }
});

// Crear un equipo y asignarlo a una liga
// Crear un equipo
router.post("/team", async (req, res) => {
  const { name, leagueId, captainId, balance = 0.0, logo = null, goalsFor = 0, goalsAgainst = 0, victories = 0, defeats = 0, draws = 0, points = 0, matchesPlayed = 0 } = req.body;
  try {
    const team = await Team.create({ name, leagueId, captainId, balance, logo, goalsFor, goalsAgainst, victories, defeats, draws, points, matchesPlayed });
    res.status(201).json(team);
  } catch (error) {
    console.error("Error al crear el equipo:", error);
    res.status(500).json({ error: "Error al crear el equipo" });
  }
});


// Crear un usuario (capitán o cualquier otro rol)
router.post("/user", async (req, res) => {
  const { username, role, password } = req.body;
  try {
    const user = await User.create({ username, role, password });
    res.status(201).json(user);
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    res
      .status(500)
      .json({
        error: "Error al crear el usuario",
        details: (error as Error).message,
      });
  }
});

// Crear una jornada y asignarla a una liga
router.post("/jornada", async (req, res) => {
  const { name, date, leagueId } = req.body;
  try {
    const jornada = await Jornada.create({ name, date, leagueId });
    res.status(201).json(jornada);
  } catch (error) {
    console.error("Error al crear la jornada:", error);
    res.status(500).json({ error: "Error al crear la jornada", details: (error as Error).message });
  }
});

// Crear un jugador
router.post('/player', async (req, res) => {
  const {
    name,
    position,
    goals,
    yellowCards,
    redCards,
    image,
    matchesPlayed,
    teamId,
    leagueId,
  } = req.body;

  try {
    const player = await Player.create({
      name,
      position,
      goals,
      yellowCards,
      redCards,
      image,
      matchesPlayed,
      teamId,
      leagueId,
    });
    res.status(201).json(player);
  } catch (error) {
    console.error('Error al crear el jugador:', error);
    res.status(500).json({ error: 'Error al crear el jugador' });
  }
});

// Crear un partido
router.post('/match', async (req, res) => {
  const {
    date,
    time,
    scoreHome = 0,
    scoreAway = 0,
    homeTeamId,
    awayTeamId,
    refereeId,
    leagueId,
  } = req.body;

  try {
    const match = await Match.create({
      date,
      time,
      scoreHome,
      scoreAway,
      homeTeamId,
      awayTeamId,
      refereeId,
      leagueId,
    });
    res.status(201).json(match);
  } catch (error) {
    console.error('Error al crear el partido:', error);
    res.status(500).json({ error: 'Error al crear el partido' });
  }
});


///////////////////////////  DELETE  ///////////////////////////
// Eliminar un equipo
router.delete("/team/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const team = await Team.findByPk(id);
    if (!team) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    await team.destroy();
    res.status(200).json({ message: "Equipo eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar el equipo:", error);
    res.status(500).json({ error: "Error al eliminar el equipo" });
  }
});

// Eliminar un capitán (usuario) por ID
router.delete("/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.destroy({ where: { id } });
    if (user) {
      res.status(200).json({ message: "Capitán eliminado correctamente" });
    } else {
      res.status(404).json({ error: "Capitán no encontrado" });
    }
  } catch (error) {
    console.error("Error al eliminar el capitán:", error);
    res.status(500).json({ error: "Error al eliminar el capitán" });
  }
});

// Eliminar una jornada
router.delete("/jornada/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const jornada = await Jornada.findByPk(id);
    if (!jornada) {
      return res.status(404).json({ error: "Jornada no encontrada" });
    }
    await jornada.destroy();
    res.status(200).json({ message: "Jornada eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la jornada:", error);
    res.status(500).json({ error: "Error al eliminar la jornada" });
  }
});


// Eliminar una liga por ID
router.delete("/league/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const league = await League.destroy({ where: { id } });
    if (league) {
      res.status(200).json({ message: "Liga eliminada correctamente" });
    } else {
      res.status(404).json({ error: "Liga no encontrada" });
    }
  } catch (error) {
    console.error("Error al eliminar la liga:", error);
    res.status(500).json({ error: "Error al eliminar la liga" });
  }
});

// Eliminar un jugador
router.delete('/player/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const player = await Player.findByPk(id);
    if (!player) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    await player.destroy();
    res.status(200).json({ message: 'Jugador eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar el jugador:', error);
    res.status(500).json({ error: 'Error al eliminar el jugador' });
  }
});

// Eliminar un partido
router.delete('/match/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    await match.destroy();
    res.status(200).json({ message: 'Partido eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar el partido:', error);
    res.status(500).json({ error: 'Error al eliminar el partido' });
  }
});


///////////////////////////  PUT  ///////////////////////////

// Actualizar un equipo
router.put("/team/:id", async (req, res) => {
  const { id } = req.params;
  const {
    name,
    leagueId,
    captainId,
    balance,
    logo,
    goalsFor,
    goalsAgainst,
    victories,
    defeats,
    draws,
    points,
    matchesPlayed,
  } = req.body;

  try {
    const team = await Team.findByPk(id);
    if (!team) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    // Actualiza los campos permitidos
    await team.update({
      name,
      leagueId,
      captainId,
      balance,
      logo,
      goalsFor,
      goalsAgainst,
      victories,
      defeats,
      draws,
      points,
      matchesPlayed,
    });

    res.status(200).json(team);
  } catch (error) {
    console.error("Error al actualizar el equipo:", error);
    res.status(500).json({ error: "Error al actualizar el equipo" });
  }
});

// Actualizar una jornada
router.put("/jornada/:id", async (req, res) => {
  const { id } = req.params;
  const { name, date, leagueId } = req.body;
  try {
    const jornada = await Jornada.findByPk(id);
    if (!jornada) {
      return res.status(404).json({ error: "Jornada no encontrada" });
    }
    await jornada.update({ name, date, leagueId });
    res.status(200).json(jornada);
  } catch (error) {
    console.error("Error al actualizar la jornada:", error);
    res.status(500).json({ error: "Error al actualizar la jornada" });
  }
});

// Editar un capitán (usuario) por ID
router.put("/user/:id", async (req, res) => {
  const { id } = req.params;
  const { username, role , password} = req.body;

  try {
    const user = await User.findByPk(id);
    if (user) {
      await user.update({ username, role, password });
      res
        .status(200)
        .json({ message: "Capitán actualizado correctamente", user });
    } else {
      res.status(404).json({ error: "Capitán no encontrado" });
    }
  } catch (error) {
    console.error("Error al actualizar el capitán:", error);
    res.status(500).json({ error: "Error al actualizar el capitán" });
  }
});

// Editar una liga por ID
router.put("/league/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const league = await League.findByPk(id);
    if (league) {
      await league.update({ name });
      res
        .status(200)
        .json({ message: "Liga actualizada correctamente", league });
    } else {
      res.status(404).json({ error: "Liga no encontrada" });
    }
  } catch (error) {
    console.error("Error al actualizar la liga:", error);
    res.status(500).json({ error: "Error al actualizar la liga" });
  }
});

// Actualizar un jugador
router.put('/player/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    position,
    goals,
    yellowCards,
    redCards,
    image,
    matchesPlayed,
    teamId,
    leagueId,
  } = req.body;

  try {
    const player = await Player.findByPk(id);
    if (!player) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    await player.update({
      name,
      position,
      goals,
      yellowCards,
      redCards,
      image,
      matchesPlayed,
      teamId,
      leagueId,
    });

    res.status(200).json(player);
  } catch (error) {
    console.error('Error al actualizar el jugador:', error);
    res.status(500).json({ error: 'Error al actualizar el jugador' });
  }
});

// Actualizar un partido
router.put('/match/:id', async (req, res) => {
  const { id } = req.params;
  const {
    date,
    time,
    scoreHome,
    scoreAway,
    homeTeamId,
    awayTeamId,
    refereeId,
    leagueId,
  } = req.body;

  try {
    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    await match.update({
      date,
      time,
      scoreHome,
      scoreAway,
      homeTeamId,
      awayTeamId,
      refereeId,
      leagueId,
    });

    res.status(200).json(match);
  } catch (error) {
    console.error('Error al actualizar el partido:', error);
    res.status(500).json({ error: 'Error al actualizar el partido' });
  }
});




///////////////////////////  GET  ///////////////////////////
// Obtener todos los equipos
router.get("/teams", async (req, res) => {
  try {
    const teams = await Team.findAll({
      include: [
        { model: League, attributes: ["id", "name"] },
        { model: User, as: "captain", attributes: ["id", "username"] },
      ],
    });
    res.status(200).json(teams);
  } catch (error) {
    console.error("Error al obtener los equipos:", error);
    res.status(500).json({ error: "Error al obtener los equipos" });
  }
});

// Obtener todas las jornadas de una liga
router.get("/jornadas/:leagueId", async (req, res) => {
  const { leagueId } = req.params;
  try {
    const jornadas = await Jornada.findAll({ where: { leagueId }, include: { model: Match } });
    res.status(200).json(jornadas);
  } catch (error) {
    console.error("Error al obtener las jornadas:", error);
    res.status(500).json({ error: "Error al obtener las jornadas" });
  }
});

// Obtener una jornada específica por ID
router.get("/jornada/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const jornada = await Jornada.findByPk(id, { include: { model: Match } });
    if (!jornada) {
      return res.status(404).json({ error: "Jornada no encontrada" });
    }
    res.status(200).json(jornada);
  } catch (error) {
    console.error("Error al obtener la jornada:", error);
    res.status(500).json({ error: "Error al obtener la jornada" });
  }
});

// Actualizar goles acumulados y partidos jugados en una liga
router.put("/league/update-stats/:id", async (req, res) => {
  const { id } = req.params;
  const { totalGoalsFor, matchesPlayed } = req.body;
  try {
    const league = await League.findByPk(id);
    if (!league) {
      return res.status(404).json({ error: "Liga no encontrada" });
    }
    await league.update({ totalGoalsFor, matchesPlayed });
    res.status(200).json(league);
  } catch (error) {
    console.error("Error al actualizar los datos de la liga:", error);
    res.status(500).json({ error: "Error al actualizar los datos de la liga" });
  }
});

// Obtener un equipo específico por ID
router.get("/team/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const team = await Team.findByPk(id, {
      include: [
        { model: League, attributes: ["id", "name"] },
        { model: User, as: "captain", attributes: ["id", "username"] },
      ],
    });

    if (!team) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    res.status(200).json(team);
  } catch (error) {
    console.error("Error al obtener el equipo:", error);
    res.status(500).json({ error: "Error al obtener el equipo" });
  }
});


// Obtener todos los (usuarios)
router.get("/users", async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
});

// Obtener un capitán (usuario) por ID
router.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: "Capitán no encontrado" });
    }
  } catch (error) {
    console.error("Error al obtener el capitán:", error);
    res.status(500).json({ error: "Error al obtener el capitán" });
  }
});

// Obtener todas las ligas
router.get("/leagues", async (req, res) => {
  try {
    const leagues = await League.findAll();
    res.status(200).json(leagues);
  } catch (error) {
    console.error("Error al obtener las ligas:", error);
    res.status(500).json({ error: "Error al obtener las ligas" });
  }
});

// Obtener una liga por ID
router.get("/league/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const league = await League.findByPk(id);
    if (league) {
      res.status(200).json(league);
    } else {
      res.status(404).json({ error: "Liga no encontrada" });
    }
  } catch (error) {
    console.error("Error al obtener la liga:", error);
    res.status(500).json({ error: "Error al obtener la liga" });
  }
});

// Obtener todos los jugadores
router.get('/players', async (req, res) => {
  try {
    const players = await Player.findAll();
    res.status(200).json(players);
  } catch (error) {
    console.error('Error al obtener los jugadores:', error);
    res.status(500).json({ error: 'Error al obtener los jugadores' });
  }
});

// Obtener un jugador por ID
router.get('/player/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const player = await Player.findByPk(id);
    if (!player) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }
    res.status(200).json(player);
  } catch (error) {
    console.error('Error al obtener el jugador:', error);
    res.status(500).json({ error: 'Error al obtener el jugador' });
  }
});

// Obtener todos los partidos
router.get('/matches', async (req, res) => {
  try {
    const matches = await Match.findAll({
      include: [
        { model: Team, as: 'homeTeam' },
        { model: Team, as: 'awayTeam' },
        { model: User, as: 'referee' },
        { model: League },
      ],
    });
    res.status(200).json(matches);
  } catch (error) {
    console.error('Error al obtener los partidos:', error);
    res.status(500).json({ error: 'Error al obtener los partidos' });
  }
});

// Obtener un partido por ID
router.get('/match/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const match = await Match.findByPk(id, {
      include: [
        { model: Team, as: 'homeTeam' },
        { model: Team, as: 'awayTeam' },
        { model: User, as: 'referee' },
        { model: League },
      ],
    });
    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }
    res.status(200).json(match);
  } catch (error) {
    console.error('Error al obtener el partido:', error);
    res.status(500).json({ error: 'Error al obtener el partido' });
  }
});





// Obtener equipos por leagueId
router.get('/api/teams', async (req, res) => {
  const { leagueId } = req.query;

  try {
    const teams = await Team.findAll({
      where: { leagueId },
      order: [['points', 'DESC'], ['goalsFor', 'DESC']], // Ordena primero por puntos y luego por diferencia de goles
    });
    res.json({ teams });
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
});


export default router;
