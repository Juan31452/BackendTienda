import { Router } from 'express';
import { createUser, getUsers, loginUser, logoutUser } from '../controllers/userController.ts';
import { verifyToken } from '../middlewares/verifyToken.ts';
import { requireRole } from '../middlewares/requireRole.ts';

const router: Router = Router();

// Rutas de usuario
router.post('/newuser', createUser);
router.get('/listusers', verifyToken, requireRole("admin"), getUsers);
router.post('/login', loginUser);
router.post('/logout', logoutUser); // ruta para logout

export default router;