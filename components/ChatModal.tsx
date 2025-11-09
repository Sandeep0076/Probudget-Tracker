import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { ChatIcon } from './icons/ChatIcon';
import { SendIcon } from './icons/SendIcon';
import { ChatMessage } from '../types';
import ChatMessageItem from './ChatMessageItem';

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatHistory: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, chatHistory, onSendMessage, isLoading }) => {
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [chatHistory, isLoading, isOpen]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedMessage = inputMessage.trim();
        if (trimmedMessage && !isLoading) {
            onSendMessage(trimmedMessage);
            setInputMessage('');
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl h-[80vh] bg-surface backdrop-blur-xl rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-border-shadow flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <ChatIcon className="w-6 h-6 text-accent" />
                        <h2 className="text-xl font-bold text-text-primary">AI Financial Advisor</h2>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Chat History */}
                <div className="p-4 sm:p-6 flex-grow overflow-y-auto">
                    <div className="space-y-6">
                        {chatHistory.map((message, index) => (
                           <ChatMessageItem key={index} message={message} />
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3">
                                 <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
                                    <ChatIcon className="w-5 h-5 text-accent" />
                                 </div>
                                <div className="max-w-md p-3 rounded-xl shadow-neu-sm bg-surface">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 bg-accent rounded-full animate-pulse delay-75"></span>
                                        <span className="h-2 w-2 bg-accent rounded-full animate-pulse delay-150"></span>
                                        <span className="h-2 w-2 bg-accent rounded-full animate-pulse delay-300"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Form */}
                <div className="p-4 bg-surface/50 rounded-b-xl border-t border-border-shadow flex-shrink-0">
                    <form onSubmit={handleSubmit} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Ask about your spending..."
                            className="flex-grow w-full px-4 py-3 bg-surface border border-border-shadow shadow-inner rounded-full text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                            disabled={isLoading}
                        />
                        <button 
                            type="submit"
                            disabled={isLoading || !inputMessage.trim()}
                            className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-brand text-white hover:bg-brand/90 disabled:bg-surface/50 disabled:cursor-not-allowed disabled:text-text-muted transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
                            aria-label="Send message"
                        >
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatModal;