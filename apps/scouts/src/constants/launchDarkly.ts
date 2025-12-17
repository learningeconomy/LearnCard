export const ANONYMOUS_CONTEXT = {
    kind: 'user',
    key: 'anonymous',
};

export const LAUNCH_DARKLY_CONFIG = {
    clientSideID: IS_PRODUCTION ? '64b59e8227d2d212ef8e8968' : '64b5aeeb41628613abcf2af0',
    context: ANONYMOUS_CONTEXT,
};