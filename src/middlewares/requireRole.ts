import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserPayload } from '../types/index.ts';

/**
 * Middleware para restringir el acceso a ciertos roles.
 * @param rolesPermitidos - Lista de roles que tienen permiso para acceder a la ruta.
 */
export const requireRole = (...rolesPermitidos: UserPayload['role'][]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }

    next();
  };
};