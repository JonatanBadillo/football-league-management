import express from "express";
import { isAuthenticated, hasRole } from "../middlewares/authMiddleware";

const router = express.Router();

// Proteger rutas de capitán
router.use(isAuthenticated);
router.use(hasRole("captain"));

// Vista principal del capitán
router.get("/", (req, res) => {
  res.render("captain", { title: "Dashboard Capitán", section: "equipos" ,layout: false});
});



export default router;
