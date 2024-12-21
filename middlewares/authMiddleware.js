"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRole = exports.isAuthenticated = void 0;
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login"); // Redirige si no está autenticado
};
exports.isAuthenticated = isAuthenticated;
const hasRole = (role) => {
    return (req, res, next) => {
        if (req.isAuthenticated() && req.user?.role === role) {
            return next();
        }
        res.status(403).json({ error: "No tienes permisos para acceder a esta ruta" });
    };
};
exports.hasRole = hasRole;
