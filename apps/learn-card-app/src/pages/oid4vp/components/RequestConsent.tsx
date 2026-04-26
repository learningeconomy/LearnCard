import React, { useMemo } from 'react';
import { Award, ShieldAlert } from 'lucide-react';

import { VerifierHeader } from 'learn-card-base';

import type {
    AuthorizationRequest,
    SelectionResult,
    DcqlSelectionResult,
} from '@learncard/openid4vc-plugin';

import type { PooledCandidate } from '../candidatePool';

export interface RequestConsentProps {
    request: AuthorizationRequest;
    /** PEX selection \u2014 mutually exclusive with `dcqlSelection`. */
    selection?: SelectionResult;
    /** DCQL selection \u2014 mutually exclusive with `selection`. */
    dcqlSelection?: DcqlSelectionResult;

    onApprove: () => void;
    onCancel: () => void;
}

/**
 * Consent screen for an incoming OID4VP presentation request. Surfaces:
 *
 *   - Verifier identity (host + display name from `client_metadata`)
 *   - Reason ("purpose") the verifier offered, when present
 *   - Per-descriptor / per-DCQL-query rows showing what credential will
 *     be shared (auto-selected: first eligible candidate in each row)
 *   - Approve / Cancel buttons
 *
 * Multi-candidate descriptors auto-pick the first match for now \u2014 a
 * Stage 4 polish will swap in a per-row picker. Descriptors with zero
 * matches are surfaced inline so the user understands what\u2019s missing.
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

    const rows = useMemo(
        () => buildRows(request, selection, dcqlSelection),
        [request, selection, dcqlSelection]
    );

    const allRowsHaveCandidate = rows.every((r) => r.chosen);

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
                                <ConsentRow key={row.id} row={row} />
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
                            onClick={onApprove}
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

interface ConsentRowProps {
    row: ConsentRowModel;
}

const ConsentRow: React.FC<ConsentRowProps> = ({ row }) => (
    <li className="flex items-start gap-3 p-3 rounded-xl border border-grayscale-200 bg-white">
        <div
            className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                row.chosen ? 'bg-emerald-50' : 'bg-amber-50'
            }`}
        >
            <Award
                className={`w-5 h-5 ${
                    row.chosen ? 'text-emerald-600' : 'text-amber-500'
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

            {row.chosen ? (
                <p className="text-xs text-grayscale-600 mt-1 truncate">
                    Sharing: <span className="font-medium">{row.chosen.label}</span>
                </p>
            ) : (
                <p className="text-xs text-amber-700 mt-1">
                    {row.reason ?? 'No matching credential in your wallet'}
                </p>
            )}
        </div>
    </li>
);

// -----------------------------------------------------------------
// Row construction
// -----------------------------------------------------------------

interface ConsentRowModel {
    id: string;
    title: string;
    purpose?: string;
    /** Auto-picked candidate. `null` when nothing matched. */
    chosen?: { label: string; candidate: PooledCandidate };
    /** Why nothing matched. */
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
            const first = d.candidates[0];
            const candidate = first?.candidate as PooledCandidate | undefined;

            return {
                id: d.descriptorId,
                title:
                    inputDescriptor?.name?.trim()
                    || d.descriptorId,
                purpose: inputDescriptor?.purpose,
                chosen: candidate
                    ? {
                          candidate,
                          label: candidate.title || trimUri(candidate.id),
                      }
                    : undefined,
                reason: d.reason,
            };
        });
    }

    if (dcqlSelection) {
        return Object.entries(dcqlSelection.matches).map(([queryId, match]) => {
            const first = match.candidates[0] as PooledCandidate | undefined;
            return {
                id: queryId,
                title: queryId,
                chosen: first
                    ? {
                          candidate: first,
                          label: first.title || trimUri(first.id),
                      }
                    : undefined,
                reason: match.reason,
            };
        });
    }

    return [];
};

// -----------------------------------------------------------------
// Display helpers
// -----------------------------------------------------------------

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
