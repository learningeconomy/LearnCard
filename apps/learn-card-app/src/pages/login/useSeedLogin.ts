import { useCallback } from 'react';
import * as m from '../../paraglide/messages.js';
import {
    useSQLiteStorage,
    getRandomBaseColor,
    getNotificationsEndpoint,
    currentUserStore,
    walletStore,
} from 'learn-card-base';
import { useQueryClient } from '@tanstack/react-query';
import useWallet from 'learn-card-base/hooks/useWallet';
import { getLogger } from 'learn-card-base';
import { setAuthToken } from 'learn-card-base/helpers/authHelpers';
import { setPlatformPrivateKey } from 'learn-card-base/security/platformPrivateKeyStorage';

const log = getLogger('use-seed-login');

export type SeedLoginOptions = {
    /** Create this network profile for the seed if it doesn't exist yet. */
    profileId?: string;
};

export const useSeedLogin = () => {
    const { initWallet } = useWallet();
    const { setCurrentUser } = useSQLiteStorage();
    const queryClient = useQueryClient();

    const validate = useCallback((seed: string): string | null => {
        const regex = /^[0-9a-fA-F]+$/;
        if (!regex.test(seed)) {
            return m['login.seedPhrase.error.invalidChars']();
        } else if (seed.length !== 64) {
            return m['login.seedPhrase.error.wrongLength']();
        }
        return null;
    }, []);

    const signInWithSeed = useCallback(
        async (seed: string, options: SeedLoginOptions = {}): Promise<void> => {
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
                await setPlatformPrivateKey(seed);

                const wallet = await initWallet(seed);
                if (wallet) {
                    walletStore.set.wallet(wallet);
                } else {
                    throw new Error('Error: Could not initialize wallet');
                }

                setAuthToken('dummy');

                if (options.profileId) {
                    try {
                        await wallet.invoke.createProfile({
                            did: wallet.id.did(),
                            profileId: options.profileId,
                            displayName: 'User From Seed',
                            notificationsWebhook: getNotificationsEndpoint(),
                        });
                    } catch (err) {
                        log.info('createProfile::error (may already exist)', err);
                    }
                    // Drop the cached null getProfile so the LCN gate sees the new profile.
                    await queryClient.resetQueries();
                }
            } catch (e) {
                log.error('login error:', e);
                throw e;
            }
        },
        [initWallet, queryClient, setCurrentUser, validate]
    );

    return { signInWithSeed, validate };
};
