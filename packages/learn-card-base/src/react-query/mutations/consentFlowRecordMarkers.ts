/**
 * Ownership markers for wallet index records the consent-flow sync writes before the
 * credential is accepted. Each marker maps (profile DID, credential URI) to the record id the
 * sync generated, and is written BEFORE the index write. That way, if acceptance is later
 * refused because the issuer revoked or suspended the credential, the sync can roll back
 * exactly that record even when the write's response was lost or the app reloaded in between.
 *
 * Persisted in localStorage, with memory as the session's source of truth (see below). Entries
 * are cleared once the credential is accepted or rolled back, so this only ever holds
 * credentials that are stored-but-not-yet-accepted.
 */

const STORAGE_KEY = 'lc:consent-flow-sync:unaccepted-records';

type Markers = Record<string, string>;

/**
 * The in-memory map is the only thing reads ever look at. It's loaded from localStorage once
 * (on first use, i.e. after an app launch), and every change is written through to storage.
 * If storage rejects a write (quota, private mode) or stops being readable, the session keeps
 * working from memory and the next successful write persists the full map again, so the two
 * can't drift apart and a failed clear can't resurrect a persisted marker.
 */
let sessionMarkers: Markers | undefined;

const getStorage = (): Storage | undefined => {
    try {
        return typeof window !== 'undefined' ? window.localStorage : undefined;
    } catch {
        return undefined;
    }
};

const loadPersistedMarkers = (): Markers => {
    try {
        const parsed: unknown = JSON.parse(getStorage()?.getItem(STORAGE_KEY) ?? '{}');
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Markers)
            : {};
    } catch {
        return {};
    }
};

const readMarkers = (): Markers => {
    sessionMarkers ??= loadPersistedMarkers();
    return sessionMarkers;
};

const writeMarkers = (next: Markers) => {
    sessionMarkers = next;

    try {
        const storage = getStorage();
        if (Object.keys(next).length === 0) storage?.removeItem(STORAGE_KEY);
        else storage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Memory stays authoritative for this session; the next successful write catches
        // storage up with the full map.
    }
};

const markerKey = (profileDid: string, uri: string) => `${profileDid}::${uri}`;

export const getConsentFlowRecordMarker = (profileDid: string, uri: string): string | undefined =>
    readMarkers()[markerKey(profileDid, uri)];

export const setConsentFlowRecordMarker = (profileDid: string, uri: string, recordId: string) => {
    writeMarkers({ ...readMarkers(), [markerKey(profileDid, uri)]: recordId });
};

export const clearConsentFlowRecordMarker = (profileDid: string, uri: string) => {
    const markers = readMarkers();
    const key = markerKey(profileDid, uri);
    if (!(key in markers)) return;

    const rest = { ...markers };
    delete rest[key];
    writeMarkers(rest);
};
