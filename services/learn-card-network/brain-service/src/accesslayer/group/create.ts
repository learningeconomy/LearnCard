import { v4 as uuid } from 'uuid';
import { TRPCError } from '@trpc/server';

import { Group, GroupInstance, Ecosystem } from '@models';
import { Group as GroupType } from '@learncard/types';
import { FlatGroupType } from 'types/group';

export type CreateGroupInput = Omit<
    GroupType,
    'id' | 'pathIds' | 'depth' | 'rootGroupId' | 'createdAt' | 'updatedAt'
> & { parentGroupId: string | null };

export const createGroup = async (input: CreateGroupInput): Promise<GroupInstance> => {
    if (input.membershipMode === 'COMPUTED' && input.computedCriteria === undefined) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'COMPUTED groups require computedCriteria.',
        });
    }

    if (input.membershipMode === 'EXPLICIT' && input.computedCriteria !== undefined) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'EXPLICIT groups must not carry computedCriteria.',
        });
    }

    const id = `grp_${uuid()}`;
    const now = new Date().toISOString();

    const parent =
        input.parentGroupId === null
            ? null
            : ((await Group.findOne({
                  where: { id: input.parentGroupId },
                  plain: true,
              })) as FlatGroupType | null);

    const { computedCriteria, ...rest } = input;

    const flat: FlatGroupType = {
        ...rest,
        id,
        parentGroupId: rest.parentGroupId ?? undefined,
        pathIds: parent ? [...parent.pathIds, id] : [id],
        depth: parent ? parent.depth + 1 : 0,
        rootGroupId: parent ? parent.rootGroupId : id,
        computedCriteria:
            computedCriteria === undefined ? undefined : JSON.stringify(computedCriteria),
        createdAt: now,
        updatedAt: now,
    };

    const group = await Group.createOne(flat);

    if (parent) await group.relateTo({ alias: 'childOf', where: { id: parent.id } });

    const ownerEcosystem = await Ecosystem.findOne({
        where: { id: input.ownerEcosystemId },
    });

    if (ownerEcosystem) await ownerEcosystem.relateTo({ alias: 'owns', where: { id: group.id } });

    return group;
};
