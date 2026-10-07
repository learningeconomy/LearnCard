import { loadRuntimeSecrets, type LoadRuntimeSecretsOptions } from './runtimeSecrets';
import { resolveStageDefaults, type StageEnv, type StageMap } from './stageConfig';

export interface BootstrapLambdaOptions<App> extends LoadRuntimeSecretsOptions {
    base?: StageEnv;
    stages?: StageMap;
    stage?: string;
    importApp: () => Promise<App>;
}

const isNonEmpty = (value: string | undefined): value is string =>
    typeof value === 'string' && value !== '';

/**
 * Build a lazy application loader for an AWS Lambda cold start.
 *
 * Precedence is always real env > runtime secrets bundle > stage > base. Explicit real-env
 * values recorded at construction are never overwritten; everything else is stage-filled,
 * then the bundle is layered on top, then the imported app evaluates.
 *
 * The whole sequence is memoized in a single in-flight promise so concurrent callers share
 * one bootstrap. Clearing stage-added keys to let the bundle win happens exactly once, which
 * avoids a race where a second caller deletes bundle values the first already wrote. The
 * memo resets only when the secrets fetch fails (Lambda retries the cold start); a failed
 * app import stays memoized, because the module bundler caches a failed evaluation and
 * re-importing cannot recover.
 */
export const bootstrapLambda = <App>(
    options: BootstrapLambdaOptions<App>
): (() => Promise<App>) => {
    const stageDefaults = resolveStageDefaults(options);

    // Keys the real environment set explicitly, before stage defaults fill the gaps. These
    // must survive secret loading unchanged (precedence: real env > bundle > stage > base).
    const explicitKeys = new Set(
        Object.keys(stageDefaults).filter(key => isNonEmpty(process.env[key]))
    );

    for (const [key, value] of Object.entries(stageDefaults)) {
        if (!explicitKeys.has(key)) process.env[key] = value;
    }

    let bootstrap: Promise<App> | undefined;

    return (): Promise<App> => {
        if (!bootstrap) {
            bootstrap = (async () => {
                // Clear stage-added values so the bundle can override them; explicit real-env
                // values stay untouched. Done once, inside the memoized promise, so concurrent
                // callers never race to delete values the bundle has already written.
                for (const key of Object.keys(stageDefaults)) {
                    if (!explicitKeys.has(key)) delete process.env[key];
                }

                try {
                    await loadRuntimeSecrets({ secretIdEnv: options.secretIdEnv });
                } catch (error) {
                    // A failed secrets fetch is recoverable on the next invocation. Reset the
                    // memo so the next call retries the whole bootstrap from the top.
                    bootstrap = undefined;
                    throw error;
                }

                // Re-apply stage defaults beneath whatever the bundle provided.
                for (const [key, value] of Object.entries(stageDefaults)) {
                    if (!isNonEmpty(process.env[key])) process.env[key] = value;
                }

                // Importing after this point is memoized even on failure: the bundler caches a
                // failed module evaluation, so re-importing could never recover anyway.
                return options.importApp();
            })();
        }
        return bootstrap;
    };
};
