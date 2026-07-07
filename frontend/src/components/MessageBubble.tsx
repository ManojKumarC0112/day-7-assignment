import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useChatStore, type Message } from '../store/chatStore';

export default function MessageBubble({ message }: { message: Message }) {
    const { isLight } = useChatStore();
    const isUser = message.role === 'user';
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const toggleSpeech = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            window.speechSynthesis.cancel();
            // Basic text cleaning from markdown formatting before speech
            const cleanText = message.content
                .replace(/```[\s\S]*?```/g, '') // strip code blocks
                .replace(/`([^`]+)`/g, '$1')   // strip inline backticks
                .replace(/[*#_~]/g, '');       // strip formatting characters
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    return (
        <div className={`flex gap-4 p-6 ${!isUser && (isLight ? 'bg-slate-205/30 border-y border-slate-300/30' : 'bg-white/2 border-y border-white/5')
            } transition-all duration-300 animate-fade-in relative group`}>
            <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${isUser ? 'bg-indigo-650 bg-indigo-600' : 'bg-nova-accent text-nova-dark'
                } shadow-lg shadow-black/20`}>
                {isUser ? <User size={20} className="text-white" /> : <Sparkles size={20} />}
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                    <div className={`font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-350'}`}>
                        {isUser ? 'You' : 'Nova AI'}
                    </div>
                    {!isUser && (
                        <button
                            onClick={toggleSpeech}
                            className={`p-1.5 rounded-lg transition-all ${isLight
                                ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            title={isSpeaking ? "Mute Read Aloud" : "Read Aloud"}
                        >
                            {isSpeaking ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
                        </button>
                    )}
                </div>
                <div className={`prose ${isLight ? 'prose-slate text-slate-700' : 'prose-invert text-slate-200'} prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent max-w-none`}>
                    <ReactMarkdown
                        components={{
                            code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                    <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        className="rounded-lg my-4 !bg-black/50 border border-white/10"
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                ) : (
                                    <code className="bg-white/10 px-1 py-0.5 rounded text-nova-accent" {...props}>
                                        {children}
                                    </code>
                                )
                            }
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
