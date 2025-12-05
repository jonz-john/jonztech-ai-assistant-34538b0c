import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "message-user rounded-tr-md"
            : "message-bot rounded-tl-md"
        )}
      >
        {message.image && (
          <img
            src={message.image}
            alt="Uploaded"
            className="max-w-full rounded-lg mb-2 max-h-64 object-cover"
          />
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <span className={cn(
          "text-[10px] mt-1.5 block opacity-60",
          isUser ? "text-right" : "text-left"
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
