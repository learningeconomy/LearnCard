import { environment } from '@environment';
import OpenAI from 'openai';
import { createBedrockClient, generateStructuredOutput } from '@helpers/bedrockGeneration';
import { z } from 'zod';

import { t, didAndChallengeRoute } from '@routes';
import { TRPCError } from '@trpc/server';

import * as filestack from 'filestack-js';
import { BoostSkillHierarchy, BoostSkillHierarchyValidator } from 'types/skills';
import {
    aiLocaleInstruction,
    aiSkillsHierarchyRule,
    aiTitleCharsetRule,
} from '@helpers/aiLocale.helpers';
const client = filestack.init('A7RsW3VzfSNO2TCsFJ6Eiz');

export enum BoostCategoryOptionsEnum {
    socialBadge = 'Social Badge',
    achievement = 'Achievement',
    course = 'Course',
    // job = 'Job',
    id = 'ID',
    workHistory = 'Work History',
    // currency = 'Currency',
    learningHistory = 'Learning History',
    // skill = 'Skill',
    // membership = 'Membership',
    accomplishment = 'Accomplishment',
    accommodation = 'Accommodation',
    // describe = 'Describe',
}
export const BoostCategoryOptionsEnumValidator = z.nativeEnum(BoostCategoryOptionsEnum);

export enum BoostTypeOptionsEnum {
    certificate = 'Certificate',
    // endorsement = 'Endorsement',
    badge = 'Badge',
    // award = 'Award',
    // diploma = 'Diploma',
    // degree = 'Degree',
    // license = 'License',
    // membership = 'Membership',
    // accreditation = 'Accreditation',
    id = 'ID',
}
export const BoostTypeOptionsEnumValidator = z.nativeEnum(BoostTypeOptionsEnum);

const transformLLMResultToOutputShape = (result: BoostSkillHierarchy): BoostSkills[] => {
    return Object.entries(result).flatMap(([category, skills]) =>
        skills.map(({ skill, subskills }) => ({
            category: category,
            skill,
            subskills,
        }))
    );
};

export const BoostSkillsValidator = z.object({
    category: z.string(),
    skill: z.string(),
    subskills: z.array(z.string()),
});

export type BoostSkills = z.infer<typeof BoostSkillsValidator>;

const AIResponseValidator = z.object({
    title: z.string(),
    description: z.string(),
    category: BoostCategoryOptionsEnumValidator,
    type: BoostTypeOptionsEnumValidator,
    narrative: z.string(),
});

// Map of skill name => single unicode emoji character
const IconMapValidator = z.record(
    z.string().min(1),
    // Single emoji character (we accept any non-empty string; downstream can further validate)
    z.string().min(1).max(8)
);

// Required-function output schema: object-wrapped list.
// We'll convert this into the IconMapValidator shape before returning
const IconListContainerValidator = z.object({
    items: z.array(
        z.object({
            name: z.string().min(1),
            icon: z.string().min(1).max(8),
        })
    ),
});

const openai = environment.OPENAI_API_KEY
    ? new OpenAI({ apiKey: environment.OPENAI_API_KEY })
    : undefined;

let generationClient: OpenAI | undefined;
const getGenerationClient = (): OpenAI =>
    (generationClient ??= createBedrockClient(environment.BEDROCK_BASE_URL));

