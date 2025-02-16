import fs from "fs";
import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import dotenv from "dotenv";
import mammoth from "mammoth";
import pineconeModule from "@pinecone-database/pinecone";

dotenv.config(); // Cargar variables de entorno desde .env

// **📌 INICIALIZAR EXPRESS**
const app = express();
app.use(cors()); // Permitir solicitudes desde cualquier dominio
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log("🔑 PINECONE_API_KEY:", PINECONE_API_KEY ? "Cargado" : "No encontrado");
console.log("🔑 PINECONE_INDEX_NAME:", PINECONE_INDEX_NAME || "No definido");
console.log("🔑 PINECONE_ENVIRONMENT:", PINECONE_ENVIRONMENT || "No definido");

const { Pinecone } = pineconeModule;
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
let index;

try {
    index = pinecone.index(PINECONE_INDEX_NAME);
    console.log("✅ Pinecone inicializado correctamente.");
} catch (error) {
    console.error("❌ Error al conectar con Pinecone:", error);
}

// 📌 **Endpoint para crear un nuevo thread**
app.post("/start-thread", async (req, res) => {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/threads",
            {},
            { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
        );

        res.json({ thread_id: response.data.id });
    } catch (error) {
        console.error("❌ Error al crear el thread:", error);
        res.status(500).json({ error: "Error al crear el thread" });
    }
});

// 📌 **Endpoint para manejar el chat usando threads**
app.post("/chat", async (req, res) => {
    try {
        const { message, thread_id } = req.body;
        if (!message || !thread_id) {
            return res.status(400).json({ error: "El campo 'message' y 'thread_id' son requeridos." });
        }

        // Obtener el embedding de OpenAI para buscar en Pinecone
        const queryEmbedding = await getEmbedding(message);
        const results = await index.query({
            vector: queryEmbedding,
            topK: 3,
            includeMetadata: true,
        });

        // Extraer el contexto más relevante de Pinecone
        const context = results.matches.map(match => match.metadata.text).join("\n");

        // Enviar el mensaje al thread en OpenAI
        await axios.post(
            `https://api.openai.com/v1/threads/${thread_id}/messages`,
            { role: "user", content: message },
            { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
        );

        // Solicitar una respuesta desde el thread
        const response = await axios.post(
            `https://api.openai.com/v1/threads/${thread_id}/runs`,
            {
                assistant_id: "tu_assistant_id", // ⚠️ REEMPLAZA CON TU ID DE ASSISTANT EN OPENAI
                instructions: `Usa la siguiente información para responder preguntas:\n${context}`,
            },
            { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
        );

        res.json({ content: response.data.output });
    } catch (error) {
        console.error("❌ Error en la API de OpenAI:", error);
        res.status(500).json({ error: "Error al procesar la solicitud" });
    }
});

// 🚀 **Iniciar el servidor**
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
