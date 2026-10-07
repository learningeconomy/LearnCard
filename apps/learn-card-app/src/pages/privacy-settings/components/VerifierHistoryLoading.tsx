import React from 'react';
import { SkeletonRows } from './shared-links/ListCard';
import * as m from '../../../paraglide/messages.js';

/** Match the neighboring shared-link placeholders without showing a false empty state. */
export const VerifierHistoryLoading: React.FC<{ initial?: boolean }> = ({ initial = false }) => (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-3">
        <p className="flex items-center gap-2 text-sm text-grayscale-600">
            <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 rounded-full border-2 border-grayscale-200 border-t-grayscale-600 motion-safe:animate-spin"
            />
            {m['verifierHistory.loading']()}
        </p>
        {initial && (
            <ul aria-hidden="true" className="divide-y divide-grayscale-100">
                <SkeletonRows />
            </ul>
        )}
    </div>
);
