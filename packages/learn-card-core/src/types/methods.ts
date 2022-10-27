/** @module LearnCard Methods */

import { ethers } from 'ethers';
import {
    VerificationItem,
    UnsignedVC,
    VC,
    VP,
    VerificationCheck,
    UnsignedVP,
    CredentialRecord,
} from '@learncard/types';

import { NewCredentialFunction } from '@wallet/plugins/vc-templates/types';
import { DidMethod, InputMetadata, ProofOptions } from '@wallet/plugins/didkit/types';
import { Algorithm } from '@wallet/plugins/didkey/types';
import {
    HandlerResponse,
    CredentialRequestEvent,
    CredentialStoreEvent,
} from '@wallet/plugins/chapi/types';
import { CeramicURI } from '@wallet/plugins';

/**
 * Wallet holder's did
 *
 * @group LearnCard Methods
 */
export type Did = (type?: DidMethod) => string;

/**
 * Wallet holder's ed25519 key pair
 *
 * @group LearnCard Methods
 */
export type Keypair = (type?: Algorithm) => {
    kty: string;
    crv: string;
    x: string;
    y?: string;
    d: string;
};

/**
 * Generates a new Unsigned VC from a template
 *
 * @group LearnCard Methods
 */
export type NewCredential = NewCredentialFunction;

/**
 * Wraps a VC in a simple Presentation
 *
 * @group LearnCard Methods
 */
export type NewPresentation = (credential: VC, args?: { did?: string }) => Promise<UnsignedVP>;

/**
 * Signs an unsigned Verifiable Credential, returning the signed VC
 *
 * @group LearnCard Methods
 */
export type IssueCredential = (
    credential: UnsignedVC,
    signingOptions?: Partial<ProofOptions>
) => Promise<VC>;

/**
 * Verifies a signed Verifiable Credential
 *
 * Empty error/warnings arrays means verification was successful
 *
 * @group LearnCard Methods
 */
export type VerifyCredential = (
    credential: VC,
    options?: Partial<ProofOptions>
) => Promise<VerificationItem[]>;

/**
 * Signs an unsigned Verifiable Presentation, returning the signed VP
 *
 * @group LearnCard Methods
 */
export type IssuePresentation = (
    presentation: UnsignedVP,
    signingOptions?: Partial<ProofOptions>
) => Promise<VP>;
/**
 * Verifies a signed Verifiable Presentation
 *
 * Empry error/warnings arrays means verification was successful
 *
 * @group LearnCard Methods
 */
export type VerifyPresentation = (
    presentation: VP,
    options?: Partial<ProofOptions>
) => Promise<VerificationCheck>;

/**
 * Returns the credential marked with `title` from IDX
 *
 * @group LearnCard Methods
 */
export type GetCredential = (title: string) => Promise<VC | undefined>;

/**
 * Returns all credentials from IDX
 *
 * @group LearnCard Methods
 */
export type GetCredentials = () => Promise<VC[]>;

/**
 * Returns all credentials from IDX
 *
 * @group LearnCard Methods
 */
export type GetCredentialsList = <
    Metadata extends Record<string, any> = Record<never, never>
    >() => Promise<CredentialRecord<Metadata>[]>;

/**
 * Publishes a credential to Ceramic, returning the credential's Ceramic URI
 *
 * This URI may then be shared/persisted/resolved to gain access to the credential
 *
 * Resolving a URI can be done by passing the URI to `resolveCredential`
 *
 * @group LearnCard Methods
 */
export type PublishCredential = (credential: VC) => Promise<CeramicURI>;

/**
 * Adds a URI pointing to a credential (such as the one returned by `publishCredential`)
 * to IDX with a bespoke ID
 *
 * The credential may then be retrieved using `getCredential` and passing in that bespoke ID,
 * or by using `getCredentials`/`getCredentialsList` to get a list of all credentials that have been added to IDX
 *
 * @group LearnCard Methods
 */
export type AddCredential = <Metadata extends Record<string, any> = Record<never, never>>(
    credential: CredentialRecord<Metadata>
) => Promise<void>;

/**
 * Removes a credential from IDX by passing in its bespoke ID
 *
 * @group LearnCard Methods
 */
export type RemoveCredential = (id: string) => Promise<void>;

/**
 * Resolves a did to its did document
 *
 * @group LearnCard Methods
 */
export type ResolveDid = (
    did: string,
    inputMetadata?: InputMetadata
) => Promise<Record<string, any>>;

/**
 * Resolves a stream ID, returning its contents
 *
 * @group LearnCard Methods
 */
export type ReadFromCeramic = (streamId: string) => Promise<any>;

/**
 * Resolves a LearnCard URI (e.g. lc:ceramic:1234561)
 *
 * This can be given the return value of `publishCredential` to gain access to the credential
 * that was published
 *
 * @group LearnCard Methods
 */
export type ResolveCredential = (
    URI?: string | '' | `lc:ceramic:${string}`
) => Promise<VC | undefined>;

/**
 * Returns an example credential, optionally allowing a subject's did to be passed in
 *
 * You can use this to test out implementations that use this library!
 *
 * @group LearnCard Methods
 */
export type GetTestVc = (subject?: string) => UnsignedVC;

