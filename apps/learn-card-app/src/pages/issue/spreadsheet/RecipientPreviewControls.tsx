import React from 'react';
import * as m from '../../../paraglide/messages.js';
import { recipientDisplayName, type Recipient } from '../components/recipientTypes';

export const RecipientPreviewControls: React.FC<{
    recipients: Recipient[];
    index: number;
    onChange: (index: number) => void;
}> = ({ recipients, index, onChange }) => {
    if (!recipients.length) return null;
    const current = Math.max(0, Math.min(index, recipients.length - 1));
    const button =
        'py-2 px-3 rounded-[20px] border border-grayscale-300 text-grayscale-700 disabled:opacity-40';
    return (
        <div className="flex items-center justify-between gap-2 mb-3 font-poppins">
            <button
                type="button"
                aria-label={m['issueFlow.sheet.previous']()}
                disabled={current === 0}
                onClick={() => onChange(current - 1)}
                className={button}
            >
                ‹
            </button>
            <span className="text-xs text-grayscale-700 text-center" aria-live="polite">
                {m['issueFlow.sheet.previewPosition']({
                    name: recipientDisplayName(recipients[current]!),
                    index: current + 1,
                    total: recipients.length,
                })}
            </span>
            <button
                type="button"
                aria-label={m['issueFlow.sheet.next']()}
                disabled={current === recipients.length - 1}
                onClick={() => onChange(current + 1)}
                className={button}
            >
                ›
            </button>
        </div>
    );
};
