import { home, about } from '../controllers/homeController.js';

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
];