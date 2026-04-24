import React, { useState } from 'react';
import { Bug, X, Shield, Settings, Palette, GitBranch } from 'lucide-react';

import { useAuthCoordinator } from '../../providers/AuthCoordinatorProvider';

import { WIDGET_ENABLED } from './debugComponents';
import { AuthDebugTab, getMeta } from './AuthDebugTab';
import { ConfigDebugTab } from './ConfigDebugTab';
import { ThemeDebugTab } from './ThemeDebugTab';
import { PathwaysDebugTab } from './PathwaysDebugTab';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabId = 'auth' | 'config' | 'theme' | 'pathways';

interface TabDef {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

const TABS: TabDef[] = [
    { id: 'auth', label: 'Auth', icon: <Shield className="w-3 h-3" /> },
    { id: 'config', label: 'Config', icon: <Settings className="w-3 h-3" /> },
    { id: 'theme', label: 'Theme', icon: <Palette className="w-3 h-3" /> },
    { id: 'pathways', label: 'Pathways', icon: <GitBranch className="w-3 h-3" /> },
];

// ---------------------------------------------------------------------------
// DevDebugPanel
// ---------------------------------------------------------------------------

export const DevDebugPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('auth');

    const { state, isReady } = useAuthCoordinator();
    const meta = getMeta(state.status);

    if (!WIDGET_ENABLED) return null;

    // --- Fab button color follows coordinator status ---
    const fabBg = isOpen
        ? 'bg-gray-700 hover:bg-gray-600'
        : isReady
            ? 'bg-emerald-600 hover:bg-emerald-500'
            : state.status === 'error'
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-sky-600 hover:bg-sky-500';

    return (
        <React.Fragment>
            {/* FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-24 right-4 z-[2147483647] w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${fabBg}`}
                title={`Dev Debug — ${meta.label}`}
            >
                {isOpen
                    ? <X className="w-4.5 h-4.5 text-white" />
                    : <Bug className="w-4.5 h-4.5 text-white" />}
            </button>

            {/* Panel */}
            {isOpen && (
                <div className="fixed bottom-40 right-4 z-[2147483646] w-[340px] max-h-[70vh] bg-gray-950 rounded-xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col">

                    {/* ── Header ── */}
                    <div className="px-3 py-2.5 bg-gray-900 border-b border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Bug className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-[12px] font-bold text-gray-200 tracking-wide">Dev Debug</span>
                            </div>

                            <div className={`w-2 h-2 rounded-full ${meta.dot} ${['authenticating', 'checking_key_status', 'deriving_key'].includes(state.status) ? 'animate-pulse' : ''}`} title={meta.label} />
                        </div>

                        {/* Tab bar */}
                        <div className="flex gap-1">
                            {TABS.map((tab) => {
                                const isActive = tab.id === activeTab;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                                            isActive
                                                ? 'bg-gray-700 text-gray-200'
                                                : 'text-gray-500 hover:text-gray-400 hover:bg-gray-800'
                                        }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Scrollable body ── */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {activeTab === 'auth' && <AuthDebugTab />}
                        {activeTab === 'config' && <ConfigDebugTab />}
                        {activeTab === 'theme' && <ThemeDebugTab />}
                        {activeTab === 'pathways' && <PathwaysDebugTab />}
                    </div>

                    {/* ── Footer ── */}
                    <div className="px-3 py-1.5 border-t border-gray-800 bg-gray-900/50 flex items-center justify-between">
                        <p className="text-[9px] text-gray-600">
                            {import.meta.env.DEV ? 'dev mode' : 'debug widget'}
                        </p>

                        <p className="text-[9px] text-gray-600 font-mono">
                            {activeTab === 'auth' ? state.status : activeTab}
                        </p>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default DevDebugPanel;
