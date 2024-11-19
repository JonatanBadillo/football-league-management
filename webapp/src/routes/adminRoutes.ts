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
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';




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


//////////////////////////////////////// USUARIOS ////////////////////////////////////////
///////////////// admin //////////////////////
router.get('/usuarios/administradores', async (req, res) => {
  try {
    // Obtén todos los usuarios con el rol 'admin'
    const admins = await User.findAll({ where: { role: 'admin' } });

    res.render('admin', {
      title: 'Administradores - Administradores',
      section: 'usuarios',
      admins, // Pasa los administradores a la vista
      layout: false, // No usar el layout `main.handlebars`
    });
  } catch (error) {
    console.error('Error al obtener administradores:', error);
    res.status(500).send('Error al cargar los administradores');
  }
});

// Ruta para agregar un nuevo administrador

router.post('/usuarios/administradores/agregar', async (req, res) => {
  const errors: string[] = []; // Arreglo para almacenar mensajes de error

  try {
    // Desinfectar datos
    const username = xss(req.body.username.trim());
    const password = xss(req.body.password.trim());

    // Validar nombre de usuario
    const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/; // Al menos 6 caracteres, incluye letras y números
    if (!username || username === '') {
      errors.push('El nombre de usuario es obligatorio.');
    } else if (!usernameRegex.test(username)) {
      errors.push('El nombre de usuario debe tener al menos 6 caracteres, incluyendo letras y números.');
    }

    // Validar contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // 8+ caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
    if (!password || password === '') {
      errors.push('La contraseña es obligatoria.');
    } else if (!passwordRegex.test(password)) {
      errors.push(
        'La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una letra minúscula, un número y un carácter especial.'
      );
    }

    // Verifica que no exista un usuario con el mismo nombre
    const existingAdmin = await User.findOne({ where: { username, role: 'admin' } });
    if (existingAdmin) {
      errors.push('El usuario ya existe como administrador.');
    }

    // Si hay errores, renderizar la vista con los mensajes de error
    if (errors.length > 0) {
      const admins = await User.findAll({ where: { role: 'admin' } });
      return res.render('admin', {
        title: 'Administradores - Administradores',
        section: 'usuarios',
        admins,
        errorMessage: errors.join('<br>'), // Junta los mensajes en HTML
        layout: false,
      });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el nuevo administrador
    await User.create({
      username,
      password: hashedPassword,
      role: 'admin',
    });

    res.redirect('/dashboard/admin/usuarios/administradores');
  } catch (error) {
    console.error('Error al agregar administrador:', error);
    res.status(500).send('Error al agregar el administrador.');
  }
});


router.post('/usuarios/administradores/editar/:id', async (req, res) => {
  const { id } = req.params;
  const errors: string[] = []; // Arreglo para almacenar mensajes de error

  try {
    // Desinfectar datos
    const username = xss(req.body.username.trim());
    const password = xss(req.body.password.trim());

    // Encuentra al administrador por ID
    const admin = await User.findByPk(id);

    if (!admin || admin.role !== 'admin') {
      return res.status(404).send('Administrador no encontrado.');
    }

    // Validar nombre de usuario
    const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/; // Al menos 6 caracteres, incluye letras y números
    if (!username || username === '') {
      errors.push('El nombre de usuario es obligatorio.');
    } else if (!usernameRegex.test(username)) {
      errors.push('El nombre de usuario debe tener al menos 6 caracteres, incluyendo letras y números.');
    }

    // Validar contraseña si está presente
    if (password && password !== '') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // 8+ caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
      if (!passwordRegex.test(password)) {
        errors.push(
          'La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una letra minúscula, un número y un carácter especial.'
        );
      }
    }

    // Verifica que no exista otro usuario con el mismo nombre
    const existingAdmin = await User.findOne({
      where: { username, role: 'admin', id: { [Op.ne]: id } }, // Excluir al admin actual
    });
    if (existingAdmin) {
      errors.push('El nombre de usuario ya está en uso por otro administrador.');
    }

    // Si hay errores, renderizar la vista con los mensajes de error
    if (errors.length > 0) {
      const admins = await User.findAll({ where: { role: 'admin' } });
      return res.render('admin', {
        title: 'Administradores - Editar Administrador',
        section: 'usuarios',
        admins,
        errorMessage: errors.join('<br>'), // Junta los mensajes en HTML
        layout: false,
      });
    }

    // Actualiza los datos del administrador
    const updatedData: any = { username };
    if (password && password !== '') {
      updatedData.password = await bcrypt.hash(password, 10); // Hashear la nueva contraseña
    }

    await admin.update(updatedData);

    res.redirect('/dashboard/admin/usuarios/administradores');
  } catch (error) {
    console.error('Error al editar administrador:', error);
    res.status(500).send('Error al editar el administrador.');
  }
});


