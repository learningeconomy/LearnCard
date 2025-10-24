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
    SkillFrameworkAdminInputValidator,
    SkillFrameworkIdInputValidator,
    SkillFrameworkAdminsValidator,
    ReplaceSkillFrameworkSkillsInputValidator,
    ReplaceSkillFrameworkSkillsResultValidator,
} from '@learncard/types';
import {
    upsertSkillFrameworkFromProvider,
    createSkillFramework as createSkillFrameworkNode,
} from '@accesslayer/skill-framework/create';
import { getBoostsByUri } from '@accesslayer/boost/read';
import {
    listSkillFrameworksManagedByProfile,
    doesProfileManageFramework,
    getSkillFrameworkById,
} from '@accesslayer/skill-framework/read';
import {
    updateSkillFramework as updateSkillFrameworkNode,
    deleteSkillFramework as deleteSkillFrameworkNode,
} from '@accesslayer/skill-framework/update';
import { getSkillsProvider } from '@services/skills-provider';
import { PaginatedSkillTreeValidator } from 'types/skill-tree';
import { createSkill } from '@accesslayer/skill/create';
import { createSkillTree, type SkillTreeInput, toCreateSkillInput } from './skill-inputs';
import { isProfileBoostAdmin } from '@accesslayer/boost/relationships/read';
import { getIdFromUri } from '@helpers/uri.helpers';
import { neogma } from '@instance';
import { getSkillsByFramework } from '@accesslayer/skill/read';
import { updateSkill, deleteSkill } from '@accesslayer/skill/update';
import {
    listFrameworkManagers,
    addFrameworkManager,
    removeFrameworkManager,
} from '@accesslayer/skill-framework/relationships';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import type { ProfileType } from 'types/profile';
import {
    buildLocalSkillTreePage,
    buildProviderSkillTreePage,
    DEFAULT_ROOTS_LIMIT,
    DEFAULT_CHILDREN_LIMIT,
    formatFramework,
    type ProviderSkillNode,
} from '@helpers/skill-tree';

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
            const { profile } = ctx.user;
            const profileId = profile.profileId;
            const { skills: initialSkills, boostUris = [], ...frameworkInput } = input;

            const boostAttachments = await resolveBoostAttachments(profile, boostUris);

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
            await attachBoostsToFramework(created.id, boostAttachments);

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
            const { profile } = ctx.user;
            const profileId = profile.profileId;
            const provider = getSkillsProvider();

            const createdFrameworks: SkillFrameworkType[] = [];

            for (const frameworkInput of input.frameworks) {
                const {
                    skills: initialSkills,
                    boostUris = [],
                    ...frameworkPayload
                } = frameworkInput;

                const boostAttachments = await resolveBoostAttachments(profile, boostUris);

                const created = await createSkillFrameworkNode(profileId, frameworkPayload);

                await provider.createFramework?.({
                    id: created.id,
                    name: created.name,
                    description: created.description,
                    image: created.image,
                    sourceURI: created.sourceURI,
                    status: created.status,
                });

                await seedFrameworkSkills(created.id, initialSkills, provider);
                await attachBoostsToFramework(created.id, boostAttachments);

                createdFrameworks.push(created);
            }

            return createdFrameworks;
        }),

    listFrameworkAdmins: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/skills/frameworks/{frameworkId}/admins',
                tags: ['Skills'],
                summary: 'List framework admins',
                description:
                    'Returns the profiles that manage the given framework. Requires manager access.',
            },
            requiredScope: 'skills:read',
        })
        .input(SkillFrameworkIdInputValidator)
        .output(SkillFrameworkAdminsValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { frameworkId } = input;

            if (!(await doesProfileManageFramework(profile.profileId, frameworkId))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not manage this framework',
                });
            }

            return listFrameworkManagers(frameworkId);
        }),

    addFrameworkAdmin: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/skills/frameworks/{frameworkId}/admins',
                tags: ['Skills'],
                summary: 'Add framework admin',
                description:
                    'Adds another profile as a manager of the framework. Requires existing manager access.',
            },
            requiredScope: 'skills:write',
        })
        .input(SkillFrameworkAdminInputValidator)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { frameworkId, profileId } = input;

            if (!(await doesProfileManageFramework(profile.profileId, frameworkId))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not manage this framework',
                });
            }

            const targetProfile = await getProfileByProfileId(profileId);
            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found',
                });
            }

            const success = await addFrameworkManager(frameworkId, profileId);

            return { success };
        }),

    removeFrameworkAdmin: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/skills/frameworks/{frameworkId}/admins/{profileId}',
                tags: ['Skills'],
                summary: 'Remove framework admin',
                description:
                    'Removes a manager from the framework. Requires manager access and at least one manager must remain.',
            },
            requiredScope: 'skills:write',
        })
        .input(SkillFrameworkAdminInputValidator)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { frameworkId, profileId } = input;

            if (!(await doesProfileManageFramework(profile.profileId, frameworkId))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not manage this framework',
                });
            }

            const admins = await listFrameworkManagers(frameworkId);
            const targetIsAdmin = admins.some(admin => admin.profileId === profileId);

            if (!targetIsAdmin) {
                return { success: false };
            }

            if (admins.length <= 1) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Cannot remove the last framework admin',
                });
            }

            const success = await removeFrameworkManager(frameworkId, profileId);

            if (!success) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Unable to remove framework admin',
                });
            }

            return { success };
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
        .input(
            z.object({
                id: z.string(),
                limit: z.number().int().min(1).max(200).default(DEFAULT_ROOTS_LIMIT),
                childrenLimit: z.number().int().min(1).max(200).default(DEFAULT_CHILDREN_LIMIT),
                cursor: z.string().nullable().optional(),
            })
        )
        .output(
            z.object({
                framework: SkillFrameworkValidator,
                skills: PaginatedSkillTreeValidator,
            })
        )
        .query(async ({ ctx, input }) => {
            const profileId = ctx.user.profile.profileId;
            const { id, limit, childrenLimit, cursor } = input;
            const manages = await doesProfileManageFramework(profileId, id);
            if (!manages)
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage this framework',
                });

            const provider = getSkillsProvider();
            const fw = await provider.getFrameworkById(id);
            if (fw) {
                const providerSkills = await provider.getSkillsForFramework(id);

                const normalized: ProviderSkillNode[] = providerSkills.map(skill => ({
                    id: skill.id,
                    statement: skill.statement,
                    description: skill.description ?? undefined,
                    icon: skill.icon ?? undefined,
                    code: skill.code ?? undefined,
                    type: skill.type ?? undefined,
                    status: skill.status ?? undefined,
                    parentId: skill.parentId ?? undefined,
                }));

                const skillsPage = buildProviderSkillTreePage(
                    id,
                    normalized,
                    limit,
                    childrenLimit,
                    cursor ?? null
                );

                return {
                    framework: formatFramework({ ...fw, id }),
                    skills: skillsPage,
                };
            }

            const localFramework = await getSkillFrameworkById(id);
            if (!localFramework) throw new TRPCError({ code: 'NOT_FOUND' });

            const skills = await buildLocalSkillTreePage(id, limit, childrenLimit, cursor ?? null);

            return {
                framework: formatFramework(localFramework),
                skills,
            };
        }),

    replaceSkills: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/skills/frameworks/{frameworkId}/replace',
                tags: ['Skills'],
                summary: 'Replace all skills in a framework',
                description:
                    'Replaces the entire skill tree of a framework. Skills with matching IDs are updated if changed, skills not in the input are deleted, and new skills are created. Returns statistics about changes made.',
            },
            requiredScope: 'skills:write',
        })
        .input(ReplaceSkillFrameworkSkillsInputValidator)
        .output(ReplaceSkillFrameworkSkillsResultValidator)
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const profileId = profile.profileId;
            const { frameworkId, skills: newSkills } = input;

            const manages = await doesProfileManageFramework(profileId, frameworkId);
            if (!manages) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not manage this framework',
                });
            }

            const provider = getSkillsProvider();

            // Get all existing skills in the framework
            const existingSkills = await getSkillsByFramework(frameworkId);
            const existingSkillsMap = new Map(existingSkills.map(s => [s.id, s]));

            // Flatten the new skill tree to get all skill IDs with their parent relationships
            const flattenedNew: Array<{
                skill: SkillTreeInput;
                parentId?: string;
            }> = [];

            const flattenTree = (nodes: SkillTreeInput[], parentId?: string) => {
                for (const node of nodes) {
                    flattenedNew.push({ skill: node, parentId });
                    if (node.children && node.children.length > 0) {
                        flattenTree(node.children, node.id);
                    }
                }
            };
            flattenTree(newSkills);

            // Convert to map for easy lookup
            const newSkillsMap = new Map(
                flattenedNew.map(({ skill }) => {
                    const input = toCreateSkillInput(skill);
                    return [input.id!, skill];
                })
            );

            let created = 0;
            let updated = 0;
            let deleted = 0;
            let unchanged = 0;

            // Delete skills that are no longer in the new input
            const skillsToDelete = existingSkills.filter(
                existing => !newSkillsMap.has(existing.id)
            );
            for (const skill of skillsToDelete) {
                await deleteSkill(frameworkId, skill.id);
                await provider.deleteSkill?.(frameworkId, skill.id);
                deleted++;
            }

            // Process skills in order (parents before children)
            // This ensures parent relationships can be established correctly
            for (const { skill, parentId } of flattenedNew) {
                const input = toCreateSkillInput(skill);
                const skillId = input.id!;

                const existing = existingSkillsMap.get(skillId);

                if (existing) {
                    // Check if the skill properties changed
                    const hasPropertyChanges =
                        existing.statement !== input.statement ||
                        existing.description !== input.description ||
                        existing.code !== input.code ||
                        existing.icon !== input.icon ||
                        existing.type !== input.type ||
                        existing.status !== input.status;

                    // Check if parent relationship changed
                    const hasParentChange = existing.parentId !== parentId;

                    if (hasPropertyChanges) {
                        await updateSkill(frameworkId, skillId, {
                            statement: input.statement,
                            description: input.description,
                            code: input.code,
                            icon: input.icon,
                            type: input.type,
                            status: input.status,
                        });

                        await provider.updateSkill?.(frameworkId, skillId, {
                            statement: input.statement,
                            description: input.description,
                            code: input.code,
                            icon: input.icon,
                            type: input.type,
                            status: input.status,
                        });
                    }

                    // Update parent relationship if it changed
                    if (hasParentChange) {
                        // Remove old parent relationship
                        await neogma.queryRunner.run(
                            `MATCH (s:Skill {id: $skillId})-[r:IS_CHILD_OF]->(:Skill)
                             DELETE r`,
                            { skillId }
                        );

                        // Add new parent relationship if parentId is provided
                        if (parentId) {
                            const parentCheck = await neogma.queryRunner.run(
                                `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(p:Skill {id: $parentId})
                                 RETURN p.id AS id`,
                                { frameworkId, parentId }
                            );

                            if (parentCheck.records.length === 0) {
                                throw new TRPCError({
                                    code: 'BAD_REQUEST',
                                    message: `Parent skill ${parentId} not found in framework`,
                                });
                            }

                            await neogma.queryRunner.run(
                                `MATCH (s:Skill {id: $skillId}), (p:Skill {id: $parentId})
                                 MERGE (s)-[:IS_CHILD_OF]->(p)`,
                                { skillId, parentId }
                            );
                        }

                        // Update provider if parent changed
                        await provider.updateSkill?.(frameworkId, skillId, {
                            parentId: parentId ?? null,
                        });
                    }

                    // Count as updated only if properties changed (not parent relationship)
                    if (hasPropertyChanges) {
                        updated++;
                    } else {
                        unchanged++;
                    }
                } else {
                    // Create new skill
                    const createdSkill = await createSkill(frameworkId, input, parentId);

                    await provider.createSkill?.(frameworkId, {
                        id: createdSkill.id,
                        statement: createdSkill.statement,
                        description: createdSkill.description ?? undefined,
                        code: createdSkill.code ?? undefined,
                        icon: createdSkill.icon ?? undefined,
                        type: createdSkill.type ?? 'skill',
                        status: createdSkill.status ?? 'active',
                        parentId: parentId ?? null,
                    });

                    created++;
                }
            }

            const total = created + updated + deleted + unchanged;

            return {
                created,
                updated,
                deleted,
                unchanged,
                total,
            };
        }),
});

