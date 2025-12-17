export const ANONYMOUS_CONTEXT = {
    kind: 'user',
    key: 'anonymous',
};

export const LAUNCH_DARKLY_CONFIG = {
    clientSideID: IS_PRODUCTION ? '63dabf3982caed12cac3e55c' : '63dabf3982caed12cac3e55b',
    context: ANONYMOUS_CONTEXT,
};