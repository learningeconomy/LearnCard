import { z } from 'zod';
// Schema for AI insight credentials
const KeywordValidator = z.object({
    occupations: z.array(z.string()).nullable(),
    careers: z.array(z.string()).nullable(),
    jobs: z.array(z.string()).nullable(),
    skills: z.array(z.string()).nullable(),
    fieldOfStudy: z.string().nullable(),
});

const InsightKeywordValidator = z.object({
    occupations: z.array(z.string().max(240)).max(20).nullable(),
    careers: z.array(z.string().max(240)).max(20).nullable(),
    jobs: z.array(z.string().max(240)).max(20).nullable(),
    skills: z.array(z.string().max(240)).max(20).nullable(),
    fieldOfStudy: z.string().max(240).nullable(),
});

export const AIInsightDataValidator = z.object({
    strongestArea: z.object({
        title: z.string().max(240),
        summary: z.string().max(2_000),
        keywords: InsightKeywordValidator,
    }),
    weakestArea: z.object({
        title: z.string().max(240),
        summary: z.string().max(2_000),
        keywords: InsightKeywordValidator,
    }),
    roomForGrowth: z.object({
        title: z.string().max(240),
        summary: z.string().max(2_000),
        keywords: InsightKeywordValidator,
    }),
    generalSummary: z
        .string()
        .max(2_000)
        .describe("High-level narrative that synthesizes the user's credential-backed profile"),
    suggestedPathways: z
        .array(z.string().max(120))
        .max(20)
        .describe('URIs of recommended Learning Pathways for the user'),
});

export type AIInsightData = z.infer<typeof AIInsightDataValidator>;
// Schema for structured credential UI data
export const SummaryCredentialDataValidator = z.object({
    title: z.string().describe('Short, concise title for the learning session or credential'),
    summary: z.string().describe('Comprehensive summary of what happened during the session'),
    learned: z.array(z.string()).describe('Bullet points of key knowledge gained'),
    skills: z
        .array(
            z.object({
                title: z.string().describe('Name of the skill category'),
                description: z
                    .string()
                    .describe('Detailed description of what this skill category involves'),
            })
        )
        .describe('Categorized skills learned during the session'),
    nextSteps: z
        .array(
            z.object({
                title: z.string().describe('Title of the suggested next step'),
                description: z
                    .string()
                    .describe('Description explaining why this next step is recommended'),
                keywords: KeywordValidator,
            })
        )
        .describe('Recommended follow-up activities or learning modules'),
    reflections: z
        .array(
            z.object({
                title: z.string().describe('Title of the reflection'),
                description: z
                    .string()
                    .describe('Detailed description of what this reflection involves'),
            })
        )
        .describe('Reflections on the learning experience'),
});
export type SummaryCredentialData = z.infer<typeof SummaryCredentialDataValidator>;
// Schema for credential issuance
export const CredentialSchema = z.object({
    boostName: z.string().describe('Credential Name (W3C VC name)'),
    achievementId: z
        .string()
        .transform(id =>
            id.startsWith('https://docs.learncard.com/definitions#')
                ? id
                : `https://docs.learncard.com/definitions#${id}`
        )
        .describe('Credential Achievement ID (OBv3 credentialSubject.achievement.id)'),
    achievementType: z
        .string()
        .describe('Credential Achievement Type (OBv3 credentialSubject.achievement.type)'),
    achievementName: z
        .string()
        .describe('Credential Achievement Name (OBv3 credentialSubject.achievement.name)'),
    achievementDescription: z
        .string()
        .describe(
            'Credential Achievement Description (OBv3 credentialSubject.achievement.description)'
        ),
    achievementNarrative: z
        .string()
        .describe(
            'Credential Achievement Critera Narrative, aka what you have to do to earn this (OBv3 credentialSubject.achievement.criteria.narrative)'
        ),
});

// Schema for no credential issuance
export const NoCredentialSchema = z.object({
    reason: z
        .string()
        .describe('Reason why no credential should be issued. Please keep this extremely brief'),
});
export const ParsedResumeSchema = z.object({
    work: z.array(
        z.object({
            company: z.string(),
            position: z.string(),
            startDate: z.string().nullable(),
            endDate: z.string().nullable(),
            summary: z.string().nullable(),
        })
    ),
    education: z.array(
        z.object({
            institution: z.string(),
            degree: z.string(),
            fieldOfStudy: z.string(),
            startDate: z.string().nullable(),
            endDate: z.string().nullable(),
        })
    ),
});

export const ParsedCertificateSchema = z.object({
    certificates: z.array(
        z.object({
            certificateName: z.string(),
            issuer: z.string(),
            dateIssued: z.string(), // or z.date() depending on format
            expirationDate: z.string().nullable(),
            description: z.string().nullable(),
        })
    ),
});
export const ParsedDiplomaSchema = z.object({
    institution: z.string(),
    recipient: z.string().nullable(),
    degree: z.string(),
    fieldOfStudy: z.string().nullable(),
    dateAwarded: z.string(),
});
export const AiAssesmentQuestionTypeEnum = z.enum(['text', 'multipleChoice']);
export type AiAssesmentQuestionType = z.infer<typeof AiAssesmentQuestionTypeEnum>;

