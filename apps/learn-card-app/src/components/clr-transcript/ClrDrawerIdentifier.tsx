import React, { useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { IonIcon } from '@ionic/react';
import { checkmarkOutline, copyOutline } from 'ionicons/icons';
import { formatDidDisplayName, isDid } from '@learncard/react';
import { middleTruncate } from 'learn-card-base/helpers/stringHelpers';
import * as m from '../../paraglide/messages.js';

const identifierLabel = (value: string): string => {
    if (!isDid(value)) return middleTruncate(value, 36);

    // Format the DID, not the DID URL: the key fragment distinguishes verification methods.
    const suffixStart = value.search(/[/?#]/);
    const did = suffixStart === -1 ? value : value.slice(0, suffixStart);
    const suffix = suffixStart === -1 ? '' : middleTruncate(value.slice(suffixStart), 16);
    return middleTruncate(formatDidDisplayName(did).replaceAll(/%3a/gi, ':'), 36) + suffix;
};

/** Display a compact label while keeping the signed identifier intact for inspection and copy. */
export const ClrDrawerIdentifier = ({ label, value }: { label: string; value: string }) => {
    const [result, setResult] = useState<'copied' | 'failed'>();

    const copy = async () => {
        try {
            await Clipboard.write({ string: value });
            setResult('copied');
        } catch {
            setResult('failed');
        }
    };

    return (
        <>
            <span className="flex items-center gap-2">
                <bdi
                    title={value}
                    className="min-w-0 rounded-md bg-grayscale-100 px-2 py-1 font-mono text-xs leading-relaxed text-grayscale-700 wrap-anywhere"
                >
                    {identifierLabel(value)}
                </bdi>
                <button
                    type="button"
                    aria-label={m['clrTranscript.details.copyIdentifier']({ label })}
                    onClick={() => void copy()}
                    className="ms-auto flex size-11 shrink-0 items-center justify-center rounded-[20px] text-grayscale-700 hover:bg-grayscale-100 focus-visible:outline-2 focus-visible:outline-emerald-600"
                >
                    <IonIcon
                        aria-hidden="true"
                        icon={result === 'copied' ? checkmarkOutline : copyOutline}
                        className="size-5"
                    />
                </button>
            </span>
            <span
                role="status"
                className={result === 'failed' ? 'block text-xs text-red-700' : 'sr-only'}
            >
                {result === 'copied' && m['toasts.copied']()}
                {result === 'failed' && m['toasts.copyFailed']()}
            </span>
        </>
    );
};
