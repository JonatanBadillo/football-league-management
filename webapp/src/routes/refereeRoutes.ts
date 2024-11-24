import express from "express";
import { isAuthenticated, hasRole } from "../middlewares/authMiddleware";

const router = express.Router();

// Proteger rutas de árbitro
router.use(isAuthenticated);
router.use(hasRole("referee"));

// Vista principal del árbitro
router.get("/", (req, res) => {
  res.render("referee", { title: "Dashboard Árbitro", section: "partidos", layout :false });
});


export default router;
