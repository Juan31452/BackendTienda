import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ Falta la variable de entorno GEMINI_API_KEY en tu archivo .env");
}

const ai = new GoogleGenAI({});

export const handleChatMessage = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "El mensaje es requerido." });
    }

    // Construir el prompt (historial + mensaje actual)
    let prompt = `Eres un asistente virtual amigable para la tienda online 'Variedades JM'. 
Responde de forma concisa y natural. 
Hoy es ${new Date().toLocaleDateString()}.\n\n`;

    for (const msg of history) {
      prompt += `${msg.role === "assistant" ? "Asistente" : "Usuario"}: ${msg.content}\n`;
    }
    prompt += `Usuario: ${message}\nAsistente: `;

    // Llamar al modelo correcto
    const result = await ai.models.generateContent({
      model: "models/gemini-2.0-flash",
      contents: prompt,
    });

    const reply = result.output_text;

    res.json({ reply });

  } catch (error) {
    console.error("Error detallado con la API de Gemini:", error);

    if (error.message.includes("overloaded")) {
      return res.status(503).json({
        error: "El modelo está saturado. Intenta de nuevo en unos segundos 🕒",
      });
    }

    res.status(500).json({
      error: error.message || "Error interno al procesar tu mensaje.",
    });
  }
};
