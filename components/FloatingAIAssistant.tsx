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
        <div className="fixed bottom-6 right-6 z-40">
            {/* Cửa sổ Chat */}
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <div className="w-[calc(100vw-3rem)] max-w-md h-[70vh] max-h-[600px] bg-white/50 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/30">
                     {/* Hình nền */}
                    <div className="absolute inset-0 z-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1599666433232-2b225eb21b87?q=80&w=1974&auto=format&fit=crop')" }}></div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                        <header className="p-4 border-b border-black/10 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center space-x-3">
                                <SparklesIcon className="w-7 h-7 text-teal-600" />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Trợ lý AI Xanh</h3>
                                </div>
                            </div>
                            <button onClick={onToggle} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-black/10">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </header>
                        
                        <div className="flex-grow p-4 overflow-y-auto">
                            <div className="space-y-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-white/80 text-gray-800'}`}>
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                            {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                                <div className="mt-2 max-w-xs md:max-w-sm w-full space-y-1">
                                                    {msg.groundingChunks.map((chunk, chunkIndex) => (
                                                        chunk.maps && (
                                                            <a 
                                                                key={chunkIndex}
                                                                href={chunk.maps.uri}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center space-x-2 bg-white/90 p-2 rounded-lg border border-gray-200 hover:bg-teal-50 hover:border-teal-200 transition-colors text-sm group"
                                                            >
                                                                <GlobeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                                <div>
                                                                    <p className="font-semibold text-gray-700 group-hover:text-teal-700 truncate">{chunk.maps.title}</p>
                                                                    <p className="text-xs text-blue-600 group-hover:underline truncate">Xem trên Google Maps</p>
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
                                        <div className="max-w-lg px-4 py-3 rounded-2xl bg-white/80 text-gray-800 flex items-center space-x-2 shadow-sm">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        <footer className={`p-3 border-t border-black/10 flex-shrink-0 ${showSuggestions ? 'pb-1' : ''}`}>
                            {showSuggestions && (
                                <div className="pb-3">
                                  <div className="flex flex-wrap gap-2 justify-start">
                                    {lastMessage.suggestions?.map((suggestion, index) => (
                                      <button
                                        key={index}
                                        onClick={() => onSubmit(suggestion)}
                                        className="px-3 py-2 bg-white/80 border border-teal-500/50 text-teal-700 rounded-full text-sm hover:bg-teal-50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400"
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
                                    className="flex-grow p-3 border border-gray-300/50 bg-white/70 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                                    disabled={isLoading}
                                />
                                <button type="submit" disabled={isLoading || !input.trim()} className="bg-teal-600 text-white rounded-lg p-3 shadow-md hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0">
                                    <PaperAirplaneIcon className="w-6 h-6" />
                                </button>
                            </form>
                        </footer>
                    </div>
                </div>
            </div>

            {/* Nút bật/tắt */}
             <button
                onClick={onToggle}
                className="bg-teal-600 text-white rounded-full p-4 shadow-lg hover:bg-teal-700 transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                aria-label="Mở Trợ lý AI"
            >
                <SparklesIcon className="w-8 h-8"/>
            </button>
        </div>
    );
};

export default FloatingAIAssistant;