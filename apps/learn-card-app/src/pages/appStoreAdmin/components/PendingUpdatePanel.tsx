import React, { useState } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import type { PendingListingUpdate } from '@learncard/types';

import * as m from '../../../paraglide/messages.js';

type ChangeKey = keyof PendingListingUpdate['changes'];

const FIELD_GROUPS: Array<{ label: () => string; keys: ChangeKey[] }> = [
    { label: () => m['appStoreAdmin.listing.update.fieldName'](), keys: ['display_name'] },
    { label: () => m['appStoreAdmin.listing.update.fieldTagline'](), keys: ['tagline'] },
    {
        label: () => m['appStoreAdmin.listing.update.fieldDescription'](),
        keys: ['full_description'],
    },
    { label: () => m['appStoreAdmin.listing.update.fieldIcon'](), keys: ['icon_url'] },
    { label: () => m['appStoreAdmin.listing.update.fieldScreenshots'](), keys: ['screenshots'] },
    { label: () => m['appStoreAdmin.listing.update.fieldHighlights'](), keys: ['highlights'] },
    {
        label: () => m['appStoreAdmin.listing.update.fieldLinks'](),
        keys: ['privacy_policy_url', 'terms_url', 'contact_email', 'promo_video_url'],
    },
    {
        label: () => m['appStoreAdmin.listing.update.fieldLaunch'](),
        keys: ['launch_type', 'launch_config_json'],
    },
];

const GROUPED_KEYS = new Set<string>(FIELD_GROUPS.flatMap(group => group.keys));

const formatValue = (value: unknown): string => {
    if (Array.isArray(value)) return value.join('\n');
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
};

interface PendingUpdatePanelProps {
    listingId: string;
    update: PendingListingUpdate;
    onReview: (listingId: string, approve: boolean) => Promise<void>;
}

export const PendingUpdatePanel: React.FC<PendingUpdatePanelProps> = ({
    listingId,
    update,
    onReview,
}) => {
    const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
    const changes = update.changes as Record<string, unknown>;

    const rows = FIELD_GROUPS.map(group => ({
        label: group.label(),
        values: group.keys
            .filter(key => changes[key] !== undefined)
            .map(key => formatValue(changes[key])),
    })).filter(row => row.values.length > 0);

    if (Object.keys(changes).some(key => !GROUPED_KEYS.has(key))) {
        rows.push({ label: m['appStoreAdmin.listing.update.fieldOther'](), values: [] });
    }

    const review = async (approve: boolean) => {
        setDecision(approve ? 'approve' : 'reject');
        try {
            await onReview(listingId, approve);
        } finally {
            setDecision(null);
        }
    };

    const inReview = update.status === 'PENDING_REVIEW';

    return (
        <div className="m-5 p-5 rounded-[20px] border border-amber-200 bg-amber-50 font-poppins">
            <h3 className="text-sm font-semibold text-grayscale-900">
                {inReview
                    ? m['appStoreAdmin.listing.update.title']()
                    : m['appStoreAdmin.listing.update.draftNote']()}
            </h3>
            {inReview && (
                <p className="text-xs text-grayscale-600 mt-1">
                    {m['appStoreAdmin.listing.update.description']()}
                </p>
            )}

            {(rows.length > 0 || update.manifest_version !== undefined) && (
                <dl className="mt-4 space-y-3">
                    {rows.map(row => (
                        <div key={row.label}>
                            <dt className="text-xs font-medium text-grayscale-700">{row.label}</dt>
                            {row.values.map((value, index) => (
                                <dd
                                    key={index}
                                    className="mt-1 text-sm text-grayscale-900 whitespace-pre-wrap break-words"
                                >
                                    {value}
                                </dd>
                            ))}
                        </div>
                    ))}
                    {update.manifest_version !== undefined && (
                        <p className="text-sm text-grayscale-900">
                            {m['appStoreAdmin.listing.update.capabilities']({
                                version: update.manifest_version,
                            })}
                        </p>
                    )}
                </dl>
            )}

            {inReview && (
                <div className="mt-5 flex flex-col sm:flex-row gap-2">
                    <button
                        type="button"
                        onClick={() => review(false)}
                        disabled={decision !== null}
                        className="flex-1 py-2.5 px-4 rounded-[20px] border border-red-200 bg-white text-red-600 font-medium text-sm hover:bg-red-50 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {decision === 'reject' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <XCircle className="w-4 h-4" />
                        )}
                        {m['appStoreAdmin.listing.update.reject']()}
                    </button>
                    <button
                        type="button"
                        onClick={() => review(true)}
                        disabled={decision !== null}
                        className="flex-1 py-2.5 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {decision === 'approve' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4" />
                        )}
                        {m['appStoreAdmin.listing.update.approve']()}
                    </button>
                </div>
            )}
        </div>
    );
};
