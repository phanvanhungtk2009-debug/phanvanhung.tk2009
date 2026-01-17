
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
            <div className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-right ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' : 'opacity-0 translate-y-10 pointer-events-none scale-90'}`}>
                <div className="w-[calc(100vw-2rem)] sm:w-96 h-[600px] max-h-[75vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 ring-1 ring-black/5">
                    
                    {/* Header */}
                    <div className="relative z-10 flex flex-col h-full">
                        <header className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white/80 backdrop-blur-md sticky top-0">
                            <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-br from-teal-400 to-teal-600 p-2 rounded-xl shadow-lg shadow-teal-100">
                                    <SparklesIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">Trợ lý AI Xanh</h3>
                                    <p className="text-xs text-slate-400 flex items-center">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                                        Sẵn sàng hỗ trợ
                                    </p>
                                </div>
                            </div>
                            <button onClick={onToggle} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-50">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </header>
                        
                        {/* Messages Area */}
                        <div className="flex-grow p-4 overflow-y-auto bg-slate-50/50">
                            <div className="space-y-6">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                            <div className={`px-4 py-3 shadow-sm text-sm leading-relaxed ${
                                                msg.role === 'user' 
                                                ? 'bg-teal-600 text-white rounded-2xl rounded-tr-sm' 
                                                : 'bg-white text-slate-700 border border-slate-200/60 rounded-2xl rounded-tl-sm'
                                            }`}>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                            
                                            {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                                <div className="mt-2 w-full space-y-2">
                                                    {msg.groundingChunks.map((chunk, chunkIndex) => (
                                                        chunk.maps && (
                                                            <a 
                                                                key={chunkIndex}
                                                                href={chunk.maps.uri}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all group"
                                                            >
                                                                <div className="bg-blue-50 p-1.5 rounded-lg group-hover:bg-blue-100 transition-colors shrink-0">
                                                                    <GlobeIcon className="w-4 h-4 text-blue-600" />
                                                                </div>
                                                                <div className="overflow-hidden min-w-0">
                                                                    <p className="font-semibold text-slate-800 group-hover:text-teal-700 truncate text-xs">{chunk.maps.title}</p>
                                                                    <p className="text-[10px] text-blue-500 group-hover:underline truncate">Mở bản đồ</p>
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
                                        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-slate-100 shadow-sm flex items-center space-x-1.5">
                                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <footer className="p-3 bg-white border-t border-slate-100 flex-shrink-0">
                            {showSuggestions && (
                                <div className="pb-3 overflow-x-auto no-scrollbar scroll-smooth">
                                  <div className="flex gap-2 min-w-max px-1">
                                    {lastMessage.suggestions?.map((suggestion, index) => (
                                      <button
                                        key={index}
                                        onClick={() => onSubmit(suggestion)}
                                        className="px-3 py-1.5 bg-teal-50 border border-teal-100 text-teal-700 rounded-full text-xs font-medium hover:bg-teal-100 hover:border-teal-200 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm whitespace-nowrap"
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            <form onSubmit={handleSubmit} className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Hỏi về môi trường..."
                                    className="flex-grow px-3 py-2 text-sm bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400"
                                    disabled={isLoading}
                                />
                                <button 
                                    type="submit" 
                                    disabled={isLoading || !input.trim()} 
                                    className="bg-teal-600 text-white rounded-xl p-2.5 shadow-md hover:bg-teal-700 transition-all disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
                                >
                                    <PaperAirplaneIcon className="w-4 h-4" />
                                </button>
                            </form>
                        </footer>
                    </div>
                </div>
            </div>

            {/* Floating Toggle Button */}
             <button
                onClick={onToggle}
                className={`group flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-500/30 pointer-events-auto ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-gradient-to-br from-teal-500 to-teal-600'}`}
                aria-label={isOpen ? "Đóng Trợ lý AI" : "Mở Trợ lý AI"}
            >
                {isOpen ? <XMarkIcon className="w-6 h-6 text-white" /> : <SparklesIcon className="w-7 h-7 text-white animate-[pulse_3s_ease-in-out_infinite]"/>}
            </button>
        </div>
    );
};

export default FloatingAIAssistant;
