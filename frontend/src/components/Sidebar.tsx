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
        glassBlur,
        glassOpacity,
        hasGlow,
        isLight,
        setGlassBlur,
        setGlassOpacity,
        setHasGlow,
        setIsLight
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
            <div className="border-t border-white/5 pt-4 mt-4 bg-white/2 p-3 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aesthetics</span>
                    <button
                        onClick={() => setIsLight(!isLight)}
                        className={`text-[10px] border rounded-lg px-2 py-1 font-semibold transition-colors duration-200 ${isLight
                                ? 'bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300'
                                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                            }`}
                    >
                        {isLight ? "Light Mode" : "Dark Mode"}
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    {/* Glass Blur Slider */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                            <span>Glass Blur</span>
                            <span>{glassBlur}px</span>
                        </div>
                        <input
                            type="range"
                            min="4"
                            max="32"
                            value={glassBlur}
                            onChange={(e) => setGlassBlur(Number(e.target.value))}
                            className="w-full accent-nova-accent h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Glass Opacity Slider */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                            <span>Glass Opacity</span>
                            <span>{glassOpacity}%</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="40"
                            value={glassOpacity}
                            onChange={(e) => setGlassOpacity(Number(e.target.value))}
                            className="w-full accent-nova-accent h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Glow Checkbox Toggle */}
                    <div className="flex items-center justify-between py-0.5">
                        <span className="text-[9px] text-slate-400 font-semibold">Ambient Glows</span>
                        <button
                            type="button"
                            onClick={() => setHasGlow(!hasGlow)}
                            className={`text-[9px] border roundedpx-2 py-0.5 rounded-md px-2 border-white/10 transition-colors ${hasGlow
                                    ? 'bg-nova-accent/20 text-nova-accent border-nova-accent/30'
                                    : 'bg-transparent text-slate-500'
                                }`}
                        >
                            {hasGlow ? "Enabled" : "Disabled"}
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
