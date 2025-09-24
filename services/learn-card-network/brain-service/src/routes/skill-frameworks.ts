import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute } from '@routes';

import {
    SkillFrameworkType,
    SkillFrameworkValidator,
    LinkProviderFrameworkInputValidator,
    CreateManagedFrameworkInputValidator,
    CreateManagedFrameworkBatchInputValidator,
    UpdateFrameworkInputValidator,
    DeleteFrameworkInputValidator,
} from '@learncard/types';
import {
    upsertSkillFrameworkFromProvider,
    createSkillFramework as createSkillFrameworkNode,
} from '@accesslayer/skill-framework/create';
import {
    listSkillFrameworksManagedByProfile,
    doesProfileManageFramework,
    getFrameworkWithSkills,
    buildSkillTree,
    type SkillNode,
} from '@accesslayer/skill-framework/read';
import {
    updateSkillFramework as updateSkillFrameworkNode,
    deleteSkillFramework as deleteSkillFrameworkNode,
} from '@accesslayer/skill-framework/update';
import { getSkillsProvider } from '@services/skills-provider';
import { SkillTreeNodeValidator } from 'types/skill-tree';
import { createSkill } from '@accesslayer/skill/create';
import { createSkillTree, type SkillTreeInput } from './skill-inputs';

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
        .mutation(async ({ ctx, input }): Promise<SkillFrameworkType> => {
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

    createManaged: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/skills/frameworks/custom',
                tags: ['Skills'],
                summary: 'Create and manage a custom skill framework',
                description:
                    'Creates a new skill framework directly in the LearnCard Network and assigns the caller as a manager.',
            },
            requiredScope: 'skills:write',
        })
        .input(CreateManagedFrameworkInputValidator)
        .output(SkillFrameworkValidator)
        .mutation(async ({ ctx, input }): Promise<SkillFrameworkType> => {
            const profileId = ctx.user.profile.profileId;
            const { skills: initialSkills, ...frameworkInput } = input;
            const created = await createSkillFrameworkNode(profileId, frameworkInput);

            const provider = getSkillsProvider();
            await provider.createFramework?.({
                id: created.id,
                name: created.name,
                description: created.description,
                sourceURI: created.sourceURI,
                status: created.status,
            });

            await seedFrameworkSkills(created.id, initialSkills, provider);

            return created;
        }),

    createManagedBatch: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/skills/frameworks/custom/batch',
                tags: ['Skills'],
                summary: 'Create multiple custom skill frameworks',
                description:
                    'Creates multiple custom frameworks (optionally with initial skills) and assigns the caller as their manager.',
            },
            requiredScope: 'skills:write',
        })
        .input(CreateManagedFrameworkBatchInputValidator)
        .output(SkillFrameworkValidator.array())
        .mutation(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;
            const provider = getSkillsProvider();

            const createdFrameworks: SkillFrameworkType[] = [];

            for (const frameworkInput of input.frameworks) {
                const { skills: initialSkills, ...frameworkPayload } = frameworkInput;
                const created = await createSkillFrameworkNode(profileId, frameworkPayload);

                await provider.createFramework?.({
                    id: created.id,
                    name: created.name,
                    description: created.description,
                    sourceURI: created.sourceURI,
                    status: created.status,
                });

                await seedFrameworkSkills(created.id, initialSkills, provider);

                createdFrameworks.push(created);
            }

            return createdFrameworks;
        }),

    update: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'PATCH',
                path: '/skills/frameworks/{id}',
                tags: ['Skills'],
                summary: 'Update a managed skill framework',
                description: 'Updates metadata for a framework managed by the caller.',
            },
            requiredScope: 'skills:write',
        })
        .input(UpdateFrameworkInputValidator)
        .output(SkillFrameworkValidator)
        .mutation(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;
            const { id, ...updates } = input;
            const updated = await updateSkillFrameworkNode(profileId, id, updates);

            const provider = getSkillsProvider();
            if (Object.keys(updates).length > 0) {
                await provider.updateFramework?.(id, updates);
            }

            return updated;
        }),

    delete: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/skills/frameworks/{id}',
                tags: ['Skills'],
                summary: 'Delete a managed skill framework',
                description:
                    'Deletes a framework and its associated skills. Only available to managers of the framework.',
            },
            requiredScope: 'skills:write',
        })
        .input(DeleteFrameworkInputValidator)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;
            const result = await deleteSkillFrameworkNode(profileId, input.id);

            const provider = getSkillsProvider();
            await provider.deleteFramework?.(input.id);

            return result;
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
        .query(async ({ ctx }): Promise<SkillFrameworkType[]> => {
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
                    'Returns a framework and its skills from the configured provider (hierarchical tree)',
            },
            requiredScope: 'skills:read',
        })
        .input(z.object({ id: z.string() }))
        .output(
            z.object({
                framework: SkillFrameworkValidator,
                skills: z.array(SkillTreeNodeValidator),
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
            if (fw) {
                const providerSkills = await provider.getSkillsForFramework(input.id);

                const normalized: SkillNode[] = providerSkills.map(skill => ({
                    id: skill.id,
                    statement: skill.statement,
                    description: skill.description,
                    code: skill.code,
                    type: skill.type ?? 'skill',
                    status:
                        skill.status === 'archived' || skill.status === 'inactive'
                            ? 'archived'
                            : 'active',
                    parentId: skill.parentId ?? undefined,
                }));

                const tree = buildSkillTree(normalized);

                return {
                    framework: {
                        id: fw.id,
                        name: fw.name,
                        description: fw.description,
                        sourceURI: fw.sourceURI,
                        status: (fw.status as any) ?? 'active',
                    } as SkillFrameworkType,
                    skills: tree,
                };
            }

            const local = await getFrameworkWithSkills(input.id);
            if (!local) throw new TRPCError({ code: 'NOT_FOUND' });

            return {
                framework: {
                    id: local.framework.id,
                    name: local.framework.name,
                    description: local.framework.description,
                    sourceURI: local.framework.sourceURI,
                    status: (local.framework.status as any) ?? 'active',
                } as SkillFrameworkType,
                skills: local.skills,
            };
        }),
});

const seedFrameworkSkills = async (
    frameworkId: string,
    skills: SkillTreeInput[] | undefined,
    provider = getSkillsProvider()
): Promise<void> => {
    if (!skills || skills.length === 0) return;

    await createSkillTree(
        frameworkId,
        skills,
        (fwId, input, parentId) => createSkill(fwId, input, parentId),
        async (created, _source, parentId) => {
            await provider.createSkill?.(frameworkId, {
                id: created.id,
                statement: created.statement,
                description: created.description ?? undefined,
                code: created.code ?? undefined,
                type: created.type ?? 'skill',
                status: created.status ?? 'active',
                parentId: parentId ?? null,
            });
        }
    );
};

export type SkillFrameworksRouter = typeof skillFrameworksRouter;
