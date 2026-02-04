# LegalDrishti

AI-powered Legal Assistant platform for India. Built with Next.js, FastAPI, and Ollama.

## 🚀 Features

- 🤖 **AI Legal Assistant** - Chat with Gemma AI for legal guidance
- 📄 **Document Processing** - OCR & document analysis (coming soon)
- 🔍 **Legal Search** - Search case laws & acts (coming soon)
- 📝 **Templates** - Legal document templates (coming soon)

## 📁 Project Structure

```
LegalDrishti/
├── .env                 # Environment variables (shared)
├── .env.example         # Environment template
├── .gitignore           # Git ignore rules
├── README.md            # This file
├── backend/             # FastAPI backend
│   ├── run.py           # Start server
│   ├── requirements.txt # Python dependencies
│   └── app/
│       ├── main.py      # FastAPI app
│       ├── api/v1/      # API routes
│       ├── core/        # Config & dependencies
│       ├── schemas/     # Pydantic models
│       ├── services/    # Business logic
│       └── utils/       # Helper functions
└── frontend/            # Next.js frontend
    ├── package.json
    └── src/
        ├── app/         # Pages
        └── components/  # React components
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.10+, Pydantic |
| AI/LLM | Ollama, Gemma 3 1B |
| Database | PostgreSQL (coming soon) |

## ⚡ Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.ai/) installed

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd LegalDrishti

# Copy environment file
cp .env.example .env
```

### 2. Start Ollama

```bash
# Start Ollama service
ollama serve

# Pull the model (first time only)
ollama pull gemma3:1b
```

### 3. Start Backend

```bash
cd backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Start server
python run.py
```

Backend runs at: http://localhost:8000
API Docs: http://localhost:8000/docs

### 4. Start Frontend

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:3000

## 📋 Commands Reference

| Action | Command |
|--------|---------|
| Start Backend | `cd backend && python run.py` |
| Start Frontend | `cd frontend && npm run dev` |
| Start Ollama | `ollama serve` |
| Pull Model | `ollama pull gemma3:1b` |
| Install Backend Deps | `cd backend && pip install -r requirements.txt` |
| Install Frontend Deps | `cd frontend && npm install` |

## 🔧 Environment Variables

All environment variables are in the root `.env` file:

```env
# Application
APP_NAME=LegalDrishti
DEBUG=True

# Ollama LLM
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:1b

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/chat` | Send message to AI |
| POST | `/api/chat/quick-action` | Predefined prompts |
| GET | `/api/chat/model-info` | Get model information |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger API docs |

## 🧪 Testing the API

```bash
# Health check
curl http://localhost:8000/health

# Chat with AI
curl -X POST http://localhost:8000/api/chat/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is a contract?"}'
```

## 🚀 Production Deployment

### Backend
```bash
# Without reload for production
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

### Ollama in Production
- Self-host on GPU server (Vast.ai, RunPod)
- Or use Groq API (free tier available)

## 📝 License

MIT License

## 👥 Team

Built by the LegalDrishti Team
