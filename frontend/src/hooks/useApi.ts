import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8000' : 'http://127.0.0.1:8000';

// Utility function to get auth headers
const getAuthHeaders = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session); // Debug log
    const headers = {
      'Content-Type': 'application/json',
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    };
    console.log('Headers:', headers); // Debug log
    return headers;
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return { 'Content-Type': 'application/json' };
  }
};

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
    domain: string // ✅ domain is now required
  ): Promise<string | null> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, domain }), // ✅ backend expects this
      });

      if (response.ok) {
        const data = await response.json();
        await fetchConversations(); // Refresh list
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
        await fetchConversations(); // Refresh list after deletion
        return true;
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
    return false;
  };

  return { conversations, loading, createConversation, deleteConversation, refetch: fetchConversations };
};

// ------------------- Messages Hook -------------------
export const useMessages = (chatId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/messages/${chatId}`, {
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          // Ensure timestamps are properly handled from backend
          const messagesWithTimestamps = data.map((msg: Message) => ({
            ...msg,
            timestamp: msg.timestamp || new Date().toISOString()
          }));
          setMessages(messagesWithTimestamps);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chatId]);

  return { messages, loading, setMessages };
};

// ------------------- Chat Streaming -------------------
export const sendChatMessage = async (
  chatId: string,
  message: string,
  onChunk?: (chunk: string) => void
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

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (value) {
            // Decode the chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process complete lines from buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
                const content = trimmedLine.substring(6);
                if (content.trim()) {
                  onChunk(content);
                }
              }
            }
          }
          
          if (done) {
            // Process any remaining data in buffer
            if (buffer.trim()) {
              const trimmedBuffer = buffer.trim();
              if (trimmedBuffer.startsWith('data: ') && trimmedBuffer !== 'data: [DONE]') {
                const content = trimmedBuffer.substring(6);
                if (content.trim()) {
                  onChunk(content);
                }
              }
            }
            break;
          }
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