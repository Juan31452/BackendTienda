import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoInstance from './config/database.js';
import productsRoutes from './routes/ProductsRoutes.js';
import userRoutes from './routes/UserRoutes.js';

// Cargar variables de entorno
dotenv.config();
// Definir el puerto desde .env o usar 4000 por defecto
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await mongoInstance.connect(true); // true para Atlas, false para Local

    const app = express();

    // Middlewares
    app.use(cors({
      origin: (origin, callback) => {
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
    app.get('/api/health', (req, res) => res.status(200).send('Server is healthy!'));
    app.use('/api/assistant', (await import('./routes/assistantRoutes.js')).default);

    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error);
    process.exit(1); // Salir con error si no se puede conectar a la base de datos
  }
})();