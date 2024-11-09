import { Request, Response, NextFunction } from 'express';

// Define el tipo AuthenticatedRequest para incluir la propiedad 'user'
interface AuthenticatedRequest extends Request {
  user?: {
    role: string;
  };
}

export const authorize = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ error: 'No tienes permisos para acceder a esta ruta' });
    }
  };
};
