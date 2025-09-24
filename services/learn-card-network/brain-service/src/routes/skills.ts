import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute } from '@routes';
import { getSkillsProvider } from '@services/skills-provider';
import {
    doesProfileManageFramework,
    getFrameworkWithSkills,
} from '@accesslayer/skill-framework/read';
import { upsertSkillsIntoFramework } from '@accesslayer/skill/sync';
import {
    doesProfileManageSkill,
    getChildrenForSkillInFrameworkPaged,
    getFrameworkRootSkillsPaged,
} from '@accesslayer/skill/read';
import { createSkill } from '@accesslayer/skill/create';
import { updateSkill, deleteSkill } from '@accesslayer/skill/update';
import { listTagsForSkill, addTagToSkill, removeTagFromSkill } from '@accesslayer/skill/tags';
import {
    TagValidator,
    type TagType,
    SkillFrameworkValidator,
    SkillValidator,
    PaginatedSkillTreeValidator,
    SkillTreeNodeValidator,
    SyncFrameworkInputValidator,
    AddTagInputValidator,
    CreateSkillInputValidator,
    UpdateSkillInputValidator,
    DeleteSkillInputValidator,
    CreateSkillsBatchInputValidator,
} from '@learncard/types';
import { createSkillTree } from './skill-inputs';

const stripParent = <T extends Record<string, any>>(skill: T): Omit<T, 'parentId'> => {
    const { parentId: _unusedParent, ...rest } = skill as T & { parentId?: string };
    return rest;
};

