import { readFileSync } from 'node:fs';

const version = process.env.RECOVERY_VERSION;
if (version) {
    if (process.env.TARGET_ENVIRONMENT !== 'production' || process.env.DEPLOY_FRONTEND !== 'true') {
        throw new Error('CapGo recovery requires target production and Deploy Frontend selected.');
    }

    const { version: packageVersion } = JSON.parse(
        readFileSync(new URL('../apps/learn-card-app/package.json', import.meta.url), 'utf8')
    );
    // A prerelease of the current package avoids reserving the next Changesets version.
    const match = /^(\d+\.\d+\.\d+)-recovery\.([1-9]\d*)$/.exec(version);
    if (!match || match[0] !== version || match[1] !== packageVersion) {
        throw new Error(
            `Use ${packageVersion}-recovery.N with an unused positive integer N. ` +
                'Do not reserve a future release version. Check native/channel update rules before deploying.'
        );
    }
}
