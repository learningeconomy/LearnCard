import { TRPCError } from '@trpc/server';
import { CampaignValidator, type Campaign } from '@learncard/types';
import type { ManagedTransaction } from 'neo4j-driver';

import { neogma } from '@instance';
import { traceDb } from '@tracing';

const knownBirthdayPredicate = `p.dob IS NOT NULL
    AND p.dob =~ '[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])'`;
const managedProfilePredicate = `(EXISTS { MATCH (p)-[:MANAGED_BY]->(:Profile) }
    OR EXISTS { MATCH (:ProfileManager)-[:MANAGES]->(p) })`;
const serviceProfilePredicate = `(p.isServiceProfile = true AND coalesce(p.type, '') <> 'child')`;
export const adultProfilePredicate = `${knownBirthdayPredicate}
    AND coalesce(p.type, '') <> 'child' AND p.dob <= $adultCutoff
    AND (${serviceProfilePredicate} OR NOT ${managedProfilePredicate})`;
export const campaignAgePredicate = `(${knownBirthdayPredicate}
    AND (c.excludeMinors = false OR (${adultProfilePredicate})))`;
export const liveCampaignPredicate = `c.status = 'live'
    AND (c.startsAt IS NULL OR c.startsAt <= $now)
    AND (c.endsAt IS NULL OR c.endsAt > $now)`;

export const campaignTimeParams = (now = new Date()): { now: string; adultCutoff: string } => {
    const timestamp = now.toISOString();
    // Compare calendar dates, not elapsed milliseconds. Keeping the month/day avoids
    // JS rolling Feb 29 into March 1 and admitting March 1 birthdays a day early.
    const adultCutoff = `${now.getUTCFullYear() - 18}${timestamp.slice(4, 10)}`;
    return { now: timestamp, adultCutoff };
};

export const parseCampaign = (definition: string): Campaign =>
    CampaignValidator.parse(JSON.parse(definition));

export const safeParseCampaign = (definition: unknown): Campaign | undefined => {
    if (typeof definition !== 'string') return undefined;
    try {
        const result = CampaignValidator.safeParse(JSON.parse(definition));
        return result.success ? result.data : undefined;
    } catch {
        return undefined;
    }
};

export const campaignProperties = (campaign: Campaign): Record<string, unknown> => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    excludeMinors: campaign.excludeMinors,
    selfEnroll: campaign.selfEnroll,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    definition: JSON.stringify(campaign),
    startsAt: campaign.startsAt ?? null,
    endsAt: campaign.endsAt ?? null,
});

export const withCampaignTransaction = async <Result>(
    name: string,
    work: (transaction: ManagedTransaction) => Promise<Result>
): Promise<Result> =>
    traceDb(name, async () => {
        const session = neogma.queryRunner.getDriver().session();
        try {
            return await session.executeWrite(work);
        } finally {
            await session.close();
        }
    });

/** Serialize campaign edits/audience enrollment before reading their current definition. */
export const lockCampaign = async (
    transaction: ManagedTransaction,
    campaignId: string
): Promise<Campaign> => {
    const result = await transaction.run(
        `MATCH (c:Campaign {id: $campaignId})
         SET c.lockVersion = coalesce(c.lockVersion, 0) + 1
         RETURN c.definition AS definition`,
        { campaignId }
    );
    if (!result.records.length)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' });
    return parseCampaign(result.records[0]!.get('definition'));
};

export const assertCampaignEditable = (campaign: Campaign): void => {
    if (campaign.status === 'archived') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Archived campaigns cannot be changed',
        });
    }
};
