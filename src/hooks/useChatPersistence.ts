import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatSession, Message } from "@/types/chat";

export const useChatPersistence = (userId: string | undefined) => {
  const loadSessions = useCallback(async (): Promise<ChatSession[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from("chat_sessions")
      .select(`
        id,
        title,
        created_at,
        updated_at,
        chat_messages (
          id,
          role,
          content,
          image_url,
          created_at
        )
      `)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading sessions:", error);
      return [];
    }

    return data.map((session) => ({
      id: session.id,
      title: session.title,
      messages: session.chat_messages
        .map((msg) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role as "user" | "assistant",
          timestamp: new Date(msg.created_at),
          image: msg.image_url || undefined,
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.updated_at),
    }));
  }, [userId]);

  const createSession = useCallback(async (title: string = "New Chat"): Promise<string | null> => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: userId, title })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return null;
    }

    return data.id;
  }, [userId]);

  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    if (!userId) return;

    await supabase
      .from("chat_sessions")
      .update({ title })
      .eq("id", sessionId)
      .eq("user_id", userId);
  }, [userId]);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!userId) return;

    await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", userId);
  }, [userId]);

  const saveMessage = useCallback(async (
    sessionId: string,
    message: Omit<Message, "id" | "timestamp">
  ): Promise<string | null> => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: message.role,
        content: message.content,
        image_url: message.image || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error saving message:", error);
      return null;
    }

    return data.id;
  }, [userId]);

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    if (!userId) return;

    await supabase
      .from("chat_messages")
      .update({ content })
      .eq("id", messageId);
  }, [userId]);

  const clearSessionMessages = useCallback(async (sessionId: string) => {
    if (!userId) return;

    await supabase
      .from("chat_messages")
      .delete()
      .eq("session_id", sessionId);
  }, [userId]);

  return {
    loadSessions,
    createSession,
    updateSessionTitle,
    deleteSession,
    saveMessage,
    updateMessage,
    clearSessionMessages,
  };
};