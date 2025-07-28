import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Check, X } from "lucide-react";

interface RoomCardProps {
  title: string;
  onClick: (customTopic?: string) => void;
  index?: number;
  icon: LucideIcon;
}

export function RoomCard({ title, onClick, index = 0, icon: Icon }: RoomCardProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const isDefineYourOwn = title === "Define Your Own";

  const handleCardClick = () => {
    if (isDefineYourOwn && !isCustomMode) {
      setIsCustomMode(true);
    } else if (!isDefineYourOwn) {
      onClick();
    }
  };

  const handleSubmitCustom = () => {
    if (customTopic.trim()) {
      onClick(customTopic);
    }
  };

  const handleCancel = () => {
    setIsCustomMode(false);
    setCustomTopic("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitCustom();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <motion.div
      initial={{ 
        scale: 1,
        rotate: 0 
      }}
      animate={{ 
        scale: [1, 1.1, 0.95, 1.05, 1],
        rotate: [0, -2, 2, -1, 0]
      }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: "easeInOut"
      }}
      whileHover={{ scale: isCustomMode ? 1 : 1.05 }}
    >
      <Card 
        className={`p-6 bg-card border-2 border-border transition-all duration-200 group ${
          isCustomMode 
            ? 'border-yellow bg-accent' 
            : 'hover:bg-accent hover:border-yellow cursor-pointer'
        }`}
        onClick={isCustomMode ? undefined : handleCardClick}
      >
        <div className="flex flex-col items-center justify-center h-24">
          {isCustomMode ? (
            <div className="w-full space-y-3">
              <Input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter your topic..."
                className="text-center text-sm bg-background border-border focus:border-yellow"
                autoFocus
              />
              <div className="flex justify-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitCustom}
                  disabled={!customTopic.trim()}
                  className="bg-yellow text-black hover:opacity-80 h-6 px-2"
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-6 px-2 border-border hover:bg-accent"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Icon className="w-6 h-6 text-yellow-muted group-hover:text-yellow mb-3 transition-colors" />
              <span className="text-foreground text-center group-hover:text-yellow transition-colors">{title}</span>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}