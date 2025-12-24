import React, { useState } from 'react';
import {
    Rocket,
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    Activity,
    Award,
    AlertCircle,
    Clock,
    ToggleLeft,
    ToggleRight,
    ExternalLink,
    Settings,
    BarChart3,
} from 'lucide-react';

import { PartnerProject } from '../types';

interface ProductionStepProps {
    project: PartnerProject;
    isLive: boolean;
    onGoLive: () => void;
    onBack: () => void;
}

interface DashboardStats {
    credentialsIssued: number;
    errors: number;
    pending: number;
    lastActivity: string | null;
}

export const ProductionStep: React.FC<ProductionStepProps> = ({
    project,
    isLive,
    onGoLive,
    onBack,
}) => {
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Simulated dashboard stats
    const [stats] = useState<DashboardStats>({
        credentialsIssued: isLive ? 0 : 0,
        errors: 0,
        pending: 0,
        lastActivity: null,
    });

    const handleToggleLive = () => {
        if (!isLive) {
            setShowConfirmation(true);
        }
    };

    const handleConfirmGoLive = () => {
        setShowConfirmation(false);
        onGoLive();
    };

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            {isLive ? (
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />

                    <div className="flex-1">
                        <p className="font-medium text-emerald-800">Integration is Live!</p>
                        <p className="text-sm text-emerald-700 mt-1">
                            Your integration is active and ready to issue credentials. Monitor activity below.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-emerald-700">Live</span>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

                    <div className="flex-1">
                        <p className="font-medium text-amber-800">Test Mode Active</p>
                        <p className="text-sm text-amber-700 mt-1">
                            Your integration is in test mode. Toggle to live mode when you're ready to start issuing real credentials.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full">
                        <span className="w-2 h-2 bg-amber-500 rounded-full" />
                        <span className="text-sm font-medium text-amber-700">Test</span>
                    </div>
                </div>
            )}

            {/* Live Toggle */}
            <div className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isLive ? 'bg-emerald-100' : 'bg-gray-100'
                        }`}>
                            <Rocket className={`w-5 h-5 ${isLive ? 'text-emerald-600' : 'text-gray-500'}`} />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800">Production Mode</h3>
                            <p className="text-sm text-gray-500">
                                {isLive ? 'Credentials are being issued to real users' : 'Click to activate your integration'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleToggleLive}
                        disabled={isLive}
                        className={`p-1 rounded-full transition-colors ${
                            isLive ? 'cursor-default' : 'hover:bg-gray-100'
                        }`}
                    >
                        {isLive ? (
                            <ToggleRight className="w-12 h-12 text-emerald-500" />
                        ) : (
                            <ToggleLeft className="w-12 h-12 text-gray-400" />
                        )}
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Rocket className="w-6 h-6 text-emerald-600" />
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-800">Go Live?</h3>
                                <p className="text-sm text-gray-500">This will activate your integration</p>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />

                                <p className="text-sm text-amber-800">
                                    Once live, your system will start issuing real credentials to users. 
                                    Make sure you've completed testing.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleConfirmGoLive}
                                className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                            >
                                Go Live
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard Stats */}
            <div className="space-y-4">
                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-500" />
                    Dashboard
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs text-gray-500">Issued</span>
                        </div>

                        <p className="text-2xl font-bold text-gray-800">{stats.credentialsIssued}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="text-xs text-gray-500">Pending</span>
                        </div>

                        <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-xs text-gray-500">Errors</span>
                        </div>

                        <p className="text-2xl font-bold text-gray-800">{stats.errors}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-blue-500" />
                            <span className="text-xs text-gray-500">Last Activity</span>
                        </div>

                        <p className="text-sm font-medium text-gray-800">
                            {stats.lastActivity || 'No activity yet'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Activity Log Placeholder */}
            <div className="p-4 border border-gray-200 rounded-xl">
                <h3 className="font-medium text-gray-800 mb-3">Recent Activity</h3>

                {isLive ? (
                    <div className="text-center py-8 text-gray-500">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No activity yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Credentials will appear here as they're issued
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Waiting to go live</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Activate production mode to start tracking activity
                        </p>
                    </div>
                )}
            </div>

            {/* Quick Links */}
            {isLive && (
                <div className="grid grid-cols-2 gap-4">
                    <a
                        href="#"
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
                    >
                        <Settings className="w-5 h-5 text-gray-500" />

                        <div>
                            <p className="font-medium text-gray-800">Settings</p>
                            <p className="text-xs text-gray-500">Manage configuration</p>
                        </div>
                    </a>

                    <a
                        href="#"
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
                    >
                        <ExternalLink className="w-5 h-5 text-gray-500" />

                        <div>
                            <p className="font-medium text-gray-800">Documentation</p>
                            <p className="text-xs text-gray-500">API reference</p>
                        </div>
                    </a>
                </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {isLive && (
                    <a
                        href="/app-store/developer/guides"
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Done - Return to Hub
                    </a>
                )}
            </div>
        </div>
    );
};
