import { initLearnCard } from '@learncard/init';

const { SECURE_SEED, PROFILE_ID, RETURN_TO } = process.env;
if (!SECURE_SEED || !PROFILE_ID || !RETURN_TO) {
    throw new Error('Set SECURE_SEED, PROFILE_ID, and RETURN_TO');
}
const returnTo = new URL(RETURN_TO);
if (returnTo.protocol !== 'https:') throw new Error('RETURN_TO must use HTTPS');

const learnCard = await initLearnCard({ seed: SECURE_SEED, network: true });
if (!(await learnCard.invoke.getProfile())) {
    await learnCard.invoke.createServiceProfile({
        profileId: PROFILE_ID,
        displayName: 'ConsentFlow Tutorial',
    });
}

const contractUri = await learnCard.invoke.createContract({
    name: 'ConsentFlow Tutorial',
    subtitle: 'Receive a tutorial badge',
    description: 'Allow us to read your name and send an achievement.',
    redirectUrl: returnTo.toString(),
    contract: {
        read: {
            personal: { name: { required: false } },
            credentials: { categories: {} },
        },
        write: {
            personal: {},
            credentials: { categories: { Achievement: { required: true } } },
        },
    },
});

const consentUrl = new URL('https://learncard.app/consent-flow');
consentUrl.searchParams.set('uri', contractUri);
consentUrl.searchParams.set('returnTo', returnTo.toString());
console.log(JSON.stringify({ contractUri, consentUrl: consentUrl.toString() }));
