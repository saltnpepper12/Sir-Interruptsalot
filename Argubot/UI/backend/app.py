from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime
import requests
import json
import sys
import httpx
import anthropic

# Add the current directory to Python path
sys.path.append(os.path.dirname(__file__))

from argument_bot import SassyArgumentBot, ArgumentSession

app = FastAPI(
    title="Sir Interruptsalot API",
    description="The Undefeated Debate Champion - AI Argument Bot API",
    version="1.0.0"
)

# Configure CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global bot instance
bot = SassyArgumentBot()

class ArgumentRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ArgumentResponse(BaseModel):
    bot_response: str
    session_id: str
    user_score: int
    bot_score: int
    time_remaining: int
    game_ended: bool
    sources: List[dict] = []
    status_update: Optional[str] = None

class SourceInfo(BaseModel):
    title: str
    link: str
    snippet: str

@app.get("/")
async def root():
    return {
        "message": "Welcome to Sir Interruptsalot API!",
        "description": "The Undefeated Debate Champion",
        "endpoints": {
            "start_session": "POST /start_session",
            "send_argument": "POST /send_argument",
            "end_session": "POST /end_session",
            "health": "GET /health"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Sir Interruptsalot API"}

@app.get("/test_api")
async def test_api():
    """Test endpoint to check if Anthropic API key is working"""
    try:
        print("=== TESTING ANTHROPIC API KEY ===")
        
        # Test 1: Check if API key exists
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            print("❌ ERROR: ANTHROPIC_API_KEY not found in environment")
            return {"error": "ANTHROPIC_API_KEY not found", "status": "failed"}
        
        print(f"✅ API Key found: {api_key[:10]}...{api_key[-4:]}")
        
        # Test 2: Try to create Anthropic client
        try:
            test_client = anthropic.Anthropic(api_key=api_key)
            print("✅ Anthropic client created successfully")
        except Exception as e:
            print(f"❌ ERROR creating Anthropic client: {str(e)}")
            return {"error": f"Failed to create client: {str(e)}", "status": "failed"}
        
        # Test 3: Try a simple API call
        try:
            print("🔄 Testing API call...")
            response = test_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=50,
                messages=[{"role": "user", "content": "Say 'Hello World' in one sentence."}]
            )
            
            result = response.content[0].text
            print(f"✅ API call successful! Response: {result}")
            
            return {
                "status": "success",
                "api_key": f"{api_key[:10]}...{api_key[-4:]}",
                "response": result,
                "message": "Anthropic API is working correctly"
            }
            
        except Exception as e:
            print(f"❌ ERROR in API call: {str(e)}")
            return {"error": f"API call failed: {str(e)}", "status": "failed"}
            
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {str(e)}")
        return {"error": f"Unexpected error: {str(e)}", "status": "failed"}

@app.get("/test_serper")
async def test_serper():
    """Test endpoint to check if Serper API key is working"""
    try:
        print("=== TESTING SERPER API KEY ===")
        
        # Test 1: Check if API key exists
        serper_api_key = os.getenv("SERPER_API_KEY")
        if not serper_api_key:
            print("❌ ERROR: SERPER_API_KEY not found in environment")
            return {"error": "SERPER_API_KEY not found", "status": "failed"}
        
        print(f"✅ Serper API Key found: {serper_api_key[:10]}...{serper_api_key[-4:]}")
        
        # Test 2: Try a simple search
        try:
            print("🔄 Testing Serper API call...")
            url = "https://google.serper.dev/search"
            headers = {
                "X-API-KEY": serper_api_key,
                "Content-Type": "application/json"
            }
            payload = {
                "q": "test query",
                "num": 1
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                
                data = response.json()
                print(f"✅ Serper API call successful! Found {len(data.get('organic', []))} results")
                
                return {
                    "status": "success",
                    "api_key": f"{serper_api_key[:10]}...{serper_api_key[-4:]}",
                    "results_count": len(data.get('organic', [])),
                    "message": "Serper API is working correctly"
                }
                
        except Exception as e:
            print(f"❌ ERROR in Serper API call: {str(e)}")
            return {"error": f"Serper API call failed: {str(e)}", "status": "failed"}
            
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {str(e)}")
        return {"error": f"Unexpected error: {str(e)}", "status": "failed"}

async def search_facts(query: str) -> List[dict]:
    """Search for facts using Serper API"""
    serper_api_key = os.getenv("SERPER_API_KEY")
    if not serper_api_key:
        return []
    
    try:
        url = "https://google.serper.dev/search"
        headers = {
            "X-API-KEY": serper_api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "q": query,
            "num": 3
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            facts = []
            
            if "organic" in data:
                for result in data["organic"][:3]:
                    facts.append({
                        "title": result.get("title", ""),
                        "link": result.get("link", ""),
                        "snippet": result.get("snippet", "")
                    })
            
            return facts
    except Exception as e:
        print(f"Error searching facts: {e}")
        return []

def generate_status_update(user_score: int, bot_score: int, time_remaining: int) -> str:
    """Generate a status update message"""
    if time_remaining <= 0:
        return "⏰ Time's up! Final scores are locked in!"
    
    if user_score > bot_score:
        return f"🔥 You're leading {user_score}-{bot_score}! Keep the momentum going!"
    elif bot_score > user_score:
        return f"😈 Sir Interruptsalot is ahead {bot_score}-{user_score}! Time to step up your game!"
    else:
        return f"⚖️ It's a tie at {user_score}-{user_score}! This is getting intense!"

@app.post("/start_session", response_model=ArgumentResponse)
async def start_session(request: ArgumentRequest):
    try:
        print(f"Starting session with message: {request.message}")
        
        # Initialize session with the initial user message
        bot.session = ArgumentSession()
        bot.session.start_time = datetime.now()
        bot.session.is_active = True
        
        print("Session initialized successfully")
        
        # Get facts for the initial argument
        try:
            facts = await search_facts(request.message)
            print(f"Found {len(facts)} facts")
        except Exception as e:
            print(f"Error getting facts: {e}")
            facts = []
        
        # Get bot's first response with facts
        try:
            bot_response = await bot.get_bot_response_with_facts(request.message, facts)
            print(f"Bot response generated: {len(bot_response)} characters")
        except Exception as e:
            print(f"Error getting bot response: {e}")
            bot_response = "I'm ready to argue! What's your point?"
        
        # Format sources for response
        sources = []
        if facts:
            for fact in facts:
                sources.append({
                    "title": fact.get("title", ""),
                    "link": fact.get("link", ""),
                    "snippet": fact.get("snippet", "")
                })
        
        # Generate initial status update
        status_update = None  # No judge insights on first message
        
        response = ArgumentResponse(
            bot_response=bot_response,
            session_id=bot.session.session_id,
            user_score=bot.session.user_score,
            bot_score=bot.session.bot_score,
            time_remaining=300,  # 5 minutes
            game_ended=False,
            sources=sources,
            status_update=status_update
        )
        
        print("Session started successfully")
        return response
        
    except Exception as e:
        print(f"Error in start_session: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error starting session: {str(e)}")

@app.post("/send_argument", response_model=ArgumentResponse)
async def send_argument(request: ArgumentRequest):
    try:
        if not bot.session or not bot.session.is_active:
            raise HTTPException(status_code=400, detail="No active session")
        
        # Check if time is up
        elapsed_time = (datetime.now() - bot.session.start_time).total_seconds()
        if elapsed_time >= 300:  # 5 minutes
            bot.session.is_active = False
            return ArgumentResponse(
                bot_response="⏰ Time's up! The argument session has ended.",
                session_id=bot.session.session_id,
                user_score=bot.session.user_score,
                bot_score=bot.session.bot_score,
                time_remaining=0,
                game_ended=True,
                sources=[]
            )
        
        # Get facts for the argument
        facts = await search_facts(request.message)
        
        # Get bot response with facts
        bot_response = await bot.get_bot_response_with_facts(request.message, facts)
        
        # Judge the round
        judge_result = await bot.judge_argument_round(request.message, bot_response)
        
        # Update scores
        if judge_result["winner"] == "user":
            bot.session.user_score += 1
        elif judge_result["winner"] == "bot":
            bot.session.bot_score += 1
        
        # Format sources for response
        sources = []
        if facts:
            for fact in facts:
                sources.append({
                    "title": fact.get("title", ""),
                    "link": fact.get("link", ""),
                    "snippet": fact.get("snippet", "")
                })
        
        time_remaining = max(0, 300 - int(elapsed_time))
        
        # Use the actual judge reasoning instead of generic status update
        judge_insight = judge_result.get("reasoning", "Judge was unable to provide reasoning for this round.")
        
        return ArgumentResponse(
            bot_response=bot_response,
            session_id=bot.session.session_id,
            user_score=bot.session.user_score,
            bot_score=bot.session.bot_score,
            time_remaining=time_remaining,
            game_ended=False,
            sources=sources,
            status_update=judge_insight
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing argument: {str(e)}")

@app.post("/end_session")
async def end_session(request: ArgumentRequest):
    try:
        if not bot.session:
            raise HTTPException(status_code=400, detail="No active session")
        
        # Generate personality report
        report = await bot.generate_persona_report()
        
        # End the session
        bot.session.is_active = False
        
        return {
            "session_id": bot.session.session_id,
            "final_report": report,
            "final_scores": {
                "user": bot.session.user_score,
                "bot": bot.session.bot_score
            },
            "total_time": (datetime.now() - bot.session.start_time).total_seconds()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ending session: {str(e)}") 