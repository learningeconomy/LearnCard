import type {
  ExtensionMessage,
  // messages
  GetDetectedMessage,
  SaveCredentialMessage,
  SaveCredentialsMessage,
  StartAuthMessage,
  GetAuthStatusMessage,
  LogoutMessage,
  RequestScanMessage,
  GetProfileMessage,
  StartVcApiExchangeMessage,
  GetVcApiExchangeStatusMessage,
  AcceptVcApiOfferMessage,
  CancelVcApiExchangeMessage,
  // responses
  GetDetectedResponse,
  SaveCredentialResponse,
  SaveCredentialsResponse,
  StartAuthResponse,
  GetAuthStatusResponse,
  LogoutResponse,
  RequestScanResponse,
  GetProfileResponse,
  StartVcApiExchangeResponse,
  GetVcApiExchangeStatusResponse,
  AcceptVcApiOfferResponse,
  CancelVcApiExchangeResponse,
  CredentialsDetectedMessage,
  CredentialDetectedMessage,
  CredentialsDetectedResponse,
  CredentialDetectedResponse,
} from '../types/messages';

// Promise wrapper with runtime.lastError safety
const promisifyRuntimeSendMessage = <T = unknown>(msg: ExtensionMessage): Promise<T> =>
  new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(msg as any, (resp: T) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message } as unknown as T);
          return;
        }
        resolve(resp);
      });
    } catch (e) {
      resolve({ ok: false, error: (e as Error).message } as unknown as T);
    }
  });

const promisifyTabsSendMessage = <T = unknown>(tabId: number, msg: ExtensionMessage): Promise<T> =>
  new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, msg as any, (resp: T) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message } as unknown as T);
          return;
        }
        resolve(resp);
      });
    } catch (e) {
      resolve({ ok: false, error: (e as Error).message } as unknown as T);
    }
  });

// Overloads for runtime messaging
export function sendMessage(msg: GetDetectedMessage): Promise<GetDetectedResponse>;
export function sendMessage(msg: SaveCredentialMessage): Promise<SaveCredentialResponse>;
export function sendMessage(msg: SaveCredentialsMessage): Promise<SaveCredentialsResponse>;
export function sendMessage(msg: StartAuthMessage): Promise<StartAuthResponse>;
export function sendMessage(msg: GetAuthStatusMessage): Promise<GetAuthStatusResponse>;
export function sendMessage(msg: LogoutMessage): Promise<LogoutResponse>;
export function sendMessage(msg: GetProfileMessage): Promise<GetProfileResponse>;
export function sendMessage(msg: StartVcApiExchangeMessage): Promise<StartVcApiExchangeResponse>;
export function sendMessage(msg: GetVcApiExchangeStatusMessage): Promise<GetVcApiExchangeStatusResponse>;
export function sendMessage(msg: AcceptVcApiOfferMessage): Promise<AcceptVcApiOfferResponse>;
export function sendMessage(msg: CancelVcApiExchangeMessage): Promise<CancelVcApiExchangeResponse>;
export function sendMessage(msg: CredentialsDetectedMessage): Promise<CredentialsDetectedResponse>;
export function sendMessage(msg: CredentialDetectedMessage): Promise<CredentialDetectedResponse>;
// Fallback signature
export function sendMessage(msg: ExtensionMessage): Promise<unknown>;
export function sendMessage(msg: ExtensionMessage): Promise<unknown> {
  return promisifyRuntimeSendMessage(msg);
}

// Overloads for tab messaging (content script)
export function sendTabMessage(tabId: number, msg: RequestScanMessage): Promise<RequestScanResponse>;
export function sendTabMessage(tabId: number, msg: ExtensionMessage): Promise<unknown>;
export function sendTabMessage(tabId: number, msg: ExtensionMessage): Promise<unknown> {
  return promisifyTabsSendMessage(tabId, msg);
}
