import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Rocket, ArrowLeft, CheckCircle2, Loader2, PartyPopper } from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { useDeveloperPortal } from '../../useDeveloperPortal';

interface GoLiveStepProps {
    integration: LCNIntegration | null;
    guideType: string;
    onBack: () => void;
    completedItems?: string[];
    title?: string;
    description?: string;
}

export const GoLiveStep: React.FC<GoLiveStepProps> = ({
    integration,
    guideType,
    onBack,
    completedItems = [],
    title = 'Ready to Go Live!',
    description = 'You\'ve completed all the setup steps. Activate your integration to start using it in production.',
}) => {
    const history = useHistory();
    const { presentToast } = useToast();
    const { useUpdateIntegration } = useDeveloperPortal();
    const updateIntegrationMutation = useUpdateIntegration();

    const [isActivating, setIsActivating] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const handleGoLive = async () => {
        if (!integration) {
            presentToast('No integration selected', { type: ToastTypeEnum.Error, hasDismissButton: true });
            return;
        }

        setIsActivating(true);

        try {
            await updateIntegrationMutation.mutateAsync({
                id: integration.id,
                updates: {
                    status: 'active',
                    guideState: {
                        ...(integration.guideState || {}),
                        completedAt: new Date().toISOString(),
                        completedSteps: completedItems,
                    },
                },
            });

            setIsComplete(true);

            // Brief delay to show success state before redirect
            setTimeout(() => {
                history.push(`/app-store/developer/integrations/${integration.id}`);
            }, 1500);
        } catch (error) {
            console.error('Failed to activate integration:', error);
            presentToast('Failed to activate integration. Please try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            setIsActivating(false);
        }
    };

    if (isComplete) {
        return (
            <div className="text-center py-12">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <PartyPopper className="w-10 h-10 text-emerald-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">You're Live!</h2>

                <p className="text-gray-500 mb-6">
                    Your integration is now active. Redirecting to your dashboard...
                </p>

                <Loader2 className="w-6 h-6 text-emerald-500 mx-auto animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Rocket className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>

                <p className="text-gray-500 max-w-md mx-auto">{description}</p>
            </div>

            {/* Completed Items Checklist */}
            {completedItems.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-medium text-gray-800 mb-4">Setup Complete</h3>

                    <div className="space-y-3">
                        {completedItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <span className="text-gray-700">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Integration Info */}
            {integration && (
                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-cyan-600" />
                        </div>

                        <div>
                            <p className="font-medium text-gray-800">{integration.name}</p>
                            <p className="text-sm text-cyan-700">Ready to activate</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
                <button
                    onClick={onBack}
                    disabled={isActivating}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={handleGoLive}
                    disabled={isActivating || !integration}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
                >
                    {isActivating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Activating...
                        </>
                    ) : (
                        <>
                            <Rocket className="w-5 h-5" />
                            Go Live
                        </>
                    )}
                </button>
            </div>

            {!integration && (
                <p className="text-center text-sm text-amber-600">
                    Please select an integration from the header dropdown to continue.
                </p>
            )}
        </div>
    );
};
