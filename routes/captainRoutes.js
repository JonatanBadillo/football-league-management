"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const Player_1 = __importDefault(require("../model/Player"));
const Team_1 = __importDefault(require("../model/Team"));
const router = express_1.default.Router();
// Configuración de Multer para la carga de imágenes
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({ storage });
// Obtener jugadores del equipo del capitán
router.get("/jugadores", async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).send("Usuario no autenticado.");
        }
        // Buscar el equipo del capitán
        const team = await Team_1.default.findOne({
            where: { captainId: user.id },
            include: [
                {
                    model: Player_1.default,
                    as: "players", // Alias correcto definido en la relación por defecto
                },
            ],
        }); // Aseguramos los tipos manualmente
        if (!team) {
            return res.status(403).send("No tienes un equipo asignado.");
        }
        res.render("captain", {
            team,
            players: team.players || [],
            layout: false,
        });
    }
    catch (error) {
        console.error("Error al obtener jugadores del equipo:", error);
        res.status(500).send("Error al cargar la página.");
    }
});
// Ruta para agregar un nuevo jugador
router.post("/jugadores", upload.single("image"), async (req, res) => {
    try {
        const user = req.user; // Aseguramos el tipo de `user`
        if (!user) {
            return res.status(401).send("Usuario no autenticado.");
        }
        const { name, position } = req.body;
        // Buscar el equipo del capitán y asociarlo con la liga
        const team = await Team_1.default.findOne({
            where: { captainId: user.id },
            include: [{ association: "league", attributes: ["id"] }], // Usar el alias correcto de la relación
        }); // Ajustamos el tipo para incluir `id` y `league`
        if (!team) {
            return res.status(403).send("No tienes un equipo asignado.");
        }
        // Verificar el límite de jugadores
        const playerCount = await Player_1.default.count({ where: { teamId: team.id } });
        if (playerCount >= 15) {
            return res.status(400).send("No puedes agregar más de 15 jugadores.");
        }
        // Crear el jugador con el leagueId obtenido del equipo
        await Player_1.default.create({
            name,
            position,
            teamId: team.id,
            leagueId: team.league.id,
            image: req.file ? `/uploads/${req.file.filename}` : "/images/player_noimage.png",
        });
        res.redirect("/dashboard/captain/jugadores");
    }
    catch (error) {
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
        const player = await Player_1.default.findOne({ where: { id } });
        if (!player) {
            return res.status(404).send("Jugador no encontrado.");
        }
        const team = await Team_1.default.findOne({ where: { captainId: user.id } });
        if (!team || player.teamId !== team.id) {
            return res.status(403).send("No puedes editar este jugador.");
        }
        // Actualizar datos del jugador
        const updatedData = { name, position };
        if (req.file) {
            updatedData.image = `/uploads/${req.file.filename}`;
        }
        await Player_1.default.update(updatedData, { where: { id } });
        res.redirect("/dashboard/captain/jugadores");
    }
    catch (error) {
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
        const player = await Player_1.default.findOne({ where: { id } });
        if (!player) {
            return res.status(404).send("Jugador no encontrado.");
        }
        const team = await Team_1.default.findOne({ where: { captainId: user.id } });
        if (!team || player.teamId !== team.id) {
            return res.status(403).send("No puedes eliminar este jugador.");
        }
        await Player_1.default.destroy({ where: { id } });
        res.redirect("/dashboard/captain/jugadores");
    }
    catch (error) {
        console.error("Error al eliminar jugador:", error);
        res.status(500).send("Error al eliminar jugador.");
    }
});
exports.default = router;
