# Cogniva

Enterprise Intelligence Platform for document-grounded AI chat, decision support, and organizational memory.

## Overview

Cogniva is a full-stack application designed to help teams:

- Upload and index enterprise documents
- Ask grounded questions against indexed knowledge
- Generate AI-assisted project decisions
- Store and retrieve institutional memory
- Manage authentication and role-aware user access

The backend is built with FastAPI, SQLAlchemy, PostgreSQL, ChromaDB, and Gemini. A Vite + React frontend is scaffolded in this repository.

## Tech Stack

### Backend

- Python 3.10+
- FastAPI
- SQLAlchemy
- PostgreSQL
- ChromaDB
- Google Gemini (`gemini-2.5-flash`)
- JWT Authentication

### Frontend

- React (Vite)
- MUI
- Axios
- React Router
- Framer Motion
- Recharts

## Repository Structure

```text
Cogniva/
	backend/
		main.py
		app/
			api/
			agents/
			services/
			models/
			schemas/
			database/
			utils/
	frontend/
		src/
			components/
			pages/
			services/
	docker-compose.yml
	requirements.txt
```

## Prerequisites

- Python 3.10 or later
- Node.js 18 or later
- PostgreSQL (local or hosted)
- Gemini API key

## Environment Variables

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/cogniva
SECRET_KEY=replace_with_a_long_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY=your_gemini_api_key
```

## Local Development Setup

### 1. Clone

```bash
git clone <your-repo-url>
cd Cogniva
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
```

Activate virtual environment:

- Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

- macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r ..\requirements.txt
```

Run API server:

```bash
uvicorn main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

Open interactive docs:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### 3. Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:5173` by default.

## API Modules

### Authentication

- `POST /auth/register`
- `POST /auth/login`

### Knowledge Upload

- `POST /upload/` (multipart PDF)

### AI Workspace

- `POST /chat/` (grounded Q&A over indexed docs)

### Memory Vault

- `POST /memory/add`
- `GET /memory/all`

### Decision Support

- `POST /decision/`

## Quick API Examples

Register:

```bash
curl -X POST "http://127.0.0.1:8000/auth/register" \
	-H "Content-Type: application/json" \
	-d '{
		"full_name": "Jane Doe",
		"email": "jane@company.com",
		"password": "strong_password",
		"department": "Operations"
	}'
```

Login:

```bash
curl -X POST "http://127.0.0.1:8000/auth/login" \
	-H "Content-Type: application/json" \
	-d '{
		"email": "jane@company.com",
		"password": "strong_password"
	}'
```

Chat:

```bash
curl -X POST "http://127.0.0.1:8000/chat/" \
	-H "Content-Type: application/json" \
	-d '{"question": "What is our leave policy?"}'
```

## Health and Connectivity Endpoints

- `GET /` returns API welcome message
- `GET /db-test` validates database connectivity

## Notes

- `docker-compose.yml` currently exists but is empty in this repository.
- Root `requirements.txt` is the active dependency source for Python setup.
- The current `frontend/src/App.jsx` is still based on Vite starter UI; backend services and routes in `frontend/src/pages/` can be integrated progressively.

## License

This project is licensed under the terms of the `LICENSE` file in the repository root.