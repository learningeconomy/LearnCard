import { createStore } from '@udecode/zustood';
import { VC } from '@learncard/types';

import { LCR } from 'learn-card-base/types/credential-records';

/**
 * Prefix for all sample-wallet (demo mode) credential URIs.
 * Demo URIs can never collide with real `lc:cloud:` / `lc:network:` URIs.
 */
export const DEMO_URI_PREFIX = 'lc:demo:';

export type DemoBoostEntry = {
    boost: Record<string, unknown>;
    childUris: string[];
};

export type DemoSessionPayload = {
    personaId: string;
    personaName: string;
    records: LCR[];
    vcs: Record<string, VC>;
    boosts?: Record<string, DemoBoostEntry>;
};

/**
 * Local-only "Sample Wallet" session state.
 *
 * While a persona is active, wallet-facing credential queries read from this
 * store instead of LearnCloud. Nothing is ever written to LearnCloud, the
 * network, or any backend — exiting demo mode simply clears this store.
 */
export const demoSessionStore = createStore('demoSessionStore')<{
    activePersonaId: string | null;
    personaName: string | null;
    demoRecords: LCR[];
    demoVCs: Record<string, VC>;
    demoBoosts: Record<string, DemoBoostEntry>;
    enteredAt: string | null;
}>(
    {
        activePersonaId: null,
        personaName: null,
        demoRecords: [],
        demoVCs: {},
        demoBoosts: {},
        enteredAt: null,
    },
    { persist: { name: 'demoSessionStore', enabled: true } }
).extendActions(set => ({
    enterDemo: ({ personaId, personaName, records, vcs, boosts }: DemoSessionPayload) => {
        set.state(state => {
            state.activePersonaId = personaId;
            state.personaName = personaName;
            state.demoRecords = records;
            state.demoVCs = vcs;
            state.demoBoosts = boosts ?? {};
            state.enteredAt = new Date().toISOString();
        });
    },

    exitDemo: () => {
        set.state(state => {
            state.activePersonaId = null;
            state.personaName = null;
            state.demoRecords = [];
            state.demoVCs = {};
            state.demoBoosts = {};
            state.enteredAt = null;
        });
    },
}));

/** Non-reactive check — safe inside queryFns and helpers. */
export const isDemoSessionActive = (): boolean => Boolean(demoSessionStore.get.activePersonaId());

/** Resolve a demo VC by uri (non-reactive). Returns undefined for non-demo uris. */
export const getDemoVC = (uri?: string): VC | undefined => {
    if (!uri || !uri.startsWith(DEMO_URI_PREFIX)) return undefined;

    return demoSessionStore.get.demoVCs()[uri];
};

/** All demo records, optionally filtered by category, sorted newest first (non-reactive). */
export const getDemoRecordsForCategory = (category?: string): LCR[] => {
    const records = demoSessionStore.get.demoRecords();
    const filtered = category ? records.filter(record => record.category === category) : records;

    return [...filtered].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
};

/** All demo VCs matching a category, sorted newest first (non-reactive). */
export const getDemoVCsForCategory = (category?: string): VC[] => {
    const vcs = demoSessionStore.get.demoVCs();

    return getDemoRecordsForCategory(category)
        .map(record => vcs[record.uri])
        .filter(Boolean) as VC[];
};

/** Resolve a demo boost by uri (non-reactive). Returns undefined for non-demo uris. */
export const getDemoBoost = (uri?: string): Record<string, unknown> | undefined => {
    if (!uri || !uri.startsWith(DEMO_URI_PREFIX)) return undefined;

    return demoSessionStore.get.demoBoosts()[uri]?.boost;
};

/** Child boosts of a demo boost uri (non-reactive). */
export const getDemoBoostChildren = (uri: string): Record<string, unknown>[] => {
    const boosts = demoSessionStore.get.demoBoosts();

    return (boosts[uri]?.childUris ?? [])
        .map(childUri => boosts[childUri]?.boost)
        .filter(Boolean) as Record<string, unknown>[];
};

export default demoSessionStore;
