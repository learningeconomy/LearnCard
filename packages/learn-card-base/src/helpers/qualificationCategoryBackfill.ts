import type { QueryClient } from '@tanstack/react-query';
import type { VC } from '@learncard/types';
import type { LCR } from 'learn-card-base/types/credential-records';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import {
    getAchievementType,
    getCredentialSubjectAchievement,
    getDefaultCategoryForCredential,
    isBoostCredential,
    unwrapBoostCredential,
} from './credentialHelpers';
import { parseLcTags } from './displayTags.helpers';
import { getLogger } from '../logging/logger';
import { tryFetchResolvedCredential } from '../react-query/queries/credentialResolution';

const log = getLogger('qualification-category-backfill');

const historicQualificationCategories: Record<string, string> = {
    License: 'ID',
    Certification: 'Achievement',
    JourneymanCertificate: 'Work History',
    MasterCertificate: 'Work History',
    ApprenticeshipCertificate: 'Work History',
};
const legacyCategories: Record<string, true> = {
    ID: true,
    Achievement: true,
    'Work History': true,
};
const reconciliations = new Map<string, Promise<void>>();

/**
 * Reconcile once per account/cloud in the background. Persist only complete scans;
 * unavailable records retry on the next app session, never on every wallet access.
 */
export const reconcileQualificationCategories = async (
    wallet: BespokeLearnCard,
    queryClient?: QueryClient,
    cloudUrl = ''
): Promise<void> => {
    const completionKey = `qualification-category-backfill:v1:${cloudUrl}:${wallet.id.did()}`;
    const existing = reconciliations.get(completionKey);
    if (existing) return existing;

    try {
        if (
            typeof window !== 'undefined' &&
            window.localStorage.getItem(completionKey) === 'complete'
        ) {
            return;
        }
    } catch (error) {
        log.debug('Category backfill completion storage unavailable', error);
    }

    const reconciliation = (async () => {
        let cursor: string | undefined;
        let incomplete = false;
        let changed = false;
        type CredentialIndexPage = { records?: LCR[]; hasMore?: boolean; cursor?: string };
        do {
            let page: CredentialIndexPage | undefined;
            try {
                page = (await wallet.index.LearnCloud.getPage?.({}, { cursor, limit: 100 })) as
                    CredentialIndexPage | undefined;
            } catch (error) {
                log.warn('Failed to scan wallet index for legacy qualification categories', error);
                incomplete = true;
                break;
            }
            if (!page) {
                incomplete = true;
                break;
            }
            if (page.hasMore && !page.cursor) incomplete = true;

            const candidates = (page?.records ?? []).filter(
                record =>
                    Boolean(legacyCategories[record.category]) &&
                    record.categorySource !== 'manual' &&
                    !record.boostUri
            );

            // Start every resolve in the same tick when a QueryClient is available so
            // tryFetch can coalesce into storage.batchResolve (and join the wallet
            // warmer) instead of serial standalone storage.resolve — LC-2382 retake3.
            const resolved: (VC | undefined)[] = [];
            const loggedResolveError = new Set<number>();
            if (queryClient) {
                resolved.push(
                    ...(await Promise.all(
                        candidates.map(record =>
                            tryFetchResolvedCredential(queryClient, wallet, record.uri)
                        )
                    ))
                );
            } else {
                for (const record of candidates) {
                    try {
                        resolved.push((await wallet.read.get(record.uri)) as VC | undefined);
                    } catch (error) {
                        log.warn('Unable to resolve credential during category reconciliation', {
                            recordId: record.id,
                            error,
                        });
                        incomplete = true;
                        loggedResolveError.add(resolved.length);
                        resolved.push(undefined);
                    }
                }
            }

            for (let i = 0; i < candidates.length; i++) {
                const record = candidates[i];
                const credential = resolved[i];
                if (!credential) {
                    if (!loggedResolveError.has(i)) {
                        log.warn('Credential unavailable during category reconciliation', {
                            recordId: record.id,
                        });
                    }
                    incomplete = true;
                    continue;
                }

                if (
                    isBoostCredential(credential) ||
                    credential.boostId ||
                    unwrapBoostCredential(credential)?.boostId
                ) {
                    continue;
                }

                const types = credential.type ?? [];
                const historicCategory =
                    historicQualificationCategories[getAchievementType(credential)] ??
                    types.map(type => historicQualificationCategories[type]).find(Boolean);
                if (!historicCategory || record.category !== historicCategory) continue;

                const achievement = getCredentialSubjectAchievement(credential);
                if (parseLcTags(achievement?.tag).category) continue;
                if (getDefaultCategoryForCredential(credential) !== 'Qualifications') continue;

                try {
                    const updated = await wallet.index.LearnCloud.update(record.id, {
                        category: 'Qualifications',
                    });
                    if (updated) changed = true;
                    else incomplete = true;
                } catch (error) {
                    log.warn('Failed to update legacy qualification category', {
                        recordId: record.id,
                        error,
                    });
                    incomplete = true;
                }
            }
            cursor = page?.hasMore ? page.cursor : undefined;
        } while (cursor);

        if (changed && queryClient) {
            void Promise.all([
                queryClient.invalidateQueries({ queryKey: ['useGetCredentialList'] }),
                queryClient.invalidateQueries({ queryKey: ['useGetCredentials'] }),
                queryClient.invalidateQueries({ queryKey: ['useGetCredentialCount'] }),
                queryClient.invalidateQueries({ queryKey: ['useGetRecordForUri'] }),
            ]).catch(error => log.warn('Failed to invalidate credential category caches', error));
        }
        if (!incomplete) {
            try {
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(completionKey, 'complete');
                }
            } catch (error) {
                log.debug('Unable to persist category backfill completion', error);
            }
        }
    })();

    const safeReconciliation = reconciliation.catch(error => {
        log.warn('Wallet category reconciliation stopped unexpectedly', error);
    });
    reconciliations.set(completionKey, safeReconciliation);
    await safeReconciliation;
};
