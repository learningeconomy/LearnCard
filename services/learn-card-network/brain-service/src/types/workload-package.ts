import { z } from 'zod';

export const WorkloadPackageRecordValidator = z.object({
    id: z.string(),
    publisherDid: z.string(),
    createdAt: z.string(),
});
export type WorkloadPackageRecord = z.infer<typeof WorkloadPackageRecordValidator>;

export const WorkloadPackageVersionRecordValidator = z.object({
    versionId: z.string(),
    packageId: z.string(),
    version: z.string(),
    manifestHash: z.string(),
    manifestJson: z.string(),
    status: z.enum(['PUBLISHED', 'REVOKED']),
    reviewSnapshot: z.string().optional(),
    createdAt: z.string(),
});
export type WorkloadPackageVersionRecord = z.infer<typeof WorkloadPackageVersionRecordValidator>;
