import { z } from 'zod';

import {
    AppManifestValidator,
    AppManifestVersionValidator,
    AppManifestDiffValidator,
} from '@learncard/types';

export const AppManifestTypeValidator = AppManifestValidator;
export type AppManifestType = z.infer<typeof AppManifestTypeValidator>;

export const AppManifestVersionTypeValidator = AppManifestVersionValidator;
export type AppManifestVersionType = z.infer<typeof AppManifestVersionTypeValidator>;

export const FlatAppManifestVersionValidator = z.object({
    id: z.string(),
    version: z.number().int().min(1),
    manifestHash: z.string(),
    manifestJson: z.string(),
    status: z.enum(['draft', 'active', 'superseded']),
    createdAt: z.string(),
    activatedAt: z.string().optional(),
});

export type FlatAppManifestVersionType = z.infer<typeof FlatAppManifestVersionValidator>;

export const AppManifestDiffTypeValidator = AppManifestDiffValidator;
export type AppManifestDiffType = z.infer<typeof AppManifestDiffTypeValidator>;
