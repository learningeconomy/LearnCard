import React, { useState } from 'react';
import {
    Rocket,
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    Shield,
    Palette,
    FileStack,
    Code2,
    Loader2,
    PartyPopper,
} from 'lucide-react';

import { PartnerProject } from '../types';

interface ProductionStepProps {
    project: PartnerProject;
    isLive: boolean;
    onGoLive: () => void;
    onBack: () => void;
}

export const ProductionStep: React.FC<ProductionStepProps> = ({
    project,
    isLive,
    onGoLive,
    onBack,
}) => {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    const handleGoLiveClick = () => {
        setShowConfirmation(true);
    };

    const handleConfirmGoLive = async () => {
        setIsActivating(true);

        try {
            await onGoLive();
        } finally {
            setIsActivating(false);
            setShowConfirmation(false);
        }
    };

    // Setup checklist - things completed in previous steps
    const setupChecklist = [
        { icon: Shield, label: 'Signing authority configured', done: true },
        { icon: Palette, label: 'Branding & profile set up', done: true },
        { icon: FileStack, label: 'Credential templates created', done: true },
        { icon: Code2, label: 'Integration code configured', done: true },
    ];

    return (
        <div className="space-y-6">
            {/* Ready to Launch Banner */}
            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-2xl">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Rocket className="w-7 h-7 text-emerald-600" />
                </div>

                <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-800">Ready to Go Live!</h2>

                    <p className="text-sm text-gray-600 mt-1">
                        Your integration setup is complete. When you activate production mode, 
                        your system will be able to issue real verifiable credentials to users.
                    </p>
                </div>
            </div>

            {/* Setup Summary */}
            <div className="p-5 border border-gray-200 rounded-xl">
                <h3 className="font-medium text-gray-800 mb-4">Setup Complete</h3>

                <div className="space-y-3">
                    {setupChecklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <item.icon className="w-4 h-4 text-emerald-600" />
                            </div>

                            <span className="flex-1 text-sm text-gray-700">{item.label}</span>

                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                    ))}
                </div>
            </div>

            {/* What Happens Next */}
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
                <h3 className="font-medium text-blue-800 mb-2">What happens when you go live?</h3>

                <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>Your integration status changes from "setup" to "active"</span>
                    </li>

                    <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>API calls will issue real credentials that recipients can store in their wallets</span>
                    </li>

                    <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>You'll be redirected to your integration dashboard to monitor activity</span>
                    </li>
                </ul>
            </div>

            {/* Go Live Button */}
            <button
                onClick={handleGoLiveClick}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500 text-white rounded-xl font-semibold text-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25"
            >
                <Rocket className="w-5 h-5" />
                Activate Production Mode
            </button>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <PartyPopper className="w-7 h-7 text-emerald-600" />
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Ready to Launch?</h3>
                                <p className="text-sm text-gray-500">Activate your integration</p>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

                                <div className="text-sm text-amber-800">
                                    <p className="font-medium mb-1">Before you go live:</p>
                                    <ul className="space-y-1 text-amber-700">
                                        <li>• Ensure you've tested credential issuance in sandbox</li>
                                        <li>• Verify your API integration is working correctly</li>
                                        <li>• Confirm your branding and templates are finalized</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                disabled={isActivating}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleConfirmGoLive}
                                disabled={isActivating}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            >
                                {isActivating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Activating...
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-4 h-4" />
                                        Go Live
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Testing
                </button>
            </div>
        </div>
    );
};
