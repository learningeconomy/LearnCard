import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Never echo a raw error, command, path, environment value or arbitrary event field.
const checks = new Map(
    Object.entries({
        initialization: 'CLI initialization',
        platform: 'Linux platform',
        'bun-version': 'repository Bun version',
        'node-version': 'repository Node version',
        flock: 'Linux flock utility',
        'docker-trust': 'trusted local Docker socket and configuration',
        'docker-daemon': 'Docker daemon availability and proxy configuration',
        'docker-compose': 'Docker Compose version',
        'chromium-installation': 'Playwright Chromium installation',
        'chromium-execution': 'Playwright Chromium execution',
        'disk-space': 'available disk space and host resources',
    })
);

export const preflightFailureMessage = log => {
    let label;
    for (const line of log.split('\n')) {
        try {
            const event = JSON.parse(line);
            if (event?.event === 'preflight-failure') label = checks.get(event.check);
        } catch {
            /* Non-JSON private diagnostics are never published. */
        }
    }
    return label
        ? `Verification preflight failed while checking ${label}. Catalog tests did not start. Raw diagnostics remain private.`
        : 'Verification preflight failed before a prerequisite could be identified. Catalog tests did not start. Raw diagnostics remain private.';
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    let log = '';
    try {
        log = readFileSync(process.argv[2], 'utf8');
    } catch {
        /* Fall back without leaking file errors. */
    }
    console.log(`::error title=Verification preflight::${preflightFailureMessage(log)}`);
}
