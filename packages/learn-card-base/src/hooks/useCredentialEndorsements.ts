import { useEffect, useMemo, useRef, useState } from 'react';

import type { UnsignedAchievementCredential, UnsignedVC } from '@learncard/types';
import { useWallet } from 'learn-card-base';
import {
    getEndorsements,
    type CredentialEndorsement,
} from 'learn-card-base/helpers/credentialHelpers';
import { stringify } from 'learn-card-base/helpers/jsonHelpers';
import { getLogger } from '../logging/logger';

type Credential = UnsignedVC | UnsignedAchievementCredential;
const EMPTY_ENDORSEMENTS: CredentialEndorsement[] = [];
const log = getLogger('credential-endorsements');

type EndorsementState = {
    credentialKey: string;
    endorsements: CredentialEndorsement[];
};

/** Loads endorsements without exposing results from a previously displayed credential. */
export const useCredentialEndorsements = (credential: Credential): CredentialEndorsement[] => {
    const { initWallet } = useWallet();
    const credentialKey = useMemo(
        () => credential?.id ?? (credential ? stringify(credential) : ''),
        [credential]
    );
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
        if (!credentialKey) return;

        let cancelled = false;

        const currentCredential = credentialRef.current;
        const fetchEndorsements = async (): Promise<void> => {
            const wallet = await initWalletRef.current();
            const endorsements = await getEndorsements(wallet, currentCredential);

            if (!cancelled) setState({ credentialKey, endorsements });
        };

        void fetchEndorsements().catch(error => {
            log.warn('credential.endorsements.load.failed', error, {
                hasCredentialId: Boolean(currentCredential?.id),
            });
        });

        return () => {
            cancelled = true;
        };
    }, [credentialKey]);

    return state.credentialKey === credentialKey ? state.endorsements : EMPTY_ENDORSEMENTS;
};

export default useCredentialEndorsements;
