import { useRef, useEffect } from "react";
import { Message } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import logo from "@/assets/logo.jpg";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

export const ChatWindow = ({ messages, isLoading, onSuggestionClick }: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const suggestions = [
    "What is quantum physics?",
    "Tell me about ancient Egypt",
    "How does AI work?",
    "Who created you?",
  ];

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md animate-fade-in">
          <img 
            src={logo} 
            alt="JonzTech AI" 
            className="w-20 h-20 rounded-2xl mx-auto mb-6 object-cover"
          />
          <h2 className="text-2xl font-semibold mb-6">
            Welcome to <span className="gradient-text">JonzTech AI</span>. How can I help you?
          </h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="px-3 py-1.5 rounded-full text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors hover:scale-105 active:scale-95"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scrollbar-thin">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={messagesEndRef} className="h-1" />
    </div>
  );
};
