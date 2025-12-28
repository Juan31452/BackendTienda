import express from 'express';
import { 
  obtenerProductos, 
  obtenerProductoPorId,
  crearProducto,
  crearProductos,
  actualizarProducto, 
  eliminarProducto,
  obtenerEstadisticasProductos,
  getTotalMes,
  asignarVendedorGlobal

} from '../controllers/Controller.Products.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { optionalVerifyToken } from '../middlewares/optionalVerifyToken.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = express.Router();

// Definir las rutas para productos

// --- Rutas Públicas (Cualquiera puede acceder) ---
router.get('/', optionalVerifyToken, obtenerProductos); // Ruta pública, el token es opcional. El controlador decide si muestra precios.

// --- Rutas Protegidas (Requieren token y rol específico) ---

// Solo 'admin'  pueden crear, actualizar o eliminar productos.
router.post('/', verifyToken, requireRole('admin'), crearProducto);
router.post('/crear-multiples', verifyToken, requireRole('admin'), crearProductos);
router.post('/asignar-vendedor-global', verifyToken, requireRole('admin'), asignarVendedorGlobal);

// Rutas para estadísticas y totales, podrían ser solo para roles autorizados.
router.get('/estadisticas', verifyToken, requireRole('admin', 'vendedor'), obtenerEstadisticasProductos);
router.get('/total-mes/:mes/:año/:estado', verifyToken, requireRole('admin', 'vendedor'), getTotalMes);

// --- Rutas con parámetros (deben ir al final para no interceptar otras) ---
router.get('/:id',verifyToken, requireRole('admin'), obtenerProductoPorId);  // Obtener un producto por ID
router.put('/:id', verifyToken, requireRole('admin'), actualizarProducto);
router.delete('/:id', verifyToken, requireRole('admin'), eliminarProducto); // Solo 'admin' puede eliminar

// Exportar el router para usarlo en otras partes de la aplicación
export default router;
