import express from 'express';
import { 
  obtenerProductos, 
  obtenerProductoPorId,
  crearProducto,
  crearProductos,
  actualizarProducto, 
  eliminarProducto,
  obtenerEstadisticasProductos,
  getTotalMes 
} from '../controllers/Controller.Products.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = express.Router();

// Definir las rutas para productos

// --- Rutas Públicas (Cualquiera puede acceder) ---
router.get('/', obtenerProductos); // Obtener todos los productos (la lógica de precios ya está protegida en el controlador)

// --- Rutas Protegidas (Requieren token y rol específico) ---

// Solo 'admin'  pueden crear, actualizar o eliminar productos.
router.post('/', verifyToken, requireRole('admin'), crearProducto);
router.post('/crear-multiples', verifyToken, requireRole('admin'), crearProductos);

// Rutas para estadísticas y totales, podrían ser solo para roles autorizados.
router.get('/estadisticas', verifyToken, requireRole('admin', 'vendedor'), obtenerEstadisticasProductos);
router.get('/total-mes/:mes/:año/:estado', verifyToken, requireRole('admin', 'vendedor'), getTotalMes);

// --- Rutas con parámetros (deben ir al final para no interceptar otras) ---
router.get('/:id', obtenerProductoPorId);  // Obtener un producto por ID
router.put('/:id', verifyToken, requireRole('admin'), actualizarProducto);
router.delete('/:id', verifyToken, requireRole('admin'), eliminarProducto); // Solo 'admin' puede eliminar

// Exportar el router para usarlo en otras partes de la aplicación
export default router;
