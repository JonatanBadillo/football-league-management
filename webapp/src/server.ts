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
      formatDate: (date: moment.MomentInput) =>
        moment(date).format("MMM DD, h:mm A"), // Helper para formatear fechas
    },
  })
);

app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "../src/views"));

// Middleware para manejar JSON y archivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, "../src/public")));

// Cargar las rutas de administración sin autorización
app.use("/admin", adminRoutes);

// Configuración de Multer para la carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
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
    const teams = await Team.findAll({
      order: [
        ["points", "DESC"],
        [sequelize.literal('goalsFor - goalsAgainst'), 'DESC']
      ]
    });

    const topScorers = await Player.findAll({
      order: [
        ["goals", "DESC"],
        [sequelize.literal('player.matchesPlayed'), 'ASC']
      ],
      limit: 5, // Limitar a los 5 primeros jugadores
      include: [
        {
          model: Team,
          as: "team",
          required: true,
        },
      ],
    });

    const bestKeepers = await Team.findAll({
      order: [
        ["goalsAgainst", "ASC"],
        [sequelize.literal('matchesPlayed'), 'DESC']
      ],
      limit: 5, // Limitar a los 5 primeros equipos
    });

    const matches = await Match.findAll({
      order: [["date", "ASC"]],
      include: [
        { model: Team, as: "homeTeam" },
        { model: Team, as: "awayTeam" },
      ],
    });

    res.render("home", {
      title: "Football League Management",
      leagues,
      teams,
      matches,
      topScorers,
      bestKeepers,
    });
  } catch (error) {
    console.error("Error al obtener datos para la página principal:", error);
    res.status(500).json({ error: "Error al cargar datos" });
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
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`Server is running on https://localhost:${PORT}`);
    });
  })
  .catch((error: any) => {
    console.error("Error al conectar a la base de datos:", error);
  });
