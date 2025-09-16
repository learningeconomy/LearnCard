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
import { listTagsForSkill, addTagToSkill, removeTagFromSkill } from '@accesslayer/skill/tags';
import { TagValidator, type FlatTagType } from 'types/tag';
import { SkillFrameworkValidator } from 'types/skill-framework';
import { SkillValidator } from 'types/skill';
import { PaginatedSkillTreeValidator } from 'types/skill-tree';

export const SyncFrameworkInputValidator = z.object({ id: z.string() });
export type SyncFrameworkInput = z.infer<typeof SyncFrameworkInputValidator>;

export const AddTagInputValidator = z.object({ slug: z.string().min(1), name: z.string().min(1) });
export type AddTagInput = z.infer<typeof AddTagInputValidator>;

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
                    const normalizedRoot = {
                        ...root,
                        parentId: root.parentId ?? undefined,
                    };

                    const childrenPage = await getChildrenForSkillInFrameworkPaged(
                        frameworkId,
                        root.id,
                        childrenLimit,
                        null
                    );

                    const children = childrenPage.records.map(child => {
                        const { hasChildren, ...rest } = child;
                        return {
                            ...rest,
                            parentId: rest.parentId ?? undefined,
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
                records: page.records,
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
                skills: z.array(SkillValidator.omit({ createdAt: true, updatedAt: true })),
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
            const providerSkills = await provider.getSkillsForFramework(input.id);

            await upsertSkillsIntoFramework(input.id, providerSkills);

            const result = await getFrameworkWithSkills(input.id);
            if (!result) throw new TRPCError({ code: 'NOT_FOUND', message: 'Framework not found' });
            console.log('result', JSON.stringify(result, null, 2));
            return result as any;
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
        .query(async ({ ctx, input }): Promise<FlatTagType[]> => {
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
        .mutation(async ({ ctx, input }): Promise<FlatTagType[]> => {
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
