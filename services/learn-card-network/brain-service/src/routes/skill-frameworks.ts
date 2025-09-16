import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute } from '@routes';

import { FlatSkillFrameworkType, SkillFrameworkValidator } from 'types/skill-framework';
import { upsertSkillFrameworkFromProvider } from '@accesslayer/skill-framework/create';
import {
    listSkillFrameworksManagedByProfile,
    doesProfileManageFramework,
} from '@accesslayer/skill-framework/read';
import { getSkillsProvider } from '@services/skills-provider';
import { SkillValidator } from 'types/skill';

// Link an existing provider framework to the caller's profile (mirror minimal fields locally)
export const LinkProviderFrameworkInputValidator = z.object({
    frameworkId: z.string(),
});

export type LinkProviderFrameworkInputType = z.infer<typeof LinkProviderFrameworkInputValidator>;

export const skillFrameworksRouter = t.router({
    create: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/skills/frameworks',
                tags: ['Skills'],
                summary: 'Link Skill Framework',
                description:
                    'Links an existing provider framework to the caller and mirrors minimal metadata locally',
            },
            requiredScope: 'skills:write',
        })
        .input(LinkProviderFrameworkInputValidator)
        .output(SkillFrameworkValidator)
        .mutation(async ({ ctx, input }): Promise<FlatSkillFrameworkType> => {
            const profileId = ctx.user.profile.profileId;
            const provider = getSkillsProvider();
            const providerFw = await provider.getFrameworkById(input.frameworkId);
            if (!providerFw)
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Framework not found in provider',
                });

            const linked = await upsertSkillFrameworkFromProvider(profileId, providerFw);
            return linked;
        }),

    listMine: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/skills/frameworks',
                tags: ['Skills'],
                summary: 'List Skill Frameworks I manage',
                description: 'Lists frameworks directly managed by the caller',
            },
            requiredScope: 'skills:read',
        })
        .input(z.void())
        .output(SkillFrameworkValidator.array())
        .query(async ({ ctx }): Promise<FlatSkillFrameworkType[]> => {
            const profileId = ctx.user.profile.profileId;
            return listSkillFrameworksManagedByProfile(profileId);
        }),

    getById: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/skills/frameworks/{id}',
                tags: ['Skills'],
                summary: 'Get Skill Framework with skills',
                description:
                    'Returns a framework and its skills from the configured provider (flat list with parent references)',
            },
            requiredScope: 'skills:read',
        })
        .input(z.object({ id: z.string() }))
        .output(
            z.object({
                framework: SkillFrameworkValidator,
                skills: z.array(SkillValidator.omit({ createdAt: true, updatedAt: true })),
            })
        )
        .query(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;
            const manages = await doesProfileManageFramework(profileId, input.id);
            if (!manages)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage this framework',
                });

            const provider = getSkillsProvider();
            const fw = await provider.getFrameworkById(input.id);
            if (!fw) throw new TRPCError({ code: 'NOT_FOUND' });
            const skills = await provider.getSkillsForFramework(input.id);

            return {
                framework: {
                    id: fw.id,
                    name: fw.name,
                    description: fw.description,
                    sourceURI: fw.sourceURI,
                    status: 'active' as const,
                } as FlatSkillFrameworkType,
                skills: skills.map(s => ({
                    id: s.id,
                    statement: s.statement,
                    description: s.description,
                    code: s.code,
                    type: s.type ?? 'skill',
                    status: s.status === 'archived' ? 'archived' : 'active',
                    parentId: s.parentId ?? undefined,
                })),
            };
        }),
});

export type SkillFrameworksRouter = typeof skillFrameworksRouter;
