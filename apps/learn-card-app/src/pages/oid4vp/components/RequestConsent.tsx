import React, { useMemo, useState } from 'react';
import { Award, ChevronDown, Lock, ShieldAlert } from 'lucide-react';

import { VerifierHeader } from 'learn-card-base';

import type {
    AuthorizationRequest,
    SelectionResult,
    DcqlSelectionResult,
} from '@learncard/openid4vc-plugin';

import type { PooledCandidate } from '../candidatePool';

/**
 * User\u2019s per-row pick. Keys are PEX descriptor ids or DCQL credential
 * query ids; values are indices into that row\u2019s `candidates` array.
 */
export type ConsentPicks = Record<string, number>;

export interface RequestConsentProps {
    request: AuthorizationRequest;
    /** PEX selection \u2014 mutually exclusive with `dcqlSelection`. */
    selection?: SelectionResult;
    /** DCQL selection \u2014 mutually exclusive with `selection`. */
    dcqlSelection?: DcqlSelectionResult;

    /**
     * Called with the holder\u2019s per-row picks once they approve. Index
     * is into the row\u2019s `candidates` array, defaulting to 0.
     */
    onApprove: (picks: ConsentPicks) => void;
    onCancel: () => void;
}

/**
 * Consent screen for an incoming OID4VP presentation request. Surfaces:
 *
 *   - Verifier identity (host + display name from `client_metadata`)
 *   - "Encrypted response" affordance when the verifier asked for JARM
 *   - Reason ("purpose") the verifier offered, when present
 *   - Per-descriptor / per-DCQL-query rows showing what credential will
 *     be shared, with a candidate picker when the holder has multiple
 *     matches and a collapsible field-disclosure section
 *   - Approve / Cancel buttons
 *
 * Picks default to the first match per row; the user can override
 * inline. Rows the wallet can\u2019t satisfy disable Approve.
 */
