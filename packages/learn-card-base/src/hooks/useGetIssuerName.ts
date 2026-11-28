import useWallet from './useWallet';
import { useQuery } from '@tanstack/react-query';
import { getIssuer } from 'learn-card-base/helpers/credentialHelpers';
import { VC } from '@learncard/types';

export const useGetIssuerName = (vc: VC, enabled = true) => {
    const issuer = getIssuer(vc);
    const issuerName = typeof issuer === 'string' ? undefined : issuer?.name;
    const { initWallet } = useWallet();

    const getIssuerProfile = async (): Promise<string | null> => {
        const wallet = await initWallet();
        const hasLCNetworkAcct =
            typeof vc?.issuer === 'string'
                ? vc.issuer.includes('did:web')
                : vc?.issuer?.id?.includes('did:web');

        let profile;

        if (hasLCNetworkAcct) {
            const regex = /(users:)(.*)/;
            const issuerDid = typeof issuer === 'string' ? issuer : issuer?.id;
            const profileId = issuerDid?.match(regex)?.[2];
            profile = await wallet?.invoke?.getProfile(profileId);
            return profile?.displayName ?? null;
        }
        return null;
    };

    const { data: profileName } = useQuery<string | null>({
        queryKey: ['getIssuerProfile', issuer],
        queryFn: getIssuerProfile,
        enabled: enabled && !!issuer && !issuerName,
    });

    return issuerName || profileName;
};

export default useGetIssuerName;
