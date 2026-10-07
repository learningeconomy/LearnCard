import React, { useId, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronDownOutline } from 'ionicons/icons';
import { useLocale } from '../../../i18n';
import type { VerifierReceipt } from '../../../helpers/verifier-history/history';
import * as m from '../../../paraglide/messages.js';

export const historyButton =
    'min-h-[44px] py-3 px-4 rounded-[20px] border border-solid border-grayscale-300 bg-grayscale-100 text-grayscale-700 font-medium text-sm hover:bg-grayscale-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:bg-grayscale-100 disabled:border-grayscale-200 disabled:text-grayscale-500 disabled:cursor-not-allowed disabled:hover:bg-grayscale-100';

type EntryProps = {
    receipt: VerifierReceipt;
    loading: boolean;
    onDelete: (eventId: string) => void;
};

/** Expand the recorded names only; viewing an entry never reads credential or history storage. */
const VerifierHistoryEntry: React.FC<EntryProps> = ({ receipt, loading, onDelete }) => {
    const locale = useLocale();
    const detailsId = useId();
    const [expanded, setExpanded] = useState(false);
    const verifier = receipt.label ?? receipt.origin ?? m['verifierHistory.unknownVerifier']();
    return (
        <li className="rounded-2xl border border-grayscale-200 overflow-hidden">
            <button
                type="button"
                className="w-full min-h-[44px] p-4 rounded-[20px] text-start space-y-2 hover:bg-grayscale-10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
                aria-label={m['verifierHistory.viewCredentials']({ verifier })}
                aria-expanded={expanded}
                aria-controls={detailsId}
                onClick={() => setExpanded(value => !value)}
            >
                <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-grayscale-900 break-words min-w-0">
                        {verifier}
                    </span>
                    <IonIcon
                        icon={chevronDownOutline}
                        aria-hidden="true"
                        className={`shrink-0 text-grayscale-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                </span>
                {receipt.label && receipt.origin && (
                    <span className="block text-xs text-grayscale-600 break-words">
                        {receipt.origin}
                    </span>
                )}
                <span className="block text-xs text-grayscale-600">
                    {new Date(receipt.sentAt).toLocaleString(locale)} ·{' '}
                    {receipt.outcome === 'sent'
                        ? m['verifierHistory.sent']()
                        : m['verifierHistory.handedOff']()}
                </span>
                <span className="block text-sm font-medium text-grayscale-700">
                    {m['verifierHistory.credentialsCount']({
                        count: String(receipt.titles.length),
                    })}
                </span>
                {receipt.purpose && (
                    <span className="block text-xs text-grayscale-600 break-words">
                        {receipt.purpose}
                    </span>
                )}
            </button>
            <div id={detailsId} hidden={!expanded} className="px-4 pb-4 space-y-2">
                <p className="text-xs font-medium text-grayscale-700">
                    {m['verifierHistory.credentialsList']()}
                </p>
                <ul aria-label={m['verifierHistory.credentialsList']()} className="space-y-2">
                    {receipt.titles.map((title, index) => (
                        <li
                            key={index}
                            className="rounded-xl bg-grayscale-100 p-3 text-sm text-grayscale-900 break-words"
                        >
                            {title === 'Credential' ? m['verifierHistory.credential']() : title}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="px-4 pb-4">
                <button
                    type="button"
                    className={historyButton}
                    disabled={loading}
                    onClick={() => onDelete(receipt.eventId)}
                    aria-label={m['verifierHistory.deleteLabel']({ verifier })}
                >
                    {m['verifierHistory.delete']()}
                </button>
            </div>
        </li>
    );
};

/** Render only the visible preview/page; deletion always targets an exact entry. */
export const VerifierHistoryList: React.FC<{
    receipts: VerifierReceipt[];
    loading: boolean;
    onDelete: (eventId: string) => void;
}> = ({ receipts, loading, onDelete }) => (
    <ul className="space-y-3" aria-label={m['verifierHistory.title']()}>
        {receipts.map(receipt => (
            <VerifierHistoryEntry
                key={receipt.eventId}
                receipt={receipt}
                loading={loading}
                onDelete={onDelete}
            />
        ))}
    </ul>
);
