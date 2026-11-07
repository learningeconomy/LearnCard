import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import {
    BedrockSchemaError,
    compileBedrockSchema,
    parseBedrockOutput,
    validateBedrockJsonSchema,
} from './bedrock-schema';
import { AiProviderError } from './errors';
import {
    AIInsightDataValidator,
    AssessmentQuestionsSchema,
    CredentialSchema,
    CredentialIssuanceSchemas,
    EmbeddingTextsSchema,
    EmptyGenerationSchema,
    FileClassificationSchema,
    ParsedCertificateSchema,
    ParsedDiplomaSchema,
    ParsedResumeSchema,
    ParsedTranscriptSchema,
    PlanCompletionValidator,
    SessionPlanDataValidator,
    SummaryCredentialDataValidator,
    TopicsSchema,
    generationSchemaInventory,
} from './generation-schemas';

const keywords = {
    occupations: null,
    careers: ['Educator'],
    jobs: null,
    skills: ['Fractions'],
    fieldOfStudy: null,
};
const credential = {
    boostName: 'Fractions',
    achievementId: 'Achievement',
    achievementType: 'Achievement',
    achievementName: 'Adding fractions',
    achievementDescription: 'Added fractions with a shared denominator',
    achievementNarrative: 'Explained the common denominator',
};
const plan = {
    welcome: 'Practice fractions',
    summary: 'Adding halves',
    skills: ['Addition'],
    objectives: ['Add halves'],
    roadmap: [
        {
            module: 'Halves',
            description: 'Practice addition',
            learningObjectives: ['Two halves make one'],
        },
    ],
};

