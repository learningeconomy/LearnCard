import { runVerificationCli } from './cli';

// `lc verify` re-executes this file with `bun --conditions=development` so workspace packages
// (SDK, plugins, CLI) resolve to their checkout source instead of possibly stale dist builds.
runVerificationCli(process.argv.slice(2)).then(
    () => process.exit(process.exitCode ?? 0),
    (error: unknown) => {
        console.error(error instanceof Error ? (error.stack ?? error.message) : error);
        process.exit(1);
    }
);
