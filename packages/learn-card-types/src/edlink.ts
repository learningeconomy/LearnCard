import { z } from 'zod';

export const EdlinkConnectionStatusEnum = z.enum([
    'CONNECTED',
    'SYNCING',
    'ERROR',
    'PENDING_APPROVAL',
]);
export type EdlinkConnectionStatus = z.infer<typeof EdlinkConnectionStatusEnum>;

export const EdlinkConnectionValidator = z.object({
    id: z.string(),
    integrationId: z.string(),
    sourceId: z.string(),
    accessToken: z.string(),
    provider: z.string(),
    providerName: z.string(),
    institutionName: z.string(),
    status: EdlinkConnectionStatusEnum,
    connectedAt: z.string(),
});
export type EdlinkConnection = z.infer<typeof EdlinkConnectionValidator>;
