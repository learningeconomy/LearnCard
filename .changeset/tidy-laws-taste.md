---
"@learncard/types": patch
"@learncard/network-plugin": patch
"@learncard/network-brain-service": patch
---

Add Signing Authorities and Claim Links

Adds the following plugin Methods to the LearnCard Network:
-   registerSigningAuthority: (endpoint: string, name: string, did: string) => Promise<boolean>;
-   getRegisteredSigningAuthorities: (endpoint: string, name: string, did: string) => Promise<LCNSigningAuthorityForUserType[]>;
-   getRegisteredSigningAuthority: (endpoint: string, name: string) => Promise<LCNSigningAuthorityForUserType>;

-   generateClaimLink: (boostUri: string, claimLinkSA: LCNBoostClaimLinkSigningAuthorityType, challenge?: string) => Promise<{ boostUri: string, challenge: string}>;
-   claimBoostWithLink: (boostUri: string, challenge: string) => Promise<string>;
