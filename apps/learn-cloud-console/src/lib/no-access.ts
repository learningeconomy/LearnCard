import type { InstallIntent } from '@learncard/types';

// "No access" means an Integration whose approved plan requests zero scopes
// (e.g. the DCC trust-list registry adapter). Wallets, apps and bundles also
// carry empty scope lists, so the listing kind must be INTEGRATION, and an
// unknown/missing plan is never treated as "no access".
export const isNoAccessIntegration = (intent: InstallIntent | null | undefined): boolean =>
    !!intent?.plan &&
    intent.proposal.source.listingKind === 'INTEGRATION' &&
    Array.isArray(intent.plan.scopesRequested) &&
    intent.plan.scopesRequested.length === 0;
