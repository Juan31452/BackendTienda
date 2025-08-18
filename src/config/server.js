import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

export default class Servidor {
  constructor(puerto) {
    if (!puerto || isNaN(puerto)) {
      throw new Error('El puerto debe ser un número válido.');
    }

    this.app = express();
    this.puerto = puerto;
    this.server = null;

    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:5173',
      'https://gilded-tanuki-8b07e6.netlify.app'
    ];

    // Middlewares esenciales
    this.app.use(morgan('dev')); // Registrar solicitudes HTTP
    this.app.use(express.json()); // Para manejar JSON
    this.app.use(cookieParser()); // Convertir cookies a objeto JSON

    this.app.use(cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Permite Postman u otros sin origen
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true // <- necesario si usas cookies/autenticación
    }));

    // Middleware para manejo de errores (centralizado)
    this.app.use((err, req, res, next) => {
      console.error('Error en la solicitud:', err.message);
      res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor',
      });
    });
  }

  agregarMiddleware(middleware) {
    this.app.use(middleware);
  }

  agregarRutas(rutas) {
    rutas.forEach((ruta) => {
      const metodo = ruta.metodo?.toLowerCase();

      if (metodo === 'use') {
        // Para middlewares o routers
        this.app.use(ruta.ruta, ruta.controlador);
      } else if (['get', 'post', 'put', 'delete', 'patch'].includes(metodo)) {
        this.app[metodo](
          ruta.ruta,
          ...(ruta.middlewares || []),
          async (req, res, next) => {
            try {
              await ruta.controlador(req, res, next);
            } catch (error) {
              next(error);
            }
          }
        );
      } else {
        throw new Error(`Método HTTP inválido: ${ruta.metodo}`);
      }
    });
  }
  
  iniciar() {
    this.server = this.app.listen(this.puerto, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${this.puerto}`);
    });
  }

  cerrar() {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) return reject(err);
          console.log('🛑 Servidor cerrado.');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
