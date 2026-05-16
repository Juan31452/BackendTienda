import express, { Router } from 'express';
import {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from '../controllers/Controller.Cart.ts';
import { verifyToken } from '../middlewares/verifyToken.ts';

const router: Router = express.Router();

// Todas las rutas del carrito requieren autenticación
router.get('/', verifyToken, getCart);
router.post('/', verifyToken, addItemToCart);
router.put('/:productId', verifyToken, updateCartItemQuantity); // Para cambiar la cantidad de un item específico
router.delete('/:productId', verifyToken, removeCartItem); // Para eliminar un item específico
router.delete('/', verifyToken, clearCart); // Para vaciar todo el carrito

export default router;
