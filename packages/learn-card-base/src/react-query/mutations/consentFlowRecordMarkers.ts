/**
 * Ownership markers for wallet index records the consent-flow sync writes before the
 * credential is accepted. Each marker maps (profile DID, credential URI) to the record id the
 * sync generated, and is written BEFORE the index write. That way, if acceptance is later
 * refused because the issuer revoked or suspended the credential, the sync can roll back
 * exactly that record even when the write's response was lost or the app reloaded in between.
 *
 * Persisted in localStorage (falling back to memory if storage is unavailable). Entries are
 * cleared once the credential is accepted or rolled back, so this only ever holds credentials
 * that are stored-but-not-yet-accepted.
 */

const STORAGE_KEY = 'lc:consent-flow-sync:unaccepted-records';

type Markers = Record<string, string>;

let memoryFallback: Markers = {};

const getStorage = (): Storage | undefined => {
    try {
        return typeof window !== 'undefined' ? window.localStorage : undefined;
    } catch {
        return undefined;
    }
};

const readMarkers = (): Markers => {
    const storage = getStorage();
    if (!storage) return memoryFallback;

    try {
        const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}');
        return parsed && typeof parsed === 'object' ? (parsed as Markers) : {};
    } catch {
        return {};
    }
};

const writeMarkers = (markers: Markers) => {
    const storage = getStorage();
    if (!storage) {
        memoryFallback = markers;
        return;
    }

    try {
        if (Object.keys(markers).length === 0) storage.removeItem(STORAGE_KEY);
        else storage.setItem(STORAGE_KEY, JSON.stringify(markers));
    } catch {
        memoryFallback = markers;
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
