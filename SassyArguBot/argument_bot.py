import asyncio
from anthropic import AsyncAnthropic
import os
from typing import List, Dict, Tuple
import json
import time
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class ArgumentSession:
    start_time: datetime
    user_points: int = 0
    bot_points: int = 0
    argument_history: List[Dict] = None
    is_active: bool = True
    
    def __post_init__(self):
        if self.argument_history is None:
            self.argument_history = []

class SassyArgumentBot:
    def __init__(self, api_key: str):
        self.client = AsyncAnthropic(api_key=api_key)
        self.session = None
        self.SESSION_DURATION = 300  # 5 minutes in seconds
        
    async def start_new_session(self) -> str:
        """Start a new argument session"""
        self.session = ArgumentSession(start_time=datetime.now())
        
        # Simple welcome message asking for the initial statement
        welcome_message = """🔥 **Ready to argue?** 🔥

Give me your strongest opinion or statement about ANYTHING, and I'll tear it apart with maximum sass! 

What's your take? What do you believe in? I'm ready to disagree with whatever you throw at me! 😏"""
        
        self.session.argument_history.append({
            "role": "bot",
            "content": welcome_message,
            "timestamp": datetime.now().isoformat()
        })
        
        return welcome_message
    
    async def get_bot_response(self, user_message: str) -> str:
        """Get a sassy response from the argument bot"""
        if not self.session or not self.session.is_active:
            return "No active session! Start a new argument first."
            
        # Check if session time is up
        if datetime.now() - self.session.start_time > timedelta(seconds=self.SESSION_DURATION):
            self.session.is_active = False
            return await self.end_session()
        
        # Add user message to history
        self.session.argument_history.append({
            "role": "user", 
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Build conversation context
        conversation_context = self._build_conversation_context()
        
        bot_prompt = f"""You are a smart argument bot. Here's the conversation so far:

{conversation_context}

The human just said: "{user_message}"

Choose your speaking style based on the topic:
- Gen Z style: For modern/casual topics (use slang like "bestie", "no cap", "that's cap", "periodt", "slay", "fr fr", "it's giving...", etc.)
- Victorian style: For formal/serious topics (use elaborate language like "I dare say", "most preposterous", "good sir/madam", "one simply cannot", etc.)

Do NOT include any style labels like "Gen Z style:" or "Victorian style:" in your response. Just write the argument directly.

Write a BRIEF natural response (3-4 lines max) that:
1. DISAGREES with their argument using solid reasoning and evidence
2. Mixes logical arguments WITH sassy comebacks throughout - don't separate them
3. Uses your chosen speaking style consistently
4. Stays entertaining while being substantive

Be CONCISE and PUNCHY! Don't ramble - hit them with facts and sass in just a few lines. Make every word count!

IMPORTANT: Do NOT use any asterisk formatting like *adjusts glasses* or markdown like **bold text**. Write naturally like a real person arguing."""

        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=150,
            messages=[{"role": "user", "content": bot_prompt}]
        )
        
        bot_message = response.content[0].text
        self.session.argument_history.append({
            "role": "bot",
            "content": bot_message, 
            "timestamp": datetime.now().isoformat()
        })
        
        return bot_message
    
    async def get_bot_response_with_facts(self, user_message: str, facts: list) -> str:
        """Get a sassy response from the argument bot with factual information"""
        if not self.session or not self.session.is_active:
            return "No active session! Start a new argument first."
            
        # Check if session time is up
        if datetime.now() - self.session.start_time > timedelta(seconds=self.SESSION_DURATION):
            self.session.is_active = False
            return await self.end_session()
        
        # Add user message to history
        self.session.argument_history.append({
            "role": "user", 
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Build conversation context
        conversation_context = self._build_conversation_context()
        
        # Format facts for the prompt
        facts_context = ""
        if facts:
            facts_context = "\n\nFactual Information Available:\n"
            for i, fact in enumerate(facts[:3], 1):
                facts_context += f"• {fact.get('snippet', '')} [SOURCE: {fact.get('link', '')}]\n"
        
        bot_prompt = f"""You are a smart argument bot. Here's the conversation so far:

{conversation_context}

The human just said: "{user_message}"
{facts_context}

Choose your speaking style based on the topic:
- Gen Z style: For modern/casual topics (use slang like "bestie", "no cap", "that's cap", "periodt", "slay", "fr fr", "it's giving...", etc.)
- Victorian style: For formal/serious topics (use elaborate language like "I dare say", "most preposterous", "good sir/madam", "one simply cannot", etc.)

Do NOT include any style labels like "Gen Z style:" or "Victorian style:" in your response. Just write the argument directly.

Write a BRIEF natural response (3-4 lines max) that:
1. DISAGREES with their argument using solid reasoning and evidence
2. Weaves in factual information from the sources above (include [SOURCE: URL] citations)  
3. Mixes logical arguments WITH sassy comebacks throughout - don't separate them
4. Uses your chosen speaking style consistently
5. Stays entertaining while being substantive

Be CONCISE and PUNCHY! Don't ramble - hit them with facts and sass in just a few lines. Make every word count!

IMPORTANT: When you use factual information, include the [SOURCE: URL] citation immediately after the fact.
IMPORTANT: Do NOT use any asterisk formatting like *adjusts glasses* or markdown like **bold text**. Write naturally like a real person arguing."""

        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=180,
            messages=[{"role": "user", "content": bot_prompt}]
        )
        
        bot_message = response.content[0].text
        self.session.argument_history.append({
            "role": "bot",
            "content": bot_message, 
            "timestamp": datetime.now().isoformat()
        })
        
        return bot_message
    
    def _build_conversation_context(self) -> str:
        """Build conversation context from history"""
        context = ""
        for entry in self.session.argument_history[-6:]:  # Last 6 messages
            role = "Human" if entry["role"] == "user" else "Bot"
            context += f"{role}: {entry['content']}\n\n"
        return context
    
    async def judge_argument_round(self, user_message: str, bot_message: str) -> Tuple[int, int, str]:
        """Have a judge LLM pick the winner of this round"""
        judge_prompt = f"""You are a VERY CRITICAL and impartial debate judge. Be STRICT - only award points for genuinely strong arguments.

Human said: "{user_message}"
Bot replied: "{bot_message}"

Evaluate ONLY on argument quality:
- Did they provide solid logic and reasoning?
- Did they back up their claims with evidence or examples?
- Did they address counter-arguments effectively?
- Was their argument well-structured and persuasive?

DO NOT award points for:
- Basic statements without reasoning
- Simple opinions without support
- Just being witty or sassy
- Restating obvious facts

Be harsh but fair. Many rounds should be ties if neither side made a compelling argument.

Respond in this exact JSON format:
{{
    "winner": "human" or "bot" or "tie",
    "explanation": "<brief explanation of why they won or why it's a tie>"
}}"""

        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=200,
            messages=[{"role": "user", "content": judge_prompt}]
        )
        
        try:
            # Extract JSON from response
            response_text = response.content[0].text
            # Find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            json_str = response_text[start_idx:end_idx]
            
            result = json.loads(json_str)
            winner = result["winner"]
            explanation = result["explanation"]
            
            # Award +1 to winner, 0 for ties
            if winner == "human":
                human_points = 1
                bot_points = 0
                self.session.user_points += 1
            elif winner == "bot":
                human_points = 0
                bot_points = 1
                self.session.bot_points += 1
            else:  # tie
                human_points = 0
                bot_points = 0
            
            return human_points, bot_points, explanation
            
        except (json.JSONDecodeError, KeyError):
            # Fallback scoring - tie
            return 0, 0, "Judge had technical difficulties, no points awarded this round."
    
    async def end_session(self) -> str:
        """End the argument session and generate final report"""
        if not self.session:
            return "No active session to end."
            
        self.session.is_active = False
        
        # Determine winner
        if self.session.user_points > self.session.bot_points:
            winner_text = "🎉 CONGRATULATIONS! You WON the argument!"
        elif self.session.bot_points > self.session.user_points:
            winner_text = "😏 The bot DESTROYED you in this argument!"
        else:
            winner_text = "🤝 It's a TIE! You're both equally stubborn!"
        
        # Generate snarky persona report
        persona_report = await self.generate_persona_report()
        
        final_report = f"""
🏁 **ARGUMENT SESSION COMPLETE!** 🏁

⏰ **Time:** 5 minutes of intense arguing
📊 **Final Scores:**
   • You: {self.session.user_points} points
   • Sassy Bot: {self.session.bot_points} points

{winner_text}

---

{persona_report}

---

Thanks for playing! Want to start another argument? 😈
"""
        
        return final_report
    
    async def generate_persona_report(self) -> str:
        """Generate a snarky character analysis based on the argument"""
        conversation_summary = ""
        for entry in self.session.argument_history:
            if entry["role"] == "user":
                conversation_summary += f"Human: {entry['content']}\n"
        
        persona_prompt = f"""Based on this human's arguing style and the things they said during our 5-minute argument, create a SNARKY character profile that roasts them playfully. Here's what they argued about:

{conversation_summary}

Format the response EXACTLY like this structure:

🎭 PERSONALITY ROAST REPORT 🎭

👤 Arguing Persona: "[Creative title like 'The Trust Me Bro Tech Bro' or 'Captain One-Liner']"

🔍 ARGUING STYLE BREAKDOWN:
[3-4 bullet points with percentages about their style, like "• 60% Stubborn repetition • 30% Brand loyalty without evidence"]

💪 STRONGEST TRAITS:
[2-3 bullet points about what they did well in the argument]

🤪 WEAKEST TRAITS:
[2-3 bullet points about their arguing weaknesses, but playfully snarky]

🎯 PERSONALITY SUMMARY:
[A witty paragraph summary of their overall arguing personality]

⭐ FUNNY SCORES (0-100):
[6-8 creative scoring categories with funny names and scores, like "Word Efficiency: 95/100" or "Evidence Usage: 12/100"]

🏆 FINAL VERDICT:
[One sentence final roast or achievement, like "Achievement Unlocked: Master of the Two-Word Comeback"]

Make it entertaining, witty, and playfully snarky but not mean!"""

        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022", 
            max_tokens=600,
            messages=[{"role": "user", "content": persona_prompt}]
        )
        
        return response.content[0].text
    
    def get_time_remaining(self) -> int:
        """Get remaining time in seconds"""
        if not self.session or not self.session.is_active:
            return 0
        
        elapsed = datetime.now() - self.session.start_time
        remaining = self.SESSION_DURATION - elapsed.total_seconds()
        return max(0, int(remaining))
    
    def get_current_scores(self) -> Tuple[int, int]:
        """Get current session scores"""
        if not self.session:
            return 0, 0
        return self.session.user_points, self.session.bot_points 