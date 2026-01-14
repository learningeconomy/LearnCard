import React from 'react';
import { Shield } from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

interface SigningTabProps {
    integration: LCNIntegration;
}

export const SigningTab: React.FC<SigningTabProps> = ({ integration }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Signing Authority</h2>
                <p className="text-sm text-gray-500">Configure how credentials are signed</p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-emerald-800">Default Signing</h3>
                        <p className="text-sm text-emerald-700 mt-1">
                            Credentials are signed using your LearnCard identity. This provides a verifiable 
                            chain of trust from your organization.
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl">
                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Advanced signing options coming soon</p>
                <p className="text-sm text-gray-400 mt-1">Configure custom DIDs and signing keys</p>
            </div>
        </div>
    );
};
