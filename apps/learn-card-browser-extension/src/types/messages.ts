export type CredentialSource = 'link' | 'jsonld' | 'platform';

export type CredentialCandidate = {
  source: CredentialSource;
  title?: string;
  url?: string;
  raw?: unknown;
  platform?: 'credly' | 'coursera' | 'unknown';
  claimed?: boolean;
};

export type CredentialCategory =
  | 'Achievement'
  | 'Skill'
  | 'ID'
  | 'Learning History'
  | 'Work History'
  | 'Social Badge'
  | 'Membership'
  | 'Course'
  | 'Accomplishment'
  | 'Accommodation';

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

export type ExtensionMessage =
  | CredentialDetectedMessage
  | CredentialsDetectedMessage
  | GetDetectedMessage
  | SaveCredentialMessage
  | SaveCredentialsMessage
  | StartAuthMessage
  | GetAuthStatusMessage
  | LogoutMessage
  | RequestScanMessage;
