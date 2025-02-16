import fs from "fs";
import express from "express";
import cors from "cors"; // Importa CORS correctamente
import multer from "multer";
import axios from "axios";
import dotenv from "dotenv";
import mammoth from "mammoth";
import pineconeModule from "@pinecone-database/pinecone";

dotenv.config(); // Cargar variables de entorno desde .env

// **📌 INICIALIZAR EXPRESS ANTES DE USAR CORS**
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

// **📌 INICIALIZAR PINECONE**
const { Pinecone } = pineconeModule;
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
let index = pinecone.index(PINECONE_INDEX_NAME);

// 📌 **Ruta de prueba para verificar que el servidor está funcionando**
app.get("/", (req, res) => {
    res.send("🚀 Servidor activo y listo para recibir solicitudes.");
});

// 📌 **Ruta para recibir preguntas desde el frontend**
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "El campo 'message' es requerido." });
        }

        // Aquí deberías hacer la consulta a Pinecone
        res.json({ content: `Recibí tu mensaje: ${message}` });
    } catch (error) {
        console.error("❌ Error en la API:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// 📌 **Ruta para subir documentos DOCX**
app.post("/upload-docx", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se proporcionó ningún archivo." });
        }

        const filePath = req.file.path;
        const data = await mammoth.extractRawText({ path: filePath });
        const fileText = data.value.trim();

        fs.unlinkSync(filePath); // Eliminar el archivo después de leerlo

        res.json({ message: "📂 Archivo DOCX procesado correctamente." });
    } catch (error) {
        console.error("❌ Error al procesar el archivo:", error);
        res.status(500).json({ error: "Error al procesar el archivo" });
    }
});

// 🚀 **Iniciar el servidor**
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
