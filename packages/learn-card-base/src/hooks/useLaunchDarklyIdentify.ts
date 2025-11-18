import { useEffect } from 'react';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { useWallet } from 'learn-card-base';
import { ANONYMOUS_CONTEXT } from '../constants/launchDarkly';
import { useIsCurrentUserLCNUser } from 'learn-card-base';

export type UseLaunchDarklyOptions = {
    debug?: boolean;
};

export const useLaunchDarklyIdentify = (options: UseLaunchDarklyOptions = {}) => {
    const currentUser = useCurrentUser();
    const { data: currentLCNUser } = useIsCurrentUserLCNUser();

    const ldClient = useLDClient();
    const { getDID } = useWallet();

    useEffect(() => {
        if (currentUser && ldClient) {
            if (options.debug) console.debug('Identify user! 🎸', currentUser);
            getDID()
                .then(did => {
                    const context = {
                        kind: 'user',
                        key: did,
                        name: currentUser?.name,
                        email: currentUser?.email,
                    };

                    if (options.debug)
                        console.debug('🔍 LaunchDarkly User Context Identified', context);

                    ldClient.identify(context, undefined, (err, flags) => {
                        if (err) {
                            console.error('❌ Error Updating LaunchDarkly Context', err);
                        } else if (options.debug) {
                            console.debug('✅ New LaunchDarkly Context Set', context, flags);
                        }
                    });
                })
                .catch(e => {
                    console.error(
                        '❌ Unable to identify LaunchDarkly User because DID could not be generated.',
                        e
                    );
                });
        } else {
            ldClient?.identify(ANONYMOUS_CONTEXT, undefined, (err, flags) => {
                if (err) {
                    console.error('❌ Error Revoking LaunchDarkly Context', err);
                } else if (options.debug) {
                    console.debug(
                        '✅ LaunchDarkly Context Revoked On Logout',
                        ANONYMOUS_CONTEXT,
                        flags
                    );
                }
            });
        }
    }, [currentUser, currentLCNUser]);
};
