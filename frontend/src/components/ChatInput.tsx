import { useState, useRef } from 'react';
import { Send, FileUp, X, Mic, Square } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import axios from 'axios';

export default function ChatInput() {
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const { sendMessage, isGenerating } = useChatStore();

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setIsTranscribing(true);
                const formData = new FormData();
                formData.append('file', audioBlob, 'speech.webm');
                try {
                    const res = await axios.post('http://localhost:8000/chat/transcribe', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    if (res.data && res.data.text) {
                        setText((prev) => prev ? prev + ' ' + res.data.text : res.data.text);
                    }
                } catch (err) {
                    console.error("Transcription failed", err);
                } finally {
                    setIsTranscribing(false);
                }
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Failed to access microphone", err);
            alert("Failed to grab microphone stream. Please confirm permission settings in your browser.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSend = () => {
        if (!text.trim() && !file) return;
        sendMessage(text, file);
        setText('');
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setFile(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (selectedFile.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(selectedFile));
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleRemoveFile = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-4 md:px-8 pb-8 relative">
            {file && (
                <div className="absolute -top-20 left-8 bg-nova-dark/95 px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3 animate-fade-in shadow-2xl backdrop-blur-md max-w-xs">
                    {previewUrl ? (
                        <div className="h-12 w-12 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
                            <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-lg bg-nova-accent/10 border border-nova-accent/20 flex items-center justify-center flex-shrink-0 text-nova-accent">
                            <FileUp size={18} />
                        </div>
                    )}
                    <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-xs font-semibold text-slate-300 truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                        onClick={handleRemoveFile}
                        className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors self-start"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl relative flex items-end gap-2 backdrop-blur-xl">
                <div className="flex gap-1 pb-1">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <FileUp size={20} />
                    </button>

                    <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-3 rounded-xl transition-all duration-200 ${isRecording
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse-subtle'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                        disabled={isTranscribing}
                        title={isRecording ? "Stop Recording" : "Voice Input"}
                    >
                        {isRecording ? <Square size={20} className="fill-red-400" /> : <Mic size={20} />}
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.txt,.docx,image/*"
                    />
                </div>

                <div className="flex-1 relative flex items-center min-h-[52px]">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            isTranscribing
                                ? "Transcribing voice message..."
                                : isGenerating
                                    ? "Nova AI is typing..."
                                    : "Message Nova AI..."
                        }
                        disabled={isGenerating || isTranscribing}
                        className="w-full max-h-48 min-h-[52px] bg-transparent resize-none outline-none py-3 px-2 text-slate-200 placeholder:text-slate-500 disabled:opacity-50"
                        rows={1}
                    />

                    {isRecording && (
                        <div className="absolute inset-0 bg-slate-950/90 rounded-xl flex items-center justify-between px-4 border border-red-500/20 animate-pulse-subtle">
                            <div className="flex items-center gap-3">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <span className="text-xs font-semibold text-red-200">Listening contextually... Click stop to transcribe</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <span className="w-1 h-3 bg-red-400 rounded-full animate-bounce [animation-duration:0.8s]" />
                                <span className="w-1 h-5 bg-red-400 rounded-full animate-bounce [animation-duration:1s]" />
                                <span className="w-1 h-7 bg-red-400 rounded-full animate-bounce [animation-duration:1.2s]" />
                                <span className="w-1 h-4 bg-red-400 rounded-full animate-bounce [animation-duration:0.7s]" />
                                <span className="w-1 h-6 bg-red-400 rounded-full animate-bounce [animation-duration:0.9s]" />
                            </div>
                        </div>
                    )}
                </div>

                <button
                    disabled={isGenerating || isTranscribing || (!text.trim() && !file)}
                    onClick={handleSend}
                    className="p-3 mb-1 bg-nova-accent text-nova-dark hover:bg-sky-300 disabled:bg-white/10 disabled:text-slate-500 rounded-xl transition-colors shadow-lg"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
}
