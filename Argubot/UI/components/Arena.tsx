import React, { useState, useEffect, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ArrowLeft, Clock, Send, Trophy, ExternalLink, Flag, ChevronDown, ChevronRight, Swords, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface ArenaProps {
  roomName: string;
  onBack: () => void;
  initialUserMessage?: string;
}

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
  sources?: Array<{
    title: string;
    link: string;
    snippet: string;
  }>;
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
}

export function Arena({ roomName, onBack, initialUserMessage }: ArenaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [gameStarted, setGameStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [currentJudgeRuling, setCurrentJudgeRuling] = useState<string | null>(null);
  const [isSurrendering, setIsSurrendering] = useState(false);
  const [cookingMessageIndex, setCookingMessageIndex] = useState(0);
  const [surrenderHover, setSurrenderHover] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const cookingMessages = [
    "Analyzing your argument patterns... 🧠",
    "Cooking up some sass... 🌶️",
    "Preparing your personality roast... 🔥",
    "Generating your final verdict... ⚖️",
    "Almost ready to serve... 🍽️"
  ];

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-start session if initial message is provided
  useEffect(() => {
    if (initialUserMessage && !sessionId && !gameStarted && !hasInitialized.current) {
      hasInitialized.current = true;
      startArgumentSession(initialUserMessage);
    }
  }, [initialUserMessage, sessionId, gameStarted]);

  // Timer countdown
  useEffect(() => {
    if (gameStarted && timeRemaining > 0 && !gameEnded) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            endSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameStarted, timeRemaining, gameEnded]);

  // Cooking message rotation
  useEffect(() => {
    if (isSurrendering && !gameEnded) {
      const interval = setInterval(() => {
        setCookingMessageIndex(prev => (prev + 1) % cookingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isSurrendering, gameEnded]);

  const startArgumentSession = async (initialMessage: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/start_session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: initialMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();
      
      setSessionId(data.session_id);
      setUserScore(data.user_score);
      setBotScore(data.bot_score);
      setTimeRemaining(data.time_remaining);
      setGameStarted(true);

      // Add initial messages
      setMessages([
        {
          role: 'user',
          content: initialMessage,
          timestamp: new Date().toISOString()
        },
        {
          role: 'bot',
          content: data.bot_response,
          timestamp: new Date().toISOString(),
          sources: data.sources
        }
      ]);

    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendArgumentToAPI = async (message: string) => {
    if (!sessionId || gameEnded) return;

    try {
      setIsLoading(true);
      setCurrentJudgeRuling(null);

      // Add user message immediately for better UX
      const userMessage = {
        role: 'user' as const,
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      const response = await fetch(`${API_BASE_URL}/send_argument`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send argument');
      }

      const data = await response.json();
      
      setUserScore(data.user_score);
      setBotScore(data.bot_score);
      setTimeRemaining(data.time_remaining);
      setGameEnded(data.game_ended);

      // Add bot response
      const botMessage = {
        role: 'bot' as const,
        content: data.bot_response,
        timestamp: new Date().toISOString(),
        sources: data.sources
      };
      setMessages(prev => [...prev, botMessage]);

      // Update judge ruling if available
      if (data.status_update) {
        setCurrentJudgeRuling(data.status_update);
      }

    } catch (error) {
      console.error('Error sending argument:', error);
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    try {
      setIsSurrendering(false);
      setCookingMessageIndex(0);
      
      const response = await fetch(`${API_BASE_URL}/end_session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "End session",
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to end session');
      }

      const data = await response.json();
      setFinalReport(data.final_report);
      setGameEnded(true);

    } catch (error) {
      console.error('Error ending session:', error);
      // Fallback: just end the game
      setGameEnded(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitArgument = () => {
    if (userInput.trim() && !isLoading && !gameEnded) {
      sendArgumentToAPI(userInput.trim());
      setUserInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitArgument();
    }
  };

  const handleSurrender = async () => {
    setIsSurrendering(true);
    setCookingMessageIndex(0);
    
    // Add timeout as fallback
    setTimeout(() => {
      if (isSurrendering) {
        setIsSurrendering(false);
        setCookingMessageIndex(0);
        endSession();
      }
    }, 15000);

    await endSession();
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
    const sections: ReportSection[] = [];
    const lines = report.split('\n');
    let currentSection: ReportSection | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.includes('👤 Arguing Persona:') || 
          line.includes('🔍 ARGUING STYLE BREAKDOWN:') ||
          line.includes('💪 STRONGEST TRAITS:') ||
          line.includes('🤪 WEAKEST TRAITS:') ||
          line.includes('🎯 PERSONALITY SUMMARY:') ||
          line.includes('⭐ FUNNY SCORES (0-100):') ||
          line.includes('🏆 FINAL VERDICT:')) {
        
        // Save previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }

        // Start new section
        const title = line.replace(/^[^:]*:\s*/, '').trim();
        const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        currentSection = { id, title, content: '' };
        currentContent = [];
      } else if (currentSection && line.trim()) {
        currentContent.push(line);
      }
    }

    // Add last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }

    return sections;
  };

  // Loading screen during surrender
  if (isSurrendering && !gameEnded) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          {/* Spinning pan */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-6xl"
          >
            🍳
          </motion.div>
          
          {/* Steam effects */}
          <div className="flex justify-center space-x-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ y: [-10, -30], opacity: [0.7, 0], scale: [1, 1.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                className="text-2xl"
              >
                💨
              </motion.div>
            ))}
          </div>
          
          {/* Title */}
          <motion.h2
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-3xl font-bold text-yellow"
            style={{ color: '#ffcd1a' }}
          >
            Let him cook! 👨‍🍳
          </motion.h2>
          
          {/* Dynamic message */}
          <motion.p
            key={cookingMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-lg text-white/80"
          >
            {cookingMessages[cookingMessageIndex]}
          </motion.p>
          
          {/* Bouncing dots */}
          <div className="flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 bg-yellow rounded-full"
                style={{ backgroundColor: '#ffcd1a' }}
              />
            ))}
          </div>
          
          {/* Background sparkles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow/30"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                fontSize: `${Math.random() * 15 + 10}px`
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
        </div>
      </div>
    );
  }

  // Final report screen
  if (gameEnded && finalReport) {
    const reportSections = parseReportSections(finalReport);
    
    return (
      <div className="min-h-screen bg-black text-white p-6" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-yellow mb-4" style={{ color: '#ffcd1a' }}>
              🎭 Personality Roast Report 🎭
            </h1>
            <p className="text-lg text-white/80">
              Your argument session has ended. Here's what Sir Interruptsalot thinks about you:
            </p>
          </div>

          {/* Score Summary */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div className="text-center">
                <p className="text-sm text-white/60">Your Score</p>
                <p className="text-2xl font-bold text-green-400">{userScore}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-white/60">Sir Interruptsalot</p>
                <p className="text-2xl font-bold text-red-400">{botScore}</p>
              </div>
            </div>
          </div>

          {/* Report Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {reportSections.map((section) => (
              <Card
                key={section.id}
                className="bg-gray-900 border-gray-700 hover:border-yellow/50 transition-all cursor-pointer"
                onClick={() => toggleCard(section.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-yellow" style={{ color: '#ffcd1a' }}>
                      {section.title}
                    </h3>
                    <motion.div
                      animate={{ rotate: expandedCards.has(section.id) ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {expandedCards.has(section.id) ? (
                        <ChevronDown className="w-5 h-5 text-white/60" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-white/60" />
                      )}
                    </motion.div>
                  </div>
                  
                  <motion.div
                    initial={false}
                    animate={{
                      height: expandedCards.has(section.id) ? 'auto' : 0,
                      opacity: expandedCards.has(section.id) ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="text-white/80 whitespace-pre-line">
                      {section.content}
                    </div>
                  </motion.div>
                </div>
              </Card>
            ))}
          </div>

          {/* Back Button */}
          <div className="text-center mt-8">
            <Button
              onClick={onBack}
              className="bg-yellow hover:bg-yellow/90 text-black font-semibold px-8 py-3"
              style={{ backgroundColor: '#ffcd1a', color: '#000000' }}
            >
              Back to Start
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-4">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Start
            </Button>
            <div className="flex items-center space-x-2">
              <Swords className="w-5 h-5 text-yellow" style={{ color: '#ffcd1a' }} />
              <Badge className="bg-yellow/20 text-yellow border border-yellow/30 font-semibold" style={{ backgroundColor: 'rgba(255, 205, 26, 0.2)', color: '#ffcd1a', borderColor: 'rgba(255, 205, 26, 0.3)' }}>
                {roomName}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Timer */}
            <div className="flex items-center space-x-2 bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-700">
              <Clock className="w-5 h-5 text-yellow" style={{ color: '#ffcd1a' }} />
              <span className="font-mono text-lg font-bold">{formatTime(timeRemaining)}</span>
            </div>
            
            {/* Scores */}
            {gameStarted && (
              <div className="flex items-center space-x-6 bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-700">
                <div className="text-center">
                  <p className="text-xs text-white/60">You</p>
                  <p className="text-xl font-bold text-green-400">{userScore}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-white/60">Sir Interruptsalot</p>
                  <p className="text-xl font-bold text-red-400">{botScore}</p>
                </div>
              </div>
            )}
            
            {/* Surrender Button */}
            {gameStarted && !gameEnded && (
              <Button
                onClick={handleSurrender}
                disabled={isSurrendering}
                onMouseEnter={() => setSurrenderHover(true)}
                onMouseLeave={() => setSurrenderHover(false)}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-semibold px-4 py-2 transition-all"
                title={isSurrendering ? "Cooking..." : "End the argument and get your personality report"}
              >
                {isSurrendering ? "Cooking..." : surrenderHover ? "Please, Have Mercy! 😭" : "I Give Up! 🏳️"}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Main Chat Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Section */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-900/50 border-2 border-yellow/30 backdrop-blur-sm shadow-2xl shadow-yellow/10 min-h-[75vh] flex flex-col" style={{ backgroundColor: 'rgba(17, 17, 17, 0.5)', borderColor: 'rgba(255, 205, 26, 0.3)' }}>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[65vh]">
                {messages.length === 0 && !isLoading ? (
                  <div className="text-center text-white/60 py-12">
                    <div className="w-16 h-16 bg-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(255, 205, 26, 0.1)' }}>
                      <MessageCircle className="w-8 h-8 text-yellow" style={{ color: '#ffcd1a' }} />
                    </div>
                    <p className="text-lg">Waiting for Sir Interruptsalot to respond...</p>
                    <p className="text-sm text-white/40 mt-2">The debate is about to begin!</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <motion.div 
                      key={index} 
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                      }}
                    >
                      <motion.div 
                        className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${
                          message.role === 'user' 
                            ? 'bg-blue-600/20 border border-blue-500/30' 
                            : 'bg-gray-800/50 border border-gray-700/50'
                        }`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                          duration: 0.3,
                          delay: index * 0.1 + 0.1,
                          type: "spring",
                          stiffness: 200
                        }}
                      >
                        <div className="flex items-center space-x-2 mb-3">
                          <motion.div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.role === 'user' 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-yellow/20 text-yellow'
                            }`} 
                            style={{ backgroundColor: message.role === 'user' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 205, 26, 0.2)', color: message.role === 'user' ? '#60a5fa' : '#ffcd1a' }}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                          >
                            {message.role === 'user' ? '👤' : '🤖'}
                          </motion.div>
                          <motion.span 
                            className="text-sm font-semibold text-white/80"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
                          >
                            {message.role === 'user' ? 'You' : 'Sir Interruptsalot'}
                          </motion.span>
                          <motion.span 
                            className="text-xs text-white/40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 + 0.4 }}
                          >
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </motion.span>
                        </div>
                        
                        <motion.div 
                          className="text-white whitespace-pre-line leading-relaxed"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
                        >
                          {message.role === 'bot' && message.sources && message.sources.length > 0 
                            ? (() => {
                                const parts = message.content.split('[Source]');
                                return parts.map((part, partIndex) => {
                                  if (partIndex === 0) return part;
                                  
                                  const sourceIndex = partIndex - 1;
                                  const source = message.sources?.[sourceIndex];
                                  
                                  // Debug logging
                                  console.log('Source parsing:', { partIndex, sourceIndex, source, sourcesLength: message.sources?.length });
                                  
                                  // Only render source link if we have a valid source with a link
                                  if (source && source.link && typeof source.link === 'string') {
                                    return (
                                      <span key={partIndex}>
                                        <a
                                          href={source.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs rounded-full border border-blue-500/30 transition-all hover:scale-105 mx-1"
                                        >
                                          <ExternalLink className="w-3 h-3 mr-1" />
                                          Source
                                        </a>
                                        {part}
                                      </span>
                                    );
                                  } else {
                                    // If no valid source, just return the text without a link
                                    console.log('Invalid source found:', source);
                                    return <span key={partIndex}>{part}</span>;
                                  }
                                });
                              })()
                            : message.content
                          }
                        </motion.div>
                        
                        {/* Sources for bot messages */}
                        {message.sources && message.sources.length > 0 && (
                          <motion.div 
                            className="mt-4 pt-3 border-t border-white/10"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 + 0.6 }}
                          >
                            <p className="text-xs text-yellow mb-2 font-semibold" style={{ color: '#ffcd1a' }}>
                              📚 Sources Referenced:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {message.sources.map((source, idx) => (
                                <motion.a
                                  key={idx}
                                  href={source.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs rounded-full border border-blue-500/30 transition-all hover:scale-105"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.3, delay: index * 0.1 + 0.7 + idx * 0.1 }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Source {idx + 1}
                                </motion.a>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    </motion.div>
                  ))
                )}
                
                {isLoading && (
                  <motion.div 
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div 
                      className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 shadow-lg"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                    >
                      <div className="flex items-center space-x-3">
                        <motion.div 
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-yellow/20"
                          style={{ backgroundColor: 'rgba(255, 205, 26, 0.2)' }}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          🤖
                        </motion.div>
                        <div className="flex items-center space-x-2">
                          <motion.div 
                            className="flex space-x-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <motion.div 
                              className="w-2 h-2 bg-yellow rounded-full" 
                              style={{ backgroundColor: '#ffcd1a' }}
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{ 
                                duration: 1.4, 
                                repeat: Infinity,
                                delay: 0
                              }}
                            />
                            <motion.div 
                              className="w-2 h-2 bg-yellow rounded-full" 
                              style={{ backgroundColor: '#ffcd1a' }}
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{ 
                                duration: 1.4, 
                                repeat: Infinity,
                                delay: 0.2
                              }}
                            />
                            <motion.div 
                              className="w-2 h-2 bg-yellow rounded-full" 
                              style={{ backgroundColor: '#ffcd1a' }}
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{ 
                                duration: 1.4, 
                                repeat: Infinity,
                                delay: 0.4
                              }}
                            />
                          </motion.div>
                          <motion.span 
                            className="text-sm text-white/60"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            Sir Interruptsalot is typing...
                          </motion.span>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-700/50 p-4 bg-gray-900/30">
                <div className="flex space-x-3">
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your argument here..."
                    disabled={isLoading || gameEnded}
                    className="flex-1 bg-gray-800/50 border-gray-600/50 text-white placeholder-white/50 rounded-xl focus:ring-2 focus:ring-yellow focus:border-yellow transition-all"
                    style={{ backgroundColor: 'rgba(31, 41, 55, 0.5)', borderColor: 'rgba(75, 85, 99, 0.5)' }}
                  />
                  <Button
                    onClick={handleSubmitArgument}
                    disabled={!userInput.trim() || isLoading || gameEnded}
                    className="bg-yellow hover:bg-yellow/90 text-black font-semibold px-6 rounded-xl transition-all transform hover:scale-105 disabled:transform-none"
                    style={{ backgroundColor: '#ffcd1a', color: '#000000' }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Judge Insights Sidebar */}
          <div className="lg:col-span-1">
            {currentJudgeRuling && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="sticky top-6"
              >
                <Card className="p-4 bg-yellow/5 border-2 border-yellow/30 backdrop-blur-sm shadow-lg" style={{ backgroundColor: 'rgba(255, 205, 26, 0.05)', borderColor: 'rgba(255, 205, 26, 0.3)' }}>
                  <div className="flex items-center space-x-2 mb-3">
                    <Trophy className="w-5 h-5 text-yellow" style={{ color: '#ffcd1a' }} />
                    <span className="font-semibold text-yellow" style={{ color: '#ffcd1a' }}>
                      Judge's Insights
                    </span>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">{currentJudgeRuling}</p>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}