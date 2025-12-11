import { useState, useCallback, useEffect } from "react";
import { Message, ChatSession, DeveloperSettings, DownloadLink } from "@/types/chat";
import { toast } from "sonner";
import { useChatPersistence } from "./useChatPersistence";
import { setDeveloperModeFlag } from "@/utils/antiInspect";
import { supabase } from "@/integrations/supabase/client";
import { createPDFBlobUrl } from "@/utils/pdfUtils";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Check if user has developer/admin role from the database
async function checkDeveloperRole(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error checking roles:", error.message);
      return false;
    }

    // Check if user has admin or developer role
    return roles?.some(r => r.role === "admin" || r.role === "developer") || false;
  } catch (error) {
    console.error("Error checking developer role:", error);
    return false;
  }
}

export const useChat = (userId?: string) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [developerSettings, setDeveloperSettings] = useState<DeveloperSettings>({
    enabled: false,
    customKnowledge: [],
  });

  const persistence = useChatPersistence(userId);

  // Load sessions from database when user logs in
  useEffect(() => {
    if (userId) {
      setIsLoadingSessions(true);
      persistence.loadSessions().then((loadedSessions) => {
        setSessions(loadedSessions);
        setIsLoadingSessions(false);
      });
    } else {
      // Clear sessions when user logs out
      setSessions([]);
      setCurrentSessionId(null);
    }
  }, [userId]);

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const createSession = useCallback(async () => {
    if (userId) {
      // Create in database
      const newId = await persistence.createSession("New Chat");
      if (newId) {
        const newSession: ChatSession = {
          id: newId,
          title: "New Chat",
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSessionId(newId);
        return newId;
      }
    }
    // Fallback for non-authenticated users (temporary session)
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
  }, [userId, persistence]);

  const deleteSession = useCallback(async (id: string) => {
    if (userId) {
      await persistence.deleteSession(id);
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId, userId, persistence]);

  const updateSessionTitle = useCallback(async (id: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? "..." : "");
    if (userId) {
      await persistence.updateSessionTitle(id, title);
    }
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    );
  }, [userId, persistence]);

  const addMessage = useCallback((sessionId: string, message: Message) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, message], updatedAt: new Date() }
          : s
      )
    );
  }, []);

  const updateLastAssistantMessage = useCallback((sessionId: string, content: string, messageId?: string, downloadLink?: DownloadLink) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const messages = [...s.messages];
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.role === "assistant") {
          messages[messages.length - 1] = { 
            ...lastMsg, 
            content, 
            id: messageId || lastMsg.id,
            downloadLink: downloadLink || lastMsg.downloadLink
          };
        }
        return { ...s, messages };
      })
    );
  }, []);

  // Generate PDF from content and attach download link to message
  const generatePDFResponse = useCallback((sessionId: string, content: string, title: string) => {
    const filename = `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    const url = createPDFBlobUrl(content, title);
    const downloadLink: DownloadLink = { url, filename };
    
    const responseMessage = `All done! Your **${title}** PDF is ready for download:`;
    
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      content: responseMessage,
      role: "assistant",
      timestamp: new Date(),
      downloadLink,
    };
    
    addMessage(sessionId, assistantMessage);
    return assistantMessage;
  }, [addMessage]);

  // Server-validated developer mode unlock
  const unlockDeveloperMode = useCallback(async (): Promise<boolean> => {
    const hasAccess = await checkDeveloperRole();
    if (hasAccess) {
      setDeveloperSettings((prev) => ({ ...prev, enabled: true }));
      setDeveloperModeFlag(true);
      toast.success("Developer mode enabled!");
      return true;
    }
    toast.error("You don't have developer access. Contact an administrator.");
    return false;
  }, []);

  const addCustomKnowledge = useCallback((knowledge: string) => {
    setDeveloperSettings((prev) => ({
      ...prev,
      customKnowledge: [...prev.customKnowledge, knowledge],
    }));
    toast.success("Knowledge added to AI memory!");
  }, []);

  const removeCustomKnowledge = useCallback((index: number) => {
    setDeveloperSettings((prev) => ({
      ...prev,
      customKnowledge: prev.customKnowledge.filter((_, i) => i !== index),
    }));
  }, []);

  const sendMessage = useCallback(
    async (content: string, image?: string, documentText?: string) => {
      let sessionId = currentSessionId;

      if (!sessionId) {
        sessionId = await createSession();
      }

      // If there's document text, prepend it to the content
      let fullContent = content;
      if (documentText) {
        fullContent = `[Document Content]:\n${documentText}\n\n[User Question]: ${content || "Please analyze this document."}`;
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: fullContent,
        role: "user",
        timestamp: new Date(),
        image,
      };

      addMessage(sessionId, userMessage);

      // Save user message to database
      if (userId) {
        const savedMsgId = await persistence.saveMessage(sessionId, {
          role: "user",
          content: fullContent,
          image,
        });
        if (savedMsgId) {
          userMessage.id = savedMsgId;
        }
      }

      // Update title if first message
      const session = sessions.find((s) => s.id === sessionId);
      if (!session || session.messages.length === 0) {
        updateSessionTitle(sessionId, content || "Document analysis");
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
              const contentChunk = parsed.choices?.[0]?.delta?.content;
              if (contentChunk) {
                fullContent += contentChunk;
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
              const contentChunk = parsed.choices?.[0]?.delta?.content;
              if (contentChunk) {
                fullContent += contentChunk;
                updateLastAssistantMessage(sessionId, fullContent);
              }
            } catch {
              // Ignore
            }
          }
        }

        if (!fullContent) {
          fullContent = "I apologize, but I couldn't generate a response. Please try again.";
          updateLastAssistantMessage(sessionId, fullContent);
        }

        // Check if response contains PDF content markers
        const pdfMatch = fullContent.match(/\[PDF_CONTENT\]([\s\S]*?)\[\/PDF_CONTENT\]/);
        if (pdfMatch) {
          const pdfContent = pdfMatch[1].trim();
          // Extract title from first line or use default
          const firstLine = pdfContent.split('\n')[0].trim();
          const title = firstLine.length > 0 && firstLine.length < 100 ? firstLine : "JonzTech_AI_Document";
          
          // Create PDF and get download link
          const filename = `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
          const url = createPDFBlobUrl(pdfContent, title);
          const downloadLink: DownloadLink = { url, filename };
          
          // Update message to show clean content with download link
          const cleanContent = fullContent.replace(/\[PDF_CONTENT\][\s\S]*?\[\/PDF_CONTENT\]/, '').trim() || 
            `Your PDF "${title}" is ready for download:`;
          
          // Update the assistant message with download link
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== sessionId) return s;
              const messages = [...s.messages];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg?.role === "assistant") {
                messages[messages.length - 1] = { 
                  ...lastMsg, 
                  content: cleanContent,
                  downloadLink
                };
              }
              return { ...s, messages };
            })
          );
          fullContent = cleanContent;
        }

        // Save assistant message to database
        if (userId) {
          const savedAssistantId = await persistence.saveMessage(sessionId, {
            role: "assistant",
            content: fullContent,
          });
          if (savedAssistantId) {
            updateLastAssistantMessage(sessionId, fullContent, savedAssistantId);
          }
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
    [currentSessionId, sessions, createSession, addMessage, updateSessionTitle, updateLastAssistantMessage, developerSettings, userId, persistence]
  );

  const clearChat = useCallback(async () => {
    if (currentSessionId) {
      if (userId) {
        await persistence.clearSessionMessages(currentSessionId);
      }
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, messages: [] } : s
        )
      );
    }
  }, [currentSessionId, userId, persistence]);

  return {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    isLoadingSessions,
    developerSettings,
    setCurrentSessionId,
    createSession,
    deleteSession,
    sendMessage,
    clearChat,
    unlockDeveloperMode,
    addCustomKnowledge,
    removeCustomKnowledge,
    generatePDFResponse,
  };
};
