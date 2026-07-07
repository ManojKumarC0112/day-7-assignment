import { PlusCircle, MessageSquare, Trash2 } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

export default function Sidebar() {
    const { conversations, currentConversationId, setCurrentConversation, deleteConversation, clearChat } = useChatStore();

    const handleNewChat = () => {
        setCurrentConversation(null);
        clearChat();
    };

    return (
        <aside className="w-72 h-full p-4 flex flex-col bg-transparent">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-nova-accent">
                🔥 Nova AI
            </h1>

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
        </aside>
    );
}