export const skillsRouter = t.router({
    getFrameworkSkillTree: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/skills/frameworks/{id}/tree',
                tags: ['Skills'],
                summary: 'Get framework skill tree (roots + first children)',
                description:
                    'Returns a paginated list of root skills for a framework and, for each root, the first page of its children. Use the per-node children endpoint to load more.',
            },
            requiredScope: 'skills:read',
        })
        .input(
            z.object({
                id: z.string(),
                rootsLimit: z.number().int().min(1).max(200).default(50),
                childrenLimit: z.number().int().min(1).max(200).default(25),
                cursor: z.string().nullable().optional(),
                depth: z.number().int().min(0).max(5).default(1),
            })
        )
        .output(PaginatedSkillTreeValidator)
        .query(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;
            const { id: frameworkId, rootsLimit, childrenLimit, cursor, depth: _depth } = input;

            const manages = await doesProfileManageFramework(profileId, frameworkId);
            if (!manages)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage this framework',
                });

            const rootsPage = await getFrameworkRootSkillsPaged(frameworkId, rootsLimit, cursor);

            // For each root, fetch first page of children (depth 1). If depth > 1, we still only fetch 1 for now.
            const records = await Promise.all(
                rootsPage.records.map(async root => {
                    const normalizedRoot = stripParent(root);

                    const childrenPage = await getChildrenForSkillInFrameworkPaged(
                        frameworkId,
                        root.id,
                        childrenLimit,
                        null
                    );

                    const children = childrenPage.records.map(child => {
                        const childWithoutParent = stripParent(child);
                        const { hasChildren, ...rest } = childWithoutParent as typeof childWithoutParent & {
                            hasChildren: boolean;
                        };
                        return {
                            ...rest,
                            children: [],
                            hasChildren,
                            childrenCursor: null,
                        };
                    });

                    const hasChildren =
                        children.length > 0 || childrenPage.cursor !== null || childrenPage.hasMore;

                    return {
                        ...normalizedRoot,
                        children,
                        hasChildren,
                        childrenCursor: childrenPage.cursor,
                    };
                })
            );

            return {
                hasMore: rootsPage.hasMore,
                cursor: rootsPage.cursor,
                records,
            };
        }),

    getSkillChildrenTree: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/skills/{id}/children',
                tags: ['Skills'],
                summary: 'Get children for a skill (framework-scoped, paginated)',
                description:
                    'Returns the first page (or subsequent pages) of children for a given skill within a framework. Each child includes hasChildren and an empty children array.',
            },
            requiredScope: 'skills:read',
        })
        .input(
            z.object({
                id: z.string(),
                frameworkId: z.string(),
                limit: z.number().int().min(1).max(200).default(25),
                cursor: z.string().nullable().optional(),
            })
        )
        .output(
            z.object({
                hasMore: z.boolean(),
                cursor: z.string().nullable(),
                records: SkillValidator.extend({ hasChildren: z.boolean() }).array(),
            })
        )
        .query(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;
            const { id: parentId, frameworkId, limit, cursor } = input;

            // Require that the caller manages a framework containing this skill
            const allowed = await doesProfileManageSkill(profileId, parentId);
            if (!allowed)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage a framework containing this skill',
                });

            const page = await getChildrenForSkillInFrameworkPaged(
                frameworkId,
                parentId,
                limit,
                cursor ?? null
            );

            return {
                hasMore: page.hasMore,
                cursor: page.cursor,
                records: page.records.map(child => stripParent(child)),
            };
        }),
    syncFrameworkSkills: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/skills/frameworks/{id}/sync',
                tags: ['Skills'],
                summary: 'Sync Framework Skills',
                description:
                    'Fetch skills from the configured provider and upsert them locally, linking to the framework and creating parent relationships',
            },
            requiredScope: 'skills:write',
        })
        .input(SyncFrameworkInputValidator)
        .output(
            z.object({
                framework: SkillFrameworkValidator,
                skills: z.array(SkillTreeNodeValidator),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;

            const manages = await doesProfileManageFramework(profileId, input.id);
            if (!manages)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage this framework',
                });

            const provider = getSkillsProvider();
            const providerFramework = await provider.getFrameworkById(input.id);

            if (providerFramework) {
                const providerSkills = await provider.getSkillsForFramework(input.id);

                await upsertSkillsIntoFramework(input.id, providerSkills);

                const result = await getFrameworkWithSkills(input.id);
                if (!result)
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Framework not found' });
                return result;
            }

            const local = await getFrameworkWithSkills(input.id);
            if (!local) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Framework not found' });
            }

            return local;
        }),

    create: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/skills',
                tags: ['Skills'],
                summary: 'Create a skill',
                description: 'Creates a new skill within a framework managed by the caller.',
            },
            requiredScope: 'skills:write',
        })
        .input(CreateSkillInputValidator)
        .output(SkillValidator)
        .mutation(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;
            const { frameworkId, skill, parentId } = input;
            const normalizedParentId = parentId ?? undefined;

            const manages = await doesProfileManageFramework(profileId, frameworkId);
            if (!manages)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage this framework',
                });

            try {
                const provider = getSkillsProvider();

                const createdSkills = await createSkillTree(
                    frameworkId,
                    [skill],
                    (fwId, input, parent) => createSkill(fwId, input, parent),
                    async (createdNode, _source, parent) => {
                        await provider.createSkill?.(frameworkId, {
                            id: createdNode.id,
                            statement: createdNode.statement,
                            description: createdNode.description ?? undefined,
                            code: createdNode.code ?? undefined,
                            type: createdNode.type ?? 'skill',
                            status: createdNode.status ?? 'active',
                            parentId: parent ?? null,
                        });
                    },
                    normalizedParentId
                );

                const created = createdSkills[0];
                if (!created) throw new Error('Failed to create skill');

                const apiSkill = stripParent(created);

                return {
                    ...apiSkill,
                    description: created.description ?? undefined,
                    code: created.code ?? undefined,
                    type: created.type ?? 'skill',
                    status: created.status ?? 'active',
                } as any;
            } catch (error: any) {
                if (
                    typeof error?.message === 'string' &&
                    /parent skill not found/i.test(error.message)
                ) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Parent skill not found in this framework',
                    });
                }

                throw error;
            }
        }),

    createMany: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/skills/batch',
                tags: ['Skills'],
                summary: 'Create many skills',
                description:
                    'Creates multiple skills within a framework managed by the caller in a single request.',
            },
            requiredScope: 'skills:write',
        })
        .input(CreateSkillsBatchInputValidator)
        .output(SkillValidator.array())
        .mutation(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;
            const { frameworkId, skills } = input;

            const manages = await doesProfileManageFramework(profileId, frameworkId);
            if (!manages)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage this framework',
                });

            const provider = getSkillsProvider();
            const created = await createSkillTree(
                frameworkId,
                skills,
                (fwId, input, parent) => createSkill(fwId, input, parent),
                async (createdNode, _source, parent) => {
                    await provider.createSkill?.(frameworkId, {
                        id: createdNode.id,
                        statement: createdNode.statement,
                        description: createdNode.description ?? undefined,
                        code: createdNode.code ?? undefined,
                        type: createdNode.type ?? 'skill',
                        status: createdNode.status ?? 'active',
                        parentId: parent ?? null,
                    });
                }
            );

            return created.map(skill => {
                const apiSkill = stripParent(skill);
                return {
                    ...apiSkill,
                    description: skill.description ?? undefined,
                    code: skill.code ?? undefined,
                    type: skill.type ?? 'skill',
                    status: skill.status ?? 'active',
                } as any;
            });
        }),

    update: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'PATCH',
                path: '/skills/{id}',
                tags: ['Skills'],
                summary: 'Update a skill',
                description: 'Updates a skill within a framework managed by the caller.',
            },
            requiredScope: 'skills:write',
        })
        .input(UpdateSkillInputValidator)
        .output(SkillValidator)
        .mutation(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;
            const { frameworkId, id, ...updates } = input;

            const manages = await doesProfileManageFramework(profileId, frameworkId);
            if (!manages)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage this framework',
                });

            const updated = await updateSkill(frameworkId, id, updates);

            const provider = getSkillsProvider();
            const providerUpdates: Record<string, any> = {};
            if (updates.statement !== undefined) providerUpdates.statement = updates.statement;
            if (updates.description !== undefined)
                providerUpdates.description = updates.description;
            if (updates.code !== undefined) providerUpdates.code = updates.code;
            if (updates.type !== undefined) providerUpdates.type = updates.type;
            if (updates.status !== undefined) providerUpdates.status = updates.status;
            if (Object.keys(providerUpdates).length > 0) {
                await provider.updateSkill?.(frameworkId, id, providerUpdates);
            }

            const apiSkill = stripParent(updated);

            return {
                ...apiSkill,
                description: updated.description ?? undefined,
                code: updated.code ?? undefined,
                type: updated.type ?? 'skill',
                status: updated.status ?? 'active',
            } as any;
        }),

    delete: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/skills/{id}',
                tags: ['Skills'],
                summary: 'Delete a skill',
                description:
                    'Deletes a skill from a framework managed by the caller and detaches any relationships.',
            },
            requiredScope: 'skills:write',
        })
        .input(DeleteSkillInputValidator)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;
            const { frameworkId, id } = input;

            const manages = await doesProfileManageFramework(profileId, frameworkId);
            if (!manages)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage this framework',
                });

            const result = await deleteSkill(frameworkId, id);

            const provider = getSkillsProvider();
            await provider.deleteSkill?.(frameworkId, id);

            return result;
        }),

    listSkillTags: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/skills/{id}/tags',
                tags: ['Skills'],
                summary: 'List tags for a skill',
                description:
                    'Lists all tags attached to a skill. Requires managing a framework containing the skill.',
            },
            requiredScope: 'skills:read',
        })
        .input(z.object({ id: z.string() }))
        .output(TagValidator.array())
        .query(async ({ ctx, input }): Promise<TagType[]> => {
            const profileId = ctx.user.profile.profileId;
            const allowed = await doesProfileManageSkill(profileId, input.id);
            if (!allowed)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage a framework containing this skill',
                });

            return listTagsForSkill(input.id);
        }),

    addSkillTag: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/skills/{id}/tags',
                tags: ['Skills'],
                summary: 'Add a tag to a skill',
                description:
                    'Creates the tag by slug if missing and attaches it to the skill. Requires managing a framework containing the skill.',
            },
            requiredScope: 'skills:write',
        })
        .input(z.object({ id: z.string(), tag: AddTagInputValidator }))
        .output(TagValidator.array())
        .mutation(async ({ ctx, input }): Promise<TagType[]> => {
            const profileId = ctx.user.profile.profileId;
            const allowed = await doesProfileManageSkill(profileId, input.id);
            if (!allowed)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage a framework containing this skill',
                });

            await addTagToSkill(input.id, input.tag);
            return listTagsForSkill(input.id);
        }),

    removeSkillTag: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/skills/{id}/tags/{slug}',
                tags: ['Skills'],
                summary: 'Remove a tag from a skill',
                description:
                    'Removes the HAS_TAG relationship from the skill to the tag. Requires managing a framework containing the skill.',
            },
            requiredScope: 'skills:write',
        })
        .input(z.object({ id: z.string(), slug: z.string().min(1) }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }): Promise<{ success: boolean }> => {
            const profileId = ctx.user.profile.profileId;
            const allowed = await doesProfileManageSkill(profileId, input.id);
            if (!allowed)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage a framework containing this skill',
                });

            return removeTagFromSkill(input.id, input.slug);
        }),
});

export type SkillsRouter = typeof skillsRouter;
