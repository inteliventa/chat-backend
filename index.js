import fs from "fs";
import express from "express";
import multer from "multer";
import axios from "axios";
import dotenv from "dotenv";
import mammoth from "mammoth";
import pineconeModule from "@pinecone-database/pinecone";

dotenv.config(); // Cargar variables de entorno desde .env

const app = express();
app.use(express.json());

const upload = multer({ dest: "uploads/" }); // Guardará archivos en 'uploads/'

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log("🔑 PINECONE_API_KEY:", PINECONE_API_KEY ? "Cargado" : "No encontrado");
console.log("🔑 PINECONE_INDEX_NAME:", PINECONE_INDEX_NAME || "No definido");
console.log("🔑 PINECONE_ENVIRONMENT:", PINECONE_ENVIRONMENT || "No definido");

// Inicializar Pinecone
const { Pinecone } = pineconeModule;
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
let index = pinecone.index(PINECONE_INDEX_NAME);

// Función para obtener embeddings de OpenAI
async function getEmbedding(text) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/embeddings",
            { input: text, model: "text-embedding-ada-002" },
            { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
        );
        return response.data.data[0].embedding;
    } catch (error) {
        console.error("❌ Error al obtener embedding:", error);
        throw new Error("Error al obtener embedding");
    }
}

// 📌 **Endpoint para subir archivos DOCX a Pinecone**
app.post("/upload-docx", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se proporcionó ningún archivo." });
        }

        const filePath = req.file.path;
        const data = await mammoth.extractRawText({ path: filePath });
        const fileText = data.value.trim();

        fs.unlinkSync(filePath); // Eliminar el archivo después de leerlo

        // Dividir el texto en fragmentos de 500 caracteres
        const chunks = fileText.match(/[\s\S]{1,500}/g) || [];

        for (const chunk of chunks) {
            const embedding = await getEmbedding(chunk);
            await index.upsert([{ id: Date.now().toString(), values: embedding, metadata: { text: chunk } }]);
        }

        res.json({ message: "📂 Archivo DOCX guardado en Pinecone correctamente." });
    } catch (error) {
        console.error("❌ Error al procesar el archivo:", error);
        res.status(500).json({ error: "Error al procesar el archivo" });
    }
});

// 📌 **Endpoint para hacer consultas en Pinecone**
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "El campo 'message' es requerido." });
        }

        const queryEmbedding = await getEmbedding(message);

        // Buscar en Pinecone los textos más relevantes
        const results = await index.query({
            vector: queryEmbedding,
            topK: 3,
            includeMetadata: true,
        });

        // Extraer el texto más relevante encontrado en Pinecone
        const context = results.matches.map(match => match.metadata.text).join("\n");

        // Enviar el contexto a OpenAI para generar una respuesta basada en la base de conocimiento
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "Usa la siguiente información para responder preguntas:\n" + context },
                    { role: "user", content: message }
                ],
                max_tokens: 150,
            },
            { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" } }
        );

        res.json({ content: response.data.choices[0].message.content });
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
