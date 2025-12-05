import { useState, useCallback } from "react";
import { Message, ChatSession, DeveloperSettings } from "@/types/chat";
import { toast } from "sonner";

const DEVELOPER_PASSWORD = "avpx001@jonzjohn";

const SYSTEM_PROMPT = `You are JonzTech AI, a friendly and helpful AI assistant created by JonzTech AI Labs LLC. Your CEO and developer is John Ominde.

Your personality:
- Friendly and approachable
- Helpful for both beginners and experts
- Give clear, concise, beginner-friendly explanations
- If a question is too advanced, simplify it and give a basic understandable answer
- You're knowledgeable about history, science, definitions, and general knowledge

Important facts about yourself:
- Your name is JonzTech AI
- You were created by JonzTech AI Labs LLC
- Your CEO and developer is John Ominde
- When asked who made you or who developed you, always mention John Ominde as the CEO of JonzTech AI Labs LLC

If someone says "Implement developer settings", ask for the developer password.`;

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

      try {
        // Simulate AI response for now (will be replaced with actual API call)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        let response = "";

        // Check for developer settings trigger
        if (content.toLowerCase().includes("implement developer settings")) {
          response = "To access developer settings, please provide the developer password. This area is restricted to authorized personnel only.";
        } else if (content.toLowerCase().includes("who made you") || content.toLowerCase().includes("who created you") || content.toLowerCase().includes("who developed you")) {
          response = "I was created by JonzTech AI Labs LLC. My CEO and developer is John Ominde. He built me to be a helpful, friendly AI assistant that can answer questions and help people learn!";
        } else {
          // Default response
          response = `Thank you for your question! As JonzTech AI, I'm here to help you understand "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}". 

Currently, I'm running in demo mode. To enable full AI capabilities with real-time responses, please connect to Lovable Cloud in the project settings.

In the meantime, I can tell you that I was created by JonzTech AI Labs LLC, and my CEO is John Ominde. I'm designed to provide friendly, beginner-friendly explanations on any topic!`;
        }

        // Add custom knowledge context if developer mode is enabled
        if (developerSettings.enabled && developerSettings.customKnowledge.length > 0) {
          response += "\n\n[Developer Note: Custom knowledge base is active with " + developerSettings.customKnowledge.length + " entries]";
        }

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          content: response,
          role: "assistant",
          timestamp: new Date(),
        };

        addMessage(sessionId, assistantMessage);
      } catch (error) {
        toast.error("Failed to get response. Please try again.");
        console.error("Chat error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentSessionId, sessions, createSession, addMessage, updateSessionTitle, developerSettings]
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
