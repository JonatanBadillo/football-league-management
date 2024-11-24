import { Request, Response, NextFunction } from "express";

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login"); // Redirige si no está autenticado
};

export const hasRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user?.role === role) {
      return next();
    }
    res.status(403).json({ error: "No tienes permisos para acceder a esta ruta" });
  };
};
