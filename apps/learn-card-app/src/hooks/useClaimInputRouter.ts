import { useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import type { VC } from '@learncard/types';
import { useWallet } from 'learn-card-base';

import { useUploadVcFromText } from './useUploadVcFromText';
import { useAnalytics } from '../analytics/context';
import { AnalyticsEvents } from '../analytics/events';
import type { AddressBookContact } from '../pages/addressBook/addressBookHelpers';
import {
    parseClaimInput,
    type ClaimSurface,
    type ParsedClaimInput,
    type ParseClaimInputConfig,
    type UnrecognizedReason,
} from './parseClaimInput';
import { resolveTenantParseConfig } from './resolveTenantParseConfig';

export type {
    ClaimSurface,
    ParsedClaimInput,
    ParseClaimInputConfig,
    UnrecognizedReason,
} from './parseClaimInput';
export { parseClaimInput } from './parseClaimInput';

export type ClaimInputSource = 'camera' | 'paste' | 'image_upload' | 'clipboard_auto';

export type ClaimInputRouter = (
    input: string,
    source?: ClaimInputSource
) => Promise<ClaimRouteResult>;

const INTERACTION_URL_TIMEOUT_MS = 10_000;

const getSameOriginInteractionPath = (url: string): string | null => {
    if (typeof window === 'undefined') return null;

    try {
        const parsed = new URL(url);
        if (parsed.origin !== window.location.origin) return null;
        return parsed.pathname + parsed.search + parsed.hash;
    } catch {
        return null;
    }
};

const fetchWithTimeout = async (
    url: string,
    init: RequestInit,
    timeoutMs: number
): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
};

/**
 * The structured outcome of routing a claim input. Returned by the
 * function `useClaimInputRouter()` produces. Consumers branch on
 * `kind`: 'routed' / 'open_contact' / 'open_claim' / 'open_website'
 * are success states; 'unrecognized' is the only failure path the
 * caller has to surface.
 */
export type ClaimRouteResult =
    | { kind: 'routed'; surface: ClaimSurface; path: string }
    | { kind: 'open_contact'; contact: AddressBookContact }
    | { kind: 'open_claim_boost'; boost: { uri: string; challenge: string } }
    | { kind: 'open_claim_vc'; vc: VC }
    | { kind: 'open_website'; url: string }
    | { kind: 'unrecognized'; reason: UnrecognizedReason; raw: string };

export interface UseClaimInputRouterOptions {
    /**
     * Default `source` for telemetry when the caller doesn't pass one
     * at dispatch time. Kept for callers (like the camera scanner)
     * whose source never changes per call.
     */
    defaultSource: ClaimInputSource;
}

const SURFACE_TO_PATH: Record<ClaimSurface, (parsed: ParsedClaimInput) => string | null> = {
    oid4vci: parsed =>
        parsed.kind === 'oid4vci' ? `/oid4vci?offer=${encodeURIComponent(parsed.offerUrl)}` : null,
    oid4vp: parsed =>
        parsed.kind === 'oid4vp'
            ? `/oid4vp?request=${encodeURIComponent(parsed.requestUrl)}`
            : null,
    'vc-api-custom-scheme': parsed => (parsed.kind === 'vc-api-custom-scheme' ? parsed.path : null),
    'lcw-https': parsed => (parsed.kind === 'lcw-https' ? parsed.path : null),
    'boost-claim': () => null,
    'connection-request': () => null,
    'raw-vc': () => null,
    interaction: () => null,
};

/**
 * Hook returning a `route(input, ...)` function that disambiguates a
 * credential-claim string and dispatches the right side effect:
 * navigation (`history.push`), modal open (returned as a structured
 * result so the caller can render the modal in its own way), or
 * recursive routing for interaction URLs.
 *
 * Emits `AnalyticsEvents.CLAIM_INPUT_ROUTED` once per call so we can
 * answer "where do users actually claim from?" — camera vs paste vs
 * image upload vs clipboard.
 *
 * Returns the same `ClaimRouteResult` discriminated union to ALL
 * callers, so the camera scanner and the paste modal share the same
 * dispatch contract.
 */
