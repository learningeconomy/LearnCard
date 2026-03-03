import { SkillTreeNode } from '@learncard/types';

export type SkillTreeSearchContext = {
    parent?: SkillTreeNode;
};

export type SkillTreeSearchResult = {
    node: SkillTreeNode;
    parent?: SkillTreeNode;
};

export type SkillTreeMatcher = (
    node: SkillTreeNode,
    context: SkillTreeSearchContext
) => boolean;

export const findSkillInTree = (
    skills: SkillTreeNode[],
    matcher: SkillTreeMatcher
): SkillTreeSearchResult | undefined => {
    const visit = (
        nodes: SkillTreeNode[],
        parent?: SkillTreeNode
    ): SkillTreeSearchResult | undefined => {
        for (const node of nodes) {
            if (matcher(node, { parent })) return { node, parent };

            if (node.children?.length) {
                const childMatch = visit(node.children, node);
                if (childMatch) return childMatch;
            }
        }

        return undefined;
    };

    return visit(skills);
};

export const findSkillIdInTree = (
    skills: SkillTreeNode[],
    matcher: SkillTreeMatcher
): string | undefined => findSkillInTree(skills, matcher)?.node.id;
