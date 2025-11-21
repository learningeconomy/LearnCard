import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { TORUS_LEGACY_NETWORK } from '@web3auth/openlogin-adapter';

export const MAINNET_CLIENT_ID = WEB3AUTH_MAINNET_CLIENT_ID ?? '';

export const MAINNET_NETWORK = 'cyan';

export const TESTNET_CLIENT_ID = WEB3AUTH_TESTNET_CLIENT_ID ?? '';
export const TESTNET_NETWORK = 'testnet';

export const WEB3AUTH_NETWORK_CONFIG = {
    testnet: {
        modalConfig: {
            clientId: TESTNET_CLIENT_ID,
            web3AuthNetwork: TORUS_LEGACY_NETWORK.TESTNET,
        },
        adapterConfig: {
            network: TORUS_LEGACY_NETWORK.TESTNET,
            clientId: TESTNET_CLIENT_ID,
        },
    },
    mainnet: {
        modalConfig: {
            clientId: MAINNET_CLIENT_ID,
            web3AuthNetwork: TORUS_LEGACY_NETWORK.CYAN,
        },
        adapterConfig: {
            network: TORUS_LEGACY_NETWORK.CYAN,
            clientId: MAINNET_CLIENT_ID,
        },
    },
};

export const getWeb3AuthNetworkConfig = (branding: BrandingEnum = BrandingEnum.learncard) => {
    if (branding === BrandingEnum.scoutPass) return WEB3AUTH_NETWORK_CONFIG.mainnet;

    return WEB3AUTH_NETWORK_CONFIG.testnet;
};
