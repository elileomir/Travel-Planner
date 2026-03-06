'use client';
import { Sparkles, Send, Loader2, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = { role: 'user' | 'assistant'; text: string };

export default function GeminiAssistant({ isFullScreen, onClose }: { isFullScreen?: boolean, onClose?: () => void }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', text: "Hi! I'm your Baguio travel assistant. Need restaurant recommendations or want to adjust your itinerary?" }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
        } catch (err: any) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I had trouble connecting. " + err.message }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={isFullScreen ? "flex flex-col w-full h-full bg-white min-h-0" : "fixed bottom-20 md:bottom-6 right-4 md:right-6 w-[calc(100vw-2rem)] md:w-96 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 transition-all min-h-0"}>
            <div className="p-4 border-b border-blue-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100/50 shrink-0">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">AI Travel Assistant</h3>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-blue-200/50 text-blue-700 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className={isFullScreen ? "flex-1 overflow-y-auto min-h-0 p-4 flex flex-col gap-4 bg-slate-50/50" : "p-4 h-80 overflow-y-auto flex flex-col gap-4 bg-slate-50/50"}>
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`p-3 text-sm rounded-xl max-w-[85%] ${msg.role === 'assistant'
                            ? 'bg-white border border-slate-200 rounded-tl-none text-slate-700 self-start shadow-sm'
                            : 'bg-blue-600 border border-blue-700 rounded-tr-none text-white self-end shadow-sm'
                            }`}
                    >
                        {msg.role === 'assistant' ? (
                            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-semibold prose-table:block prose-table:overflow-x-auto prose-table:w-full break-words">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            msg.text
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none p-3 self-start shadow-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-xs text-slate-500 font-medium">Thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-slate-200 bg-white shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about Baguio..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 font-medium"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors shadow-sm"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
