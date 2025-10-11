import { Router } from 'express';
import { createUser,getUsers,loginUser,logoutUser } from '../controllers/userController.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = Router();

// Ruta para crear usuario
router.post('/newuser', createUser);
router.get('/listusers', verifyToken, requireRole("admin"), getUsers);
router.post('/login', loginUser);
router.post('/logout', logoutUser); // ruta para logout

export default router;