/**
 * Wraps a crednetial in an exmaple presentaion. If no credential is provided, a new one will be
 * generated using getTestVc
 *
 * You can use this to test out implementations that use this library!
 *
 * @group LearnCard Methods
 */
export type GetTestVp = (credential?: VC) => Promise<UnsignedVP>;

/**
 * Returns Ethereum public address
 *
 * @group LearnCard Methods
 */
export type GetEthereumAddress = () => string;

/**
 * Get the balance of an ERC20 token
 *   Defaults to ETH if symbolOrAddress is not provided
 *
 * @group LearnCard Methods
 */
export type GetBalance = (symbolOrAddress?: string) => Promise<string>;

/**
 * Get the balance of an ERC20 token for a given address
 *   Defaults to ETH if symbolOrAddress is not provided
 *
 * @group LearnCard Methods
 */
export type GetBalanceForAddress = (
    walletAddress: string,
    symbolOrAddress?: string
) => Promise<string>;

/**
 * Transfer tokens to a given address
 *
 * @group LearnCard Methods
 */
export type TransferTokens = (
    tokenSymbolOrAddress: string,
    amount: number,
    toAddress: string
) => Promise<string>;

/**
 * Get the gas price of the current network
 *
 * @group LearnCard Methods
 */
export type GetGasPrice = () => Promise<string>;

/**
 * Get your current Ethereum network
 *
 * @group LearnCard Methods
 */
export type GetCurrentNetwork = () => ethers.providers.Networkish;

/**
 * Change your Ethereum network
 *
 * @group LearnCard Methods
 */
export type ChangeNetwork = (network: ethers.providers.Networkish) => void;

/**
 * Add an infura project id to an existing wallet.
 * Really only useful for testing with the CLI right now...
 *
 * @group LearnCard Methods
 */
export type AddInfuraProjectId = (infuraProjectIdToAdd: string) => void;

/**
 * Returns a Verifiable Presentation (VP) from a QR code base-64 image data string containing a VP compressed by CBOR-LD.
 *
 * @group LearnCard Methods
 */
export type VpFromQrCode = (text: string) => Promise<VP>;

/**
 * Returns a QR-embeddable base-64 image data string from a Verifiable Presentation, compressed using CBOR-LD.
 *
 * @group LearnCard Methods
 */
export type VpToQrCode = (vp: VP) => Promise<string>;

/**
 * Sets up CHAPI
 *
 * @group LearnCard Methods
 */
export type InstallChapiHandler = () => Promise<void>;

/**
 * Activates CHAPI
 *
 * @group LearnCard Methods
 */
export type ActivateChapiHandler = (args: {
    mediatorOrigin?: string;
    get?: (event: CredentialRequestEvent) => Promise<HandlerResponse>;
    store?: (event: CredentialStoreEvent) => Promise<HandlerResponse>;
}) => Promise<void>;

/**
 * Receives a CHAPI Event
 *
 * @group LearnCard Methods
 */
export type ReceiveChapiEvent = () => Promise<CredentialRequestEvent | CredentialStoreEvent>;

/**
 * Stores a VP via CHAPI
 *
 * @group LearnCard Methods
 */
export type StorePresentationViaChapi = (presentation: VP) => Promise<Credential | undefined>;

/**
 * Stores a Credential via CHAPI using DIDAuth
 *
 * @group LearnCard Methods
 */
export type StoreCredentialViaChapiDidAuth = (
    credential: UnsignedVC
) => Promise<
    | { success: true }
    | { success: false; reason: 'did not auth' | 'auth failed verification' | 'did not store' }
>;

/**
 * @group LearnCard Methods
 */
export type AllLearnCardMethods = {
    did: Did;
    keypair: Keypair;
    newCredential: NewCredential;
    newPresentation: NewPresentation;
    issueCredential: IssueCredential;
    verifyCredential: VerifyCredential;
    issuePresentation: IssuePresentation;
    verifyPresentation: VerifyPresentation;
    getCredential: GetCredential;
    getCredentials: GetCredentials;
    getCredentialsList: GetCredentialsList;
    publishCredential: PublishCredential;
    addCredential: AddCredential;
    removeCredential: RemoveCredential;
    resolveDid: ResolveDid;
    readFromCeramic: ReadFromCeramic;
    resolveCredential: ResolveCredential;
    getTestVc: GetTestVc;
    getTestVp: GetTestVp;
    getEthereumAddress: GetEthereumAddress;
    getBalance: GetBalance;
    getBalanceForAddress: GetBalanceForAddress;
    transferTokens: TransferTokens;
    getGasPrice: GetGasPrice;
    getCurrentNetwork: GetCurrentNetwork;
    changeNetwork: ChangeNetwork;
    addInfuraProjectId: AddInfuraProjectId;
    vpFromQrCode: VpFromQrCode;
    vpToQrCode: VpToQrCode;
    installChapiHandler: InstallChapiHandler;
    activateChapiHandler: ActivateChapiHandler;
    receiveChapiEvent: ReceiveChapiEvent;
    storePresentationViaChapi: StorePresentationViaChapi;
    storeCredentialViaChapiDidAuth: StoreCredentialViaChapiDidAuth;
};
