# 🔥 Sassy ArguBot 🔥

A hilarious AI-powered argument bot that will disagree with everything you say! Built for hackathons and fun times.

## 🎯 What is this?

Sassy ArguBot is a 5-minute argument game where you debate a sassy AI bot while a judge AI scores your performance. After the heated debate, you'll receive a snarky personality report based on your arguing style!

## ✨ Features

- 🤖 **Sassy AI Opponent**: A Claude-powered bot that disagrees with everything
- ⚖️ **Judge AI**: Impartial AI judge scores each exchange (1-10 points)
- ⏱️ **5-Minute Rounds**: Intense, timed argument sessions
- 📊 **Live Scoring**: Real-time point tracking and status updates
- 📝 **Personality Reports**: Snarky character analysis after each game
- 🔄 **Play Again**: Multiple rounds of endless arguing fun
- 💬 **Beautiful UI**: Powered by Chainlit for smooth chat experience

## 🛠️ Setup

### Prerequisites
- Python 3.8+
- Claude API key from Anthropic

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd SassyArguBot
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up your Claude API key:**
   Create a `.env` file in the project root:
   ```bash
   ANTHROPIC_API_KEY=your_claude_api_key_here
   ```

4. **Run the application:**
   ```bash
   chainlit run app.py
   ```

5. **Open your browser and navigate to:** `http://localhost:8000`

## 🎮 How to Play

1. **Start the Game**: The bot will greet you with a sassy welcome
2. **Pick Your Battle**: Argue about ANYTHING - politics, pineapple on pizza, whether hot dogs are sandwiches
3. **Keep It Going**: The bot will disagree with everything you say
4. **Get Scored**: A judge AI rates each exchange on logic, creativity, and wit
5. **Watch the Clock**: You have 5 minutes to rack up points
6. **Get Roasted**: Receive your personalized snarky character report
7. **Play Again**: Challenge the bot to another round!

## 🏆 Scoring System

The Judge AI scores each exchange based on:
- **Logic & Reasoning** (1-10 points)
- **Persuasiveness** (1-10 points)  
- **Creativity & Wit** (1-10 points)
- **Argument Strength** (1-10 points)
- **Entertainment Value** (1-10 points)

## 🎭 Features Breakdown

### The Sassy Bot
- Programmed to disagree with everything
- Uses wit, sarcasm, and clever comebacks
- Keeps arguments fun and entertaining
- Never genuinely offensive - just playfully sassy

### The Judge AI
- Impartial scoring of each exchange
- Detailed explanations for point awards
- Considers multiple argument quality factors
- Provides real-time feedback

### Personality Reports
- Generated based on your arguing style
- Includes snarky titles and quantified traits
- Roasts you playfully without being mean
- Fun personality test-style results

## 🔧 Technical Details

### Built With
- **Chainlit**: Beautiful chat interface
- **Claude AI**: Anthropic's language model for bot and judge
- **Python**: Backend logic and session management
- **Async**: Non-blocking operations for smooth UX

### Project Structure
```
SassyArguBot/
├── app.py              # Main Chainlit application
├── argument_bot.py     # Core bot logic and AI integration
├── requirements.txt    # Python dependencies
├── .env               # Environment variables (create this)
└── README.md          # This file
```

## 🚀 Hackathon Ready

This project is perfect for:
- **Hackathons**: Fun, interactive AI demo
- **Tech demos**: Showcasing conversational AI
- **Entertainment**: Hours of hilarious arguments
- **Learning**: Understanding AI conversation flows

## 🎯 Customization Ideas

Want to make it your own? Try:
- Different argument topics or themes
- Varying time limits (1 min speed rounds, 10 min deep debates)
- Team vs team argument modes
- Different bot personalities (formal debater, conspiracy theorist, etc.)
- Custom scoring criteria
- Tournament brackets

## 🐛 Troubleshooting

**Bot not responding?**
- Check your Claude API key in `.env`
- Ensure you have credits in your Anthropic account

**Chainlit not starting?**
- Try: `pip install --upgrade chainlit`
- Make sure you're in the right directory

**Scoring issues?**
- The judge AI sometimes has parsing issues - it will fallback to default scores

## 🎉 Have Fun!

This is meant to be silly, fun, and entertaining. Don't take the arguments seriously - it's all about having a good time and seeing what creative arguments you can come up with!

---

*Built with ❤️ and a healthy dose of sass for your hackathon enjoyment!* 