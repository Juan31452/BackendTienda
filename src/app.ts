import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoInstance from './config/database.ts';
import productsRoutes from './routes/ProductsRoutes.ts';
import userRoutes from './routes/UserRoutes.ts';

// Cargar variables de entorno
dotenv.config();
// Definir el puerto desde .env o usar 4000 por defecto
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await mongoInstance.connect(true); // true para Atlas, false para Local

    const app = express();

    // Middleware de depuración: Ver todas las peticiones que llegan
    app.use((req, _res, next) => {
      console.log(`📡 Solicitud recibida: ${req.method} ${req.url}`);
      next();
    });

    // Middlewares
    app.use(cors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
        const allowedOrigins = ['http://localhost:5173', 'https://gilded-tanuki-8b07e6.netlify.app'];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    }));
    app.use(morgan('dev'));
    app.use(express.json());
    app.use(cookieParser());

    // Rutas de la API
    app.use('/api/productos', productsRoutes);
    app.use('/api/users', userRoutes);
    
    app.get('/api/health', (_req: Request, res: Response) => {
      res.status(200).send('Server is healthy!');
    });

    const assistant = await import('./routes/assistantRoutes.ts');
    app.use('/api/assistant', assistant.default);

    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error);
    process.exit(1); // Salir con error si no se puede conectar a la base de datos
  }
})();