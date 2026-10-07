import { loadRuntimeSecrets } from './src/config/runtimeSecrets';

type LambdaApp = typeof import('./lambdaApp');
let application: Promise<LambdaApp> | undefined;

const getApplication = (): Promise<LambdaApp> => {
    application ??= loadRuntimeSecrets()
        .then(() => import('./lambdaApp'))
        .catch(error => {
            application = undefined;
            throw error;
        });
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
