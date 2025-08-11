import { Router } from 'express';
import { createUser,getUsers,loginUser } from '../controllers/userController.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

// Ruta para crear usuario
router.post('/newuser', createUser);
router.get('/listusers', verifyToken, getUsers);
router.post('/login', loginUser);

export default router;
