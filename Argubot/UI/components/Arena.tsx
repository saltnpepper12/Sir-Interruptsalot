import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ArrowLeft, Clock, Send, Trophy, ExternalLink, Flag, ChevronDown, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface ArenaProps {
  roomName: string;
  onBack: () => void;
  initialUserMessage?: string;
}

// Funny/sarcastic AI thinking status messages
const thinkingStatuses = [
  "researching how many green bubblers are single",
  "studying android user poverty levels",
  "calculating the economic impact of having an opinion",
  "consulting the ancient scrolls of Wikipedia",
  "asking my mom for advice",
  "generating statistics that sound believable",
  "cross-referencing with my gut feeling",
  "polling my imaginary focus group",
  "checking if this violates any terms of service",
  "wondering why humans argue about everything",
  "contemplating the meaning of being right on the internet",
  "analyzing the philosophical implications of your stance"
];

// Mock research sources
const mockSources = [
  { title: "Android Usage Statistics 2025", url: "https://www.demandsage.com/android-statistics/" },
  { title: "Global Bubble Preferences Study", url: "https://www.bubbleresearch.org/studies/2024" },
  { title: "Economic Impact of Mobile Platforms", url: "https://www.techeconomics.com/mobile-impact" },
  { title: "Consumer Behavior Analysis Report", url: "https://www.marketinsights.com/consumer-behavior" },
  { title: "Digital Lifestyle Demographics", url: "https://www.digitaldemographics.net/lifestyle-study" }
];

