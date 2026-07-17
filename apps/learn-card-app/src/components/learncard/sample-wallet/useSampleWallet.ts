import { useQueryClient } from '@tanstack/react-query';

import { demoSessionStore, getLogger, useWallet } from 'learn-card-base';

import { compileSamplePersona, findSamplePersona } from './samplePersonas';

const log = getLogger('sample-wallet');

const FALLBACK_SUBJECT_DID = 'did:example:sample-wallet-user';

export const useSampleWallet = () => {
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();

    const activePersonaId = demoSessionStore.use.activePersonaId();
    const activePersonaName = demoSessionStore.use.personaName();

    const refreshQueries = async (): Promise<void> => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['useGetCredentialList'] }),
            queryClient.invalidateQueries({ queryKey: ['useGetCredentialCount'] }),
            queryClient.invalidateQueries({ queryKey: ['useGetCredentials'] }),
            queryClient.invalidateQueries({ queryKey: ['useGetSkills'] }),
        ]);
    };

    const enterSampleWallet = async (personaId: string): Promise<void> => {
        const persona = findSamplePersona(personaId);

        if (!persona) throw new Error(`Unknown sample persona: ${personaId}`);

        let subjectDid = FALLBACK_SUBJECT_DID;

        try {
            const wallet = await initWallet();
            subjectDid = wallet.id.did();
        } catch (error) {
            log.debug('sample-wallet.subject-did-fallback', error);
        }

        const { records, vcs } = compileSamplePersona(persona, subjectDid);

        demoSessionStore.set.enterDemo({
            personaId: persona.id,
            personaName: persona.name,
            records,
            vcs,
        });

        await refreshQueries();
    };

    const exitSampleWallet = async (): Promise<void> => {
        demoSessionStore.set.exitDemo();
        await refreshQueries();
    };

    return {
        isActive: Boolean(activePersonaId),
        activePersonaId,
        activePersonaName,
        enterSampleWallet,
        exitSampleWallet,
    };
};

export default useSampleWallet;
