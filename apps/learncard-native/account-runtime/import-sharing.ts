import { getContractAudienceDids } from '../../../packages/learn-card-base/src/hooks/consentAudience';
import { loadConsentedTerms, materializeCredential, type ConsumerWallet } from './consumer-apps';
import { validateCollectionCursor } from './collection-pagination';

const pendingImport = { uploadType: 'rawVC', nativeImportSharing: 'pending' } as const;
export const importSharingPending = pendingImport.nativeImportSharing;

/** Each new raw credential carries its own pending delivery in the encrypted personal index. */
export const createImportSharing = (currentWallet: () => ConsumerWallet | undefined) => {
    let drain: Promise<void> | undefined;
    let requested = false;

    const process = async (wallet: ConsumerWallet) => {
        const assertCurrent = () => {
            if (currentWallet() !== wallet) throw new Error('Import account changed');
        };
        const index = wallet.index.LearnCloud;
        if (!index.getPage) return;
        const pending = [];
        const visited = new Set<string>();
        let cursor: string | undefined;
        do {
            assertCurrent();
            const page = await index.getPage(pendingImport, { cursor, limit: 50 });
            assertCurrent();
            validateCollectionCursor(page.hasMore, page.cursor, visited);
            pending.push(...page.records);
            cursor = page.hasMore ? page.cursor : undefined;
            if (cursor) visited.add(cursor);
        } while (cursor && visited.size < 100);
        if (!pending.length) return;

        const grants = await loadConsentedTerms(wallet, assertCurrent);
        const activeUntil = (date?: string) => !date?.trim() || Date.parse(date) > Date.now();
        const lookupSource = async (source: { id: string; uri: string; category?: string }) => {
            assertCurrent();
            const current = (await index.get({ id: source.id })).find(
                record =>
                    record.uri === source.uri &&
                    record.category === source.category &&
                    record.uploadType === pendingImport.uploadType &&
                    record.nativeImportSharing === importSharingPending
            );
            assertCurrent();
            return current;
        };

        for (const source of pending) {
            assertCurrent();
            try {
                const record = await lookupSource(source);
                const category = record?.category;
                if (!record || !category) continue;
                let retry = false;
                for (const grant of grants) {
                    const credentials = grant.terms.read.credentials;
                    const permission = credentials.categories[category];
                    if (
                        grant.status !== 'live' ||
                        grant.contract.status === 'retired' ||
                        !activeUntil(grant.expiresAt) ||
                        credentials.sharing === false ||
                        permission?.sharing !== true ||
                        permission.shareAll !== true ||
                        !activeUntil(permission.shareUntil)
                    )
                        continue;
                    try {
                        assertCurrent();
                        const fresh = await wallet.invoke.getContract(grant.contract.uri);
                        assertCurrent();
                        if (
                            fresh.uri !== grant.contract.uri ||
                            fresh.owner.did !== grant.contract.owner.did ||
                            fresh.status === 'retired' ||
                            !activeUntil(fresh.expiresAt) ||
                            grant.consentedVersion < fresh.version ||
                            !fresh.contract.read?.credentials?.categories?.[category]
                        )
                            continue;

                        const recipients = getContractAudienceDids(fresh);
                        // This integration's web flow adds special service recipients.
                        if (recipients.some(did => did.includes('smart-resume'))) continue;
                        const shared = await materializeCredential(
                            wallet,
                            record,
                            recipients,
                            assertCurrent
                        );
                        if (permission.shared?.includes(shared)) continue;
                        if (!(await lookupSource(record))) break;
                        assertCurrent();
                        if (
                            !(await wallet.invoke.syncCredentialsToContract(
                                grant.uri,
                                { [category]: [shared] },
                                fresh.audienceVersion ?? 0,
                                true
                            ))
                        )
                            retry = true;
                        assertCurrent();
                    } catch {
                        assertCurrent();
                        retry = true;
                    }
                }
                if (!retry && (await lookupSource(record))) {
                    await index.update(record.id, { nativeImportSharing: 'complete' });
                }
            } catch {
                // Leave this import pending and give the other imports a turn.
                assertCurrent();
            }
        }
    };

    return () => {
        if (!currentWallet()) return Promise.resolve();
        requested = true;
        drain ??= (async () => {
            try {
                while (requested) {
                    requested = false;
                    const wallet = currentWallet();
                    if (wallet)
                        await process(wallet).catch(() => {
                            // A failed background attempt must leave the saved credential usable.
                        });
                }
            } finally {
                drain = undefined;
            }
        })();
        return drain;
    };
};
