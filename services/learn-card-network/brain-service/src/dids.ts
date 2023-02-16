import express from 'express';
import cors from 'cors';

import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { TypedRequest } from '@helpers/types.helpers';
import { getProfileByProfileId } from '@accesslayer/profile/read';

export const app = express();

app.use('/', cors());
app.get('/:profileId/did.json', async (req: TypedRequest<{}, {}, { profileId: string }>, res) => {
    const learnCard = await getEmptyLearnCard();

    const profile = await getProfileByProfileId(req.params.profileId);

    if (!profile) return res.sendStatus(404);

    const didDoc = await learnCard.invoke.resolveDid(profile.did);
    const key = profile.did.split(':')[2];

    const domainName: string = (req as any).requestContext.domainName;
    const domain =
        !domainName || process.env.IS_OFFLINE
            ? `localhost%3A${process.env.PORT || 3000}`
            : domainName;

    return res.json(
        JSON.parse(
            JSON.stringify(didDoc)
                .replaceAll(profile.did, getDidWeb(domain, profile.profileId))
                .replaceAll(`#${key}`, '#owner')
        )
    );
});

export default app;
