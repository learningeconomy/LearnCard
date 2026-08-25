import type {
    CapturedAppManifest,
    CapturedTemplateRecord,
    CapturedConsentRecord,
    ConsentRequest,
    InlineCredentialTemplate,
} from './types';
import { canonicalJsonString } from './canonical';
import { normalizeConsentRequest, canonicalConsentScopeString } from './consent';

interface BufferLike {
    from(
        input: string,
        encoding: 'utf8' | 'base64'
    ): { toString(encoding: 'base64' | 'utf8'): string };
}

const getTextEncoder = (): TextEncoder | undefined => {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder();
    return undefined;
};

const getTextDecoder = (): TextDecoder | undefined => {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder();
    return undefined;
};

const getBuffer = (): BufferLike | undefined => {
    const candidate = (globalThis as { Buffer?: BufferLike }).Buffer;
    return candidate;
};

const toBase64 = (value: string): string => {
    const buffer = getBuffer();
    if (buffer) return buffer.from(value, 'utf8').toString('base64');

    const encoder = getTextEncoder();
    if (encoder && typeof btoa === 'function') {
        const bytes = encoder.encode(value);
        let binary = '';
        for (const byte of bytes) binary += String.fromCharCode(byte);
        return btoa(binary);
    }

    if (typeof btoa === 'function') {
        return btoa(unescape(encodeURIComponent(value)));
    }

    throw new Error('No base64 encoder available in this environment');
};

const fromBase64 = (value: string): string => {
    const buffer = getBuffer();
    if (buffer) return buffer.from(value, 'base64').toString('utf8');

    if (typeof atob === 'function') {
        const binary = atob(value);
        const decoder = getTextDecoder();

        if (decoder) {
            const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
            return decoder.decode(bytes);
        }

        return decodeURIComponent(
            binary
                .split('')
                .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
                .join('')
        );
    }

    throw new Error('No base64 decoder available in this environment');
};

