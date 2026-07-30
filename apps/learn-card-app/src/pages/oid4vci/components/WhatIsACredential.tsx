import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

/**
 * Tasteful inline disclosure for first-time users wondering "what is
 * a credential?" \u2014 mirroring how Apple surfaces feature explanations
 * once and never again. Renders a small "What is a credential?" link
 * that, when expanded, drops a 3-bullet primer in a soft callout.
 *
 * Persistence: we remember dismissal in `localStorage` under a stable
 * key so the link doesn't keep reappearing for users who already
 * understand. New devices get the link again \u2014 by design.
 */
const STORAGE_KEY = 'oid4vci.whatIsCredential.dismissed';

const WhatIsACredential: React.FC = () => {
    const [open, setOpen] = useState(false);

    // Hide entirely once the user has explicitly dismissed the
    // expanded panel. Honors `localStorage` from prior sessions.
    const [dismissed, setDismissed] = useState<boolean>(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch {
            return false;
        }
    });

    if (dismissed) return null;

    const dismiss = () => {
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch {
            // localStorage unavailable (private mode, etc.) \u2014 the
            // dismissal is in-memory-only for this session, which is
            // an acceptable degradation.
        }
        setDismissed(true);
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-grayscale-500 hover:text-grayscale-700 transition-colors"
            >
                <HelpCircle className="w-3.5 h-3.5" />
                What's a credential?
            </button>
        );
    }

    return (
        <div className="relative p-4 rounded-2xl bg-grayscale-10 border border-grayscale-200">
            <button
                type="button"
                onClick={dismiss}
                aria-label="Got it, dismiss"
                className="absolute top-2 right-2 w-7 h-7 rounded-full hover:bg-white flex items-center justify-center text-grayscale-400 hover:text-grayscale-700 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-semibold text-grayscale-900 mb-2 pr-6">
                A credential is yours to keep.
            </h3>

            <ul className="space-y-1.5 text-xs text-grayscale-600 leading-relaxed">
                <li className="flex gap-2">
                    <span className="text-grayscale-400 shrink-0">•</span>
                    It lives in your wallet — only you can see it.
                </li>

                <li className="flex gap-2">
                    <span className="text-grayscale-400 shrink-0">•</span>
                    Share it whenever you need to prove what it says.
                </li>

                <li className="flex gap-2">
                    <span className="text-grayscale-400 shrink-0">•</span>
                    The issuer signed it cryptographically, so anyone you share with can verify it's real.
                </li>
            </ul>

            <button
                type="button"
                onClick={dismiss}
                className="mt-3 text-xs font-medium text-grayscale-700 hover:text-grayscale-900 transition-colors"
            >
                Got it
            </button>
        </div>
    );
};

export default WhatIsACredential;
