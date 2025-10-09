export const requireRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    // CORRECCIÓN: Usar 'role' (inglés) para ser consistente con el resto de la aplicación.
    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }

    next();
  };
};