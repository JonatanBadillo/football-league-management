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
import session from "express-session";
import SequelizeStoreConstructor from "connect-session-sequelize";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import captainRoutes from "./routes/captainRoutes";
import refereeRoutes from "./routes/refereeRoutes";



const SequelizeStore = SequelizeStoreConstructor(session.Store);

const sessionStore = new SequelizeStore({
  db: sequelize, // Base de datos configurada en tu archivo `database.ts`
});
const app = express();
const PORT = 3000;

app.use(
  session({
    secret: "mySecretKey", // Cambia esto por un secreto más seguro en producción
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 60 * 60 * 1000, // 1 hora
    },
  })
);

sessionStore.sync(); // Sincroniza la tabla de sesiones en la base de datos



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
      gt: (a: number, b: number) => a > b,
      toFixed: (value: number, precision: number) => {
        if (typeof value !== "number") return "NaN";
        return value.toFixed(precision);
      },
      formatPercentage: (value: number, total: number) => {
        if (total === 0) return "0";
        return ((value / total) * 100).toFixed(2);
      },
    },
  })
);


app.use(passport.initialize());
app.use(passport.session());

// Estrategia de autenticación local
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ where: { username } });

      if (!user) {
        return done(null, false, { message: "Usuario no encontrado" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return done(null, false, { message: "Contraseña incorrecta" });
      }

      return done(null, user); // Autenticación exitosa
    } catch (error) {
      return done(error);
    }
  })
);

// Serializar y deserializar usuario para sesiones
passport.serializeUser((user: any, done) => {
  done(null, user.id); // Guarda el ID del usuario en la sesión
});

passport.deserializeUser(async (id: number | string, done) => {
  try {
    const userId = typeof id === "string" ? parseInt(id, 10) : id; // Convierte a número si es necesario
    const user = await User.findByPk(userId);
    done(null, user); // Recupera el usuario desde la base de datos
  } catch (error) {
    done(error, null);
  }
});


app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "../src/views"));

// Middleware para manejar JSON y archivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, "../src/public")));
// Configurar carpeta estática para imágenes cargadas
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));




app.use(express.urlencoded({ extended: true }));

// Cargar las rutas de administración sin autorización
app.use('/dashboard/admin', adminRoutes);
// Rutas de Captain
app.use("/dashboard/captain", captainRoutes);
// Rutas de Referee
app.use("/dashboard/referee", refereeRoutes);


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


interface TeamWithPlayers {
  id: number;
  name: string;
  logo: string; // Otras propiedades 
  players: Player[]; // Relación con jugadores
}

app.get("/teams/:id", async (req, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);

    // Buscar el equipo e incluir a los jugadores
    const team = await Team.findByPk(teamId, {
      include: [
        {
          model: Player,
          as: "players", // Alias correcto definido en la relación del modelo
        },
      ],
    }) as unknown as TeamWithPlayers; // Usar la interfaz extendida

    if (!team) {
      return res.status(404).send("Equipo no encontrado.");
    }

    res.render("team", {
      title: `Equipo: ${team.name}`, // Acceso a `name`
      team,
      players: team.players || [], // Aseguramos que `players` esté definido
    });
  } catch (error) {
    console.error("Error al cargar información del equipo:", error);
    res.status(500).send("Error al cargar la información del equipo.");
  }
});




app.get("/login", (req, res) => {
  const errorMessage = req.query.error ? "Usuario y/o contraseña incorrectos." : null;
  res.render("login", { layout: false, title: "Iniciar Sesión", errorMessage });
});




app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login?error=true", // Redirige con un parámetro de error
    failureFlash: false, // No usamos flash, manejamos errores manualmente
  }),
  (req, res) => {
    const user = req.user as User;
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
  }
);



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
