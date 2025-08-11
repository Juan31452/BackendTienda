import { home, about } from '../controllers/homeController.js';
import productosRoutes from './ProductsRoutes.js';
import UserRoutes from './UserRoutes.js';

export const rutas = [
  {
    metodo: 'get',
    ruta: '/',
    controlador: home,
  },
  {
    metodo: 'get',
    ruta: '/about',
    controlador: about,
  },
  {
    metodo: 'use',
    ruta: '/api/productos',
    controlador: productosRoutes  // <- Aquí se monta el router de productos

  },
  {    
    metodo: 'use',
    ruta: '/api/users',
    controlador: UserRoutes  // <- Aquí se monta el router de usuarios
  }

];