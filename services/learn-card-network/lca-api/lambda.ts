import { loadRuntimeSecrets } from './src/config/runtimeSecrets';

type LambdaApp = typeof import('./lambdaApp');
let application: Promise<LambdaApp> | undefined;

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

export const oidcHandler = async (...args: Parameters<LambdaApp['oidcHandler']>) =>
    (await getApplication()).oidcHandler(...args);