router.post('/usuarios/administradores/eliminar/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Encuentra al administrador por ID
    const admin = await User.findByPk(id);

    if (!admin || admin.role !== 'admin') {
      return res.status(404).send('Administrador no encontrado.');
    }

    // Elimina al administrador
    await admin.destroy();

    res.redirect('/dashboard/admin/usuarios/administradores');
  } catch (error) {
    console.error('Error al eliminar administrador:', error);
    res.status(500).send('Error al eliminar el administrador.');
  }
});

///////////////// arbitros //////////////////////
router.get('/usuarios/arbitros', async (req, res) => {
  try {
    // Obtiene todos los árbitros con el rol "referee"
    const referees = await User.findAll({ where: { role: 'referee' } });

    res.render('admin', {
      title: 'Administradores - Árbitros',
      section: 'arbitros', // Define que la sección activa es "arbitros"
      referees, // Pasa los árbitros a la vista
      layout: false, // No usa el layout principal
    });
  } catch (error) {
    console.error('Error al obtener árbitros:', error);
    res.status(500).send('Error al cargar los árbitros.');
  }
});


router.post('/usuarios/arbitros/agregar', async (req, res) => {
  const errors: string[] = [];

  try {
    const username = xss(req.body.username.trim());
    const password = xss(req.body.password.trim());

    // Validación de nombre de usuario
    const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!username || !usernameRegex.test(username)) {
      errors.push('El nombre de usuario no debe incluir espacios, debe tener al menos 6 caracteres, incluyendo letras y números.');
    }

    // Validación de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      errors.push(
        'La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula, un número y un carácter especial.'
      );
    }

    // Verificar si el árbitro ya existe
    const existingReferee = await User.findOne({ where: { username, role: 'referee' } });
    if (existingReferee) {
      errors.push('El nombre de usuario ya está en uso.');
    }

    if (errors.length > 0) {
      const referees = await User.findAll({ where: { role: 'referee' } });
      return res.render('admin', {
        title: 'Administradores - Árbitros',
        section: 'arbitros',
        referees,
        errorMessage: errors.join('<br>'),
        layout: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword,
      role: 'referee',
    });

    res.redirect('/dashboard/admin/usuarios/arbitros');
  } catch (error) {
    console.error('Error al agregar árbitro:', error);
    res.status(500).send('Error al agregar el árbitro.');
  }
});


router.post('/usuarios/arbitros/editar/:id', async (req, res) => {
  const { id } = req.params;
  const errors: string[] = [];

  try {
    const username = xss(req.body.username.trim());
    const password = xss(req.body.password.trim());

    const referee = await User.findByPk(id);
    if (!referee || referee.role !== 'referee') {
      return res.status(404).send('Árbitro no encontrado.');
    }

    // Validación de nombre de usuario
    const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!username || !usernameRegex.test(username)) {
      errors.push('El nombre de usuario debe tener al menos 6 caracteres, incluyendo letras y números.');
    }

    // Validación de contraseña (opcional)
    if (password && password !== '') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        errors.push(
          'La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula, un número y un carácter especial.'
        );
      }
    }

    // Verificar si el nombre ya está en uso por otro árbitro
    const existingReferee = await User.findOne({
      where: { username, role: 'referee', id: { [Op.ne]: id } },
    });
    if (existingReferee) {
      errors.push('El nombre de usuario ya está en uso.');
    }

    if (errors.length > 0) {
      const referees = await User.findAll({ where: { role: 'referee' } });
      return res.render('admin', {
        title: 'Administradores - Árbitros',
        section: 'arbitros',
        referees,
        errorMessage: errors.join('<br>'),
        layout: false,
      });
    }

    const updatedData: any = { username };
    if (password && password !== '') {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    await referee.update(updatedData);

    res.redirect('/dashboard/admin/usuarios/arbitros');
  } catch (error) {
    console.error('Error al editar árbitro:', error);
    res.status(500).send('Error al editar el árbitro.');
  }
});


router.post('/usuarios/arbitros/eliminar/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const referee = await User.findByPk(id);
    if (!referee || referee.role !== 'referee') {
      return res.status(404).send('Árbitro no encontrado.');
    }

    await referee.destroy();

    res.redirect('/dashboard/admin/usuarios/arbitros');
  } catch (error) {
    console.error('Error al eliminar árbitro:', error);
    res.status(500).send('Error al eliminar el árbitro.');
  }
});



export default router;
