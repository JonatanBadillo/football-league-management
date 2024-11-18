// src/routes/adminRoutes.ts
import express from "express";
import League from "../model/League";
import Team from "../model/Team";
import Player from "../model/Player";
import User from "../model/User";
import Match from "../model/Match";
import Jornada from "../model/Jornada";
import path from 'path';
import multer from 'multer';
import xss from 'xss';
import { Transaction } from 'sequelize';
import sequelize from '../config/database';



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ruta donde se guardan los archivos
  },
  filename: (req, file, cb) => {
    try {
      // Asegúrate de que los datos necesarios existen
      const leagueId = req.body?.leagueId || 'unknown_league';
      const teamName = req.body?.name || 'unknown_team';
      const timestamp = Date.now();

      // Sanitiza los valores
      const sanitizedLeagueId = leagueId.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedTeamName = teamName.replace(/[^a-zA-Z0-9]/g, '_');

      // Genera un nombre para el archivo
      const fileExtension = path.extname(file.originalname);
      const newFileName = `${sanitizedLeagueId}_${sanitizedTeamName}_${timestamp}${fileExtension}`;

      cb(null, newFileName);
    } catch (error) {
      console.error('Error generando el nombre del archivo:', error);
      cb(null, `default_${Date.now()}${path.extname(file.originalname)}`); // Genera un nombre por defecto en caso de error
    }
  },
});

const upload = multer({ storage });

const router = express.Router();


/////////////////////////////////  VIEWS  /////////////////////////////////

// Ruta para mostrar el formulario de registro de capitán
router.get('/dashboard/admin/registrar-capitan', (req, res) => {
  res.render('registrarCapitan', { title: 'Registrar Capitán' });
});

// Ruta para procesar el registro de capitán
router.post('/dashboard/admin/registrar-capitan', async (req, res) => {
  const { username, password } = req.body;
  try {
    const newCaptain = await User.create({ username, password, role: 'captain' });
    res.redirect('/dashboard/admin/equipos'); // Redirige a la lista de equipos
  } catch (error) {
    console.error('Error al registrar el capitán:', error);
    res.status(500).json({ error: 'Error al registrar el capitán' });
  }
});


/////////////////////////////////  EQUIPOS  /////////////////////////////////

// Procesa la creación de equipo
router.post('/equipos', upload.single('logo'), async (req, res) => {
  const { name, leagueId, newCaptainUsername, newCaptainPassword } = req.body;

  // Sanitización de datos
  const sanitizedTeamName = xss(name);
  const sanitizedLeagueId = xss(leagueId);
  const sanitizedUsername = xss(newCaptainUsername);
  const sanitizedPassword = xss(newCaptainPassword);

  const logo = req.file ? `/uploads/${req.file.filename}` : '/images/logo_default_team.png';

  // Validación de datos del capitán
  if (!sanitizedUsername || sanitizedPassword.length < 6) {
    return res.status(400).render('admin', {
      title: 'Administrador',
      section: 'equipos',
      errorMessage: 'El nombre de usuario y la contraseña del capitán son obligatorios y la contraseña debe tener al menos 6 caracteres.',
      leagues: await League.findAll(),
      teams: await Team.findAll(),
    });
  }

  try {
    // Crear el nuevo capitán
    const newCaptain = await User.create({
      username: sanitizedUsername,
      password: sanitizedPassword,
      role: 'captain',
    });

    // Crear el equipo y asociar el nuevo capitán
    await Team.create({
      name: sanitizedTeamName,
      leagueId: sanitizedLeagueId,
      captainId: newCaptain.id,
      logo,
      balance: 500,
      goalsFor: 0,
      goalsAgainst: 0,
      victories: 0,
      defeats: 0,
      draws: 0,
      points: 0,
      matchesPlayed: 0,
    });

    res.redirect('/dashboard/admin/equipos');
  } catch (error) {
    console.error('Error al agregar el equipo:', error);
    res.status(500).render('admin', {
      title: 'Administrador',
      section: 'equipos',
      errorMessage: 'Hubo un error al agregar el equipo. Por favor, intente de nuevo.',
      leagues: await League.findAll(),
      teams: await Team.findAll(),
      selectedLeagueId: leagueId,
    });
  }
});

