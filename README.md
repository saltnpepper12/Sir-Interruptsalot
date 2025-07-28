# 🔥 Sir Interruptsalot - The Undefeated Debate Champion

A beautiful React frontend integrated with a powerful FastAPI backend for real-time AI arguments with Claude!

## ✨ Features

- **🎨 Sleek Black Theme** with bright yellow highlights
- **⚡ Real-time AI Arguments** powered by Claude API
- **📊 Live Scoring System** with AI judge
- **⏱️ 5-minute timed sessions**
- **📝 Personality Reports** after each game
- **🔗 Factual Sources** - AI arguments backed by real-time search data with clickable links
- **🚀 Modern Tech Stack** - React + FastAPI + Claude + Serper

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Radix UI** components

### Backend
- **FastAPI** for REST API
- **Claude AI** (Anthropic) for arguments
- **Pydantic** for data validation
- **Uvicorn** ASGI server

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **Anthropic API Key** ([Get one here](https://console.anthropic.com/))

## 🚀 Quick Start

### Option 1: Automatic Setup (Recommended)

**Windows:**
```bash
# Double-click start.bat or run:
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### Option 2: Manual Setup

1. **Clone and navigate:**
   ```bash
   cd Argubot/UI
   ```

2. **Set up backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Create .env file and add your API keys:
   echo "ANTHROPIC_API_KEY=your_anthropic_key_here" > .env
   echo "SERPER_API_KEY=your_serper_key_here" >> .env
   ```

3. **Set up frontend:**
   ```bash
   cd ..
   npm install
   ```

4. **Start both servers:**
   ```bash
   npm run start
   ```

## 🔑 Environment Setup

Create `backend/.env` file:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SERPER_API_KEY=your_serper_api_key_here
```

**Get your API keys:**
- **Anthropic API**: [Anthropic Console](https://console.anthropic.com/) - Powers the AI argument bot
- **Serper API**: [Serper.dev](https://serper.dev/) - Provides real-time factual information and sources

## 📡 API Endpoints

The backend exposes these endpoints:

- `POST /api/session/start` - Start new argument session
- `POST /api/argument` - Send argument and get response
- `GET /api/session/{id}/status` - Get session status
- `POST /api/session/{id}/end` - End session and get report

## 🎮 How to Play

1. **Enter Your Argument** - Type your strongest opinion
2. **Start the Battle** - Click "Start the Argument!"
3. **Argue Back & Forth** - AI will disagree with everything
4. **Get Scored** - AI judge awards points each round
5. **Win or Lose** - See your final score and personality report!

## 🔧 Development

### Run Frontend Only
```bash
npm run dev
```

### Run Backend Only
```bash
npm run backend
```

### Run Both Together
```bash
npm run start
```

## 📦 Build for Production

```bash
npm run build
```

## 🚢 Deployment Options

```bash
# Netlify
npm run deploy:netlify

# Vercel
npm run deploy:vercel

# Surge
npm run deploy:surge
```

## 🎯 Project Structure

```
Argubot/UI/
├── src/
│   ├── App.tsx              # Main React app
│   ├── components/
│   │   ├── Arena.tsx        # Argument interface
│   │   └── ui/              # Reusable components
│   └── styles/
│       └── globals.css      # Global styles
├── backend/
│   ├── app.py              # FastAPI server
│   ├── requirements.txt    # Python dependencies
│   └── .env               # API keys (create this)
├── package.json           # Node.js dependencies
├── start.sh              # Linux/Mac startup
├── start.bat            # Windows startup
└── README.md           # This file
```

## 🐛 Troubleshooting

**Backend not starting?**
- Check Python version: `python --version`
- Install requirements: `pip install -r backend/requirements.txt`
- Verify API key in `backend/.env`

**Frontend not loading?**
- Check Node version: `node --version`
- Clear cache: `npm cache clean --force`
- Reinstall: `rm -rf node_modules && npm install`

**API errors?**
- Verify your Anthropic API key is valid
- Check backend is running on port 8000
- Look for CORS errors in browser console

## 📄 License

MIT License - feel free to use this for your own debate AI projects!

## 🎉 Credits

Built with ❤️ for maximum sass and AI-powered arguments!

---

**Ready to argue?** Start the app and let Sir Interruptsalot tear apart your opinions! 🔥
