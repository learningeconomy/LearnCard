/* tslint:disable */
/* eslint-disable */
export function getVersion(): string;
export function completeIssuePresentation(presentation: string, preparation: string, signature: string): Promise<any>;
export function verifyPresentation(vp: string, proof_options: string, context_map: string): Promise<any>;
export function DIDAuth(holder: string, linked_data_proof_options: string, key: string, context_map: string): Promise<any>;
export function verifyInvocation(invocation: string, delegation: string): Promise<any>;
export function contextLoader(url: string): Promise<any>;
export function JWKFromTezos(tz: string): Promise<any>;
export function delegateCapability(capability: string, linked_data_proof_options: string, parents: string, key: string): Promise<any>;
export function prepareDelegateCapability(capability: string, linked_data_proof_options: string, parents: string, public_key: string): Promise<any>;
export function completeDelegateCapability(capability: string, preparation: string, signature: string): Promise<any>;
export function verifyDelegation(delegation: string): Promise<any>;
export function invokeCapability(invocation: string, target_id: string, linked_data_proof_options: string, key: string): Promise<any>;
export function prepareInvokeCapability(invocation: string, target_id: string, linked_data_proof_options: string, public_key: string): Promise<any>;
export function completeInvokeCapability(invocation: string, preparation: string, signature: string): Promise<any>;
export function verifyInvocationSignature(invocation: string): Promise<any>;
export function clearCache(): Promise<any>;
export function didResolver(did: string, input_metadata: string): Promise<any>;
export function resolveDID(did: string, input_metadata: string): Promise<any>;
export function keyToDID(method_pattern: string, jwk: string): string;
export function keyToVerificationMethod(method_pattern: string, jwk: string): Promise<any>;
export function didToVerificationMethod(did: string): Promise<any>;
export function issueCredential(credential: string, proof_options: string, key: string, context_map: string): Promise<any>;
export function prepareIssueCredential(credential: string, linked_data_proof_options: string, public_key: string): Promise<any>;
export function completeIssueCredential(credential: string, preparation: string, signature: string): Promise<any>;
export function verifyCredential(vc: string, proof_options: string, context_map: string): Promise<any>;
export function issuePresentation(presentation: string, proof_options: string, key: string, context_map: string): Promise<any>;
export function prepareIssuePresentation(presentation: string, linked_data_proof_options: string, public_key: string): Promise<any>;
export function generateEd25519Key(): string;
export function generateEd25519KeyFromBytes(bytes: Uint8Array): string;
export function generateSecp256k1Key(): string;
export function generateSecp256k1KeyFromBytes(bytes: Uint8Array): string;
export function createJwe(cleartext: string, recipients: string[]): Promise<any>;
export function decryptJwe(jwe: string, jwks: string[]): Promise<any>;
export function createDagJwe(cleartext: any, recipients: string[]): Promise<any>;
export function decryptDagJwe(jwe: string, jwks: string[]): Promise<any>;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly didkit_error_code: () => number;
  readonly didkit_error_message: () => number;
  readonly DIDAuth: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly JWKFromTezos: (a: number, b: number) => number;
  readonly clearCache: () => number;
  readonly completeDelegateCapability: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly completeInvokeCapability: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly completeIssueCredential: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly completeIssuePresentation: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly contextLoader: (a: number, b: number) => number;
  readonly createDagJwe: (a: number, b: number, c: number) => number;
  readonly createJwe: (a: number, b: number, c: number, d: number) => number;
  readonly decryptDagJwe: (a: number, b: number, c: number, d: number) => number;
  readonly decryptJwe: (a: number, b: number, c: number, d: number) => number;
  readonly delegateCapability: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly didResolver: (a: number, b: number, c: number, d: number) => number;
  readonly didToVerificationMethod: (a: number, b: number) => number;
  readonly generateEd25519Key: (a: number) => void;
  readonly generateEd25519KeyFromBytes: (a: number, b: number, c: number) => void;
  readonly generateSecp256k1Key: (a: number) => void;
  readonly generateSecp256k1KeyFromBytes: (a: number, b: number, c: number) => void;
  readonly getVersion: (a: number) => void;
  readonly invokeCapability: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly issueCredential: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly issuePresentation: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly keyToDID: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly keyToVerificationMethod: (a: number, b: number, c: number, d: number) => number;
  readonly prepareDelegateCapability: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly prepareInvokeCapability: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly prepareIssueCredential: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly prepareIssuePresentation: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly resolveDID: (a: number, b: number, c: number, d: number) => number;
  readonly verifyCredential: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly verifyDelegation: (a: number, b: number) => number;
  readonly verifyInvocation: (a: number, b: number, c: number, d: number) => number;
  readonly verifyInvocationSignature: (a: number, b: number) => number;
  readonly verifyPresentation: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly __wbindgen_export_0: (a: number, b: number) => number;
  readonly __wbindgen_export_1: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_2: (a: number) => void;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export_4: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_5: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_6: (a: number, b: number) => void;
  readonly __wbindgen_export_7: (a: number, b: number, c: number, d: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
