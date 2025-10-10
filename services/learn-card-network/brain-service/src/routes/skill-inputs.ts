import { randomUUID } from 'crypto';
import { z } from 'zod';

import { SkillStatusEnum } from 'types/skill';
import type {
    CreateSkillInput as AccessLayerCreateSkillInput,
    CreateSkillBatchItem,
} from '@accesslayer/skill/create';
import type { FlatSkillType } from 'types/skill';

export interface SkillTreeInput {
    id?: string;
    statement: string;
    description?: string;
    code?: string;
    icon?: string;
    type?: string;
    status?: 'active' | 'archived';
    children?: SkillTreeInput[];
}

const RawSkillTreeNodeInputValidator: z.ZodType<SkillTreeInput> = z.lazy(() =>
    z.object({
        id: z.string().optional(),
        statement: z.string(),
        description: z.string().optional(),
        code: z.string().optional(),
        icon: z.string().optional(),
        type: z.string().optional(),
        status: SkillStatusEnum.optional(),
        children: z.array(SkillTreeNodeInputValidator).optional(),
    })
);

// Annoying hack because the unit tests don't want to play nice with the zod-openapi plugin.
export const SkillTreeNodeInputValidator =
    process.env.NODE_ENV === 'test'
        ? RawSkillTreeNodeInputValidator
        : RawSkillTreeNodeInputValidator.openapi({ ref: 'SkillTreeNodeInputValidator' });

export const normalizeSkillStatus = (status?: string): 'active' | 'archived' =>
    status === 'archived' ? 'archived' : 'active';

export const toCreateSkillInput = (skill: SkillTreeInput): AccessLayerCreateSkillInput => ({
    id: skill.id ?? randomUUID(),
    statement: skill.statement,
    description: skill.description,
    code: skill.code,
    icon: skill.icon,
    type: skill.type ?? 'skill',
    status: normalizeSkillStatus(skill.status),
});

export const flattenSkillTreeInputs = (
    skills: SkillTreeInput[],
    parentId?: string
): CreateSkillBatchItem[] => {
    const items: CreateSkillBatchItem[] = [];

    for (const skill of skills) {
        const input = toCreateSkillInput(skill);
        const id = input.id!;
        items.push({ input, parentId });

        if (skill.children && skill.children.length > 0) {
            items.push(...flattenSkillTreeInputs(skill.children, id));
        }
    }

    return items;
};

export const createSkillTree = async (
    frameworkId: string,
    skills: SkillTreeInput[],
    createFn: (
        frameworkId: string,
        input: AccessLayerCreateSkillInput,
        parentId?: string
    ) => Promise<FlatSkillType>,
    afterCreate?: (
        created: FlatSkillType,
        source: SkillTreeInput,
        parentId?: string
    ) => Promise<void> | void,
    rootParentId?: string
): Promise<FlatSkillType[]> => {
    const createdSkills: FlatSkillType[] = [];

    const visit = async (nodes: SkillTreeInput[], inheritedParentId?: string) => {
        for (const node of nodes) {
            const input = toCreateSkillInput(node);
            const created = await createFn(frameworkId, input, inheritedParentId);
            createdSkills.push(created);

            if (afterCreate) {
                await afterCreate(created, node, inheritedParentId);
            }

            if (node.children && node.children.length > 0) {
                await visit(node.children, created.id);
            }
        }
    };

    await visit(skills, rootParentId);

    return createdSkills;
};
