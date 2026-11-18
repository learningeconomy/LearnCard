/** Shared fixtures for HCP v1 service unit tests (memory store, fixed clock). */
import { createMemoryHcpV1Store } from '../store/memory';
import type { HcpV1Store } from '../store/port';
import {
    CreateEntryInputSchema,
    CreateGrantInputSchema,
    GENERAL_CONTEXT_PROFILE,
    HCP_ENTRY_SCHEMA,
    type Category,
    type CreateEntryInput,
    type CreateGrantInput,
    type DirectGrantInput,
} from '../schemas';
import type { HcpContract, HcpV1Caller, HcpV1Deps } from './deps';
import { createGrant } from './grants';
import { createStoreActivitySink, grantWritePolicy, type WritePolicy } from './seams';

export const SUBJECT_DID = 'did:key:z6MkSubjectA';
export const CLIENT_DID = 'did:key:z6MkClientAgent';
export const OTHER_CLIENT_DID = 'did:key:z6MkOtherAgent';
export const PURPOSE = 'https://purpose.example/assist';
export const OTHER_PURPOSE = 'https://purpose.example/advertise';

export const subject: HcpV1Caller = { did: SUBJECT_DID, subjectDid: SUBJECT_DID };
export const client: HcpV1Caller = { did: CLIENT_DID, subjectDid: null };
export const otherClient: HcpV1Caller = { did: OTHER_CLIENT_DID, subjectDid: null };

export type Harness = {
    deps: HcpV1Deps;
    /** Contracts the memory `deps.contracts` serves, by URI (LC-2421). */
    contracts: Map<string, HcpContract>;
    store: HcpV1Store;
    advance: (ms: number) => void;
    snapshot: () => Promise<unknown>;
};

export const makeHarness = (overrides: { writePolicy?: WritePolicy } = {}): Harness => {
    let now = new Date('2026-11-16T20:00:00.000Z');
    let counter = 0;
    const store = createMemoryHcpV1Store();
    const contracts = new Map<string, HcpContract>();
    const deps: HcpV1Deps = {
        store,
        contracts: { current: async uri => contracts.get(uri) ?? null },
        activity: createStoreActivitySink(store),
        writePolicy: overrides.writePolicy ?? grantWritePolicy,
        providerId: 'did:web:brain.test',
        now: () => now,
        newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
    };

    return {
        deps,
        contracts,
        store,
        advance: ms => {
            now = new Date(now.getTime() + ms);
        },
        // Everything a request could change, for "a denied request changes nothing".
        snapshot: async () => ({
            entries: await store.listEntries(SUBJECT_DID, { limit: 1000 }),
            versions: await store.listVersions(SUBJECT_DID),
            grants: await Promise.all(
                (['active', 'revoked', 'expired'] as const).map(s =>
                    store.listGrants(SUBJECT_DID, s)
                )
            ),
            events: await store.listEvents(SUBJECT_DID, {}, { limit: 1000 }),
        }),
    };
};

export const entryInput = (
    overrides: Partial<CreateEntryInput> & { value?: string; categories?: Category[] } = {}
): CreateEntryInput => {
    const { value, categories, ...rest } = overrides;
    return CreateEntryInputSchema.parse({
        schema: HCP_ENTRY_SCHEMA,
        subject: { id: SUBJECT_DID },
        content: { profile: GENERAL_CONTEXT_PROFILE, value: value ?? 'Prefers concise answers' },
        classification: { categories: categories ?? ['general_preferences'] },
        assertion: { declarationType: 'person-declared' },
        record: { provenance: { source: 'person-input' } },
        ...rest,
    });
};

export const grantInput = (
    overrides: Partial<Record<keyof DirectGrantInput, unknown>> & {
        actions?: ('read' | 'write')[];
        categories?: Category[];
        purposes?: string[];
        clientDid?: string;
    } = {}
): CreateGrantInput => {
    const { actions, categories, purposes, clientDid, ...rest } = overrides;
    return CreateGrantInputSchema.parse({
        client: { id: clientDid ?? CLIENT_DID, name: 'Study Buddy Agent' },
        access: [
            {
                actions: actions ?? ['read'],
                categories: categories ?? ['general_preferences'],
                purposes: (purposes ?? [PURPOSE]).map(code => ({ code, description: 'Help me' })),
            },
        ],
        ...rest,
    });
};

/** Issues a grant as the subject and returns its id. */
export const issueGrant = async (
    deps: HcpV1Deps,
    overrides: Parameters<typeof grantInput>[0] = {}
): Promise<string> => (await createGrant(deps, subject, grantInput(overrides))).grantId;
