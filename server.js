require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi
const PORT = process.env.PORT || 3000;
const API_KEYS = process.env.API_KEYS?.split(',').map(k => k.trim()) || [];
const PROVIDERS = {
  openai: process.env.OPENAI_API_BASE || 'https://api.openai.com',
  anthropic: process.env.ANTHROPIC_API_BASE || 'https://api.anthropic.com'
};

// State untuk round-robin
let keyIndex = 0;
const keyUsage = new Map();

// Fungsi untuk mendapatkan API key berikutnya (round-robin)
function getNextKey() {
  if (API_KEYS.length === 0) {
    throw new Error('Tidak ada API keys yang dikonfigurasi');
  }
  const key = API_KEYS[keyIndex % API_KEYS.length];
  keyIndex = (keyIndex + 1) % API_KEYS.length;
  return key;
}

// Fungsi untuk melakukan request ke API
async function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Proxy endpoint untuk OpenAI-compatible API
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const apiKey = getNextKey();
    const { model, messages, ...options } = req.body;
    
    console.log(`[${new Date().toISOString()}] Request ke OpenAI-compatible API`);
    console.log(`  Model: ${model}`);
    console.log(`  Messages: ${messages.length}`);
    
    const response = await makeRequest(
      `${PROVIDERS.openai}/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      },
      { model, messages, ...options }
    );
    
    res.json(response);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint untuk Anthropic API
app.post('/v1/messages', async (req, res) => {
  try {
    const apiKey = getNextKey();
    const { model, messages, ...options } = req.body;
    
    console.log(`[${new Date().toISOString()}] Request ke Anthropic API`);
    console.log(`  Model: ${model}`);
    
    const response = await makeRequest(
      `${PROVIDERS.anthropic}/v1/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      },
      { model, messages, ...options }
    );
    
    res.json(response);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    keysConfigured: API_KEYS.length,
    timestamp: new Date().toISOString()
  });
});

// List available models (fallback ke OpenAI)
app.get('/v1/models', async (req, res) => {
  try {
    const apiKey = getNextKey();
    const response = await makeRequest(
      `${PROVIDERS.openai}/v1/models`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'OpenCode Proxy',
    version: '1.0.0',
    endpoints: {
      openai: '/v1/chat/completions',
      anthropic: '/v1/messages',
      health: '/health',
      models: '/v1/models'
    },
    usage: {
      openai: 'Set OPENAI_API_BASE jika menggunakan provider lain',
      anthropic: 'Set ANTHROPIC_API_BASE jika menggunakan provider lain'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 OpenCode Proxy Server berjalan di port ${PORT}`);
  console.log(`📊 API Keys yang dikonfigurasi: ${API_KEYS.length}`);
  console.log(`\nEndpoints:`);
  console.log(`  - OpenAI: http://localhost:${PORT}/v1/chat/completions`);
  console.log(`  - Anthropic: http://localhost:${PORT}/v1/messages`);
  console.log(`  - Health: http://localhost:${PORT}/health`);
  console.log(`\nGunakan URL ini di OpenCode sebagai base URL`);
});