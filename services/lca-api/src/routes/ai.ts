import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

import { t, didAndChallengeRoute } from '@routes';
import { TRPCError } from '@trpc/server';

import * as filestack from 'filestack-js';
import { BoostSkillHierarchy, BoostSkillHierarchyValidator } from 'types/skills';
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
    narrative: z.string().optional(),
});

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : undefined;

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
        .input(z.object({ description: z.string().nonempty() }))
        .output(AIResponseValidator)
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

            const { description } = input;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-2024-08-06',
                messages: [
                    {
                        role: 'system',
                        content:
                            'Generate a title using only letters A-Z with a maximum length of 24 characters and separate words with spaces if there is more than one, description, category, type, and narrative for a boost based on an arbitrary description. The narrative is no longer than 300 characters and answers the question "How do you earn this boost?',
                    },
                    { role: 'user', content: description },
                ],
                response_format: zodResponseFormat(AIResponseValidator, 'info'),
                user: did,
            });

            const response = JSON.parse(completion.choices[0]?.message.content ?? '');

            return AIResponseValidator.parseAsync(response);
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

            const { description } = input;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-2024-08-06',
                messages: [
                    {
                        role: 'system',
                        content:
                            'Generate *NO MORE THAN 3* skills for the provided description about a boost that matches the given skills hierarchy',
                    },
                    { role: 'user', content: description },
                ],
                response_format: zodResponseFormat(BoostSkillHierarchyValidator, 'skills'),
                user: did,
            });

            const response = JSON.parse(completion.choices[0]?.message.content ?? '');

            const parsedResponse = await BoostSkillHierarchyValidator.parseAsync(response);

            return transformLLMResultToOutputShape(parsedResponse);
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

            const filestackRes = (await client.storeURL(res?.data[0]?.url)) as any;
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
