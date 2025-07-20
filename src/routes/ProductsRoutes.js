import express from 'express';
import { 
  obtenerProductos, 
  obtenerProductoPorId,
  crearProducto,
  crearProductos,
  actualizarProducto, 
  eliminarProducto,
  obtenerEstadisticasProductos 
} from '../controllers/Controller.Products.js';

const router = express.Router();

// Definir las rutas para productos
router.get('/', obtenerProductos);         // Obtener todos los productos
router.get('/estadisticas', obtenerEstadisticasProductos); // Obtener estadísticas de productos
router.get('/:id', obtenerProductoPorId);  // Obtener un producto por ID
router.post('/', crearProducto);           // Crear un nuevo producto
router.post('/crear-multiples', crearProductos);
router.put('/:id', actualizarProducto);    // Actualizar un producto por ID
router.delete('/:id', eliminarProducto);   // Eliminar un producto por ID

// Exportar el router para usarlo en otras partes de la aplicación
export default router;
