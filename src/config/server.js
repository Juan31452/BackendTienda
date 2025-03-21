import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

export default class Servidor {
  constructor(puerto) {
    if (!puerto || isNaN(puerto)) {
      throw new Error('El puerto debe ser un número válido.');
    }

    this.app = express();
    this.puerto = puerto;
    this.server = null;

    // Middlewares esenciales
    this.app.use(express.json()); // Para manejar JSON
    this.app.use(cors()); // Para permitir solicitudes desde otros dominios
    this.app.use(morgan('dev')); // Registrar solicitudes HTTP en consola
  }

  agregarMiddleware(middleware) {
    this.app.use(middleware);
  }

  agregarRutas(rutas) {
    rutas.forEach((ruta) => {
      this.app[ruta.metodo](ruta.ruta, async (req, res, next) => {
        try {
          await ruta.controlador(req, res, next);
        } catch (error) {
          next(error);
        }
      });
    });

    // Middleware para manejar errores
    this.app.use((err, req, res, next) => {
      console.error('Error en la solicitud:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    });
  }

  iniciar() {
    this.server = this.app.listen(this.puerto, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${this.puerto}`);
    });
  }

  cerrar() {
    if (this.server) {
      this.server.close(() => {
        console.log('🛑 Servidor cerrado.');
      });
    }
  }
}
