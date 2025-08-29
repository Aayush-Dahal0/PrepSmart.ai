import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
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
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        headers: getAuthHeaders(),
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
    domain: string = 'backend' // ✅ provide domain, default backend
  ): Promise<string | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        method: 'POST',
        headers: getAuthHeaders(),
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

  return { conversations, loading, createConversation, refetch: fetchConversations };
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
        const response = await fetch(`${API_BASE_URL}/messages/${chatId}`, {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data);
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
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        conversation_id: chatId, // ✅ correct key
        user_message: message,   // ✅ correct key
      }),
    });

    if (!response.ok) return false;

    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE format: "data: content\n"
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            const content = line.substring(6); // Remove "data: " prefix
            if (content.trim()) {
              onChunk(content);
            }
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to send message:', error);
    return false;
  }
};