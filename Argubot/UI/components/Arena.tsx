import React, { useState, useEffect, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowLeft, Clock, Send, Trophy, ExternalLink, ChevronDown, ChevronRight, Swords, MessageCircle } from "lucide-react";
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
  const [isOvertime, setIsOvertime] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const previousMessageCount = useRef(0);
  const scrollContainer = useRef<HTMLDivElement>(null);

  const cookingMessages = [
    "Analyzing your argument patterns... 🧠",
    "Cooking up some sass... 🌶️",
    "Preparing your personality roast... 🔥",
    "Generating your final verdict... ⚖️",
    "Almost ready to serve... 🍽️",
    "Adding the perfect amount of spice... 🌶️",
    "Crafting your character profile... 📝",
    "Finalizing your roast report... 🎭",
    "Adding finishing touches... ✨",
    "Your personality roast is almost ready... 🎪"
  ];

  // Smart auto-scroll that's mobile-friendly
  useEffect(() => {
    const currentMessageCount = messages.length;
    const hasNewMessage = currentMessageCount > previousMessageCount.current;
    
    if (hasNewMessage && messagesEndRef.current && scrollContainer.current) {
      const container = scrollContainer.current;
      const isNearBottom = container.scrollTop > (container.scrollHeight - container.clientHeight - 100);
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      
      // Only auto-scroll if:
      // 1. User is near the bottom (actively following conversation)
      // 2. OR it's a new message and not mobile (desktop users expect auto-scroll)
      if (isNearBottom || (!isMobile && hasNewMessage)) {
        // Delay scroll on mobile to let users read their message first
        const scrollDelay = isMobile ? 2000 : 500;
        
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'nearest' // Less aggressive scrolling
          });
        }, scrollDelay);
      }
    }
    
    previousMessageCount.current = currentMessageCount;
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
    if (gameStarted && timeRemaining > 0 && !gameEnded && !isOvertime) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Check if user has text in input box
            if (userInput.trim()) {
              // Enter overtime mode - allow final submission
              setIsOvertime(true);
              setTimeRemaining(0);
            } else {
              // No text, end immediately
              endSession();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameStarted, timeRemaining, gameEnded, isOvertime, userInput]);

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
      setGameStarted(true);
      
      // Show user's message immediately for responsive feel
      const userMessage = {
        role: 'user' as const,
        content: initialMessage,
        timestamp: new Date().toISOString()
      };
      setMessages([userMessage]);
      
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

      // Add bot's response to existing messages
      const botMessage = {
        role: 'bot' as const,
        content: data.bot_response,
        timestamp: new Date().toISOString(),
        sources: data.sources
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error starting session:', error);
      // If there's an error, remove the user message we added optimistically
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendArgumentToAPI = async (message: string, overtime: boolean = false) => {
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
          session_id: sessionId,
          is_overtime: overtime
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

      // If game ended (overtime response), automatically trigger end session after showing bot response
      if (data.game_ended && isOvertime) {
        console.log('Overtime game ended - starting transition to cooking screen');
        setTimeout(() => {
          if (!isSurrendering && !finalReport) { // Only if not already in progress
            console.log('Triggering cooking screen for overtime');
            setIsSurrendering(true);
            setCookingMessageIndex(0);
            // Longer delay to ensure cooking screen is visible
            setTimeout(() => {
              console.log('Calling endSession after cooking screen');
              endSession();
            }, 2000); // 2 second delay to show cooking screen
          }
        }, 3000); // 3 second delay to let user read the bot's response
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
      
      // Only set isSurrendering to false after we get the response
      setIsSurrendering(false);
      setCookingMessageIndex(0);

    } catch (error) {
      console.error('Error ending session:', error);
      // Fallback: just end the game
      setGameEnded(true);
      setIsSurrendering(false);
      setCookingMessageIndex(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitArgument = async () => {
    if (userInput.trim() && !isLoading && !gameEnded) {
      const messageToSend = userInput.trim();
      setUserInput('');
      
      if (isOvertime) {
        // This is the final message in overtime
        await sendArgumentToAPI(messageToSend, true);
        // Backend will return game_ended: true, which will trigger natural end flow
      } else {
        sendArgumentToAPI(messageToSend, false);
      }
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
      const newSet = new Set<string>();
      if (prev.has(cardId)) {
        // If clicking the same card, close it
        return newSet;
      } else {
        // If clicking a different card, close all others and open this one
        newSet.add(cardId);
        return newSet;
      }
    });
  };

  const parseReportSections = (report: string) => {
    const sections: ReportSection[] = [];
    const lines = report.split('\n');
    let currentSection: ReportSection | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      // Check for section headers with better pattern matching
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

        // Start new section with better title extraction
        let title = line.trim();
        if (title.includes(':')) {
          title = title.split(':')[1]?.trim() || title;
        }
        
        // Clean up the title
        title = title.replace(/^[^a-zA-Z]*/, '').trim();
        
        const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        currentSection = { id, title, content: '' };
        currentContent = [];
      } else if (currentSection && line.trim()) {
        // Only add non-empty lines to content
        if (line.trim() && !line.startsWith('🎭') && !line.startsWith('---')) {
          currentContent.push(line.trim());
        }
      }
    }

    // Add last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }

    // Filter out sections with no content
    return sections.filter(section => section.content.length > 0);
  };

  // Loading screen during surrender
  if (isSurrendering && !gameEnded) {
  return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center">
        <motion.div 
          className="text-center space-y-8 max-w-md mx-auto p-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Main cooking container */}
          <motion.div
            className="relative"
            animate={{ 
              y: [0, -5, 0],
              rotate: [0, 1, -1, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Spinning pan with glow effect */}
          <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="text-8xl drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 0 20px rgba(255, 205, 26, 0.5))' }}
            >
              🍳
            </motion.div>
            
            {/* Steam effects with better positioning */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex justify-center space-x-3">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [-5, -40], 
                    opacity: [0.8, 0], 
                    scale: [1, 1.8],
                    x: [0, (i - 2) * 10]
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    delay: i * 0.2,
                    ease: "easeOut"
                  }}
                  className="text-3xl"
                >
                  💨
                </motion.div>
              ))}
            </div>
        </motion.div>

          {/* Enhanced title with gradient text */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-2"
          >
            <motion.h2
              animate={{ 
                scale: [1, 1.02, 1],
                textShadow: [
                  "0 0 10px rgba(255, 205, 26, 0.5)",
                  "0 0 20px rgba(255, 205, 26, 0.8)",
                  "0 0 10px rgba(255, 205, 26, 0.5)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent"
              style={{ 
                background: 'linear-gradient(45deg, #ffffff, #f3f4f6, #ffffff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Let Him Cook Now... 👨‍🍳
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg text-white/70 font-medium"
            >
              Crafting your personality roast with precision
            </motion.p>
          </motion.div>
          
          {/* Enhanced dynamic message */}
            <motion.div
            className="min-h-[60px] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <motion.p
              key={cookingMessageIndex}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="text-lg text-white/90 font-medium px-4 py-2 bg-yellow/10 rounded-lg border border-yellow/20"
              style={{ backgroundColor: 'rgba(255, 205, 26, 0.1)', borderColor: 'rgba(255, 205, 26, 0.2)' }}
            >
              {cookingMessages[cookingMessageIndex]}
            </motion.p>
          </motion.div>
          
          {/* Enhanced bouncing dots */}
          <motion.div 
            className="flex justify-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [0, -15, 0],
                  scale: [1, 1.2, 1],
                  backgroundColor: ['#ffffff', '#fbbf24', '#ffffff']
                }}
                transition={{ 
                  duration: 1.2, 
                  repeat: Infinity, 
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="w-3 h-3 rounded-full shadow-lg"
                style={{ backgroundColor: '#ffffff' }}
              />
            ))}
          </motion.div>
          
          {/* Progress bar */}
                <motion.div
            className="w-full bg-gray-800 rounded-full h-2 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-white rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 15, ease: "linear" }}
              style={{ background: 'linear-gradient(90deg, #fbbf24, #ffffff)' }}
            />
                </motion.div>
          
          {/* Enhanced background sparkles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow/40 pointer-events-none"
              style={{
                left: `${5 + Math.random() * 90}%`,
                top: `${5 + Math.random() * 90}%`,
                fontSize: `${Math.random() * 20 + 12}px`
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.3, 1.2, 0.3],
                rotate: [0, 180, 360],
                y: [0, -20, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut"
              }}
            >
              ✨
            </motion.div>
          ))}
          
          {/* Additional floating elements */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-yellow/20"
                style={{
                  left: `${10 + (i * 15)}%`,
                  top: `${20 + (i * 10)}%`,
                  fontSize: '16px'
                }}
                animate={{
                  opacity: [0.2, 0.6, 0.2],
                  scale: [0.8, 1.1, 0.8]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              >
                🔥
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Final report screen
  if (gameEnded && finalReport) {
    const reportSections = parseReportSections(finalReport);
    
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-5xl mx-auto">
          {/* Enhanced Header with Animation */}
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1 
              className="text-4xl font-bold text-white mb-4" 
              style={{ color: '#ffffff' }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              🎭 Personality Roast Report 🎭
            </motion.h1>
            <motion.p 
              className="text-lg text-white/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Your argument session has ended. Here's what Sir Interruptsalot thinks about you:
            </motion.p>
          </motion.div>

          {/* Enhanced Score Summary */}
          <motion.div 
            className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-600 shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(255, 205, 26, 0.1)" }}
          >
            <div className="flex justify-between items-center">
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-white/60 mb-2">Your Score</p>
                <motion.p 
                  className="text-3xl font-bold text-green-400"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8, type: "spring" }}
                >
                  {userScore}
                </motion.p>
              </motion.div>
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-white/60 mb-2">Sir Interruptsalot</p>
                <motion.p 
                  className="text-3xl font-bold text-red-400"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.0, type: "spring" }}
                >
                  {botScore}
                </motion.p>
              </motion.div>
            </div>
          </motion.div>

          {/* Enhanced Report Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {reportSections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card
                  className="bg-gray-800 border border-gray-600 hover:border-yellow/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-yellow/10 group"
                  onClick={() => toggleCard(section.id)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <motion.h3 
                        className="text-lg font-semibold text-yellow-400 group-hover:text-yellow-300 transition-colors" 
                        style={{ color: '#fbbf24' }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        {section.title}
                      </motion.h3>
                      <motion.div 
                        className="text-white/60"
                        animate={{ 
                          rotate: expandedCards.has(section.id) ? 90 : 0,
                          scale: expandedCards.has(section.id) ? 1.1 : 1
                        }}
                        transition={{ duration: 0.3, type: "spring" }}
                      >
                        {expandedCards.has(section.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </motion.div>
              </div>
              
                    <motion.div
                      initial={false}
                      animate={{
                        height: expandedCards.has(section.id) ? 'auto' : 0,
                        opacity: expandedCards.has(section.id) ? 1 : 0,
                        y: expandedCards.has(section.id) ? 0 : -10
                      }}
                      transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
                      className="overflow-hidden"
                    >
                      <div className="text-white/90 whitespace-pre-line leading-relaxed space-y-2">
                        {section.content.split('\n').map((line, lineIndex) => (
                          <motion.div 
                            key={lineIndex} 
                            className="flex items-start"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: lineIndex * 0.05 }}
                          >
                            {line.startsWith('•') ? (
                              <>
                                <motion.span 
                                  className="text-yellow mr-2 mt-1"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.2, delay: lineIndex * 0.05 }}
                                >
                                  •
                                </motion.span>
                                <span className="text-sm">{line.substring(1).trim()}</span>
                              </>
                            ) : (
                              <span className="text-sm">{line}</span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                    
                    {/* Enhanced preview when collapsed */}
                    {!expandedCards.has(section.id) && section.content && (
                      <motion.div 
                        className="text-white/60 text-sm italic"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        "{section.content.split('\n')[0].replace(/^•\s*/, '')}..."
                      </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
            ))}
          </div>

          {/* Conversation Transcript */}
          <motion.div 
            className="mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
          >
            <Card className="bg-gray-800 border border-gray-600 shadow-lg">
              <div className="p-6">
                <motion.h3 
                  className="text-xl font-semibold text-yellow-400 mb-4 flex items-center space-x-2" 
                  style={{ color: '#fbbf24' }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 1.7 }}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>📜 Conversation Transcript</span>
                </motion.h3>
                
                <motion.p 
                  className="text-white/60 text-sm mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1.8 }}
                >
                  Here's the full conversation that led to your personality analysis:
                </motion.p>

                <div className="bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 1.9 + index * 0.1 }}
                      >
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user' 
                            ? 'bg-blue-600/20 border border-blue-500/30' 
                            : 'bg-gray-700/50 border border-gray-600/50'
                        }`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`text-xs font-semibold ${
                              message.role === 'user' ? 'text-blue-300' : 'text-yellow'
                            }`} style={{ color: message.role === 'user' ? '#93c5fd' : '#ffffff' }}>
                              {message.role === 'user' ? '👤 You' : '🤖 Sir Interruptsalot'}
                            </span>
                            <span className="text-xs text-white/40">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-white/90 text-sm break-words leading-relaxed">
                            {message.content.replace(/\[Source(?::\s*[^\]]+)?\]/g, '[Source]')}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <motion.div 
                  className="mt-4 text-center text-xs text-white/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 2.2 }}
                >
                  💡 Compare this transcript with your personality analysis above!
                </motion.div>
              </div>
            </Card>
          </motion.div>

          {/* Enhanced Back Button */}
          <motion.div 
            className="text-center mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.0 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={onBack}
                className="bg-white hover:bg-gray-100 text-black font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-yellow-400"
                style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#fbbf24' }}
              >
                Back to Start
              </Button>
            </motion.div>
          </motion.div>
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
              <Swords className="w-5 h-5 text-white" style={{ color: '#ffffff' }} />
              <Badge className="bg-gray-700/30 text-white border border-gray-600/50 font-semibold" style={{ backgroundColor: 'rgba(55, 65, 81, 0.3)', color: '#ffffff', borderColor: 'rgba(75, 85, 99, 0.5)' }}>
                {roomName}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Timer */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              isOvertime 
                ? 'bg-red-900/50 border-red-700 animate-pulse' 
                : 'bg-gray-900/50 border-gray-700'
            }`}>
              <Clock className={`w-5 h-5 ${isOvertime ? 'text-red-400' : 'text-yellow-400'}`} style={{ color: isOvertime ? '#f87171' : '#fbbf24' }} />
              <span className={`font-mono text-lg font-bold ${isOvertime ? 'text-red-400' : 'text-white'}`}>
                {isOvertime ? 'OVERTIME!' : formatTime(timeRemaining)}
              </span>
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
                disabled={isSurrendering || isOvertime}
                onMouseEnter={() => setSurrenderHover(true)}
                onMouseLeave={() => setSurrenderHover(false)}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-semibold px-4 py-2 transition-all"
                title={isSurrendering ? "Cooking..." : isOvertime ? "No surrendering in overtime - submit your final message!" : "End the argument and get your personality report"}
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
            <Card className="bg-gray-900/50 border-2 border-gray-600/30 backdrop-blur-sm shadow-2xl shadow-gray-500/10 min-h-[75vh] flex flex-col" style={{ backgroundColor: 'rgba(17, 17, 17, 0.5)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
              {/* Messages Area */}
              <div ref={scrollContainer} className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[65vh]">
                {messages.length === 0 && !isLoading ? (
                  <div className="text-center text-white/60 py-12">
                    <div className="w-16 h-16 bg-gray-700/20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(55, 65, 81, 0.2)' }}>
                      <MessageCircle className="w-8 h-8 text-white" style={{ color: '#ffffff' }} />
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
                            style={{ backgroundColor: message.role === 'user' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(75, 85, 99, 0.3)', color: message.role === 'user' ? '#60a5fa' : '#ffffff' }}
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
                          className="text-white whitespace-pre-line leading-relaxed break-words overflow-wrap-anywhere"
                          style={{ 
                            wordWrap: 'break-word',
                            overflowWrap: 'anywhere',
                            hyphens: 'auto',
                            maxWidth: '100%'
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
                        >
                          {message.role === 'bot' && message.sources && message.sources.length > 0 
                            ? (() => {
                                // Handle both [Source] and [Source: url] formats
                                const sourceRegex = /\[Source(?::\s*[^\]]+)?\]/g;
                                const parts = message.content.split(sourceRegex);
                                
                                console.log('Source parsing debug:', {
                                  messageContent: message.content,
                                  sourcesArray: message.sources,
                                  sourcesLength: message.sources?.length,
                                  parts: parts,
                                  hasSourceMatches: sourceRegex.test(message.content)
                                });
                                
                                let sourceIndex = 0;
                                return parts.map((part, partIndex) => {
                                  if (partIndex === 0) return <span key={partIndex}>{part}</span>;
                                  
                                  const source = message.sources?.[sourceIndex];
                                  sourceIndex++;
                                  
                                  console.log('Processing source:', { partIndex, sourceIndex: sourceIndex-1, source });
                                  
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
                                    // If no valid source, just return the text
                                    console.log('No valid source found, returning raw text');
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
                {/* Overtime Notice */}
                {isOvertime && (
                  <motion.div 
                    className="mb-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-red-400 text-lg">⏰</span>
                      <span className="text-red-300 font-semibold">OVERTIME!</span>
                      <span className="text-red-200 text-sm">One final message - make it count!</span>
                    </div>
                  </motion.div>
                )}
                <div className="flex space-x-3">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={isOvertime ? "Your final argument - make it count!" : "Type your argument here..."}
                    disabled={isLoading || gameEnded}
                    className={`flex-1 border rounded-xl transition-all resize-none min-h-[44px] max-h-[200px] py-3 px-4 ${
                      isOvertime 
                        ? 'bg-red-900/20 border-red-700/50 text-white placeholder-red-300/70 focus:ring-2 focus:ring-red-400 focus:border-red-400' 
                        : 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400'
                    }`}
                    style={{ 
                      backgroundColor: isOvertime ? 'rgba(127, 29, 29, 0.2)' : 'rgba(31, 41, 55, 0.5)', 
                      borderColor: isOvertime ? 'rgba(185, 28, 28, 0.5)' : 'rgba(75, 85, 99, 0.5)',
                      height: 'auto',
                      overflowY: 'auto'
                    }}
                    rows={1}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                    }}
                  />
                  <Button
                    onClick={handleSubmitArgument}
                    disabled={!userInput.trim() || isLoading || gameEnded}
                    className={`font-semibold px-6 rounded-xl transition-all transform hover:scale-105 disabled:transform-none self-end ${
                      isOvertime 
                        ? 'bg-red-600 hover:bg-red-700 text-white border border-red-500' 
                        : 'bg-white hover:bg-gray-100 text-black border-2 border-yellow-400'
                    }`}
                    style={{ 
                      backgroundColor: isOvertime ? '#dc2626' : '#ffffff', 
                      color: isOvertime ? '#ffffff' : '#000000',
                      borderColor: isOvertime ? '#dc2626' : '#fbbf24'
                    }}
                  >
                    <Send className="w-4 h-4" />
                    {isOvertime && <span className="ml-1 text-xs">FINAL</span>}
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
                <Card className="p-4 bg-gray-700/10 border-2 border-gray-600/30 backdrop-blur-sm shadow-lg" style={{ backgroundColor: 'rgba(55, 65, 81, 0.1)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
                  <div className="flex items-center space-x-2 mb-3">
                    <Trophy className="w-5 h-5 text-yellow-400" style={{ color: '#fbbf24' }} />
                    <span className="font-semibold text-white" style={{ color: '#ffffff' }}>
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