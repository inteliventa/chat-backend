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

// 🚀 **Iniciar el servidor**
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
