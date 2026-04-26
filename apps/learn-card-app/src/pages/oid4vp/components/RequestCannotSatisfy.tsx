import React, { useMemo } from 'react';
import { ShieldAlert, Inbox } from 'lucide-react';

import { VerifierHeader } from 'learn-card-base';

import type {
    AuthorizationRequest,
    DcqlSelectionResult,
    SelectionResult,
} from '@learncard/openid4vc-plugin';

export interface RequestCannotSatisfyProps {
    request: AuthorizationRequest;
    selection?: SelectionResult;
    dcqlSelection?: DcqlSelectionResult;
    onDone: () => void;
}

/**
 * Friendly screen rendered when the verifier asked for credentials the
 * holder doesn\u2019t have. We surface:
 *
 *   - A reassuring framing (no error noise, no stack)
 *   - The verifier identity, so the user knows who asked
 *   - The plugin\u2019s top-level `reason` (best summary)
 *   - A list of unsatisfied descriptors with their per-row reasons
 *   - A primary "Done" button \u2014 nothing the user can fix here without
 *     leaving and acquiring the missing credential separately
 */
const RequestCannotSatisfy: React.FC<RequestCannotSatisfyProps> = ({
    request,
    selection,
    dcqlSelection,
    onDone,
}) => {
    const verifierDisplay = useMemo(
        () => extractVerifierDisplay(request),
        [request]
    );

    const summary =
        selection?.reason
        || dcqlSelection?.reason
        || 'Some of the requested credentials aren\u2019t in your wallet yet.';

    const unsatisfiedRows = useMemo(
        () => buildUnsatisfiedRows(request, selection, dcqlSelection),
        [request, selection, dcqlSelection]
    );

    return (
        <div className="min-h-full flex items-center justify-center p-4 font-poppins">
            <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden">
                <div className="px-6 py-7 text-center bg-gradient-to-r from-amber-400 to-amber-500">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <ShieldAlert className="w-9 h-9 text-white" />
                    </div>

                    <h1 className="text-xl font-semibold text-white mb-1">
                        Missing credentials
                    </h1>

                    <p className="text-sm text-white/85 leading-relaxed px-2">
                        {summary}
                    </p>
                </div>

                <div className="p-6 space-y-5">
                    <VerifierHeader
                        clientId={request.client_id}
                        clientIdScheme={request.client_id_scheme}
                        display={verifierDisplay}
                    />

                    {unsatisfiedRows.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-grayscale-700 mb-2 uppercase tracking-wide">
                                What was asked for
                            </p>

                            <ul className="space-y-2">
                                {unsatisfiedRows.map((row) => (
                                    <li
                                        key={row.id}
                                        className="flex items-start gap-3 p-3 rounded-xl border border-grayscale-200 bg-grayscale-10"
                                    >
                                        <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                                            <Inbox className="w-5 h-5 text-amber-500" />
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

                                            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                                {row.reason}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={onDone}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

interface UnsatisfiedRow {
    id: string;
    title: string;
    purpose?: string;
    reason: string;
}

const buildUnsatisfiedRows = (
    request: AuthorizationRequest,
    selection?: SelectionResult,
    dcqlSelection?: DcqlSelectionResult
): UnsatisfiedRow[] => {
    if (selection) {
        return selection.descriptors
            .filter((d) => d.candidates.length === 0)
            .map((d) => {
                const inputDescriptor = request.presentation_definition?.input_descriptors?.find(
                    (id) => id.id === d.descriptorId
                );

                return {
                    id: d.descriptorId,
                    title: inputDescriptor?.name?.trim() || d.descriptorId,
                    purpose: inputDescriptor?.purpose,
                    reason: d.reason ?? 'No matching credential in your wallet.',
                };
            });
    }

    if (dcqlSelection) {
        return Object.entries(dcqlSelection.matches)
            .filter(([, m]) => m.candidates.length === 0)
            .map(([queryId, m]) => ({
                id: queryId,
                title: queryId,
                reason: m.reason ?? 'No matching credential in your wallet.',
            }));
    }

    return [];
};

const extractVerifierDisplay = (request: AuthorizationRequest) => {
    const meta = request.client_metadata;
    if (!meta || typeof meta !== 'object') return undefined;

    const m = meta as Record<string, unknown>;
    return {
        name: stringField(m, 'client_name'),
        logoUri: stringField(m, 'logo_uri') ?? stringField(m, 'client_logo'),
    };
};

const stringField = (
    obj: Record<string, unknown>,
    key: string
): string | undefined => {
    const v = obj[key];
    return typeof v === 'string' && v.length > 0 ? v : undefined;
};

export default RequestCannotSatisfy;
