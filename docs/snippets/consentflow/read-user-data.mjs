import { pathToFileURL } from 'node:url';
import { initLearnCard } from '@learncard/init';
import { verifyConsentRedirect } from './consent-callback.mjs';

export const readUserData = async (learnCard, userDid, contractUri) => {
    const profile = await learnCard.invoke.getProfile(userDid);
    if (!profile) return [];
    const hasAccess = () => learnCard.invoke.verifyConsent(contractUri, profile.profileId);
    if (!(await hasAccess())) return [];
    const records = [];
    let cursor;
    do {
        const page = await learnCard.invoke.getConsentFlowDataForDid(userDid, {
            limit: 100,
            ...(cursor ? { cursor } : {}),
        });
        records.push(...page.records.filter(record => record.contractUri === contractUri));
        if (!page.hasMore) return (await hasAccess()) ? records : [];
        if (!page.cursor || page.cursor === cursor) throw new Error('Pagination did not advance');
        cursor = page.cursor;
    } while (true);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { SECURE_SEED, CONTRACT_URI, CONSENT_VP } = process.env;
    if (!SECURE_SEED || !CONTRACT_URI) throw new Error('Set SECURE_SEED and CONTRACT_URI');
    const learnCard = await initLearnCard({ seed: SECURE_SEED, network: true });
    const verified = await verifyConsentRedirect(learnCard, CONSENT_VP, CONTRACT_URI);
    if (verified.status !== 'verified') throw new Error('Consent denied or abandoned');
    const records = await readUserData(learnCard, verified.userDid, CONTRACT_URI);
    console.log(
        records.length ? `Active consent: ${records.length} record(s).` : 'No active consent.'
    );
}
