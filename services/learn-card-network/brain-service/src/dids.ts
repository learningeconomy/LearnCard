import express from 'express';
import cors from 'cors';

import { Profile } from '@models';

import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { TypedRequest } from '@helpers/types.helpers';

export const app = express();

app.use('/', cors());
app.get('/:handle/did.json', async (req: TypedRequest<{}, {}, { handle: string }>, res) => {
    const learnCard = await getEmptyLearnCard();

    const profile = await Profile.findOne({ where: { handle: req.params.handle } });

    if (!profile) return res.sendStatus(404);

    const didDoc = await learnCard.invoke.resolveDid(profile.did);
    const key = profile.did.split(':')[2];

    const domainName: string = (req as any).requestContext.domainName;
    const domain =
        domainName && domainName !== 'offlineContext_domainName' // When running locally, domainName is set to 'offlineContext_domainName'
            ? `${domainName}`
            : 'localhost%3A3000';

    return res.json(
        JSON.parse(
            JSON.stringify(didDoc)
                .replaceAll(profile.did, getDidWeb(domain, profile.handle))
                .replaceAll(`#${key}`, '#owner')
        )
    );
});

export default app;
