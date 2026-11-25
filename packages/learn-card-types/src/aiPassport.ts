import { z } from 'zod';

import { VCValidator } from './vc';

export const RoleValidator = z.enum(['user', 'assistant', 'tool', 'system']);
export type Role = z.infer<typeof RoleValidator>;

export const AiSessionMode = {
    tutor: 'ai-tutor',
    insights: 'ai-insights',
} as const;
export const AiSessionModeValidator = z.enum([AiSessionMode.tutor, AiSessionMode.insights]);
export type AiSessionMode = z.infer<typeof AiSessionModeValidator>;

export const StructuredResponseValidator = z.object({
    notes: z.string().optional(),
    questions: z.array(z.string()),
});
export type StructuredResponse = z.infer<typeof StructuredResponseValidator>;

export const IntroStreamModeValidator = z.enum(['formatted', 'structured']);
export type IntroStreamMode = z.infer<typeof IntroStreamModeValidator>;

export const ChatMessageValidator = z.object({
    role: RoleValidator,
    content: z.string().nullable(),
    tool_call_id: z.string().optional(),
    tool_calls: z
        .array(
            z.object({
                id: z.string(),
                type: z.literal('function'),
                function: z.object({
                    name: z.string(),
                    arguments: z.string(),
                }),
            })
        )
        .optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageValidator>;

export const InsightArtifactValidator = z.object({
    title: z.string(),
    summary: z.string(),
    category: z.string(),
    question: z.string(),
    narrative: z.string(),
});
export type InsightArtifact = z.infer<typeof InsightArtifactValidator>;

export const ArtifactSuggestionValidator = z.object({
    artifact: InsightArtifactValidator,
    source_text: z.string().optional(),
    created_at: z.string(),
});
export type ArtifactSuggestion = z.infer<typeof ArtifactSuggestionValidator>;

export const ThreadCredentialContextValidator = z.object({
    uri: z.string(),
    type: z.string(),
    context: z.string(),
    score: z.number(),
    strongestScore: z.number().optional(),
    averageScore: z.number().optional(),
    matchCount: z.number().optional(),
    title: z.string().optional(),
});
export type ThreadCredentialContext = z.infer<typeof ThreadCredentialContextValidator>;

export const ThreadValidator = z.object({
    id: z.string(),
    did: z.string(),
    topicCredentialUri: z.string().nullable().optional(),
    title: z.string(),
    created_at: z.string(),
    last_message_at: z.string(),
    active: z.boolean().optional(),
    ended_at: z.string().optional(),
    plan_started_at: z.string().optional(),
    summaries: z
        .array(
            z.object({
                summary_data: z.string(),
                credential_uri: z.string(),
                created_at: z.string(),
            })
        )
        .optional(),
    plans: z
        .array(
            z.object({
                plan_data: z.string(),
                created_at: z.string(),
                consentRevision: z.string().optional(),
            })
        )
        .optional(),
    credentials: z.array(ThreadCredentialContextValidator).optional(),
    credentialSearchTopic: z.string().optional(),
    credentialContextStatus: z.enum(['pending', 'ready', 'empty', 'error']).optional(),
    mode: AiSessionModeValidator.optional(),
    artifactSuggestions: z.array(ArtifactSuggestionValidator).optional(),
});
export type Thread = z.infer<typeof ThreadValidator>;

export const CredentialVerificationMetadataValidator = z.object({
    credentialUri: z.string(),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    status: z.enum(['valid', 'invalid']),
    checkedAt: z.string().datetime(),
    verifier: z.object({
        name: z.string(),
        version: z.string(),
    }),
    verifiedPayload: z.enum(['credential', 'boostCredential']),
    checks: z.array(z.string()),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
    provenance: z.object({
        source: z.enum(['wallet', 'generated']),
        retrievedAt: z.string().datetime(),
    }),
    consent: z.object({
        contractUri: z.string(),
        receiptId: z.string().min(1),
        grantedAt: z.string().datetime().optional(),
        updatedAt: z.string().datetime(),
        contractUpdatedAt: z.string().min(1),
        status: z.literal('live'),
        expiresAt: z.string().datetime().optional(),
        contractExpiresAt: z.string().datetime().optional(),
        categories: z.array(z.string()),
        credentialUris: z.array(z.string()),
        personalFields: z.array(z.string()),
        purpose: z.enum(['credential-ingestion', 'model-inference', 'embedding']),
        revision: z.string().min(1),
        guardian: z.object({ required: z.boolean(), approved: z.boolean() }),
    }),
});
export type CredentialVerificationMetadata = z.infer<
    typeof CredentialVerificationMetadataValidator
>;

export const ModelSafeCredentialFactValidator = z.object({
    kind: z.enum([
        'skill',
        'goal',
        'achievement',
        'course',
        'experience',
        'competency',
        'title',
        'summary',
        'assessment',
        'grade',
        'date',
        'alignment',
        'criteria',
        'pathway',
        'topic',
    ]),
    value: z.string().min(1).max(240),
    label: z.string().min(1).max(120).optional(),
});
export type ModelSafeCredentialFact = z.infer<typeof ModelSafeCredentialFactValidator>;

export const ModelSafeCredentialProjectionValidator = z.object({
    schemaVersion: z.literal('1'),
    category: z.string().min(1).max(120),
    credentialTypes: z.array(z.string().min(1).max(120)).max(20),
    facts: z.array(ModelSafeCredentialFactValidator).max(100),
    // Present only on credentials that are past their expiry, so the model can
    // tell a lapsed credential from a current one.
    expired: z.literal(true).optional(),
    expirationDate: z.string().datetime().optional(),
});
export type ModelSafeCredentialProjection = z.infer<typeof ModelSafeCredentialProjectionValidator>;

export const AIPassportCredentialRecordValidator = z.object({
    id: z.string(),
    uri: z.string(),
    category: z.string(),
    credential: VCValidator,
    aiContext: z.string(),
    generalSummary: z.string().optional(),
    createdAt: z.string(),
    verification: CredentialVerificationMetadataValidator.optional(),
    projection: ModelSafeCredentialProjectionValidator.optional(),
});
export type AIPassportCredentialRecord = z.infer<typeof AIPassportCredentialRecordValidator>;

export const AuthenticatedMessageValidator = z.object({
    message: ChatMessageValidator.optional(),
    threadId: z.string().optional(),
    selectedQuestion: z.string().optional(),
    action: z
        .enum([
            'start_topic',
            'continue_plan',
            'start_topic_uri',
            'start_learning_pathway',
            'start_insights_session',
            'close_insights_session',
            'artifact_suggestion',
        ])
        .optional(),
    topic: z.string().optional(),
    topicUri: z.string().optional(),
    pathwayUri: z.string().optional(),
    mode: AiSessionModeValidator.optional(),
    introStreamMode: IntroStreamModeValidator.optional(),
    // BCP-47 language for AI responses (LC-1901). This has to live on the
    // validator, not just the inferred type — z.object strips unknown keys, so an
    // undeclared `locale` would be dropped before the WS handler ever saw it.
    locale: z.string().nullish(),
});
export type AuthenticatedMessage = z.infer<typeof AuthenticatedMessageValidator>;

export const DebugInfoValidator = z.object({
    operation: z.string(),
    collection: z.string(),
    input: z.unknown().optional(),
    output: z.unknown().optional(),
    timestamp: z.string(),
    duration: z.number().optional(),
});
export type DebugInfo = z.infer<typeof DebugInfoValidator>;

export const TimingEventValidator = z.object({
    event: z.literal('timing'),
    operation: z.string(),
    phase: z.enum(['start', 'end', 'complete']),
    duration: z.number().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    timestamp: z.string(),
});
export type TimingEvent = z.infer<typeof TimingEventValidator>;

export const LearningPathwayValidator = z.object({
    id: z.string(),
    learningPathway: z.object({
        stepIndex: z.number(),
        step: z.object({
            title: z.string(),
            description: z.string(),
            summary: z.string(),
            learned: z.array(z.string()),
            skills: z.array(
                z.object({
                    title: z.string(),
                    description: z.string(),
                })
            ),
        }),
    }),
});
export type LearningPathway = z.infer<typeof LearningPathwayValidator>;
