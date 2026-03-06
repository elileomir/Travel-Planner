import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Send, Bot, User, MapPin, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  groundingLinks?: { uri: string; title: string }[];
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Hello! I am your Baguio Travel Assistant. I can help you find places, suggest itinerary changes, or give you local tips. What would you like to know?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Determine model based on thinking toggle
      const modelName = useThinking ? 'gemini-3.1-pro-preview' : 'gemini-2.5-flash';
      
      const config: any = {
        systemInstruction: 'You are a helpful travel assistant for a trip to Baguio City, Philippines. The users are a couple traveling from March 19 to March 22, 2026. They are arriving via Victory Liner from Cubao. They like ukay-ukay, food, and sightseeing. Be concise, friendly, and provide practical advice.',
      };

      if (useThinking) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      } else {
        // Use Google Maps grounding for flash model
        config.tools = [{ googleMaps: {} }];
        // Baguio coordinates
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: 16.4023,
              longitude: 120.5960
            }
          }
        };
      }

      // Build conversation history for context
      const contents = messages.slice(1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config
      });

      const responseText = response.text || 'Sorry, I could not generate a response.';
      
      // Extract grounding links if available
      let groundingLinks: { uri: string; title: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title) {
            groundingLinks.push({ uri: chunk.web.uri, title: chunk.web.title });
          } else if (chunk.maps?.uri && chunk.maps?.title) {
            groundingLinks.push({ uri: chunk.maps.uri, title: chunk.maps.title });
          } else if (chunk.maps?.placeAnswerSources?.reviewSnippets) {
            // Sometimes maps grounding returns different structures
            const uri = chunk.maps.uri || chunk.maps.placeAnswerSources.reviewSnippets[0]?.uri;
            const title = chunk.maps.title || chunk.maps.placeAnswerSources.reviewSnippets[0]?.title || 'Google Maps Location';
            if (uri) {
              groundingLinks.push({ uri, title });
            }
          }
        });
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        groundingLinks: groundingLinks.length > 0 ? groundingLinks : undefined
      }]);

    } catch (err: any) {
      console.error('Gemini API Error:', err);
      setError(err.message || 'An error occurred while communicating with the AI.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-emerald-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot size={24} />
          <h2 className="font-bold text-lg">Baguio AI Guide</h2>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer bg-emerald-900/50 px-3 py-1.5 rounded-full hover:bg-emerald-900/70 transition-colors">
            <input 
              type="checkbox" 
              checked={useThinking} 
              onChange={(e) => setUseThinking(e.target.checked)}
              className="rounded text-emerald-500 focus:ring-emerald-500 bg-emerald-800 border-emerald-600"
            />
            <span className="flex items-center gap-1">
              <Sparkles size={14} className={useThinking ? "text-amber-300" : "text-emerald-300"} />
              Deep Think (Pro)
            </span>
          </label>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1 text-emerald-700">
                <Bot size={18} />
              </div>
            )}
            
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-sm' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
            }`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none prose-emerald">
                  <Markdown>{msg.content}</Markdown>
                  
                  {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                        <MapPin size={12} /> Related Locations
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.groundingLinks.map((link, idx) => (
                          <a 
                            key={idx} 
                            href={link.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded border border-blue-100 transition-colors truncate max-w-[200px]"
                            title={link.title}
                          >
                            {link.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1 text-slate-600">
                <User size={18} />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1 text-emerald-700">
              <Bot size={18} />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2 text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex gap-3 justify-center my-4">
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 text-sm flex items-start gap-2 max-w-[80%]">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Baguio, places to eat, or itinerary changes..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-full px-5 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
        <div className="text-center mt-2">
          <p className="text-[10px] text-slate-400">AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
}
