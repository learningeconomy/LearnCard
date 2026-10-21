import { initLearnCard } from '@learncard/init';

const { SECURE_SEED, USER_DID, CONTRACT_URI } = process.env;

const learnCard = await initLearnCard({ seed: SECURE_SEED, network: true });

// 1. Is this user's consent still live? Never read without checking.
const profile = await learnCard.invoke.getProfile(USER_DID);
const consented =
    profile && (await learnCard.invoke.verifyConsent(CONTRACT_URI, profile.profileId));
if (!consented) throw new Error('No active consent');

// 2. Fetch what they shared, keeping only records for this contract.
const { records } = await learnCard.invoke.getConsentFlowDataForDid(USER_DID, { limit: 100 });
const mine = records.filter(record => record.contractUri === CONTRACT_URI);

// 3. Resolve the Pay Rate credential(s) and read the structured payload.
for (const { category, uri } of mine.flatMap(record => record.credentials)) {
    if (category !== 'Pay Rate') continue;

    const vc = await learnCard.read.get(uri);
    console.log(JSON.stringify(vc.credentialSubject.dataPayload));
}
