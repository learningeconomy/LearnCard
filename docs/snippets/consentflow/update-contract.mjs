import { pathToFileURL } from 'node:url';
import { initLearnCard } from '@learncard/init';

export const updateTutorialContract = async (learnCard, contractUri, { apply = false } = {}) => {
    const current = await learnCard.invoke.getContract(contractUri);
    // Category maps replace the supplied section: preserve existing entries explicitly.
    const changes = {
        read: {
            ...current.contract.read,
            credentials: {
                ...current.contract.read.credentials,
                categories: {
                    ...current.contract.read.credentials.categories,
                    Transcript: { required: true, reason: 'to calculate your GPA' },
                },
            },
        },
    };
    const options = {
        reason: 'We added transcripts so we can show your GPA on your résumé.',
        dryRun: !apply,
    };
    return learnCard.invoke.updateContract(contractUri, changes, options);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { SECURE_SEED, CONTRACT_URI, APPLY_UPDATE } = process.env;
    if (!SECURE_SEED || !CONTRACT_URI) throw new Error('Set SECURE_SEED and CONTRACT_URI');
    const learnCard = await initLearnCard({ seed: SECURE_SEED, network: true });
    const result = await updateTutorialContract(learnCard, CONTRACT_URI, {
        apply: APPLY_UPDATE === 'true',
    });
    console.log(JSON.stringify(result, null, 2));
}
