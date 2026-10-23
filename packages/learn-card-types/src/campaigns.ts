import { z } from 'zod';

import { inAppMessageAuthoringValidator, inAppMessageValidator } from './inAppMessages';

export const CampaignIdValidator = z.string().regex(/^[a-z0-9-]{3,64}$/);
export const CampaignStatusValidator = z.enum(['draft', 'live', 'paused', 'archived']);
export const CampaignChannelValidator = z.enum(['inApp', 'notify']);
export const CampaignEventValidator = z.enum(['shown', 'clicked', 'dismissed', 'converted']);

const timestamp = z.iso
    .datetime({ offset: true })
    .overwrite(value => new Date(value).toISOString());
const notification = z.object({ title: z.string().min(1), body: z.string().min(1) }).strict();
const channels = z
    .array(CampaignChannelValidator)
    .min(1)
    .max(2)
    .refine(values => new Set(values).size === values.length, 'Channels must be unique');

const campaignDefinition = z
    .object({
        id: CampaignIdValidator,
        name: z.string().trim().min(1).max(200),
        status: CampaignStatusValidator.default('draft'),
        channels,
        message: inAppMessageValidator,
        notification: notification.optional(),
        startsAt: timestamp.optional(),
        endsAt: timestamp.optional(),
        excludeMinors: z.boolean().default(true),
        selfEnroll: z.boolean().default(false),
    })
    .strict();

const validDefinition = (
    value: Pick<
        z.output<typeof campaignDefinition>,
        'channels' | 'notification' | 'startsAt' | 'endsAt'
    >,
    ctx: z.RefinementCtx
): void => {
    if (value.channels.includes('notify') && !value.notification) {
        ctx.addIssue({
            code: 'custom',
            path: ['notification'],
            message: 'Notify requires a title and body',
        });
    }
    if (value.startsAt && value.endsAt && value.startsAt >= value.endsAt) {
        ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End must be after start' });
    }
};

export const CampaignValidator = campaignDefinition
    .extend({
        createdAt: timestamp,
        updatedAt: timestamp,
    })
    .superRefine(validDefinition)
    .superRefine((value, ctx) => {
        if (value.message.id !== value.id) {
            ctx.addIssue({
                code: 'custom',
                path: ['message', 'id'],
                message: 'Message ID must equal campaign ID',
            });
        }
    });

export const CreateCampaignInputValidator = campaignDefinition
    .extend({
        message: inAppMessageAuthoringValidator,
    })
    .superRefine(validDefinition);

export const CampaignUpdatesValidator = campaignDefinition
    .omit({ id: true })
    .partial()
    .extend({
        // A PATCH must not apply creation defaults to fields the caller omitted.
        status: CampaignStatusValidator.optional(),
        excludeMinors: z.boolean().optional(),
        selfEnroll: z.boolean().optional(),
        message: inAppMessageAuthoringValidator.optional(),
        notification: notification.nullable().optional(),
        startsAt: timestamp.nullable().optional(),
        endsAt: timestamp.nullable().optional(),
    })
    .strict();

export const UpdateCampaignInputValidator = z
    .object({
        campaignId: CampaignIdValidator,
        updates: CampaignUpdatesValidator,
    })
    .strict();

const identifier = z.string().trim().min(1).max(2048);
const metadataKey = z
    .string()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_.-]{0,63}$/)
    .refine(
        key => !['__proto__', 'prototype', 'constructor'].includes(key),
        'Invalid metadata key'
    );