export function Arena({ roomName, onBack, initialUserMessage }: ArenaProps) {
  const [argument, setArgument] = useState("");
  const [sessionTimeLeft, setSessionTimeLeft] = useState(300);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [messages, setMessages] = useState<Array<{text: string, sender: 'user' | 'ai', sources?: Array<{title: string, url: string, snippet: string}>}>>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [debateTopic, setDebateTopic] = useState(roomName);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [currentJudgeRuling, setCurrentJudgeRuling] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [surrenderHover, setSurrenderHover] = useState(false);
  const hasInitialized = React.useRef(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isSurrendering, setIsSurrendering] = useState(false);
  const [cookingMessageIndex, setCookingMessageIndex] = useState(0);

  // Fun cooking messages
  const cookingMessages = [
    "Sir Interruptsalot is preparing your personality roast...",
    "Mixing sass with scientific precision...",
    "Adding a dash of brutal honesty...",
    "Seasoning your roast with facts...",
    "Letting the argument analysis simmer...",
    "Garnishing with devastating insights...",
    "Plating up your personality breakdown..."
  ];

  // Auto-start with initial message (only once)
  useEffect(() => {
    if (initialUserMessage && !gameStarted && !sessionId && !hasInitialized.current) {
      console.log('🎯 useEffect triggered - starting session');
      hasInitialized.current = true;
      startArgumentSession(initialUserMessage);
    }
  }, [initialUserMessage]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cycle cooking messages when surrendering
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isSurrendering) {
      interval = setInterval(() => {
        setCookingMessageIndex(prev => (prev + 1) % cookingMessages.length);
      }, 2000); // Change message every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSurrendering, cookingMessages.length]);

  // API Functions
  const startArgumentSession = async (initialMessage: string) => {
    try {
      console.log('🚀 Starting argument session with:', initialMessage);
      setIsAiThinking(true);
      setGameStarted(true);
      setIsSessionActive(true);
      setMessages([{ text: initialMessage, sender: 'user' }]);
      
      const response = await fetch(`${API_BASE_URL}/api/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_message: initialMessage })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start session');
      }
      
      const data = await response.json();
      console.log('📥 Session start response:', data);
      setSessionId(data.session_id);
      setIsAiThinking(false);
      
      // Add just the bot's response (no welcome message in chat)
      console.log('💬 Adding bot message to chat');
      setMessages(prev => [...prev, { text: data.message, sender: 'ai' }]);
      setIsUserTurn(true);
    } catch (error) {
      console.error('Error starting session:', error);
      setIsAiThinking(false);
      setMessages(prev => [...prev, { 
        text: 'Sorry, Sir Interruptsalot had trouble connecting to his debate circuits. Please try again!', 
        sender: 'ai' 
      }]);
    }
  };

  const sendArgumentToAPI = async (message: string) => {
    if (!sessionId) return;
    
    try {
      console.log('📤 Sending argument to API:', message);
      setIsAiThinking(true);
      setIsUserTurn(false);
      
      // Clear previous judge ruling and status for new round
      setCurrentJudgeRuling(null);
      setCurrentStatus(null);
      
      const response = await fetch(`${API_BASE_URL}/api/argument`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: sessionId, 
          message: message 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send argument');
      }
      
      const data = await response.json();
      setIsAiThinking(false);
      
      // Update scores
      setPlayerScore(data.user_points);
      setAiScore(data.bot_points);
      setSessionTimeLeft(data.time_remaining);
      
      // Add ONLY bot response to chat
      setMessages(prev => [...prev, { text: data.bot_response, sender: 'ai', sources: data.sources }]);
      
      // Update separate UI boxes for judge and status
      if (data.judge_explanation && data.judge_explanation !== "Judge had technical difficulties, no points awarded this round.") {
        setCurrentJudgeRuling(data.judge_explanation);
      }
      
      if (data.status_update) {
        setCurrentStatus(data.status_update);
      }
      
      // Check if session ended
      if (!data.session_active) {
        setIsSessionActive(false);
        await endSession();
      } else {
        setIsUserTurn(true);
      }
    } catch (error) {
      console.error('Error sending argument:', error);
      setIsAiThinking(false);
      setMessages(prev => [...prev, { 
        text: 'Oops! Sir Interruptsalot\'s debate circuits got crossed. Try that again!', 
        sender: 'ai' 
      }]);
      setIsUserTurn(true);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/end`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setFinalReport(data.final_report);
        setGameEnded(true);
        setIsSurrendering(false); // Clear loading state
        setCookingMessageIndex(0); // Reset message index
      }
    } catch (error) {
      console.error('Error ending session:', error);
      setIsSurrendering(false); // Clear loading state on error
      setCookingMessageIndex(0); // Reset message index
    }
  };

  // Session timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isSessionActive && sessionTimeLeft > 0) {
      interval = setInterval(() => {
        setSessionTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            setIsSessionActive(false);
            endSession();
            return 0;
          }
          return timeLeft - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, sessionTimeLeft]);



  // Cycling status messages effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isAiThinking) {
      interval = setInterval(() => {
        setCurrentStatusIndex(prev => (prev + 1) % thinkingStatuses.length);
      }, 2000); // Change status every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAiThinking, thinkingStatuses.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  const handleSubmitArgument = () => {
    if (argument.trim() && isUserTurn && sessionId) {
      const messageText = argument.trim();
      
      // Add user message to conversation
      setMessages(prev => [...prev, { text: messageText, sender: 'user' }]);
      setArgument("");
      
      // Send to API
      sendArgumentToAPI(messageText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitArgument();
    }
  };

  const handleSurrender = async () => {
    if (sessionId && isSessionActive) {
      setIsSurrendering(true);
      setIsSessionActive(false);
      
      // Set a fallback timeout in case the API takes too long
      const timeout = setTimeout(() => {
        setIsSurrendering(false);
        setCookingMessageIndex(0);
        console.log('Surrender timeout - clearing loading state');
      }, 15000); // 15 seconds max
      
      try {
        await endSession();
        clearTimeout(timeout);
      } catch (error) {
        clearTimeout(timeout);
        setIsSurrendering(false);
        setCookingMessageIndex(0);
        console.error('Error during surrender:', error);
      }
      // Loading state will be cleared when gameEnded becomes true
    }
  };

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const parseReportSections = (report: string) => {
    const sections = [];
    
    // Extract persona
    const personaMatch = report.match(/👤 Arguing Persona: (.+?)(?=\n|$)/);
    if (personaMatch) {
      sections.push({
        id: 'persona',
        title: '👤 Your Arguing Persona',
        content: personaMatch[1],
        icon: '👤'
      });
    }

    // Extract style breakdown
    const styleMatch = report.match(/🔍 ARGUING STYLE BREAKDOWN:\s*((?:.*\n?)*?)(?=💪|$)/);
    if (styleMatch) {
      sections.push({
        id: 'style',
        title: '🔍 Arguing Style Breakdown',
        content: styleMatch[1].trim(),
        icon: '🔍'
      });
    }

    // Extract strongest traits
    const strongMatch = report.match(/💪 STRONGEST TRAITS:\s*((?:.*\n?)*?)(?=🤪|$)/);
    if (strongMatch) {
      sections.push({
        id: 'strong',
        title: '💪 Strongest Traits',
        content: strongMatch[1].trim(),
        icon: '💪'
      });
    }

    // Extract weakest traits
    const weakMatch = report.match(/🤪 WEAKEST TRAITS:\s*((?:.*\n?)*?)(?=🎯|$)/);
    if (weakMatch) {
      sections.push({
        id: 'weak',
        title: '🤪 Weakest Traits',
        content: weakMatch[1].trim(),
        icon: '🤪'
      });
    }

    // Extract summary
    const summaryMatch = report.match(/🎯 PERSONALITY SUMMARY:\s*((?:.*\n?)*?)(?=⭐|$)/);
    if (summaryMatch) {
      sections.push({
        id: 'summary',
        title: '🎯 Personality Summary',
        content: summaryMatch[1].trim(),
        icon: '🎯'
      });
    }

    // Extract scores
    const scoresMatch = report.match(/⭐ FUNNY SCORES \(0-100\):\s*((?:.*\n?)*?)(?=🏆|$)/);
    if (scoresMatch) {
      sections.push({
        id: 'scores',
        title: '⭐ Funny Scores (0-100)',
        content: scoresMatch[1].trim(),
        icon: '⭐'
      });
    }

    // Extract final verdict
    const verdictMatch = report.match(/🏆 FINAL VERDICT:\s*((?:.*\n?)*?)$/);
    if (verdictMatch) {
      sections.push({
        id: 'verdict',
        title: '🏆 Final Verdict',
        content: verdictMatch[1].trim(),
        icon: '🏆'
      });
    }

    return sections;
  };



  // Show loading screen when surrendering
  if (isSurrendering && !gameEnded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
        {/* Background sparkles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 20 + 10}px`
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          >
            ✨
          </motion.div>
        ))}
        
        <div className="text-center max-w-md mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: [
                '0 0 40px rgba(255, 205, 26, 0.1)',
                '0 0 60px rgba(255, 205, 26, 0.2)',
                '0 0 40px rgba(255, 205, 26, 0.1)'
              ]
            }}
            transition={{ 
              duration: 0.5,
              boxShadow: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className="mb-8 p-8 rounded-3xl border border-yellow/20 bg-gradient-to-br from-yellow/5 to-yellow/10"
            style={{ 
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Cooking Animation */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-6xl absolute inset-0 flex items-center justify-center"
              >
                🍳
              </motion.div>
              
              {/* Steam effects */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute text-lg"
                  style={{
                    left: `${30 + i * 20}%`,
                    top: `${10 + i * 5}%`,
                  }}
                  animate={{ 
                    y: [-20, -40, -20],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3
                  }}
                >
                  💨
                </motion.div>
              ))}
            </div>
            
            <motion.h2 
              className="text-3xl font-bold text-yellow mb-4" 
              style={{ color: '#ffcd1a' }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Let him cook! 👨‍🍳
            </motion.h2>
            
            <motion.p 
              key={cookingMessageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-lg text-muted-foreground mb-6"
            >
              {cookingMessages[cookingMessageIndex]}
            </motion.p>
            
            {/* Loading dots */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-yellow rounded-full"
                  style={{ backgroundColor: '#ffcd1a' }}
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
            
            <motion.p 
              className="text-sm text-muted-foreground mt-6"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Generating your epic roast report...
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show final report if game ended
  if (gameEnded && finalReport) {
    return (
      <div className="min-h-screen bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Start
            </Button>
            
            {/* Game Over Header */}
            <Card className="p-6 bg-card border-2 border-yellow mb-6" style={{ backgroundColor: '#0a0a0a', borderColor: '#ffcd1a' }}>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-yellow mb-4" style={{ color: '#ffcd1a' }}>🎉 Game Over! 🎉</h1>
                <div className="flex justify-center gap-8 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow" style={{ color: '#ffcd1a' }}>{playerScore}</div>
                    <div className="text-sm text-muted-foreground">Your Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow" style={{ color: '#ffcd1a' }}>{aiScore}</div>
                    <div className="text-sm text-muted-foreground">AI Points</div>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground">
                  {playerScore > aiScore ? "🏆 You won!" : playerScore < aiScore ? "🤖 Sir Interruptsalot destroyed you!" : "🤝 It's a tie!"}
                </p>
              </div>
            </Card>

            {/* Personality Report Cards */}
            <div className="space-y-4 mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-yellow mb-2" style={{ color: '#ffcd1a' }}>
                  🎭 Your Personality Report
                </h2>
                <p className="text-sm text-muted-foreground">
                  Click on each card below to see your roast report! 👇
                </p>
              </div>
              
              {parseReportSections(finalReport).map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card 
                    className="border-2 border-border hover:border-yellow/50 hover:shadow-lg hover:shadow-yellow/10 transition-all duration-200 cursor-pointer group"
                    style={{ backgroundColor: '#0a0a0a', borderColor: '#262626' }}
                    onClick={() => toggleCard(section.id)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{section.icon}</span>
                          <h3 className="text-lg font-semibold text-white group-hover:text-yellow transition-colors duration-200">{section.title}</h3>
                        </div>
                        <div className="text-yellow group-hover:scale-110 transition-transform duration-200">
                          {expandedCards.has(section.id) ? 
                            <ChevronDown className="w-5 h-5" /> : 
                            <ChevronRight className="w-5 h-5" />
                          }
                        </div>
                      </div>
                      
                      {expandedCards.has(section.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pt-4 border-t border-border/30"
                        >
                          <div className="text-muted-foreground whitespace-pre-wrap">
                            {section.content.split('\n').map((line, lineIndex) => (
                              <p key={lineIndex} className={lineIndex > 0 ? 'mt-2' : ''}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {/* Back Button */}
            <div className="text-center">
              <Button 
                onClick={onBack}
                className="bg-yellow hover:bg-yellow-muted text-black font-semibold px-8 py-3"
                style={{ backgroundColor: '#ffcd1a', color: '#000000' }}
              >
                Start New Argument
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Start
          </Button>

          <motion.div 
            className="flex items-center gap-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Badge variant="outline" className="px-4 py-2 text-base border-2 border-yellow text-yellow bg-yellow/10 shadow-lg shadow-yellow/20">
              {debateTopic}
            </Badge>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className={`text-lg font-mono ${isSessionActive ? 'text-yellow' : 'text-muted-foreground'}`}>
                {formatTime(sessionTimeLeft)}
              </span>
              <span className="text-sm text-muted-foreground">session</span>
            </div>

            {/* Score Counter - only show after game starts */}
            {gameStarted && (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">You:</span>
                    <span className="text-lg font-mono text-yellow">{playerScore}</span>
                  </div>
                  <div className="text-muted-foreground">•</div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">Bot:</span>
                    <span className="text-lg font-mono text-yellow">{aiScore}</span>
                  </div>
                </div>
                
                {/* Surrender Button */}
                {isSessionActive && (
                  <Button
                    onClick={handleSurrender}
                    onMouseEnter={() => !isSurrendering && setSurrenderHover(true)}
                    onMouseLeave={() => setSurrenderHover(false)}
                    variant="outline"
                    size="sm"
                    disabled={isSurrendering}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 relative group disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isSurrendering ? "Preparing your roast..." : "Wave the white flag and get your personality report!"}
                  >
                    {isSurrendering ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 mr-1"
                      >
                        🍳
                      </motion.div>
                    ) : (
                      <Flag className="w-3 h-3 mr-1" />
                    )}
                    {isSurrendering ? "Cooking..." : surrenderHover ? "Please, Have Mercy! 😭" : "I Give Up! 🏳️"}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Main Content Area - Chat + Judge Sidebar */}
        <motion.div 
          className="max-w-7xl mx-auto relative flex gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {/* Debate Area - Left Side (Main Chat) */}
          <div className="flex-1">
            <Card className="min-h-[70vh] p-6 bg-card border-2 border-border">
            {!gameStarted ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg mb-2">Enter your argument to begin</p>
                    <p className="text-sm">Sir Interruptsalot is waiting for your challenge...</p>
                </div>
              </div>
            ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl rounded-lg p-4 relative ${
                      message.sender === 'user' 
                        ? 'bg-yellow/10 border-2 border-yellow/60' 
                        : 'bg-accent border-2 border-border'
                      }`} style={{ 
                        backgroundColor: message.sender === 'user' 
                          ? 'rgba(255, 205, 26, 0.1)' 
                          : '#1a1a1a' 
                      }}>
                                              <div className="text-foreground whitespace-pre-wrap">
                        {message.text.split('\n').map((line, lineIndex) => {
                          // Convert [SOURCE: URL] to clickable links
                          const linkRegex = /\[SOURCE:\s*(https?:\/\/[^\]]+)\]/g;
                          const parts = line.split(linkRegex);
                          
                          return (
                            <p key={lineIndex} className={lineIndex > 0 ? 'mt-3' : ''}>
                              {parts.map((part, partIndex) => {
                                if (part && part.startsWith('http')) {
                                  return (
                                    <a 
                                      key={partIndex}
                                      href={part} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-yellow hover:text-yellow/80 underline decoration-dotted transition-colors text-xs"
                                      style={{ color: '#ffcd1a' }}
                                    >
                                      [SOURCE]
                                    </a>
                                  );
                                }
                                return part;
                              })}
                            </p>
                          );
                        })}
                      </div>

                      {/* Sources Section - Only for AI messages with sources */}
                      {message.sender === 'ai' && message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/30">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">📚 Sources Referenced:</p>
                          <div className="space-y-1">
                            {message.sources.map((source, sourceIndex) => (
                              <div key={sourceIndex} className="flex items-start gap-2">
                                <ExternalLink className="w-3 h-3 text-yellow mt-0.5 flex-shrink-0" style={{ color: '#ffcd1a' }} />
                                <div className="flex-1 min-w-0">
                                  <a 
                                    href={source.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-yellow hover:text-yellow/80 underline decoration-dotted transition-colors line-clamp-1"
                                    style={{ color: '#ffcd1a' }}
                                    title={source.title}
                                  >
                                    {source.title || source.url.split('/')[2] || 'Source'}
                                  </a>
                                  {source.snippet && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {source.snippet}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <span className="text-xs text-muted-foreground mt-2 block">
                        {message.sender === 'user' ? 'You' : 'Sir Interruptsalot'}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* AI thinking indicator when it's AI's turn */}
                {!isUserTurn && (
                  <div className="flex justify-start">
                    <div className="max-w-3xl bg-accent rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-yellow rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-yellow rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-yellow rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <motion.span 
                          key={currentStatusIndex}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.3 }}
                          className="text-muted-foreground italic"
                        >
                          {thinkingStatuses[currentStatusIndex]}...
                        </motion.span>
                      </div>
                      
                      {/* Mock research sources */}
                      <div className="border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground mb-2">Consulting sources:</p>
                        <div className="space-y-1">
                          {mockSources.slice(0, 3).map((source, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4, delay: index * 0.5 }}
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="w-3 h-3 text-yellow" />
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-yellow hover:text-yellow/80 underline decoration-dotted transition-colors"
                              >
                                {source.title}
                              </a>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                  
                  {/* Scroll target for auto-scroll */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </Card>
          </div>

          {/* Judge Insight Box - Right Sidebar */}
          {currentJudgeRuling && (
            <motion.div 
              className="w-80 sticky top-8 h-fit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-2 border-purple-500/50" 
                    style={{ backgroundColor: 'rgba(75, 0, 130, 0.1)', borderColor: 'rgba(147, 51, 234, 0.5)' }}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="text-xl">🧑‍⚖️</div>
                    <h3 className="text-purple-300 font-semibold text-sm">JUDGE'S INSIGHT</h3>
                  </div>
                  <div className="h-px bg-purple-500/30"></div>
                  <p className="text-white text-sm leading-relaxed">{currentJudgeRuling}</p>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Status Update Box - Hidden (scores shown in header) */}
        {/* {currentStatus && (
          <motion.div 
            className="max-w-4xl mx-auto mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-4 bg-gradient-to-r from-green-900/20 to-teal-900/20 border-2 border-green-500/50"
                  style={{ backgroundColor: 'rgba(0, 100, 0, 0.1)', borderColor: 'rgba(34, 197, 94, 0.5)' }}>
              <div className="flex items-start gap-3">
                <div className="text-2xl">📊</div>
                <div className="flex-1">
                  <h3 className="text-green-300 font-semibold text-sm mb-2">ARGUMENT STATUS</h3>
                  <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">{currentStatus}</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )} */}

        {/* Chat Input Section - Moved to Bottom */}
        <motion.div 
          className="max-w-7xl mx-auto mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="p-4 bg-card border-2 border-border" style={{ backgroundColor: '#0a0a0a', borderColor: '#262626' }}>
            <div className="flex gap-4 items-center">
              <Input
                value={argument}
                onChange={(e) => setArgument(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isUserTurn ? "Type your argument here..." : "Waiting for AI response..."}
                className="flex-1 bg-input border-2 border-border text-foreground placeholder:text-muted-foreground focus:border-yellow"
                style={{ backgroundColor: '#1a1a1a', borderColor: '#262626', color: '#ffffff' }}
                disabled={!isUserTurn}
              />
              <Button
                onClick={() => handleSubmitArgument()}
                disabled={!isUserTurn}
                className="bg-yellow text-black hover:opacity-80 transition-opacity px-6"
                style={{ backgroundColor: '#ffcd1a', color: '#000000' }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {!gameStarted && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Press Enter or click send to start debating
              </p>
            )}
            
            {gameStarted && !isUserTurn && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                AI is thinking... Please wait
              </p>
            )}
          </Card>
        </motion.div>

        {/* Game Status */}
        {gameStarted && (
          <motion.div 
            className="text-center mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p className="text-sm text-muted-foreground">
              Debate in progress • Session: {isSessionActive ? 'Active' : 'Paused'} • Turn: {isUserTurn ? 'Your turn' : 'AI turn'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}