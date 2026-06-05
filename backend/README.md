# Sir Interruptsalot Backend API

The FastAPI backend for Sir Interruptsalot - The Undefeated Debate Champion.

## 🚀 Deployment on Render

### Prerequisites
- Render account (free tier available)
- Anthropic API key
- Serper API key (optional, for factual information)

### Manual Deployment Steps

#### 1. Create New Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `saltnpepper12/Sir-Interruptsalot`
4. Select the repository

#### 2. Configure Build Settings
- **Name**: `sir-interruptsalot-backend`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r Argubot/UI/backend/requirements.txt`
- **Start Command**: `uvicorn Argubot.UI.backend.app:app --host 0.0.0.0 --port $PORT`

#### 3. Set Environment Variables
Add these environment variables in Render dashboard:

**Required:**
- `ANTHROPIC_API_KEY`: Your Anthropic API key

**Optional:**
- `SERPER_API_KEY`: Your Serper API key (for factual information)

#### 4. Deploy
Click **"Create Web Service"** and wait for deployment.

### API Endpoints

#### Health Check
```
GET /
GET /health
```

#### Start Argument Session
```
POST /start_session
{
  "message": "Your initial argument here"
}
```

#### Send Argument
```
POST /send_argument
{
  "message": "Your argument message",
  "session_id": "session_id_from_start"
}
```

#### End Session
```
POST /end_session
{
  "message": "any message",
  "session_id": "session_id"
}
```

### Response Format

```json
{
  "bot_response": "Sir Interruptsalot's response",
  "session_id": "unique_session_id",
  "user_score": 2,
  "bot_score": 1,
  "time_remaining": 240,
  "game_ended": false,
  "sources": [
    {
      "title": "Source Title",
      "link": "https://source.url",
      "snippet": "Source snippet"
    }
  ]
}
```

### Local Development

```bash
cd Argubot/UI/backend
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SERPER_API_KEY=your_serper_api_key_here
```

## 🎯 Features

- ✅ **Real-time argument sessions**
- ✅ **AI-powered responses with facts**
- ✅ **Impartial judging system**
- ✅ **Personality roast reports**
- ✅ **5-minute time limit**
- ✅ **Score tracking**
- ✅ **Source citations**

## 🔧 Troubleshooting

### Common Issues

1. **API Key Missing**
   - Ensure `ANTHROPIC_API_KEY` is set in Render environment variables

2. **Import Errors**
   - Make sure all dependencies are in `requirements.txt`

3. **CORS Issues**
   - Backend is configured to allow all origins in development
   - For production, specify your frontend domain

4. **Port Issues**
   - Render automatically sets the `$PORT` environment variable
   - Use `$PORT` in the start command, not a hardcoded port

### Logs
Check Render logs for any deployment or runtime errors.

## 📞 Support

If you encounter issues:
1. Check Render deployment logs
2. Verify environment variables are set correctly
3. Test API endpoints using the health check endpoint 