export const CampaignAudienceSourceValidator = z.discriminatedUnion('type', [
    z
        .object({
            type: z.literal('dids'),
            dids: z.array(identifier.startsWith('did:')).min(1).max(1000),
        })
        .strict(),
    z
        .object({
            type: z.literal('emails'),
            emails: z.array(z.string().trim().email().toLowerCase()).min(1).max(1000),
        })
        .strict(),
    z
        .object({
            type: z.literal('credentialsSentBy'),
            senderProfileId: identifier.optional(),
            listingId: identifier.optional(),
            metadata: z.record(metadataKey, z.string().max(2048)).optional(),
            since: timestamp.optional(),
            includePending: z.boolean().default(false),
        })
        .strict()
        .refine(
            value => Boolean(value.senderProfileId) !== Boolean(value.listingId),
            'Specify exactly one senderProfileId or listingId'
        ),
    z
        .object({
            type: z.literal('inboxClaims'),
            issuerDid: identifier.startsWith('did:'),
            since: timestamp.optional(),
        })
        .strict(),
    z
        .object({
            type: z.literal('boostRecipients'),
            boostUri: identifier,
            includePending: z.boolean().default(false),
        })
        .strict(),
]);

export const CampaignAudienceInputValidator = z
    .object({
        campaignId: CampaignIdValidator,
        source: CampaignAudienceSourceValidator,
    })
    .strict();

export const CampaignUserStateValidator = z.object({
    firstShownAt: timestamp.optional(),
    lastShownAt: timestamp.optional(),
    shownCount: z.number().int().nonnegative().default(0),
    clickedAt: timestamp.optional(),
    dismissedAt: timestamp.optional(),
    convertedAt: timestamp.optional(),
    notifiedAt: timestamp.optional(),
});

export const MyCampaignValidator = z.object({
    campaign: campaignDefinition.pick({
        id: true,
        message: true,
        startsAt: true,
        endsAt: true,
        selfEnroll: true,
    }),
    state: CampaignUserStateValidator,
});

export const CampaignStatsValidator = z.object({
    audience: z.number().int().nonnegative(),
    notified: z.number().int().nonnegative(),
    shown: z.number().int().nonnegative(),
    clicked: z.number().int().nonnegative(),
    dismissed: z.number().int().nonnegative(),
    converted: z.number().int().nonnegative(),
    enrolled: z.number().int().nonnegative(),
});

export const CampaignPaginationValidator = z
    .object({
        cursor: z.string().min(1).optional(),
        limit: z.number().int().min(1).max(1000).default(100),
    })
    .strict();
export const ListCampaignsInputValidator = CampaignPaginationValidator.extend({
    status: CampaignStatusValidator.optional(),
});
export const PageCampaignAudienceInputValidator = CampaignPaginationValidator.extend({
    campaignId: CampaignIdValidator,
});
export const PaginatedCampaignsValidator = z.object({
    records: z.array(CampaignValidator),
    hasMore: z.boolean(),
    cursor: z.string().optional(),
});
export const PaginatedCampaignAudienceValidator = z.object({
    records: z.array(z.object({ profileId: z.string(), did: z.string() })),
    hasMore: z.boolean(),
    cursor: z.string().optional(),
});

export type Campaign = z.output<typeof CampaignValidator>;
export type CampaignStatus = z.output<typeof CampaignStatusValidator>;
export type CampaignChannel = z.output<typeof CampaignChannelValidator>;
export type CampaignEvent = z.output<typeof CampaignEventValidator>;
export type CampaignAudienceSource = z.output<typeof CampaignAudienceSourceValidator>;
export type CampaignAudienceInput = z.input<typeof CampaignAudienceInputValidator>;
export type CampaignUserState = z.output<typeof CampaignUserStateValidator>;
export type CampaignStats = z.output<typeof CampaignStatsValidator>;
export type MyCampaign = z.output<typeof MyCampaignValidator>;
export type CreateCampaignInput = z.input<typeof CreateCampaignInputValidator>;
export type UpdateCampaignInput = z.input<typeof UpdateCampaignInputValidator>;
export type ListCampaignsInput = z.input<typeof ListCampaignsInputValidator>;
export type PageCampaignAudienceInput = z.input<typeof PageCampaignAudienceInputValidator>;
export type PaginatedCampaigns = z.output<typeof PaginatedCampaignsValidator>;
export type PaginatedCampaignAudience = z.output<typeof PaginatedCampaignAudienceValidator>;
