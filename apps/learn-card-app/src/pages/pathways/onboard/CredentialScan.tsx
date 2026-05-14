/**
 * CredentialScan — step 2 of onboarding.
 *
 * Docs § 6: "wallet scan is additive — 'what we can see in your wallet
 * already' — but onboarding works with an empty wallet." Phase 1 stubs
 * the actual wallet read with an empty tag set; real credential
 * inspection lands when the wallet graph API stabilizes.
 *
 * Visual noise is kept low on purpose: this step has to feel like
 * something the app is doing *for* the learner, not a quiz.
 */

import React, { useEffect, useState } from 'react';

import type { WalletSignal } from './suggestPathways';

interface CredentialScanProps {
    onContinue: (wallet: WalletSignal) => void;
    onBack: () => void;
}

const CredentialScan: React.FC<CredentialScanProps> = ({ onContinue, onBack }) => {
    const [phase, setPhase] = useState<'scanning' | 'done'>('scanning');

    // Fake a short scan so the affordance reads as real.
    useEffect(() => {
        const t = window.setTimeout(() => setPhase('done'), 900);

        return () => window.clearTimeout(t);
    }, []);

    const wallet: WalletSignal = { tags: [] };

    return (
        <div className="max-w-md mx-auto px-4 py-10 font-poppins space-y-6">
            <div>
                <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide mb-1">
                    Step 2 of 3
                </p>

                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    Looking at what you already have
                </h2>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    We read your wallet to tune suggestions. Nothing leaves your device.
                </p>
            </div>

            <div className="p-5 rounded-[20px] bg-grayscale-100 border border-grayscale-200 min-h-[88px] flex items-center">
                {phase === 'scanning' ? (
                    <span className="flex items-center gap-3 text-sm text-grayscale-600">
                        <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-800 rounded-full animate-spin" />
                        Scanning your credentials…
                    </span>
                ) : (
                    <span className="text-sm text-grayscale-700 leading-relaxed">
                        No credentials yet — that's fine. We'll start from your goal.
                    </span>
                )}
            </div>

            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => onContinue(wallet)}
                    disabled={phase !== 'done'}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm
                               hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Continue
                </button>

                <button
                    type="button"
                    onClick={onBack}
                    className="w-full text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                >
                    Back
                </button>
            </div>
        </div>
    );
};

export default CredentialScan;
