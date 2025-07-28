import React, { useState } from "react";
import { Arena } from "./components/Arena";
import { Swords, Target, Send, Zap, MessageCircle, X, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";

export default function App() {
  const [currentView, setCurrentView] = useState<'start' | 'arena'>('start');
  const [userArgument, setUserArgument] = useState<string>('');
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  // Show popup after a brief delay when page loads
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomePopup(true);
    }, 800); // Show after 800ms
    
    return () => clearTimeout(timer);
  }, []);

  // Set dark mode
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Auto-hide popup after 30 seconds if user doesn't dismiss it
  React.useEffect(() => {
    if (showWelcomePopup) {
      const timer = setTimeout(() => {
        setShowWelcomePopup(false);
      }, 30000); // 30 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showWelcomePopup]);

  // Handle escape key to close popup
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showWelcomePopup) {
        setShowWelcomePopup(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showWelcomePopup]);

  const handleStartArgument = () => {
    if (userArgument.trim()) {
      setShowWelcomePopup(false); // Hide popup when starting argument
      setCurrentView('arena');
    }
  };

  const handleBackToStart = () => {
    setCurrentView('start');
    setUserArgument('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleStartArgument();
    }
  };

  if (currentView === 'arena') {
    return (
      <Arena 
        roomName="General"
        onBack={handleBackToStart}
        initialUserMessage={userArgument}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
      {/* Welcome Popup */}
      {showWelcomePopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowWelcomePopup(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Card 
              className="p-6 bg-gradient-to-br from-yellow/10 to-yellow/5 border-2 border-yellow/50 relative overflow-hidden"
              style={{ 
                backgroundColor: 'rgba(10, 10, 10, 0.95)',
                borderColor: 'rgba(255, 205, 26, 0.5)',
                boxShadow: '0 0 50px rgba(255, 205, 26, 0.2)'
              }}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow/5 to-transparent"></div>
              
                             {/* Close button */}
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => setShowWelcomePopup(false)}
                 className="absolute top-2 right-2 text-muted-foreground hover:text-white hover:bg-white/10 z-10 transition-all duration-200"
                 title="Close (or press Escape)"
               >
                 <X className="w-4 h-4" />
               </Button>
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 bg-yellow/20 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255, 205, 26, 0.2)' }}
                  >
                    <Scale className="w-8 h-8 text-yellow" style={{ color: '#ffcd1a' }} />
                  </motion.div>
                </div>
                
                {/* Quote */}
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="text-4xl text-yellow/30 absolute -left-2 -top-2">"</div>
                    <div className="text-4xl text-yellow/30 absolute -right-2 -bottom-6">"</div>
                                         <motion.p 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ duration: 0.6, delay: 0.3 }}
                       className="text-white text-base leading-relaxed px-4"
                     >
                       In the legal industry, having the facts isn't enough — it's the 
                       <span className="text-yellow font-semibold" style={{ color: '#ffcd1a' }}> strength of your argument </span>
                       that wins. That's why lawyers need to continually build their 
                       <span className="text-yellow font-semibold" style={{ color: '#ffcd1a' }}>'argument muscle.'</span>
                     </motion.p>
                  </div>
                  
                                     <motion.div 
                     className="pt-2"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.6 }}
                   >
                     <motion.div
                       animate={{ scale: [1, 1.05, 1] }}
                       transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                     >
                                             <Button
                         onClick={() => setShowWelcomePopup(false)}
                         className="bg-yellow hover:bg-yellow/90 text-black font-semibold px-6 py-2 transition-all transform hover:scale-105 active:scale-95"
                         style={{ backgroundColor: '#ffcd1a', color: '#000000' }}
                       >
                         Let's Build That Muscle! 💪
                       </Button>
                                         </motion.div>
                   </motion.div>
                   
                   <motion.p 
                     className="text-xs text-muted-foreground"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ duration: 0.6, delay: 0.9 }}
                   >
                     Ready to sharpen your argument skills?
                   </motion.p>
                </div>
              </div>
              
              {/* Sparkle effects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-yellow/20"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                    fontSize: `${Math.random() * 10 + 8}px`
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </Card>
          </motion.div>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="flex items-center justify-center mb-8"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Swords className="w-10 h-10 text-yellow mr-4 drop-shadow-lg" style={{ color: '#ffcd1a' }} />
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-yellow drop-shadow-lg tracking-wider" style={{ color: '#ffcd1a' }}>
                Sir Interruptsalot
              </h1>
              <p className="text-lg md:text-xl text-yellow-muted mt-2 font-medium tracking-wide" style={{ color: '#fbbf24' }}>
                The Undefeated Debate Champion
              </p>
            </div>
            <Target className="w-10 h-10 text-yellow ml-4 drop-shadow-lg" style={{ color: '#ffcd1a' }} />
          </motion.div>

          <motion.div 
            className="space-y-6 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl md:text-3xl text-foreground font-semibold">
              Ready to argue with the undefeated champion? 
            </h2>
            <p className="text-lg text-muted-foreground">
              Bring your <span className="text-yellow font-semibold">strongest opinion</span> and let's see if you can out-argue an AI that's never lost a debate
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow drop-shadow-sm" />
                <span>5-minute rounds</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-yellow drop-shadow-sm" />
                <span>Judge picks winner (+1 point)</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-yellow drop-shadow-sm" />
                <span>Personality report at end</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Argument Input Section */}
        <motion.div 
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="p-8 border-2 border-yellow/30 bg-card/80 backdrop-blur-sm shadow-2xl shadow-yellow/10" style={{ backgroundColor: '#0a0a0a', borderColor: '#ffcd1a' }}>
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">What's your strongest take?</h3>
                <p className="text-muted-foreground">
                  Give me your strongest opinion about ANYTHING and I'll disagree with everything you say.
                  Logic, wit, and creativity will win you points! 🔥
                </p>
              </div>
              
              <div className="space-y-4">
                <textarea
                  value={userArgument}
                  onChange={(e) => setUserArgument(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your argument here... (e.g., 'Pineapple on pizza is actually amazing and anyone who disagrees has no taste')"
                  className="w-full h-32 px-4 py-3 bg-input border border-border rounded-lg resize-none text-base focus:ring-2 focus:ring-yellow focus:border-yellow transition-all placeholder:text-muted-foreground/60 text-foreground"
                  style={{ backgroundColor: '#1a1a1a', borderColor: '#262626', color: '#ffffff' }}
                />
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Ctrl/Cmd + Enter to start arguing
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {userArgument.length}/500
                  </div>
                </div>
                
                <Button 
                  onClick={handleStartArgument}
                  disabled={!userArgument.trim()}
                  className="w-full bg-yellow hover:bg-yellow-muted text-black font-semibold py-3 text-base transition-all transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50 shadow-lg shadow-yellow/20"
                  style={{ backgroundColor: '#ffcd1a', color: '#000000' }}
                  size="lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Start the Argument!
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <p className="text-sm text-muted-foreground/60">
            Warning: Sir Interruptsalot is programmed to disagree with everything you say. Prepare for maximum sass! 😏
          </p>
        </motion.div>
      </div>
    </div>
  );
}