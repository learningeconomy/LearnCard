import { BindParam, QueryBuilder } from 'neogma';

import { Presentation, PresentationInstance, Profile } from '@models';
import { flattenObject } from '@helpers/objects.helpers';
import { ProfileType } from 'types/profile';

export const createSentPresentationRelationship = async (
    from: ProfileType,
    to: ProfileType,
    presentation: PresentationInstance,
    metadata?: Record<string, unknown>
): Promise<void> => {
    const properties = flattenObject({
        to: to.profileId,
        date: new Date().toISOString(),
        ...(metadata ? { metadata } : {}),
    });

    await new QueryBuilder(new BindParam({ params: properties }))
        .match({
            related: [
                { model: Profile, where: { profileId: from.profileId }, identifier: 'profile' },
            ],
        })
        .match({
            related: [
                { model: Presentation, where: { id: presentation.id }, identifier: 'presentation' },
            ],
        })
        .create(
            `(profile)-[relationship:${
                Profile.getRelationshipByAlias('presentationSent').name
            }]->(presentation)`
        )
        .set('relationship = $params')
        .run();
};

export const createReceivedPresentationRelationship = async (
    to: ProfileType,
    from: ProfileType,
    presentation: PresentationInstance,
    metadata?: Record<string, unknown>
): Promise<void> => {
    const properties = flattenObject({
        from: from.profileId,
        date: new Date().toISOString(),
        ...(metadata ? { metadata } : {}),
    });

    await new QueryBuilder(new BindParam({ params: properties }))
        .match({
            related: [
                { model: Presentation, where: { id: presentation.id }, identifier: 'presentation' },
            ],
        })
        .match({
            related: [
                { model: Profile, where: { profileId: to.profileId }, identifier: 'profile' },
            ],
        })
        .create(
            `(presentation)-[relationship:${
                Presentation.getRelationshipByAlias('presentationReceived').name
            }]->(profile)`
        )
        .set('relationship = $params')
        .run();
};
