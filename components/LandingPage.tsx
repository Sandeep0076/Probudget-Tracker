import React, { useRef } from 'react';
import { LogoIcon } from './icons/LogoIcon';

interface LandingPageProps {
    onCreateNew: () => void;
    onOpen: (file: File) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onCreateNew, onOpen }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOpenClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onOpen(file);
        }
    };
    
    return (
        <div className="min-h-screen font-sans bg-brand-dark-blue text-slate-100 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-12">
                <LogoIcon className="h-20 w-20 text-white mx-auto mb-4" />
                <h1 className="text-4xl sm:text-5xl font-bold text-white">Welcome to ProBudget</h1>
                <p className="text-slate-200 mt-2 text-lg">Your portable, file-based budget tracker.</p>
            </div>
            <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl p-8 rounded-2xl border-t border-l border-white/40 border-b border-r border-black/20 text-center">
                <h2 className="text-xl font-semibold text-white mb-6">Get Started</h2>
                <div className="space-y-4">
                    <button
                        onClick={onCreateNew}
                        className="w-full px-6 py-4 border border-sky-500 border-t-sky-300 border-b-sky-700 border-l-sky-300 border-r-sky-700 text-lg font-medium rounded-md shadow-sm text-white bg-brand-blue/90 hover:bg-brand-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue transition-all transform hover:scale-105"
                    >
                        Create New Budget File
                    </button>
                    <button
                        onClick={handleOpenClick}
                        className="w-full px-6 py-4 border-t border-l border-white/40 border-b border-r border-black/20 text-lg font-medium rounded-md text-slate-100 bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-all transform hover:scale-105"
                    >
                        Open Existing File...
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".sqlite,.db"
                    />
                </div>
                 <p className="text-xs text-slate-400 mt-8">
                    Your data is saved to a local `.sqlite` file on your computer. You are in control.
                </p>
            </div>
        </div>
    );
};

export default LandingPage;
