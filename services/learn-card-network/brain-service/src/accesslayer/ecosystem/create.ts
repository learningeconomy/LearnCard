import { v4 as uuid } from 'uuid';

import { Ecosystem, EcosystemInstance } from '@models';
import { Ecosystem as EcosystemType } from '@learncard/types';
import { FlatEcosystemType } from 'types/ecosystem';
import { toJsNumber } from '@accesslayer/ecosystem/read';

export type CreateEcosystemInput = Omit<
    EcosystemType,
    'id' | 'pathIds' | 'slugPath' | 'depth' | 'rootEcosystemId' | 'createdAt' | 'updatedAt'
> & { parentEcosystemId: string | null };

export const createEcosystem = async (input: CreateEcosystemInput): Promise<EcosystemInstance> => {
    const id = `eco_${uuid()}`;
    const now = new Date().toISOString();

    const parent =
        input.parentEcosystemId === null
            ? null
            : ((await Ecosystem.findOne({
                  where: { id: input.parentEcosystemId },
                  plain: true,
              })) as FlatEcosystemType | null);

    const flat: FlatEcosystemType = {
        ...input,
        id,
        parentEcosystemId: input.parentEcosystemId ?? undefined,
        pathIds: parent ? [...parent.pathIds, id] : [id],
        slugPath: parent ? [...parent.slugPath, input.slug] : [input.slug],
        depth: parent ? toJsNumber(parent.depth) + 1 : 0,
        rootEcosystemId: parent ? parent.rootEcosystemId : id,
        settings: JSON.stringify(input.settings ?? {}),
        createdAt: now,
        updatedAt: now,
    };

    const ecosystem = await Ecosystem.createOne(flat);

    if (parent) await ecosystem.relateTo({ alias: 'childOf', where: { id: parent.id } });

    return ecosystem;
};
