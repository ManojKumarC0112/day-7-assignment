import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Sparkles } from 'lucide-react';

export default function ChatWindow() {
    const { messages } = useChatStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full relative z-10 w-full bg-nova-dark/40">
            <div className="flex-1 overflow-y-auto scrollbar-hide" ref={scrollContainerRef}>
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                        <div className="h-20 w-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-white/5 text-nova-accent">
                            <Sparkles size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-200 mb-2">How can I help you today?</h2>
                        <p className="text-slate-400 max-w-md">
                            Upload a document, share an image, or just start chatting. Nova AI is ready to assist you.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col pb-6 max-w-4xl mx-auto w-full">
                        {messages.map((msg, index) => (
                            <MessageBubble key={index} message={msg} />
                        ))}
                    </div>
                )}
            </div>

            <div className="w-full max-w-4xl mx-auto">
                <ChatInput />
            </div>
        </div>
    );
}
