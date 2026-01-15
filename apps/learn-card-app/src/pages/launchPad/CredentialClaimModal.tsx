import React, { useState, useEffect } from 'react';
import { IonSpinner } from '@ionic/react';
import { X, Check, Loader2 } from 'lucide-react';

import { useWallet, useToast, ToastTypeEnum, BoostPageViewMode, BoostCategoryOptionsEnum } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';

import { VC, VP } from '@learncard/types';

import { BoostEarnedCard } from '../../components/boost/boost-earned-card/BoostEarnedCard';

interface CredentialClaimModalProps {
    credentialUri: string;
    boostUri?: string;
    onDismiss: () => void;
}

export const CredentialClaimModal: React.FC<CredentialClaimModalProps> = ({
    credentialUri,
    boostUri,
    onDismiss,
}) => {
    const { initWallet, addVCtoWallet } = useWallet();
    const { presentToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [credential, setCredential] = useState<VC | VP | undefined | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Resolve the credential URI on mount
    useEffect(() => {
        const resolveCredential = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const wallet = await initWallet();
                const vc = await wallet.read.get(credentialUri);

                if (!vc) throw new Error('Error resolving credential');

                setCredential(vc);
            } catch (err) {
                console.error('Failed to resolve credential:', err);
                setError('Unable to load credential');
            } finally {
                setIsLoading(false);
            }
        };

        resolveCredential();
    }, [credentialUri]);

    const handleClaim = async () => {
        if (isClaiming || claimed) return;

        setIsClaiming(true);

        try {
            await addVCtoWallet({ uri: credentialUri });
            
            // Find and update the notification for this credential
            try {
                const wallet = await initWallet();
                if (wallet) {
                    await wallet.invoke.acceptCredential(credentialUri);
                    // Get recent notifications to find the one for this credential
                    const result = await wallet.invoke.getNotifications(
                        { limit: 50, sort: 'REVERSE_CHRONOLOGICAL' },
                        { archived: false }
                    );

                    if (result && typeof result !== 'boolean') {
                        // Find notification with matching credential URI
                        const notification = result.notifications?.find((n: any) =>
                            n?.data?.vcUris?.includes(credentialUri)
                        );

                        if (notification?._id) {
                            await wallet.invoke.updateNotificationMeta(notification._id, {
                                actionStatus: 'COMPLETED',
                                read: true,
                            });
                        }
                    }
                }
            } catch (notifErr) {
                // Don't fail the claim if notification update fails
                console.warn('Failed to update notification:', notifErr);
            }

            setClaimed(true);

            presentToast('Successfully claimed Credential!', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            console.error('Failed to claim credential:', err);

            presentToast('Unable to claim Credential', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setIsClaiming(false);
        }
    };

    // Success state
    if (claimed) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-emerald-600" />
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Credential Claimed!
                        </h3>

                        <p className="text-gray-500 text-sm mb-6">
                            The credential has been added to your wallet.
                        </p>

                        <button
                            onClick={onDismiss}
                            className="w-full px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8">
                    <div className="flex flex-col items-center justify-center">
                        <IonSpinner name="crescent" className="w-12 h-12 text-cyan-500" />

                        <p className="mt-4 text-gray-600 font-medium">Loading credential...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !credential) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <X className="w-8 h-8 text-red-600" />
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Unable to Load Credential
                        </h3>

                        <p className="text-gray-500 text-sm mb-6">
                            {error || 'The credential could not be found.'}
                        </p>

                        <button
                            onClick={onDismiss}
                            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Get credential title
    const subject = Array.isArray(credential?.credentialSubject)
        ? credential?.credentialSubject[0]
        : credential?.credentialSubject;

    const credentialName = credential?.name || subject?.achievement?.name || 'Credential';

    const actionButtonText = isClaiming ? 'Claiming...' : claimed ? 'Claimed' : 'Accept';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col relative">
                {/* Close button */}
                <button
                    onClick={onDismiss}
                    disabled={isClaiming}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors disabled:opacity-50"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white text-center flex-shrink-0">
                    <h3 className="text-lg font-semibold">You've Earned a Credential!</h3>

                    <p className="text-white/80 text-sm mt-1">{credentialName}</p>
                </div>

                {/* Credential Preview */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="flex justify-center">
                        <div className="w-[180px]">
                            <BoostEarnedCard
                                credential={credential as VC}
                                categoryType={getDefaultCategoryForCredential(credential as VC) || BoostCategoryOptionsEnum.achievement}
                                boostPageViewMode={BoostPageViewMode.Card}
                                useWrapper={false}
                                verifierState={false}
                                className="shadow-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-200 flex-shrink-0 space-y-2">
                    <button
                        onClick={handleClaim}
                        disabled={isClaiming || claimed}
                        className="w-full px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isClaiming ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Claiming...
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Accept Credential
                            </>
                        )}
                    </button>

                    <button
                        onClick={onDismiss}
                        disabled={isClaiming}
                        className="w-full px-4 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors disabled:opacity-50"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CredentialClaimModal;
