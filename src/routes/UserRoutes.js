import { Router } from 'express';
import { createUser,getUsers } from '../controllers/userController.js';

const router = Router();

// Ruta para crear usuario
router.post('/newuser', createUser);
router.get('/listusers', getUsers);

export default router;
