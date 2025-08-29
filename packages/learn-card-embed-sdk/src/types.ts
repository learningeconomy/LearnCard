/* Shared types for LearnCard Embed SDK */

export type CredentialConfig = {
  name: string;
  [key: string]: unknown;
};

export type ClaimSuccessDetails = {
  credentialId: string;
  consentGiven: boolean;
};

export type EmailSubmitResult = { ok: true } | { ok: false; error: string };

export type OtpVerifyResult = { ok: true } | { ok: false; error: string };

export type BrandingTokens = {
  primaryColor?: string; // replaces theme.primaryColor
  accentColor?: string;
  logoUrl?: string; // LearnCard brand logo URL (optional)
  partnerLogoUrl?: string; // Partner brand logo URL (optional)
  walletUrl?: string; // override wallet URL to open on success
};

export type InitOptions = {
  partnerId: string;
  partnerName?: string;
  target: string | HTMLElement;
  credential: CredentialConfig;
  onSuccess?: (details: ClaimSuccessDetails) => void;
  requestBackgroundIssuance?: boolean;
  // Back-compat: support previous theme.primaryColor
  theme?: {
    primaryColor?: string;
  };
  // New: branding tokens for simple configuration
  branding?: BrandingTokens;
  onEmailSubmit?: (email: string) => Promise<EmailSubmitResult> | EmailSubmitResult;
  onOtpVerify?: (email: string, code: string) => Promise<OtpVerifyResult> | OtpVerifyResult;
};

// Message payload from iframe to parent
export type IframeCompleteMessage = {
  __lcEmbed: true;
  type: 'lc-embed:complete';
  nonce: string;
  payload: ClaimSuccessDetails;
};

export type KnownMessages = IframeCompleteMessage;
