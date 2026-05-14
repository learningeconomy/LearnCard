import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import type { VC } from '@learncard/types';
import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';

import { useUploadVcFromText } from './useUploadVcFromText';
import { useAnalytics } from '../analytics/context';
import { AnalyticsEvents } from '../analytics/events';
import type { AddressBookContact } from '../pages/addressBook/addressBookHelpers';
import {
    parseClaimInput,
    type ClaimSurface,
    type ParsedClaimInput,
    type UnrecognizedReason,
} from './parseClaimInput';

export type { ClaimSurface, ParsedClaimInput, UnrecognizedReason } from './parseClaimInput';
export { parseClaimInput } from './parseClaimInput';

export type ClaimInputSource = 'camera' | 'paste' | 'image_upload' | 'clipboard_auto';

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
    source: ClaimInputSource;
}

const SURFACE_TO_PATH: Record<ClaimSurface, (parsed: ParsedClaimInput) => string | null> = {
    oid4vci: parsed =>
        parsed.kind === 'oid4vci' ? `/oid4vci?offer=${encodeURIComponent(parsed.offerUrl)}` : null,
    oid4vp: parsed =>
        parsed.kind === 'oid4vp' ? `/oid4vp?request=${encodeURIComponent(parsed.requestUrl)}` : null,
    'vc-api-custom-scheme': parsed =>
        parsed.kind === 'vc-api-custom-scheme' ? parsed.path : null,
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
    source,
}: UseClaimInputRouterOptions): ((input: string) => Promise<ClaimRouteResult>) => {
    const history = useHistory();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { validateTextVC } = useUploadVcFromText();
    const { track } = useAnalytics();

    return useCallback(
        async (input: string): Promise<ClaimRouteResult> => {
            const parsed = parseClaimInput(input);

            const emit = (result: ClaimRouteResult) => {
                void track(AnalyticsEvents.CLAIM_INPUT_ROUTED, {
                    source,
                    parsed_kind: parsed.kind,
                    outcome: result.kind,
                    unrecognized_reason:
                        result.kind === 'unrecognized' ? result.reason : undefined,
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
                    presentToast(`Invalid credential: ${errors.join(', ')}`, {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    });
                    return emit({ kind: 'unrecognized', reason: 'invalid_vc', raw: input });
                }
                const vc = JSON.parse(parsed.raw) as VC;
                return emit({ kind: 'open_claim_vc', vc });
            }

            if (parsed.kind === 'interaction-url') {
                try {
                    const response = await fetch(parsed.url, {
                        headers: { Accept: 'application/json' },
                    });
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
                        const path = `/request?vc_request_url=${interactionData.protocols.vcapi}`;
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
                    // fall through
                }
                return emit({ kind: 'unrecognized', reason: 'unknown_format', raw: input });
            }

            return emit({ kind: 'unrecognized', reason: 'unknown_format', raw: input });
        },
        [history, initWallet, presentToast, validateTextVC, source, track]
    );
};
