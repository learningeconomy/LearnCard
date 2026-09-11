import { useCallback } from 'react';
import * as m from '../../paraglide/messages.js';
import {
    useSQLiteStorage,
    getRandomBaseColor,
    currentUserStore,
    walletStore,
} from 'learn-card-base';
import useWallet from 'learn-card-base/hooks/useWallet';
import { getLogger } from 'learn-card-base';

const log = getLogger('use-seed-login');

export const useSeedLogin = () => {
    const { initWallet } = useWallet();
    const { setCurrentUser } = useSQLiteStorage();

    const validate = useCallback((seed: string): string | null => {
        const regex = /^[0-9a-fA-F]+$/;
        if (!regex.test(seed)) {
            return m['login.seedPhrase.error.invalidChars']();
        } else if (seed.length < 64) {
            return m['login.seedPhrase.error.tooShort']();
        } else if (seed.length > 64) {
            return m['login.seedPhrase.error.invalidChars']();
        }
        return null;
    }, []);

    const signInWithSeed = useCallback(
        async (seed: string): Promise<void> => {
            const validationError = validate(seed);
            if (validationError) {
                throw new Error(validationError);
            }

            try {
                const user = {
                    uid: '',
                    email: '',
                    name: '',
                    profileImage: '',
                    aggregateVerifier: '',
                    verifier: '',
                    verifierId: '',
                    typeOfLogin: '',
                    dappShare: '',
                    phoneNumber: '',
                    privateKey: seed,
                    baseColor: getRandomBaseColor(),
                };

                await setCurrentUser(user);
                currentUserStore.set.currentUser(user);

                const wallet = await initWallet(seed);
                if (wallet) {
                    walletStore.set.wallet(wallet);
                } else {
                    throw new Error('Error: Could not initialize wallet');
                }
            } catch (e) {
                log.error('login error:', e);
                throw e;
            }
        },
        [initWallet, setCurrentUser, validate]
    );

    return { signInWithSeed, validate };
};
