import { randomBytes } from 'node:crypto';

import { expect } from '../expect';
import type { FeatureDefinition } from '../types';
import { boostTemplate } from './sdk';
import {
    assertStoredCredential,
    claimFromNotifications,
    openStoredBadge,
    readIssuer,
} from './shared';

export const sdkToAppFeature: FeatureDefinition = {
    id: 'sdk-to-app',
    title: 'An SDK issuer sends a boost; the learner claims it in the app; the issuer sees the claim',
    surface: 'cross-surface',
    entries: [
        'cross-sdk-send',
        'cross-app-claim',
        'cross-app-wallet-detail',
        'cross-sdk-observes-claim',
    ],
    run: async context => {
        const { issuer, learner } = context.actors;
        const title = `SDK to app ${randomBytes(3).toString('hex')}`;
        const issuerLc = await context.sdk(issuer);
        const page = await context.newPage('sdk-to-app-learner', { signInAs: learner });

        const sent = await context.step(page, 'cross-sdk-send', async () => {
            const boostUri = await issuerLc.invoke.createBoost(
                boostTemplate(issuerLc.id.did(), title),
                {
                    name: title,
                    category: 'Social Badge',
                }
            );
            const credentialUri = await issuerLc.invoke.sendBoost(learner.profileId, boostUri);
            return { boostUri, credentialUri };
        });
        await context.step(page, 'cross-app-claim', () => claimFromNotifications(page, title));
        const { issuerShown, storedCredential } = await context.step(
            page,
            'cross-app-wallet-detail',
            async () => {
                const issuerShown = await readIssuer(await openStoredBadge(page, title));
                const learnerLc = await context.sdk(learner);
                const storedCredential = await assertStoredCredential(learnerLc, {
                    title,
                    issuerDid: issuerLc.id.did(),
                    subjectDid: learnerLc.id.did(),
                    uri: sent.credentialUri,
                });
                await context.record('cross-stored-credential-proof', storedCredential);
                return { issuerShown, storedCredential };
            }
        );
        await context.step(page, 'cross-sdk-observes-claim', async () => {
            const recipients = await issuerLc.invoke.getBoostRecipients(sent.boostUri);
            expect(recipients.map(item => item.to.profileId)).toContain(learner.profileId);
            const graph = await context.inspect.neo4j(
                `MATCH (:Profile {profileId: '${issuer.profileId}'})-[:CREDENTIAL_SENT]->(c:Credential)-[r:CREDENTIAL_RECEIVED]->(:Profile {profileId: '${learner.profileId}'}) RETURN count(c) AS received, sum(CASE WHEN r.status IS NULL THEN 1 ELSE 0 END) AS claimed`
            );
            await context.record('cross-graph', graph);
            expect(graph).toMatch(/^received, claimed\n1, 1$/m);
        });
        return {
            observations: {
                issuerProfileId: issuer.profileId,
                learnerProfileId: learner.profileId,
                title,
                issuerShownInApp: issuerShown,
                storedCredential,
                ...sent,
            },
        };
    },
};
