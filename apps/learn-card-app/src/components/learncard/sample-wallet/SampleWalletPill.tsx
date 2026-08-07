import React from 'react';
import { getLogger } from 'learn-card-base';
import { useSampleWallet } from './useSampleWallet';

const log = getLogger('sample-wallet-pill');

const SampleWalletPill: React.FC = () => {
    const { isActive, activePersonaName, exitSampleWallet } = useSampleWallet();

    if (!isActive) return null;

    const handleExit = () => {
        exitSampleWallet().catch(error => log.error('sample-wallet.exit.failed', error));
    };

    return (
        <div
            className="fixed left-1/2 -translate-x-1/2 z-[9990] flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/85 backdrop-blur-md border border-grayscale-200 shadow-md"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
        >
            <svg
                className="w-3 h-3 text-emerald-500 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            </svg>
            <span className="text-xs font-medium text-grayscale-900 whitespace-nowrap">
                Sample Wallet
            </span>
            {activePersonaName && (
                <span className="hidden sm:inline text-xs text-grayscale-500 whitespace-nowrap border-l border-grayscale-300 pl-2">
                    {activePersonaName}
                </span>
            )}
            <button
                onClick={handleExit}
                className="ml-1 p-0.5 text-grayscale-400 hover:text-grayscale-900 transition-colors rounded-full hover:bg-grayscale-200/50"
                aria-label="Exit Sample Wallet"
            >
                <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    );
};

export default SampleWalletPill;
