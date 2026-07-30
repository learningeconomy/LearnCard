/**
 * Endorsement termination — "Get N endorsements".
 *
 * Trusted-issuer DIDs are optional: when empty, any issuer counts;
 * when set, only those DIDs count. The summary only surfaces the
 * clause when the list is non-empty so an empty-but-present array
 * doesn't lie to the learner about who can endorse them.
 */

import React from 'react';

import { ribbonOutline } from 'ionicons/icons';

import type { Termination } from '../../types';
import { INPUT, LABEL } from '../shared/inputs';

import type { TerminationKindSpec } from './types';

const EndorsementEditor: React.FC<{
    value: Extract<Termination, { kind: 'endorsement' }>;
    onChange: (next: Termination) => void;
}> = ({ value, onChange }) => (
    <div className="space-y-3">
        <div className="space-y-1.5">
            <label className={LABEL} htmlFor="term-min-endorsers">
                Endorsers required
            </label>

            <input
                id="term-min-endorsers"
                type="number"
                min={1}
                className={INPUT}
                value={value.minEndorsers}
                onChange={e =>
                    onChange({
                        ...value,
                        minEndorsers: Math.max(1, Number(e.target.value) || 1),
                    })
                }
            />
        </div>

        <div className="space-y-1.5">
            <label className={LABEL} htmlFor="term-trusted-issuers">
                Accept endorsements from (optional)
            </label>

            <input
                id="term-trusted-issuers"
                type="text"
                className={INPUT}
                placeholder="did:web:school.edu, did:key:…"
                value={value.trustedIssuers?.join(', ') ?? ''}
                onChange={e => {
                    const list = e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);

                    onChange({
                        ...value,
                        trustedIssuers: list.length > 0 ? list : undefined,
                    });
                }}
            />

            <p className="text-xs text-grayscale-500 leading-relaxed">
                Leave blank to accept any endorser. Comma-separate DIDs to restrict.
            </p>
        </div>
    </div>
);

const endorsementSpec: TerminationKindSpec<'endorsement'> = {
    kind: 'endorsement',
    label: 'Get endorsed',
    icon: ribbonOutline,
    blurb: 'Done when a target number of endorsements arrive.',
    selectable: true,

    default: () => ({ kind: 'endorsement', minEndorsers: 1 }),

    Editor: ({ value, onChange }) => (
        <EndorsementEditor value={value} onChange={onChange} />
    ),

    summarize: value => {
        const base =
            value.minEndorsers === 1
                ? 'Get 1 endorsement'
                : `Get ${value.minEndorsers} endorsements`;

        const hasTrusted =
            Array.isArray(value.trustedIssuers) && value.trustedIssuers.length > 0;

        return hasTrusted ? `${base} from trusted issuers` : base;
    },
};

export default endorsementSpec;