router.post('/equipos/:id/eliminar', async (req, res) => {
  const { id } = req.params;
  try {
    // Eliminar el equipo con el ID proporcionado
    await Team.destroy({ where: { id } });
    res.redirect('/dashboard/admin/equipos');
  } catch (error) {
    console.error('Error al eliminar el equipo:', error);
    res.status(500).render('admin', {
      title: 'Administrador - Equipos',
      section: 'equipos',
      errorMessage: 'Error al eliminar el equipo. Por favor, inténtelo nuevamente.',
      leagues: await League.findAll(),
      teams: await Team.findAll(),
    });
  }
});

router.post('/equipos/:id/editar', upload.single('logo'), async (req, res) => {
  const { id } = req.params;
  const { name, balance } = req.body;

  try {
    const updatedData: any = {
      name: xss(name),
      balance: parseFloat(balance), // Asegúrate de convertirlo a número
    };

    // Si se sube un nuevo logo, incluirlo en la actualización
    if (req.file) {
      updatedData.logo = `/uploads/${req.file.filename}`;
    }

    // Actualizar los datos del equipo
    await Team.update(updatedData, { where: { id } });

    res.redirect('/dashboard/admin/equipos');
  } catch (error) {
    console.error('Error al editar el equipo:', error);
    res.status(500).render('admin', {
      title: 'Administrador - Equipos',
      section: 'equipos',
      errorMessage: 'Error al editar el equipo. Por favor, inténtelo nuevamente.',
      leagues: await League.findAll(),
      teams: await Team.findAll(),
    });
  }
});


//////////////////////////////////////// LIGAS ////////////////////////////////////////


// Ruta para mostrar las ligas
router.get('/ligas', async (req, res) => {
  try {
    const leagues = await League.findAll(); // Obtiene todas las ligas registradas
    res.render('admin', {
      title: 'Administrador - Ligas',
      section: 'ligas',
      leagues,
      layout: false, // Esto asegura que no use el layout `main.handlebars`
    });
  } catch (error) {
    console.error('Error al cargar las ligas:', error);
    res.status(500).render('admin', {
      title: 'Administrador - Ligas',
      section: 'ligas',
      errorMessage: 'No se pudieron cargar las ligas.',
      leagues: [],
      layout: false, // También aquí usamos `layout: false`
    });
  }
});


// Ruta para agregar una nueva liga
router.post('/ligas', async (req, res) => {
  const { name } = req.body;

  // Validación y sanitización del nombre de la liga
  const sanitizedLeagueName = xss(name);
  if (!sanitizedLeagueName || sanitizedLeagueName.length < 3) {
    return res.status(400).render('admin', {
      title: 'Administrador - Ligas',
      section: 'ligas',
      errorMessage: 'El nombre de la liga debe tener al menos 3 caracteres.',
      leagues: await League.findAll(),
    });
  }

  try {
    await League.create({ 
      name: sanitizedLeagueName,
      totalGoalsFor: 0,
      matchesPlayed: 0
    });
    res.redirect('/dashboard/admin/ligas');
  } catch (error) {
    console.error('Error al agregar la liga:', error);
    res.status(500).render('admin', {
      title: 'Administrador - Ligas',
      section: 'ligas',
      errorMessage: 'Error al agregar la liga. Por favor, inténtelo nuevamente.',
      leagues: await League.findAll(),
    });
  }
});

// Ruta para eliminar una liga
router.post('/ligas/:id/eliminar', async (req, res) => {
  const { id } = req.params;

  try {
    // Inicia una transacción
    await sequelize.transaction(async (t: Transaction) => {
      // Eliminar equipos asociados
      await Team.destroy({
        where: { leagueId: id },
        transaction: t, // Usar la transacción
      });

      // Eliminar jugadores asociados
      await Player.destroy({
        where: { leagueId: id },
        transaction: t,
      });

      // Eliminar partidos asociados
      await Match.destroy({
        where: { leagueId: id },
        transaction: t,
      });

      // Finalmente, eliminar la liga
      await League.destroy({
        where: { id },
        transaction: t,
      });
    });

    // Redirigir después de la eliminación
    res.redirect('/dashboard/admin/ligas');
  } catch (error) {
    console.error('Error al eliminar la liga:', error);
    res.status(500).render('admin', {
      title: 'Administrador - Ligas',
      section: 'ligas',
      errorMessage: 'No se pudo eliminar la liga. Por favor, inténtelo nuevamente.',
      leagues: await League.findAll(),
    });
  }
});


