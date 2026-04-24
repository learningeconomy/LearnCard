/* Shared types for LearnCard Embed SDK */

export type CredentialConfig = {
  name: string;
  [key: string]: unknown;
};

export type ClaimSuccessDetails = {
  credentialId: string;
  consentGiven: boolean;
  handoffUrl?: string;
};

export type EmailSubmitResult = { ok: true } | { ok: false; error: string };

export type OtpVerifyResult = { ok: true } | { ok: false; error: string };

export type BrandingTokens = {
  primaryColor?: string; // replaces theme.primaryColor
  accentColor?: string;
  logoUrl?: string; // Wallet brand logo URL rendered in the "Secured by" footer. Defaults to LearnCard.
  partnerLogoUrl?: string; // Partner brand logo URL (optional)
  walletUrl?: string; // override wallet URL to open on success
  /**
   * Display name for the destination wallet, shown in the claim modal copy
   * (e.g. "added to your {walletName} wallet", "View My {walletName}").
   * Defaults to "LearnCard". Set this to your tenant's name for a tenant-
   * branded claim experience.
   */
  walletName?: string;
};

export type InitOptions = {
  partnerName?: string;
  issuerName?: string;    // Display name of the credential issuer (profile name)
  issuerLogoUrl?: string; // Logo or avatar URL for the issuer
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
  // Optional configuration for Hosted Wallet API calls used by the default flow
  // If not provided, SDK falls back to a no-op stub flow, unless overridden via callbacks above.
  publishableKey?: string;
  apiBaseUrl?: string; // Defaults to "https://network.learncard.com/api" if not provided
};

// Message payload from iframe to parent
export type IframeCompleteMessage = {
  __lcEmbed: true;
  type: 'lc-embed:complete';
  nonce: string;
  payload: ClaimSuccessDetails;
};

export type KnownMessages = IframeCompleteMessage;
