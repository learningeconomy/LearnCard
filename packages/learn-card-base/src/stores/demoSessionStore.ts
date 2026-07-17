import { createStore } from '@udecode/zustood';
import { VC } from '@learncard/types';

import { LCR } from 'learn-card-base/types/credential-records';

/**
 * Prefix for all sample-wallet (demo mode) credential URIs.
 * Demo URIs can never collide with real `lc:cloud:` / `lc:network:` URIs.
 */
export const DEMO_URI_PREFIX = 'lc:demo:';

export type DemoSessionPayload = {
    personaId: string;
    personaName: string;
    records: LCR[];
    vcs: Record<string, VC>;
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
    enteredAt: string | null;
}>(
    {
        activePersonaId: null,
        personaName: null,
        demoRecords: [],
        demoVCs: {},
        enteredAt: null,
    },
    { persist: { name: 'demoSessionStore', enabled: true } }
).extendActions(set => ({
    enterDemo: ({ personaId, personaName, records, vcs }: DemoSessionPayload) => {
        set.state(state => {
            state.activePersonaId = personaId;
            state.personaName = personaName;
            state.demoRecords = records;
            state.demoVCs = vcs;
            state.enteredAt = new Date().toISOString();
        });
    },

    exitDemo: () => {
        set.state(state => {
            state.activePersonaId = null;
            state.personaName = null;
            state.demoRecords = [];
            state.demoVCs = {};
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

export default demoSessionStore;
