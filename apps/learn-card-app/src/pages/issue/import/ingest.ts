import { getLogger } from 'learn-card-base';

import { detectSource, type DetectedSource } from './detectSource';
import {
    normalizeToObv3,
    unwrapCtdlGraph,
    ctdlOwnerRef,
    readOrgProfile,
    type NormalizedImport,
    type ProvenanceSource,
    type CtdlCreator,
} from './normalizeToObv3';

const log = getLogger('issue-import');

const CE_REGISTRY_GRAPH = (ctid: string): string =>
    `https://credentialengineregistry.org/graph/${encodeURIComponent(ctid)}`;

const FETCH_TIMEOUT_MS = 12000;
const MAX_BYTES = 2_000_000;

export class ImportError extends Error {
    constructor(message: string, readonly canPasteInstead = false) {
        super(message);
        this.name = 'ImportError';
    }
}

const fetchJson = async (url: string): Promise<unknown> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json, application/ld+json' },
            signal: controller.signal,
        });

        if (!res.ok) {
            throw new ImportError(
                res.status === 404
                    ? "We couldn't find anything at that link or ID."
                    : 'That source could not be reached.',
                true
            );
        }

        const text = await res.text();
        if (text.length > MAX_BYTES) {
            throw new ImportError('That source is too large to import.');
        }

        try {
            return JSON.parse(text);
        } catch {
            throw new ImportError("That link didn't return credential data.", true);
        }
    } catch (e) {
        if (e instanceof ImportError) throw e;
        // AbortError, CORS/network failures land here; offer the paste fallback.
        log.warn('issue-import.fetch_failed', e, { url });
        throw new ImportError(
            "We couldn't fetch that automatically. Paste the credential's data instead.",
            true
        );
    } finally {
        clearTimeout(timer);
    }
};

const resolveOrgCreator = async (resource: unknown): Promise<CtdlCreator | undefined> => {
    const ref = ctdlOwnerRef(resource);
    if (!ref) return undefined;
    try {
        const org = unwrapCtdlGraph(await fetchJson(ref), undefined);
        return readOrgProfile(org);
    } catch (e) {
        log.warn('issue-import.org_resolve_skipped', e, { ref });
        return undefined;
    }
};

const parseJsonText = (text: string): unknown => {
    try {
        return JSON.parse(text.trim());
    } catch {
        throw new ImportError("That doesn't look like valid credential data.");
    }
};

/**
 * Resolve a detected source into normalized OBv3 JSON. Remote sources fetch
 * client-side; on CORS/network failure they surface `canPasteInstead` so the UI
 * can fall back to manual paste (a server proxy can replace this later).
 */
export const ingest = async (detected: DetectedSource): Promise<NormalizedImport> => {
    const provenanceFor = (
        source: ProvenanceSource
    ): {
        source: ProvenanceSource;
        label: string;
    } => ({ source, label: detected.label });

    switch (detected.kind) {
        case 'json': {
            const parsed = parseJsonText(detected.extracted);
            return normalizeToObv3(parsed, provenanceFor('paste'));
        }

        case 'ctid':
        case 'credentialEngineUrl': {
            const ctid = detected.extracted;
            const parsed = await fetchJson(CE_REGISTRY_GRAPH(ctid));
            const resource = unwrapCtdlGraph(parsed, ctid);
            const creator = await resolveOrgCreator(resource);
            return normalizeToObv3(resource, {
                source: 'credential-engine',
                label: 'Credential Engine',
                ctid,
                sourceUrl: `https://credentialfinder.org/credential/${ctid}`,
                creator,
            });
        }

        case 'url': {
            const parsed = await fetchJson(detected.extracted);
            return normalizeToObv3(parsed, {
                source: 'url',
                label: 'Imported credential',
                sourceUrl: detected.extracted,
            });
        }

        case 'caseFramework':
            throw new ImportError(
                'Competency framework import is coming soon. For now, add skills directly.'
            );

        default:
            throw new ImportError(
                "We couldn't recognize that. Paste a link, a Credential Engine ID, or credential data."
            );
    }
};

export const ingestText = (text: string): Promise<NormalizedImport> => ingest(detectSource(text));

export const ingestFile = async (file: File): Promise<NormalizedImport> => {
    if (file.size > MAX_BYTES) throw new ImportError('That file is too large to import.');
    const text = await file.text();
    const parsed = parseJsonText(text);
    return normalizeToObv3(parsed, { source: 'file', label: file.name });
};
