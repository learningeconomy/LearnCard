import { useFlags } from 'launchdarkly-react-client-sdk';
import { useQueries } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';

export const useLaunchPadContracts = () => {
    const { initWallet } = useWallet();
    // Let's disable consented contracts for now
    //const { data: consentedContracts } = useConsentedContracts();

    const flags = useFlags();

    const smartResumeContract = flags.smartResumeContractUri;

    //const consentedContractUris = consentedContracts?.map(c => c.contract.uri) ?? [];

    const launchPadContractUris: string[] = [
        ...(flags.contracts ?? []),
        // ...consentedContractUris.filter(
        //     uri => !flags.contracts?.includes(uri) && uri !== smartResumeContract
        // ),
    ];

    return useQueries({
        queries: launchPadContractUris.map(uri => ({
            queryKey: ['useContract', uri],
            queryFn: async () => {
                if (!uri) return;

                try {
                    const wallet = await initWallet();

                    return wallet.invoke.getContract(uri);
                } catch (error) {
                    return Promise.reject(error);
                }
            },
        })),
    });
};
