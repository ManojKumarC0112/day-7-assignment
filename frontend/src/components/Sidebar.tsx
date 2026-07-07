import { useState } from 'react';
import { PlusCircle, MessageSquare, Trash2, Search } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

export default function Sidebar() {
    const {
        conversations,
        currentConversationId,
        setCurrentConversation,
        deleteConversation,
        clearChat,
        searchConversations,
        activePreset,
        setPreset
    } = useChatStore();
    const [searchQuery, setSearchQuery] = useState('');

    const handleNewChat = () => {
        setCurrentConversation(null);
        clearChat();
        setSearchQuery('');
        searchConversations('');
    };

    return (
        <aside className="w-72 h-full p-4 flex flex-col bg-transparent shrink-0">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-nova-accent">
                🔥 Nova AI
            </h1>

            <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                    <Search size={16} />
                </span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchConversations(e.target.value);
                    }}
                    placeholder="Search chats..."
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-slate-500 text-slate-200 outline-none focus:border-nova-accent/45 focus:ring-1 focus:ring-nova-accent/30 transition-all"
                />
            </div>

            <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-nova-accent mb-6"
            >
                <PlusCircle size={20} />
                <span className="font-medium">New Chat</span>
            </button>

            <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-2">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Recent</h2>
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors duration-200 ${currentConversationId === conv.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400'
                            }`}
                        onClick={() => setCurrentConversation(conv.id)}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <MessageSquare size={16} />
                            <span className="truncate text-sm">{conv.title}</span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Theme & Glass Customizer Panel */}
            <div className="border-t border-white/5 pt-4 mt-auto bg-white/2 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                    Aesthetic Presets
                </span>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setPreset('midnight')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all duration-200 ${activePreset === 'midnight'
                            ? 'bg-nova-accent/10 border-nova-accent/30 text-nova-accent shadow-sm'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                            }`}
                    >
                        <span>🌌 Midnight Glow</span>
                        {activePreset === 'midnight' && <span className="h-1.5 w-1.5 rounded-full bg-nova-accent animate-pulse" />}
                    </button>

                    <button
                        onClick={() => setPreset('ethereal')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all duration-200 ${activePreset === 'ethereal'
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-sm'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                            }`}
                    >
                        <span>🌑 Ethereal Dark</span>
                        {activePreset === 'ethereal' && <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />}
                    </button>

                    <button
                        onClick={() => setPreset('nordic')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all duration-200 ${activePreset === 'nordic'
                            ? 'bg-slate-200 border-slate-300 text-slate-800 shadow-sm'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                            }`}
                    >
                        <span>❄️ Nordic Light</span>
                        {activePreset === 'nordic' && <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-pulse" />}
                    </button>
                </div>
            </div>
        </aside>
    );
}
