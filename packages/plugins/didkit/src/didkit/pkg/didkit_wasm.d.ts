/* tslint:disable */
/* eslint-disable */
/**
* @returns {string}
*/
export function getVersion(): string;
/**
* @param {string} did
* @param {string} input_metadata
* @returns {Promise<any>}
*/
export function didResolver(did: string, input_metadata: string): Promise<any>;
/**
* @param {string} did
* @param {string} input_metadata
* @returns {Promise<any>}
*/
export function resolveDID(did: string, input_metadata: string): Promise<any>;
/**
* @returns {string}
*/
export function generateEd25519Key(): string;
/**
* @param {Uint8Array} bytes
* @returns {string}
*/
export function generateEd25519KeyFromBytes(bytes: Uint8Array): string;
/**
* @returns {string}
*/
export function generateSecp256k1Key(): string;
/**
* @param {Uint8Array} bytes
* @returns {string}
*/
export function generateSecp256k1KeyFromBytes(bytes: Uint8Array): string;
/**
* @param {string} method_pattern
* @param {string} jwk
* @returns {string}
*/
export function keyToDID(method_pattern: string, jwk: string): string;
/**
* @param {string} method_pattern
* @param {string} jwk
* @returns {Promise<any>}
*/
export function keyToVerificationMethod(method_pattern: string, jwk: string): Promise<any>;
/**
* @param {string} did
* @returns {Promise<any>}
*/
export function didToVerificationMethod(did: string): Promise<any>;
/**
* @param {string} credential
* @param {string} proof_options
* @param {string} key
* @returns {Promise<any>}
*/
export function issueCredential(credential: string, proof_options: string, key: string): Promise<any>;
/**
* @param {string} credential
* @param {string} linked_data_proof_options
* @param {string} public_key
* @returns {Promise<any>}
*/
export function prepareIssueCredential(credential: string, linked_data_proof_options: string, public_key: string): Promise<any>;
/**
* @param {string} credential
* @param {string} preparation
* @param {string} signature
* @returns {Promise<any>}
*/
export function completeIssueCredential(credential: string, preparation: string, signature: string): Promise<any>;
/**
* @param {string} vc
* @param {string} proof_options
* @returns {Promise<any>}
*/
export function verifyCredential(vc: string, proof_options: string): Promise<any>;
/**
* @param {string} presentation
* @param {string} proof_options
* @param {string} key
* @returns {Promise<any>}
*/
export function issuePresentation(presentation: string, proof_options: string, key: string): Promise<any>;
/**
* @param {string} presentation
* @param {string} linked_data_proof_options
* @param {string} public_key
* @returns {Promise<any>}
*/
export function prepareIssuePresentation(presentation: string, linked_data_proof_options: string, public_key: string): Promise<any>;
/**
* @param {string} presentation
* @param {string} preparation
* @param {string} signature
* @returns {Promise<any>}
*/
export function completeIssuePresentation(presentation: string, preparation: string, signature: string): Promise<any>;
/**
* @param {string} vp
* @param {string} proof_options
* @returns {Promise<any>}
*/
export function verifyPresentation(vp: string, proof_options: string): Promise<any>;
/**
* @param {string} holder
* @param {string} linked_data_proof_options
* @param {string} key
* @returns {Promise<any>}
*/
export function DIDAuth(holder: string, linked_data_proof_options: string, key: string): Promise<any>;
/**
* @param {string} tz
* @returns {Promise<any>}
*/
export function JWKFromTezos(tz: string): Promise<any>;
/**
* @param {string} capability
* @param {string} linked_data_proof_options
* @param {string} parents
* @param {string} key
* @returns {Promise<any>}
*/
export function delegateCapability(capability: string, linked_data_proof_options: string, parents: string, key: string): Promise<any>;
/**
* @param {string} capability
* @param {string} linked_data_proof_options
* @param {string} parents
* @param {string} public_key
* @returns {Promise<any>}
*/
export function prepareDelegateCapability(capability: string, linked_data_proof_options: string, parents: string, public_key: string): Promise<any>;
/**
* @param {string} capability
* @param {string} preparation
* @param {string} signature
* @returns {Promise<any>}
*/
export function completeDelegateCapability(capability: string, preparation: string, signature: string): Promise<any>;
/**
* @param {string} delegation
* @returns {Promise<any>}
*/
export function verifyDelegation(delegation: string): Promise<any>;
/**
* @param {string} invocation
* @param {string} target_id
* @param {string} linked_data_proof_options
* @param {string} key
* @returns {Promise<any>}
*/
export function invokeCapability(invocation: string, target_id: string, linked_data_proof_options: string, key: string): Promise<any>;
/**
* @param {string} invocation
* @param {string} target_id
* @param {string} linked_data_proof_options
* @param {string} public_key
* @returns {Promise<any>}
*/
export function prepareInvokeCapability(invocation: string, target_id: string, linked_data_proof_options: string, public_key: string): Promise<any>;
/**
* @param {string} invocation
* @param {string} preparation
* @param {string} signature
* @returns {Promise<any>}
*/
export function completeInvokeCapability(invocation: string, preparation: string, signature: string): Promise<any>;
/**
* @param {string} invocation
* @returns {Promise<any>}
*/
export function verifyInvocationSignature(invocation: string): Promise<any>;
/**
* @param {string} invocation
* @param {string} delegation
* @returns {Promise<any>}
*/
export function verifyInvocation(invocation: string, delegation: string): Promise<any>;
/**
* @param {string} url
* @returns {Promise<any>}
*/
export function contextLoader(url: string): Promise<any>;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly getVersion: (a: number) => void;
  readonly didResolver: (a: number, b: number, c: number, d: number) => number;
  readonly resolveDID: (a: number, b: number, c: number, d: number) => number;
  readonly generateEd25519Key: (a: number) => void;
  readonly generateEd25519KeyFromBytes: (a: number, b: number, c: number) => void;
  readonly generateSecp256k1Key: (a: number) => void;
  readonly generateSecp256k1KeyFromBytes: (a: number, b: number, c: number) => void;
  readonly keyToDID: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly keyToVerificationMethod: (a: number, b: number, c: number, d: number) => number;
  readonly didToVerificationMethod: (a: number, b: number) => number;
  readonly issueCredential: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly prepareIssueCredential: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly completeIssueCredential: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly verifyCredential: (a: number, b: number, c: number, d: number) => number;
  readonly issuePresentation: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly prepareIssuePresentation: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly completeIssuePresentation: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly verifyPresentation: (a: number, b: number, c: number, d: number) => number;
  readonly DIDAuth: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly JWKFromTezos: (a: number, b: number) => number;
  readonly delegateCapability: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly prepareDelegateCapability: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly completeDelegateCapability: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly verifyDelegation: (a: number, b: number) => number;
  readonly invokeCapability: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly prepareInvokeCapability: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly completeInvokeCapability: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly verifyInvocationSignature: (a: number, b: number) => number;
  readonly verifyInvocation: (a: number, b: number, c: number, d: number) => number;
  readonly contextLoader: (a: number, b: number) => number;
  readonly didkit_error_message: () => number;
  readonly didkit_error_code: () => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h7955a8bde413354d: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly wasm_bindgen__convert__closures__invoke2_mut__h787c66a4f6d2c392: (a: number, b: number, c: number, d: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
