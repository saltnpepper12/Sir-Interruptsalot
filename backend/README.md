# Sir Interruptsalot — Backend

FastAPI service that powers Sir Interruptsalot. It orchestrates Claude
(Anthropic) for rebuttal generation, judging, and the end-of-session persona
report, and uses Serper for live web search results.

## Local development

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional
pip install -r requirements.txt
cp .env.example .env       # then add your keys
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## Environment variables

| Variable             | Required | Purpose                                  |
| -------------------- | -------- | ---------------------------------------- |
| `ANTHROPIC_API_KEY`  | yes      | Claude API (rebuttals, judging, report)  |
| `SERPER_API_KEY`     | yes      | Serper Google Search (source grounding)  |

## API endpoints

| Method | Path             | Purpose                                    |
| ------ | ---------------- | ------------------------------------------ |
| `GET`  | `/health`        | Liveness check                             |
| `POST` | `/start_session` | Begin a session from the opening argument  |
| `POST` | `/send_argument` | Submit a round; returns rebuttal + score   |
| `POST` | `/end_session`   | Close the session, return persona report   |
| `GET`  | `/test_api`      | Validate the Anthropic key                 |
| `GET`  | `/test_serper`   | Validate the Serper key                    |

### Response shape (`/send_argument`)

```json
{
  "bot_response": "string",
  "session_id": "uuid",
  "user_score": 0,
  "bot_score": 0,
  "time_remaining": 240,
  "game_ended": false,
  "sources": [
    { "title": "string", "link": "https://...", "snippet": "string" }
  ],
  "status_update": "judge reasoning"
}
```

## Deploying on Render

The repository ships a `render.yaml` for both the backend and the static
frontend; pushing the repo to a Render Blueprint deploys both services.
Set `ANTHROPIC_API_KEY` and `SERPER_API_KEY` in the Render dashboard under
the backend service.

## Notes

- Sessions are held in memory on a single global bot instance. This is
  fine for a demo; for multi-user production you would key sessions by
  `session_id` and persist them externally.
- CORS is wildcard for development. Lock it down to your frontend
  origin before deploying publicly.
