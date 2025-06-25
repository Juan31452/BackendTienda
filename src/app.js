import express from 'express';
import dotenv from 'dotenv';
import Servidor from './config/server.js';
import mongoInstance from './config/database.js'; // Importa la conexión a MongoDB
import { rutas } from './routes/index.js';

// Cargar variables de entorno
dotenv.config();
// Definir el puerto desde .env o usar 4000 por defecto
const PORT = process.env.PORT || 4000;

// Conectar a MongoDB antes de iniciar el servidor
(async () => {
  try {
    await mongoInstance.connect(true); // true para Atlas, false para Local

    // Crear una instancia del servidor
    const servidor = new Servidor(PORT);

    // Agregar middleware (por ejemplo, para parsear JSON)
    servidor.agregarMiddleware(express.json());

    // Agregar rutas al servidor
    servidor.agregarRutas(rutas);

    // Iniciar el servidor
    servidor.iniciar();
  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error);
    process.exit(1); // Salir con error si no se puede conectar a la base de datos
  }
})();
