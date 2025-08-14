export type CredentialSource = 'link' | 'jsonld' | 'platform';

export type CredentialCandidate = {
  source: CredentialSource;
  title?: string;
  url?: string;
  raw?: unknown;
  platform?: 'credly' | 'coursera' | 'unknown';
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
  | StartAuthMessage
  | GetAuthStatusMessage
  | LogoutMessage
  | RequestScanMessage;