export const aiRouter = t.router({
    generateBoostInfo: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/ai/generate-boost-info',
                tags: ['AI'],
                summary: 'Generate Boost Info',
                description:
                    'This route generates a title, description, category, type, skills, and narrative for a boost based on an arbitrary description',
            },
        })
        .input(z.object({ description: z.string().nonempty(), locale: z.string().optional() }))
        .output(AIResponseValidator)
        .query(async ({ input }) => {
            const { description } = input;

            return generateStructuredOutput(getGenerationClient(), {
                task: 'reasoning',
                instructions:
                    `Generate a title ${aiTitleCharsetRule(
                        input.locale
                    )} with a maximum length of 24 characters and separate words with spaces if there is more than one, description, category, type, and narrative for a boost based on an arbitrary description. The narrative is no longer than 300 characters and answers the question "How do you earn this boost?"\n\nStrict constraints:\n- category MUST be EXACTLY one of: "Social Badge", "Achievement", "Course", "ID", "Work History", "Learning History", "Accomplishment", "Accommodation". Use exact casing and spelling; do NOT invent other categories.\n- type MUST be EXACTLY one of: "Certificate", "Badge", "ID". Use exact casing and spelling; do NOT invent other types.\n\nOutput requirements:\n- Return ONLY a JSON object with the keys "title", "description", "category", "type", and "narrative".\n- Do not include explanations, markdown, or extra fields.\n- Ensure the JSON parses without code fences.` +
                    aiLocaleInstruction(input.locale),
                input: description,
                schema: AIResponseValidator,
            });
        }),

    generateBoostSkills: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/ai/generate-boost-skills',
                tags: ['AI'],
                summary: 'Generate Boost Skills',
                description: 'This route generates skills for a boost based on a description',
            },
        })
        .input(z.object({ description: z.string().nonempty() }))
        .output(z.array(BoostSkillsValidator))
        .query(async ({ input }) => {
            const { description } = input;

            const parsedResponse = await generateStructuredOutput(getGenerationClient(), {
                task: 'reasoning',
                instructions: `Generate *NO MORE THAN 3* skills for the provided description about a boost that matches the given skills hierarchy. ${aiSkillsHierarchyRule}`,
                input: description,
                schema: BoostSkillHierarchyValidator,
            });
            return transformLLMResultToOutputShape(parsedResponse);
        }),

    generateSkillIcons: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/ai/generate-skill-icons',
                tags: ['AI'],
                summary: 'Generate Skill Icons',
                description:
                    'Given a list of skill names, returns a mapping of each name to a single unicode emoji that best represents it. No skin tones, flags, or multi-character sequences.',
            },
        })
        .input(z.object({ names: z.array(z.string().nonempty()).min(1) }))
        .output(IconMapValidator)
        .query(async ({ input }) => {
            const { names } = input;

            const systemPrompt = `You are assigning a single, standard Unicode emoji to represent each skill name.
Rules:
- Output exactly one emoji character per skill.
- Use generic, non-skin-tone, non-flag emojis (no regional indicator flags, no skin tone modifiers).
- Prefer clear semantic matches; if unsure, choose a sensible generic symbol like a circle or star.
- Return ONLY a JSON object with an "items" array of objects, where each object has the exact input name and the chosen emoji, e.g. {"items":[{"name":"Skill A","icon":"🎯"}]}.`;

            const userContent = `Skill names:\n${names
                .map(n => `- ${n}`)
                .join(
                    '\n'
                )}\n\nReturn a JSON object of the form { items: [{ name, icon }] } for these names.`;

            const parsed = await generateStructuredOutput(getGenerationClient(), {
                task: 'formatting',
                instructions: systemPrompt,
                input: userContent,
                schema: IconListContainerValidator,
            });

            // Transform into a record mapping input names to icons
            const record: Record<string, string> = {};
            for (const { name, icon } of parsed.items) {
                // Only include keys that were requested
                if (names.includes(name)) record[name] = icon;
            }

            // Ensure we return all requested names; if missing, fill with a generic symbol
            for (const n of names) {
                if (!record[n]) record[n] = '⭐';
            }

            return IconMapValidator.parseAsync(record);
        }),

    generateImage: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/ai/generate-image',
                tags: ['AI'],
                summary: 'Generate Boost Info',
                description: 'This route generates an image based on an arbitrary prompt',
            },
        })
        .input(z.object({ prompt: z.string().nonempty() }))
        .output(
            z.object({
                url: z.string(),
            })
        )
        .query(async ({ input, ctx }) => {
            const {
                user: { did },
            } = ctx;
            if (!openai) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'No OpenAI Key Set',
                });
            }

            const { prompt } = input;
            const res = await openai.images.generate({
                prompt,
                model: 'dall-e-3',
                size: '1024x1024',
                user: did,
            });

            if (!res.data || !res.data[0]?.url) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'No image URL returned from OpenAI',
                });
            }

            const filestackRes = await client.storeURL(res.data[0].url);
            if (!filestackRes || !filestackRes.url) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to store image URL',
                });
            }

            return {
                url: filestackRes.url,
            };
        }),
});

export type AiRouter = typeof aiRouter;
