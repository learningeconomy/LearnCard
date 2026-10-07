import type { JWE, VC, UnsignedVC } from '@learncard/types';
import type { CredentialRequestEvent } from '@learncard/chapi-plugin';
import { walletStore, switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { isSharePrivateSession } from '../../src/components/share-links/sharePrivacy';
import {
    HISTORY_SCOPE,
    type HistoryWallet,
    type VerifierReceipt,
} from '../../src/helpers/verifier-history/history';

// Loaded by Playwright through Vite. No application entry point imports this fixture.
type Document = { _id: string; scope: string; payload: JWE };
type Entry = { id: string; uri: string; title: string; category: string };
// Spell out the runtime plugin APIs: the app's BespokeLearnCard alias omits id/LearnCloud.
type FixtureWallet = HistoryWallet & {
    id: { did(method?: string): string };
    invoke: HistoryWallet['invoke'] & {
        issueCredential(credential: UnsignedVC): Promise<VC>;
        listShareLinks(): Promise<{ records: unknown[]; hasMore: boolean }>;
        getReceivedPresentations(): Promise<unknown[]>;
        receiveChapiEvent(): Promise<
            Pick<CredentialRequestEvent, 'credentialRequestOptions' | 'respondWith'>
        >;
    };
    index: {
        LearnCloud: {
            get(): Promise<Entry[]>;
            getPage(): Promise<{ records: Entry[]; hasMore: boolean }>;
        };
    };
    read: { get(uri: string): Promise<VC> };
};
const documents: Document[] = [];
const calls: string[] = [];
let sequence = 0;
let reads = 0;
let handoffs = 0;
let wallet: FixtureWallet;

export const ready = (): boolean => Boolean(walletStore.get.wallet());

export const install = async (): Promise<void> => {
    if (!import.meta.env.DEV || window.location.hostname !== 'localhost')
        throw new Error('This fixture requires the isolated localhost QA server.');
    const current = walletStore.get.wallet();
    if (!current) throw new Error('The synthetic account must sign in first.');
    wallet = current as unknown as FixtureWallet;
    const holder = wallet.id.did('key');
    const credential: VC = await wallet.invoke.issueCredential({
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://www.w3.org/2018/credentials/examples/v1',
        ],
        id: 'urn:uuid:7a8d82db-4e3b-4311-9d92-1ee2cc293d5e',
        type: ['VerifiableCredential', 'UniversityDegreeCredential'],
        issuer: holder,
        issuanceDate: new Date().toISOString(),
        name: 'QA University Diploma',
        credentialSubject: {
            id: holder,
            degree: { type: 'BachelorDegree', name: 'Bachelor of Science' },
        },
    });
    wallet.invoke.listShareLinks = async () => ({ records: [], hasMore: false });
    wallet.invoke.getReceivedPresentations = async () => [];
    const entry = {
        id: credential.id!,
        uri: 'qa:synthetic-diploma',
        title: 'QA University Diploma',
        category: 'Achievement',
    };
    wallet.index.LearnCloud.get = async () => [entry];
    wallet.index.LearnCloud.getPage = async () => ({ records: [entry], hasMore: false });
    wallet.read.get = async () => credential;
    const storage: HistoryWallet['invoke'] = {
        createDagJwe: wallet.invoke.createDagJwe,
        decryptDagJwe: wallet.invoke.decryptDagJwe,
        learnCloudCreate: async document => {
            calls.push('create');
            documents.push({
                _id: (++sequence).toString(16).padStart(24, '0'),
                scope: document.scope as string,
                payload: document.payload as JWE,
            });
            return true;
        },
        learnCloudReadPage: async (_query, pagination) => {
            calls.push('read');
            reads++;
            const start = Number(pagination.cursor ?? 0);
            const end = start + pagination.limit;
            return {
                records: documents.slice(start, end),
                hasMore: end < documents.length,
                ...(end < documents.length ? { cursor: String(end) } : {}),
            };
        },
        learnCloudDelete: async query => {
            calls.push('delete');
            const index = documents.findIndex(doc => doc._id === query._id);
            if (index < 0) return 0;
            documents.splice(index, 1);
            return 1;
        },
    };
    wallet.invoke.learnCloudCreate = storage.learnCloudCreate;
    wallet.invoke.learnCloudReadPage = storage.learnCloudReadPage;
    wallet.invoke.learnCloudDelete = storage.learnCloudDelete;
    wallet.invoke.receiveChapiEvent = async () => ({
        credentialRequestOptions: {
            web: {
                VerifiablePresentation: {
                    challenge: 'qa-chapi-challenge',
                    domain: 'https://chapi.qa.invalid',
                    query: [
                        {
                            type: 'QueryByExample',
                            credentialQuery: [
                                {
                                    reason: 'QA eligibility check',
                                    example: { type: 'UniversityDegreeCredential' },
                                },
                            ],
                        },
                    ],
                },
            },
        },
        respondWith: result => {
            calls.push('transport');
            handoffs++;
            void Promise.resolve(result).catch(() => undefined);
        },
    });
};

export const navigate = (path: string): void => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
};
export const markTransport = (): void => {
    calls.push('transport');
};
export const resetCalls = (): void => {
    calls.splice(0);
};
export const managed = (value: boolean): void =>
    switchedProfileStore.set.profileType(value ? 'service' : null);

export const status = async () => {
    const payloads = await Promise.all(
        documents.map(doc => wallet.invoke.decryptDagJwe<Record<string, unknown>>(doc.payload))
    );
    return {
        calls: [...calls],
        reads,
        handoffs,
        receipts: payloads.filter(p => p.kind === 'receipt') as VerifierReceipt[],
        enabled: payloads.filter(p => p.kind === 'settings').at(-1)?.enabled,
        privateSession: isSharePrivateSession(),
        plaintextLeak: JSON.stringify(documents).includes('QA University Diploma'),
    };
};

/** Small fixture for paging; the 90-day/500-entry boundary is covered by unit tests. */
export const addReminders = async (): Promise<void> => {
    const settings = await Promise.all(
        documents.map(doc => wallet.invoke.decryptDagJwe<Record<string, unknown>>(doc.payload))
    );
    const generation = settings.filter(p => p.kind === 'settings').at(-1)?.generation;
    if (!generation) throw new Error('Enable recording before adding paging fixtures.');
    for (let index = 0; index < 22; index++) {
        const payload = await wallet.invoke.createDagJwe({
            kind: 'receipt',
            version: 1,
            eventId: crypto.randomUUID(),
            generation,
            protocol: 'oid4vp',
            outcome: 'sent',
            sentAt: new Date(Date.now() - index * 1000).toISOString(),
            label: 'Pagination QA verifier',
            titles:
                index < 2
                    ? ['QA University Diploma', 'QA First Aid Certificate', 'QA Volunteer Badge']
                    : ['QA University Diploma'],
        });
        await wallet.invoke.learnCloudCreate({ scope: HISTORY_SCOPE, payload });
    }
};