describe('production Bedrock schema behavior', () => {
    it('validates nested plans and rejects missing required learning objectives', async () => {
        const schema = compileBedrockSchema(SessionPlanDataValidator, 'us.openai.gpt-6-luna');
        expect(schema.additionalProperties).toBe(false);
        expect(await parseBedrockOutput(plan, SessionPlanDataValidator)).toEqual(plan);
        await expect(
            parseBedrockOutput(
                { ...plan, roadmap: [{ module: 'Halves', description: 'Practice' }] },
                SessionPlanDataValidator
            )
        ).rejects.toBeInstanceOf(z.ZodError);
    });

    it('preserves both credential choices and applies the original achievement ID transform', async () => {
        const schemas = CredentialIssuanceSchemas.map(schema =>
            compileBedrockSchema(schema, 'us.openai.gpt-6-luna')
        );
        expect(schemas[0].properties).toMatchObject({ achievementId: { type: 'string' } });
        expect(schemas[1].properties).toMatchObject({ reason: { type: 'string' } });
        expect(await parseBedrockOutput(credential, CredentialSchema)).toEqual({
            ...credential,
            achievementId: 'https://docs.learncard.com/definitions#Achievement',
        });
        expect(
            await parseBedrockOutput(
                { reason: 'No demonstrated learning' },
                CredentialIssuanceSchemas[1]
            )
        ).toEqual({ reason: 'No demonstrated learning' });
        await expect(
            parseBedrockOutput({ reason: 'Not a credential' }, CredentialIssuanceSchemas[0])
        ).rejects.toBeInstanceOf(z.ZodError);
        await expect(
            parseBedrockOutput(credential, CredentialIssuanceSchemas[1])
        ).rejects.toBeInstanceOf(z.ZodError);
    });

    it('preserves nested nullable keyword arrays in summaries and insights', async () => {
        const summary = {
            title: 'Fractions',
            summary: 'Added halves',
            learned: ['Common denominators'],
            skills: [{ title: 'Addition', description: 'Add halves' }],
            nextSteps: [{ title: 'Thirds', description: 'Try thirds', keywords }],
            reflections: [],
        };
        const area = { title: 'Addition', summary: 'Added halves', keywords };
        const insight = {
            strongestArea: area,
            weakestArea: area,
            roomForGrowth: area,
            generalSummary: 'Practice fractions',
            suggestedPathways: [],
        };
        compileBedrockSchema(SummaryCredentialDataValidator, 'us.openai.gpt-6-luna');
        compileBedrockSchema(AIInsightDataValidator, 'us.openai.gpt-6-luna');
        expect(await parseBedrockOutput(summary, SummaryCredentialDataValidator)).toEqual(summary);
        expect(await parseBedrockOutput(insight, AIInsightDataValidator)).toEqual(insight);
        await expect(
            parseBedrockOutput(
                { ...insight, strongestArea: { ...area, keywords: { ...keywords, skills: [2] } } },
                AIInsightDataValidator
            )
        ).rejects.toBeInstanceOf(z.ZodError);
    });

    it.each([
        [TopicsSchema, { topics: ['Fractions'] }, { topics: [false] }],
        [
            EmbeddingTextsSchema,
            {
                fullText: 'facts',
                domainSummary: 'math',
                keyClaims: 'fractions',
                technicalMetadata: 'context',
                comparisonContext: 'addition',
            },
            { fullText: 'facts' },
        ],
        [
            ParsedResumeSchema,
            {
                work: [
                    {
                        company: 'School',
                        position: 'Tutor',
                        startDate: null,
                        endDate: null,
                        summary: null,
                    },
                ],
                education: [],
            },
            { work: [{ company: 'School' }], education: [] },
        ],
        [
            ParsedCertificateSchema,
            {
                certificates: [
                    {
                        certificateName: 'Math',
                        issuer: 'School',
                        dateIssued: '2026',
                        expirationDate: null,
                        description: null,
                    },
                ],
            },
            { certificates: [{ certificateName: 'Math', issuer: 'School', dateIssued: '2026' }] },
        ],
        [
            ParsedDiplomaSchema,
            {
                institution: 'School',
                recipient: null,
                degree: 'Math',
                fieldOfStudy: null,
                dateAwarded: '2026',
            },
            { institution: 'School', degree: 'Math', dateAwarded: '2026' },
        ],
        [PlanCompletionValidator, { complete: false }, { complete: 'false' }],
    ] as [z.ZodType, unknown, unknown][])(
        'accepts production values and rejects consumer-visible type/required violations',
        async (schema, valid, invalid) => {
            compileBedrockSchema(schema, 'us.openai.gpt-6-luna');
            expect(await parseBedrockOutput(valid, schema)).toEqual(valid);
            await expect(parseBedrockOutput(invalid, schema)).rejects.toBeInstanceOf(z.ZodError);
        }
    );

    it('wraps the real assessment array without changing nullable choices or enum validation', async () => {
        const wrapped = z.object({ args: AssessmentQuestionsSchema });
        const compiled = compileBedrockSchema(wrapped, 'us.openai.gpt-6-luna');
        expect(compiled.properties).toMatchObject({
            args: {
                type: 'array',
                items: {
                    properties: {
                        type: { type: 'string', enum: ['text', 'multipleChoice'] },
                        choices: {
                            anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }],
                        },
                    },
                },
            },
        });
        const question = {
            id: 1,
            title: 'Halves',
            question: 'How many halves?',
            type: 'text',
            choices: null,
        };
        expect(await parseBedrockOutput([question], AssessmentQuestionsSchema)).toEqual([question]);
        await expect(
            parseBedrockOutput([{ ...question, type: 'unknown' }], AssessmentQuestionsSchema)
        ).rejects.toBeInstanceOf(z.ZodError);
        expect(await parseBedrockOutput({}, EmptyGenerationSchema)).toEqual({});
        expect(compileBedrockSchema(EmptyGenerationSchema, 'us.openai.gpt-6-luna')).toMatchObject({
            type: 'object',
            properties: {},
            additionalProperties: false,
        });
    });

    it.each([
        [
            FileClassificationSchema,
            { fileType: 'transcript', confidence: 0.75, reason: 'Courses' },
            { fileType: 'transcript', confidence: 1.01, reason: 'Courses' },
        ],
        [
            ParsedTranscriptSchema,
            { institution: 'School', courses: [{ courseName: 'Math', credits: 3 }] },
            { institution: ' ', courses: [{ courseName: 'Math', credits: 3 }] },
        ],
    ] as [z.ZodType, unknown, unknown][])(
        'projects refined Luna structures while rejecting invalid decoded values',
        async (schema, valid, invalid) => {
            validateBedrockJsonSchema(compileBedrockSchema(schema, 'us.openai.gpt-6-luna'));
            expect(await parseBedrockOutput(valid, schema)).toEqual(valid);
            await expect(parseBedrockOutput(invalid, schema)).rejects.toBeInstanceOf(z.ZodError);
        }
    );

    it.each(
        generationSchemaInventory.filter(
            entry => entry.role === 'chat' || entry.role === 'planning'
        )
    )('keeps every Sol-owned schema blocked before provider serialization', entry => {
        const schemas = Array.isArray(entry.schema) ? entry.schema : [entry.schema];
        for (const schema of schemas)
            expect(() => compileBedrockSchema(schema, 'us.openai.gpt-6.1-sol')).toThrow(
                AiProviderError
            );
    });

    it('preserves every transcript predicate, numeric boundary and supported course cardinality', async () => {
        const compiled = compileBedrockSchema(ParsedTranscriptSchema, 'us.openai.gpt-6-luna');
        expect(compiled.required).toEqual(['institution', 'courses']);
        expect(compiled.properties).toMatchObject({
            institution: { type: 'string' },
            cumulativeGpa: { type: 'number' },
            courses: {
                type: 'array',
                minItems: 1,
                items: {
                    required: ['courseName'],
                    additionalProperties: false,
                    properties: { courseName: { type: 'string' }, credits: { type: 'number' } },
                },
            },
        });
        const valid = {
            learner: { name: 'Learner', studentId: '42' },
            institution: 'School',
            program: 'Math',
            fieldOfStudy: 'Numbers',
            dateIssued: '2026',
            cumulativeGpa: 3,
            courses: [
                {
                    courseCode: 'M1',
                    courseName: 'Fractions',
                    term: 'Fall',
                    grade: 'A',
                    credits: 3,
                    completedAt: '2026',
                },
            ],
            warnings: ['Missing semester'],
        };
        expect(await parseBedrockOutput(valid, ParsedTranscriptSchema)).toEqual(valid);
        for (const field of ['institution', 'program', 'fieldOfStudy', 'dateIssued']) {
            await expect(
                parseBedrockOutput({ ...valid, [field]: ' ' }, ParsedTranscriptSchema)
            ).rejects.toBeInstanceOf(z.ZodError);
        }
        for (const field of ['name', 'studentId']) {
            await expect(
                parseBedrockOutput(
                    { ...valid, learner: { ...valid.learner, [field]: ' ' } },
                    ParsedTranscriptSchema
                )
            ).rejects.toBeInstanceOf(z.ZodError);
        }
        for (const field of ['courseCode', 'courseName', 'term', 'grade', 'completedAt']) {
            await expect(
                parseBedrockOutput(
                    { ...valid, courses: [{ ...valid.courses[0], [field]: ' ' }] },
                    ParsedTranscriptSchema
                )
            ).rejects.toBeInstanceOf(z.ZodError);
        }
        for (const invalid of [
            { ...valid, cumulativeGpa: -1 },
            { ...valid, courses: [{ ...valid.courses[0], credits: -1 }] },
            { ...valid, courses: [] },
            { ...valid, warnings: [' '] },
            { ...valid, learner: { ...valid.learner, extra: 'unexpected' } },
        ]) {
            await expect(
                parseBedrockOutput(invalid, ParsedTranscriptSchema)
            ).rejects.toBeInstanceOf(z.ZodError);
        }
    });
});

