import { MetaMaskInpageProvider } from '@metamask/providers';

// Types that should be available globally within a Snap
declare global {
    const wallet: MetaMaskInpageProvider;
}
