import { Console } from 'node:console';
import { runVerificationCli } from './cli';

const args = process.argv.slice(2);
const separator = args.indexOf('--');
const json = args.slice(0, separator < 0 ? args.length : separator).includes('--json');
// Keep dependency diagnostics and human progress off the machine-readable stdout stream.
if (json) Object.assign(console, new Console({ stdout: process.stderr, stderr: process.stderr }));

// `lc verify` re-executes this file with `bun --conditions=development` so workspace packages
// (SDK, plugins, CLI) resolve to their checkout source instead of possibly stale dist builds.
runVerificationCli(args).then(
    () => process.exit(process.exitCode ?? 0),
    (error: unknown) => {
        console.error(error instanceof Error ? (error.stack ?? error.message) : error);
        if (json)
            process.stdout.write(
                `${JSON.stringify({
                    event: 'error',
                    status: 'failed',
                    message: error instanceof Error ? error.message : String(error),
                })}\n`
            );
        process.exit(1);
    }
);
