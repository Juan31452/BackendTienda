import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware para verificar un token JWT si está presente.
 * Si no hay token, simplemente pasa a la siguiente función sin error.
 * Si hay un token y es válido, añade los datos del usuario a `req.user`.
 * Si hay un token y NO es válido, devuelve un error.
 */
export const optionalVerifyToken = (req, res, next) => {
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

    jwt.verify(token, SECRET, (err, decoded) => {
      // Si el token es inválido o ha expirado, SÍ devolvemos un error.
      // Esto previene que un token "malo" se ignore.
      if (err) {
        return res.status(403).json({ message: "Token provided is invalid or has expired." });
      }

      // Si el token es válido, adjuntamos los datos del usuario a la petición.
      req.user = decoded;
      next();
    });

  } catch (error) {
    // En caso de un error inesperado en el middleware, lo registramos y continuamos.
    console.error("Error in optionalVerifyToken middleware:", error);
    next();
  }
};
