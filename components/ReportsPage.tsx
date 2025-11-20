import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { Transaction, TransactionType, Saving, ChatMessage } from '../types';
import { formatCurrency } from '../utils/formatters';
import { ChatIcon } from './icons/ChatIcon';
import ChatModal from './ChatModal';

// Colors for the charts
const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#64748b', '#f43f5e', '#38bdf8', '#e11d48', '#fbbf24', '#4ade80', '#c084fc'];

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface/80 backdrop-blur-sm p-3 rounded-md border border-border-shadow text-sm shadow-neu-lg">
                <p className="label text-text-secondary font-semibold mb-2">{`${label}`}</p>
                {payload.map((pld: any, index: number) => (
                    <div key={index} style={{ color: pld.color || pld.fill }} className="flex items-center gap-2">
                        <span>{pld.name}:</span>
                        <span className="font-bold">{formatCurrency(pld.value)}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

interface ChartProps {
    data: any[];
    keys: string[];
    title: string;
    emptyMessage: string;
    filterOptions?: string[];
    selectedFilter?: string;
    onFilterChange?: (value: string) => void;
    filterLabel?: string;
}

const StackedBarChart: React.FC<ChartProps> = ({ data, keys, title, emptyMessage, filterOptions, selectedFilter, onFilterChange, filterLabel }) => {
    const hasData = data.length > 0 && data.some(item => keys.some(key => (item[key] || 0) > 0));

     if (!hasData) {
        return (
            <div className="bg-surface backdrop-blur-xl p-6 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
                     {filterOptions && onFilterChange && (
                        <select 
                            value={selectedFilter} 
                            onChange={(e) => onFilterChange(e.target.value)}
                            className="px-3 py-1 bg-surface border border-border-shadow rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                            <option value="all">{filterLabel || 'All'}</option>
                            {filterOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex items-center justify-center h-[300px] text-text-secondary">{emptyMessage}</div>
            </div>
        )
    }

    return (
        <div className="bg-surface backdrop-blur-xl p-6 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
                {filterOptions && onFilterChange && (
                    <select 
                        value={selectedFilter} 
                        onChange={(e) => onFilterChange(e.target.value)}
                        className="px-3 py-1 bg-surface border border-border-shadow rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                        <option value="all">{filterLabel || 'All'}</option>
                        {filterOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                )}
            </div>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-shadow)" />
                        <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} />
                        <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickFormatter={(value) => formatCurrency(value as number)} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface)' }} />
                        <Legend wrapperStyle={{fontSize: "12px", paddingTop: "15px", overflow: "auto", maxHeight: "60px", color: "var(--color-text-secondary)" }} />
                        {keys.map((key, index) => (
                            <Bar key={key} dataKey={key} stackId="a" fill={key === 'Other' ? '#94a3b8' : COLORS[index % COLORS.length]} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}


// --- Main Page Component ---
const ReportsPage: React.FC<{ transactions: Transaction[], savings: Saving[] }> = ({ transactions, savings }) => {
    const [dateFilter, setDateFilter] = useState('last-6-months');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedLabel, setSelectedLabel] = useState<string>('all');

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

    const { categoryChartData, chartCategoryKeys, allCategories, labelChartData, chartLabelKeys, allLabels } = useMemo(() => {
        const now = new Date();
        now.setUTCHours(0, 0, 0, 0);
        let startDate: Date | null = null;
        let endDate: Date | null = new Date(now);
        endDate.setUTCHours(23, 59, 59, 999);


        switch (dateFilter) {
            case 'this-year':
                startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
                break;
            case 'last-6-months':
                startDate = new Date(now);
                startDate.setUTCMonth(startDate.getUTCMonth() - 5);
                startDate.setUTCDate(1);
                break;
            case 'custom':
                if (!customStartDate || !customEndDate) {
                    startDate = null; endDate = null;
                } else {
                    startDate = new Date(customStartDate);
                    endDate = new Date(customEndDate);
                    endDate.setUTCHours(23, 59, 59, 999);
                }
                break;
            case 'all':
            default:
                startDate = null; endDate = null;
                break;
        }

        const filteredTransactions = transactions.filter(t => {
            const txDate = new Date(t.date + 'T00:00:00.000Z');
            if (t.type !== TransactionType.EXPENSE) return false;
            if (startDate && txDate < startDate) return false;
            if (endDate && txDate > endDate) return false;
            return true;
        });

        // 1. Collect all categories and labels first (for the dropdowns)
        const categorySet = new Set<string>();
        const labelSet = new Set<string>();
        const labelTotals: {[label: string]: number} = {};

        filteredTransactions.forEach(t => {
             categorySet.add(t.category);
             if (t.labels) {
                 t.labels.forEach(l => {
                     labelSet.add(l);
                     labelTotals[l] = (labelTotals[l] || 0) + t.amount;
                 });
             }
        });

        const allCategories = Array.from(categorySet).sort();
        const allLabels = Array.from(labelSet).sort();

        // 2. Determine top labels
        const sortedLabels = Object.entries(labelTotals).sort((a, b) => b[1] - a[1]);
        const topLabels = new Set(sortedLabels.slice(0, 5).map(l => l[0])); // Top 5

        const catMonthlyData: { [month: string]: { [category: string]: number } } = {};
        const labMonthlyData: { [month: string]: { [label: string]: number } } = {};

        filteredTransactions.forEach(t => {
            const month = new Date(t.date + 'T00:00:00.000Z').toLocaleString('default', { month: 'short', year: '2-digit', timeZone: 'UTC' });
            
            // By Category
            if (selectedCategory === 'all' || t.category === selectedCategory) {
                if (!catMonthlyData[month]) catMonthlyData[month] = {};
                catMonthlyData[month][t.category] = (catMonthlyData[month][t.category] || 0) + t.amount;
            }
            
            // By Label
            if (t.labels && t.labels.length > 0) {
                if (!labMonthlyData[month]) labMonthlyData[month] = {};
                t.labels.forEach(label => {
                    let targetLabel = label;
                    if (selectedLabel === 'all') {
                        if (!topLabels.has(label)) {
                            targetLabel = 'Other';
                        }
                    } else {
                        // If specific label selected, only include if it matches
                        if (label !== selectedLabel) return;
                    }
                    
                    labMonthlyData[month][targetLabel] = (labMonthlyData[month][targetLabel] || 0) + t.amount;
                });
            }
        });

        const catChartData = Object.entries(catMonthlyData).map(([month, categories]) => ({ name: month, ...categories })).sort((a,b) => new Date(`1 ${a.name}`).getTime() - new Date(`1 ${b.name}`).getTime());
        const labChartData = Object.entries(labMonthlyData).map(([month, labels]) => ({ name: month, ...labels })).sort((a,b) => new Date(`1 ${a.name}`).getTime() - new Date(`1 ${b.name}`).getTime());

        // Determine Keys for Charts
        let chartCategoryKeys: string[] = [];
        if (selectedCategory === 'all') {
            chartCategoryKeys = allCategories;
        } else {
            chartCategoryKeys = [selectedCategory];
        }

        let chartLabelKeys: string[] = [];
        if (selectedLabel === 'all') {
            chartLabelKeys = Array.from(topLabels);
            // Check if we actually have "Other" in the data
            const hasOther = labChartData.some(d => d['Other'] !== undefined);
            if (hasOther) chartLabelKeys.push('Other');
        } else {
            chartLabelKeys = [selectedLabel];
        }

        return { 
            categoryChartData: catChartData, 
            chartCategoryKeys,
            allCategories,
            labelChartData: labChartData,
            chartLabelKeys,
            allLabels
        };
    }, [transactions, dateFilter, customStartDate, customEndDate, selectedCategory, selectedLabel]);

    const savingsChartData = useMemo(() => {
        const now = new Date();
        now.setUTCHours(0, 0, 0, 0);
        let startDate: Date | null = null;
        let endDate: Date | null = new Date(now);
        endDate.setUTCHours(23, 59, 59, 999);

        switch (dateFilter) {
            case 'this-year':
                startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
                break;
            case 'last-6-months':
                startDate = new Date(now);
                startDate.setUTCMonth(startDate.getUTCMonth() - 5);
                startDate.setUTCDate(1);
                break;
            case 'custom':
                 if (!customStartDate || !customEndDate) { 
                    startDate = null; endDate = null; 
                 } else {
                    startDate = new Date(customStartDate);
                    endDate = new Date(customEndDate);
                    endDate.setUTCHours(23, 59, 59, 999);
                 }
                break;
            case 'all':
            default:
                 startDate = null; endDate = null;
                break;
        }

        const filteredSavings = savings.filter(s => {
            const savingDate = new Date(Date.UTC(s.year, s.month, 1));
            if (startDate && savingDate < startDate) return false;
            if (endDate && savingDate > endDate) return false;
            return true;
        });

        if (filteredSavings.length === 0) return [];

        let cumulative = 0;
        const data = filteredSavings.map(s => {
            cumulative += s.amount;
            return {
                name: new Date(Date.UTC(s.year, s.month, 1)).toLocaleString('default', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
                "Monthly Savings": s.amount,
                "Cumulative Savings": cumulative,
            };
        });
        
        return data;
    }, [savings, dateFilter, customStartDate, customEndDate]);

    const commonInputClasses = "w-full px-4 py-2 bg-surface border border-border-shadow shadow-inner rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent transition-colors";

    return (
        <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-text-primary mb-6">Financial Reports</h1>
            
            {/* Filter Section */}
            <div className="bg-surface backdrop-blur-xl p-4 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="date-filter" className="block text-sm font-medium text-text-secondary mb-1">Date Range</label>
                        <select id="date-filter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={commonInputClasses}>
                            <option value="last-6-months" className="bg-background-end">Last 6 Months</option>
                            <option value="this-year" className="bg-background-end">This Year</option>
                            <option value="all" className="bg-background-end">All Time</option>
                            <option value="custom" className="bg-background-end">Custom Range</option>
                        </select>
                    </div>
                     {dateFilter === 'custom' && (
                        <>
                            <div>
                                 <label htmlFor="start-date" className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
                                 <input type="date" id="start-date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className={commonInputClasses} />
                            </div>
                            <div>
                                 <label htmlFor="end-date" className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
                                 <input type="date" id="end-date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className={commonInputClasses} />
                            </div>
                        </>
                    )}
                     <div className={dateFilter === 'custom' ? `lg:col-span-1` : `lg:col-start-4 lg:col-span-1`}>
                        <button 
                            onClick={handleOpenChat} 
                            disabled={isChatLoading} 
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-accent/50 text-sm font-semibold rounded-md shadow-neu-sm text-text-primary bg-accent/30 hover:bg-accent/40 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                            <ChatIcon className={`w-5 h-5 ${isChatLoading ? 'animate-pulse' : ''}`} />
                            Chat with AI Advisor
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="bg-surface backdrop-blur-xl p-6 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
                    <h2 className="text-xl font-semibold text-text-primary mb-4">Savings Over Time</h2>
                    {savingsChartData && savingsChartData.length > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <ComposedChart data={savingsChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-shadow)" />
                                    <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} />
                                    <YAxis yAxisId="left" stroke="var(--color-text-secondary)" fontSize={12} tickFormatter={(value) => formatCurrency(value as number)} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface)' }} />
                                    <Legend wrapperStyle={{fontSize: "12px", paddingTop: "15px", color: "var(--color-text-secondary)" }} />
                                    <Bar yAxisId="left" dataKey="Monthly Savings" fill={COLORS[0]} />
                                    <Line yAxisId="left" type="monotone" dataKey="Cumulative Savings" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-text-secondary">No savings data for this period.</div>
                    )}
                </div>

                <StackedBarChart 
                    data={categoryChartData}
                    keys={chartCategoryKeys}
                    title="Monthly Expenses by Category"
                    emptyMessage="No expense data for this period."
                    filterOptions={allCategories}
                    selectedFilter={selectedCategory}
                    onFilterChange={setSelectedCategory}
                    filterLabel="All Categories"
                />
                 <StackedBarChart 
                    data={labelChartData}
                    keys={chartLabelKeys}
                    title="Monthly Expenses by Label"
                    emptyMessage="No labeled expenses for this period."
                    filterOptions={allLabels}
                    selectedFilter={selectedLabel}
                    onFilterChange={setSelectedLabel}
                    filterLabel="All Labels"
                />
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