export const AiAssessmentQuestionValidator = z.object({
    id: z.number(),
    title: z.string().describe('short label for the question (supports markdown)'),
    question: z.string().describe('The full question body (supports markdown)'),
    type: AiAssesmentQuestionTypeEnum,
    choices: z.string().array().nullable().describe('Used only for multiple choice questions'),
});
export type AiAssessmentQuestionType = z.infer<typeof AiAssessmentQuestionValidator>;
export const InsightsArtifactValidator = z.union([
    z.null(),
    z.object({
        category: z.enum([
            'Social Badge',
            'Achievement',
            // "Accomplishment", // ! requires a media attachment
            'Accommodation',
            'Work History',
            'Experience',
            'Learning History',
        ]),

        title: z.string().regex(/^[\p{L}\p{M} ]+$/u, 'Title must contain only letters and spaces'),

        summary: z.string(),

        narrative: z.string(),

        question: z.string(),
    }),
]);

export type InsightsArtifact = z.infer<typeof InsightsArtifactValidator>;
const ExplicitStringSchema = z
    .string()
    .refine(value => value.trim().length > 0, 'Must not be empty');

export const ParsedTranscriptSchema = z
    .object({
        learner: z
            .object({
                name: ExplicitStringSchema.optional(),
                studentId: ExplicitStringSchema.optional(),
            })
            .strict()
            .optional(),
        institution: ExplicitStringSchema,
        program: ExplicitStringSchema.optional(),
        fieldOfStudy: ExplicitStringSchema.optional(),
        dateIssued: ExplicitStringSchema.optional(),
        cumulativeGpa: z.number().finite().nonnegative().optional(),
        courses: z
            .array(
                z
                    .object({
                        courseCode: ExplicitStringSchema.optional(),
                        courseName: ExplicitStringSchema,
                        term: ExplicitStringSchema.optional(),
                        grade: ExplicitStringSchema.optional(),
                        credits: z.number().finite().nonnegative().optional(),
                        completedAt: ExplicitStringSchema.optional(),
                    })
                    .strict()
            )
            .min(1),
        warnings: z.array(ExplicitStringSchema).optional(),
    })
    .strict();

export type ParsedTranscript = z.infer<typeof ParsedTranscriptSchema>;
// Define a roadmap module with module, description, and learning objectives
export const RoadmapModuleValidator = z.object({
    module: z.string().describe('Name of the module or section in the learning roadmap'),
    description: z.string().describe('Brief overview of what this module covers'),
    learningObjectives: z
        .array(z.string())
        .describe('List of concrete learning objectives for this module'),
});

// Structured session plan schema with field descriptions
export const SessionPlanDataValidator = z.object({
    welcome: z.string().describe('Motivational welcome message to introduce the learning session'),
    summary: z.string().describe("Brief summary of user's prior knowledge and the learning gap"),
    skills: z.array(z.string()).describe('List of skills the user will gain from this session'),
    objectives: z.array(z.string()).describe('Key learning objectives for the session'),
    roadmap: z
        .array(RoadmapModuleValidator)
        .describe('Structured modules outlining the learning path'),
});

export type SessionPlanData = z.infer<typeof SessionPlanDataValidator>;
export const EmbeddingTextsSchema = z.object({
    fullText: z
        .string()
        .describe(
            'A human-readable, descriptive narrative summarizing the credential including subject, claims, and context. Use full sentences and natural language.'
        ),
    domainSummary: z
        .string()
        .describe(
            "A domain-focused summary highlighting elements relevant to the credential's domain (education/professional certification/healthcare/etc). Include domain-specific standards, terminologies, or frameworks."
        ),
    keyClaims: z
        .string()
        .describe(
            'Bullet points listing: Subjects, Issuers, Each claim (name and value), Notable dates, Schema references. Capture as key-value pairs.'
        ),
    technicalMetadata: z
        .string()
        .describe(
            'Technical metadata including: DID references, Schema/context URLs, Issuance/expiration dates, Proof suite. Provide as a concise list.'
        ),
    comparisonContext: z
        .string()
        .describe(
            'How this credential relates to others with similar topics. Focus on: Overlapping topics/skills, Prerequisites or follow-ups, Contextual relationship clues. Short paragraph.'
        ),
});
export type CredentialEmbeddingTexts = z.infer<typeof EmbeddingTextsSchema>;
export const TopicMatchingDecisionValidator = z.object({
    useExisting: z
        .boolean()
        .describe('Whether to use an existing topic (true) or create a new one (false)'),
    topicIndex: z
        .number()
        .int()
        .positive()
        .nullable()
        .describe('The one-based index of the existing topic to use when useExisting is true'),
    topicTitle: z
        .string()
        .nullable()
        .describe('The title for a new topic (only if useExisting is false)'),
});
// Zod schema for topics response
export const TopicsSchema = z.object({
    topics: z
        .array(z.string())
        .describe('Array of 5 learning topics that would be interesting and relevant to the user'),
});
export const LearnerContextPromptResponseValidator = z.object({
    prompt: z.string().trim().min(1),
});
export const LearnerCredentialSummaryValidator = z.object({
    summary: z.string().trim().min(1),
});
export const PlanCompletionValidator = z.object({
    complete: z.boolean().describe('Whether the user completed the session plan'),
});
export enum FileUploadTypesEnum {
    Resume = 'resume',
    Certificate = 'certificate',
    Transcript = 'transcript',
    Diploma = 'diploma',
}
export const UnsupportedFileType = 'unsupported' as const;
export const FileClassificationSchema = z.object({
    fileType: z.enum([
        FileUploadTypesEnum.Resume,
        FileUploadTypesEnum.Certificate,
        FileUploadTypesEnum.Transcript,
        FileUploadTypesEnum.Diploma,
        UnsupportedFileType,
    ]),
    confidence: z.number().min(0).max(1),
    reason: z.string(),
});

