export type CredentialSource = 'link' | 'jsonld' | 'platform';

export type CredentialCandidate = {
  source: CredentialSource;
  title?: string;
  url?: string;
  raw?: unknown;
  platform?: 'credly' | 'coursera' | 'khanacademy' | 'unknown';
  claimed?: boolean;
};

export type CredentialCategory =
  | 'Achievement'
  | 'ID'
  | 'Learning History'
  | 'Work History'
  | 'Social Badge'
  | 'Accomplishment'
  | 'Accommodation';

// VC-API exchange types
export type VcApiExchangeState = 'idle' | 'contacting' | 'offer' | 'saving' | 'success' | 'error';

export type VcApiOffer = {
  id?: string;
  title: string;
  description?: string;
};

export type StartVcApiExchangeMessage = {
  type: 'start-vcapi-exchange';
  url: string;
  tabId?: number;
};

export type GetVcApiExchangeStatusMessage = {
  type: 'get-vcapi-exchange-status';
  tabId?: number;
};

export type AcceptVcApiOfferMessage = {
  type: 'accept-vcapi-offer';
  selections: { index: number; category?: CredentialCategory }[];
  tabId?: number;
};

export type CancelVcApiExchangeMessage = {
  type: 'cancel-vcapi-exchange';
  tabId?: number;
};

export type CredentialDetectedMessage = {
  type: 'credential-detected';
  payload: CredentialCandidate;
};

export type CredentialsDetectedMessage = {
  type: 'credentials-detected';
  payload: CredentialCandidate[];
  tabId?: number;
};

export type GetDetectedMessage = {
  type: 'get-detected';
  tabId?: number;
};

export type SaveCredentialMessage = {
  type: 'save-credential';
  tabId?: number;
  category?: CredentialCategory;
};

export type BulkSaveSelection = {
  index: number;
  category?: CredentialCategory;
};

export type SaveCredentialsMessage = {
  type: 'save-credentials';
  tabId?: number;
  selections: BulkSaveSelection[];
  candidates?: CredentialCandidate[];
};

export type StartAuthMessage = {
  type: 'start-auth';
};

export type GetAuthStatusMessage = {
  type: 'get-auth-status';
};

export type LogoutMessage = {
  type: 'logout';
};

export type RequestScanMessage = {
  type: 'request-scan';
};

export type GetProfileMessage = {
  type: 'get-profile';
};

export type ExtensionMessage =
  | CredentialDetectedMessage
  | CredentialsDetectedMessage
  | GetDetectedMessage
  | SaveCredentialMessage
  | SaveCredentialsMessage
  | StartAuthMessage
  | GetAuthStatusMessage
  | LogoutMessage
  | RequestScanMessage
  | GetProfileMessage
  | StartVcApiExchangeMessage
  | GetVcApiExchangeStatusMessage
  | AcceptVcApiOfferMessage
  | CancelVcApiExchangeMessage;

// Typed response envelopes per message
export type OkResponse = { ok: true };
export type ErrorResponse = { ok: false; error: string };

export type CredentialDetectedResponse = OkResponse | ErrorResponse;
export type CredentialsDetectedResponse = OkResponse | ErrorResponse;
export type GetDetectedResponse = ({ ok: true; data: CredentialCandidate[] } | ErrorResponse);
export type SaveCredentialResponse = OkResponse | ErrorResponse;
export type SaveCredentialsResponse = ({ ok: true; savedCount: number } | ErrorResponse);
export type StartAuthResponse = ({ ok: true; data: { did: string | undefined } } | ErrorResponse);
export type GetAuthStatusResponse = ({ ok: true; data: { loggedIn: boolean; did: string | null } } | ErrorResponse);
export type LogoutResponse = OkResponse | ErrorResponse;
export type GetProfileResponse = ({ ok: true; profile?: { image?: string | null } } | ErrorResponse);
export type RequestScanResponse = OkResponse | ErrorResponse;
export type StartVcApiExchangeResponse = OkResponse | ErrorResponse;
export type GetVcApiExchangeStatusResponse = ({
  ok: true;
  data: { state: VcApiExchangeState; url?: string; offers?: unknown[]; error?: string | null };
} | ErrorResponse);
export type AcceptVcApiOfferResponse = ({ ok: true; savedCount: number } | ErrorResponse);
export type CancelVcApiExchangeResponse = OkResponse | ErrorResponse;
