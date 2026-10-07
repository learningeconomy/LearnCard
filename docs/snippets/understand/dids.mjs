import { initLearnCard } from '@learncard/init';

const { SECURE_SEED, PROFILE_ID } = process.env;
if (!SECURE_SEED || !PROFILE_ID) throw new Error('Set SECURE_SEED and PROFILE_ID');
const learnCard = await initLearnCard({ seed: SECURE_SEED, network: true });
if (!(await learnCard.invoke.getProfile())) {
    await learnCard.invoke.createProfile({ profileId: PROFILE_ID, displayName: 'Understand DIDs' });
}
console.log('profile:', learnCard.id.did());
console.log('key:', learnCard.id.did('key'));
const { kty, crv } = learnCard.id.keypair();
console.log('keypair:', kty, crv); // Never print the private JWK fields.
