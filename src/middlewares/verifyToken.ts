import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AuthenticatedRequest, UserPayload } from '../types/index.ts';

dotenv.config();

export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];

    // El token debe venir en formato: "Bearer <token>"
    if (!authHeader) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid token format." });
    }

    const SECRET = process.env.TOKEN_SECRET;
    if (!SECRET) {
      throw new Error('TOKEN_SECRET is not defined in environment variables.');
    }

    jwt.verify(token, SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token." });
      }
      req.user = decoded as UserPayload; // Guardamos los datos del usuario en req.user
      next();
    });
  } catch (error: any) {
    res.status(500).json({ message: "Token verification failed", error: error.message });
  }
};