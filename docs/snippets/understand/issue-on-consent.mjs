import { randomUUID } from 'node:crypto';
import { initLCALearnCard } from '@learncard/lca-api-plugin';

const { SECURE_SEED, PROFILE_ID } = process.env;
if (!SECURE_SEED || !PROFILE_ID) throw new Error('Set SECURE_SEED and PROFILE_ID');
const learnCard = await initLCALearnCard({
    seed: SECURE_SEED,
    network: true,
    ...(process.env.LCA_API_URL ? { lcaAPI: process.env.LCA_API_URL } : {}),
});
if (!(await learnCard.invoke.getProfile())) {
    await learnCard.invoke.createProfile({ profileId: PROFILE_ID, displayName: 'Acme Learning' });
}
const boostUri = await learnCard.invoke.createBoost(
    {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: learnCard.id.did(),
        name: 'Connected to Acme',
        credentialSubject: {
            type: ['AchievementSubject'],
            achievement: {
                id: `urn:uuid:${randomUUID()}`,
                type: ['Achievement'],
                name: 'Connected to Acme',
                description: 'Connected to Acme Learning.',
                criteria: { narrative: 'Consent to the Acme contract.' },
            },
        },
    },
    { name: 'Connected to Acme', category: 'Achievement', status: 'LIVE' }
);
const authority = await learnCard.invoke.createSigningAuthority('consent-issuer');
if (!authority) throw new Error('Could not create signing authority');
await learnCard.invoke.registerSigningAuthority(authority.endpoint, authority.name, authority.did);
await learnCard.invoke.setPrimaryRegisteredSigningAuthority(authority.endpoint, authority.name);
await learnCard.invoke.clearDidWebCache();
const contractUri = await learnCard.invoke.createContract({
    name: 'Acme Learning',
    contract: {
        read: { personal: {}, credentials: { categories: {} } },
        write: { personal: {}, credentials: { categories: { Achievement: {} } } },
    },
    autoboosts: [
        {
            boostUri,
            signingAuthority: { endpoint: authority.endpoint, name: authority.name },
        },
    ],
});
console.log('contract:', contractUri);
