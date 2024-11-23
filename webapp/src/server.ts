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

// Configuración de Handlebars con opción para acceder a propiedades
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
      not: (value: any) => !value, // Helper para negación lógica
      or: (...args: any[]) => {
        const options = args.pop(); // Quita el objeto de opciones de Handlebars
        return args.some(Boolean); // Retorna true si alguno de los valores es verdadero
      },
      and: (...args: any[]) => {
        const options = args.pop(); // Quita el objeto de opciones de Handlebars
        return args.every(Boolean); // Retorna true si todos los valores son verdaderos
      },
      toFixed: (value: number, precision: number) => {
        if (typeof value !== "number") return "NaN"; // Valida que el valor sea un número
        return value.toFixed(precision); // Aplica `toFixed`
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
    // Especifica el tipo explícitamente
    const leagues: League[] = await League.findAll();
    let leagueId = req.query.leagueId as string | undefined;

    // Verificar que existan ligas en la base de datos
    if (!leagueId && leagues.length > 0) {
      leagueId = leagues[0].id ? leagues[0].id.toString() : undefined; // Verificar que `id` esté definido
    }

    if (!leagueId) {
      return res.redirect("/login");
    }

    const leagueIdNum = parseInt(leagueId, 10);

    const teams = await Team.findAll({
      where: { leagueId: leagueIdNum },
      order: [
        ["points", "DESC"],
        [sequelize.literal("goalsFor - goalsAgainst"), "DESC"],
      ],
    });

    const topScorers = await Player.findAll({
      where: { leagueId: leagueIdNum },
      order: [
        ["goals", "DESC"],
        [sequelize.literal("player.matchesPlayed"), "ASC"],
      ],
      limit: 5,
      include: [{ model: Team, as: "team", required: true }],
    });

    const bestKeepers = await Team.findAll({
      where: { leagueId: leagueIdNum },
      order: [
        ["goalsAgainst", "ASC"],
        [sequelize.literal("matchesPlayed"), "DESC"],
      ],
      limit: 5,
    });

    const matches = await Match.findAll({
      where: { leagueId: leagueIdNum },
      order: [["date", "ASC"]],
      include: [
        { model: Team, as: "homeTeam" }, // Alias configurado en las asociaciones
        { model: Team, as: "awayTeam" }, // Alias configurado en las asociaciones
        { model: Jornada, as: "jornada" } // Alias configurado en las asociaciones
      ],
    });
    
    

    const totalGoals = await Player.sum("goals", {
      where: { leagueId: leagueIdNum },
    });
    const totalTeams = teams.length;
    const totalMatches = matches.length;
    const averageGoalsPerMatch =
      totalMatches > 0 ? totalGoals / totalMatches : 0;

    res.render("home", {
      title: "Football League Management",
      leagues,
      teams,
      matches,
      topScorers,
      bestKeepers,
      totalGoals,
      totalTeams,
      totalMatches,
      averageGoalsPerMatch,
      selectedLeagueId: leagueIdNum,
    });
  } catch (error) {
    console.error("Error al obtener datos para la página principal:", error);
    res.status(500).json({ error: "Error al cargar datos", details: (error as Error).message });
    

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


app.get("/dashboard/admin/equipos", async (req, res) => {
  try {
    const leagues: League[] = await League.findAll();
    let leagueId = req.query.leagueId as string | undefined;

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
    const teams = await Team.findAll({
      where: { leagueId: leagueIdNum },
      include: [
        {
          model: User,
          as: 'captain', // Usa el alias definido en la relación
          attributes: ['username'], // Solo trae el nombre de usuario
        },
      ],
      order: [["points", "DESC"]],
    });

    res.render("admin", {
      title: "Administrador - Equipos",
      leagues,teams,
      section: 'equipos',
      selectedLeagueId: leagueIdNum,
      layout: false,
    });
  } catch (error) {
    console.error("Error al obtener datos para la página principal:", error);
    res.status(500).json({ error: "Error al cargar datos" });
  }
});


app.get("/dashboard/admin/jugadores", async (req, res) => {
  try {
      const leagues: League[] = await League.findAll();
      let leagueId = req.query.leagueId as string | undefined;

      if (!leagueId && leagues.length > 0) {
          leagueId = leagues[0].id ? leagues[0].id.toString() : undefined;
      }




    // Verificar que existan ligas en la base de datos
    if (!leagueId && leagues.length > 0) {
      leagueId = leagues[0].id ? leagues[0].id.toString() : undefined; // Verificar que `id` esté definido
    }

    if (!leagueId) {
      return res
        .status(404)
        .json({ error: "No se encontraron ligas en la base de datos." });
    }

    const leagueIdNum = parseInt(leagueId, 10);

      // Filtrar los equipos por el ID de la liga seleccionada
      const teams = await Team.findAll({
          where: { leagueId: leagueIdNum },
          attributes: ["id", "name"],
          order: [["name", "ASC"]]
      });

      // Obtener los jugadores de la liga seleccionada
      const players = await Player.findAll({
          where: { leagueId: leagueIdNum },
          order: [["name", "ASC"]],
          include: [{ model: Team, attributes: ["id", "name","logo"] }],
      });

      res.render("admin", {
          title: "Administrador - Jugadores",
          leagues,
          teams, // Solo equipos de la liga seleccionada
          players,
          section: 'jugadores',
          selectedLeagueId: leagueIdNum,
          layout: false,
      });
  } catch (error) {
      console.error("Error al obtener datos de jugadores:", error);
      res.status(500).json({ error: "Error al cargar datos de jugadores" });
  }
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
