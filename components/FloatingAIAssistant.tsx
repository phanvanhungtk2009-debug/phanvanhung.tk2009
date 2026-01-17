
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { GlobeIcon } from './icons/GlobeIcon';

interface FloatingAIAssistantProps {
    isOpen: boolean;
    onToggle: () => void;
    messages: ChatMessage[];
    isLoading: boolean;
    onSubmit: (message: string) => void;
}

const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({ isOpen, onToggle, messages, isLoading, onSubmit }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 300); // Focus input sau khi mở
        }
    }, [messages, isLoading, isOpen]);
    

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSubmit(input);
            setInput('');
        }
    };

    const lastMessage = messages[messages.length - 1];
    const showSuggestions = !isLoading && lastMessage?.role === 'model' && lastMessage.suggestions;

    return (
        <div className="fixed bottom-6 right-6 z-40 pointer-events-none flex flex-col items-end space-y-4">
            {/* Cửa sổ Chat */}
            <div className={`transition-all duration-300 ease-in-out origin-bottom-right ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' : 'opacity-0 translate-y-4 pointer-events-none scale-95'}`}>
                <div className="w-[calc(100vw-3rem)] max-w-md h-[70vh] max-h-[600px] bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/50">
                     {/* Hình nền */}
                    <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1599666433232-2b225eb21b87?q=80&w=1974&auto=format&fit=crop')" }}></div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                        <header className="p-4 border-b border-gray-200/50 flex items-center justify-between flex-shrink-0 bg-white/50">
                            <div className="flex items-center space-x-3">
                                <div className="bg-teal-100 p-2 rounded-full">
                                    <SparklesIcon className="w-5 h-5 text-teal-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Trợ lý AI Xanh</h3>
                                </div>
                            </div>
                            <button onClick={onToggle} className="text-gray-500 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-black/5">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </header>
                        
                        <div className="flex-grow p-4 overflow-y-auto">
                            <div className="space-y-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                            {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                                <div className="mt-2 max-w-[85%] w-full space-y-2">
                                                    {msg.groundingChunks.map((chunk, chunkIndex) => (
                                                        chunk.maps && (
                                                            <a 
                                                                key={chunkIndex}
                                                                href={chunk.maps.uri}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all group"
                                                            >
                                                                <div className="bg-blue-50 p-1.5 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                                    <GlobeIcon className="w-5 h-5 text-blue-500" />
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <p className="font-semibold text-gray-800 group-hover:text-teal-700 truncate text-sm">{chunk.maps.title}</p>
                                                                    <p className="text-xs text-blue-500 group-hover:underline truncate">Mở trong Google Maps</p>
                                                                </div>
                                                            </a>
                                                        )
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-white text-gray-800 border border-gray-100 shadow-sm flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                                            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        <footer className={`p-3 border-t border-gray-200/50 bg-white/60 flex-shrink-0 ${showSuggestions ? 'pb-2' : ''}`}>
                            {showSuggestions && (
                                <div className="pb-3 overflow-x-auto no-scrollbar">
                                  <div className="flex gap-2 min-w-max px-1">
                                    {lastMessage.suggestions?.map((suggestion, index) => (
                                      <button
                                        key={index}
                                        onClick={() => onSubmit(suggestion)}
                                        className="px-3 py-1.5 bg-white border border-teal-200 text-teal-700 rounded-full text-xs font-medium hover:bg-teal-50 hover:border-teal-300 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm"
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Hỏi về môi trường..."
                                    className="flex-grow p-3 text-sm border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
                                    disabled={isLoading}
                                />
                                <button 
                                    type="submit" 
                                    disabled={isLoading || !input.trim()} 
                                    className="bg-teal-600 text-white rounded-xl p-3 shadow-md hover:bg-teal-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
                                >
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </form>
                        </footer>
                    </div>
                </div>
            </div>

            {/* Nút bật/tắt */}
             <button
                onClick={onToggle}
                className="bg-teal-600 text-white rounded-full p-4 shadow-xl hover:bg-teal-700 transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-teal-500/30 pointer-events-auto"
                aria-label={isOpen ? "Đóng Trợ lý AI" : "Mở Trợ lý AI"}
            >
                {isOpen ? <XMarkIcon className="w-7 h-7" /> : <SparklesIcon className="w-7 h-7"/>}
            </button>
        </div>
    );
};

export default FloatingAIAssistant;
