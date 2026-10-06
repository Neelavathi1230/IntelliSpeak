# IntelliSpeak – Text & Speech Analysis Chatbot (MVP, phase 1)

## What works now
Registration/login (bcrypt + JWT), protected API, chat with conversation history (create, rename, delete, continue),
and per-message analysis: sentiment, intent, emotion, keywords, entities, text statistics. A dedicated Text Analysis page.
The NLP is a rule/lexicon baseline behind a stable `analyze_text()` contract, so spaCy or Transformers can replace it later.

## Not built yet
Speech-to-text, text-to-speech, microphone UI, dashboard/analytics, profile/settings, landing page, dark mode,
rate limiting, Docker, frontend tests, the academic report. Entity types other than DATE/TIME are labelled PROPER_NOUN
(no person/location typing until a trained model is added).

## Run the backend
    cd backend
    python -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    cp .env.example .env        # set JWT_SECRET
    uvicorn app.main:app --reload --port 8000
API docs: http://localhost:8000/docs

## Run the frontend
    cd frontend
    npm install
    npm run dev                 # http://localhost:5173 (proxies /api to :8000)

## Tests
    cd backend && pytest

## Database
SQLite by default. For PostgreSQL set `DATABASE_URL=postgresql+psycopg2://user:pass@host/db` and `pip install psycopg2-binary`.
Tables are created on startup (Alembic migrations are a later step).
