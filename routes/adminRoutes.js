"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/adminRoutes.ts
const express_1 = __importDefault(require("express"));
const League_1 = __importDefault(require("../model/League"));
const Team_1 = __importDefault(require("../model/Team"));
const Player_1 = __importDefault(require("../model/Player"));
const User_1 = __importDefault(require("../model/User"));
const Match_1 = __importDefault(require("../model/Match"));
const Jornada_1 = __importDefault(require("../model/Jornada"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const xss_1 = __importDefault(require("xss"));
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const moment_1 = __importDefault(require("moment"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Ruta donde se guardan los archivos
    },
    filename: (req, file, cb) => {
        try {
            // Asegúrate de que los datos necesarios existen
            const leagueId = req.body?.leagueId || "unknown_league";
            const teamName = req.body?.name || "unknown_team";
            const timestamp = Date.now();
            // Sanitiza los valores
            const sanitizedLeagueId = leagueId.replace(/[^a-zA-Z0-9]/g, "_");
            const sanitizedTeamName = teamName.replace(/[^a-zA-Z0-9]/g, "_");
            // Genera un nombre para el archivo
            const fileExtension = path_1.default.extname(file.originalname);
            const newFileName = `${sanitizedLeagueId}_${sanitizedTeamName}_${timestamp}${fileExtension}`;
            cb(null, newFileName);
        }
        catch (error) {
            console.error("Error generando el nombre del archivo:", error);
            cb(null, `default_${Date.now()}${path_1.default.extname(file.originalname)}`); // Genera un nombre por defecto en caso de error
        }
    },
});
const upload = (0, multer_1.default)({ storage });
const router = express_1.default.Router();
// Proteger rutas de admin con middleware
router.use(authMiddleware_1.isAuthenticated); // Verifica si está autenticado
router.use((0, authMiddleware_1.hasRole)("admin")); // Verifica si tiene rol de admin
/////////////////////////////////  VIEWS  /////////////////////////////////
// Ruta para mostrar el formulario de registro de capitán
router.get("/dashboard/admin/registrar-capitan", (req, res) => {
    res.render("registrarCapitan", { title: "Registrar Capitán" });
});
// Ruta para procesar el registro de capitán
router.post("/dashboard/admin/registrar-capitan", async (req, res) => {
    const { username, password } = req.body;
    try {
        const newCaptain = await User_1.default.create({
            username,
            password,
            role: "captain",
        });
        res.redirect("/dashboard/admin/equipos"); // Redirige a la lista de equipos
    }
    catch (error) {
        console.error("Error al registrar el capitán:", error);
        res.status(500).json({ error: "Error al registrar el capitán" });
    }
});
// Ruta para obtener equipos
router.get("/equipos", async (req, res) => {
    try {
        const leagues = await League_1.default.findAll();
        let leagueId = req.query.leagueId;
        if (!leagueId && leagues.length > 0) {
            leagueId = leagues[0].id ? leagues[0].id.toString() : undefined;
        }
        if (!leagueId) {
            return res
                .status(404)
                .json({ error: "No se encontraron ligas en la base de datos." });
        }
        const leagueIdNum = parseInt(leagueId, 10);
        // Obtener los equipos de la liga seleccionada
        const teams = await Team_1.default.findAll({
            where: { leagueId: leagueIdNum },
            include: [
                {
                    model: User_1.default,
                    as: "captain",
                    attributes: ["username"], // Solo trae el nombre de usuario
                },
            ],
            order: [["points", "DESC"]],
        });
        res.render("admin", {
            title: "Administrador - Equipos",
            leagues,
            teams,
            section: "equipos",
            selectedLeagueId: leagueIdNum,
            layout: false,
        });
    }
    catch (error) {
        console.error("Error al obtener datos para equipos:", error);
        res.status(500).json({ error: "Error al cargar datos" });
    }
});
// Ruta para obtener jugadores
router.get("/jugadores", async (req, res) => {
    try {
        const leagues = await League_1.default.findAll();
        let leagueId = req.query.leagueId;
        if (!leagueId && leagues.length > 0) {
            leagueId = leagues[0].id ? leagues[0].id.toString() : undefined;
        }
        if (!leagueId) {
            return res
                .status(404)
                .json({ error: "No se encontraron ligas en la base de datos." });
        }
        const leagueIdNum = parseInt(leagueId, 10);
        // Filtrar los equipos por el ID de la liga seleccionada
        const teams = await Team_1.default.findAll({
            where: { leagueId: leagueIdNum },
            attributes: ["id", "name"],
            order: [["name", "ASC"]],
        });
        // Obtener los jugadores de la liga seleccionada, ordenados por goles descendentes
        const players = await Player_1.default.findAll({
            where: { leagueId: leagueIdNum },
            order: [["goals", "DESC"], ["name", "ASC"]],
            include: [{ model: Team_1.default, attributes: ["id", "name", "logo"] }],
        });
        res.render("admin", {
            title: "Administrador - Jugadores",
            leagues,
            teams,
            players,
            section: "jugadores",
            selectedLeagueId: leagueIdNum,
            layout: false,
        });
    }
    catch (error) {
        console.error("Error al obtener datos de jugadores:", error);
        res.status(500).json({ error: "Error al cargar datos de jugadores" });
    }
});
/////////////////////////////////  EQUIPOS  /////////////////////////////////
// Procesa la creación de equipo
router.post("/equipos", upload.single("logo"), async (req, res) => {
    const { name, leagueId, newCaptainUsername, newCaptainPassword } = req.body;
    const errors = [];
    // Sanitización de datos
    const sanitizedTeamName = (0, xss_1.default)(name.trim());
    const sanitizedLeagueId = (0, xss_1.default)(leagueId.trim());
    const sanitizedUsername = (0, xss_1.default)(newCaptainUsername.trim());
    const sanitizedPassword = newCaptainPassword ? (0, xss_1.default)(newCaptainPassword.trim()) : "";
    const logo = req.file
        ? `/uploads/${req.file.filename}`
        : "/images/logo_default_team.png";
    // Validación del nombre del equipo
    if (!sanitizedTeamName || sanitizedTeamName.length < 3) {
        errors.push("El nombre del equipo debe tener al menos 3 caracteres.");
    }
    // Validación de la liga
    if (!sanitizedLeagueId) {
        errors.push("Debes seleccionar una liga válida.");
    }
    // Validación del nombre de usuario del capitán
    const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_-]{6,}$/;
    if (!sanitizedUsername || !usernameRegex.test(sanitizedUsername)) {
        errors.push('El nombre de usuario debe tener al menos 6 caracteres, incluir letras, números y puede contener "_" o "-".');
    }
    // Validación de la contraseña del capitán
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    console.log(passwordRegex.test(sanitizedPassword)); // Debería ser true
    if (!sanitizedPassword) {
        errors.push("La contraseña es obligatoria.");
    }
    else if (!passwordRegex.test(sanitizedPassword)) {
        console.error("Contraseña no válida:", sanitizedPassword);
        errors.push("La contraseña debe tener al menos 8 caracteres, incluir una letra mayúscula, una minúscula, un número y un carácter especial.");
    }
    try {
        // Verificar que el nombre de usuario no esté en uso
        const existingUser = await User_1.default.findOne({
            where: { username: sanitizedUsername },
        });
        if (existingUser) {
            errors.push("El nombre de usuario ya está en uso.");
        }
        // Si hay errores, renderizar la vista con mensajes
        if (errors.length > 0) {
            console.error("Errores de validación:", errors);
            return res.status(400).render("admin", {
                title: "Administrador",
                section: "equipos",
                errorMessage: errors.join("<br>"),
                leagues: await League_1.default.findAll(),
                teams: await Team_1.default.findAll(),
            });
        }
        // Crear el nuevo capitán
        const hashedPassword = await bcrypt_1.default.hash(sanitizedPassword, 10);
        const newCaptain = await User_1.default.create({
            username: sanitizedUsername,
            password: hashedPassword,
            role: "captain",
        });
        // Crear el equipo y asociar el nuevo capitán
        await Team_1.default.create({
            name: sanitizedTeamName,
            leagueId: parseInt(sanitizedLeagueId, 10),
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
        res.redirect("/dashboard/admin/equipos");
    }
    catch (error) {
        console.error("Error al agregar el equipo:", error);
        res.status(500).render("admin", {
            title: "Administrador",
            section: "equipos",
            errorMessage: "Hubo un error al agregar el equipo. Por favor, intente de nuevo.",
            leagues: await League_1.default.findAll(),
            teams: await Team_1.default.findAll(),
            selectedLeagueId: leagueId,
        });
    }
});
router.post("/equipos/:id/eliminar", async (req, res) => {
    const { id } = req.params;
    try {
        // Obtener el equipo para acceder al capitán
        const team = await Team_1.default.findByPk(id);
        if (!team) {
            return res.status(404).render("admin", {
                title: "Administrador - Equipos",
                section: "equipos",
                errorMessage: "Equipo no encontrado.",
                leagues: await League_1.default.findAll(),
                teams: await Team_1.default.findAll(),
            });
        }
        // Acceder al captainId de forma explícita
        const captainId = team.captainId;
        // Eliminar los partidos en los que el equipo sea local o visitante
        await Match_1.default.destroy({
            where: {
                [sequelize_1.Op.or]: [{ homeTeamId: id }, { awayTeamId: id }],
            },
        });
        // Eliminar el equipo
        await Team_1.default.destroy({ where: { id } });
        // Eliminar el capitán asociado al equipo
        if (captainId) {
            await User_1.default.destroy({ where: { id: captainId } });
        }
        res.redirect("/dashboard/admin/equipos");
    }
    catch (error) {
        console.error("Error al eliminar el equipo:", error);
        res.status(500).render("admin", {
            title: "Administrador - Equipos",
            section: "equipos",
            errorMessage: "Error al eliminar el equipo. Por favor, inténtelo nuevamente.",
            leagues: await League_1.default.findAll(),
            teams: await Team_1.default.findAll(),
        });
    }
});
router.post("/equipos/:id/editar", upload.single("logo"), async (req, res) => {
    const { id } = req.params;
    const { name, balance } = req.body;
    try {
        const updatedData = {
            name: (0, xss_1.default)(name),
            balance: parseFloat(balance), // Asegúrate de convertirlo a número
        };
        // Si se sube un nuevo logo, incluirlo en la actualización
        if (req.file) {
            updatedData.logo = `/uploads/${req.file.filename}`;
        }
        // Actualizar los datos del equipo
        await Team_1.default.update(updatedData, { where: { id } });
        res.redirect("/dashboard/admin/equipos");
    }
    catch (error) {
        console.error("Error al editar el equipo:", error);
        res.status(500).render("admin", {
            title: "Administrador - Equipos",
            section: "equipos",
            errorMessage: "Error al editar el equipo. Por favor, inténtelo nuevamente.",
            leagues: await League_1.default.findAll(),
            teams: await Team_1.default.findAll(),
        });
    }
});
//////////////////////////////////////// LIGAS ////////////////////////////////////////
// Ruta para mostrar las ligas
router.get("/ligas", async (req, res) => {
    try {
        const leagues = await League_1.default.findAll(); // Obtiene todas las ligas registradas
        res.render("admin", {
            title: "Administrador - Ligas",
            section: "ligas",
            leagues,
            layout: false, // Esto asegura que no use el layout `main.handlebars`
        });
    }
    catch (error) {
        console.error("Error al cargar las ligas:", error);
        res.status(500).render("admin", {
            title: "Administrador - Ligas",
            section: "ligas",
            errorMessage: "No se pudieron cargar las ligas.",
            leagues: [],
            layout: false, // También aquí usamos `layout: false`
        });
    }
});
// Ruta para agregar una nueva liga
router.post("/ligas", async (req, res) => {
    const { name } = req.body;
    // Validación y sanitización del nombre de la liga
    const sanitizedLeagueName = (0, xss_1.default)(name);
    if (!sanitizedLeagueName || sanitizedLeagueName.length < 3) {
        return res.status(400).render("admin", {
            title: "Administrador - Ligas",
            section: "ligas",
            errorMessage: "El nombre de la liga debe tener al menos 3 caracteres.",
            leagues: await League_1.default.findAll(),
        });
    }
    try {
        await League_1.default.create({
            name: sanitizedLeagueName,
            totalGoalsFor: 0,
            matchesPlayed: 0,
        });
        res.redirect("/dashboard/admin/ligas");
    }
    catch (error) {
        console.error("Error al agregar la liga:", error);
        res.status(500).render("admin", {
            title: "Administrador - Ligas",
            section: "ligas",
            errorMessage: "Error al agregar la liga. Por favor, inténtelo nuevamente.",
            leagues: await League_1.default.findAll(),
        });
    }
});
// Ruta para eliminar una liga
router.post("/ligas/:id/eliminar", async (req, res) => {
    const { id } = req.params;
    try {
        // Inicia una transacción
        await database_1.default.transaction(async (t) => {
            // Eliminar equipos asociados
            await Team_1.default.destroy({
                where: { leagueId: id },
                transaction: t, // Usar la transacción
            });
            // Eliminar jugadores asociados
            await Player_1.default.destroy({
                where: { leagueId: id },
                transaction: t,
            });
            // Eliminar partidos asociados
            await Match_1.default.destroy({
                where: { leagueId: id },
                transaction: t,
            });
            // Finalmente, eliminar la liga
            await League_1.default.destroy({
                where: { id },
                transaction: t,
            });
        });
        // Redirigir después de la eliminación
        res.redirect("/dashboard/admin/ligas");
    }
    catch (error) {
        console.error("Error al eliminar la liga:", error);
        res.status(500).render("admin", {
            title: "Administrador - Ligas",
            section: "ligas",
            errorMessage: "No se pudo eliminar la liga. Por favor, inténtelo nuevamente.",
            leagues: await League_1.default.findAll(),
        });
    }
});
// Ruta para editar el nombre de una liga
router.post("/ligas/:id/editar", async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const sanitizedLeagueName = (0, xss_1.default)(name);
    if (!sanitizedLeagueName || sanitizedLeagueName.length < 3) {
        return res.status(400).render("admin", {
            title: "Administrador - Ligas",
            section: "ligas",
            errorMessage: "El nombre de la liga debe tener al menos 3 caracteres.",
            leagues: await League_1.default.findAll(),
        });
    }
    try {
        await League_1.default.update({ name: sanitizedLeagueName }, { where: { id } });
        res.redirect("/dashboard/admin/ligas");
    }
    catch (error) {
        console.error("Error al editar la liga:", error);
        res.status(500).render("admin", {
            title: "Administrador - Ligas",
            section: "ligas",
            errorMessage: "Error al editar la liga. Por favor, inténtelo nuevamente.",
            leagues: await League_1.default.findAll(),
        });
    }
});
//////////////////////////////////////// JUGADORES ////////////////////////////////////////
// Ruta para agregar un nuevo jugador
router.post("/jugadores", upload.single("image"), async (req, res) => {
    const { name, position, goals, yellowCards, redCards, teamId, leagueId } = req.body;
    try {
        const newPlayer = await Player_1.default.create({
            name,
            position,
            goals: parseInt(goals, 10) || 0,
            yellowCards: parseInt(yellowCards, 10) || 0,
            redCards: parseInt(redCards, 10) || 0,
            teamId: parseInt(teamId, 10),
            leagueId: parseInt(leagueId, 10),
            image: req.file
                ? `/uploads/${req.file.filename}`
                : "/images/player_noimage.png",
        });
        res.redirect(`/dashboard/admin/jugadores?leagueId=${leagueId}`);
    }
    catch (error) {
        console.error("Error al agregar jugador:", error);
        res.status(500).json({ error: "Error al agregar jugador." });
    }
});
// Ruta para editar un jugador
router.post("/jugadores/:id/editar", upload.single("image"), async (req, res) => {
    const { id } = req.params;
    const { name, position, goals, yellowCards, redCards, teamId } = req.body;
    try {
        const updatedData = {
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
        await Player_1.default.update(updatedData, { where: { id } });
        res.redirect(`/dashboard/admin/jugadores`);
    }
    catch (error) {
        console.error("Error al editar jugador:", error);
        res.status(500).json({ error: "Error al editar jugador." });
    }
});
router.post("/equipos/:id/eliminar", async (req, res) => {
    const { id } = req.params;
    try {
        // Buscar el equipo y obtener el ID del capitán asociado
        const team = await Team_1.default.findOne({ where: { id } });
        if (!team) {
            return res.status(404).json({ error: "Equipo no encontrado." });
        }
        const captainId = team.captainId; // Obtener el ID del capitán asociado
        // Eliminar el equipo
        await Team_1.default.destroy({ where: { id } });
        // Eliminar el capitán asociado
        if (captainId) {
            await User_1.default.destroy({ where: { id: captainId } });
        }
        res.redirect("/dashboard/admin/equipos");
    }
    catch (error) {
        console.error("Error al eliminar el equipo:", error);
        res.status(500).render("admin", {
            title: "Administrador - Equipos",
            section: "equipos",
            errorMessage: "Error al eliminar el equipo. Por favor, inténtelo nuevamente.",
            leagues: await League_1.default.findAll(),
            teams: await Team_1.default.findAll(),
        });
    }
});
//////////////////////////////////////// USUARIOS ////////////////////////////////////////
///////////////// admin //////////////////////
router.get("/usuarios/administradores", async (req, res) => {
    try {
        // Obtén todos los usuarios con el rol 'admin'
        const admins = await User_1.default.findAll({ where: { role: "admin" } });
        res.render("admin", {
            title: "Administradores - Administradores",
            section: "usuarios",
            admins,
            layout: false, // No usar el layout `main.handlebars`
        });
    }
    catch (error) {
        console.error("Error al obtener administradores:", error);
        res.status(500).send("Error al cargar los administradores");
    }
});
// Ruta para agregar un nuevo administrador
router.post("/usuarios/administradores/agregar", async (req, res) => {
    const errors = []; // Arreglo para almacenar mensajes de error
    try {
        // Desinfectar datos
        const username = (0, xss_1.default)(req.body.username.trim());
        const password = (0, xss_1.default)(req.body.password.trim());
        // Validar nombre de usuario
        const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/; // Al menos 6 caracteres, incluye letras y números
        if (!username || username === "") {
            errors.push("El nombre de usuario es obligatorio.");
        }
        else if (!usernameRegex.test(username)) {
            errors.push("El nombre de usuario debe tener al menos 6 caracteres, incluyendo letras y números.");
        }
        // Validar contraseña
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // 8+ caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
        if (!password || password === "") {
            errors.push("La contraseña es obligatoria.");
        }
        else if (!passwordRegex.test(password)) {
            errors.push("La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una letra minúscula, un número y un carácter especial.");
        }
        // Verifica que no exista un usuario con el mismo nombre
        const existingAdmin = await User_1.default.findOne({ where: { username } });
        if (existingAdmin) {
            errors.push("El usuario ya existe como administrador.");
        }
        // Si hay errores, renderizar la vista con los mensajes de error
        if (errors.length > 0) {
            const admins = await User_1.default.findAll({ where: { role: "admin" } });
            return res.render("admin", {
                title: "Administradores - Administradores",
                section: "usuarios",
                admins,
                errorMessage: errors.join("<br>"),
                layout: false,
            });
        }
        // Hashear la contraseña
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Crear el nuevo administrador
        await User_1.default.create({
            username,
            password: hashedPassword,
            role: "admin",
        });
        res.redirect("/dashboard/admin/usuarios/administradores");
    }
    catch (error) {
        console.error("Error al agregar administrador:", error);
        res.status(500).send("Error al agregar el administrador.");
    }
});
router.post("/usuarios/administradores/editar/:id", async (req, res) => {
    const { id } = req.params;
    const errors = []; // Arreglo para almacenar mensajes de error
    try {
        // Desinfectar datos
        const username = (0, xss_1.default)(req.body.username.trim());
        const password = (0, xss_1.default)(req.body.password.trim());
        // Encuentra al administrador por ID
        const admin = await User_1.default.findByPk(id);
        if (!admin || admin.role !== "admin") {
            return res.status(404).send("Administrador no encontrado.");
        }
        // Validar nombre de usuario
        const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/; // Al menos 6 caracteres, incluye letras y números
        if (!username || username === "") {
            errors.push("El nombre de usuario es obligatorio.");
        }
        else if (!usernameRegex.test(username)) {
            errors.push("El nombre de usuario debe tener al menos 6 caracteres, incluyendo letras y números.");
        }
        // Validar contraseña si está presente
        if (password && password !== "") {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // 8+ caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
            if (!passwordRegex.test(password)) {
                errors.push("La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una letra minúscula, un número y un carácter especial.");
            }
        }
        // Verifica que no exista otro usuario con el mismo nombre
        const existingAdmin = await User_1.default.findOne({
            where: { username, id: { [sequelize_1.Op.ne]: id } }, // Excluir al admin actual
        });
        if (existingAdmin) {
            errors.push("El nombre de usuario ya está en uso por otro administrador.");
        }
        // Si hay errores, renderizar la vista con los mensajes de error
        if (errors.length > 0) {
            const admins = await User_1.default.findAll({ where: { role: "admin" } });
            return res.render("admin", {
                title: "Administradores - Editar Administrador",
                section: "usuarios",
                admins,
                errorMessage: errors.join("<br>"),
                layout: false,
            });
        }
        // Actualiza los datos del administrador
        const updatedData = { username };
        if (password && password !== "") {
            updatedData.password = await bcrypt_1.default.hash(password, 10); // Hashear la nueva contraseña
        }
        await admin.update(updatedData);
        res.redirect("/dashboard/admin/usuarios/administradores");
    }
    catch (error) {
        console.error("Error al editar administrador:", error);
        res.status(500).send("Error al editar el administrador.");
    }
});
router.post("/usuarios/administradores/eliminar/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Encuentra al administrador por ID
        const admin = await User_1.default.findByPk(id);
        if (!admin || admin.role !== "admin") {
            return res.status(404).send("Administrador no encontrado.");
        }
        // Elimina al administrador
        await admin.destroy();
        res.redirect("/dashboard/admin/usuarios/administradores");
    }
    catch (error) {
        console.error("Error al eliminar administrador:", error);
        res.status(500).send("Error al eliminar el administrador.");
    }
});
///////////////// arbitros //////////////////////
router.get("/usuarios/arbitros", async (req, res) => {
    try {
        // Obtiene todos los árbitros con el rol "referee"
        const referees = await User_1.default.findAll({ where: { role: "referee" } });
        res.render("admin", {
            title: "Administradores - Árbitros",
            section: "arbitros",
            referees,
            layout: false, // No usa el layout principal
        });
    }
    catch (error) {
        console.error("Error al obtener árbitros:", error);
        res.status(500).send("Error al cargar los árbitros.");
    }
});
router.post("/usuarios/arbitros/agregar", async (req, res) => {
    const errors = [];
    try {
        const username = (0, xss_1.default)(req.body.username.trim());
        const password = (0, xss_1.default)(req.body.password.trim());
        // Validación de nombre de usuario
        const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        if (!username || !usernameRegex.test(username)) {
            errors.push("El nombre de usuario no debe incluir espacios, debe tener al menos 6 caracteres, incluyendo letras y números.");
        }
        // Validación de contraseña
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!password || !passwordRegex.test(password)) {
            errors.push("La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula, un número y un carácter especial.");
        }
        // Verificar si el árbitro ya existe
        const existingReferee = await User_1.default.findOne({ where: { username } });
        if (existingReferee) {
            errors.push("El nombre de usuario ya está en uso.");
        }
        if (errors.length > 0) {
            const referees = await User_1.default.findAll({ where: { role: "referee" } });
            return res.render("admin", {
                title: "Administradores - Árbitros",
                section: "arbitros",
                referees,
                errorMessage: errors.join("<br>"),
                layout: false,
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await User_1.default.create({
            username,
            password: hashedPassword,
            role: "referee",
        });
        res.redirect("/dashboard/admin/usuarios/arbitros");
    }
    catch (error) {
        console.error("Error al agregar árbitro:", error);
        res.status(500).send("Error al agregar el árbitro.");
    }
});
router.post("/usuarios/arbitros/editar/:id", async (req, res) => {
    const { id } = req.params;
    const errors = [];
    try {
        const username = (0, xss_1.default)(req.body.username.trim());
        const password = (0, xss_1.default)(req.body.password.trim());
        const referee = await User_1.default.findByPk(id);
        if (!referee || referee.role !== "referee") {
            return res.status(404).send("Árbitro no encontrado.");
        }
        // Validación de nombre de usuario
        const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        if (!username || !usernameRegex.test(username)) {
            errors.push("El nombre de usuario debe tener al menos 6 caracteres, incluyendo letras y números.");
        }
        // Validación de contraseña (opcional)
        if (password && password !== "") {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                errors.push("La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula, un número y un carácter especial.");
            }
        }
        // Verificar si el nombre ya está en uso por otro árbitro
        const existingReferee = await User_1.default.findOne({
            where: { username, id: { [sequelize_1.Op.ne]: id } },
        });
        if (existingReferee) {
            errors.push("El nombre de usuario ya está en uso.");
        }
        if (errors.length > 0) {
            const referees = await User_1.default.findAll({ where: { role: "referee" } });
            return res.render("admin", {
                title: "Administradores - Árbitros",
                section: "arbitros",
                referees,
                errorMessage: errors.join("<br>"),
                layout: false,
            });
        }
        const updatedData = { username };
        if (password && password !== "") {
            updatedData.password = await bcrypt_1.default.hash(password, 10);
        }
        await referee.update(updatedData);
        res.redirect("/dashboard/admin/usuarios/arbitros");
    }
    catch (error) {
        console.error("Error al editar árbitro:", error);
        res.status(500).send("Error al editar el árbitro.");
    }
});
router.post("/usuarios/arbitros/eliminar/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const referee = await User_1.default.findByPk(id);
        if (!referee || referee.role !== "referee") {
            return res.status(404).send("Árbitro no encontrado.");
        }
        await referee.destroy();
        res.redirect("/dashboard/admin/usuarios/arbitros");
    }
    catch (error) {
        console.error("Error al eliminar árbitro:", error);
        res.status(500).send("Error al eliminar el árbitro.");
    }
});
///////////////// capitanes //////////////////////
router.get("/usuarios/capitanes", async (req, res) => {
    try {
        // Obtener todos los capitanes con sus equipos y ligas asociadas
        const captains = await Team_1.default.findAll({
            include: [
                {
                    model: User_1.default,
                    as: "captain",
                    attributes: ["id", "username"], // Traer solo los atributos necesarios del capitán
                },
                {
                    model: League_1.default,
                    as: "league",
                    attributes: ["name"], // Traer el nombre de la liga
                },
            ],
            attributes: ["name"], // Solo traer el nombre del equipo
        });
        // Formatear los datos para la vista
        const captainsData = captains.map((team) => ({
            id: team.captain.id,
            username: team.captain.username,
            teamName: team.name,
            leagueName: team.league ? team.league.name : "Sin Liga",
        }));
        res.render("admin", {
            title: "Administradores - Capitanes",
            section: "capitanes",
            captains: captainsData,
            layout: false,
        });
    }
    catch (error) {
        console.error("Error al obtener capitanes:", error);
        res.status(500).send("Error al cargar los capitanes.");
    }
});
router.post("/usuarios/capitanes/eliminar/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Buscar el equipo asociado al capitán
        const teamWithCaptain = await Team_1.default.findOne({ where: { captainId: id } });
        if (!teamWithCaptain) {
            return res.status(404).send("Equipo asociado al capitán no encontrado.");
        }
        // Eliminar equipo y capitán
        await teamWithCaptain.destroy(); // Elimina el equipo
        await User_1.default.destroy({ where: { id } }); // Elimina el capitán
        res.redirect("/dashboard/admin/usuarios/capitanes");
    }
    catch (error) {
        console.error("Error al eliminar capitán:", error);
        res.status(500).send("Error al eliminar el capitán.");
    }
});
router.post("/usuarios/capitanes/editar/:id", async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;
    const errors = [];
    try {
        // Sanitización de datos
        const sanitizedUsername = (0, xss_1.default)(username.trim());
        const sanitizedPassword = password ? (0, xss_1.default)(password.trim()) : "";
        // Validación de nombre de usuario
        const usernameRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_-]{6,}$/; // Al menos 6 caracteres, incluye letras, números, guion bajo y guion
        if (!sanitizedUsername || !usernameRegex.test(sanitizedUsername)) {
            errors.push('El nombre de usuario debe tener al menos 6 caracteres, incluir letras, números y puede contener "_" o "-".');
        }
        // Validación de contraseña
        if (sanitizedPassword) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
            if (!passwordRegex.test(sanitizedPassword)) {
                errors.push("La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula, un número y un carácter especial.");
            }
        }
        // Validar que el nombre de usuario no se repita (independientemente del rol)
        const existingUser = await User_1.default.findOne({
            where: { username: sanitizedUsername, id: { [sequelize_1.Op.ne]: id } },
        });
        if (existingUser) {
            errors.push("El nombre de usuario ya está en uso.");
        }
        // Buscar al capitán
        const captain = await User_1.default.findOne({ where: { id, role: "captain" } });
        if (!captain) {
            errors.push("El capitán no fue encontrado.");
        }
        // Si hay errores, renderizar con mensajes
        if (errors.length > 0 || !captain) {
            const captains = await Team_1.default.findAll({
                include: [
                    {
                        model: User_1.default,
                        as: "captain",
                        attributes: ["id", "username"],
                    },
                ],
                attributes: ["name"],
            });
            const captainsData = captains.map((team) => ({
                id: team.captain?.id,
                username: team.captain?.username,
                teamName: team.name,
            }));
            return res.render("admin", {
                title: "Administradores - Capitanes",
                section: "capitanes",
                captains: captainsData,
                errorMessage: errors.join("<br>"),
                layout: false,
            });
        }
        // Actualizar los datos del capitán
        if (sanitizedUsername)
            captain.username = sanitizedUsername;
        if (sanitizedPassword) {
            captain.password = await bcrypt_1.default.hash(sanitizedPassword, 10);
        }
        await captain.save();
        res.redirect("/dashboard/admin/usuarios/capitanes");
    }
    catch (error) {
        console.error("Error al editar el capitán:", error);
        res.status(500).send("Error al editar el capitán.");
    }
});
//////////////////////////////////////// PARTIDOS ////////////////////////////////////////
router.get("/partidos", async (req, res) => {
    try {
        const leagues = await League_1.default.findAll();
        const leagueId = req.query.leagueId || (leagues.length ? leagues[0].id : null);
        if (!leagueId) {
            return res.render("admin", {
                title: "Gestión de Partidos",
                section: "partidos",
                leagues: [],
                jornadas: [],
                teams: [],
                selectedLeagueId: null,
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
        console.log("Jornadas con partidos actualizados:", JSON.stringify(jornadas, null, 2));
        const teams = await Team_1.default.findAll({
            where: { leagueId: selectedLeagueId },
            attributes: ["id", "name"],
        });
        res.render("admin", {
            title: "Gestión de Partidos",
            section: "partidos",
            leagues,
            jornadas,
            teams,
            selectedLeagueId,
            layout: false,
        });
    }
    catch (error) {
        console.error("Error al cargar partidos:", error);
        res.status(500).send("Error al cargar los partidos.");
    }
});
router.post("/partidos", async (req, res) => {
    const { jornadaId, homeTeamId, awayTeamId, time, leagueId } = req.body;
    try {
        // Validar que los equipos no sean iguales
        if (homeTeamId === awayTeamId) {
            const errorMessage = "Un equipo no puede jugar contra sí mismo.";
            const leagues = await League_1.default.findAll();
            const jornadas = await Jornada_1.default.findAll({ where: { leagueId } });
            const teams = await Team_1.default.findAll({ where: { leagueId } });
            return res.render("admin", {
                title: "Gestión de Partidos",
                section: "partidos",
                leagues,
                jornadas,
                teams,
                selectedLeagueId: leagueId,
                errorMessage,
                layout: false,
            });
        }
        // Validar que no haya partidos a la misma hora en la jornada
        const conflictingMatch = await Match_1.default.findOne({
            where: { jornadaId, time },
        });
        if (conflictingMatch) {
            const errorMessage = "Ya hay un partido programado a la misma hora en esta jornada.";
            const leagues = await League_1.default.findAll();
            const jornadas = await Jornada_1.default.findAll({ where: { leagueId } });
            const teams = await Team_1.default.findAll({ where: { leagueId } });
            return res.render("admin", {
                title: "Gestión de Partidos",
                section: "partidos",
                leagues,
                jornadas,
                teams,
                selectedLeagueId: leagueId,
                errorMessage,
                layout: false,
            });
        }
        // Verificar si el partido ya existe
        const existingMatch = await Match_1.default.findOne({
            where: {
                jornadaId,
                [sequelize_1.Op.or]: [
                    { homeTeamId, awayTeamId },
                    { homeTeamId: awayTeamId, awayTeamId: homeTeamId },
                ],
            },
        });
        if (existingMatch) {
            const errorMessage = "El partido ya se ha registrado en esta jornada u otra.";
            const leagues = await League_1.default.findAll();
            const jornadas = await Jornada_1.default.findAll({ where: { leagueId } });
            const teams = await Team_1.default.findAll({ where: { leagueId } });
            return res.render("admin", {
                title: "Gestión de Partidos",
                section: "partidos",
                leagues,
                jornadas,
                teams,
                selectedLeagueId: leagueId,
                errorMessage,
                layout: false,
            });
        }
        // Obtener la fecha de la jornada
        const jornada = await Jornada_1.default.findByPk(jornadaId);
        if (!jornada) {
            return res.status(404).send("Jornada no encontrada.");
        }
        // Crear el partido
        await Match_1.default.create({
            jornadaId,
            homeTeamId,
            awayTeamId,
            date: jornada.date,
            time,
            leagueId,
            scoreHome: 0,
            scoreAway: 0,
        });
        res.redirect(`/dashboard/admin/partidos?leagueId=${leagueId}`);
    }
    catch (error) {
        console.error("Error al agregar partido:", error);
        res.status(500).send("Error al agregar el partido.");
    }
});
router.get("/partidos/:id/editar", async (req, res) => {
    const { id } = req.params;
    try {
        const match = await Match_1.default.findByPk(id, {
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
        });
        if (!match) {
            return res.status(404).send("Partido no encontrado.");
        }
        res.render("editMatch", {
            match,
            layout: false, // Evitar que use un layout principal si no es necesario
        });
    }
    catch (error) {
        console.error("Error al cargar partido:", error);
        res.status(500).send("Error al cargar los datos del partido.");
    }
});
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
            const { playerId, goals, teamType } = update;
            const player = await Player_1.default.findByPk(playerId, {
                attributes: ["id", "goals"],
            });
            if (player) {
                await player.update({
                    goals: (player.getDataValue("goals") || 0) + goals,
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
router.post("/partidos/:id/eliminar", async (req, res) => {
    const { id } = req.params;
    const { leagueId } = req.body;
    try {
        // Verificar si el partido existe
        const match = await Match_1.default.findByPk(id);
        if (!match) {
            return res.status(404).json({ error: "Partido no encontrado." });
        }
        // Eliminar el partido
        await Match_1.default.destroy({ where: { id } });
        res.redirect(`/dashboard/admin/partidos?leagueId=${leagueId}`);
    }
    catch (error) {
        console.error("Error al eliminar partido:", error);
        res.status(500).send("Error al eliminar el partido.");
    }
});
router.post("/jornadas", async (req, res) => {
    const { date, leagueId } = req.body;
    try {
        // Obtener la última jornada de la liga
        const lastJornada = await Jornada_1.default.findOne({
            where: { leagueId },
            order: [["date", "DESC"]],
        });
        // Autogenerar el nombre de la jornada
        const nextJornadaName = lastJornada
            ? `Jornada ${parseInt(lastJornada.name.split(" ")[1]) + 1}`
            : "Jornada 1";
        // Ajustar la fecha para asegurarnos de que refleje lo seleccionado
        const jornadaDate = (0, moment_1.default)(date).startOf("day").utc().toDate();
        // Crear jornada
        await Jornada_1.default.create({
            name: nextJornadaName,
            date: jornadaDate,
            leagueId,
        });
        res.redirect(`/dashboard/admin/partidos?leagueId=${leagueId}`);
    }
    catch (error) {
        console.error("Error al crear jornada:", error);
        res.status(500).send("Error al crear la jornada.");
    }
});
router.post("/jornadas/:id/editar", async (req, res) => {
    const { id } = req.params;
    const { date, leagueId } = req.body;
    try {
        // Actualizar la jornada
        await Jornada_1.default.update({ date: (0, moment_1.default)(date).startOf("day").toDate() }, { where: { id } });
        res.redirect(`/dashboard/admin/partidos?leagueId=${leagueId}`);
    }
    catch (error) {
        console.error("Error al editar jornada:", error);
        res.status(500).send("Error al editar la jornada.");
    }
});
router.post("/jornadas/:id/eliminar", async (req, res) => {
    const { id } = req.params;
    const { leagueId } = req.body;
    try {
        // Contar partidos asociados a la jornada
        const matchesCount = await Match_1.default.count({ where: { jornadaId: id } });
        if (matchesCount > 0) {
            // Eliminar partidos asociados
            await Match_1.default.destroy({ where: { jornadaId: id } });
        }
        // Eliminar la jornada
        await Jornada_1.default.destroy({ where: { id } });
        res.redirect(`/dashboard/admin/partidos?leagueId=${leagueId}`);
    }
    catch (error) {
        console.error("Error al eliminar jornada:", error);
        res.status(500).send("Error al eliminar la jornada.");
    }
});
exports.default = router;
