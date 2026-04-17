# Sir Interruptsalot

`Sir Interruptsalot` is a real-time AI debate game where users argue a topic and the bot pushes back with confident, source-backed counterpoints.

The app combines a React frontend with a FastAPI backend powered by Claude, and includes scoring, timed rounds, and end-of-session personality feedback.

## Features

- **Real-time debate flow** with fast response turns from Claude
- **Live scoring** from an AI judge each round
- **Timed sessions** to keep battles focused and competitive
- **Personality report** at the end of each debate
- **Source-backed arguments** using Serper search results and links
- **Polished UI** built with modern React tooling

## Tech Stack

### Frontend

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Radix UI

### Backend

- FastAPI
- Claude (Anthropic API)
- Pydantic
- Uvicorn

## Prerequisites

- Python 3.8+
- Node.js 16+
- Anthropic API key: [console.anthropic.com](https://console.anthropic.com/)
- Serper API key: [serper.dev](https://serper.dev/)

## Quick Start

### Option 1: Scripted Setup (recommended)

From `Argubot/UI`:

**Windows**

```bash
start.bat
```

**macOS / Linux**

```bash
chmod +x start.sh
./start.sh
```

### Option 2: Manual Setup

1. Move to the app directory:

```bash
cd Argubot/UI
```

2. Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Create `backend/.env`:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SERPER_API_KEY=your_serper_api_key_here
```

4. Install frontend dependencies:

```bash
cd ..
npm install
```

5. Start frontend and backend together:

```bash
npm run start
```

## Development Commands

From `Argubot/UI`:

```bash
# Frontend only
npm run dev

# Backend only
npm run backend

# Both services
npm run start

# Production build
npm run build
```

## API Endpoints

- `POST /api/session/start` - start a new debate session
- `POST /api/argument` - submit a user argument and receive a rebuttal
- `GET /api/session/{id}/status` - fetch current session state
- `POST /api/session/{id}/end` - end a session and generate final report

## How to Play

1. Enter your opinion or hot take.
2. Start the debate session.
3. Respond to each AI rebuttal.
4. Track your score as rounds progress.
5. Review your final score and personality breakdown.

## Project Structure

```text
Argubot/UI/
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── Arena.tsx
│   │   └── ui/
│   └── styles/
│       └── globals.css
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env                  # create this file locally
├── package.json
├── start.sh
├── start.bat
└── README.md
```

## Troubleshooting

**Backend not starting**

- Verify Python version: `python --version`
- Install backend dependencies: `pip install -r backend/requirements.txt`
- Confirm keys in `backend/.env`

**Frontend not loading**

- Verify Node version: `node --version`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**API errors**

- Confirm Anthropic and Serper keys are valid
- Make sure backend is running on port `8000`
- Check browser console for CORS or network errors

## License

MIT

---

Ready to argue? Start the app and test your debating skills against Sir Interruptsalot.
