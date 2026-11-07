import React from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { Checkbox } from 'learn-card-base';

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
    <div data-testid="transcript-optin-consent" className="inline-block text-left">
        <Checkbox
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            label={m['transcriptOptIn.consent']({ state: stateDisplayName })}
        />
    </div>
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
export const getTranscriptErrorMessage = (error: unknown): string =>
    error instanceof Error && error.message ? error.message : m['transcriptOptIn.error']();
