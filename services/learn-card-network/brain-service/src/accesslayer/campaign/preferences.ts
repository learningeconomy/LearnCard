import { TRPCError } from '@trpc/server';
import type { AnnouncementPreferences } from '@learncard/types';
import { neogma } from '@instance';
import { traceDb } from '@tracing';

/** Resolve the durable recipient directly so renames and reused names cannot redirect opt-outs. */
export const unsubscribeCampaignRecipient = async (unsubscribeId: string): Promise<void> => {
    await traceDb('campaign:unsubscribeRecipient', () =>
        neogma.queryRunner.run(
            `MATCH (p:Profile {campaignUnsubscribeId: $unsubscribeId})
             SET p.announcementEmailOptOut = true`,
            { unsubscribeId }
        )
    );
};

/** Private preferences are read from the graph, never a cached public profile. */
export const getAnnouncementPreferences = async (
    profileId: string
): Promise<AnnouncementPreferences> => {
    const result = await traceDb('campaign:preferences', () =>
        neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: $profileId})
         RETURN coalesce(p.announcementEmailOptOut, false) AS email,
                coalesce(p.announcementPushOptOut, false) AS push`,
            { profileId }
        )
    );
    const row = result.records[0];
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
    return { announcementEmailOptOut: row.get('email'), announcementPushOptOut: row.get('push') };
};

/** Patch only supplied choices so concurrent email and push updates cannot clobber each other. */
export const updateAnnouncementPreferences = async (
    profileId: string,
    updates: Partial<AnnouncementPreferences>
): Promise<AnnouncementPreferences> => {
    const properties = Object.fromEntries(
        Object.entries(updates).filter(
            ([key, value]) =>
                ['announcementEmailOptOut', 'announcementPushOptOut'].includes(key) &&
                typeof value === 'boolean'
        )
    );
    await traceDb('campaign:updatePreferences', () =>
        neogma.queryRunner.run('MATCH (p:Profile {profileId: $profileId}) SET p += $properties', {
            profileId,
            properties,
        })
    );
    return getAnnouncementPreferences(profileId);
};
