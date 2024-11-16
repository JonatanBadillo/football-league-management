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









export default router;
