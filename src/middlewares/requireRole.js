export const requireRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }

    next();
  };
};
