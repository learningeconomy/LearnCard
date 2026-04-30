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

    const unsatisfiedRows = useMemo(
        () => buildUnsatisfiedRows(request, selection, dcqlSelection),
        [request, selection, dcqlSelection]
    );

    // Drive the subtitle off the row list rather than the plugin's
    // debug-flavored `reason` string. When it's a single missing
    // descriptor we name it; otherwise we count. Either way, the copy
    // is written for a user, not an engineer.
    const summary = buildFriendlySummary(unsatisfiedRows);

    return (
        <div
            className="min-h-full flex items-center justify-center font-poppins"
            style={{
                paddingTop: 'max(1rem, env(safe-area-inset-top))',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                paddingRight: 'max(1rem, env(safe-area-inset-right))',
            }}
        >
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
                    title:
                        inputDescriptor?.name?.trim()
                        || humanizeIdentifier(d.descriptorId),
                    purpose: inputDescriptor?.purpose,
                    // Ignore `d.reason` — it's engineer-speak
                    // ("No credential satisfies ... (required format:
                    // jwt_vc_json)"). The row title already tells the
                    // user which credential is missing; this line just
                    // frames the status in plain language.
                    reason: 'Not in your wallet yet.',
                };
            });
    }

    if (dcqlSelection) {
        return Object.entries(dcqlSelection.matches)
            .filter(([, m]) => m.candidates.length === 0)
            .map(([queryId]) => ({
                id: queryId,
                title: humanizeIdentifier(queryId),
                reason: 'Not in your wallet yet.',
            }));
    }

    return [];
};

/**
 * Pick user-facing subtitle copy from the unsatisfied-row list.
 *
 *   - 0 rows: generic fallback (shouldn't happen — we only render
 *     this screen when rows > 0 — but keeps the return typed).
 *   - 1 row: name it specifically ("You don’t have a University
 *     Degree in your wallet yet.").
 *   - N rows: count-driven ("You’re missing 2 of the credentials
 *     the verifier asked for."). We avoid listing names inline
 *     because long lists render poorly in the header strip — the
 *     titled row list below already enumerates them.
 */
const buildFriendlySummary = (rows: UnsatisfiedRow[]): string => {
    if (rows.length === 0) {
        return 'Some of the requested credentials aren’t in your wallet yet.';
    }

    if (rows.length === 1) {
        return `You don’t have ${withArticle(rows[0].title)} in your wallet yet.`;
    }

    return `You’re missing ${rows.length} of the credentials the verifier asked for.`;
};

/**
 * Humanize a bare identifier (e.g. `UniversityDegree`,
 * `driver_license`, `degree-of-philosophy`) into a title-cased,
 * space-separated phrase. Used only when the verifier didn’t ship
 * a human `name` on the input descriptor, so this is a fallback —
 * a well-formed PEX request should never hit it.
 *
 * We avoid over-processing: no acronym detection, no i18n, no
 * dictionary lookup. The goal is to turn an identifier into
 * something a user can parse at a glance without making it feel
 * auto-generated.
 */
const humanizeIdentifier = (identifier: string): string => {
    if (!identifier) return identifier;

    // Split on explicit separators first, then on camelCase boundaries.
    const parts = identifier
        .split(/[_\-\s]+/)
        .flatMap((chunk) =>
            chunk
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
                .split(/\s+/)
        )
        .filter(Boolean);

    if (parts.length === 0) return identifier;

    return parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Very light article picker for the "You don’t have {x} in your
 * wallet yet." copy. Vowel-sound heuristic only — correct enough
 * for the descriptor names we actually see ("University Degree"
 * → "a", "Open Badge" → "an"). Not trying to ship a full English
 * grammar engine.
 */
const withArticle = (phrase: string): string => {
    const first = phrase.trim().charAt(0).toLowerCase();
    const article = 'aeiou'.includes(first) ? 'an' : 'a';
    return `${article} ${phrase}`;
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
