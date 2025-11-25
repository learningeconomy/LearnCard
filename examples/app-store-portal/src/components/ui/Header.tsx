import React from 'react';
import { Sparkles, Shield } from 'lucide-react';

interface HeaderProps {
    mode: 'partner' | 'admin';
    onModeChange: (mode: 'partner' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({ mode, onModeChange }) => {
    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-apple-gray-200">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-apple-blue to-blue-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>

                    <span className="text-lg font-semibold text-apple-gray-600">
                        LearnCard App Portal
                    </span>
                </div>

                <nav className="flex items-center gap-1 p-1 bg-apple-gray-100 rounded-full">
                    <button
                        onClick={() => onModeChange('partner')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                            mode === 'partner'
                                ? 'bg-white text-apple-gray-600 shadow-apple-sm'
                                : 'text-apple-gray-500 hover:text-apple-gray-600'
                        }`}
                    >
                        Partner
                    </button>

                    <button
                        onClick={() => onModeChange('admin')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                            mode === 'admin'
                                ? 'bg-white text-apple-gray-600 shadow-apple-sm'
                                : 'text-apple-gray-500 hover:text-apple-gray-600'
                        }`}
                    >
                        <Shield className="w-3.5 h-3.5" />
                        Admin
                    </button>
                </nav>
            </div>
        </header>
    );
};
