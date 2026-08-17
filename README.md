# OpenCode Proxy Server

Proxy server untuk mengelola multiple API keys dan menghindari limit usage.

## Arsitektur

```
OpenCode (lokal) → Proxy Server (Railway) → Multiple API Keys → AI Provider
```

## Setup

### 1. Deploy ke Railway

```bash
# 1. Login ke Railway
# Buka https://railway.app dan login dengan GitHub

# 2. Create New Project
# Klik "New Project" → "Deploy from GitHub repo"
# Pilih repo ini atau upload folder ini

# 3. Set Environment Variables di Railway Dashboard
# Klik tab "Variables" dan tambahkan:
# API_KEYS=sk-xxxxx,sk-yyyyy,sk-zzzzz
# OPENAI_API_BASE=https://api.openai.com (atau provider lain)
```

### 2. Konfigurasi OpenCode

Edit file `~/.opencode/config.json` atau buat baru:

```json
{
  "provider": {
    "openai": {
      "apiKey": "dummy",
      "baseURL": "https://your-app-name.up.railway.app"
    }
  }
}
```

### 3. Jalankan OpenCode

```bash
opencode
```

## API Keys yang Didukung

### OpenAI Compatible
- OpenAI (sk-xxxxx)
- OpenRouter (sk-or-xxxxx)
- Together AI (tok-xxxxx)
- Groq (gsk-xxxxx)
- DeepSeek (sk-xxxxx)

### Anthropic
- Anthropic (sk-ant-xxxxx)

## Cara Mendapatkan API Keys

### OpenAI
1. Buka https://platform.openai.com/api-keys
2. Login atau daftar
3. Klik "Create new secret key"
4. Copy key (sk-xxxxx)

### OpenRouter (Rekomendasi - Murah)
1. Buka https://openrouter.ai
2. Login dengan Google/GitHub
3. Buka https://openrouter.ai/keys
4. Klik "Create Key"
5. Copy key (sk-or-xxxxx)

### Anthropic
1. Buka https://console.anthropic.com
2. Login atau daftar
3. Buka https://console.anthropic.com/settings/keys
4. Klik "Create Key"
5. Copy key (sk-ant-xxxxx)

## Testing

```bash
# Health check
curl https://your-app-name.up.railway.app/health

# Test chat completion
curl -X POST https://your-app-name.up.railway.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Troubleshooting

### Error "Tidak ada API keys"
- Pastikan env var `API_KEYS` sudah di-set di Railway

### Error "Connection refused"
- Pastikan OpenCode sudah dikonfigurasi dengan benar
- Cek URL proxy di config OpenCode

### Rate limit error
- Tambahkan lebih banyak API keys
- Atau tunggu beberapa menit

## Keamanan

- API keys disimpan di Railway (encrypted)
- Tidak ada logging yang menyimpan sensitif data
- Gunakan environment variables, bukan hardcode