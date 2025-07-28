import anthropic
import os
from datetime import datetime
from dataclasses import dataclass
from typing import List, Dict, Any
import uuid

@dataclass
class ArgumentSession:
    session_id: str = None
    start_time: datetime = None
    is_active: bool = False
    user_score: int = 0
    bot_score: int = 0
    argument_history: List[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.session_id is None:
            self.session_id = str(uuid.uuid4())
        if self.start_time is None:
            self.start_time = datetime.now()
        if self.argument_history is None:
            self.argument_history = []

class SassyArgumentBot:
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")
        
        # Clear all proxy environment variables that cause issues with anthropic
        proxy_vars = [
            'HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy',
            'HTTP_PROXY_PORT', 'HTTPS_PROXY_PORT', 'NO_PROXY', 'no_proxy',
            'ALL_PROXY', 'all_proxy', 'FTP_PROXY', 'ftp_proxy'
        ]
        for var in proxy_vars:
            if var in os.environ:
                del os.environ[var]
        
        self.client = anthropic.Anthropic(api_key=api_key)
        self.session = None

    async def get_bot_response(self, user_message: str) -> str:
        """Get bot's argument response"""
        if not self.session:
            raise ValueError("No active session")
        
        # Build conversation context
        conversation_context = ""
        for entry in self.session.argument_history[-6:]:  # Last 6 exchanges
            role = entry["role"]
            content = entry["content"]
            conversation_context += f"{role.title()}: {content}\n"
        
        bot_prompt = f"""You are a smart argument bot. Here's the conversation so far:
        {conversation_context}
        The human just said: "{user_message}"
        
        Choose your speaking style based on the topic:
        - Gen Z style: For modern/casual topics (use slang like "bestie", "no cap", "that's cap", "periodt", "slay", "fr fr", "it's giving...", etc.)
        - Victorian style: For formal/serious topics (use elaborate language like "I dare say", "most preposterous", "good sir/madam", "one simply cannot", etc.)
        
        Do NOT include any style labels like "Gen Z style:" or "Victorian style:" in your response. Just write the argument directly.
        
        Write a BRIEF natural response (3-4 lines max) that:
        1. DISAGREES with their argument using solid reasoning
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
        """Get bot's argument response with factual information"""
        if not self.session:
            raise ValueError("No active session")
        
        # Build conversation context
        conversation_context = ""
        for entry in self.session.argument_history[-6:]:  # Last 6 exchanges
            role = entry["role"]
            content = entry["content"]
            conversation_context += f"{role.title()}: {content}\n"
        
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
            max_tokens=180, # Adjusted for brevity
            messages=[{"role": "user", "content": bot_prompt}]
        )
        
        bot_message = response.content[0].text
        self.session.argument_history.append({
            "role": "bot",
            "content": bot_message, 
            "timestamp": datetime.now().isoformat()
        })
        
        return bot_message

    async def judge_argument_round(self, user_message: str, bot_message: str) -> Dict[str, Any]:
        """Judge who won the argument round"""
        judge_prompt = f"""You are an impartial debate judge. Analyze this argument exchange:

        Human: "{user_message}"
        Bot: "{bot_message}"

        Judge who made the stronger argument based on:
        1. Logical reasoning and evidence
        2. Clarity and persuasiveness
        3. Addressing the opponent's points
        4. Originality and creativity

        Be CRITICAL and UNBIASED. Only award points for genuinely strong arguments.
        If both arguments are equally weak or strong, declare a tie.

        Respond with ONLY a JSON object like this:
        {{
            "winner": "user" or "bot" or "tie",
            "reasoning": "Brief explanation of your decision"
        }}"""

        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=200,
            messages=[{"role": "user", "content": judge_prompt}]
        )
        
        try:
            import json
            result = json.loads(response.content[0].text)
            return result
        except:
            # Fallback if JSON parsing fails
            return {
                "winner": "tie",
                "reasoning": "Unable to parse judge response"
            }

    async def generate_persona_report(self) -> str:
        """Generate a personality report based on the argument session"""
        if not self.session or not self.session.argument_history:
            return "No argument data available for personality analysis."
        
        # Build conversation summary
        conversation_summary = ""
        for entry in self.session.argument_history:
            role = entry["role"]
            content = entry["content"]
            conversation_summary += f"{role.title()}: {content}\n"
        
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
        """Get time remaining in seconds"""
        if not self.session or not self.session.start_time:
            return 0
        
        elapsed = (datetime.now() - self.session.start_time).total_seconds()
        remaining = max(0, 300 - elapsed)  # 5 minutes = 300 seconds
        return int(remaining) 