const RequestConsent: React.FC<RequestConsentProps> = ({
    request,
    selection,
    dcqlSelection,
    onApprove,
    onCancel,
}) => {
    const verifierDisplay = useMemo(
        () => extractVerifierDisplay(request),
        [request]
    );

    const purpose = useMemo(() => extractPurpose(request), [request]);
    const isJarm = request.response_mode === 'direct_post.jwt';

    const rows = useMemo(
        () => buildRows(request, selection, dcqlSelection),
        [request, selection, dcqlSelection]
    );

    /**
     * Per-row pick. Default to index 0 (the first match) for every row
     * that has at least one candidate. Rows with zero candidates stay
     * out of the map; `Approve` is disabled in that case anyway.
     */
    const [picks, setPicks] = useState<ConsentPicks>(() => {
        const initial: ConsentPicks = {};
        for (const row of rows) {
            if (row.candidates.length > 0) initial[row.id] = 0;
        }
        return initial;
    });

    const allRowsHaveCandidate = rows.every((r) => r.candidates.length > 0);

    const handlePickChange = (rowId: string, index: number) => {
        setPicks((prev) => ({ ...prev, [rowId]: index }));
    };

    return (
        <div className="min-h-full flex items-center justify-center p-4 font-poppins">
            <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden">
                <div className="p-6 space-y-5">
                    <div>
                        <h1 className="text-xl font-semibold text-grayscale-900 mb-1">
                            Share credentials?
                        </h1>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            A verifier is asking to view some of your credentials. Review what they&rsquo;ll see before approving.
                        </p>
                    </div>

                    <VerifierHeader
                        clientId={request.client_id}
                        clientIdScheme={request.client_id_scheme}
                        display={verifierDisplay}
                    />

                    {isJarm && (
                        <div className="flex items-start gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                            <Lock className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-emerald-800">
                                    Encrypted response
                                </p>
                                <p className="text-xs text-emerald-700 leading-relaxed mt-0.5">
                                    Your reply is sealed to the verifier&rsquo;s key, so only they can read it.
                                </p>
                            </div>
                        </div>
                    )}

                    {purpose && (
                        <div className="p-3 rounded-2xl bg-grayscale-10 border border-grayscale-200">
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide mb-1">
                                Reason
                            </p>
                            <p className="text-sm text-grayscale-700 leading-relaxed">
                                {purpose}
                            </p>
                        </div>
                    )}

                    <div>
                        <p className="text-xs font-medium text-grayscale-700 mb-2 uppercase tracking-wide">
                            Credentials to share
                        </p>

                        <ul className="space-y-2">
                            {rows.map((row) => (
                                <ConsentRow
                                    key={row.id}
                                    row={row}
                                    pickedIndex={picks[row.id] ?? 0}
                                    onPick={(idx) => handlePickChange(row.id, idx)}
                                />
                            ))}
                        </ul>
                    </div>

                    {!allRowsHaveCandidate && (
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5">
                            <ShieldAlert className="text-amber-500 w-5 h-5 mt-0.5 shrink-0" />

                            <span className="text-xs text-amber-800 leading-relaxed">
                                Some requested credentials aren&apos;t in your wallet, so the verifier may reject the response. You can still try.
                            </span>
                        </div>
                    )}

                    <div className="space-y-3 pt-1">
                        <button
                            onClick={() => onApprove(picks)}
                            disabled={!allRowsHaveCandidate}
                            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Approve and share
                        </button>

                        <button
                            onClick={onCancel}
                            className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------------------------------
// Row component
// -----------------------------------------------------------------

interface ConsentRowProps {
    row: ConsentRowModel;
    pickedIndex: number;
    onPick: (index: number) => void;
}

const ConsentRow: React.FC<ConsentRowProps> = ({ row, pickedIndex, onPick }) => {
    const [showFields, setShowFields] = useState(false);

    const hasCandidate = row.candidates.length > 0;
    const picked = hasCandidate ? row.candidates[pickedIndex] ?? row.candidates[0] : undefined;
    const hasMultiple = row.candidates.length > 1;
    const hasFields = row.fields.length > 0;

    return (
        <li className="rounded-xl border border-grayscale-200 bg-white">
            <div className="flex items-start gap-3 p-3">
                <div
                    className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                        hasCandidate ? 'bg-emerald-50' : 'bg-amber-50'
                    }`}
                >
                    <Award
                        className={`w-5 h-5 ${
                            hasCandidate ? 'text-emerald-600' : 'text-amber-500'
                        }`}
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-grayscale-900 truncate">
                        {row.title}
                    </p>

                    {row.purpose && (
                        <p className="text-xs text-grayscale-500 leading-relaxed mt-0.5 line-clamp-2">
                            {row.purpose}
                        </p>
                    )}

                    {!hasCandidate && (
                        <p className="text-xs text-amber-700 mt-1">
                            {row.reason ?? 'No matching credential in your wallet'}
                        </p>
                    )}

                    {hasCandidate && !hasMultiple && picked && (
                        <p className="text-xs text-grayscale-600 mt-1 truncate">
                            Sharing: <span className="font-medium">{picked.label}</span>
                        </p>
                    )}

                    {hasCandidate && hasMultiple && (
                        <div className="mt-2">
                            <label
                                htmlFor={`pick-${row.id}`}
                                className="text-xs text-grayscale-500 mb-1 block"
                            >
                                Choose which to share
                            </label>
                            <select
                                id={`pick-${row.id}`}
                                value={pickedIndex}
                                onChange={(e) => onPick(Number(e.target.value))}
                                className="w-full text-sm text-grayscale-900 bg-white border border-grayscale-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            >
                                {row.candidates.map((c, i) => (
                                    <option key={c.id || i} value={i}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {hasFields && (
                        <button
                            type="button"
                            onClick={() => setShowFields((v) => !v)}
                            className="mt-2 inline-flex items-center gap-1 text-xs text-grayscale-600 hover:text-grayscale-900 transition-colors"
                        >
                            <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                    showFields ? 'rotate-180' : ''
                                }`}
                            />
                            {showFields ? 'Hide claims' : `View claims (${row.fields.length})`}
                        </button>
                    )}
                </div>
            </div>

            {hasFields && showFields && (
                <div className="px-3 pb-3 pt-0">
                    <div className="bg-grayscale-10 border border-grayscale-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-grayscale-700 uppercase tracking-wide mb-2">
                            Claims requested
                        </p>
                        <ul className="space-y-1.5">
                            {row.fields.map((f, i) => (
                                <li
                                    key={`${row.id}-field-${i}`}
                                    className="text-xs text-grayscale-700 leading-relaxed"
                                >
                                    <span className="font-medium text-grayscale-900">
                                        {f.label}
                                    </span>
                                    {f.optional && (
                                        <span className="ml-1 text-grayscale-500">(optional)</span>
                                    )}
                                    {f.purpose && (
                                        <span className="block text-grayscale-500 mt-0.5">
                                            {f.purpose}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </li>
    );
};

// -----------------------------------------------------------------
// Row construction
// -----------------------------------------------------------------

interface ConsentRowCandidate {
    label: string;
    candidate: PooledCandidate;
    /** Stable identifier for React keys; falls back to label. */
    id?: string;
}

interface ConsentRowField {
    /** Short user-facing label \u2014 falls back to JSONPath leaf. */
    label: string;
    purpose?: string;
    optional?: boolean;
}

interface ConsentRowModel {
    id: string;
    title: string;
    purpose?: string;
    candidates: ConsentRowCandidate[];
    /** Per-claim disclosure entries surfaced via "View claims". */
    fields: ConsentRowField[];
    /** Why no candidates matched. */
    reason?: string;
}

const buildRows = (
    request: AuthorizationRequest,
    selection?: SelectionResult,
    dcqlSelection?: DcqlSelectionResult
): ConsentRowModel[] => {
    if (selection) {
        return selection.descriptors.map((d) => {
            const inputDescriptor = request.presentation_definition?.input_descriptors?.find(
                (id) => id.id === d.descriptorId
            );

            const candidates: ConsentRowCandidate[] = d.candidates.map((dc) => {
                const candidate = dc.candidate as PooledCandidate;
                return {
                    candidate,
                    label: candidate.title || trimUri(candidate.id),
                    id: candidate.id,
                };
            });

            const fields: ConsentRowField[] = (
                inputDescriptor?.constraints?.fields ?? []
            ).map((field) => ({
                label:
                    field.name?.trim()
                    || field.id?.trim()
                    || jsonPathLeaf(field.path?.[0])
                    || 'claim',
                purpose: field.purpose,
                optional: field.optional,
            }));

            return {
                id: d.descriptorId,
                title: inputDescriptor?.name?.trim() || d.descriptorId,
                purpose: inputDescriptor?.purpose,
                candidates,
                fields,
                reason: d.reason,
            };
        });
    }

    if (dcqlSelection) {
        return Object.entries(dcqlSelection.matches).map(([queryId, match]) => {
            const candidates: ConsentRowCandidate[] = match.candidates.map((c) => {
                const candidate = c as PooledCandidate;
                return {
                    candidate,
                    label: candidate.title || trimUri(candidate.id),
                    id: candidate.id,
                };
            });

            const fields = extractDcqlFields(request, queryId);

            return {
                id: queryId,
                title: queryId,
                candidates,
                fields,
                reason: match.reason,
            };
        });
    }

    return [];
};

// -----------------------------------------------------------------
// Display helpers
// -----------------------------------------------------------------

/**
 * Pull `claims[]` (if present) off a DCQL credential query for the
 * given queryId. The DCQL types vary by credential format and aren\u2019t
 * exposed structurally on `AuthorizationRequest.dcql_query`, so we
 * walk the parsed object defensively.
 */
const extractDcqlFields = (
    request: AuthorizationRequest,
    queryId: string
): ConsentRowField[] => {
    const dq = request.dcql_query as unknown;
    if (!dq || typeof dq !== 'object') return [];

    const credentials = (dq as { credentials?: unknown }).credentials;
    if (!Array.isArray(credentials)) return [];

    const entry = credentials.find(
        (c) => typeof c === 'object' && c && (c as { id?: unknown }).id === queryId
    ) as { claims?: unknown } | undefined;
    if (!entry) return [];

    const claims = entry.claims;
    if (!Array.isArray(claims)) return [];

    return claims.map((claim) => {
        if (!claim || typeof claim !== 'object') {
            return { label: 'claim' };
        }
        const c = claim as Record<string, unknown>;
        const path = c.path;
        const labelFromPath = Array.isArray(path) && path.length > 0
            ? String(path[path.length - 1])
            : undefined;
        return {
            label:
                stringOrUndef(c.id)
                || labelFromPath
                || 'claim',
            purpose: stringOrUndef(c.purpose),
            optional:
                typeof c.optional === 'boolean'
                    ? c.optional
                    : undefined,
        };
    });
};

const stringOrUndef = (v: unknown): string | undefined =>
    typeof v === 'string' && v.length > 0 ? v : undefined;

const jsonPathLeaf = (path: string | undefined): string | undefined => {
    if (!path) return undefined;
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    const leaf = parts[parts.length - 1];
    if (!leaf || leaf === '$' || leaf === '') return undefined;
    return leaf;
};

const extractVerifierDisplay = (request: AuthorizationRequest) => {
    const meta = request.client_metadata;
    if (!meta || typeof meta !== 'object') return undefined;

    const m = meta as Record<string, unknown>;
    return {
        name: stringField(m, 'client_name'),
        logoUri: stringField(m, 'logo_uri') ?? stringField(m, 'client_logo'),
        policyUri: stringField(m, 'policy_uri'),
        tosUri: stringField(m, 'tos_uri'),
    };
};

const extractPurpose = (request: AuthorizationRequest): string | undefined => {
    if (request.presentation_definition?.purpose) {
        return request.presentation_definition.purpose;
    }
    const firstDescriptorPurpose =
        request.presentation_definition?.input_descriptors?.find((d) => d.purpose)?.purpose;
    return firstDescriptorPurpose;
};

const stringField = (
    obj: Record<string, unknown>,
    key: string
): string | undefined => {
    const v = obj[key];
    return typeof v === 'string' && v.length > 0 ? v : undefined;
};

const trimUri = (uri: string | undefined): string => {
    if (!uri) return 'Credential';
    if (uri.length <= 32) return uri;
    return `${uri.slice(0, 16)}\u2026${uri.slice(-12)}`;
};

export default RequestConsent;
