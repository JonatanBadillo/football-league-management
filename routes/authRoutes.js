"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = __importDefault(require("../model/User"));
const router = (0, express_1.Router)();
// Página de login
router.get("/login", (req, res) => {
    res.render("login", { title: "Login", layout: "main" });
});
// Manejo de login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User_1.default.findOne({ where: { username } });
        if (!user || !(await bcrypt_1.default.compare(password, user.password))) {
            return res.render("login", {
                title: "Login",
                layout: "main",
                errorMessage: "Usuario o contraseña incorrectos.",
            });
        }
        // Establece el usuario en la sesión
        req.session.user = { id: user.id, role: user.role };
        // Redirige según el rol
        if (user.role === "admin") {
            return res.redirect("/dashboard/admin");
        }
        else if (user.role === "captain") {
            return res.redirect("/dashboard/captain");
        }
        else if (user.role === "referee") {
            return res.redirect("/dashboard/referee");
        }
    }
    catch (error) {
        console.error("Error en el login:", error);
        res.status(500).render("login", {
            title: "Login",
            layout: "main",
            errorMessage: "Error interno del servidor.",
        });
    }
});
// Cerrar sesión
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
        }
        res.redirect("/login");
    });
});
exports.default = router;
