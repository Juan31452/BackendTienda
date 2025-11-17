import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export async function MyToken(payload) {
  const SECRET = process.env.TOKEN_SECRET;

  return new Promise((resolve, reject) => {
    jwt.sign(payload, SECRET, { expiresIn: '15d' }, (err, token) => {
      if (err) {
        console.error('Error al firmar el token:', err);
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
}