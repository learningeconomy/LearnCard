import React from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';

import * as m from '../../paraglide/messages.js';

export type TranscriptConsentCheckboxProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    /** The state records system named in the consent text (e.g. "Example State"). */
    stateDisplayName: string;
    disabled?: boolean;
};

/**
 * The one consent control for requesting a state transcript. Every surface that
 * sends `transcriptsRequest({ consent: true })` (the wallet / School Connect card
 * and onboarding) must render this so the student sees and ticks the same words.
 */
export const TranscriptConsentCheckbox: React.FC<TranscriptConsentCheckboxProps> = ({
    checked,
    onChange,
    stateDisplayName,
    disabled,
}) => (
    <label
        data-testid="transcript-optin-consent"
        className={`flex items-start gap-3 p-4 rounded-xl border border-solid transition-colors cursor-pointer ${
            checked ? 'bg-emerald-50 border-emerald-200' : 'bg-grayscale-50 border-grayscale-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <div className="flex items-center h-5 mt-0.5">
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                disabled={disabled}
                className="w-5 h-5 rounded border-grayscale-300 accent-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
            />
        </div>
        <span className="text-sm text-grayscale-700 leading-relaxed text-left">
            {m['transcriptOptIn.consent']({ state: stateDisplayName })}
        </span>
    </label>
);

/** Inline error used by transcript request surfaces. */
export const TranscriptErrorBanner: React.FC<{ message: string }> = ({ message }) => (
    <div
        role="alert"
        className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-left"
    >
        <IonIcon icon={alertCircleOutline} className="text-red-400 text-lg mt-0.5 shrink-0" />
        <span className="text-sm text-red-700 leading-relaxed">{message}</span>
    </div>
);

/** User-facing message for a failed transcript request/status call. */
const isServerError = (error: unknown): error is Error & { data: { code: string } } =>
    error instanceof Error &&
    typeof (error as { data?: { code?: unknown } }).data?.code === 'string';

/** Server (tRPC) messages are written for students; anything else gets friendly copy. */
export const getTranscriptErrorMessage = (error: unknown): string =>
    isServerError(error) && error.message ? error.message : m['transcriptOptIn.error']();
