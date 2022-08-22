import { ModelAliases } from '@glazed/types';
import {
    VerificationItem,
    UnsignedVC,
    VC,
    VP,
    VerificationCheck,
    UnsignedVP,
} from '@learncard/types';

import { DidMethod } from '@wallet/plugins/didkit/types';
import { Algorithm, DidKeyPluginMethods } from '@wallet/plugins/didkey/types';
import { EthereumPluginMethods } from '@wallet/plugins/EthereumPlugin/types';
import { IDXCredential, IDXPluginMethods } from '@wallet/plugins/idx/types';
import { VCPluginMethods, VerifyExtension } from '@wallet/plugins/vc/types';
import { DidkitPluginMethods } from '@wallet/plugins/didkit/types';
import { EthereumConfig } from '@wallet/plugins/EthereumPlugin/types';
import { VpqrPluginMethods } from '@wallet/plugins/vpqr/types';
import { InitInput } from '@didkit/index';

import { InitFunction, GenericInitFunction } from 'types/helpers';
import { Wallet } from 'types/wallet';
import { ethers } from 'ethers';

export * from '@learncard/types';

export type LearnCardRawWallet = Wallet<
    'DIDKit' | 'DID Key' | 'VC' | 'IDX' | 'Expiration' | 'Ethereum' | 'Vpqr',
    DidKeyPluginMethods<DidMethod> &
        VCPluginMethods &
        IDXPluginMethods &
        EthereumPluginMethods &
        VpqrPluginMethods
>;

export type AllLearnCardMethods = {
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
    issuePresentation: (presentation: UnsignedVP) => Promise<VP>;
    /**
     * Verifies a signed Verifiable Presentation
     *
     * Empry error/warnings arrays means verification was successful
     */
    verifyPresentation: (presentation: VP) => Promise<VerificationCheck>;

    /** Returns the credential marked with `title` from IDX */
    getCredential: (title: string) => Promise<VC>;

    /** Returns all credentials from IDX */
    getCredentials: () => Promise<VC[]>;

    /** Returns all credentials from IDX */
    getCredentialsList: () => Promise<IDXCredential[]>;

    /**
     * Publishes a credential to Ceramic, returning the credential's stream ID
     *
     * This stream ID may then be shared/persisted/resolved to gain access to the credential
     *
     * Resolving a stream ID can be done by passing the stream ID to `readFromCeramic`
     */
    publishCredential: (credential: VC) => Promise<string>;

    /**
     * Adds a stream ID  pointing to a credential (such as the one returned by `publishCredential`)
     * to IDX with a bespoke title
     *
     * The credential may then be retrieved using `getCredential` and passing in that bespoke title,
     * or by using `getCredentials` to get a list of all credentials that have been added to IDX
     */
    addCredential: (credential: IDXCredential) => Promise<void>;

    /**
     * Adds a stream ID  pointing to a credential (such as the one returned by `publishCredential`)
     * to IDX with a bespoke title
     *
     * The credential may then be retrieved using `getCredential` and passing in that bespoke title,
     * or by using `getCredentials` to get a list of all credentials that have been added to IDX
     */
    removeCredential: (title: string) => Promise<void>;

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
     * Wraps a crednetial in an exmaple presentaion. If no credential is provided, a new one will be
     * generated using getTestVc
     *
     * You can use this to test out implementations that use this library!
     */
    getTestVp: (credential?: VC) => Promise<UnsignedVP>;

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
     * Get the balance of an ERC20 token for a given address
     *   Defaults to ETH if symbolOrAddress is not provided
     */
    getBalanceForAddress: (walletAddress: string, symbolOrAddress?: string) => Promise<string>;

    /**
     * Transfer tokens to a given address
     */
    transferTokens: (
        tokenSymbolOrAddress: string,
        amount: number,
        toAddress: string
    ) => Promise<string>;

    /**
     * Get your current Ethereum network
     */
    getCurrentNetwork: () => ethers.providers.Networkish;

    /**
     * Change your Ethereum network
     */
    changeNetwork: (network: ethers.providers.Networkish) => void;

    /**
     * Add an infura project id to an existing wallet.
     * Really only useful for testing with the CLI right now...
     */
    addInfuraProjectId: (infuraProjectIdToAdd: string) => void;

    /**
     * Returns a VP from a QR code string.
     */
    VPfromQrCode: (text: string) => Promise<VP>;

    /**
     * Returns a QR-embeddable data string from a VP
     */
    VPtoQrCode: (vp: VP) => Promise<string>;
};

export type LearnCard<
    Methods extends keyof AllLearnCardMethods = keyof AllLearnCardMethods,
    RawWallet extends Wallet<any, any> = LearnCardRawWallet
> = {
    /** Raw IoE wallet instance. You shouldn't need to drop down to this level! */
    _wallet: RawWallet;
} & Pick<AllLearnCardMethods, Methods>;

export type EmptyLearnCard = LearnCard<
    'verifyCredential' | 'verifyPresentation',
    Wallet<'DIDKit' | 'Expiration', DidkitPluginMethods & VerifyExtension>
>;

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

export type EmptyWallet = InitFunction<undefined, 'didkit', EmptyLearnCard>;
export type WalletFromKey = InitFunction<{ seed: string }, keyof LearnCardConfig, LearnCard>;

export type InitLearnCard = GenericInitFunction<[EmptyWallet, WalletFromKey]>;
