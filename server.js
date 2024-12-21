"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const express_handlebars_1 = require("express-handlebars");
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const multer_1 = __importDefault(require("multer"));
const database_1 = __importDefault(require("./config/database"));
const League_1 = __importDefault(require("./model/League"));
const Team_1 = __importDefault(require("./model/Team"));
const Match_1 = __importDefault(require("./model/Match"));
const Player_1 = __importDefault(require("./model/Player"));
const User_1 = __importDefault(require("./model/User"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const model_1 = require("./model");
const express_session_1 = __importDefault(require("express-session"));
const connect_session_sequelize_1 = __importDefault(require("connect-session-sequelize"));
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const captainRoutes_1 = __importDefault(require("./routes/captainRoutes"));
const refereeRoutes_1 = __importDefault(require("./routes/refereeRoutes"));
const SequelizeStore = (0, connect_session_sequelize_1.default)(express_session_1.default.Store);
const sessionStore = new SequelizeStore({
    db: database_1.default, // Base de datos configurada en tu archivo `database.ts`
});
const app = (0, express_1.default)();
const PORT = 3000;
app.use((0, express_session_1.default)({
    secret: "mySecretKey",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 60 * 60 * 1000, // 1 hora
    },
}));
sessionStore.sync(); // Sincroniza la tabla de sesiones en la base de datos
app.engine("handlebars", (0, express_handlebars_1.engine)({
    defaultLayout: "main",
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
    helpers: {
        subtract: (a, b) => a - b,
        increment: (index) => index + 1,
        formatDate: (date, onlyDate = false) => {
            const momentDate = (0, moment_1.default)(date);
            return onlyDate ? momentDate.format("MMM DD, YYYY") : momentDate.format("MMM DD, h:mm A");
        },
        eq: (a, b) => a === b,
        not: (value) => !value,
        or: (...args) => {
            const options = args.pop();
            return args.some(Boolean);
        },
        and: (...args) => {
            const options = args.pop();
            return args.every(Boolean);
        },
        gt: (a, b) => a > b,
        toFixed: (value, precision) => {
            if (typeof value !== "number")
                return "NaN";
            return value.toFixed(precision);
        },
        formatPercentage: (value, total) => {
            if (total === 0)
                return "0";
            return ((value / total) * 100).toFixed(2);
        },
    },
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Estrategia de autenticación local
passport_1.default.use(new passport_local_1.Strategy(async (username, password, done) => {
    try {
        const user = await User_1.default.findOne({ where: { username } });
        if (!user) {
            return done(null, false, { message: "Usuario no encontrado" });
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return done(null, false, { message: "Contraseña incorrecta" });
        }
        return done(null, user); // Autenticación exitosa
    }
    catch (error) {
        return done(error);
    }
}));
// Serializar y deserializar usuario para sesiones
passport_1.default.serializeUser((user, done) => {
    done(null, user.id); // Guarda el ID del usuario en la sesión
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const userId = typeof id === "string" ? parseInt(id, 10) : id; // Convierte a número si es necesario
        const user = await User_1.default.findByPk(userId);
        done(null, user); // Recupera el usuario desde la base de datos
    }
    catch (error) {
        done(error, null);
    }
});
app.set("view engine", "handlebars");
app.set("views", path_1.default.join(__dirname, "../src/views"));
// Middleware para manejar JSON y archivos estáticos
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, "../src/public")));
// Configurar carpeta estática para imágenes cargadas
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use(express_1.default.urlencoded({ extended: true }));
// Cargar las rutas de administración sin autorización
app.use('/dashboard/admin', adminRoutes_1.default);
// Rutas de Captain
app.use("/dashboard/captain", captainRoutes_1.default);
// Rutas de Referee
app.use("/dashboard/referee", refereeRoutes_1.default);
// Configuración de Multer para la carga de archivos
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ruta donde se guardan las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({ storage });
// Ruta de carga de imágenes
app.post("/upload-player-image", upload.single("image"), (req, res) => {
    if (req.file) {
        res.json({ imageUrl: `/uploads/${req.file.filename}` });
    }
    else {
        res.status(400).json({ error: "No se pudo subir la imagen" });
    }
});
// Ruta de la página principal para cargar ligas, equipos y próximos partidos
app.get("/", async (req, res) => {
    try {
        const leagues = await League_1.default.findAll();
        let leagueId = req.query.leagueId;
        if (!leagueId && leagues.length > 0) {
            leagueId = leagues[0].id ? leagues[0].id.toString() : undefined;
        }
        if (!leagueId) {
            return res.redirect("/login");
        }
        const leagueIdNum = parseInt(leagueId, 10);
        // Obtener todas las jornadas
        const jornadas = await model_1.Jornada.findAll({
            where: { leagueId: leagueIdNum },
            order: [["date", "ASC"]],
        });
        const selectedJornadaId = req.query.jornadaId
            ? parseInt(req.query.jornadaId, 10)
            : jornadas.length > 0
                ? jornadas[jornadas.length - 1].id
                : null;
        // Obtener partidos de la jornada seleccionada
        const matches = await Match_1.default.findAll({
            where: {
                jornadaId: selectedJornadaId || undefined,
            },
            order: [["date", "ASC"]],
            include: [
                { model: Team_1.default, as: "homeTeam", attributes: ["id", "name", "logo"] },
                { model: Team_1.default, as: "awayTeam", attributes: ["id", "name", "logo"] },
                { model: model_1.Jornada, as: "jornada", attributes: ["id", "name"] },
            ],
        });
        // Obtener equipos ordenados
        const teams = await Team_1.default.findAll({
            where: { leagueId: leagueIdNum },
            order: [
                ["points", "DESC"],
                [database_1.default.literal("`Team`.`goalsFor` - `Team`.`goalsAgainst`"), "DESC"],
            ],
        });
        // Mejores goleadores
        const topScorers = await Player_1.default.findAll({
            where: { leagueId: leagueIdNum },
            order: [["goals", "DESC"]],
            limit: 5,
            include: [{ model: Team_1.default, as: "team", attributes: ["name", "logo"] }],
        });
        // Mejores porteros (equipos con menos goles en contra)
        const bestKeepers = await Team_1.default.findAll({
            where: { leagueId: leagueIdNum },
            order: [
                ["goalsAgainst", "ASC"],
                ["matchesPlayed", "DESC"],
            ],
            limit: 5,
            attributes: ["id", "name", "logo", "goalsAgainst", "matchesPlayed"],
        });
        // Estadísticas generales del torneo
        const totalGoals = await Player_1.default.sum("goals", { where: { leagueId: leagueIdNum } });
        const totalTeams = teams.length;
        const totalMatches = await Match_1.default.count({ where: { leagueId: leagueIdNum } });
        const averageGoalsPerMatch = totalMatches > 0 ? totalGoals / totalMatches : 0;
        res.render("home", {
            title: "Football League Management",
            leagues,
            teams,
            matches,
            jornadas,
            topScorers,
            bestKeepers,
            totalGoals,
            totalTeams,
            totalMatches,
            averageGoalsPerMatch,
            selectedLeagueId: leagueIdNum,
            selectedJornadaId,
        });
    }
    catch (error) {
        console.error("Error al obtener datos para la página principal:", error);
        res.status(500).json({ error: "Error al cargar datos", details: error.message });
    }
});
app.get("/teams/:id", async (req, res) => {
    try {
        const teamId = parseInt(req.params.id, 10);
        // Buscar el equipo e incluir a los jugadores
        const team = await Team_1.default.findByPk(teamId, {
            include: [
                {
                    model: Player_1.default,
                    as: "players", // Alias correcto definido en la relación del modelo
                },
            ],
        }); // Usar la interfaz extendida
        if (!team) {
            return res.status(404).send("Equipo no encontrado.");
        }
        res.render("team", {
            title: `Equipo: ${team.name}`,
            team,
            players: team.players || [], // Aseguramos que `players` esté definido
        });
    }
    catch (error) {
        console.error("Error al cargar información del equipo:", error);
        res.status(500).send("Error al cargar la información del equipo.");
    }
});
app.get("/login", (req, res) => {
    const errorMessage = req.query.error ? "Usuario y/o contraseña incorrectos." : null;
    res.render("login", { layout: false, title: "Iniciar Sesión", errorMessage });
});
app.post("/login", passport_1.default.authenticate("local", {
    failureRedirect: "/login?error=true",
    failureFlash: false, // No usamos flash, manejamos errores manualmente
}), (req, res) => {
    const user = req.user;
    switch (user.role) {
        case "admin":
            res.redirect("/dashboard/admin");
            break;
        case "captain":
            res.redirect("/dashboard/captain");
            break;
        case "referee":
            res.redirect("/dashboard/referee");
            break;
        default:
            res.status(403).send("Rol no autorizado");
    }
});
app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).send("Error al cerrar sesión");
        }
        res.redirect("/");
    });
});
app.get('/dashboard/admin', (req, res) => {
    res.redirect('/dashboard/admin/ligas');
});
app.get('/dashboard/captain', (req, res) => {
    res.redirect('/dashboard/captain/jugadores');
});
app.get('/dashboard/referee', (req, res) => {
    res.redirect('/dashboard/referee/partidos');
});
// Opciones SSL para HTTPS
const sslOptions = {
    key: fs_1.default.readFileSync("key.pem"),
    cert: fs_1.default.readFileSync("cert.pem"),
};
// Sincronizar la base de datos y luego iniciar el servidor HTTPS
database_1.default
    .sync()
    .then(() => {
    console.log("Base de datos sincronizada");
    console.log("Asociaciones de Match:", Match_1.default.associations); // Verificar aquí también
    console.log("Asociacones de Jornada: ", model_1.Jornada.associations);
    console.log("Asociacones de Team: ", Team_1.default.associations);
    console.log("Asociacones de Player: ", Player_1.default.associations);
    console.log("Asociacones de League: ", League_1.default.associations);
    https_1.default.createServer(sslOptions, app).listen(PORT, () => {
        console.log(`Server is running on https://localhost:${PORT}`);
    });
})
    .catch((error) => {
    console.error("Error al conectar a la base de datos:", error);
});