type BoostAttachment = {
    id: string;
    uri: string;
};

const resolveBoostAttachments = async (
    profile: ProfileType,
    boostUris: string[] | undefined
): Promise<BoostAttachment[]> => {
    if (!boostUris || boostUris.length === 0) return [];

    const idToUri = new Map<string, string>();
    for (const uri of boostUris) {
        idToUri.set(getIdFromUri(uri), uri);
    }

    const uniqueUris = Array.from(idToUri.values());
    const boosts = await getBoostsByUri(uniqueUris);
    const boostById = new Map(boosts.map(boost => [boost.id, boost] as const));

    const missingUris = Array.from(idToUri.entries())
        .filter(([id]) => !boostById.has(id))
        .map(([, uri]) => uri);

    if (missingUris.length > 0) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Boost(s) not found: ${missingUris.join(', ')}`,
        });
    }

    for (const [id, uri] of idToUri.entries()) {
        const boost = boostById.get(id)!;

        if (!(await isProfileBoostAdmin(profile, boost))) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: `Profile is not a boost admin for boost ${uri}`,
            });
        }
    }

    return Array.from(idToUri.entries()).map(([id, uri]) => ({ id, uri }));
};

const attachBoostsToFramework = async (
    frameworkId: string,
    attachments: BoostAttachment[]
): Promise<void> => {
    if (attachments.length === 0) return;

    const boostIds = Array.from(new Set(attachments.map(({ id }) => id)));

    await neogma.queryRunner.run(
        `UNWIND $boostIds AS bid
         MATCH (b:Boost { id: bid })
         MATCH (f:SkillFramework { id: $frameworkId })
         MERGE (b)-[:USES_FRAMEWORK]->(f)`,
        { boostIds, frameworkId }
    );
};

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
                icon: created.icon ?? undefined,
                type: created.type ?? 'skill',
                status: created.status ?? 'active',
                parentId: parentId ?? null,
            });
        }
    );
};

export type SkillFrameworksRouter = typeof skillFrameworksRouter;
