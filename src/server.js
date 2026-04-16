import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { analyzeSpreadsheet } from './services/analyzer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // TACOS Objetivo vem como string, converter para número
    const tacosObjetivo = parseFloat(req.body.tacos) || 5;

    const result = await analyzeSpreadsheet(req.file.buffer, tacosObjetivo);
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar arquivo:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
