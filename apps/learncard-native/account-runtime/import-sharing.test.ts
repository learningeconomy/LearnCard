import { expect, test } from 'bun:test';
import type { PaginatedConsentFlowTerms } from '@learncard/types';
import type { ConsumerWallet } from './consumer-apps';
import { createImportSharing } from './import-sharing';

const category = 'Accomplishment';
const source = {
    id: 'import-1',
    uri: 'private-original',
    uploadType: 'rawVC',
    nativeImportSharing: 'pending',
    category,
};
const vc = { name: 'Imported original', proof: { proofValue: 'original-signed-data' } };
const contract = (name: string, version = 2) => ({
    uri: 'contract:' + name,
    owner: { did: 'did:key:' + name },
    recipients: [{ did: 'did:key:collaborator' }, { did: 'did:key:' + name }],
    version,
    status: 'active',
    audienceVersion: 3,
    contract: { read: { credentials: { categories: { [category]: {} } } } },
});
const grant = (name: string, permission = { sharing: true, shareAll: true }) => ({
    uri: 'terms:' + name,
    status: 'live',
    consentedVersion: 2,
    contract: contract(name),
    terms: {
        read: {
            credentials: { categories: { [category]: { ...permission, shared: [] as string[] } } },
        },
    },
});

function fixture() {
    const records: Record<string, unknown>[] = [
        { ...source },
        { ...source, id: 'document', uploadType: 'resume', uri: 'private-resume' },
        { ...source, id: 'previous-import', nativeImportSharing: 'complete' },
    ];
    const grants: ReturnType<typeof grant>[] = [grant('first')];
    const uploads: { original: unknown; recipients: string[] }[] = [];
    const deliveries: unknown[][] = [];
    let active = true;
    let loseReply = false;
    let stopOnRead = false;
    const wallet = {
        read: {
            get: async () => {
                if (stopOnRead) active = false;
                return vc;
            },
        },
        store: {
            LearnCloud: {
                uploadEncrypted: async (
                    original: unknown,
                    { recipients }: { recipients: string[] }
                ) => {
                    uploads.push({ original, recipients });
                    return 'copy-' + uploads.length;
                },
            },
        },
        index: {
            LearnCloud: {
                getPage: async (filter: Record<string, unknown>) => ({
                    hasMore: false,
                    records: records
                        .filter(record =>
                            Object.entries(filter).every(([key, value]) => record[key] === value)
                        )
                        .map(record => structuredClone(record)),
                }),
                get: async ({ id }: { id: string }) =>
                    records
                        .filter(record => record.id === id)
                        .map(record => structuredClone(record)),
                update: async (id: string, patch: Record<string, unknown>) => {
                    Object.assign(
                        records.find(record => record.id === id)!,
                        patch
                    );
                    return true;
                },
            },
        },
        invoke: {
            getConsentedContracts: async () => ({
                records: structuredClone(grants) as unknown as PaginatedConsentFlowTerms['records'],
                hasMore: false,
            }),
            getContract: async (uri: string) =>
                grants.find(value => value.contract.uri === uri)!.contract,
            syncCredentialsToContract: async (
                uri: string,
                categories: Record<string, string[]>,
                version: number,
                automatic: boolean
            ) => {
                deliveries.push([uri, categories, version, automatic]);
                grants
                    .find(value => value.uri === uri)!
                    .terms.read.credentials.categories[category].shared.push(
                        ...categories[category]
                    );
                if (loseReply) {
                    loseReply = false;
                    throw new Error('response interrupted');
                }
                return true;
            },
        },
    } as unknown as ConsumerWallet;
    const worker = () => createImportSharing(() => (active ? wallet : undefined));
    return {
        worker,
        grants,
        records,
        uploads,
        deliveries,
        loseReply: () => {
            loseReply = true;
        },
        stopOnRead: () => {
            stopOnRead = true;
        },
    };
}

test('only pending raw imports reach current category-wide grants and their full audience', async () => {
    const f = fixture();
    const stale = { ...grant('revised'), consentedVersion: 1 };
    const retired = grant('retired');
    retired.contract.status = 'retired';
    f.grants.push(
        grant('selection', { sharing: true, shareAll: false }),
        grant('off', { sharing: false, shareAll: true }),
        { ...grant('withdrawn'), status: 'withdrawn' },
        stale,
        retired
    );
    await f.worker()();
    expect(f.deliveries).toEqual([['terms:first', { [category]: ['copy-1'] }, 3, true]]);
    expect(f.uploads).toEqual([
        { original: vc, recipients: ['did:key:collaborator', 'did:key:first'] },
    ]);
    expect(f.records[0].nativeImportSharing).toBe('complete');
    expect(f.records[1].uri).toBe('private-resume');
});

test('a lost delivery reply is reconciled after host restart without a new upload or transaction', async () => {
    const f = fixture();
    f.loseReply();
    await f.worker()();
    expect(f.records[0].nativeImportSharing).toBe('pending');
    await f.worker()();
    expect(f.deliveries).toHaveLength(1);
    expect(f.uploads).toHaveLength(1);
    expect(f.records[0].nativeImportSharing).toBe('complete');
});

test('changing accounts during a source read leaves the import retryable without publishing', async () => {
    const f = fixture();
    f.stopOnRead();
    await f.worker()();
    expect(f.records[0].nativeImportSharing).toBe('pending');
    expect(f.uploads).toHaveLength(0);
    expect(f.deliveries).toHaveLength(0);
});
