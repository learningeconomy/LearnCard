import { useState, useEffect, useCallback } from 'react';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { getCredentialSubject } from '../../IssueVC/helpers';
import { VC } from '@learncard/types';
import useWallet from 'learn-card-base/hooks/useWallet';

interface Profile {
    name?: string;
    image?: string;
    displayName?: string;
    profileId?: string;
}

const useCredentialProfiles = (credential: VC, lc?: BespokeLearnCard) => {
    const [issuerProfile, setIssuerProfile] = useState<Profile>();
    const [issueeProfile, setIssueeProfile] = useState<Profile>();
    const [issueeOverride, setIssueeOverride] = useState('');
    const { initWallet } = useWallet();

    const credentialSubject = getCredentialSubject(credential);
    const idIssuerName = credential?.display?.idIssuerName;
    const _issueeName = credential?.display?.issueeName;

    const fetchProfile = async (wallet: BespokeLearnCard, profileId: string) => {
        try {
            const profile = await wallet.invoke.getProfile(profileId);
            return profile ? { ...profile, name: profile?.displayName } : {};
        } catch (error) {
            console.warn('Error fetching profile:', error);
            return {};
        }
    };

    const getIssuerProfile = useCallback(async () => {
        const wallet = lc || (await initWallet());
        const hasLCNetworkAcct =
            typeof credential?.issuer === 'string'
                ? credential.issuer.includes('did:web')
                : credential?.issuer?.id?.includes('did:web');

        let profile: Profile | undefined;

        if (hasLCNetworkAcct) {
            const regex = /(users:|:p:)(.*)/;
            const profileId = credential?.issuer?.match?.(regex)?.[2];
            profile = await wallet.invoke.getProfile(profileId);

            if (profile) {
                setIssuerProfile(profile);
            }
        }

        if (idIssuerName) {
            setIssuerProfile({
                ...profile,
                name: idIssuerName,
            });
        }
    }, [credential, lc, idIssuerName]);

    const getIssueeProfile = useCallback(async () => {
        const wallet = lc || (await initWallet());
        const hasLCNetworkAcct = credentialSubject?.id?.includes('did:web');

        if (hasLCNetworkAcct) {
            const regex = /(users:|:p:)(.*)/;
            const profileId = credentialSubject?.id?.match?.(regex)?.[2];
            // console.log('///issuee profile', credentialSubject);
            if (profileId) {
                const profile = await fetchProfile(wallet, profileId);
                if (profile?.displayName) {
                    setIssueeOverride(profile?.displayName);
                }
                setIssueeProfile(profile);
            }
        }

        if (_issueeName) {
            setIssueeOverride(_issueeName);
        }
    }, [credentialSubject, lc, _issueeName]);

    useEffect(() => {
        if (credential && credential?.issuer) getIssuerProfile();
        if (credential && credentialSubject?.id) getIssueeProfile();
    }, [credential, credentialSubject, getIssuerProfile, getIssueeProfile]);

    return {
        issuerProfile,
        issueeProfile,
        issueeOverride,
        getProfiles: useCallback(() => {
            getIssuerProfile();
            getIssueeProfile();
        }, [getIssuerProfile, getIssueeProfile]),
    };
};

export default useCredentialProfiles;
