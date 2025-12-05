import { useRef, useEffect } from "react";
import { Message } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Bot } from "lucide-react";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export const ChatWindow = ({ messages, isLoading }: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <Bot className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">
            Welcome to <span className="gradient-text">JonzTech AI</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            I'm your friendly AI assistant created by JonzTech AI Labs LLC. Ask me anything about history, science, definitions, or any general knowledge questions. I'll give you clear, beginner-friendly explanations!
          </p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {["What is quantum physics?", "Tell me about ancient Egypt", "How does AI work?"].map((suggestion) => (
              <button
                key={suggestion}
                className="px-3 py-1.5 rounded-full text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
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
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
};
