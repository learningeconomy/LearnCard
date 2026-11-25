import { z } from 'zod';
import { UnsignedVCValidator } from '@learncard/types';

import { FileProcessingMetadataValidator } from './file-extraction';

export const FileExtractionResponseValidator = z
    .object({
        vcs: z
            .array(
                z.object({
                    vc: UnsignedVCValidator,
                    metadata: z.object({ name: z.string(), category: z.string() }).optional(),
                })
            )
            .max(10_000),
        processing: FileProcessingMetadataValidator,
    })
    .superRefine((response, context) => {
        const empty = response.vcs.length === 0;
        if (
            response.processing.stage !== 'complete' ||
            response.processing.outcome !== (empty ? 'empty' : 'success') ||
            response.processing.code !== (empty ? 'ZERO_STRUCTURED_ITEMS' : 'OK') ||
            response.processing.credentialCount !== response.vcs.length
        ) {
            context.addIssue({ code: 'custom', message: 'Inconsistent extraction outcome' });
        }
    });

export const RawArtifactCredentialValidator = UnsignedVCValidator.extend({
    id: z.string().min(1),
    rawArtifact: z.object({
        type: z.string(),
        fileName: z.string(),
        fileSize: z.string(),
        fileType: z.string(),
        data: z.string().min(1),
    }),
});
