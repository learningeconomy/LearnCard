import { TRPCError } from '@trpc/server';
import { ShareLinkIdValidator } from '@learncard/types';
import { z } from 'zod';

// Relationship metadata is not signed VP content. Bound generic metadata and
// reserve the share-link shape for the recipient's own send/accept workflow.
const ShareLinkPresentationMetadataValidator = z
    .object({
        type: z.literal('learncard.share-link.v1'),
        shareId: ShareLinkIdValidator,
        title: z.string().min(1).max(120),
        note: z.string().max(500).optional(),
        sharer: z
            .object({
                profileId: z.string().min(1).max(128),
                displayName: z.string().min(1).max(120),
            })
            .strict(),
    })
    .strict();

export const PresentationMetadataValidator = z
    .record(z.string().min(1).max(64), z.unknown())
    .refine(value => JSON.stringify(value).length <= 4096, 'Metadata is too large')
    .superRefine((value, ctx) => {
        if (value.type !== 'learncard.share-link.v1') return;
        if (!ShareLinkPresentationMetadataValidator.safeParse(value).success)
            ctx.addIssue({ code: 'custom', message: 'Invalid share-link metadata' });
    });

export const assertPresentationMetadataRecipient = (
    metadata: Record<string, unknown> | undefined,
    senderProfileId: string,
    recipientProfileId: string
): void => {
    if (metadata?.type === 'learncard.share-link.v1' && senderProfileId !== recipientProfileId)
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Share-link metadata requires a self-save',
        });
};
