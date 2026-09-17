import React, { useEffect, useState } from 'react';
import {
    demoGateStore,
    getLogger,
    isDemoModeError,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { useSampleWallet } from './useSampleWallet';

const log = getLogger('sample-wallet-gate');

const SampleWalletGateSheet: React.FC = () => {
    const isGateOpen = demoGateStore.use.isGateOpen();
    const actionLabel = demoGateStore.use.actionLabel();
    const { isActive, exitSampleWallet } = useSampleWallet();
    const { presentToast } = useToast();
    const [isSwitching, setIsSwitching] = useState(false);

    useEffect(() => {
        // Un-awaited rejections are background work by definition (user actions
        // are awaited in handlers or run as react-query mutations, which the
        // MutationCache maps to this sheet). Silence them instead of opening
        // the sheet, so background flows never interrupt the user unprompted.
        const onRejection = (event: PromiseRejectionEvent) => {
            if (isDemoModeError(event.reason)) {
                event.preventDefault();
                log.debug('Suppressed background DemoModeError', event.reason);
            }
        };
        window.addEventListener('unhandledrejection', onRejection);
        return () => window.removeEventListener('unhandledrejection', onRejection);
    }, []);

    useEffect(() => {
        if (isGateOpen && !isActive) {
            demoGateStore.set.closeGate();
        }
    }, [isGateOpen, isActive]);

    if (!isGateOpen || !isActive) return null;

    const handleSwitch = async () => {
        setIsSwitching(true);
        try {
            await exitSampleWallet();
            demoGateStore.set.closeGate();
        } catch (error) {
            presentToast('Something went wrong. Please try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setIsSwitching(false);
        }
    };

    const handleClose = () => {
        demoGateStore.set.closeGate();
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative w-full sm:max-w-[420px] bg-white rounded-t-[24px] sm:rounded-[20px] p-6 pb-8 sm:pb-6 font-poppins animate-fade-in-up shadow-2xl text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                    <svg
                        className="w-6 h-6 text-emerald-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    You're exploring a Sample Wallet
                </h2>
                <p className="text-sm text-grayscale-600 leading-relaxed mb-6">
                    {actionLabel
                        ? `"${actionLabel}" works with your real credentials. Switch back to your wallet to do it for real — your sample stays here if you want to return.`
                        : `To share and save things for real, switch back to your wallet. Your sample stays here if you want to return.`}
                </p>
                <div className="space-y-3">
                    <button
                        onClick={handleSwitch}
                        disabled={isSwitching}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {isSwitching ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Switching...
                            </>
                        ) : (
                            'Switch to My Wallet'
                        )}
                    </button>
                    <button
                        onClick={handleClose}
                        className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                    >
                        Keep Exploring
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SampleWalletGateSheet;
