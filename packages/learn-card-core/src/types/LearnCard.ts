import { ModelAliases } from '@glazed/types';
import { VerificationItem, UnsignedVC, VC, VP, VerificationCheck } from '@learncard/types';

import { DidMethod } from '@wallet/plugins/didkit/types';
import { Algorithm, DidKeyPluginMethods } from '@wallet/plugins/didkey/types';
import { EthereumPluginMethods } from '@wallet/plugins/EthereumPlugin/types';
import { IDXCredential, IDXPluginMethods } from '@wallet/plugins/idx/types';
import { VCPluginMethods } from '@wallet/plugins/vc/types';
import { EthereumConfig } from '@wallet/plugins/EthereumPlugin/types';
import { InitInput } from '@didkit/index';

import { Wallet } from 'types/wallet';
import { ethers } from 'ethers';

export * from '@learncard/types';

export type LearnCardRawWallet = Wallet<
    'DIDKit' | 'DID Key' | 'VC' | 'IDX' | 'Expiration' | 'Ethereum',
    DidKeyPluginMethods<DidMethod> & VCPluginMethods & IDXPluginMethods & EthereumPluginMethods
>;

export type LearnCardWallet = {
    /** Raw IoE wallet instance. You shouldn't need to drop down to this level! */
    _wallet: LearnCardRawWallet;

    // DidKey stuff

    /** Wallet holder's did */
    did: (type?: DidMethod) => string;
    /** Wallet holder's ed25519 key pair */
    keypair: (type?: Algorithm) => { kty: string; crv: string; x: string; y?: string; d: string };

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
     * Returns Ethereum public address
     */
    getEthereumAddress: () => string;

    /**
     * Get the balance of an ERC20 token
     *   Defaults to ETH if symbolOrAddress is not provided
     */
    getBalance: (symbolOrAddress?: string) => Promise<string>;

    /**
     * Returns your ETH balance
     */
    checkMyEth: () => Promise<string>;

    /**
     * Returns your DAI balance
     */
    checkMyDai: () => Promise<string>;

    /**
     * Returns your USDC balance
     */
    checkMyUsdc: () => Promise<string>;

    /**
     * Returns the ETH balance for the given address
     */
    checkEthForAddress: (address: string) => Promise<string>;

    /**
     * Transfer ETH to an the specified address
     */
    transferEth: (amountInEth: number, toAddress: string) => Promise<string>;

    /**
     * Get your current Ethereum network
     */
    getCurrentEthereumNetwork: () => ethers.providers.Networkish;

    /**
     * Change your Ethereum network
     */
    changeEthereumNetwork: (network: ethers.providers.Networkish) => void;

    /**
     * Add an infura project id to an existing wallet.
     * Really only useful for testing with the CLI right now...
     */
    addInfuraProjectId: (infuraProjectIdToAdd: string) => void;

    test: () => void;
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
