import { getChildrenForSkillInFrameworkPaged, getFrameworkRootSkillsPaged } from '@accesslayer/skill/read';
import type { FlatSkillType } from 'types/skill';
import type {
    PaginatedSkillTree,
    SkillTreeNode,
    SkillFrameworkType,
} from '@learncard/types';

export const DEFAULT_ROOTS_LIMIT = 50;
export const DEFAULT_CHILDREN_LIMIT = 25;

export const formatFramework = (framework: any): SkillFrameworkType => ({
    id: framework.id,
    name: framework.name,
    description: framework.description ?? undefined,
    image: framework.image ?? undefined,
    sourceURI: framework.sourceURI ?? undefined,
    status: (framework.status as any) ?? 'active',
    createdAt: framework.createdAt ?? undefined,
    updatedAt: framework.updatedAt ?? undefined,
});

export type ProviderSkillNode = {
    id: string;
    statement: string;
    description?: string | null;
    code?: string | null;
    type?: string | null;
    status?: string | null;
    parentId?: string | null;
};

const normalizeStatus = (status?: string | null): 'active' | 'archived' =>
    status === 'archived' || status === 'inactive' ? 'archived' : 'active';

const normalizeType = (type?: string | null): string => type ?? 'skill';

const baseFromSkill = (
    skill: FlatSkillType | ProviderSkillNode,
    frameworkId: string
): Omit<SkillTreeNode, 'children' | 'hasChildren'> => ({
    id: skill.id,
    statement: skill.statement,
    description: skill.description ?? undefined,
    code: skill.code ?? undefined,
    type: normalizeType((skill as any).type),
    status: normalizeStatus((skill as any).status),
    frameworkId,
    childrenCursor: null,
});

export async function buildLocalSkillTreePage(
    frameworkId: string,
    rootsLimit: number,
    childrenLimit: number,
    cursor: string | null
): Promise<PaginatedSkillTree> {
    const rootPage = await getFrameworkRootSkillsPaged(frameworkId, rootsLimit, cursor ?? null);

    const records: SkillTreeNode[] = [];

    for (const root of rootPage.records) {
        const childPage = await getChildrenForSkillInFrameworkPaged(
            frameworkId,
            root.id,
            childrenLimit,
            null
        );

        const children = childPage.records.map(child => {
            const { hasChildren, parentId: _parentId, ...rest } = child as typeof child & {
                hasChildren: boolean;
                parentId?: string;
            };

            return {
                ...baseFromSkill(rest, frameworkId),
                children: [],
                hasChildren,
                childrenCursor: null,
            } as SkillTreeNode;
        });

        const rootNode: SkillTreeNode = {
            ...baseFromSkill(root as FlatSkillType, frameworkId),
            children,
            hasChildren: children.length > 0 || childPage.hasMore,
            childrenCursor: childPage.cursor,
        };

        records.push(rootNode);
    }

    return {
        hasMore: rootPage.hasMore,
        cursor: rootPage.cursor,
        records,
    };
}

export function buildProviderSkillTreePage(
    frameworkId: string,
    skills: ProviderSkillNode[],
    rootsLimit: number,
    childrenLimit: number,
    cursor: string | null
): PaginatedSkillTree {
    const byParent = new Map<string | null | undefined, ProviderSkillNode[]>();

    for (const skill of skills) {
        const parentId = skill.parentId ?? null;
        const list = byParent.get(parentId);
        if (list) list.push(skill);
        else byParent.set(parentId, [skill]);
    }

    const sortById = (nodes: ProviderSkillNode[]) =>
        nodes.sort((a, b) => (a.id === b.id ? 0 : a.id < b.id ? -1 : 1));

    const roots = sortById([...(byParent.get(null) ?? []), ...(byParent.get(undefined) ?? [])]);

    const startIndex = cursor ? roots.findIndex(node => node.id === cursor) + 1 : 0;
    const pageRoots = roots.slice(startIndex, startIndex + rootsLimit);
    const hasMore = startIndex + rootsLimit < roots.length;
    const nextCursor = hasMore ? pageRoots[pageRoots.length - 1]?.id ?? null : null;

    const records: SkillTreeNode[] = pageRoots.map(root => {
        const childrenAll = byParent.get(root.id) ? [...byParent.get(root.id)!] : [];
        sortById(childrenAll);

        const childSlice = childrenAll.slice(0, childrenLimit);
        const childHasMore = childSlice.length < childrenAll.length;
        const childCursor = childHasMore ? childSlice[childSlice.length - 1]?.id ?? null : null;

        const children = childSlice.map(child => {
            const grandchildren = byParent.get(child.id);
            return {
                ...baseFromSkill(child, frameworkId),
                children: [],
                hasChildren: Boolean(grandchildren && grandchildren.length > 0),
                childrenCursor: null,
            } as SkillTreeNode;
        });

        return {
            ...baseFromSkill(root, frameworkId),
            children,
            hasChildren: children.length > 0 || childHasMore,
            childrenCursor: childCursor,
        } as SkillTreeNode;
    });

    return {
        hasMore,
        cursor: nextCursor ?? null,
        records,
    };
}

/**
 * Build a complete skill tree (all skills, fully nested recursively).
 * Warning: This can be expensive for large frameworks.
 */
export function buildFullSkillTree(
    frameworkId: string,
    skills: (FlatSkillType | ProviderSkillNode)[]
): SkillTreeNode[] {
    const byParent = new Map<string | null | undefined, (FlatSkillType | ProviderSkillNode)[]>();

    for (const skill of skills) {
        const parentId = (skill as any).parentId ?? null;
        const list = byParent.get(parentId);
        if (list) list.push(skill);
        else byParent.set(parentId, [skill]);
    }

    const sortById = (nodes: (FlatSkillType | ProviderSkillNode)[]) =>
        nodes.sort((a, b) => (a.id === b.id ? 0 : a.id < b.id ? -1 : 1));

    const buildNode = (skill: FlatSkillType | ProviderSkillNode): SkillTreeNode => {
        const childrenAll = byParent.get(skill.id) ? [...byParent.get(skill.id)!] : [];
        sortById(childrenAll);

        const children = childrenAll.map(child => buildNode(child));

        return {
            ...baseFromSkill(skill, frameworkId),
            children,
            hasChildren: children.length > 0,
            childrenCursor: null,
        } as SkillTreeNode;
    };

    const roots = sortById([...(byParent.get(null) ?? []), ...(byParent.get(undefined) ?? [])]);

    return roots.map(root => buildNode(root));
}
