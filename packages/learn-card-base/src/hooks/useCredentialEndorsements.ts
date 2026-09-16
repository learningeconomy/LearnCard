import { useEffect, useRef, useState } from 'react';

import type { UnsignedAchievementCredential, UnsignedVC } from '@learncard/types';
import { useWallet } from 'learn-card-base';
import { getCredentialSubject, getEndorsements } from 'learn-card-base/helpers/credentialHelpers';

type Credential = UnsignedVC | UnsignedAchievementCredential;
type CredentialEndorsements = Awaited<ReturnType<typeof getEndorsements>>;
const EMPTY_ENDORSEMENTS: CredentialEndorsements = [];

type EndorsementState = {
    credentialKey: string;
    endorsements: CredentialEndorsements;
};

/** Loads endorsements without exposing results from a previously displayed credential. */
export const useCredentialEndorsements = (credential: Credential): CredentialEndorsements => {
    const { initWallet } = useWallet();
    const credentialKey = credential?.id ?? getCredentialSubject(credential)?.id ?? '';
    const credentialRef = useRef(credential);
    const initWalletRef = useRef(initWallet);
    const [state, setState] = useState<EndorsementState>({
        credentialKey,
        endorsements: EMPTY_ENDORSEMENTS,
    });

    useEffect(() => {
        credentialRef.current = credential;
        initWalletRef.current = initWallet;
    }, [credential, initWallet]);

    useEffect(() => {
        let cancelled = false;

        const fetchEndorsements = async (): Promise<void> => {
            const wallet = await initWalletRef.current();
            const endorsements = await getEndorsements(wallet, credentialRef.current);

            if (!cancelled) setState({ credentialKey, endorsements });
        };

        void fetchEndorsements();

        return () => {
            cancelled = true;
        };
    }, [credentialKey]);

    return state.credentialKey === credentialKey ? state.endorsements : EMPTY_ENDORSEMENTS;
};

export default useCredentialEndorsements;
