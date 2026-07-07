import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Sparkles, Trash2, Download, FileJson, FileText, ArrowRight } from 'lucide-react';

export default function ChatWindow() {
    const { messages, conversations, currentConversationId, deleteConversation, sendMessage } = useChatStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const activeConversation = conversations.find(c => c.id === currentConversationId);
    const activeTitle = activeConversation ? activeConversation.title : 'New Chat';

    const handleDeleteActive = () => {
        if (currentConversationId) {
            deleteConversation(currentConversationId);
        }
    };

    const exportAsMarkdown = () => {
        const title = activeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        let markdownContent = `# ${activeTitle}\n\n`;
        messages.forEach(msg => {
            const roleName = msg.role === 'user' ? 'User' : 'Nova AI';
            markdownContent += `### ${roleName}\n${msg.content}\n\n---\n\n`;
        });

        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `nova_chat_${title}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    const exportAsJSON = () => {
        const title = activeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const jsonContent = JSON.stringify({
            title: activeTitle,
            exported_at: new Date().toISOString(),
            messages: messages.map(m => ({ role: m.role, content: m.content }))
        }, null, 2);

        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `nova_chat_${title}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    const starters = [
        {
            title: "Summarize a PDF",
            desc: "Extract key takeaways and core concepts.",
            prompt: "Please summarize the core ideas and compile key action items from the document."
        },
        {
            title: "Code Review Assistant",
            desc: "Understand scripts or explain a screenshot.",
            prompt: "Write unit tests for a custom validator class in Python and review performance optimization spots."
        },
        {
            title: "Glassmorphism Guide",
            desc: "Learn modern styling tokens and glows.",
            prompt: "Explain how to build sleek glassmorphic UI elements using CSS, shadows, and opacity layers."
        },
        {
            title: "Data Visualizer Tips",
            desc: "Best formats to render visual tables.",
            prompt: "Show me a clean Markdown table structure with fake product sales metrics."
        }
    ];

    return (
        <div className="flex flex-col h-full relative z-10 w-full bg-nova-dark/40">
            {/* Elegant Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/2 backdrop-blur-md">
                <div className="flex flex-col min-w-0 pr-4">
                    <h2 className="text-sm font-semibold text-white truncate">
                        {activeTitle}
                    </h2>
                    <span className="text-[10px] text-slate-500 tracking-wider uppercase font-medium">Nova Multimodal Engine</span>
                </div>

                {currentConversationId && (
                    <div className="flex items-center gap-2 relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
                            title="Export Conversation"
                        >
                            <Download size={14} />
                            <span className="hidden sm:inline">Export</span>
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-12 top-0 mt-10 w-44 bg-nova-dark/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden py-1 animate-fade-in">
                                <button
                                    onClick={exportAsMarkdown}
                                    className="w-full px-4 py-2.5 text-left text-xs text-slate-300 hover:bg-white/10 flex items-center gap-2 transition-colors"
                                >
                                    <FileText size={14} className="text-nova-accent" />
                                    Export Markdown
                                </button>
                                <button
                                    onClick={exportAsJSON}
                                    className="w-full px-4 py-2.5 text-left text-xs text-slate-300 hover:bg-white/10 flex items-center gap-2 transition-colors"
                                >
                                    <FileJson size={14} className="text-purple-400" />
                                    Export JSON
                                </button>
                            </div>
                        )}

                        <button
                            onClick={handleDeleteActive}
                            className="p-2 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
                            title="Delete Chat"
                        >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    </div>
                )}
            </header>

            <div className="flex-1 overflow-y-auto scrollbar-hide" ref={scrollContainerRef}>
                {messages.length === 0 ? (
                    <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-8 animate-fade-in">
                        <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-white/5 text-nova-accent animate-pulse-subtle">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-nova-accent">
                            Nova AI Assistant
                        </h2>
                        <p className="text-slate-400 max-w-sm text-center text-sm mb-10">
                            Upload files, analyze images, or ask questions instantly. How can I help you today?
                        </p>

                        {/* Interactive Starter Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full px-4">
                            {starters.map((card, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(card.prompt, null)}
                                    className="group text-left p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg flex flex-col justify-between"
                                >
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-nova-accent transition-colors mb-1">
                                            {card.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                            {card.desc}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-nova-accent font-semibold mt-4 opacity-75 group-hover:opacity-100 transition-opacity">
                                        Try this <ArrowRight size={10} className="transform group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            ))}
                        </div>
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
