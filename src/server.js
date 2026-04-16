import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { analyzeSpreadsheet } from './services/analyzer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
});

// Rotas
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const tacosObjetivo = Number(req.body.tacos);
    if (!Number.isFinite(tacosObjetivo) || tacosObjetivo <= 0 || tacosObjetivo > 100) {
      return res.status(400).json({ error: 'TACOS invalido. Informe um valor entre 0.1 e 100.' });
    }

    const result = await analyzeSpreadsheet(req.file.buffer, tacosObjetivo);

    res.json(result);
  } catch (error) {
    console.error('Erro ao processar arquivo:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});
