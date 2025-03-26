import express from 'express';
import { 
  obtenerProductos, 
  obtenerProductoPorId,
  obtenerProductosPorCategoria, 
  crearProducto, 
  actualizarProducto, 
  eliminarProducto 
} from '../controllers/Controller.Products.js';

const router = express.Router();

// Definir las rutas para productos
router.get('/', obtenerProductos);         // Obtener todos los productos
router.get('/:id', obtenerProductoPorId);  // Obtener un producto por ID
router.get('/categoria/:categoria', obtenerProductosPorCategoria); // Listar por categoría
router.post('/', crearProducto);           // Crear un nuevo producto
router.put('/:id', actualizarProducto);    // Actualizar un producto por ID
router.delete('/:id', eliminarProducto);   // Eliminar un producto por ID

export default router;