const toBase64Url = (value: string): string =>
    toBase64(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const fromBase64Url = (value: string): string => {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const paddingLength = (4 - (normalized.length % 4)) % 4;
    return fromBase64(`${normalized}${'='.repeat(paddingLength)}`);
};

/** Encode a captured manifest into the base64url form expected by the App Store submission flow. */
export const encodeManifestForUrl = (manifest: CapturedAppManifest): string =>
    toBase64Url(JSON.stringify(manifest));

/** Decode a base64url manifest payload from the App Store submission URL. */
export const decodeManifestFromUrl = (value: string): CapturedAppManifest =>
    JSON.parse(fromBase64Url(value)) as CapturedAppManifest;

export interface CapturedActionInput {
    action: string;
    payload?: unknown;
    timestamp?: string;
}

/**
 * Creates an empty captured manifest for a given app URL.
 */
export const createEmptyCapturedManifest = (appUrl: string): CapturedAppManifest => {
    const now = new Date().toISOString();
    return {
        manifestVersion: 1,
        appUrl,
        permissions: [],
        templates: [],
        consentRequests: [],
        featuresLaunched: [],
        counterKeys: [],
        usedLearnerContext: false,
        usedNotifications: false,
        firstCapturedAt: now,
        lastUpdatedAt: now,
    };
};

const addUnique = (arr: string[], val: string): string[] => {
    if (arr.includes(val)) return arr;
    return [...arr, val];
};

/**
 * Applies a captured action to a manifest, returning a new manifest object.
 * Does not mutate the original manifest.
 *
 * Note: Future consolidation should refactor mock-host.ts to use this helper.
 */
export const applyCapturedAction = (
    manifest: CapturedAppManifest,
    input: CapturedActionInput
): CapturedAppManifest => {
    const next = JSON.parse(JSON.stringify(manifest)) as CapturedAppManifest;
    const now = input.timestamp || new Date().toISOString();
    next.lastUpdatedAt = now;

    const { action, payload } = input;

    if (action === 'APP_EVENT') {
        const event = payload as Record<string, unknown> | undefined;
        const type = typeof event?.type === 'string' ? event.type : '';

        if (type === 'send-credential') {
            next.permissions = addUnique(next.permissions, 'send_credential');
            if (
                typeof event?.alias === 'string' &&
                event.alias &&
                event.template &&
                typeof event.template === 'object'
            ) {
                const alias = event.alias;
                const template = event.template as InlineCredentialTemplate;
                const canonicalTemplate = canonicalJsonString(template);

                const existingIndex = next.templates.findIndex(t => t.alias === alias);
                if (existingIndex >= 0) {
                    const existing = next.templates[existingIndex];
                    const existingCanonical = canonicalJsonString(existing.template);
                    const version =
                        existingCanonical === canonicalTemplate
                            ? existing.version
                            : existing.version + 1;
                    next.templates[existingIndex] = {
                        alias,
                        template,
                        version,
                        lastUsedAt: now,
                    };
                } else {
                    next.templates.push({
                        alias,
                        template,
                        version: 1,
                        lastUsedAt: now,
                    });
                }
            }
        } else if (type === 'send-notification') {
            next.usedNotifications = true;
        } else if (type === 'increment-counter' || type === 'get-counter') {
            const key = event?.key;
            if (typeof key === 'string' && key) {
                next.counterKeys = addUnique(next.counterKeys, key);
            }
        } else if (type === 'get-counters') {
            if (Array.isArray(event?.keys)) {
                for (const key of event.keys) {
                    if (typeof key === 'string' && key) {
                        next.counterKeys = addUnique(next.counterKeys, key);
                    }
                }
            }
        }
        return next;
    }

    switch (action) {
        case 'REQUEST_IDENTITY':
            next.permissions = addUnique(next.permissions, 'request_identity');
            break;
        case 'SEND_CREDENTIAL':
            next.permissions = addUnique(next.permissions, 'send_credential');
            break;
        case 'REQUEST_CONSENT': {
            next.permissions = addUnique(next.permissions, 'request_consent');
            const scopes = (payload as { scopes?: unknown } | undefined)?.scopes;
            if (scopes && typeof scopes === 'object' && !Array.isArray(scopes)) {
                try {
                    const normalized = normalizeConsentRequest(scopes as ConsentRequest);
                    const key = canonicalConsentScopeString(normalized);
                    const existing = next.consentRequests.find(
                        record => canonicalConsentScopeString(record.scopes) === key
                    );
                    if (existing) {
                        existing.lastUsedAt = now;
                        if (
                            !existing.reason &&
                            typeof (scopes as ConsentRequest).reason === 'string' &&
                            (scopes as ConsentRequest).reason
                        ) {
                            existing.reason = (scopes as ConsentRequest).reason;
                        }
                    } else {
                        next.consentRequests.push({
                            scopes: normalized,
                            ...(typeof (scopes as ConsentRequest).reason === 'string' &&
                            (scopes as ConsentRequest).reason
                                ? { reason: (scopes as ConsentRequest).reason }
                                : {}),
                            lastUsedAt: now,
                        });
                    }
                } catch {
                    // Skip invalid consent scopes
                }
            }
            break;
        }
        case 'LAUNCH_FEATURE': {
            next.permissions = addUnique(next.permissions, 'launch_feature');
            const featurePath = (payload as { featurePath?: unknown } | undefined)?.featurePath;
            if (typeof featurePath === 'string' && featurePath) {
                next.featuresLaunched = addUnique(next.featuresLaunched, featurePath);
            }
            break;
        }
        case 'ASK_CREDENTIAL_SEARCH':
            next.permissions = addUnique(next.permissions, 'credential_search');
            break;
        case 'ASK_CREDENTIAL_SPECIFIC':
            next.permissions = addUnique(next.permissions, 'credential_by_id');
            break;
        case 'INITIATE_TEMPLATE_ISSUE':
            next.permissions = addUnique(next.permissions, 'template_issuance');
            break;
        case 'REQUEST_LEARNER_CONTEXT':
            next.usedLearnerContext = true;
            break;
    }

    return next;
};
