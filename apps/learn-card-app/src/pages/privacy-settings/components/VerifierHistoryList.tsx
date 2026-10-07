import React from 'react';
import { useLocale } from '../../../i18n';
import type { VerifierReceipt } from '../../../helpers/verifier-history/history';
import * as m from '../../../paraglide/messages.js';

export const historyButton =
    'min-h-[44px] py-3 px-4 rounded-[20px] border border-solid border-grayscale-300 bg-grayscale-100 text-grayscale-700 font-medium text-sm hover:bg-grayscale-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:bg-grayscale-100 disabled:border-grayscale-200 disabled:text-grayscale-500 disabled:cursor-not-allowed disabled:hover:bg-grayscale-100';

/** Render only the visible preview/page; deletion always targets an exact entry. */
export const VerifierHistoryList: React.FC<{
    receipts: VerifierReceipt[];
    loading: boolean;
    onDelete: (eventId: string) => void;
}> = ({ receipts, loading, onDelete }) => {
    const locale = useLocale();
    return (
        <ul className="space-y-3" aria-label={m['verifierHistory.title']()}>
            {receipts.map(receipt => (
                <li
                    key={receipt.eventId}
                    className="rounded-2xl border border-grayscale-200 p-4 space-y-2"
                >
                    <p className="text-sm font-medium text-grayscale-900 break-words">
                        {receipt.label ?? receipt.origin ?? m['verifierHistory.unknownVerifier']()}
                    </p>
                    {receipt.label && receipt.origin && (
                        <p className="text-xs text-grayscale-600 break-words">{receipt.origin}</p>
                    )}
                    <p className="text-xs text-grayscale-600">
                        {new Date(receipt.sentAt).toLocaleString(locale)} ·{' '}
                        {receipt.outcome === 'sent'
                            ? m['verifierHistory.sent']()
                            : m['verifierHistory.handedOff']()}
                    </p>
                    <p className="text-sm text-grayscale-700 break-words">
                        {receipt.titles
                            .map(title =>
                                title === 'Credential' ? m['verifierHistory.credential']() : title
                            )
                            .join(', ')}
                    </p>
                    {receipt.purpose && (
                        <p className="text-xs text-grayscale-600 break-words">{receipt.purpose}</p>
                    )}
                    <button
                        type="button"
                        className={historyButton}
                        disabled={loading}
                        onClick={() => onDelete(receipt.eventId)}
                        aria-label={m['verifierHistory.deleteLabel']({
                            verifier:
                                receipt.label ??
                                receipt.origin ??
                                m['verifierHistory.unknownVerifier'](),
                        })}
                    >
                        {m['verifierHistory.delete']()}
                    </button>
                </li>
            ))}
        </ul>
    );
};
