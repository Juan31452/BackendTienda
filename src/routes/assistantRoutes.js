import express from 'express';
import { handleChatMessage } from '../controllers/assistantController.js';

const router = express.Router();

// Definimos la ruta POST para el chat.
// Cuando una petición POST llegue a /api/assistant/chat, se ejecutará handleChatMessage.
router.post('/chat', handleChatMessage);

// Exportamos el router para que el servidor principal pueda usarlo.
export default router;
