import chainlit as cl
import asyncio
import os
from dotenv import load_dotenv
from argument_bot import SassyArgumentBot

# Load environment variables
load_dotenv()

# Global bot instance
bot = None

@cl.on_chat_start
async def start():
    """Initialize the chat session"""
    global bot
    
    # Get API key from environment
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        await cl.Message(
            content="❌ **Error:** ANTHROPIC_API_KEY not found in environment variables!\n\n"
                   "Please set your Claude API key in a `.env` file:\n"
                   "```\nANTHROPIC_API_KEY=your_api_key_here\n```",
            author="System"
        ).send()
        return
    
    # Initialize the bot
    bot = SassyArgumentBot(api_key)
    
    # Welcome message and start session
    welcome_message = await bot.start_new_session()
    
    # Send welcome with instructions
    instructions = """
🔥 **WELCOME TO SASSY ARGUBOT!** 🔥

**Rules of Engagement:**
• 🕐 You have **5 minutes** to argue with me
• 📊 A judge AI will pick the winner of each round (+1 point)
• 🏆 Most points wins!
• 📝 After the argument, you'll get a snarky personality report

**How to Play:**
1. Give me your strongest opinion about ANYTHING
2. I'll disagree and we'll argue back and forth
3. Win rounds with logic, wit, and creativity
4. Have fun and don't take it personally! 😏

---
"""
    
    await cl.Message(content=instructions, author="System").send()
    await cl.Message(content=welcome_message, author="SassyBot").send()
    
    # Show initial status
    await show_status_update(0, 0, 300)

@cl.on_message
async def main(message: cl.Message):
    """Handle user messages and bot responses"""
    global bot
    
    if not bot:
        await cl.Message(
            content="❌ Bot not initialized. Please refresh the page.",
            author="System"
        ).send()
        return
    
    # Check if session is still active
    if not bot.session or not bot.session.is_active:
        if bot.session and bot.session.is_active == False:
            # Session ended, show final results
            final_report = await bot.end_session()
            await cl.Message(content=final_report, author="System").send()
            
            # Ask if they want to play again
            actions = [
                cl.Action(name="play_again", value="new_game", label="🔄 Play Again")
            ]
            await cl.Message(
                content="Want to start a new argument? 😈",
                actions=actions,
                author="System"
            ).send()
        return
    
    user_message = message.content
    
    # Get bot response
    bot_response = await bot.get_bot_response(user_message)
    
    # Check if session ended during response
    if not bot.session.is_active:
        await cl.Message(content=bot_response, author="System").send()
        return
    
    # Send bot response
    await cl.Message(content=bot_response, author="SassyBot").send()
    
    # Judge the exchange and update scores
    try:
        user_points, bot_points, explanation = await bot.judge_argument_round(user_message, bot_response)
        
        # Show scoring update
        judge_message = f"""
🧑‍⚖️ **JUDGE'S RULING:**

**This Round:**
{"• 🏆 You WIN this round! (+1 point)" if user_points > 0 else "• 🏆 SassyBot WINS this round! (+1 point)" if bot_points > 0 else "• 🤝 TIE - No points awarded (need stronger arguments!)"}

💭 **Judge's Reasoning:** {explanation}
"""
        await cl.Message(content=judge_message, author="Judge").send()
        
        # Show updated status
        total_user, total_bot = bot.get_current_scores()
        time_remaining = bot.get_time_remaining()
        await show_status_update(total_user, total_bot, time_remaining)
        
    except Exception as e:
        await cl.Message(
            content=f"⚠️ Judge had technical difficulties: {str(e)}",
            author="System"
        ).send()

@cl.action_callback("play_again")
async def play_again(action):
    """Handle play again action"""
    global bot
    
    if bot:
        # Start new session
        welcome_message = await bot.start_new_session()
        await cl.Message(content="🔄 **NEW ARGUMENT STARTED!** Let's go again!\n\n" + welcome_message, author="SassyBot").send()
        await show_status_update(0, 0, 300)

async def show_status_update(user_points: int, bot_points: int, time_remaining: int):
    """Show current game status"""
    minutes = time_remaining // 60
    seconds = time_remaining % 60
    
    # Determine who's winning
    if user_points > bot_points:
        status_emoji = "🔥"
        status_text = "You're WINNING!"
    elif bot_points > user_points:
        status_emoji = "😏"  
        status_text = "Bot is WINNING!"
    else:
        status_emoji = "⚔️"
        status_text = "It's a TIE!"
    
    status_message = f"""
{status_emoji} **ARGUMENT STATUS** {status_emoji}

⏱️ **Time Remaining:** {minutes}:{seconds:02d}
📊 **Current Scores:**
   • You: **{user_points}** points
   • SassyBot: **{bot_points}** points

🎯 **Status:** {status_text}

Keep arguing! Every exchange counts! 💪
"""
    
    await cl.Message(content=status_message, author="Scoreboard").send()

if __name__ == "__main__":
    cl.run() 