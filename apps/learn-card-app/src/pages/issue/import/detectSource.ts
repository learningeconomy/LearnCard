/**
 * Classifies an arbitrary user-pasted string (or dropped file text) into an
 * import source kind, so the UI can show a live recognition chip and route to
 * the right adapter. Pure and synchronous: safe to call per keystroke.
 */

export type ImportSourceKind =
    | 'empty'
    | 'json'
    | 'ctid'
    | 'credentialEngineUrl'
    | 'caseFramework'
    | 'url'
    | 'unknown';

export interface DetectedSource {
    kind: ImportSourceKind;
    confidence: number;
    label: string;
    extracted: string;
}

/** Credential Engine CTID: `ce-` followed by a canonical UUID. */
export const CTID_PATTERN = /^ce-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Same CTID shape, matched anywhere within a longer string (e.g. a URL path). */
const CTID_ANYWHERE = /ce-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const CREDENTIAL_ENGINE_HOSTS = [
    'credentialfinder.org',
    'credentialengineregistry.org',
    'credentialengine.org',
    'sandbox.credentialengineregistry.org',
];

const CASE_HINTS = ['/ims/case/', 'opensalt', '/cfdocuments/', '/cfitems/'];

const isParseableJson = (text: string): boolean => {
    try {
        JSON.parse(text);
        return true;
    } catch {
        return false;
    }
};

const safeUrl = (text: string): URL | null => {
    try {
        return new URL(text);
    } catch {
        return null;
    }
};

export const detectSource = (raw: string): DetectedSource => {
    const text = (raw ?? '').trim();

    if (!text) return { kind: 'empty', confidence: 1, label: '', extracted: '' };

    if (CTID_PATTERN.test(text)) {
        return {
            kind: 'ctid',
            confidence: 1,
            label: 'Credential Engine ID',
            extracted: text.toLowerCase(),
        };
    }

    if (text.startsWith('{') || text.startsWith('[')) {
        return {
            kind: 'json',
            confidence: isParseableJson(text) ? 1 : 0.4,
            label: 'Credential data',
            extracted: text,
        };
    }

    const url = safeUrl(text);
    if (url && (url.protocol === 'http:' || url.protocol === 'https:')) {
        const host = url.hostname.toLowerCase();
        const lower = text.toLowerCase();
        const ctidMatch = text.match(CTID_ANYWHERE);
        const isCeHost = CREDENTIAL_ENGINE_HOSTS.some(h => host === h || host.endsWith(`.${h}`));

        if (isCeHost && ctidMatch) {
            return {
                kind: 'credentialEngineUrl',
                confidence: 1,
                label: 'Credential Engine link',
                extracted: ctidMatch[0].toLowerCase(),
            };
        }

        if (CASE_HINTS.some(h => lower.includes(h))) {
            return {
                kind: 'caseFramework',
                confidence: 0.9,
                label: 'Competency framework',
                extracted: text,
            };
        }

        if (ctidMatch) {
            return {
                kind: 'credentialEngineUrl',
                confidence: 0.7,
                label: 'Credential Engine link',
                extracted: ctidMatch[0].toLowerCase(),
            };
        }

        return { kind: 'url', confidence: 0.6, label: 'Hosted credential', extracted: text };
    }

    return { kind: 'unknown', confidence: 0, label: '', extracted: text };
};