export const useClaimInputRouter = ({
    defaultSource,
}: UseClaimInputRouterOptions): ClaimInputRouter => {
    const history = useHistory();
    const { initWallet } = useWallet();
    const { validateTextVC } = useUploadVcFromText();
    const { track } = useAnalytics();

    const parserConfig = useMemo<ParseClaimInputConfig>(() => resolveTenantParseConfig(), []);

    return useCallback(
        async (
            input: string,
            source: ClaimInputSource = defaultSource
        ): Promise<ClaimRouteResult> => {
            const parsed = parseClaimInput(input, parserConfig);

            const emit = (result: ClaimRouteResult) => {
                void track(AnalyticsEvents.CLAIM_INPUT_ROUTED, {
                    source,
                    parsed_kind: parsed.kind,
                    outcome: result.kind,
                    unrecognized_reason: result.kind === 'unrecognized' ? result.reason : undefined,
                    surface: result.kind === 'routed' ? result.surface : undefined,
                });
                return result;
            };

            if (parsed.kind === 'unrecognized') {
                return emit({ kind: 'unrecognized', reason: parsed.reason, raw: input });
            }

            if (
                parsed.kind === 'oid4vci' ||
                parsed.kind === 'oid4vp' ||
                parsed.kind === 'vc-api-custom-scheme' ||
                parsed.kind === 'lcw-https'
            ) {
                const surface: ClaimSurface = parsed.kind;
                const pathResolver = SURFACE_TO_PATH[surface];
                const path = pathResolver(parsed);
                if (!path) {
                    return emit({ kind: 'unrecognized', reason: 'unknown_format', raw: input });
                }
                history.push(path);
                return emit({ kind: 'routed', surface, path });
            }

            if (parsed.kind === 'boost-claim') {
                return emit({
                    kind: 'open_claim_boost',
                    boost: { uri: parsed.boostUri, challenge: parsed.challenge },
                });
            }

            if (parsed.kind === 'connection-request') {
                const wallet = await initWallet();
                try {
                    const user = await wallet?.invoke?.getProfile(parsed.profileId);
                    if (user) {
                        return emit({ kind: 'open_contact', contact: user });
                    }
                } catch {
                    // fall through to unrecognized
                }
                return emit({ kind: 'unrecognized', reason: 'unknown_format', raw: input });
            }

            if (parsed.kind === 'raw-vc-candidate') {
                const errors = validateTextVC(parsed.raw);
                if (errors) {
                    return emit({ kind: 'unrecognized', reason: 'invalid_vc', raw: input });
                }
                return emit({ kind: 'open_claim_vc', vc: parsed.parsed as VC });
            }

            if (parsed.kind === 'interaction-url') {
                const sameOriginPath = getSameOriginInteractionPath(parsed.url);
                if (sameOriginPath) {
                    history.push(sameOriginPath);
                    return emit({ kind: 'routed', surface: 'interaction', path: sameOriginPath });
                }

                try {
                    const response = await fetchWithTimeout(
                        parsed.url,
                        { headers: { Accept: 'application/json' } },
                        INTERACTION_URL_TIMEOUT_MS
                    );
                    if (response.ok === false) {
                        return emit({
                            kind: 'unrecognized',
                            reason: 'interaction_unavailable',
                            raw: input,
                        });
                    }
                    const interactionData = await response.json();
                    if (interactionData?.protocols?.openid4vci) {
                        const path = `/oid4vci?offer=${encodeURIComponent(
                            interactionData.protocols.openid4vci
                        )}`;
                        history.push(path);
                        return emit({ kind: 'routed', surface: 'oid4vci', path });
                    }
                    if (interactionData?.protocols?.openid4vp) {
                        const path = `/oid4vp?request=${encodeURIComponent(
                            interactionData.protocols.openid4vp
                        )}`;
                        history.push(path);
                        return emit({ kind: 'routed', surface: 'oid4vp', path });
                    }
                    if (interactionData?.protocols?.vcapi) {
                        const path = `/request?vc_request_url=${encodeURIComponent(
                            interactionData.protocols.vcapi
                        )}`;
                        history.push(path);
                        return emit({
                            kind: 'routed',
                            surface: 'vc-api-custom-scheme',
                            path,
                        });
                    }
                    if (interactionData?.protocols?.website) {
                        return emit({
                            kind: 'open_website',
                            url: interactionData.protocols.website,
                        });
                    }
                } catch {
                    return emit({
                        kind: 'unrecognized',
                        reason: 'interaction_unavailable',
                        raw: input,
                    });
                }
                return emit({
                    kind: 'unrecognized',
                    reason: 'interaction_unavailable',
                    raw: input,
                });
            }

            return emit({ kind: 'unrecognized', reason: 'unknown_format', raw: input });
        },
        [history, initWallet, validateTextVC, defaultSource, track, parserConfig]
    );
};
