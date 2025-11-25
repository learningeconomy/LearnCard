import React, { useState } from 'react';
import { Header } from './ui/Header';
import { SubmissionForm } from './partner/SubmissionForm';
import { AdminDashboard } from './admin/AdminDashboard';

type Mode = 'partner' | 'admin';

export const App: React.FC = () => {
    const [mode, setMode] = useState<Mode>('partner');

    return (
        <div className="min-h-screen bg-apple-gray-50">
            <Header mode={mode} onModeChange={setMode} />

            <main className="mode-transition">
                {mode === 'partner' ? (
                    <div className="max-w-6xl mx-auto px-6 py-12">
                        <div className="text-center mb-12 animate-fade-in">
                            <h1 className="text-4xl font-semibold text-apple-gray-600 tracking-tight">
                                Submit Your App
                            </h1>

                            <p className="text-lg text-apple-gray-500 mt-3 max-w-2xl mx-auto">
                                Join the LearnCard ecosystem. Submit your application and reach
                                millions of users managing their digital credentials.
                            </p>
                        </div>

                        <SubmissionForm />
                    </div>
                ) : (
                    <AdminDashboard />
                )}
            </main>
        </div>
    );
};

export default App;
