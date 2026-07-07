import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useChatStore, type Message } from '../store/chatStore';

function ComparisonLayout({ results, isLight }: { results: any[], isLight: boolean }) {
    const [selectedTab, setSelectedTab] = useState<string>(results[0]?.provider || 'gemini');

    const providerColMap: Record<string, string> = {
        gemini: 'from-blue-600 via-indigo-650 to-cyan-500',
        groq: 'from-orange-500 to-red-650',
        nvidia: 'from-emerald-600 to-green-500 bg-green-600'
    };

    const latencies = results.map(r => r.latency || 999);
    const minLatency = Math.min(...latencies);

    return (
        <div className="w-full mt-4 space-y-6">
            {/* Summary Metrics Table */}
            <div className={`overflow-x-auto rounded-2xl border ${isLight ? 'border-slate-250 bg-slate-100/50' : 'border-white/5 bg-white/[0.02] backdrop-blur-md'} shadow-xl`}>
                <table className="w-full border-collapse text-left text-xs">
                    <thead>
                        <tr className={`border-b ${isLight ? 'border-slate-250 bg-slate-200/50' : 'border-white/5 bg-white/[0.01]'}`}>
                            <th className="p-4 font-bold uppercase tracking-wider text-slate-500">Provider & Model</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-slate-500">Latency</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-slate-500">Tokens</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-slate-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {results.map((res, i) => {
                            const isFastest = res.latency === minLatency;
                            const provName = String(res.provider).toUpperCase();
                            return (
                                <tr key={i} className={`transition-all hover:bg-white/[0.01] ${selectedTab === res.provider ? (isLight ? 'bg-indigo-50/50' : 'bg-nova-accent/5') : ''}`}>
                                    <td className="p-4 font-bold flex items-center gap-2">
                                        <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${providerColMap[res.provider] || 'from-slate-400 to-slate-650'}`} />
                                        <div className="flex flex-col">
                                            <span className={isLight ? 'text-slate-800' : 'text-white'}>{provName}</span>
                                            <span className="text-[10px] text-slate-500 font-normal">{res.model}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-semibold">
                                        <div className="flex items-center gap-2">
                                            <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{res.latency}s</span>
                                            {isFastest && (
                                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight">Fastest</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-400 font-medium">
                                        {res.tokens} tk
                                    </td>
                                    <td className="p-4">
                                        {res.error ? (
                                            <span className="text-red-400 font-semibold">Failed</span>
                                        ) : (
                                            <span className="text-emerald-400 font-semibold">Success</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Desktop Side-by-Side Panels Grid */}
            <div className="hidden lg:grid grid-cols-3 gap-4">
                {results.map((res, i) => {
                    const cleanProv = String(res.provider).toUpperCase();
                    return (
                        <div key={i} className={`flex flex-col rounded-2xl border overflow-hidden shadow-2xl transition-all duration-300 ${selectedTab === res.provider
                            ? 'border-nova-accent bg-black/35 scale-[1.01] shadow-nova-accent/5'
                            : (isLight ? 'border-slate-250 bg-slate-50/50' : 'border-white/5 bg-white/[0.02]')
                            }`}>
                            <div className={`p-4 bg-gradient-to-r ${providerColMap[res.provider] || 'from-slate-650 to-slate-700'} text-white font-bold flex justify-between items-center relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-white/5 pointer-events-none mix-blend-overlay" />
                                <span className="relative z-10 text-xs tracking-wider">{cleanProv}</span>
                                <span className="relative z-10 text-[10px] bg-black/30 px-2 py-0.5 rounded-full font-medium">{res.latency}s</span>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto max-h-[460px] text-xs leading-relaxed prose prose-invert overflow-hidden">
                                {res.error ? (
                                    <div className="text-red-450 text-red-500 font-semibold p-2 bg-red-500/10 rounded-lg">
                                        {res.text}
                                    </div>
                                ) : (
                                    <div className={`prose ${isLight ? 'prose-slate text-slate-700' : 'prose-invert text-slate-200'} max-w-none`}>
                                        <ReactMarkdown
                                            components={{
                                                code({ node, inline, className, children, ...props }: any) {
                                                    const match = /language-(\w+)/.exec(className || '')
                                                    return !inline && match ? (
                                                        <SyntaxHighlighter
                                                            style={vscDarkPlus}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            className="rounded-lg my-2 !bg-black/50 border border-white/5 overflow-x-auto text-[10px]"
                                                            {...props}
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    ) : (
                                                        <code className="bg-white/15 px-1 py-0.5 rounded text-nova-accent font-semibold" {...props}>
                                                            {children}
                                                        </code>
                                                    )
                                                }
                                            }}
                                        >
                                            {res.text}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex flex-col space-y-4">
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                    {results.map((res, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedTab(res.provider)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${selectedTab === res.provider
                                ? 'bg-nova-accent text-nova-dark shadow-md'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {res.provider}
                        </button>
                    ))}
                </div>
                {results.map((res, i) => {
                    if (res.provider !== selectedTab) return null;
                    return (
                        <div key={i} className={`p-5 rounded-2xl border ${isLight ? 'border-slate-250 bg-slate-100/50' : 'border-white/5 bg-nova-dark/60'} shadow-2xl animate-fade-in`}>
                            <div className="flex justify-between items-center mb-3">
                                <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r text-white ${providerColMap[res.provider]}`}>
                                    {String(res.provider).toUpperCase()}
                                </span>
                                <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{res.latency}s • {res.tokens} tk</span>
                            </div>
                            <div className={`text-xs leading-relaxed prose prose-invert overflow-hidden ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                                {res.error ? (
                                    <div className="text-red-405 text-red-500 font-semibold p-2 bg-red-500/10 rounded-lg">
                                        {res.text}
                                    </div>
                                ) : (
                                    <ReactMarkdown>{res.text}</ReactMarkdown>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function MessageBubble({ message, isLast }: { message: Message, isLast?: boolean }) {
    const { isLight, isGenerating } = useChatStore();
    const isUser = message.role === 'user';
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    let compareResults: any[] | null = null;
    if (!isUser && message.content.startsWith('[')) {
        try {
            const parsed = JSON.parse(message.content);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].provider) {
                compareResults = parsed;
            }
        } catch (e) {
            // Not JSON
        }
    }

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
                    <div className="flex items-center gap-2">
                        <div className={`font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-350'}`}>
                            {isUser ? 'You' : 'Nova AI'}
                        </div>
                        {message.provider && message.provider !== 'comparison' && (
                            <span className={`text-[8.5px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${isLight
                                ? 'bg-slate-200 border-slate-300 text-slate-600'
                                : 'bg-white/5 border-white/10 text-slate-400'
                                }`}>
                                {message.provider} • {message.model}
                            </span>
                        )}
                    </div>
                    {!isUser && !compareResults && (
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
                {compareResults ? (
                    <ComparisonLayout results={compareResults} isLight={isLight} />
                ) : (
                    <div className={`prose ${isLight ? 'prose-slate text-slate-700' : 'prose-invert text-slate-200'} prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent max-w-none`}>
                        {!message.content && isLast && isGenerating ? (
                            <div className="flex items-center gap-1.5 py-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${isLight ? 'bg-indigo-600' : 'bg-nova-accent'} animate-bounce [animation-delay:-0.3s]`} />
                                <span className={`w-2.5 h-2.5 rounded-full ${isLight ? 'bg-indigo-600' : 'bg-nova-accent'} animate-bounce [animation-delay:-0.15s]`} />
                                <span className={`w-2.5 h-2.5 rounded-full ${isLight ? 'bg-indigo-600' : 'bg-nova-accent'} animate-bounce`} />
                            </div>
                        ) : (
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
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
