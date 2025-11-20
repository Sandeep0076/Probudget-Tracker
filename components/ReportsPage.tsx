import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Transaction, TransactionType, Saving, ChatMessage, Budget } from '../types';
import { ChatIcon } from './icons/ChatIcon';
import ChatModal from './ChatModal';
import InteractiveReportDashboard from './reports/InteractiveReportDashboard';

// --- Main Page Component ---
interface ReportsPageProps {
    transactions: Transaction[];
    savings: Saving[];
    categoryBudgets: Budget[];
    overallBudget: Budget | null;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ transactions, savings, categoryBudgets, overallBudget }) => {
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);

    const handleOpenChat = () => {
        if (chatHistory.length === 0) {
            setChatHistory([{
                role: 'model',
                text: "Hello! I'm ProBudget AI. How can I help you analyze your finances today? You can ask me about spending patterns, insights for specific months, or anything else about your data."
            }]);
        }
        setIsChatModalOpen(true);
    };

    const handleSendMessage = async (message: string) => {
        if (transactions.length === 0 && savings.length === 0) {
            alert("There is no financial data to analyze. Please add some transactions or savings first.");
            return;
        }

        const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: message }];
        setChatHistory(newHistory);
        setIsChatLoading(true);

        const simplifiedTransactions = transactions.map(({ id, recurringTransactionId, ...rest }) => ({
            ...rest,
            amount: rest.type === TransactionType.EXPENSE ? -rest.amount : rest.amount
        }));

        const formattedHistory = newHistory
            .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}`)
            .join('\n');

        const prompt = `
            You are ProBudget AI, a friendly and expert financial advisor chatbot. Your sole purpose is to answer questions about the user's financial data, which is provided below in JSON format.
            - **Analyze the data thoroughly** before answering.
            - **Base your answers strictly on the provided transaction and savings data.** Do not invent or assume information.
            - If a question is about financial topics but cannot be answered from the data, state that you don't have the necessary information.
            - If a question is unrelated to finance, politely decline to answer.
            - Keep your answers concise, clear, and easy to understand.
            - Use Markdown for formatting (e.g., lists, bold text) to improve readability.

            --- FINANCIAL DATA ---
            Transactions: ${JSON.stringify(simplifiedTransactions)}
            Savings: ${JSON.stringify(savings)}
            Budgets: ${JSON.stringify(categoryBudgets)}
            Overall Budget: ${JSON.stringify(overallBudget)}
            --- END DATA ---

            --- CONVERSATION HISTORY ---
            ${formattedHistory}
            --- END HISTORY ---

            The user's new question is: "${message}"
            Please provide the next response as the AI.
        `;

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
            if (!apiKey) {
                setChatHistory(prev => [...prev, { role: 'model', text: "AI is not configured. Please set VITE_GEMINI_API_KEY in your .env and restart the dev server." }]);
                setIsChatLoading(false);
                return;
            }
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });

            setChatHistory(prev => [...prev, { role: 'model', text: response.text }]);
        } catch (error) {
            console.error("AI Chat Failed:", error);
            setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error while processing your request. Please try again." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8 relative">
            <InteractiveReportDashboard
                transactions={transactions}
                savings={savings}
                categoryBudgets={categoryBudgets}
                overallBudget={overallBudget}
            />

            {/* Floating Chat Button */}
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={handleOpenChat}
                    disabled={isChatLoading}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-brand text-white shadow-neu-lg hover:scale-110 transition-transform duration-300 border-t border-l border-border-highlight border-b border-r border-border-shadow"
                    title="Chat with AI Advisor"
                >
                    <ChatIcon className={`w-7 h-7 ${isChatLoading ? 'animate-pulse' : ''}`} />
                </button>
            </div>

            {isChatModalOpen && (
                <ChatModal
                    isOpen={isChatModalOpen}
                    onClose={() => setIsChatModalOpen(false)}
                    chatHistory={chatHistory}
                    onSendMessage={handleSendMessage}
                    isLoading={isChatLoading}
                />
            )}
        </div>
    );
};

export default ReportsPage;
