import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
assert.ok(process.env.PROFILE_ID);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
if (!(await learnCard.invoke.getProfile())) {
    await learnCard.invoke.createServiceProfile({
        profileId: process.env.PROFILE_ID,
        displayName: 'Methods Example',
        bio: '',
        shortBio: '',
    });
}
const profile = await learnCard.invoke.getProfile();
assert.equal(profile.profileId, process.env.PROFILE_ID);
console.log('profile: found');
await learnCard.invoke.updateProfile({ displayName: 'Methods Reference Issuer' });
assert.equal((await learnCard.invoke.getProfile()).displayName, 'Methods Reference Issuer');
console.log('updated: true');
const results = await learnCard.invoke.searchProfiles(profile.profileId, {
    includeSelf: true,
    includeServiceProfiles: true,
});
assert.ok(results.some(result => result.profileId === profile.profileId));
console.log('search: found');
