import { loadRuntimeSecrets } from './src/config/runtimeSecrets';

type LambdaApp = typeof import('./lambdaApp');
type OidcLambdaApp = typeof import('./oidcLambdaApp');
let application: Promise<LambdaApp> | undefined;
let oidcApplication: Promise<OidcLambdaApp> | undefined;

const getApplication = async (): Promise<LambdaApp> => {
    // A failed fetch is retried by loadRuntimeSecrets itself on the next invocation.
    await loadRuntimeSecrets();
    // Import once. The bundler caches a failed module evaluation (e.g. invalid config),
    // so re-importing could not recover; the error keeps surfacing until redeploy.
    application ??= import('./lambdaApp');
    return application;
};

export const trpcHandler = async (...args: Parameters<LambdaApp['trpcHandler']>) =>
    (await getApplication()).trpcHandler(...args);

export const openApiHandler = async (...args: Parameters<LambdaApp['openApiHandler']>) =>
    (await getApplication()).openApiHandler(...args);

export const swaggerUiHandler = async (...args: Parameters<LambdaApp['swaggerUiHandler']>) =>
    (await getApplication()).swaggerUiHandler(...args);

export const didWebHandler = async (...args: Parameters<LambdaApp['didWebHandler']>) =>
    (await getApplication()).didWebHandler(...args);

export const escrowHoldRemindersHandler = async (
    ...args: Parameters<LambdaApp['escrowHoldRemindersHandler']>
) => (await getApplication()).escrowHoldRemindersHandler(...args);

export const escrowBlobRewrapHandler = async (
    ...args: Parameters<LambdaApp['escrowBlobRewrapHandler']>
) => (await getApplication()).escrowBlobRewrapHandler(...args);

// Separate entry: the oidc function must not evaluate lambdaApp (see oidcLambdaApp.ts).
const getOidcApplication = async (): Promise<OidcLambdaApp> => {
    await loadRuntimeSecrets();
    // Same as getApplication: a failed module evaluation stays cached in the bundle,
    // so clearing this to retry would only rethrow the same error.
    oidcApplication ??= import('./oidcLambdaApp');
    return oidcApplication;
};

export const oidcHandler = async (...args: Parameters<OidcLambdaApp['oidcHandler']>) =>
    (await getOidcApplication()).oidcHandler(...args);
