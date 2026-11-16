export * from './types';
export * from './plugin';
export * from './helpers';
export {
    clearDidWebDocumentFetchCache,
    didWebToDocumentUrl,
    getDidWebDocumentFetchCacheStats,
    installDidWebDocumentFetchCache,
    installWalletDidWebDocumentFetchCache,
    invalidateDidWebDocument,
    isDidWebDocumentUrl,
    DEFAULT_DID_WEB_DOCUMENT_TTL_MS,
    WALLET_DID_WEB_DOCUMENT_TTL_MS,
    DEFAULT_DID_WEB_DOCUMENT_CACHE_MAX_ENTRIES,
} from './didWebDocumentCache';
