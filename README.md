# Sir Interruptsalot - The Undefeated Debate Champion

An AI-powered argument bot that challenges users to debate while providing factual information and generating personality roast reports.

## 🚀 Deployment on Render

This project requires **two separate services** on Render:

### 1. Backend API Service
- **Type**: Web Service (Python)
- **Path**: `Argubot/UI/backend/`

### 2. Frontend Service  
- **Type**: Static Site
- **Path**: `Argubot/UI/`

## 📋 Manual Deployment Instructions

### **Step 1: Deploy Backend API**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `saltnpepper12/Sir-Interruptsalot`
4. Configure settings:
   - **Name**: `sir-interruptsalot-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r Argubot/UI/backend/requirements.txt`
   - **Start Command**: `uvicorn Argubot.UI.backend.app:app --host 0.0.0.0 --port $PORT`

5. Set Environment Variables:
   ```
   ANTHROPIC_API_KEY = your_anthropic_api_key_here
   SERPER_API_KEY = your_serper_api_key_here (optional)
   ```

6. Click **"Create Web Service"**

### **Step 2: Deploy Frontend**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository: `saltnpepper12/Sir-Interruptsalot`
4. Configure settings:
   - **Name**: `sir-interruptsalot-frontend`
   - **Build Command**: `cd Argubot/UI && npm install && npm run build`
   - **Publish Directory**: `Argubot/UI/dist`

5. Set Environment Variable:
   ```
   VITE_API_BASE_URL = https://sir-interruptsalot-backend.onrender.com
   ```

6. Click **"Create Static Site"**

## 🎯 Features

- ✅ **AI-powered argument bot** with personality
- ✅ **Real-time factual information** with source citations
- ✅ **Impartial judging system** with scoring
- ✅ **Personality roast reports** after sessions
- ✅ **5-minute time limit** for intense debates
- ✅ **Beautiful dark theme UI** with animations
- ✅ **Legal industry inspiration** popup
- ✅ **"Let him cook" loading animations**

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- Python 3.8+
- Anthropic API key
- Serper API key (optional)

### Backend Setup
```bash
cd Argubot/UI/backend
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd Argubot/UI
npm install
npm run dev
```

### Combined Setup
```bash
cd Argubot/UI
npm install
npm run start  # Runs both frontend and backend
```

## 🌐 API Endpoints

### Health Check
```
GET /
GET /health
```

### Argument Session
```
POST /start_session
POST /send_argument  
POST /end_session
```

## 🔧 Environment Variables

### Backend (.env)
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SERPER_API_KEY=your_serper_api_key_here
```

### Frontend (Vite)
```env
VITE_API_BASE_URL=https://sir-interruptsalot-backend.onrender.com
```

## 📁 Project Structure

```
Sir-Interruptsalot/
├── Argubot/
│   ├── UI/ (React frontend)
│   │   ├── components/
│   │   ├── backend/ (FastAPI backend)
│   │   └── package.json
│   └── README.md
└── SassyArguBot/ (Original Chainlit version)
```

## 🎮 How to Play

1. **Enter your argument** in the text box
2. **Click "Start Argument"** to begin
3. **Argue back and forth** with Sir Interruptsalot
4. **Win rounds** with logic, wit, and creativity
5. **Get your personality roast** when you give up!

## 🚀 Deployment URLs

After deployment, your services will be available at:
- **Frontend**: `https://sir-interruptsalot-frontend.onrender.com`
- **Backend API**: `https://sir-interruptsalot-backend.onrender.com`

## 🔧 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify `VITE_API_BASE_URL` is set correctly
   - Check backend service is running

2. **Build Failures**
   - Ensure all dependencies are installed
   - Check Node.js and Python versions

3. **Environment Variables**
   - Verify API keys are set in Render dashboard
   - Check variable names match exactly

### Logs
- Check Render logs for both services
- Monitor API health endpoint: `/health`

## 📞 Support

For issues:
1. Check Render deployment logs
2. Verify environment variables
3. Test API endpoints
4. Review local development setup

---

**Ready to challenge Sir Interruptsalot? Deploy and start arguing!** ⚔️🎉
