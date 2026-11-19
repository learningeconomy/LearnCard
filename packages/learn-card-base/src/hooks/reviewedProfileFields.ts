import type { ConsentFlowTerms } from '@learncard/types';
import type { BespokeLearnCard } from '../types/learn-card';
import {
    enqueuePendingContractSyncSafely,
    type CredentialSyncSource,
    type PendingContractSyncJob,
} from '../stores/pendingContractSyncStore';
import {
    createVerifiableDataCredential,
    getVerifiableDataIndexId,
} from './createVerifiableDataCredential';
import { getConsentAudienceCacheKey, getConsentAudienceRecipients } from './useSharedUrisInTerms';
import { getLogger } from '../logging/logger';

const log = getLogger('reviewed-profile-fields');

export interface ReviewedProfileFields {
    terms: ConsentFlowTerms;
    changes: { category: string; label: string; value: string }[];
}

type FieldJob = CredentialSyncSource & {
    acceptedField: NonNullable<
        Extract<PendingContractSyncJob, { kind: 'credential' }>['acceptedField']
    >;
};

/** Prepare encrypted blobs without making a draft discoverable by any contract or sync worker. */
export const prepareReviewedFields = async (
    wallet: BespokeLearnCard,
    audience: string[],
    terms: ConsentFlowTerms,
    changes: ReviewedProfileFields['changes']
): Promise<FieldJob[]> => {
    const jobs: FieldJob[] = [];
    for (const { category, label, value } of changes) {
        const vc = await createVerifiableDataCredential(
            wallet,
            category,
            { [category.split(':').at(-1)!]: value },
            { name: label }
        );
        const uri = await wallet.store.LearnCloud.uploadEncrypted?.(vc);
        const sharedUri = await wallet.store.LearnCloud.uploadEncrypted?.(vc, {
            recipients: getConsentAudienceRecipients(audience),
        });
        if (!uri || !sharedUri) throw new Error('Unable to prepare the reviewed field.');
        jobs.push({
            category,
            record: { id: getVerifiableDataIndexId(category), uri, category },
            acceptedField: {
                issuanceDate: vc.validFrom ?? new Date().toISOString(),
                audienceKey: getConsentAudienceCacheKey(audience),
                sharedUri,
            },
        });
    }
    for (const job of jobs)
        terms.read.credentials.categories[job.category]!.shared = [job.acceptedField.sharedUri];
    return jobs;
};

/** Idempotent on retry. An older pending job must never restore a superseded answer. */
export const indexAcceptedField = async (
    wallet: BespokeLearnCard,
    { record, acceptedField }: FieldJob
) => {
    const [current] = await wallet.index.LearnCloud.get<{ issuanceDate?: string }>({
        id: record.id,
    });
    if (current?.uri === record.uri) return;
    if (current?.issuanceDate && current.issuanceDate > acceptedField.issuanceDate) return;
    const metadata = {
        ...record,
        title: `VerifiableData: ${record.category}`,
        hidden: true,
        issuanceDate: acceptedField.issuanceDate,
        sharedUris: { [acceptedField.audienceKey]: [acceptedField.sharedUri] },
    };
    const indexed = current
        ? await wallet.index.LearnCloud.update(record.id, metadata)
        : await wallet.index.LearnCloud.add(metadata);
    if (!indexed) throw new Error('Unable to index the accepted field.');
};

/** Only called after the network acknowledges the complete consent decision. */
export const commitAcceptedFields = async (wallet: BespokeLearnCard, jobs: FieldJob[]) => {
    for (const job of jobs) {
        const { acceptedField, ...source } = job;
        let needsIndexing = false;
        try {
            await indexAcceptedField(wallet, job);
        } catch (error) {
            needsIndexing = true;
            log.warn('Deferring accepted field indexing to the sync worker', error);
        }
        await enqueuePendingContractSyncSafely({
            ...source,
            ...(needsIndexing && { acceptedField }),
            kind: 'credential',
            profileDid: wallet.id.did(),
        });
    }
};