describe('Bedrock subset boundaries', () => {
    it('preserves optional omission separately from null and enforces strict nested objects', async () => {
        const schema = z
            .object({
                label: z.string().optional(),
                nullable: z.string().nullable(),
                nested: z
                    .array(z.object({ value: z.union([z.literal('ready'), z.null()]) }).strict())
                    .min(1),
            })
            .strict();
        const compiled = compileBedrockSchema(schema, 'us.openai.gpt-6-luna');
        expect(compiled.required).toEqual(['nullable', 'nested']);
        expect(compiled.properties).toMatchObject({
            label: { type: 'string' },
            nullable: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            nested: { minItems: 1 },
        });
        const valid = { nullable: null, nested: [{ value: 'ready' }, { value: null }] };
        expect(await parseBedrockOutput(valid, schema)).toEqual(valid);
        await expect(parseBedrockOutput({ ...valid, label: null }, schema)).rejects.toBeInstanceOf(
            z.ZodError
        );
        await expect(parseBedrockOutput({ ...valid, nested: [] }, schema)).rejects.toBeInstanceOf(
            z.ZodError
        );
        await expect(
            parseBedrockOutput({ ...valid, nested: [{ value: 'ready', unexpected: true }] }, schema)
        ).rejects.toBeInstanceOf(z.ZodError);
    });

    it('serializes input transforms while returning the original async postparse result', async () => {
        const schema = z.object({
            amount: z.string().transform(async value => Number(value)),
            label: z.string().trim(),
        });
        expect(compileBedrockSchema(schema, 'us.openai.gpt-6-luna').properties).toEqual({
            amount: { type: 'string' },
            label: { type: 'string' },
        });
        expect(await parseBedrockOutput({ amount: '12', label: ' lesson ' }, schema)).toEqual({
            amount: 12,
            label: 'lesson',
        });
        await expect(
            parseBedrockOutput({ amount: 12, label: 'lesson' }, schema)
        ).rejects.toBeInstanceOf(z.ZodError);
    });

    it.each([
        [
            z.object({ value: z.string().refine(async value => value === 'accepted') }),
            { value: 'accepted' },
            { value: 'rejected' },
        ],
        [
            z.object({ value: z.string() }).superRefine((value, context) => {
                if (value.value !== 'accepted')
                    context.addIssue({ code: 'custom', message: 'private predicate detail' });
            }),
            { value: 'accepted' },
            { value: 'rejected' },
        ],
        [
            z
                .string()
                .transform(value => value.trim())
                .pipe(z.string().refine(value => value === 'accepted')),
            'accepted',
            'rejected',
        ],
        [
            z
                .array(z.string().refine(value => value === 'accepted'))
                .nullable()
                .optional(),
            ['accepted'],
            ['rejected'],
        ],
    ] as [z.ZodType, unknown, unknown][])(
        'retains custom async, nested and output-pipeline predicates after projecting provider structure',
        async (schema, valid, invalid) => {
            validateBedrockJsonSchema(compileBedrockSchema(schema, 'us.openai.gpt-6-luna'));
            expect(await parseBedrockOutput(valid, schema)).toEqual(valid);
            await expect(parseBedrockOutput(invalid, schema)).rejects.toBeInstanceOf(z.ZodError);
        }
    );

    it.each([
        [z.string().min(1), 'lesson', ''],
        [z.string().max(3), 'yes', 'longer'],
        [z.string().regex(/^lesson$/u), 'lesson', 'other'],
        [z.number().min(0), 0, -1],
        [z.number().max(1), 1, 2],
        [z.number().multipleOf(2), 2, 3],
        [z.array(z.string()).min(2), ['a', 'b'], ['a']],
        [z.array(z.string()).max(2), ['a', 'b'], ['a', 'b', 'c']],
        [z.number().int().positive(), 1, 1.5],
    ] as [z.ZodType, unknown, unknown][])(
        'omits only nonportable provider constraints and enforces original value boundaries',
        async (schema, valid, invalid) => {
            validateBedrockJsonSchema(compileBedrockSchema(schema, 'us.openai.gpt-6-luna'));
            expect(await parseBedrockOutput(valid, schema)).toEqual(valid);
            await expect(parseBedrockOutput(invalid, schema)).rejects.toBeInstanceOf(z.ZodError);
        }
    );

    it.each([
        z.object({}).passthrough(),
        z.preprocess(value => String(value), z.string()),
        z.unknown(),
        z.custom(() => true),
        z.date(),
        z.coerce.string(),
    ])('rejects domains without safely representable provider structure', schema => {
        expect(() => compileBedrockSchema(schema, 'us.openai.gpt-6-luna')).toThrow(
            BedrockSchemaError
        );
    });

    it('preserves supported formats and integer types while enforcing output-side pipeline constraints', async () => {
        const fields = z.object({ email: z.email(), index: z.number().int().positive() });
        expect(compileBedrockSchema(fields, 'us.openai.gpt-6-luna').properties).toEqual({
            email: { type: 'string', format: 'email' },
            index: { type: 'integer' },
        });
        await expect(
            parseBedrockOutput({ email: 'not-an-email', index: 1 }, fields)
        ).rejects.toBeInstanceOf(z.ZodError);
        await expect(
            parseBedrockOutput(
                { email: 'learner@example.com', index: Number.MAX_SAFE_INTEGER + 1 },
                fields
            )
        ).rejects.toBeInstanceOf(z.ZodError);
        const pipeline = z.string().transform(Number).pipe(z.number().min(0));
        expect(compileBedrockSchema(pipeline, 'us.openai.gpt-6-luna')).toMatchObject({
            type: 'string',
        });
        expect(await parseBedrockOutput('2', pipeline)).toBe(2);
        await expect(parseBedrockOutput('-1', pipeline)).rejects.toBeInstanceOf(z.ZodError);
    });

    it('supports escaped nonrecursive internal references and limited scalar allOf', () => {
        const compiled = {
            $defs: { 'a/b~c': { type: 'string', format: 'uuid' } },
            type: 'object',
            properties: {
                id: { $ref: '#/$defs/a~1b~0c' },
                choice: {
                    allOf: [
                        { type: 'string', enum: ['yes', 'no'] },
                        { type: 'string', const: 'yes' },
                    ],
                },
            },
            additionalProperties: false,
            required: ['id'],
        };
        validateBedrockJsonSchema(compiled);
        expect(() =>
            validateBedrockJsonSchema({
                ...compiled,
                properties: { id: { $ref: '#/$defs/missing' } },
            })
        ).toThrow('unresolved internal reference');
    });

    it.each([
        [{ $defs: { a: { $ref: '#/$defs/a' } }, $ref: '#/$defs/a' }, 'recursive'],
        [
            { $defs: { a: { $ref: '#/$defs/b' }, b: { $ref: '#/$defs/a' } }, $ref: '#/$defs/a' },
            'recursive',
        ],
        [{ $ref: 'https://example.com/schema' }, 'only internal'],
        [{ type: 'object', properties: {}, additionalProperties: true }, 'additional properties'],
        [{ type: 'number', minimum: 0 }, 'keyword'],
        [{ type: 'string', pattern: 'lesson' }, 'keyword'],
        [{ type: 'string', format: 'password' }, 'format'],
        [{ type: 'array', items: { type: 'string' }, minItems: 2 }, 'minItems'],
        [{ allOf: [{ type: 'object', properties: {}, additionalProperties: false }] }, 'allOf'],
        [
            {
                type: 'object',
                properties: { id: { type: 'string' } },
                required: ['missing'],
                additionalProperties: false,
            },
            'required',
        ],
        [{ type: 'toString' }, 'basic type'],
        [{ enum: [{}] }, 'scalar'],
    ] as [unknown, string][])(
        'rejects invalid references and unsupported JSON Schema features',
        (schema, reason) => {
            expect(() => validateBedrockJsonSchema(schema)).toThrow(reason);
        }
    );

    it('rejects cyclic Zod and direct cyclic JSON Schema graphs', () => {
        const recursive: z.ZodType = z.lazy(() => z.object({ child: recursive.optional() }));
        expect(() => compileBedrockSchema(recursive, 'us.openai.gpt-6-luna')).toThrow('recursive');
        const recursiveJson: Record<string, unknown> = {
            type: 'object',
            additionalProperties: false,
        };
        recursiveJson.properties = { child: recursiveJson };
        expect(() => validateBedrockJsonSchema(recursiveJson)).toThrow('recursive');
    });
});
