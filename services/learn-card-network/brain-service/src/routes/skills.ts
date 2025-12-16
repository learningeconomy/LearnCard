import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute } from '@routes';
import { getSkillsProvider } from '@services/skills-provider';
import {
    doesProfileManageFramework,
    getSkillFrameworkById,
} from '@accesslayer/skill-framework/read';
import { upsertSkillsIntoFramework } from '@accesslayer/skill/sync';
import {
    getChildrenForSkillInFrameworkPaged,
    getSkillById,
    searchSkillsInFramework,
    countSkillsInFramework,
    getFullSkillTree,
    getSkillPath,
} from '@accesslayer/skill/read';
import { createSkill } from '@accesslayer/skill/create';
import { updateSkill, deleteSkill } from '@accesslayer/skill/update';
import { listTagsForSkill, addTagToSkill, removeTagFromSkill } from '@accesslayer/skill/tags';
import {
    TagValidator,
    type TagType,
    SkillValidator,
    SkillQueryValidator,
    PaginatedSkillTreeValidator,
    SyncFrameworkInputValidator,
    AddTagInputValidator,
    CreateSkillInputValidator,
    UpdateSkillInputValidator,
    DeleteSkillInputValidator,
    CreateSkillsBatchInputValidator,
    FrameworkWithSkillsValidator,
    CountSkillsInputValidator,
    CountSkillsResultValidator,
    GetFullSkillTreeInputValidator,
    GetFullSkillTreeResultValidator,
    GetSkillPathInputValidator,
    GetSkillPathResultValidator,
    type SkillDeletionStrategy,
} from '@learncard/types';
import {
    buildLocalSkillTreePage,
    buildFullSkillTree,
    DEFAULT_CHILDREN_LIMIT,
    DEFAULT_ROOTS_LIMIT,
    formatFramework,
} from '@helpers/skill-tree';
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
                rootsLimit: z.number().int().min(1).max(200).default(DEFAULT_ROOTS_LIMIT),
                childrenLimit: z.number().int().min(1).max(200).default(DEFAULT_CHILDREN_LIMIT),
                cursor: z.string().nullable().optional(),
            })
        )
        .output(PaginatedSkillTreeValidator)
        .query(async ({ input }) => {
            const { id: frameworkId, rootsLimit, childrenLimit, cursor } = input;

            return buildLocalSkillTreePage(frameworkId, rootsLimit, childrenLimit, cursor ?? null);
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
        .output(PaginatedSkillTreeValidator)
        .query(async ({ input }) => {
            const { id: parentId, frameworkId, limit, cursor } = input;

            const page = await getChildrenForSkillInFrameworkPaged(
                frameworkId,
                parentId,
                limit,
                cursor ?? null
            );

            const records = page.records.map(child => {
                const {
                    hasChildren,
                    parentId: _parent,
                    ...rest
                } = child as typeof child & {
                    hasChildren: boolean;
                    parentId?: string;
                };

                return {
                    id: rest.id,
                    statement: rest.statement,
                    description: rest.description ?? undefined,
                    code: rest.code ?? undefined,
                    icon: rest.icon ?? undefined,
                    type: rest.type ?? 'skill',
                    status: rest.status ?? 'active',
                    frameworkId: rest.frameworkId,
                    children: [],
                    hasChildren,
                    childrenCursor: null,
                };
            });

            return {
                hasMore: page.hasMore,
                cursor: page.cursor,
                records,
            };
        }),
    searchFrameworkSkills: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/skills/framework/search',
                tags: ['Skills'],
                summary: 'Search skills in a framework',
                description:
                    'Returns a flattened, paginated list of skills matching the search query. Supports $regex and $in operators. Requires framework management.',
            },
            requiredScope: 'skills:read',
        })
        .input(
            z.object({
                id: z.string(),
                query: SkillQueryValidator,
                limit: z.number().int().min(1).max(200).default(50),
                cursor: z.string().nullable().optional(),
            })
        )
        .output(
            z.object({
                records: z.array(SkillValidator.omit({ createdAt: true, updatedAt: true })),
                hasMore: z.boolean(),
                cursor: z.string().nullable(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { id: frameworkId, query, limit, cursor } = input;

            if (!(await doesProfileManageFramework(profile.profileId, frameworkId))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not manage this framework',
                });
            }

            const result = await searchSkillsInFramework(frameworkId, query, limit, cursor ?? null);

            return {
                records: result.records.map(skill => ({
                    id: skill.id,
                    statement: skill.statement,
                    description: skill.description ?? undefined,
                    code: skill.code ?? undefined,
                    icon: skill.icon ?? undefined,
                    type: skill.type ?? 'skill',
                    status: (skill.status as any) ?? 'active',
                    frameworkId: skill.frameworkId,
                })),
                hasMore: result.hasMore,
                cursor: result.cursor,
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
        .output(FrameworkWithSkillsValidator)
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
            }

            const localFramework = await getSkillFrameworkById(input.id);
            if (!localFramework)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Framework not found' });

            const skills = await buildLocalSkillTreePage(
                input.id,
                DEFAULT_ROOTS_LIMIT,
                DEFAULT_CHILDREN_LIMIT,
                null
            );

            return {
                framework: formatFramework(localFramework),
                skills,
            };
        }),

    getSkill: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/skills/{id}',
                tags: ['Skills'],
                summary: 'Get a skill by ID',
                description: 'Retrieves a skill by its ID within a specific framework.',
            },
            requiredScope: 'skills:read',
        })
        .input(z.object({ frameworkId: z.string(), id: z.string() }))
        .output(SkillValidator)
        .query(async ({ input }) => {
            const { frameworkId, id } = input;

            const skill = await getSkillById(frameworkId, id);
            if (!skill) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Skill not found in this framework',
                });
            }

            return {
                id: skill.id,
                statement: skill.statement,
                description: skill.description ?? undefined,
                code: skill.code ?? undefined,
                type: skill.type ?? 'skill',
                status: skill.status ?? 'active',
                icon: skill.icon ?? undefined,
            } as any;
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
                    'Creates multiple skills within a framework managed by the caller in a single request. Optionally specify parentId to add all root-level skills as children of an existing skill.',
            },
            requiredScope: 'skills:write',
        })
        .input(CreateSkillsBatchInputValidator)
        .output(SkillValidator.array())
        .mutation(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;
            const { frameworkId, skills, parentId } = input;
            const normalizedParentId = parentId ?? undefined;

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
                },
                normalizedParentId
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
                    'Deletes a skill from a framework managed by the caller. Strategy options: "reparent" (default) moves children to the deleted skill\'s parent (or makes them root nodes if no parent), "recursive" deletes the skill and all its descendants.',
            },
            requiredScope: 'skills:write',
        })
        .input(DeleteSkillInputValidator)
        .output(z.object({ success: z.boolean(), deletedCount: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;
            const { frameworkId, id, strategy } = input;

            const manages = await doesProfileManageFramework(profileId, frameworkId);
            if (!manages)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage this framework',
                });

            const result = await deleteSkill(frameworkId, id, strategy as SkillDeletionStrategy);

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
        .input(z.object({ frameworkId: z.string(), id: z.string() }))
        .output(TagValidator.array())
        .query(async ({ input }): Promise<TagType[]> => {
            const { frameworkId, id } = input;

            return listTagsForSkill(frameworkId, id);
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
        .input(z.object({ frameworkId: z.string(), id: z.string(), tag: AddTagInputValidator }))
        .output(TagValidator.array())
        .mutation(async ({ ctx, input }): Promise<TagType[]> => {
            const profileId = ctx.user.profile.profileId;
            const { frameworkId, id, tag } = input;
            const allowed = await doesProfileManageFramework(profileId, frameworkId);
            if (!allowed)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage a framework containing this skill',
                });

            await addTagToSkill(frameworkId, id, tag);
            return listTagsForSkill(frameworkId, id);
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
        .input(z.object({ frameworkId: z.string(), id: z.string(), slug: z.string().min(1) }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }): Promise<{ success: boolean }> => {
            const profileId = ctx.user.profile.profileId;
            const { frameworkId, id, slug } = input;
            const allowed = await doesProfileManageFramework(profileId, frameworkId);
            if (!allowed)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage a framework containing this skill',
                });

            return removeTagFromSkill(frameworkId, id, slug);
        }),

    countSkills: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/skills/frameworks/{frameworkId}/count',
                tags: ['Skills'],
                summary: 'Count skills in a framework',
                description:
                    'Counts skills in a framework. If skillId is provided, counts children of that skill. If recursive is true, counts all descendants. Requires managing the framework.',
            },
            requiredScope: 'skills:read',
        })
        .input(CountSkillsInputValidator)
        .output(CountSkillsResultValidator)
        .query(async ({ input }) => {
            const { frameworkId, skillId, recursive, onlyCountCompetencies } = input;

            const count = await countSkillsInFramework(
                frameworkId,
                skillId,
                recursive,
                onlyCountCompetencies
            );

            return { count };
        }),

    getFullSkillTree: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/skills/frameworks/{frameworkId}/tree/full',
                tags: ['Skills'],
                summary: 'Get complete skill tree for a framework',
                description:
                    'Returns all skills in the framework as a fully nested recursive tree structure. Warning: This can be a heavy query for large frameworks. Requires managing the framework.',
            },
            requiredScope: 'skills:read',
        })
        .input(GetFullSkillTreeInputValidator)
        .output(GetFullSkillTreeResultValidator)
        .query(async ({ input }) => {
            const { frameworkId } = input;

            const flatSkills = await getFullSkillTree(frameworkId);
            const skills = buildFullSkillTree(frameworkId, flatSkills);

            return { skills };
        }),

    getSkillPath: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/skills/{skillId}/path',
                tags: ['Skills'],
                summary: 'Get breadcrumb path for a skill',
                description:
                    'Returns the skill and all its ancestors up to the root skill in the framework. Useful for rendering breadcrumbs. Results are ordered from the skill itself up to the root (reverse hierarchical order).',
            },
            requiredScope: 'skills:read',
        })
        .input(GetSkillPathInputValidator)
        .output(GetSkillPathResultValidator)
        .query(async ({ input }) => {
            const { frameworkId, skillId } = input;

            const path = await getSkillPath(frameworkId, skillId);

            if (path.length === 0) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Skill not found in this framework',
                });
            }

            return { path };
        }),
});

export type SkillsRouter = typeof skillsRouter;
