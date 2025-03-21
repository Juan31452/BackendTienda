import express from 'express';
import dotenv from 'dotenv';
import Servidor from './config/server.js';
import { rutas } from './routes/index.js';

// Cargar variables de entorno desde un archivo .env (si existe)
dotenv.config();

// Definir el puerto desde la variable de entorno o usar el 4000 por defecto
const PORT = process.env.PORT || 4000;

// Crear una instancia del servidor
const servidor = new Servidor(PORT);

// Agregar middleware (por ejemplo, para parsear JSON)
servidor.agregarMiddleware(express.json());

// Agregar rutas al servidor
servidor.agregarRutas(rutas);

// Iniciar el servidor con manejo de errores
try {
  servidor.iniciar();
} catch (error) {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1); // Salir con error
}