export type FileClassificationResult = z.infer<typeof FileClassificationSchema>;

export const EmptyGenerationSchema = z.object({});
export const AssessmentQuestionsSchema = AiAssessmentQuestionValidator.array();
export const CredentialIssuanceSchemas: [typeof CredentialSchema, typeof NoCredentialSchema] = [
    CredentialSchema,
    NoCredentialSchema,
];

export type GenerationRole = 'chat' | 'planning' | 'formatting' | 'title';
export type GenerationSchemaEntry = {
    id: string;
    role: GenerationRole;
    source: string;
    schema: z.ZodType | z.ZodType[];
    toolName?: string;
};

// These are the actual production validators, including the exact multi-tool choice.
export const generationSchemaInventory: GenerationSchemaEntry[] = [
    {
        id: 'session-plan',
        role: 'planning',
        source: 'src/websocket/index.ts',
        schema: SessionPlanDataValidator,
    },
    {
        id: 'session-plan-stream',
        role: 'planning',
        source: 'src/websocket/index.ts',
        schema: SessionPlanDataValidator,
        toolName: 'session_plan',
    },
    {
        id: 'transcript',
        role: 'formatting',
        source: 'src/helpers/file.helpers.ts; src/credentials/service.ts',
        schema: ParsedTranscriptSchema,
    },
    { id: 'topics', role: 'formatting', source: 'src/ai/topics.ts', schema: TopicsSchema },
    {
        id: 'embedding-text-generation',
        role: 'title',
        source: 'src/ai/embedding-texts.ts',
        schema: EmbeddingTextsSchema,
    },
    {
        id: 'file-classification',
        role: 'formatting',
        source: 'src/helpers/file.helpers.ts',
        schema: FileClassificationSchema,
    },
    {
        id: 'parsed-resume',
        role: 'formatting',
        source: 'src/helpers/file.helpers.ts',
        schema: ParsedResumeSchema,
    },
    {
        id: 'parsed-certificate',
        role: 'formatting',
        source: 'src/helpers/file.helpers.ts',
        schema: ParsedCertificateSchema,
    },
    {
        id: 'parsed-diploma',
        role: 'formatting',
        source: 'src/helpers/file.helpers.ts',
        schema: ParsedDiplomaSchema,
    },
    {
        id: 'file-fallback-empty-object',
        role: 'formatting',
        source: 'src/helpers/file.helpers.ts',
        schema: EmptyGenerationSchema,
    },
    {
        id: 'assessment-array',
        role: 'planning',
        source: 'src/services/assessment.ts',
        schema: AssessmentQuestionsSchema,
    },
    {
        id: 'credential-issuance-two-tool-choice',
        role: 'chat',
        source: 'src/services/awarding.ts',
        schema: CredentialIssuanceSchemas,
    },
    {
        id: 'summary-credential',
        role: 'chat',
        source: 'src/services/awarding.ts; src/mcp-server/controllers/save-session-summary.ts',
        schema: SummaryCredentialDataValidator,
    },
    {
        id: 'ai-insight',
        role: 'chat',
        source: 'src/services/awarding.ts',
        schema: AIInsightDataValidator,
    },
    {
        id: 'insights-artifact-union',
        role: 'chat',
        source: 'src/services/insightSessions.ts',
        schema: InsightsArtifactValidator,
    },
    {
        id: 'learner-credential-summary',
        role: 'chat',
        source: 'src/services/learnerContextPrompt.ts',
        schema: LearnerCredentialSummaryValidator,
    },
    {
        id: 'learner-context-prompt',
        role: 'chat',
        source: 'src/services/learnerContextPrompt.ts',
        schema: LearnerContextPromptResponseValidator,
    },
    {
        id: 'topic-matching',
        role: 'chat',
        source: 'src/mcp-server/controllers/save-session-summary.ts',
        schema: TopicMatchingDecisionValidator,
    },
    {
        id: 'plan-completion',
        role: 'chat',
        source: 'src/websocket/index.ts',
        schema: PlanCompletionValidator,
    },
];
