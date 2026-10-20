import { z } from 'zod';
import { UnsignedVCValidator, type UnsignedVC } from '@learncard/types';

export const FILE_EXTRACTION_STAGES = [
    'input',
    'read',
    'classify',
    'extract',
    'construct',
    'complete',
] as const;
export const FILE_EXTRACTION_CODES = [
    'OK',
    'ZERO_STRUCTURED_ITEMS',
    'INPUT_INVALID',
    'FILE_TOO_LARGE',
    'READ_FAILED',
    'NO_READABLE_TEXT',
    'CONTENT_REJECTED',
    'CLASSIFICATION_FAILED',
    'MODEL_FAILED',
    'CONSTRUCTION_FAILED',
    'CONSENT_DENIED',
    'OWNER_OPERATION_UNAVAILABLE',
] as const;
export const FILE_KINDS = ['resume', 'certificate', 'transcript', 'diploma'] as const;
export const FILE_SIZE_BUCKETS = ['under_100kb', 'under_1mb', 'under_4mb', 'over_4mb'] as const;

export const FileExtractionAttemptValidator = z.object({
    operationId: z.string().uuid(),
    attemptId: z.string().uuid(),
    attempt: z.number().int().min(1).max(100),
});
export type FileExtractionAttempt = z.infer<typeof FileExtractionAttemptValidator>;

export const FileProcessingMetadataValidator = FileExtractionAttemptValidator.extend({
    version: z.literal(1),
    stage: z.enum(FILE_EXTRACTION_STAGES),
    outcome: z.enum(['success', 'empty', 'failed']),
    code: z.enum(FILE_EXTRACTION_CODES),
    durationMs: z.number().int().min(0).max(3_600_000),
    sizeBucket: z.enum(FILE_SIZE_BUCKETS),
    fileType: z.enum(FILE_KINDS),
    detectedFileType: z.enum(FILE_KINDS).optional(),
    credentialCount: z.number().int().min(0).max(10_000),
    pipelineVersion: z.literal('file-extraction-v1'),
    model: z.string().min(1).max(128),
    ocrModel: z.string().min(1).max(128),
}).superRefine((processing, context) => {
    const failed = processing.outcome === 'failed';
    if (
        (failed &&
            (processing.stage === 'complete' ||
                processing.code === 'OK' ||
                processing.code === 'ZERO_STRUCTURED_ITEMS' ||
                processing.credentialCount !== 0)) ||
        (!failed && processing.stage !== 'complete')
    ) {
        context.addIssue({ code: 'custom', message: 'Inconsistent processing stage' });
    }
});
export type FileProcessingMetadata = z.infer<typeof FileProcessingMetadataValidator>;

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
export type FileExtractionResponse = z.infer<typeof FileExtractionResponseValidator>;

/** Operational fields only. Arbitrary provider messages and document fields never survive. */
export const FileExtractionDiagnosticValidator = FileExtractionAttemptValidator.extend({
    stage: z.enum([...FILE_EXTRACTION_STAGES, 'artifact_save', 'credential_save']),
    outcome: z.enum(['success', 'empty', 'failed']),
    code: z
        .enum([
            ...FILE_EXTRACTION_CODES,
            'RESPONSE_INVALID',
            'NETWORK_FAILED',
            'ARTIFACT_SAVE_FAILED',
            'CREDENTIAL_SAVE_FAILED',
        ])
        .optional(),
    fileType: z.enum(FILE_KINDS),
    sizeBucket: z.enum(FILE_SIZE_BUCKETS).optional(),
    durationMs: z.number().int().min(0).max(3_600_000).optional(),
    credentialCount: z.number().int().min(0).max(10_000).optional(),
    extractedCount: z.number().int().min(0).max(10_000).optional(),
    selectedCount: z.number().int().min(0).max(10_000).optional(),
    storedCount: z.number().int().min(0).max(10_000).optional(),
    statusCode: z.number().int().min(100).max(599).optional(),
    pipelineVersion: z.literal('file-extraction-v1').optional(),
    // Only audited application model identifiers, never arbitrary server error text.
    // Keep aligned with AI-Passport's constants/env.ts FORMATTING_MODEL and
    // ai/bedrock-generation.ts audit IDs; unaudited identifiers deliberately become "unknown".
    model: z
        .enum([
            'us.openai.gpt-6-luna',
            'us.openai.gpt-6.1-sol',
            'gpt-6-luna-none',
            'gpt-6.1-sol',
            'gpt-5.6-luna-none',
            'gpt-5.6-sol-medium',
            'not_used',
            'unknown',
        ])
        .optional(),
    ocrModel: z
        .enum([
            'tesseract-local',
            'gpt-6-luna-none',
            'gpt-6.1-sol',
            'gpt-5.6-luna-none',
            'gpt-5.6-sol-medium',
            'not_used',
            'unknown',
        ])
        .optional(),
});
export type FileExtractionDiagnostic = z.infer<typeof FileExtractionDiagnosticValidator>;

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
export type RawArtifactCredential = z.infer<typeof RawArtifactCredentialValidator>;

/** Editable draft plus its source, retained in the memory-only review store. */
export interface ParsedFileCredential {
    vc: UnsignedVC;
    metadata?: { name?: string; category?: string };
    artifactId?: string;
    attempt?: FileExtractionAttempt;
}
