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
    // Auto-issuance fields
    ownerProfileId: z.string().optional(),
    autoIssueCredentials: z.boolean().optional(),
    lastPolledAt: z.string().optional(),
});
export type EdlinkConnection = z.infer<typeof EdlinkConnectionValidator>;

// =============================================================================
// Ed.link Issued Credential Types (for tracking auto-issued credentials)
// =============================================================================

export const EdlinkIssuedCredentialStatusEnum = z.enum([
    'ISSUED',
    'FAILED',
    'SKIPPED',
]);
export type EdlinkIssuedCredentialStatus = z.infer<typeof EdlinkIssuedCredentialStatusEnum>;

export const EdlinkIssuedCredentialValidator = z.object({
    id: z.string(),
    connectionId: z.string(),
    submissionId: z.string(),
    assignmentId: z.string(),
    studentEmail: z.string(),
    studentName: z.string(),
    className: z.string(),
    assignmentTitle: z.string(),
    grade: z.number().nullable().optional(),
    issuedAt: z.string(),
    status: EdlinkIssuedCredentialStatusEnum,
    errorMessage: z.string().optional(),
});
export type EdlinkIssuedCredential = z.infer<typeof EdlinkIssuedCredentialValidator>;

// =============================================================================
// Ed.link Completion Types (for getCompletions route)
// =============================================================================

export const EdlinkAssignmentCompletionValidator = z.object({
    // IDs for tracking and deduplication
    classId: z.string(),
    assignmentId: z.string(),
    submissionId: z.string(),
    personId: z.string(),
    // Display data
    className: z.string(),
    assignmentTitle: z.string(),
    personName: z.string(),
    personEmail: z.string().nullable().optional(),
    gradedDate: z.string().nullable().optional(),
    grade: z.number().nullable().optional(),
});
export type EdlinkAssignmentCompletion = z.infer<typeof EdlinkAssignmentCompletionValidator>;

export const EdlinkCourseCompletionValidator = z.object({
    // IDs for tracking
    classId: z.string(),
    personId: z.string(),
    // Display data
    personName: z.string(),
    personEmail: z.string().nullable().optional(),
    className: z.string(),
});
export type EdlinkCourseCompletion = z.infer<typeof EdlinkCourseCompletionValidator>;

export const EdlinkCompletionsResponseValidator = z.object({
    summary: z.object({
        classes: z.number(),
        assignmentCompletions: z.number(),
        courseCompletions: z.number(),
    }),
    courseCompletions: EdlinkCourseCompletionValidator.array(),
    assignmentCompletions: EdlinkAssignmentCompletionValidator.array(),
});
export type EdlinkCompletionsResponse = z.infer<typeof EdlinkCompletionsResponseValidator>;