// Ruta para editar el nombre de una liga
router.post('/ligas/:id/editar', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const sanitizedLeagueName = xss(name);
  if (!sanitizedLeagueName || sanitizedLeagueName.length < 3) {
    return res.status(400).render('admin', {
      title: 'Administrador - Ligas',
      section: 'ligas',
      errorMessage: 'El nombre de la liga debe tener al menos 3 caracteres.',
      leagues: await League.findAll(),
    });
  }

  try {
    await League.update({ name: sanitizedLeagueName }, { where: { id } });
    res.redirect('/dashboard/admin/ligas');
  } catch (error) {
    console.error('Error al editar la liga:', error);
    res.status(500).render('admin', {
      title: 'Administrador - Ligas',
      section: 'ligas',
      errorMessage: 'Error al editar la liga. Por favor, inténtelo nuevamente.',
      leagues: await League.findAll(),
    });
  }
});


//////////////////////////////////////// JUGADORES ////////////////////////////////////////

// Ruta para agregar un nuevo jugador
router.post('/jugadores', upload.single('image'), async (req, res) => {
  const { name, position, goals, yellowCards, redCards, teamId, leagueId } = req.body;

  try {
    const newPlayer = await Player.create({
      name,
      position,
      goals: parseInt(goals, 10) || 0,
      yellowCards: parseInt(yellowCards, 10) || 0,
      redCards: parseInt(redCards, 10) || 0,
      teamId: parseInt(teamId, 10),
      leagueId: parseInt(leagueId, 10),
      image: req.file ? `/uploads/${req.file.filename}` : '/images/player_noimage.png',
    });

    res.redirect(`/dashboard/admin/jugadores?leagueId=${leagueId}`);
  } catch (error) {
    console.error('Error al agregar jugador:', error);
    res.status(500).json({ error: 'Error al agregar jugador.' });
  }
});



// Ruta para editar un jugador
router.post('/jugadores/:id/editar', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, position, goals, yellowCards, redCards, teamId } = req.body;

  try {
    const updatedData: any = {
      name,
      position,
      goals: parseInt(goals, 10) || 0,
      yellowCards: parseInt(yellowCards, 10) || 0,
      redCards: parseInt(redCards, 10) || 0,
      teamId: parseInt(teamId, 10),
    };

    // Si no se sube una imagen, conserva la existente
    if (req.file) {
      updatedData.image = `/uploads/${req.file.filename}`;
    }

    await Player.update(updatedData, { where: { id } });

    res.redirect(`/dashboard/admin/jugadores`);
  } catch (error) {
    console.error('Error al editar jugador:', error);
    res.status(500).json({ error: 'Error al editar jugador.' });
  }
});


router.post('/equipos/:id/eliminar', async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar el equipo y obtener el ID del capitán asociado
    const team: any = await Team.findOne({ where: { id } });

    if (!team) {
      return res.status(404).json({ error: 'Equipo no encontrado.' });
    }

    const captainId = team.captainId; // Obtener el ID del capitán asociado

    // Eliminar el equipo
    await Team.destroy({ where: { id } });

    // Eliminar el capitán asociado
    if (captainId) {
      await User.destroy({ where: { id: captainId } });
    }

    res.redirect('/dashboard/admin/equipos');
  } catch (error) {
    console.error('Error al eliminar el equipo:', error);
    res.status(500).render('admin', {
      title: 'Administrador - Equipos',
      section: 'equipos',
      errorMessage: 'Error al eliminar el equipo. Por favor, inténtelo nuevamente.',
      leagues: await League.findAll(),
      teams: await Team.findAll(),
    });
  }
});









export default router;
