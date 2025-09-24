import { neogma } from '@instance';
import { FlatSkillFrameworkType } from 'types/skill-framework';
import { SkillTreeNode } from 'types/skill-tree';

export const getSkillFrameworkById = async (id: string): Promise<FlatSkillFrameworkType | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $id}) RETURN f AS f`,
        { id }
    );

    const node = result.records[0]?.get('f') as { properties?: Record<string, any> } | undefined;
    const props = node?.properties;
    return (props as FlatSkillFrameworkType) ?? null;
};

export const listSkillFrameworksManagedByProfile = async (
    profileId: string
): Promise<FlatSkillFrameworkType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[:MANAGES]->(f:SkillFramework)
         RETURN f AS f`,
        { profileId }
    );

    return result.records
        .map(r => (r.get('f') as any)?.properties as FlatSkillFrameworkType)
        .filter(Boolean);
};

export const doesProfileManageFramework = async (
    profileId: string,
    frameworkId: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[:MANAGES]->(f:SkillFramework {id: $frameworkId})
         RETURN count(f) AS c`,
        { profileId, frameworkId }
    );

    const count = Number(result.records[0]?.get('c') ?? 0);
    return count > 0;
};

export type SkillNode = {
    id: string;
    statement: string;
    description?: string;
    code?: string;
    type: string;
    status: 'active' | 'archived';
    parentId?: string;
};

export type FrameworkWithSkills = {
    framework: FlatSkillFrameworkType;
    skills: SkillTreeNode[];
};

export const buildSkillTree = (skills: SkillNode[]): SkillTreeNode[] => {
    if (skills.length === 0) return [];

    const nodeMap = new Map<string, SkillTreeNode & { _parentId?: string | null }>();

    skills.forEach(skill => {
        const node: SkillTreeNode & { _parentId?: string | null } = {
            id: skill.id,
            statement: skill.statement,
            description: skill.description,
            code: skill.code,
            type: skill.type,
            status: skill.status,
            children: [],
            hasChildren: false,
            childrenCursor: null,
            _parentId: skill.parentId ?? null,
        };

        nodeMap.set(skill.id, node);
    });

    const roots: SkillTreeNode[] = [];

    nodeMap.forEach(node => {
        const parentIdentifier = node._parentId ?? undefined;

        if (parentIdentifier && nodeMap.has(parentIdentifier)) {
            const parent = nodeMap.get(parentIdentifier)!;
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    });

    nodeMap.forEach(node => {
        node.hasChildren = node.children.length > 0;
        node.childrenCursor = null;
        delete (node as any)._parentId;
    });

    return roots;
};

export const getFrameworkWithSkills = async (id: string): Promise<FrameworkWithSkills | null> => {
    const framework = await getSkillFrameworkById(id);
    if (!framework) return null;

    const result = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $id})-[:CONTAINS]->(s:Skill)
         OPTIONAL MATCH (s)-[:IS_CHILD_OF]->(p:Skill)
         RETURN s AS s, p.id AS parentId`,
        { id }
    );

    const flatSkills: SkillNode[] = result.records.map(r => {
        const s = r.get('s') as any;
        const parentId = r.get('parentId');
        const props = s?.properties ?? {};
        return {
            id: props.id,
            statement: props.statement,
            description: props.description,
            code: props.code,
            type: props.type ?? 'skill',
            status: props.status === 'archived' || props.status === 'inactive' ? 'archived' : 'active',
            ...(parentId && { parentId }),
        } as SkillNode;
    });

    const skills = buildSkillTree(flatSkills);

    return { framework, skills };
};
