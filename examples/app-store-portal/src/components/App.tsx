import React, { useState } from 'react';
import { Header } from './ui/Header';
import { ConnectPanel } from './ui/ConnectPanel';
import { IntegrationSelector } from './ui/IntegrationSelector';
import { SubmissionForm } from './partner/SubmissionForm';
import { PartnerDashboard } from './partner/PartnerDashboard';
import { AdminDashboard } from './admin/AdminDashboard';
import { useLearnCardStore } from '../stores/learncard';

type Mode = 'partner' | 'admin';
type PartnerView = 'dashboard' | 'create';

export const App: React.FC = () => {
    const [mode, setMode] = useState<Mode>('partner');
    const [partnerView, setPartnerView] = useState<PartnerView>('dashboard');
    const { learnCard, isAdmin, selectedIntegrationId } = useLearnCardStore();

    const handleCreateNew = () => {
        setPartnerView('create');
    };

    const handleBackToDashboard = () => {
        setPartnerView('dashboard');
    };

    return (
        <div className="min-h-screen bg-apple-gray-50">
            <Header mode={mode} onModeChange={setMode} />

            <main className="mode-transition">
                {mode === 'partner' ? (
                    <div className="max-w-6xl mx-auto px-6 py-12">
                        <div className="text-center mb-8 animate-fade-in">
                            <h1 className="text-4xl font-semibold text-apple-gray-600 tracking-tight">
                                {partnerView === 'dashboard' ? 'Partner Portal' : 'Submit Your App'}
                            </h1>

                            <p className="text-lg text-apple-gray-500 mt-3 max-w-2xl mx-auto">
                                {partnerView === 'dashboard'
                                    ? 'Manage your app listings and track their approval status'
                                    : 'Create a new app listing for the LearnCard ecosystem'}
                            </p>
                        </div>

                        {/* Connection Panel */}
                        <div className="max-w-md mx-auto mb-8">
                            <ConnectPanel />
                        </div>

                        {/* Integration Selector - only show when connected */}
                        {learnCard && (
                            <div className="max-w-md mx-auto mb-8 animate-fade-in">
                                <IntegrationSelector />
                            </div>
                        )}

                        {/* Partner Content */}
                        {learnCard && selectedIntegrationId && (
                            <div className="animate-fade-in">
                                {partnerView === 'dashboard' ? (
                                    <PartnerDashboard onCreateNew={handleCreateNew} />
                                ) : (
                                    <div>
                                        <button
                                            onClick={handleBackToDashboard}
                                            className="btn-ghost mb-6"
                                        >
                                            ← Back to Dashboard
                                        </button>

                                        <SubmissionForm onSuccess={handleBackToDashboard} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Show empty state if not connected or no integration */}
                        {(!learnCard || !selectedIntegrationId) && (
                            <SubmissionForm />
                        )}
                    </div>
                ) : (
                    <div>
                        {/* Admin mode connection panel */}
                        {!learnCard && (
                            <div className="max-w-md mx-auto px-6 py-12">
                                <div className="text-center mb-8">
                                    <h1 className="text-2xl font-semibold text-apple-gray-600">
                                        Admin Dashboard
                                    </h1>

                                    <p className="text-apple-gray-500 mt-2">
                                        Connect with admin credentials to manage app listings
                                    </p>
                                </div>

                                <ConnectPanel />
                            </div>
                        )}

                        {learnCard && !isAdmin && (
                            <div className="max-w-md mx-auto px-6 py-12 text-center">
                                <div className="p-6 bg-amber-50 border border-amber-200 rounded-apple-lg">
                                    <p className="text-amber-800">
                                        You don't have admin permissions. Please connect with an admin account.
                                    </p>
                                </div>
                            </div>
                        )}

                        {learnCard && isAdmin && <AdminDashboard />}
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
