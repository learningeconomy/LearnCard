import { z } from 'zod';
import { ConsentFlowContractDetailsValidator, VCValidator } from '@learncard/types';
import { ConsumerFailure, type ConsumerWallet } from './consumer-apps';
import { categoryForClaim } from './claims';
import { credentialCategoryForDisplay } from './credential-category';

/** Only the current environment's tenant-configured bundles may be used. */
export const createSampleCredentialCommands = (
    currentWallet: () => ConsumerWallet | undefined,
    bundles: Readonly<Record<string, string>>
) => {
    let busy = false;
    const wallet = () => {
        const lc = currentWallet();
        if (!lc) throw new ConsumerFailure('signIn');
        return lc;
    };
    const check = (lc: ConsumerWallet) => {
        if (currentWallet() !== lc) throw new ConsumerFailure('signIn');
    };
    const allTerms = async (lc: ConsumerWallet) => {
        let page = await lc.invoke.getConsentedContracts({ limit: 50 });
        const records = [...page.records],
            seen = new Set<string>();
        check(lc);
        while (page.hasMore) {
            if (!page.cursor || seen.has(page.cursor) || seen.size >= 100)
                throw new ConsumerFailure('connection');
            seen.add(page.cursor);
            page = await lc.invoke.getConsentedContracts({ limit: 50, cursor: page.cursor });
            check(lc);
            records.push(...page.records);
        }
        return records;
    };
    const live = (terms: Awaited<ReturnType<typeof allTerms>>, uri: string) =>
        terms.filter(
            t =>
                t.contract.uri === uri &&
                t.status === 'live' &&
                (!t.expiresAt || Date.parse(t.expiresAt) > Date.now())
        );
    return {
        samplesStatus: async () => {
            const lc = wallet(),
                terms = await allTerms(lc);
            return Promise.all(
                Object.entries(bundles).map(async ([id, uri]) => {
                    const contract = ConsentFlowContractDetailsValidator.parse(
                        await lc.invoke.getContract(uri)
                    );
                    check(lc);
                    return {
                        id,
                        title: contract.name,
                        expected: contract.autoBoosts?.length ?? 0,
                        connected: live(terms, uri).length > 0,
                    };
                })
            );
        },
        samplesSync: async (raw: unknown) => {
            if (busy) throw new ConsumerFailure('decision');
            busy = true;
            try {
                const { id } = z.object({ id: z.string() }).strict().parse(raw);
                if (!Object.hasOwn(bundles, id)) throw new ConsumerFailure('unavailable');
                const lc = wallet(),
                    uri = bundles[id];
                const contract = ConsentFlowContractDetailsValidator.parse(
                    await lc.invoke.getContract(uri)
                );
                check(lc);
                if (contract.needsGuardianConsent) throw new ConsumerFailure('guardian');
                if (contract.frontDoorBoostUri || !contract.autoBoosts?.length)
                    throw new ConsumerFailure('unsupported');
                if (contract.expiresAt && Date.parse(contract.expiresAt) <= Date.now())
                    throw new ConsumerFailure('inactive');
                const consents = live(await allTerms(lc), uri);
                if (!consents.length) throw new ConsumerFailure('decision');
                const records = new Map<
                    string,
                    Awaited<
                        ReturnType<ConsumerWallet['invoke']['getCredentialsForContract']>
                    >['records'][number]
                >();
                for (const consent of consents) {
                    let cursor: string | undefined;
                    const seen = new Set<string>();
                    for (let p = 0; p < 100; p++) {
                        const page = await lc.invoke.getCredentialsForContract(consent.uri, {
                            limit: 100,
                            cursor,
                            includeReceived: true,
                        });
                        check(lc);
                        for (const record of page.records) {
                            if (record.contractUri !== uri || record.termsUri !== consent.uri)
                                throw new ConsumerFailure('changed');
                            if (contract.autoBoosts.includes(record.boostUri))
                                records.set(record.credentialUri, record);
                        }
                        if (!page.hasMore) break;
                        if (!page.cursor || seen.has(page.cursor) || p === 99)
                            throw new ConsumerFailure('connection');
                        seen.add(page.cursor);
                        cursor = page.cursor;
                    }
                }
                let added = 0,
                    existing = 0,
                    failed = 0;
                const fulfilled = new Set<string>();
                for (const record of records.values()) {
                    try {
                        check(lc);
                        // Consent can be withdrawn while a long bundle is syncing.
                        if (!live(await allTerms(lc), uri).some(t => t.uri === record.termsUri))
                            throw new ConsumerFailure('changed');
                        const indexed = await lc.index.LearnCloud.get({
                            uri: record.credentialUri,
                        });
                        check(lc);
                        if (indexed.length) {
                            existing++;
                            fulfilled.add(record.boostUri);
                            continue;
                        }
                        const original = await lc.read.get(record.credentialUri);
                        VCValidator.parse(original);
                        // Validate shape, but verify the exact original rather than a parsed projection.
                        const vc = original as z.infer<typeof VCValidator>;
                        const verification = await lc.invoke.verifyCredential(vc, {
                            checks: ['proof'],
                        });
                        check(lc);
                        if (verification.errors.length) throw new ConsumerFailure('changed');
                        await lc.invoke.acceptCredential(record.credentialUri, {
                            skipNotification: true,
                        });
                        check(lc);
                        const subject = Array.isArray(vc.credentialSubject)
                            ? vc.credentialSubject[0]
                            : vc.credentialSubject;
                        const achievement = subject?.achievement as { name?: string } | undefined;
                        await lc.index.LearnCloud.add({
                            id: record.credentialUri,
                            uri: record.credentialUri,
                            title: achievement?.name || vc.name || 'Credential',
                            category: (credentialCategoryForDisplay(record.category, vc) ??
                                categoryForClaim(vc)) as never,
                            contractUri: uri,
                            nativeSampleBundle: id,
                        });
                        check(lc);
                        added++;
                        fulfilled.add(record.boostUri);
                    } catch (error) {
                        check(lc);
                        if (error instanceof ConsumerFailure && error.kind === 'changed')
                            throw error;
                        failed++;
                    }
                }
                // Missing/not-yet-issued credentials are partial, never a completed bundle.
                const missing = contract.autoBoosts.filter(boost => !fulfilled.has(boost)).length;
                return { added, existing, failed: Math.max(failed, missing) };
            } finally {
                busy = false;
            }
        },
    };
};
