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

// =============================================================================
// Ed.link Completion Types (for getCompletions route)
// =============================================================================

export const EdlinkAssignmentCompletionValidator = z.object({
    className: z.string(),
    assignmentTitle: z.string(),
    personName: z.string(),
    personEmail: z.string().nullable().optional(),
    gradedDate: z.string().nullable().optional(),
    grade: z.number().nullable().optional(),
});
export type EdlinkAssignmentCompletion = z.infer<typeof EdlinkAssignmentCompletionValidator>;

export const EdlinkCourseCompletionValidator = z.object({
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
