import { create } from 'zustand';
import axios from 'axios';

export interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
}

export interface Conversation {
    id: number;
    title: string;
    created_at: string;
}

interface ChatState {
    conversations: Conversation[];
    currentConversationId: number | null;
    messages: Message[];
    isGenerating: boolean;

    fetchConversations: () => Promise<void>;
    setCurrentConversation: (id: number | null) => void;
    deleteConversation: (id: number) => Promise<void>;

    sendMessage: (text: string, file: File | null) => Promise<void>;
    clearChat: () => void;
}

const API_BASE = 'http://localhost:8000';

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    currentConversationId: null,
    messages: [],
    isGenerating: false,

    fetchConversations: async () => {
        try {
            const res = await axios.get(`${API_BASE}/history`);
            set({ conversations: res.data });
        } catch (err) {
            console.error(err);
        }
    },

    setCurrentConversation: async (id) => {
        if (!id) {
            set({ currentConversationId: null, messages: [] });
            return;
        }
        set({ currentConversationId: id });
        try {
            const res = await axios.get(`${API_BASE}/history/${id}/messages`);
            set({ messages: res.data });
        } catch (err) {
            console.error(err);
            set({ messages: [] });
        }
    },

    deleteConversation: async (id) => {
        try {
            await axios.delete(`${API_BASE}/history/${id}`);
            set((state) => ({
                conversations: state.conversations.filter(c => c.id !== id),
                currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
                messages: state.currentConversationId === id ? [] : state.messages
            }));
        } catch (err) {
            console.error(err);
        }
    },

    sendMessage: async (text: string, file: File | null) => {
        const { currentConversationId, messages } = get();

        // Optimistic UI update
        const userMessage: Message = { id: Date.now(), role: 'user', content: text };
        const assistantMessage: Message = { id: Date.now() + 1, role: 'assistant', content: '' };

        set({
            messages: [...messages, userMessage, assistantMessage],
            isGenerating: true,
        });

        const formData = new FormData();
        formData.append('message', text);
        if (currentConversationId) {
            formData.append('conversation_id', currentConversationId.toString());
        }
        if (file) {
            formData.append('file', file);
        }

        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                body: formData,
            });

            if (!response.body) throw new Error("No readable stream");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);

                        if (data.type === 'metadata' && data.conversation_id) {
                            set({ currentConversationId: data.conversation_id });
                        } else if (data.type === 'chunk' && data.content) {
                            fullContent += data.content;
                            // Update last message
                            set((state) => {
                                const currentMsgs = [...state.messages];
                                currentMsgs[currentMsgs.length - 1].content = fullContent;
                                return { messages: currentMsgs };
                            });
                        }
                    } catch (e) {
                        // Ignore incomplete JSON chunks from stream slicing
                    }
                }
            }

            // Refresh history to update titles
            get().fetchConversations();

        } catch (err) {
            console.error(err);
        } finally {
            set({ isGenerating: false });
        }
    },

    clearChat: () => {
        set({ currentConversationId: null, messages: [] });
    }
}));
