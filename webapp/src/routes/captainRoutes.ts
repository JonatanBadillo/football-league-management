import express from "express";
import multer from "multer";
import Player from "../model/Player";
import Team from "../model/Team";
import { isAuthenticated, hasRole } from "../middlewares/authMiddleware";

const router = express.Router();

// Configuración de Multer para la carga de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Obtener jugadores del equipo del capitán
router.get("/jugadores", async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).send("Usuario no autenticado.");
    }

    // Buscar el equipo del capitán
    const team = await Team.findOne({
      where: { captainId: user.id },
      include: Player, // Incluir jugadores del equipo
    }) as Team & { id: number; Players: Player[] }; // Aseguramos los tipos manualmente

    if (!team) {
      return res.status(403).send("No tienes un equipo asignado.");
    }

    res.render("captain", {
      team,
      players: team.Players || [],
      layout: false,
    });
  } catch (error) {
    console.error("Error al obtener jugadores del equipo:", error);
    res.status(500).send("Error al cargar la página.");
  }
});

// Ruta para agregar un nuevo jugador
router.post("/jugadores", upload.single("image"), async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).send("Usuario no autenticado.");
    }

    const { name, position } = req.body;

    // Buscar el equipo del capitán
    const team = await Team.findOne({ where: { captainId: user.id } }) as Team & { id: number };

    if (!team) {
      return res.status(403).send("No tienes un equipo asignado.");
    }

    // Contar jugadores del equipo
    const playerCount = await Player.count({ where: { teamId: team.id } });
    if (playerCount >= 15) {
      return res.status(400).send("No puedes agregar más de 15 jugadores.");
    }

    await Player.create({
      name,
      position,
      teamId: team.id,
      image: req.file ? `/uploads/${req.file.filename}` : "/images/player_noimage.png",
    });

    res.redirect("/dashboard/captain/jugadores");
  } catch (error) {
    console.error("Error al agregar jugador:", error);
    res.status(500).send("Error al agregar jugador.");
  }
});

// Ruta para editar un jugador
router.post("/jugadores/:id/editar", upload.single("image"), async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).send("Usuario no autenticado.");
    }

    const { id } = req.params;
    const { name, position } = req.body;

    // Verificar si el jugador pertenece al equipo del capitán
    const player = await Player.findOne({ where: { id } }) as Player & { teamId: number };

    if (!player) {
      return res.status(404).send("Jugador no encontrado.");
    }

    const team = await Team.findOne({ where: { captainId: user.id } }) as Team & { id: number };

    if (!team || player.teamId !== team.id) {
      return res.status(403).send("No puedes editar este jugador.");
    }

    // Actualizar datos del jugador
    const updatedData: any = { name, position };
    if (req.file) {
      updatedData.image = `/uploads/${req.file.filename}`;
    }

    await Player.update(updatedData, { where: { id } });

    res.redirect("/dashboard/captain/jugadores");
  } catch (error) {
    console.error("Error al editar jugador:", error);
    res.status(500).send("Error al editar jugador.");
  }
});

// Ruta para eliminar un jugador
router.post("/jugadores/:id/eliminar", async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).send("Usuario no autenticado.");
    }

    const { id } = req.params;

    // Verificar si el jugador pertenece al equipo del capitán
    const player = await Player.findOne({ where: { id } }) as Player & { teamId: number };

    if (!player) {
      return res.status(404).send("Jugador no encontrado.");
    }

    const team = await Team.findOne({ where: { captainId: user.id } }) as Team & { id: number };

    if (!team || player.teamId !== team.id) {
      return res.status(403).send("No puedes eliminar este jugador.");
    }

    await Player.destroy({ where: { id } });

    res.redirect("/dashboard/captain/jugadores");
  } catch (error) {
    console.error("Error al eliminar jugador:", error);
    res.status(500).send("Error al eliminar jugador.");
  }
});

export default router;
