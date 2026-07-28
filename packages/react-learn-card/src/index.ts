/// <reference path="./declaration.d.ts" />

export * from './components/index';

// Export shared hooks
export * from './helpers/useHorizontalPages';
export * from './helpers/useOnMomentumScrollEnd';
export * from './helpers/useScrollBorders';

// Export DID display helpers
export * from './helpers/did-display.helpers';

// Export credential lifecycle (revoked/suspended) treatment helper
export * from './helpers/lifecycle.helpers';

// Export SD-JWT-VC hooks and helpers
export * from './hooks/useCredentialFormat';
export * from './hooks/useParsedSdJwtVc';
export * from './helpers/credentialFormat.helpers';

// Optional i18n adapter (English by default; consumers may inject a resolver)
export * from './i18n';
