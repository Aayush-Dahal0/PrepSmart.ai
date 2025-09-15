import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:8000'
    : 'http://127.0.0.1:8000';

// ------------------- Utility -------------------
const getAuthHeaders = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers = {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
    };
    return headers;
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return { 'Content-Type': 'application/json' };
  }
};

// ------------------- Types -------------------
export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

// ------------------- Conversations Hook -------------------
export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const createConversation = async (
    title: string,
    domain: string
  ): Promise<string | null> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, domain }),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchConversations();
        return data.id;
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
    return null;
  };

  const deleteConversation = async (id: string): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        await fetchConversations();
        return true;
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
    return false;
  };

  const renameConversation = async (
    id: string,
    newTitle: string
  ): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        await fetchConversations();
        return true;
      }
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
    return false;
  };

  return {
    conversations,
    loading,
    createConversation,
    deleteConversation,
    renameConversation,
    refetch: fetchConversations,
  };
};

// ------------------- Messages Hook -------------------
export const useMessages = (chatId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    if (!chatId) return;

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/messages/${chatId}`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        const messagesWithTimestamps = data.map((msg: Message) => ({
          ...msg,
          id: `server-${msg.id}`, // mark backend messages
          timestamp: msg.timestamp || new Date().toISOString(),
        }));

        setMessages((prev) => {
          // remove assistant placeholders once confirmed messages arrive
          const filtered = prev.filter(
            (m) => !(m.role === 'assistant' && !m.id.startsWith('server-'))
          );

          const existing = new Map(filtered.map((m) => [m.id, m]));
          for (const msg of messagesWithTimestamps) {
            existing.set(msg.id, msg);
          }

          return Array.from(existing.values()).sort(
            (a, b) =>
              new Date(a.timestamp).getTime() -
              new Date(b.timestamp).getTime()
          );
        });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [chatId]);

  return { messages, loading, setMessages, refetch: fetchMessages };
};

// ------------------- Chat Streaming -------------------
export const sendChatMessage = async (
  chatId: string,
  message: string,
  onChunk?: (chunk: string, isFinal?: boolean) => void,
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversation_id: chatId,
        user_message: message,
      }),
    });

    if (!response.ok) return false;

    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let totalReceived = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            totalReceived += value.length;

            if (onProgress) onProgress(totalReceived);

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                const content = trimmed.substring(6);
                if (content.trim()) {
                  try {
                    const parsed = JSON.parse(content);
                    if (parsed.content) {
                      onChunk(parsed.content, parsed.final || false);
                    }
                  } catch {
                    onChunk(content, false);
                  }
                }
              }
            }
          }

          if (done) break;
        }
      } finally {
        reader.releaseLock();
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to send message:', error);
    return false;
  }
};

// ------------------- User Profile & Auth -------------------
export const updateUserProfile = async (name: string): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name }),
    });

    if (!response.ok) return false;

    await supabase.auth.updateUser({ data: { name } }).catch(() => {});
    await supabase.auth.refreshSession();

    return true;
  } catch (error) {
    console.error('Failed to update profile:', error);
    return false;
  }
};

export const changeUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Password strength validation
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long' };
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      return { success: false, error: 'Password must contain at least one uppercase letter' };
    }
    
    if (!/[a-z]/.test(newPassword)) {
      return { success: false, error: 'Password must contain at least one lowercase letter' };
    }
    
    if (!/[0-9]/.test(newPassword)) {
      return { success: false, error: 'Password must contain at least one number' };
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return { success: false, error: 'Password must contain at least one special character' };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Supabase password update error:', error.message);
      return { success: false, error: error.message };
    }

    await supabase.auth.refreshSession();
    return { success: true };
  } catch (error) {
    console.error('Failed to change password:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};