import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// DEBUG: Imprime la clave de API para verificar si se está cargando correctamente.
console.log('GEMINI_API_KEY cargada:', process.env.GEMINI_API_KEY ? 'Sí, encontrada' : 'No, es undefined');

// 1. Configura el cliente de Google Generative AI con tu clave de API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, { apiVersion: 'v1' });

/**
 * Maneja los mensajes de chat del usuario.
 * Recibe un mensaje y un historial, consulta a la IA y devuelve una respuesta.
 */
export const handleChatMessage = async (req, res) => {
  try {
    // 2. Extraemos el mensaje actual y el historial de la conversación.
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'El mensaje es requerido.' });
    }

    // 3. Seleccionamos el modelo de Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    // 4. Definimos el prompt del sistema y adaptamos el historial al formato de Gemini.
    // El rol 'assistant' de OpenAI se mapea a 'model' en Gemini.
    const systemInstruction = `Eres un asistente virtual amigable y servicial para la tienda online 'Variedades JM'. 
Tu objetivo es ayudar a los usuarios a encontrar productos y responder sus preguntas sobre la tienda.
Responde de forma concisa y natural. 
Hoy es ${new Date().toLocaleDateString()}.`;

    const chatHistoryForAPI = history.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // 5. Iniciamos una sesión de chat con el historial y el prompt del sistema.
    const chat = model.startChat({
      history: [
        // Simulamos el "system prompt" como el primer par de mensajes
        {
          role: 'user',
          parts: [{ text: systemInstruction }],
        },
        {
          role: 'model',
          parts: [{ text: '¡Hola! Soy el asistente de Variedades JM. ¿En qué puedo ayudarte hoy?' }],
        },
        ...chatHistoryForAPI,
      ],
    });

    // 6. Enviamos el nuevo mensaje del usuario a la API de Gemini
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const assistantResponse = response.text();

    res.json({
      reply: assistantResponse,
    });

  } catch (error) {
    console.error('Error con la API de Gemini:', error);
    res.status(500).json({ error: 'Hubo un problema al procesar tu mensaje.' });
  }
};
