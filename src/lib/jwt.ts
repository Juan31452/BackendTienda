import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserPayload } from '../types/index.ts';

dotenv.config();

export async function MyToken(payload: UserPayload): Promise<string> {
  const SECRET = process.env.TOKEN_SECRET;

  if (!SECRET) {
    throw new Error('TOKEN_SECRET is not defined in environment variables');
  }

  return new Promise((resolve, reject) => {
    // Firmamos el token usando la interfaz UserPayload para el contenido
    jwt.sign(payload, SECRET, { expiresIn: '15d' }, (err, token) => {
      if (err || !token) {
        console.error('Error al firmar el token:', err);
        reject(err || new Error('Failed to generate token'));
      } else {
        resolve(token);
      }
    });
  });
}