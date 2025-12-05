import { useState, useCallback } from "react";
import { Message, ChatSession, DeveloperSettings } from "@/types/chat";
import { toast } from "sonner";

const DEVELOPER_PASSWORD = "avpx001@jonzjohn";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const useChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [developerSettings, setDeveloperSettings] = useState<DeveloperSettings>({
    enabled: false,
    customKnowledge: [],
  });

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const createSession = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  const updateSessionTitle = useCallback((id: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? "..." : "");
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    );
  }, []);

  const addMessage = useCallback((sessionId: string, message: Message) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, message], updatedAt: new Date() }
          : s
      )
    );
  }, []);

  const updateLastAssistantMessage = useCallback((sessionId: string, content: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const messages = [...s.messages];
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.role === "assistant") {
          messages[messages.length - 1] = { ...lastMsg, content };
        }
        return { ...s, messages };
      })
    );
  }, []);

  const unlockDeveloperMode = useCallback((password: string): boolean => {
    if (password === DEVELOPER_PASSWORD) {
      setDeveloperSettings((prev) => ({ ...prev, enabled: true }));
      return true;
    }
    return false;
  }, []);

  const addCustomKnowledge = useCallback((knowledge: string) => {
    setDeveloperSettings((prev) => ({
      ...prev,
      customKnowledge: [...prev.customKnowledge, knowledge],
    }));
  }, []);

  const removeCustomKnowledge = useCallback((index: number) => {
    setDeveloperSettings((prev) => ({
      ...prev,
      customKnowledge: prev.customKnowledge.filter((_, i) => i !== index),
    }));
  }, []);

  const sendMessage = useCallback(
    async (content: string, image?: string) => {
      let sessionId = currentSessionId;

      if (!sessionId) {
        sessionId = createSession();
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        content,
        role: "user",
        timestamp: new Date(),
        image,
      };

      addMessage(sessionId, userMessage);

      // Update title if first message
      const session = sessions.find((s) => s.id === sessionId);
      if (!session || session.messages.length === 0) {
        updateSessionTitle(sessionId, content);
      }

      setIsLoading(true);

      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: "",
        role: "assistant",
        timestamp: new Date(),
      };
      addMessage(sessionId, assistantMessage);

      try {
        // Get all messages for context
        const allMessages = [
          ...sessions.find((s) => s.id === sessionId)?.messages || [],
          userMessage
        ].map((m) => ({
          role: m.role,
          content: m.content,
          image: m.image,
        }));

        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            customKnowledge: developerSettings.customKnowledge,
            developerMode: developerSettings.enabled,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to get response");
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let textBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                updateLastAssistantMessage(sessionId, fullContent);
              }
            } catch {
              // Incomplete JSON, continue
            }
          }
        }

        // Final flush
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                updateLastAssistantMessage(sessionId, fullContent);
              }
            } catch {
              // Ignore
            }
          }
        }

        if (!fullContent) {
          updateLastAssistantMessage(sessionId, "I apologize, but I couldn't generate a response. Please try again.");
        }
      } catch (error) {
        console.error("Chat error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to get response";
        updateLastAssistantMessage(sessionId, `I'm sorry, I encountered an error: ${errorMessage}. Please try again.`);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [currentSessionId, sessions, createSession, addMessage, updateSessionTitle, updateLastAssistantMessage, developerSettings]
  );

  const clearChat = useCallback(() => {
    if (currentSessionId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, messages: [] } : s
        )
      );
    }
  }, [currentSessionId]);

  return {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    developerSettings,
    setCurrentSessionId,
    createSession,
    deleteSession,
    sendMessage,
    clearChat,
    unlockDeveloperMode,
    addCustomKnowledge,
    removeCustomKnowledge,
  };
};
