import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from './icons/TrendIcons';

interface SummaryCardProps {
  title: string;
  amount: string;
  trend?: string;
  trendDirection: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, trend, trendDirection, icon }) => {
  const trendColor = trendDirection === 'up' ? 'text-green-400' : trendDirection === 'down' ? 'text-red-400' : 'text-slate-200';
  
  return (
    <div className="bg-white/20 backdrop-blur-xl p-6 rounded-xl border-t border-l border-white/40 border-b border-r border-black/20 hover:bg-white/30 transition-colors duration-300">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-slate-200">{title}</h3>
        <div className="text-sky-300">{icon}</div>
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold text-white">{amount}</p>
        {trend && (
          <div className="flex items-center text-xs mt-1 h-4">
            {trendDirection === 'up' && <ArrowUpIcon className={`w-4 h-4 mr-1 ${trendColor}`} />}
            {trendDirection === 'down' && <ArrowDownIcon className={`w-4 h-4 mr-1 ${trendColor}`} />}
            <span className={trendColor}>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;