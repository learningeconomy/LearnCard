import { applyLcaApiStageConfig } from './src/config/stageConfig';

type OidcApp = typeof import('./oidcLambdaApp');

let application: Promise<OidcApp> | undefined;

export const handler = async (...args: Parameters<OidcApp['oidcHandler']>) => {
    if (!application) {
        applyLcaApiStageConfig(
            process.env.AWS_LAMBDA_FUNCTION_NAME
                ? process.env.LAMBDA_STAGE
                : process.env.CONFIG_STAGE
        );
        // This role cannot read the runtime bundle. Cache imports, including failures.
        application = import('./oidcLambdaApp');
    }
    return (await application).oidcHandler(...args);
};
