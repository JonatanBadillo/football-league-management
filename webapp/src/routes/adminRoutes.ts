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


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
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
      balance: 0,
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
    });
  }
});

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
    await League.destroy({ where: { id } });
    res.redirect('/dashboard/admin/ligas');
  } catch (error) {
    console.error('Error al eliminar la liga:', error);
    res.status(500).render('admin', {
      title: 'Administrador - Ligas',
      section: 'ligas',
      errorMessage: 'Error al eliminar la liga. Por favor, inténtelo nuevamente.',
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







export default router;
