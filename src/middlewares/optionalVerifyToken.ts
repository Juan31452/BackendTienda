import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AuthenticatedRequest, UserPayload } from '../types/index.ts';

dotenv.config();

/**
 * Middleware para verificar un token JWT si está presente.
 * Si no hay token, simplemente pasa a la siguiente función sin error.
 * Si hay un token y es válido, añade los datos del usuario a `req.user`.
 * Si hay un token y NO es válido, devuelve un error.
 */
export const optionalVerifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];

    // Si no hay cabecera de autorización, el usuario es un invitado. Continuamos.
    if (!authHeader) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    // Si la cabecera existe pero no tiene el formato "Bearer <token>", continuamos como invitado.
    if (!token) {
      return next();
    }

    const SECRET = process.env.TOKEN_SECRET;
    if (!SECRET) {
      throw new Error('TOKEN_SECRET is not defined in environment variables.');
    }

    jwt.verify(token, SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Token provided is invalid or has expired." });
      }

      req.user = decoded as UserPayload;
      next();
    });
  } catch (error) {
    console.error("Error in optionalVerifyToken middleware:", error);
    next();
  }
};