from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv
import sys
import asyncio
import requests
import json
from datetime import datetime
from typing import List, Dict

# Add the SassyArguBot directory to the path so we can import the bot
sys.path.append(os.path.join(os.path.dirname(__file__), "../../../SassyArguBot"))
from argument_bot import SassyArgumentBot

# Load environment variables
load_dotenv()

app = FastAPI(title="Sir Interruptsalot API", description="The Undefeated Debate Champion API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global bot instance and sessions storage
bots: Dict[str, SassyArgumentBot] = {}

# Serper API function for real fact-checking
async def search_facts(query: str) -> List[Dict]:
    """Search for factual information using Serper API"""
    serper_api_key = os.getenv("SERPER_API_KEY")
    if not serper_api_key:
        return []
    
    url = "https://google.serper.dev/search"
    payload = json.dumps({
        "q": query,
        "num": 3  # Get top 3 results
    })
    headers = {
        'X-API-KEY': serper_api_key,
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.request("POST", url, headers=headers, data=payload)
        data = response.json()
        
        facts = []
        if 'organic' in data:
            for result in data['organic'][:3]:  # Top 3 results
                facts.append({
                    "title": result.get('title', ''),
                    "snippet": result.get('snippet', ''),
                    "link": result.get('link', ''),
                    "source": result.get('link', '').split('/')[2] if result.get('link') else ''
                })
        return facts
    except Exception as e:
        print(f"Serper API error: {e}")
        return []

# Pydantic models for API requests/responses
class StartSessionRequest(BaseModel):
    initial_message: str

class ArgumentRequest(BaseModel):
    session_id: str
    message: str

class SourceInfo(BaseModel):
    title: str
    url: str
    snippet: str

class ArgumentResponse(BaseModel):
    bot_response: str
    user_points: int
    bot_points: int
    judge_explanation: str
    session_active: bool
    time_remaining: int
    status_update: str
    sources: List[SourceInfo] = []

class SessionResponse(BaseModel):
    session_id: str
    message: str
    session_active: bool = True

@app.get("/")
async def root():
    return {"message": "Sir Interruptsalot API is running!"}

@app.post("/api/session/start", response_model=SessionResponse)
async def start_session(request: StartSessionRequest):
    """Start a new argument session with initial user message"""
    try:
        # Get API key
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")
        
        # Create new bot instance and session
        bot = SassyArgumentBot(api_key)
        # Initialize session manually without welcome message
        from argument_bot import ArgumentSession
        bot.session = ArgumentSession(start_time=datetime.now())
        
        # Search for facts related to the initial argument
        search_query = f"{request.initial_message} facts statistics data research"
        facts = await search_facts(search_query)
        
        # Process the initial user message with facts
        bot_response = await bot.get_bot_response_with_facts(request.initial_message, facts)
        
        # Generate a simple session ID (in production, use UUID)
        session_id = f"session_{len(bots) + 1}_{int(asyncio.get_event_loop().time())}"
        bots[session_id] = bot
        
        # Return just the bot response (frontend handles welcome message)
        # bot_response already contains the sassy AI response

        return SessionResponse(
            session_id=session_id,
            message=bot_response,
            session_active=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")

@app.post("/api/argument", response_model=ArgumentResponse)
async def send_argument(request: ArgumentRequest):
    """Send user argument and get bot response with scoring"""
    try:
        # Get bot instance
        if request.session_id not in bots:
            raise HTTPException(status_code=404, detail="Session not found")
        
        bot = bots[request.session_id]
        
        # Check if session is still active
        if not bot.session or not bot.session.is_active:
            return ArgumentResponse(
                bot_response="Session has ended! Time's up!",
                user_points=bot.session.user_points if bot.session else 0,
                bot_points=bot.session.bot_points if bot.session else 0,
                judge_explanation="Session expired",
                session_active=False,
                time_remaining=0,
                status_update="",
                sources=[]
            )
        
        # Search for facts related to the user's argument
        search_query = f"{request.message} facts statistics data research"
        facts = await search_facts(search_query)
        
        # Get bot response with factual information
        bot_response = await bot.get_bot_response_with_facts(request.message, facts)
        
        # Judge the argument round
        try:
            user_points, bot_points, explanation = await bot.judge_argument_round(request.message, bot_response)
        except Exception as e:
            # Fallback if judging fails
            user_points, bot_points, explanation = 0, 0, f"Judge error: {str(e)}"
        
        # Get current state
        total_user_points = bot.session.user_points
        total_bot_points = bot.session.bot_points
        time_remaining = bot.get_time_remaining()
        session_active = bot.session.is_active
        
        # Generate status update (from Chainlit app.py)
        status_update = generate_status_update(total_user_points, total_bot_points, time_remaining)
        
        # Convert facts to SourceInfo format
        sources = [
            SourceInfo(
                title=fact.get('title', ''),
                url=fact.get('link', ''),
                snippet=fact.get('snippet', '')
            ) for fact in facts
        ]
        
        return ArgumentResponse(
            bot_response=bot_response,
            user_points=total_user_points,
            bot_points=total_bot_points,
            judge_explanation=explanation,
            session_active=session_active,
            time_remaining=time_remaining,
            status_update=status_update,
            sources=sources
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process argument: {str(e)}")

@app.get("/api/session/{session_id}/status")
async def get_session_status(session_id: str):
    """Get current session status"""
    if session_id not in bots:
        raise HTTPException(status_code=404, detail="Session not found")
    
    bot = bots[session_id]
    if not bot.session:
        raise HTTPException(status_code=404, detail="No active session")
    
    return {
        "session_active": bot.session.is_active,
        "user_points": bot.session.user_points,
        "bot_points": bot.session.bot_points,
        "time_remaining": bot.get_time_remaining()
    }

@app.post("/api/session/{session_id}/end")
async def end_session(session_id: str):
    """End session and get personality report"""
    if session_id not in bots:
        raise HTTPException(status_code=404, detail="Session not found")
    
    bot = bots[session_id]
    if not bot.session:
        raise HTTPException(status_code=404, detail="No active session")
    
    try:
        final_report = await bot.end_session()
        # Clean up session
        del bots[session_id]
        
        return {
            "final_report": final_report,
            "user_points": bot.session.user_points,
            "bot_points": bot.session.bot_points
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")

def generate_status_update(user_points: int, bot_points: int, time_remaining: int) -> str:
    """Generate status update message (from Chainlit app.py)"""
    minutes = time_remaining // 60
    seconds = time_remaining % 60
    
    # Determine who's winning
    if user_points > bot_points:
        status_emoji = "🔥"
        status_text = "You're WINNING!"
    elif bot_points > user_points:
        status_emoji = "😏"  
        status_text = "Sir Interruptsalot is WINNING!"
    else:
        status_emoji = "⚔️"
        status_text = "It's a TIE!"
    
    status_message = f"""{status_emoji} **ARGUMENT STATUS** {status_emoji}

⏱️ **Time Remaining:** {minutes}:{seconds:02d}
📊 **Current Scores:**
   • You: **{user_points}** points
   • Sir Interruptsalot: **{bot_points}** points

🎯 **Status:** {status_text}

Keep arguing! Every exchange counts! 💪"""
    
    return status_message

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 