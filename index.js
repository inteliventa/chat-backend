const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config(); // Carga variables de entorno desde .env

const app = express();
app.use(express.json());
app.use(cors());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Obtiene la clave desde .env

// Ruta para manejar el chat con OpenAI
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;

        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4-turbo",
                messages: [{ role: "user", content: message }],
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.json(response.data.choices[0].message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al conectar con OpenAI" });
    }
});

// Iniciar el servidor en el puerto 3000
app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));
 
