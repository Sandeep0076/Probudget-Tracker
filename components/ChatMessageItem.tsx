import React, { useMemo } from 'react';
import { ChatMessage } from '../types';
import { ChatIcon } from './icons/ChatIcon';

const parseMarkdown = (text: string) => {
    return text
        .split('\n')
        .map((line, index) => {
            line = line.trim();

            if (line.startsWith('## ')) {
                return <h2 key={index} className="text-lg font-bold mt-4 mb-2">{line.substring(3)}</h2>;
            }

            const boldRegex = /\*\*(.*?)\*\*/g;
            const parts = line.split(boldRegex);
            
            if (line.startsWith('* ')) {
                return (
                    <li key={index} className="list-disc ml-5 mb-1">
                        {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part.substring(i === 0 ? 2 : 0))}
                    </li>
                );
            }

            if (line) {
                return (
                    <p key={index} className="mb-2">
                        {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)}
                    </p>
                );
            }
            
            return null;
        })
        .filter(Boolean);
};


const ChatMessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    const formattedText = useMemo(() => parseMarkdown(message.text), [message.text]);

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
                   <ChatIcon className="w-5 h-5 text-accent" />
                </div>
            )}
            <div className={`max-w-md p-3 rounded-xl shadow-neu-sm ${isUser ? 'bg-brand/90 text-white' : 'bg-surface'}`}>
                <div className={`text-sm ${isUser ? 'text-white' : 'text-text-secondary'}`}>{formattedText}</div>
            </div>
        </div>
    );
};

export default ChatMessageItem;