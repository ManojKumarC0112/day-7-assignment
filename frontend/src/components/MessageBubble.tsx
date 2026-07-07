import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { Message } from '../store/chatStore';

export default function MessageBubble({ message }: { message: Message }) {
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
        <div className={`flex gap-4 p-6 ${!isUser && 'bg-white/5'} transition-all animate-fade-in relative group`}>
            <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${isUser ? 'bg-indigo-500' : 'bg-nova-accent text-nova-dark'} shadow-lg shadow-black/20`}>
                {isUser ? <User size={20} className="text-white" /> : <Sparkles size={20} />}
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                    <div className="font-semibold mb-1 text-slate-300">
                        {isUser ? 'You' : 'Nova AI'}
                    </div>
                    {!isUser && (
                        <button
                            onClick={toggleSpeech}
                            className="text-slate-400 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-all"
                            title={isSpeaking ? "Mute Read Aloud" : "Read Aloud"}
                        >
                            {isSpeaking ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
                        </button>
                    )}
                </div>
                <div className="prose prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent max-w-none text-slate-200">
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
