import userflow from 'userflow.js';

import { useEffect } from 'react';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useWallet } from 'learn-card-base';
import { getResolvedTenantConfig } from '../config/bootstrapTenantConfig';

export type UseUserflowIdentifyOptions = {
    debug?: boolean;
};

const getUserflowToken = (): string => {
    try {
        return getResolvedTenantConfig().observability.userflowToken;
    } catch {
        return (typeof IS_PRODUCTION !== 'undefined' && IS_PRODUCTION)
            ? 'ct_qq6z63mixbhyzbzsgmivgrftda'
            : 'ct_w53eaxhevvf2vejzrecekeq3nu';
    }
};

/**
 * Initialize Userflow from TenantConfig.
 * Call after bootstrapTenantConfig() has resolved.
 */
export const initUserflowFromTenant = (): void => {
    const token = getUserflowToken();

    if (token) {
        userflow.init(token);
    }
};

export const useUserflowIdentify = (options: UseUserflowIdentifyOptions = {}) => {
    const currentUser = useCurrentUser();
    const { getDID } = useWallet();
    useEffect(() => {
        if (getUserflowToken()) {
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
