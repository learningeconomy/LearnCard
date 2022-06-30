import { ModelAliases } from '@glazed/types';
import { VerificationItem, UnsignedVC, VC, VP } from '@learncard/types';

import { DidKeyPluginMethods } from '@wallet/plugins/didkey/types';
import { IDXCredential, IDXPluginMethods } from '@wallet/plugins/idx/types';
import { VCPluginMethods, VerificationCheck } from '@wallet/plugins/vc/types';
import { EthereumConfig } from '@wallet/plugins/EthereumPlugin/types';
import { InitInput } from 'didkit';

import { UnlockedWallet } from 'types/wallet';

// export * from '@learncard/types';
// export { EthereumNetworks } from '@wallet/plugins/EthereumPlugin/types';

export type LearnCardRawWallet = UnlockedWallet<
    'DID Key' | 'VC' | 'IDX' | 'Expiration' | 'Ethereum',
    DidKeyPluginMethods & VCPluginMethods & IDXPluginMethods
>;

export type LearnCardWallet = {
    /** Raw IoE wallet instance. You shouldn't need to drop down to this level! */
    _wallet: LearnCardRawWallet;

    // DidKey stuff

    /** Wallet holder's did */
    did: string;
    /** Wallet holder's ed25519 key pair */
    keypair: Record<string, string>;

    /** Signs an unsigned Verifiable Credential, returning the signed VC */
    issueCredential: (credential: UnsignedVC) => Promise<VC>;
    /**
     * Verifies a signed Verifiable Credential
     *
     * Empty error/warnings arrays means verification was successful
     */
    verifyCredential: (credential: VC) => Promise<VerificationItem[]>;
    /** Creates a signed Verifiable Presentation from a signed Verifiable Credential */
    issuePresentation: (credential: VC) => Promise<VP>;
    /**
     * Verifies a signed Verifiable Presentation
     *
     * Empry error/warnings arrays means verification was successful
     */
    verifyPresentation: (presentation: VP) => Promise<VerificationCheck>;

    /** Returns the credential marked with `title` from IDX */
    getCredential: (title: string) => Promise<any>;
    /** Returns all credentials from IDX */
    getCredentials: () => Promise<any[]>;
    /**
     * Publishes a credential to Ceramic, returning the credential's stream ID
     *
     * This stream ID may then be shared/persisted/resolved to gain access to the credential
     *
     * Resolving a stream ID can be done by passing the stream ID to `readFromCeramic`
     */
    publishCredential: (credential: any) => Promise<string>;
    /**
     * Adds a stream ID  pointing to a credential (such as the one returned by `publishCredential`)
     * to IDX with a bespoke title
     *
     * The credential may then be retrieved using `getCredential` and passing in that bespoke title,
     * or by using `getCredentials` to get a list of all credentials that have been added to IDX
     */
    addCredential: (credential: IDXCredential) => Promise<void>;

    /**
     * Resolves a stream ID, returning its contents
     *
     * This can be given the return value of `publishCredential` to gain access to the credential
     * that was published
     */
    readFromCeramic: (streamId: string) => Promise<any>;

    /**
     * Returns an example credential, optionally allowing a subject's did to be passed in
     *
     * You can use this to test out implementations that use this library!
     */
    getTestVc: (subject?: string) => UnsignedVC;

    /**
     * Returns your ethereum balance
     */
    checkMyEth: () => Promise<number>;
};

export type CeramicIDXArgs = {
    modelData: ModelAliases;
    credentialAlias: string;
    ceramicEndpoint: string;
    defaultContentFamily: string;
};

export type LearnCardConfig = {
    ceramicIdx: CeramicIDXArgs;
    didkit: InitInput | Promise<InitInput>;
    defaultContents: any[];
    ethereumConfig: EthereumConfig;
};
