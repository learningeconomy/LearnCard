const { setTimeout: sleep } = require('node:timers/promises');

// All serverless-esbuild bundles in this process share one queue. Keep compilation
// parallel, but don't burst release creation/finalization and uploads at Sentry.
let pending = Promise.resolve();

/**
 * Retry Sentry's end-of-build API work on HTTP 429 only. CLI 2.58.6 retries 5xx
 * responses, but omits 429 from RETRY_STATUS_CODES:
 * https://github.com/getsentry/sentry-cli/blob/2.58.6/src/api/mod.rs
 *
 * The CLI error doesn't expose Retry-After, so use bounded exponential backoff
 * with jitter. Persistent rate limits and all other errors still fail the build.
 */
const withSentryRateLimitRetry = (
    plugin,
    { wait = sleep, random = Math.random, warn = console.warn } = {}
) => ({
    ...plugin,
    async setup(build) {
        const callbacks = [];
        await plugin.setup({ ...build, onEnd: callback => callbacks.push(callback) });
        if (!callbacks.length) return;

        build.onEnd(result => {
            if (result.errors.length) return;
            const work = pending.then(async () => {
                const diagnostics = { errors: [], warnings: [] };
                for (const callback of callbacks) {
                    for (let retry = 0; ; retry++) {
                        try {
                            const output = await callback(result);
                            diagnostics.errors.push(...(output?.errors ?? []));
                            diagnostics.warnings.push(...(output?.warnings ?? []));
                            break;
                        } catch (error) {
                            if (
                                retry === 3 ||
                                !/sentry reported an error:[^\n]*\(http status: 429\)/.test(
                                    error?.message ?? ''
                                )
                            ) {
                                throw error;
                            }
                            const delay = 5_000 * 2 ** retry + Math.floor(random() * 1_000);
                            warn(
                                `[sentry] Rate limited (HTTP 429); retry ${retry + 1}/3 in ${delay}ms`
                            );
                            await wait(delay);
                        }
                    }
                }
                return diagnostics;
            });
            // A failed build must not poison later bundles or leave queued work
            // unobserved when esbuild reports the original rejection.
            pending = work.catch(() => {});
            return work;
        });
    },
});

module.exports = { withSentryRateLimitRetry };
