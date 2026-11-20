import React, { useEffect, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { IonIcon } from '@ionic/react';
import { checkmarkOutline, copyOutline } from 'ionicons/icons';
import { formatDidDisplayName, isDid } from '@learncard/react';
import { middleTruncate } from 'learn-card-base/helpers/stringHelpers';
import * as m from '../../paraglide/messages.js';

const LABEL_LENGTH = 36;

const identifierLabel = (value: string): string => {
    if (!isDid(value)) return middleTruncate(value, LABEL_LENGTH);

    // Format the DID, not the DID URL: the key fragment distinguishes verification methods.
    const suffixStart = value.search(/[/?#]/);
    const did = suffixStart === -1 ? value : value.slice(0, suffixStart);
    const suffix = suffixStart === -1 ? '' : middleTruncate(value.slice(suffixStart), 16);
    const name = formatDidDisplayName(did).replaceAll(/%3a/gi, ':');
    return middleTruncate(name, LABEL_LENGTH - suffix.length) + suffix;
};

/** Display a compact label while keeping the signed identifier intact for inspection and copy. */
export const ClrDrawerIdentifier = ({ label, value }: { label: string; value: string }) => {
    const [result, setResult] = useState<'copied' | 'failed'>();

    useEffect(() => {
        if (result !== 'copied') return;
        const timer = window.setTimeout(() => setResult(undefined), 2000);
        return () => window.clearTimeout(timer);
    }, [result]);

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
                    className="min-w-0 wrap-anywhere text-sm leading-snug text-grayscale-900"
                >
                    {identifierLabel(value)}
                </bdi>
                <button
                    type="button"
                    aria-label={m['clrTranscript.details.copyIdentifier']({ label })}
                    onClick={() => void copy()}
                    className="ms-auto -my-2 flex size-11 shrink-0 items-center justify-center rounded-[20px] text-grayscale-900 hover:bg-grayscale-100 focus-visible:outline-2 focus-visible:outline-emerald-600"
                >
                    <IonIcon
                        aria-hidden="true"
                        icon={result === 'copied' ? checkmarkOutline : copyOutline}
                        className="size-[18px]"
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
