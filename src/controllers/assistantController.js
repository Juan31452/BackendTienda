// import { GoogleGenAI } from "@google/genai";
// import dotenv from "dotenv";
// dotenv.config();
//
// if (!process.env.GEMINI_API_KEY) {
//   throw new Error("❌ Falta la variable de entorno GEMINI_API_KEY en tu archivo .env");
// }
//
// const ai = new GoogleGenAI({});

export const handleChatMessage = async (req, res) => {
  // --- Asistente Desactivado ---
  // Se devuelve un código 503 (Servicio no disponible) para indicar que esta funcionalidad está desactivada.
  return res.status(503).json({ error: "El asistente virtual se encuentra temporalmente desactivado." });
};
