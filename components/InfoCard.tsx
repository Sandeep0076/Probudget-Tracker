import React from 'react';

interface InfoCardProps {
  title: string;
  amount: string;
  icon: React.ReactNode;
  amountColor?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, amount, icon, amountColor = 'text-text-primary' }) => {
  return (
    <div className="bg-surface backdrop-blur-xl p-6 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
        {icon}
      </div>
      <div className="mt-4">
        <p className={`text-4xl font-bold ${amountColor}`}>{amount}</p>
      </div>
    </div>
  );
};

export default InfoCard;
