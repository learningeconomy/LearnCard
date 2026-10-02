import { createHash, randomUUID } from 'node:crypto';
import { BindParam, QueryBuilder } from 'neogma';
import { TRPCError } from '@trpc/server';
import type { ConsentFlowTerms } from '@learncard/types';
import { inflateObject } from '@helpers/objects.helpers';
import type { DbTermsType } from 'types/consentflowcontract';
import {
    audienceVersionWhere,
    assertAudienceMutation,
    lockContractAudience,
    runAudienceMutation,
} from './recipients';

const canonicalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === 'object')
        return Object.fromEntries(
            Object.entries(value)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, entry]) => [key, canonicalize(entry)])
        );
    return value;
};

/** Bind retries to the original decision without persisting the recipient token. */
export const smartResumeFingerprint = (submission: unknown): string =>
    createHash('sha256')
        .update(JSON.stringify(canonicalize(submission)))
        .digest('hex');

/**
 * Claim publication only after consent committed, under the same audience lock.
 * A bounded lease prevents concurrent retries; completed retries reuse the redirect.
 * A failed publication retains consent and can retry the identical submission.
 */
export const publishSmartResume = async ({
    contractId,
    profileId,
    termsId,
    fingerprint,
    audienceVersion,
    upload,
}: {
    contractId: string;
    profileId: string;
    termsId: string;
    fingerprint: string;
    audienceVersion?: number;
    upload: (terms: ConsentFlowTerms) => Promise<string | undefined>;
}): Promise<string | undefined> => {
    const leaseId = randomUUID();
    // Token request and credentials POST each time out after 30s. URI resolution
    // must also finish before this lease expires, or publication must be retried.
    const leaseUntil = Date.now() + 120_000;
    const result = await runAudienceMutation(
        lockContractAudience(
            new QueryBuilder(
                new BindParam({
                    profileId,
                    termsId,
                    fingerprint,
                    audienceVersion: audienceVersion ?? null,
                    leaseId,
                    leaseUntil,
                    now: Date.now(),
                })
            ),
            contractId
        )
            .where(audienceVersionWhere)
            .match(
                '(profile:Profile {profileId: $profileId})-[:CREATED_BY]->(terms:ConsentFlowTerms {id: $termsId})-[:CONSENTS_TO]->(contract)'
            )
            .where(
                `terms.smartResumeFingerprint = $fingerprint
                AND terms.smartResumeMutationVersion = coalesce(terms.mutationVersion, 0)
                AND (terms.status = 'live' OR (terms.status = 'stale' AND terms.oneTime = true))
                AND CASE WHEN terms.expiresAt IS NULL OR trim(terms.expiresAt) = '' THEN true ELSE datetime(terms.expiresAt) > datetime() END
                AND CASE WHEN contract.expiresAt IS NULL OR trim(contract.expiresAt) = '' THEN true ELSE datetime(contract.expiresAt) > datetime() END
                AND (terms.smartResumePublicationStatus IN ['pending', 'failed', 'succeeded']
                    OR (terms.smartResumePublicationStatus = 'sending' AND terms.smartResumeLeaseUntil < $now))`
            )
            .set(
                `terms.smartResumeLeaseId = CASE WHEN terms.smartResumePublicationStatus = 'succeeded' THEN terms.smartResumeLeaseId ELSE $leaseId END,
                terms.smartResumeLeaseUntil = CASE WHEN terms.smartResumePublicationStatus = 'succeeded' THEN terms.smartResumeLeaseUntil ELSE $leaseUntil END,
                terms.smartResumePublicationStatus = CASE WHEN terms.smartResumePublicationStatus = 'succeeded' THEN 'succeeded' ELSE 'sending' END`
            )
            .return('terms')
    );
    assertAudienceMutation(result.records.length);
    const accepted = inflateObject(result.records[0]!.get('terms').properties) as DbTermsType;
    if (accepted.smartResumePublicationStatus === 'succeeded')
        return accepted.smartResumeRedirectUrl;

    const finish = async (status: 'failed' | 'succeeded', redirectUrl?: string): Promise<void> => {
        await new QueryBuilder(
            new BindParam({ termsId, leaseId, status, redirectUrl: redirectUrl ?? null })
        )
            .match('(terms:ConsentFlowTerms {id: $termsId})')
            .where('terms.smartResumeLeaseId = $leaseId')
            .set(
                'terms.smartResumePublicationStatus = $status, terms.smartResumeRedirectUrl = $redirectUrl'
            )
            .run();
    };
    try {
        const redirectUrl = await upload(accepted.terms);
        await finish('succeeded', redirectUrl);
        return redirectUrl;
    } catch (cause) {
        await finish('failed');
        throw new TRPCError({
            code: 'BAD_GATEWAY',
            message:
                'Your consent was saved, but the SmartResume upload failed. Retry to finish connecting.',
            cause,
        });
    }
};
