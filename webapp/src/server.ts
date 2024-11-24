import moment from "moment";
import express from "express";
import fs from "fs";
import https from "https";
import path from "path";
import { engine } from "express-handlebars";
import adminRoutes from "./routes/adminRoutes";
import multer from "multer";
import sequelize from "./config/database";
import League from "./model/League";
import Team from "./model/Team";
import Match from "./model/Match";
import Player from "./model/Player";
import User from "./model/User";
import bcrypt from "bcrypt";
import { Jornada } from "./model";


const app = express();
const PORT = 3000;

app.engine(
  "handlebars",
  engine({
    defaultLayout: "main",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
    helpers: {
      subtract: (a: number, b: number) => a - b,
      increment: (index: number) => index + 1,
      formatDate: (date: moment.MomentInput, onlyDate = false) => {
        const momentDate = moment(date);
        return onlyDate ? momentDate.format("MMM DD, YYYY") : momentDate.format("MMM DD, h:mm A");
      },
      eq: (a: any, b: any) => a === b,
      not: (value: any) => !value,
      or: (...args: any[]) => {
        const options = args.pop();
        return args.some(Boolean);
      },
      and: (...args: any[]) => {
        const options = args.pop();
        return args.every(Boolean);
      },
      gt: (a: number, b: number) => a > b, // Nuevo helper "gt"
      toFixed: (value: number, precision: number) => {
        if (typeof value !== "number") return "NaN";
        return value.toFixed(precision);
      },
    },
  })
);





app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "../src/views"));

// Middleware para manejar JSON y archivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, "../src/public")));
// Configurar carpeta estática para imágenes cargadas
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


//
app.use(express.urlencoded({ extended: true }));

// Cargar las rutas de administración sin autorización
// app.use("/admin", adminRoutes);
app.use('/dashboard/admin', adminRoutes);


// Configuración de Multer para la carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ruta donde se guardan las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});


const upload = multer({ storage });

// Ruta de carga de imágenes
app.post("/upload-player-image", upload.single("image"), (req, res) => {
  if (req.file) {
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  } else {
    res.status(400).json({ error: "No se pudo subir la imagen" });
  }
});

// Ruta de la página principal para cargar ligas, equipos y próximos partidos
app.get("/", async (req, res) => {
  try {
    const leagues = await League.findAll();
    let leagueId = req.query.leagueId as string | undefined;

    if (!leagueId && leagues.length > 0) {
      leagueId = leagues[0].id ? leagues[0].id.toString() : undefined;
    }

    if (!leagueId) {
      return res.redirect("/login");
    }

    const leagueIdNum = parseInt(leagueId, 10);

    // Obtener todas las jornadas
    const jornadas = await Jornada.findAll({
      where: { leagueId: leagueIdNum },
      order: [["date", "ASC"]],
    });

    const selectedJornadaId = req.query.jornadaId
      ? parseInt(req.query.jornadaId as string, 10)
      : jornadas.length > 0
      ? jornadas[jornadas.length - 1].id
      : null;

    // Obtener partidos de la jornada seleccionada
    const matches = await Match.findAll({
      where: {
        jornadaId: selectedJornadaId || undefined,
      },
      order: [["date", "ASC"]],
      include: [
        { model: Team, as: "homeTeam", attributes: ["id", "name", "logo"] },
        { model: Team, as: "awayTeam", attributes: ["id", "name", "logo"] },
        { model: Jornada, as: "jornada", attributes: ["id", "name"] },
      ],
    });

    // Obtener equipos ordenados
    const teams = await Team.findAll({
      where: { leagueId: leagueIdNum },
      order: [
        ["points", "DESC"],
        [sequelize.literal("`Team`.`goalsFor` - `Team`.`goalsAgainst`"), "DESC"],
      ],
    });

    // Mejores goleadores
    const topScorers = await Player.findAll({
      where: { leagueId: leagueIdNum },
      order: [["goals", "DESC"]],
      limit: 5,
      include: [{ model: Team, as: "team", attributes: ["name", "logo"] }],
    });

    // Mejores porteros (equipos con menos goles en contra)
    const bestKeepers = await Team.findAll({
      where: { leagueId: leagueIdNum },
      order: [
        ["goalsAgainst", "ASC"],
        ["matchesPlayed", "DESC"],
      ],
      limit: 5,
      attributes: ["id", "name", "logo", "goalsAgainst", "matchesPlayed"],
    });

    // Estadísticas generales del torneo
    const totalGoals = await Player.sum("goals", { where: { leagueId: leagueIdNum } });
    const totalTeams = teams.length;
    const totalMatches = await Match.count({ where: { leagueId: leagueIdNum } });
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
  } catch (error) {
    console.error("Error al obtener datos para la página principal:", error);
    res.status(500).json({ error: "Error al cargar datos", details: (error as any).message });
  }
});




app.get("/login", (req, res) => {
  res.render("login", { layout: false, title: "Iniciar Sesión" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Imprime req.body para verificar el contenido
  console.log("Datos recibidos en el login:", req.body);

  try {
    const user = await User.findOne({ where: { username } });

    // Verifica si el usuario existe
    if (!user) {
      return res.status(401).render("login", {
        layout: false,
        title: "Iniciar Sesión",
        errorMessage: "Usuario y/o contraseña incorrecta",
      });
    }

    // Verifica la contraseña usando bcrypt.compare
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).render("login", {
        layout: false,
        title: "Iniciar Sesión",
        errorMessage: "Usuario y/o contraseña incorrecta",
      });
    }

    // Redirige según el rol del usuario
    if (user.role === "admin") {
      return res.redirect("/dashboard/admin");
    } else if (user.role === "captain") {
      return res.redirect("/dashboard/captain");
    } else if (user.role === "referee") {
      return res.redirect("/dashboard/referee");
    } else {
      return res.status(403).send("Rol no autorizado");
    }
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);
    res.status(500).send("Error en el servidor");
  }
});


app.get('/dashboard/admin', (req, res) => {
  res.redirect('/dashboard/admin/ligas');
});






// Opciones SSL para HTTPS
const sslOptions = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

// Sincronizar la base de datos y luego iniciar el servidor HTTPS
sequelize
  .sync()
  .then(() => {
    console.log("Base de datos sincronizada");
    console.log("Asociaciones de Match:", Match.associations); // Verificar aquí también
    console.log("Asociacones de Jornada: ",Jornada.associations);
    console.log("Asociacones de Team: ",Team.associations);
    console.log("Asociacones de Player: ",Player.associations);
    console.log("Asociacones de League: ",League.associations);

    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`Server is running on https://localhost:${PORT}`);
    });
  })
  .catch((error: any) => {
    console.error("Error al conectar a la base de datos:", error);
  });
