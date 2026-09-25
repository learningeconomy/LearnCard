import type { CredentialBundle } from './types';
import { studentBundle } from './student';

const BUNDLES: Readonly<Record<string, CredentialBundle>> = {
    [studentBundle.id]: studentBundle,
};

export const getBundle = (id: string): CredentialBundle => {
    const bundle = BUNDLES[id];

    if (!bundle) {
        throw new Error(`Unknown credential bundle: ${id}`);
    }

    return bundle;
};

export { studentBundle } from './student';
export type { CredentialBundle, CredentialBundleEntry, CredentialBundleIssuer } from './types';
