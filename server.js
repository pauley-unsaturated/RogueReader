import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import https from 'https';
import selfsigned from 'selfsigned';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS for local development (HTTPS origin)
app.use(cors({
  origin: 'https://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RogueReader API proxy is running' });
});

// Whisper transcription proxy endpoint
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  try {
    const apiKey = process.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'OpenAI API key not configured on server'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`📼 Received audio file: ${req.file.size} bytes, type: ${req.file.mimetype}`);

    // Create form data for OpenAI API
    const formData = new FormData();

    // Create a blob from the buffer
    const audioBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', audioBlob, req.file.originalname);
    formData.append('model', req.body.model || 'whisper-1');
    formData.append('language', req.body.language || 'en');
    formData.append('response_format', req.body.response_format || 'json');

    if (req.body.prompt) {
      formData.append('prompt', req.body.prompt);
    }

    console.log('🎤 Forwarding to OpenAI Whisper API...');

    // Forward to OpenAI API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      return res.status(response.status).json({
        error: `OpenAI API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log(`✅ Transcription: "${data.text}"`);

    res.json(data);

  } catch (error) {
    console.error('❌ Transcription error:', error);
    res.status(500).json({
      error: 'Transcription failed',
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;

// Generate self-signed certificate for HTTPS (development only!)
// Using basic cert generation to match Vite's @vitejs/plugin-basic-ssl
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, {
  days: 365,
  keySize: 2048,
  algorithm: 'sha256'
});

const httpsOptions = {
  key: pems.private,
  cert: pems.cert
};

// Create HTTPS server
https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`\n🎮 RogueReader API Server`);
  console.log(`📡 Listening on https://localhost:${PORT}`);
  console.log(`🔒 HTTPS enabled (self-signed certificate)`);
  console.log(`🔑 API Key configured: ${process.env.VITE_OPENAI_API_KEY ? 'YES ✓' : 'NO ✗'}\n`);
});
