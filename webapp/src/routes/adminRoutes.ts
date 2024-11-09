// src/routes/adminRoutes.ts
import express from "express";
import League from "../model/League";
import Team from "../model/Team";
import Player from "../model/Player";
import User from "../model/User";

const router = express.Router();

///////////////////////////  POST  ///////////////////////////
// Crear una liga
router.post("/league", async (req, res) => {
  const { name } = req.body;
  try {
    const league = await League.create({ name });
    res.status(201).json(league);
  } catch (error) {
    console.error("Error al crear la liga:", error);
    res
      .status(500)
      .json({
        error: "Error al crear la liga",
        details: (error as Error).message,
      });
  }
});

// Crear un equipo y asignarlo a una liga
router.post("/team", async (req, res) => {
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
    points,
    matchesPlayed,
  } = req.body;

  try {
    const team = await Team.create({
      name,
      leagueId,
      captainId,
      balance,
      logo,
      goalsFor,
      goalsAgainst,
      victories,
      defeats,
      points,
      matchesPlayed,
    });
    res.status(201).json(team);
  } catch (error) {
    console.error("Error al crear el equipo:", error);
    res.status(500).json({ error: "Error al crear el equipo" });
  }
});

// Crear un usuario (capitán o cualquier otro rol)
router.post("/user", async (req, res) => {
  const { username, role } = req.body;
  try {
    const user = await User.create({ username, role });
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
      points,
      matchesPlayed,
    });

    res.status(200).json(team);
  } catch (error) {
    console.error("Error al actualizar el equipo:", error);
    res.status(500).json({ error: "Error al actualizar el equipo" });
  }
});

// Editar un capitán (usuario) por ID
router.put("/user/:id", async (req, res) => {
  const { id } = req.params;
  const { username, role } = req.body;

  try {
    const user = await User.findByPk(id);
    if (user) {
      await user.update({ username, role });
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


///////////////////////////  GET  ///////////////////////////
// Obtener todos los equipos
router.get("/teams", async (req, res) => {
  try {
    const teams = await Team.findAll();
    res.status(200).json(teams);
  } catch (error) {
    console.error("Error al obtener los equipos:", error);
    res.status(500).json({ error: "Error al obtener los equipos" });
  }
});

// Obtener un equipo por ID
router.get("/team/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const team = await Team.findByPk(id);
    if (team) {
      res.status(200).json(team);
    } else {
      res.status(404).json({ error: "Equipo no encontrado" });
    }
  } catch (error) {
    console.error("Error al obtener el equipo:", error);
    res.status(500).json({ error: "Error al obtener el equipo" });
  }
});

// Obtener todos los capitanes (usuarios)
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



export default router;
