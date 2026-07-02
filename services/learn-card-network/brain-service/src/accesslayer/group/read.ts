import { Group } from '@models';
import { Group as GroupType } from '@learncard/types';
import { FlatGroupType } from 'types/group';

export const inflateGroup = (flat: FlatGroupType): GroupType => {
    const { computedCriteria, parentGroupId, ...rest } = flat;

    let parsedCriteria: unknown = undefined;

    if (computedCriteria) {
        try {
            parsedCriteria = JSON.parse(computedCriteria);
        } catch {
            parsedCriteria = undefined;
        }
    }

    return { ...rest, parentGroupId: parentGroupId ?? null, computedCriteria: parsedCriteria };
};

export const getGroupById = async (id: string): Promise<GroupType | null> => {
    const flat = await Group.findOne({ where: { id }, plain: true });

    return flat ? inflateGroup(flat as FlatGroupType) : null;
};

export const getGroupsOwnedByEcosystem = async (ownerEcosystemId: string): Promise<GroupType[]> => {
    const results = await Group.findMany({ where: { ownerEcosystemId } });

    return results.map(result => inflateGroup(result.dataValues as FlatGroupType));
};

export const getChildGroups = async (parentGroupId: string): Promise<GroupType[]> => {
    const results = await Group.findMany({ where: { parentGroupId } });

    return results.map(result => inflateGroup(result.dataValues as FlatGroupType));
};
