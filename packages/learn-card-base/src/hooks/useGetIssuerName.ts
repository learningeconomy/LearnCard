import useWallet from './useWallet';
import { useQuery } from '@tanstack/react-query';
import { getIssuer } from 'learn-card-base/helpers/credentialHelpers';
import { LCNProfile, VC } from '@learncard/types';

export const useGetIssuerName = (vc: VC) => {
    const issuer = getIssuer(vc);
    const { initWallet } = useWallet();

    const getIssuerProfile = async () => {
        const wallet = await initWallet();
        const hasLCNetworkAcct =
            typeof vc?.issuer === 'string'
                ? vc.issuer.includes('did:web')
                : vc?.issuer?.id?.includes('did:web');

        let profile;

        if (hasLCNetworkAcct) {
            const regex = /(users:)(.*)/;
            const profileId = vc?.issuer?.match(regex)?.[2];
            profile = await wallet?.invoke?.getProfile(profileId);
            return profile?.displayName;
        }
        return null;
    };

    const { data: profileName } = useQuery<LCNProfile>({
        queryKey: ['getIssuerProfile', issuer],
        queryFn: getIssuerProfile,
        options: { skip: !!issuer?.name },
    });

    return issuer?.name || profileName;
};

export default useGetIssuerName;
