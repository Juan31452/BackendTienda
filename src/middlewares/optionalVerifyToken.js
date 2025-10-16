import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar un token JWT de forma opcional.
 * Si el token existe y es válido, añade `req.user` a la solicitud.
 * Si el token no existe o no es válido, simplemente pasa a la siguiente función sin error.
 */
export const optionalVerifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (!err) {
          req.user = user; // Añade el usuario a la solicitud si el token es válido
        }
        // Si hay un error (token inválido/expirado), no hacemos nada y continuamos.
      });
    }
  }
  next(); // Siempre llama a next() para continuar con la siguiente función de middleware
};
