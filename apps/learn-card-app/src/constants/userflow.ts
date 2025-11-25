import userflow from 'userflow.js';

import { useEffect } from 'react';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useWallet } from 'learn-card-base';

export type UseUserflowIdentifyOptions = {
    debug?: boolean;
};

// Set TRUE for development testing of sentry
const isUserflowEnabled = true; //IS_PRODUCTION;
const USERFLOW_TOKEN = IS_PRODUCTION
    ? 'ct_qq6z63mixbhyzbzsgmivgrftda'
    : 'ct_w53eaxhevvf2vejzrecekeq3nu';

if (isUserflowEnabled) {
    userflow.init(USERFLOW_TOKEN);
}

export const useUserflowIdentify = (options: UseUserflowIdentifyOptions = {}) => {
    const currentUser = useCurrentUser();
    const { getDID } = useWallet();
    useEffect(() => {
        if (isUserflowEnabled) {
            if (currentUser) {
                if (options.debug) console.debug('Userflow Identify user! 🎸', currentUser);
                getDID()
                    .then(did => {
                        const userAttributes = {
                            device_type: window?.innerWidth > 800 ? 'desktop' : 'mobile',
                        };
                        if (options.debug)
                            console.debug('🔍 Userflow Context Identified', did, userAttributes);

                        userflow.identify(did, userAttributes);
                    })
                    .catch(e => {
                        if (options.debug) {
                            console.error(
                                '❌ Unable to identify Userflow User because DID could not be generated.',
                                e
                            );
                        }
                    });
            } else {
                userflow.reset();
            }
        }
    }, [currentUser]);
};
